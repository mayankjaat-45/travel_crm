import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
    convertQuotationToBooking,
  createQuotation,
  deleteQuotation,
  getQuotationById,
  getQuotations,
  updateQuotation,
} from "../controllers/quotationController.js";

const quotationRoutes = express.Router();

quotationRoutes.use(protect);

quotationRoutes.get("/", getQuotations);
quotationRoutes.post("/", createQuotation);


quotationRoutes.post("/:id/convert-to-booking", convertQuotationToBooking);
quotationRoutes.get("/:id", getQuotationById);
quotationRoutes.patch("/:id", updateQuotation);
quotationRoutes.delete("/:id", deleteQuotation);

export default quotationRoutes;
