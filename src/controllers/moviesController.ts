import { Request, Response } from "express";
import pool from "../config/db";

export const getMovie = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM movies WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Movie not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getMovies = async (req: Request, res: Response) => {
  const { language, genre } = req.query;
  try {
    let query = "SELECT * FROM movies WHERE is_active = true";
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

    query += " ORDER BY release_date DESC";

    const result = await pool.query(query, params);
    res.json({ movies: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
