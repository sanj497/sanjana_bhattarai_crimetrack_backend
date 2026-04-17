import express from "express";
import rateLimit from "express-rate-limit";
import {
  submitCrimeReport,
  getAllReports,
  getReportById,
  updateReportStatus,
  alertPoliceManually,
  deleteReport,
} from "../Controllers/Crimemapcontroller.js";

const router = express.Router();

const createReportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many reports submitted. Please wait before trying again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    xForwardedForHeader: false,
  },
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { success: false, message: "Too many requests. Please slow down." },
  validate: {
    xForwardedForHeader: false,
  },
});

router.use(generalLimiter);

router.get("/", getAllReports);
router.post("/", createReportLimiter, submitCrimeReport);
router.get("/:id", getReportById);
router.patch("/:id/status", updateReportStatus);
router.post("/:id/alert-police", alertPoliceManually);
router.delete("/:id", deleteReport);

export default router;