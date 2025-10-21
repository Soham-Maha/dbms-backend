import { Router } from "express";
import { signup } from "../controllers/signup";
import { login } from "../controllers/login";
import {
  createMovie,
  deleteMovie,
  getMovie,
  getMovies,
} from "../controllers/moviesController";
import { authenticate } from "../middleware/auth";
import { cancelBooking, confirmBooking, createBooking, getUserBookings } from "../controllers/bookingController";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);

//movies
router.get("/movies", getMovies);
router.get("/movies/:id", getMovie);
router.post("/movies", createMovie);
router.delete("/movies/:id", deleteMovie);

//bookings
router.post('/bookings', authenticate, createBooking);
router.post('/bookings/:bookingId/confirm', authenticate, confirmBooking);
router.get('/bookings', authenticate, getUserBookings);
router.delete('/bookings/:bookingId', authenticate, cancelBooking);

export default router;
