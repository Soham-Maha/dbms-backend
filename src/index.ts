import express, { Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

app.get("/ping", (_, res) => {
  res.json({ status: "ok", message: "pong" });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

