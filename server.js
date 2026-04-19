import dotenv from "dotenv";
dotenv.config({ path: "./src/.env" });

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import connectDB from "./src/config/mongodb.js";

// Routes
import userroute from "./src/Route/userroute.js";
import reportroute from "./src/Route/crimeRoutes.js";
import notificationroute from "./src/Route/notificationRoutes.js";
import feedbackroute from "./src/Route/FeedbackRoutes.js";
import Crimereportroutes from "./src/Route/Crimereportroutes.js";
import complaintRoutes from "./src/Route/Complaintroutes.js";
import emergencyRoutes from "./src/Route/emergencyRoutes.js";
import { initSocket } from "./src/socket.js";

const app = express();
const port = process.env.PORT || 5000;

// Trust Render/Heroku/etc. reverse proxy so rate-limiting and IP detection work correctly
const trustProxySetting = (() => {
  const raw = process.env.TRUST_PROXY;
  if (raw === undefined || raw === null || raw === "") return 1;
  if (raw === "true") return true;
  if (raw === "false") return false;
  const asNumber = Number(raw);
  return Number.isNaN(asNumber) ? raw : asNumber;
})();
app.set("trust proxy", trustProxySetting);
console.log("🛡️ trust proxy setting:", app.get("trust proxy"));

// ── CORS CONFIGURATION (MUST BE BEFORE ROUTES) ────────────────────
const allowedOrigins = [
  "http://localhost:5173",
  "https://sanjana-bhattarai-crimetrack-frontend.vercel.app",
  process.env.FRONTEND_URI,
  process.env.FRONTEND_URL
].filter(Boolean);

console.log("🌐 Allowed CORS Origins:", allowedOrigins);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Loosen Vercel CORS to accommodate Vercel's preview URL generation format
    const isVercel = origin.endsWith(".vercel.app") && (origin.includes("sanjana") || origin.includes("crimetrack"));
    
    if (allowedOrigins.indexOf(origin) !== -1 || isVercel) {
      callback(null, true);
    } else {
      console.warn(`❌ CORS blocked origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

// Preflight requests are handled by the cors() middleware above.

// Additional CORS headers as fallback
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(helmet()); // Security headers

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

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

// Health check endpoint
app.get("/api/ping", (req, res) => {
  res.json({ 
    status: "alive", 
    timestamp: new Date().toISOString(),
    message: "CORS Optimized",
    environment: process.env.NODE_ENV || "development"
  });
});

app.get("/", (req, res) => {
  res.send("CrimeTrack API is secured and running...");
});

// Rate limiting: 100 requests per 15 minutes (configured for production behind proxy)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  // Disable xForwardedFor validation since we're behind a proxy
  validate: false,
  // Skip rate limiting in development
  skip: (req, res) => process.env.NODE_ENV === "development",
});
app.use("/api", limiter);

// ── ROUTES ───────────────────────────────────────────────────────
console.log("📡 Setting up routes...");
app.use("/api/auth", userroute);
app.use("/api/report", reportroute);
app.use("/api/notifications", notificationroute);
app.use("/api/feedback", feedbackroute);
app.use("/api/map", Crimereportroutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/emergency", emergencyRoutes);

console.log("✅ Routes configured successfully");

// ── GLOBAL ERROR HANDLER ────────────────────────────────────────
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(`[ERROR] ${req.method} ${req.url}:`, err.message);
  console.error(`[ERROR] Stack:`, err.stack);
  
  // Handle CORS errors specifically
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ 
      success: false,
      error: "CORS policy violation" 
    });
  }
  
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

// ── CONNECT TO DATABASE & START SERVER ────────────────────────────
const startServer = async () => {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await connectDB();
    console.log("✅ MongoDB connected successfully");
    
    const server = createServer(app);
    
    // Initialize socket
    initSocket(server);
    console.log("✅ Socket.io initialized");
    
    server.listen(port, () => {
      console.log(`🚀 CrimeTrack API secured and running on PORT ${port}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URI || "not set"}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    console.error("Error details:", error.message);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  }
};

startServer();
