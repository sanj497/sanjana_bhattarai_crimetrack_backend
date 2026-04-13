import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import connectDB from "./Backend/config/mongodb.js";

// Routes
import userroute from "./Backend/Route/userroute.js";
import reportroute from "./Backend/Route/crimeRoutes.js";
import notificationroute from "./Backend/Route/notificationRoutes.js";
import feedbackroute from "./Backend/Route/FeedbackRoutes.js";
import Crimereportroutes from "./Backend/Route/Crimereportroutes.js";
import complaintRoutes from "./Backend/Route/Complaintroutes.js";
import emergencyRoutes from "./Backend/Route/emergencyRoutes.js";
import { initSocket } from "./Backend/socket.js";

dotenv.config({ path: "./Backend/.env" });
connectDB();

const app = express();
const port = process.env.PORT || 5000;
const server = createServer(app);

// Initialize socket
initSocket(server);

// ── STANDARD MIDDLEWARE & CORS ────────────────────────────────────
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://sanjana-bhattarai-crimetrack-fronte.vercel.app",
    process.env.FRONTEND_URI
  ].filter(Boolean),
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(helmet()); // Security headers

// Custom Express 5-compatible NoSQL Injection Prevention
const cleanNoSQL = (obj) => {
  if (obj && typeof obj === "object") {
    for (const key in obj) {
      if (key.startsWith("$")) {
        delete obj[key];
      } else if (typeof obj[key] === "object") {
        cleanNoSQL(obj[key]);
      }
    }
  }
};

app.use((req, res, next) => {
  cleanNoSQL(req.body);
  cleanNoSQL(req.query);
  cleanNoSQL(req.params);
  next();
});

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Rate limiting: 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// ── ROUTES ───────────────────────────────────────────────────────
app.use("/api/auth", userroute);
app.use("/api/report", reportroute);
app.use("/api/notifications", notificationroute);
app.use("/api/feedback", feedbackroute);
app.use("/api/map", Crimereportroutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/emergency", emergencyRoutes);

app.get("/", (req, res) => {
  res.send("CrimeTrack API is secured and running...");
});

// ── GLOBAL ERROR HANDLER ────────────────────────────────────────
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(`[ERROR] ${req.method} ${req.url}:`, err.message);

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

server.listen(port, () => {
  console.log(`🚀 CrimeTrack API secured and running on PORT ${port}`);
});
