import { Router } from "express";
import { signup } from "../controllers/signup";
import { login } from "../controllers/login";
import { createMovie, getMovie, getMovies } from "../controllers/moviesController";

const router = Router()

router.post('/signup', signup)
router.post('/login', login)

//movies
router.get('/movies', getMovies)
router.get('/movies/:id', getMovie)
router.post('/movies', createMovie)

export default router;