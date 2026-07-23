import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  createFollowUp,
  deleteFollowUp,
  getFollowUps,
  updateFollowUp,
} from "../controllers/followUpController.js";
import { authorize } from "../middlewares/roleMiddleware.js";

const followUpRoutes = express.Router();

followUpRoutes.use(protect);

followUpRoutes.get("/", getFollowUps);
followUpRoutes.post("/", authorize("admin", "manager"), createFollowUp);

followUpRoutes.patch("/:id", updateFollowUp);
followUpRoutes.delete("/:id", authorize("admin", "manager"), deleteFollowUp);
export default followUpRoutes;
