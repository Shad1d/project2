import dotenv from "dotenv";
dotenv.config();

import dns from "dns";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import vocabularyRoutes from "./routes/vocabularyRoutes.js";
import opportunityRoutes from "./routes/opportunityRoutes.js";
import savedOpportunityRoutes from "./routes/savedOpportunityRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import { formatErrorResponse } from "./utils/errorHandler.js";

// Ensure reliable DNS resolution for MongoDB Atlas SRV connection strings
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const app = express();

// Security headers
app.use(helmet());

// CORS configuration (allows communication from React frontend)
const allowedOrigins = (process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. Postman, mobile clients) or matched origins
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS Error: Origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Terminal request logging in development
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Opportunity Finder API is healthy",
    timestamp: new Date().toISOString(),
  });
});

// Feature Routes
app.use("/api/auth", authRoutes);
app.use("/api", vocabularyRoutes);
app.use("/api/opportunities", opportunityRoutes);
app.use("/api/saved-opportunities", savedOpportunityRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);

// 404 Route Not Found handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "Route not found",
    },
  });
});

// Global Centralized Error Handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("API Error:", err);
  const { status, body } = formatErrorResponse(err);
  res.status(status).json(body);
});

// Start server
const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
  }
};

startServer();

export default app;
