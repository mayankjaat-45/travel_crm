import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import {
  createBooking,
  deleteBooking,
  getBookingById,
  getBookings,
  updateBooking,
} from "../controllers/bookingController.js";

const bookingRoutes = express.Router();

bookingRoutes.use(protect);

bookingRoutes.get("/", getBookings);
bookingRoutes.post("/", createBooking);

bookingRoutes.get("/:id", getBookingById);
bookingRoutes.patch("/:id", updateBooking);
bookingRoutes.delete("/:id", authorize("admin", "manager"), deleteBooking);

export default bookingRoutes;
