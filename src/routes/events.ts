import express from "express";
import {
  getEvent,
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getShowsByEvent,
  getEventShowById,
  createEventShow,
} from "../controllers/events";

const router = express.Router();

// Event routes
router.get("/", getEvents);
router.get("/:id", getEvent);
router.post("/", createEvent);
router.put("/:id", updateEvent);
router.delete("/:id", deleteEvent);

// Event show routes
router.get("/:eventId/shows", getShowsByEvent);
router.get("/shows/:id", getEventShowById);
router.post("/shows", createEventShow);

export default router;