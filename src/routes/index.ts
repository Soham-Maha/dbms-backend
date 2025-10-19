import { Router } from "express";
import { signup } from "../controllers/signup";
import { login } from "../controllers/login";

const router = Router()

router.post('/signup', signup)
router.post('/login', login)

export default router;