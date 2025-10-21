import { Request, Response } from 'express';
import pool from '../config/db';
import redisClient from '../config/cache';

export const createBooking = async (req: Request, res: Response) => {
  const { showId, seatIds } = req.body;
  const userId = req.user?.userId;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const lockKey = `show:${showId}:seats`;
    const lockAcquired = await redisClient.set(lockKey, 'locked', {
      NX: true,
      EX: 30,
    });

    if (!lockAcquired) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Another booking in progress. Please try again.' });
    }

    const bookedSeats = await client.query(
      `SELECT seat_id FROM booking_seats WHERE show_id = $1 AND seat_id = ANY($2) AND status = 'booked'`,
      [showId, seatIds]
    );

    if (bookedSeats.rows.length > 0) {
      await client.query('ROLLBACK');
      await redisClient.del(lockKey);
      return res.status(400).json({ error: 'Some seats are already booked' });
    }

    const showResult = await client.query('SELECT price, available_seats FROM shows WHERE id = $1', [showId]);
    
    if (showResult.rows.length === 0) {
      await client.query('ROLLBACK');
      await redisClient.del(lockKey);
      return res.status(404).json({ error: 'Show not found' });
    }

    const show = showResult.rows[0];
    
    if (show.available_seats < seatIds.length) {
      await client.query('ROLLBACK');
      await redisClient.del(lockKey);
      return res.status(400).json({ error: 'Not enough seats available' });
    }

    const totalAmount = show.price * seatIds.length;

    const bookingResult = await client.query(
      `INSERT INTO bookings (user_id, show_id, total_amount, status) 
       VALUES ($1, $2, $3, 'pending') RETURNING *`,
      [userId, showId, totalAmount]
    );

    const bookingId = bookingResult.rows[0].id;

    for (const seatId of seatIds) {
      await client.query(
        `INSERT INTO booking_seats (booking_id, seat_id, show_id, status) 
         VALUES ($1, $2, $3, 'booked')`,
        [bookingId, seatId, showId]
      );
    }

    await client.query(
      'UPDATE shows SET available_seats = available_seats - $1 WHERE id = $2',
      [seatIds.length, showId]
    );

    await client.query('COMMIT');
    await redisClient.del(lockKey);

    const expiryMinutes = parseInt(process.env.BOOKING_EXPIRY_MINUTES || '15');
    await redisClient.setEx(`booking:${bookingId}`, expiryMinutes * 60, 'pending');

    res.status(201).json({
      message: 'Booking created successfully',
      booking: bookingResult.rows[0],
      expiresIn: expiryMinutes * 60,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Booking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

export const confirmBooking = async (req: Request, res: Response) => {
  const { bookingId } = req.params;
  const { paymentId } = req.body;
  const userId = req.user?.userId;

  try {
    const result = await pool.query(
      `UPDATE bookings SET status = 'confirmed', payment_id = $1 
       WHERE id = $2 AND user_id = $3 AND status = 'pending' 
       RETURNING *`,
      [paymentId, bookingId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found or already confirmed' });
    }

    await redisClient.del(`booking:${bookingId}`);

    res.json({
      message: 'Booking confirmed successfully',
      booking: result.rows[0],
    });
  } catch (error) {
    console.error('Confirm booking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserBookings = async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  try {
    const result = await pool.query(
      `SELECT 
        b.id, b.booking_time, b.total_amount, b.status,
        m.title as movie_title, m.poster_url,
        s.show_date, s.show_time,
        t.name as theater_name, t.address,
        sc.name as screen_name,
        ARRAY_AGG(st.seat_number) as seats
      FROM bookings b
      JOIN shows s ON b.show_id = s.id
      JOIN movies m ON s.movie_id = m.id
      JOIN screens sc ON s.screen_id = sc.id
      JOIN theaters t ON sc.theater_id = t.id
      JOIN booking_seats bs ON b.id = bs.booking_id
      JOIN seats st ON bs.seat_id = st.id
      WHERE b.user_id = $1
      GROUP BY b.id, m.title, m.poster_url, s.show_date, s.show_time, 
               t.name, t.address, sc.name
      ORDER BY b.booking_time DESC`,
      [userId]
    );

    res.json({ bookings: result.rows });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const cancelBooking = async (req: Request, res: Response) => {
  const { bookingId } = req.params;
  const userId = req.user?.userId;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const bookingResult = await client.query(
      'SELECT * FROM bookings WHERE id = $1 AND user_id = $2',
      [bookingId, userId]
    );

    if (bookingResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookingResult.rows[0];

    if (booking.status === 'cancelled') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Booking already cancelled' });
    }

    await client.query(
      'UPDATE bookings SET status = $1 WHERE id = $2',
      ['cancelled', bookingId]
    );

    await client.query(
      'UPDATE booking_seats SET status = $1 WHERE booking_id = $2',
      ['cancelled', bookingId]
    );

    const seatsResult = await client.query(
      'SELECT COUNT(*) as count FROM booking_seats WHERE booking_id = $1',
      [bookingId]
    );

    const seatCount = parseInt(seatsResult.rows[0].count);

    await client.query(
      'UPDATE shows SET available_seats = available_seats + $1 WHERE id = $2',
      [seatCount, booking.show_id]
    );

    await client.query('COMMIT');

    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};