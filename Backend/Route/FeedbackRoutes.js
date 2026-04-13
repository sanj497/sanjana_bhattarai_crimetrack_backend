import express from "express";
import {
  submitGuestFeedback,
  submitAuthFeedback,
  getAllFeedback,
  deleteFeedback,
} from "../Controllers/FeedbackController.js";
import { authMiddleware, adminMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Guest feedback
router.post("/", submitGuestFeedback);

// Authenticated user feedback
router.post("/auth", authMiddleware, submitAuthFeedback);

// Admin - get all feedback
router.get("/", authMiddleware, adminMiddleware, getAllFeedback);

// Admin - delete feedback
router.delete("/:id", authMiddleware, adminMiddleware, deleteFeedback);

export default router;
