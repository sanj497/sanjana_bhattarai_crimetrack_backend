import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import { createServer } from "http";
import connectDB from "./config/mongodb.js";

// Routes
import userroute from "./Route/userroute.js";
import reportroute from "./Route/crimeRoutes.js";
import notificationroute from "./Route/notificationRoutes.js";
import feedbackroute from "./Route/FeedbackRoutes.js";
import Crimereportroutes from "./Route/Crimereportroutes.js";
import complaintRoutes from "./Route/Complaintroutes.js";
import emergencyRoutes from "./Route/emergencyRoutes.js";
import { initSocket } from "./socket.js";

connectDB();

const app = express();

// Trust Render/Heroku/etc. reverse proxy so rate-limiting and IP detection work correctly
app.set("trust proxy", 1);

// ── ABSOLUTE CORS CONTROL (Highest Priority) ────────────────────
app.use((req, res, next) => {
  const origin = req.headers.origin;
  // Reflect origin back or use wildcard
  res.header("Access-Control-Allow-Origin", origin || "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Origin: ${origin}`);

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).json({});
  }
  next();
});

app.get("/api/ping", (req, res) => {
  res.json({ status: "alive", timestamp: new Date().toISOString(), message: "CORS Optimized" });
});


const port = process.env.PORT || 5000;
const server = createServer(app);

// Initialize socket
initSocket(server);

// ── STANDARD MIDDLEWARE ──────────────────────────────────────────
// Custom Express 5 compatible NoSQL Injection Prevention
const cleanNoSQL = (obj) => {
  if (obj && typeof obj === 'object') {
    for (const key in obj) {
      if (key.startsWith('$')) {
        delete obj[key];
      } else if (typeof obj[key] === 'object') {
        cleanNoSQL(obj[key]);
      }
    }
  }
};

app.use(express.json({ limit: "50mb" })); 
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use((req, res, next) => {
  cleanNoSQL(req.body);
  cleanNoSQL(req.query);
  cleanNoSQL(req.params);
  next();
});

// Rate limiting: Temporarily disabled to unblock deployment
/*
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);
*/

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
  console.log(`🚀 Server secured and running on PORT ${port}`);
});