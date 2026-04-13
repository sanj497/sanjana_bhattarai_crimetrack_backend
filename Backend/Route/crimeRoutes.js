import express from "express";
import { authMiddleware, adminMiddleware, optionalAuth } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/multer.js";
import {
  createCrimeReport,
  updateCrimeStatus,
  verifyCrimeReport,
  forwardToPolice,
  getAllCrimes,
  getMyCrimes,
  getTransparencyStats,
  getPublicFeed,
  addReportInteraction,
  getReportInteractions,
  getNearbyReports,
  getDashboardStats
} from "../Controllers/crimeController.js";

const router = express.Router();

// ── Multer middleware (skips if Content-Type is JSON) ─────────────
const handleUpload = (req, res, next) => {
  const contentType = req.headers["content-type"] || "";
  if (contentType.includes("application/json")) return next();

  upload.array("evidence", 5)(req, res, (err) => {
    if (err) return res.status(400).json({ error: "Upload error", details: err.message });
    next();
  });
};

// ── Routes ────────────────────────────────────────────────────────
router.post("/report",        authMiddleware,                      handleUpload, createCrimeReport);
router.get("/",               authMiddleware, adminMiddleware,      getAllCrimes);
router.get("/mine",           authMiddleware,                      getMyCrimes);
router.get("/stats",          authMiddleware, adminMiddleware,      getDashboardStats);
router.put("/:id/status",     authMiddleware, adminMiddleware,      updateCrimeStatus);
router.post("/:id/verify",    authMiddleware, adminMiddleware,      verifyCrimeReport);
router.post("/:id/forward",   authMiddleware, adminMiddleware,      forwardToPolice);

// Transparency & Performance
router.get("/performance",    optionalAuth,                      getTransparencyStats);

// Community Dashboard
router.get("/community",      optionalAuth,                      getPublicFeed);
router.get("/nearby",         optionalAuth,                      getNearbyReports);
router.post("/:id/responses", authMiddleware,                      addReportInteraction);
router.get("/:id/responses",  optionalAuth,                      getReportInteractions);

export default router;