import express from "express";
import {
  exportBookings,
  exportLeads,
  exportPayments,
  exportQuotations,
} from "../controllers/exportController.js";
import { protect } from "../middlewares/authMiddleware.js";

const exportRoutes = express.Router();

exportRoutes.use(protect);

exportRoutes.get("/leads", exportLeads);
exportRoutes.get("/bookings", exportBookings);
exportRoutes.get("/quotations", exportQuotations);
exportRoutes.get("/payments", exportPayments);

export default exportRoutes;
