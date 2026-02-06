import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler } from "./middleware/errorMiddleware";
import { protect } from './middleware/authMiddleware';

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// Routes
import authRoutes from "./routes/authRoutes";
import monitoringRoutes from "./routes/monitoringRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import assessmentRoutes from "./routes/assessmentRoutes";

app.get("/", (req, res) => {
    res.json({ message: "InsurX Backend API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/monitoring", monitoringRoutes); // Includes /config and /dashboard
app.use("/api/payment", paymentRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/risk-assessment", assessmentRoutes); // Alias for clarity if needed, or just use one. User asked for /risk-assessment endpoint.

// Error Handler
app.use(errorHandler);

export default app;
