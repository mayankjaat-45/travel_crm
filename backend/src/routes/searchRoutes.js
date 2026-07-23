import express from "express";
import { globalSearch } from "../controllers/searchController.js";
import { protect } from "../middlewares/authMiddleware.js";

const searchRoutes = express.Router();

searchRoutes.use(protect);

searchRoutes.get("/", globalSearch);

export default searchRoutes;
