import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  createPayment,
  deletePayment,
  getPaymentsByBooking,
} from "../controllers/paymentController.js";

const paymentRoutes = express.Router();

paymentRoutes.use(protect);

paymentRoutes.post("/", createPayment);
paymentRoutes.get("/booking/:bookingId", getPaymentsByBooking);
paymentRoutes.delete("/:id", deletePayment);

export default paymentRoutes;
