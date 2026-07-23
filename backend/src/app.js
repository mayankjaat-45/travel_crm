import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import leadRoutes from "./routes/leadRoutes.js";
import followUpRoutes from "./routes/followUpRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

import { errorHandler, notFound } from "./middlewares/errorMiddleware.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import quotationRoutes from "./routes/quotationRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import exportRoutes from "./routes/exportRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";

const app = express();

app.set("trust proxy", 1);

const corsOptions = {
  origin: ["http://localhost:3000", "http://localhost:3001"],
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "PUT", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: "Too many requests, please try again later.",
});

app.use("/api", limiter);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Travel CRM API is running",
  });
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Healthy",
    uptime: process.uptime(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/follow-ups", followUpRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/quotations", quotationRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
