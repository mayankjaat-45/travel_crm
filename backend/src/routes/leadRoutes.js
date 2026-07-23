import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  assignLead,
  createLead,
  deleteLead,
  getLeadById,
  getLeads,
  updateLead,
  updateLeadStatus,
} from "../controllers/leadController.js";
import { authorize } from "../middlewares/roleMiddleware.js";

const leadRoutes = express.Router();

leadRoutes.use(protect);

leadRoutes.get("/", getLeads);
leadRoutes.post("/", createLead);

leadRoutes.patch("/:id/assign", authorize("admin", "manager"), assignLead);
leadRoutes.patch("/:id/status", updateLeadStatus);

leadRoutes.get("/:id", getLeadById);
leadRoutes.patch("/:id", updateLead);
leadRoutes.delete("/:id", authorize("admin", "manager"), deleteLead);

export default leadRoutes;
