"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const errorMiddleware_1 = require("./middleware/errorMiddleware");
const app = (0, express_1.default)();
// Middleware
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)("dev"));
// Routes
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const monitoringRoutes_1 = __importDefault(require("./routes/monitoringRoutes"));
const paymentRoutes_1 = __importDefault(require("./routes/paymentRoutes"));
const assessmentRoutes_1 = __importDefault(require("./routes/assessmentRoutes"));
app.get("/", (req, res) => {
    res.json({ message: "InsurX Backend API" });
});
app.use("/api/auth", authRoutes_1.default);
app.use("/api/monitoring", monitoringRoutes_1.default); // Includes /config and /dashboard
app.use("/api/payment", paymentRoutes_1.default);
app.use("/api/assessments", assessmentRoutes_1.default);
app.use("/api/risk-assessment", assessmentRoutes_1.default); // Alias for clarity if needed, or just use one. User asked for /risk-assessment endpoint.
// Error Handler
app.use(errorMiddleware_1.errorHandler);
exports.default = app;
