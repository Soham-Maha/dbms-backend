import { Request, Response } from 'express';
import pool from '../config/db';

export const getShowsByMovie = async (req: Request, res: Response) => {
  const { movieId } = req.params;
  const { date, cityId } = req.query;

  try {
    let query = `
      SELECT 
        s.id, s.show_date, s.show_time, s.price, s.available_seats,
        sc.name as screen_name, sc.screen_type,
        t.id as theater_id, t.name as theater_name, t.address,
        m.title as movie_title
      FROM shows s
      JOIN screens sc ON s.screen_id = sc.id
      JOIN theaters t ON sc.theater_id = t.id
      JOIN movies m ON s.movie_id = m.id
      WHERE s.movie_id = $1
    `;
    
    const params: any[] = [movieId];
    let paramCount = 2;

    if (date) {
      query += ` AND s.show_date = $${paramCount}`;
      params.push(date);
      paramCount++;
    }

    if (cityId) {
      query += ` AND t.city_id = $${paramCount}`;
      params.push(cityId);
      paramCount++;
    }

    query += ' ORDER BY s.show_date, s.show_time';

    const result = await pool.query(query, params);

    const groupedByTheater = result.rows.reduce((acc: any, show: any) => {
      if (!acc[show.theater_id]) {
        acc[show.theater_id] = {
          theater_id: show.theater_id,
          theater_name: show.theater_name,
          address: show.address,
          shows: [],
        };
      }
      acc[show.theater_id].shows.push({
        id: show.id,
        show_date: show.show_date,
        show_time: show.show_time,
        price: show.price,
        available_seats: show.available_seats,
        screen_name: show.screen_name,
        screen_type: show.screen_type,
      });
      return acc;
    }, {});

    res.json({ theaters: Object.values(groupedByTheater) });
  } catch (error) {
    console.error('Error fetching shows:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getShowById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const showResult = await pool.query(`
      SELECT 
        s.*,
        m.title as movie_title, m.duration, m.language, m.genre, m.rating,
        sc.name as screen_name, sc.screen_type, sc.total_seats,
        t.name as theater_name, t.address
      FROM shows s
      JOIN movies m ON s.movie_id = m.id
      JOIN screens sc ON s.screen_id = sc.id
      JOIN theaters t ON sc.theater_id = t.id
      WHERE s.id = $1
    `, [id]);

    if (showResult.rows.length === 0) {
      return res.status(404).json({ error: 'Show not found' });
    }

    const seatsResult = await pool.query(`
      SELECT 
        s.id, s.seat_number, s.row_name, s.seat_type,
        CASE WHEN bs.id IS NOT NULL THEN true ELSE false END as is_booked
      FROM seats s
      LEFT JOIN booking_seats bs ON s.id = bs.seat_id AND bs.show_id = $1 AND bs.status = 'booked'
      WHERE s.screen_id = $2
      ORDER BY s.row_name, s.seat_number
    `, [id, showResult.rows[0].screen_id]);

    res.json({
      show: showResult.rows[0],
      seats: seatsResult.rows,
    });
  } catch (error) {
    console.error('Error fetching show details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};