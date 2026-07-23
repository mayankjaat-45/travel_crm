import express from "express";
import { getCustomerProfile } from "../controllers/customerController.js";
import { protect } from "../middlewares/authMiddleware.js";

const customerRoutes = express.Router();

customerRoutes.use(protect);

customerRoutes.get("/:phone", getCustomerProfile);

export default customerRoutes;
