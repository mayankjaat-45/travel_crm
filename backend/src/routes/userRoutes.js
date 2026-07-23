import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import {
  createMember,
  deleteMember,
  getMembers,
  updateMember,
} from "../controllers/userController.js";

const userRoutes = express.Router();

userRoutes.use(protect);

userRoutes
  .route("/")
  .get(authorize("admin", "manager"), getMembers)
  .post(authorize("admin", "manager"), createMember);

userRoutes
  .route("/:id")
  .patch(authorize("admin", "manager"), updateMember)
  .delete(authorize("admin"), deleteMember);

export default userRoutes;
