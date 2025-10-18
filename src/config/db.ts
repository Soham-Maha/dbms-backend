import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || "5432"),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

pool.on("connect", () => {
  console.log("Connected to Postgres Successfully");
});

pool.on("error", (err) => {
  console.log("Error connecting to Postgres", err);
  process.exit(-1);
});

export default pool;
