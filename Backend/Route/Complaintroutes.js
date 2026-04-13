import express from "express";
import {
  submitComplaint,
  getMyComplaints,
  trackComplaintStatus,
  getAllComplaints,
  updateComplaintStatus,
  deleteComplaint,
} from "../Controllers/complain.js";
import { authMiddleware, adminMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// ─── USER ROUTES (any logged-in user) ────────────────────────────────────────

// POST   /api/complaints             → Submit a new complaint
router.post("/", authMiddleware, submitComplaint);

// GET    /api/complaints/my          → Get all my complaints
router.get("/my", authMiddleware, getMyComplaints);

// GET    /api/complaints/:id/track   → Track status of a specific complaint
router.get("/:id/track", authMiddleware, trackComplaintStatus);

// ─── ADMIN / POLICE ROUTES ────────────────────────────────────────────────────

// GET    /api/complaints             → Get all complaints (?status=Pending&category=Theft)
router.get("/", authMiddleware, adminMiddleware, getAllComplaints);

// PATCH  /api/complaints/:id/status  → Update complaint status
router.patch("/:id/status", authMiddleware, adminMiddleware, updateComplaintStatus);

// DELETE /api/complaints/:id         → Delete a complaint
router.delete("/:id", authMiddleware, adminMiddleware, deleteComplaint);

export default router;