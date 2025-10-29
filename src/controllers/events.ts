import { Request, Response } from "express";
import pool from "../config/db";

// Get single event by ID
export const getEvent = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM events WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Event not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get all events with filters
export const getEvents = async (req: Request, res: Response) => {
  const { language, genre, event_type, city_id, date } = req.query;
  try {
    let query = "SELECT * FROM events WHERE is_active = true";
    const params: any[] = [];
    let paramCount = 1;

    if (language) {
      query += ` AND language = $${paramCount}`;
      params.push(language);
      paramCount++;
    }

    if (genre) {
      query += ` AND genre ILIKE $${paramCount}`;
      params.push(`%${genre}%`);
      paramCount++;
    }

    if (event_type) {
      query += ` AND event_type = $${paramCount}`;
      params.push(event_type);
      paramCount++;
    }

    if (date) {
      query += ` AND event_date >= $${paramCount}`;
      params.push(date);
      paramCount++;
    } else {
      // Show only upcoming events by default
      query += ` AND event_date >= CURRENT_DATE`;
    }

    query += " ORDER BY event_date ASC, event_time ASC";

    const result = await pool.query(query, params);
    res.json({ events: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Create new event
export const createEvent = async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      duration,
      language,
      genre,
      event_date,
      event_time,
      rating,
      poster_url,
      trailer_url,
      artist_name,
      event_type,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO events (title, description, duration, language, genre, event_date, event_time, rating, poster_url, trailer_url, artist_name, event_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        title,
        description,
        duration,
        language,
        genre,
        event_date,
        event_time,
        rating,
        poster_url,
        trailer_url,
        artist_name,
        event_type,
      ]
    );

    res.status(201).json({ event: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Update event
export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      duration,
      language,
      genre,
      event_date,
      event_time,
      rating,
      poster_url,
      trailer_url,
      artist_name,
      event_type,
      is_active,
    } = req.body;

    const result = await pool.query(
      `UPDATE events 
       SET title = $1, description = $2, duration = $3, language = $4, genre = $5, 
           event_date = $6, event_time = $7, rating = $8, poster_url = $9, 
           trailer_url = $10, artist_name = $11, event_type = $12, is_active = $13, 
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $14 RETURNING *`,
      [
        title,
        description,
        duration,
        language,
        genre,
        event_date,
        event_time,
        rating,
        poster_url,
        trailer_url,
        artist_name,
        event_type,
        is_active,
        id,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json({ event: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Delete event
export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `DELETE FROM events WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get event shows by event ID (similar to movie shows)
export const getShowsByEvent = async (req: Request, res: Response) => {
  const { eventId } = req.params;
  const { date, cityId } = req.query;

  try {
    let query = `
      SELECT 
        es.id, es.show_date, es.show_time, es.price, es.available_seats, es.status,
        sc.name as screen_name, sc.screen_type,
        t.id as venue_id, t.name as venue_name, t.address,
        e.title as event_title, e.artist_name
      FROM event_shows es
      JOIN screens sc ON es.screen_id = sc.id
      JOIN theaters t ON sc.theater_id = t.id
      JOIN events e ON es.event_id = e.id
      WHERE es.event_id = $1 AND es.status = 'available'
    `;

    const params: any[] = [eventId];
    let paramCount = 2;

    if (date) {
      query += ` AND es.show_date = $${paramCount}`;
      params.push(date);
      paramCount++;
    } else {
      // Show only upcoming shows
      query += ` AND es.show_date >= CURRENT_DATE`;
    }

    if (cityId) {
      query += ` AND t.city_id = $${paramCount}`;
      params.push(cityId);
      paramCount++;
    }

    query += " ORDER BY es.show_date, es.show_time";

    const result = await pool.query(query, params);

    const groupedByVenue = result.rows.reduce((acc: any, show: any) => {
      if (!acc[show.venue_id]) {
        acc[show.venue_id] = {
          venue_id: show.venue_id,
          venue_name: show.venue_name,
          address: show.address,
          shows: [],
        };
      }
      acc[show.venue_id].shows.push({
        id: show.id,
        show_date: show.show_date,
        show_time: show.show_time,
        price: show.price,
        available_seats: show.available_seats,
        status: show.status,
        screen_name: show.screen_name,
        screen_type: show.screen_type,
      });
      return acc;
    }, {});

    res.json({ venues: Object.values(groupedByVenue) });
  } catch (error) {
    console.error("Error fetching event shows:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get event show by ID with seat details
export const getEventShowById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const showResult = await pool.query(
      `
      SELECT 
        es.*,
        e.title as event_title, e.duration, e.language, e.genre, e.rating, e.artist_name, e.event_type,
        sc.name as screen_name, sc.screen_type, sc.total_seats,
        t.name as venue_name, t.address
      FROM event_shows es
      JOIN events e ON es.event_id = e.id
      JOIN screens sc ON es.screen_id = sc.id
      JOIN theaters t ON sc.theater_id = t.id
      WHERE es.id = $1
    `,
      [id]
    );

    if (showResult.rows.length === 0) {
      return res.status(404).json({ error: "Event show not found" });
    }

    const seatsResult = await pool.query(
      `
      SELECT 
        s.id, s.seat_number, s.row_name, s.seat_type,
        CASE WHEN bs.id IS NOT NULL THEN true ELSE false END as is_booked
      FROM seats s
      LEFT JOIN booking_seats bs ON s.id = bs.seat_id 
        AND bs.show_id = $1 
        AND bs.status = 'booked'
      WHERE s.screen_id = $2
      ORDER BY s.row_name, s.seat_number
    `,
      [id, showResult.rows[0].screen_id]
    );

    res.json({
      show: showResult.rows[0],
      seats: seatsResult.rows,
    });
  } catch (error) {
    console.error("Error fetching event show details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Create event show
export const createEventShow = async (req: Request, res: Response) => {
  try {
    const { event_id, venue_id, screen_id, show_date, show_time, price, available_seats } = req.body;

    const result = await pool.query(
      `INSERT INTO event_shows (event_id, venue_id, screen_id, show_date, show_time, price, available_seats)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [event_id, venue_id, screen_id, show_date, show_time, price, available_seats]
    );

    res.status(201).json({ show: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};