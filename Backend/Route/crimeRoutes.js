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
  getDashboardStats,
  getCrimeById,
  getNearbyPolice,
  getNearbyCitizens,
  sendManualSafeAlert,
  broadcastCommunityAlert,
  getAlertQueue
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
// ── PRIMARY CASE ACCESS ───────────────────────────────────────────
router.get("/detail/:id",             authMiddleware,                      getCrimeById); // Allowed for any auth (User/Admin/Police) - permission check inside

// ── Submission ────────────────────────────────────────────────────
router.post("/report",        authMiddleware,                      handleUpload, createCrimeReport);

// ── Standard Retrieval ────────────────────────────────────────────
router.get("/",               authMiddleware, adminMiddleware,      getAllCrimes);
router.get("/mine",           authMiddleware,                      getMyCrimes);
router.get("/stats",          authMiddleware,                      getDashboardStats);
router.get("/performance",    authMiddleware,                      getTransparencyStats);

// ── Status & Workflow ─────────────────────────────────────────────
router.put("/:id/status",            authMiddleware, adminMiddleware,      updateCrimeStatus);
router.post("/:id/verify",    authMiddleware, adminMiddleware,      verifyCrimeReport);
router.post("/:id/forward",   authMiddleware, adminMiddleware,      forwardToPolice);
router.get("/:id/nearby-police", authMiddleware, adminMiddleware,   getNearbyPolice);
router.get("/:id/nearby-citizens", authMiddleware, adminMiddleware, getNearbyCitizens);
router.post("/:id/broadcast-safe-alert", authMiddleware, adminMiddleware, sendManualSafeAlert);
router.post("/:id/broadcast-community-alert", authMiddleware, adminMiddleware, broadcastCommunityAlert);

router.get("/alert-queue", authMiddleware, adminMiddleware, getAlertQueue);

// Community Dashboard
router.get("/community",      optionalAuth,                        getPublicFeed);
router.get("/nearby",         authMiddleware,                      getNearbyReports);
router.post("/:id/responses", authMiddleware,                      addReportInteraction);
router.get("/:id/responses",  optionalAuth,                        getReportInteractions);

export default router;