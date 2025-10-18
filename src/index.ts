import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { signup } from "./controllers/signup";

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

app.get("/ping", (_, res) => {
  res.json({ status: "ok", message: "pong" });
});

app.post("/signup", signup);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
