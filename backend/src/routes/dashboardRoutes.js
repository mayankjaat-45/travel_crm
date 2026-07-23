import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { getDashboardStats } from "../controllers/dashboardController.js";

const dashboardRoutes = express.Router();

dashboardRoutes.use(protect);

dashboardRoutes.get("/", getDashboardStats);
dashboardRoutes.get("/stats", getDashboardStats);

export default dashboardRoutes;
