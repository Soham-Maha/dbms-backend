import { Request, Response } from "express";
import bcrypt from "bcrypt";
import pool from "../config/db";

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone } = req.body;
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (email, password, name, phone) VALUES ($1, $2, $3, $4) RETURNING id, email, name",
      [email, hashedPassword, name, phone],
    );

    res.status(201).json({
      message: "User registered successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
