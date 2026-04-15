import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
} from "../Controllers/notificationController.js";

const router = express.Router();

router.get("/",                 authMiddleware, getUserNotifications);
router.patch("/:id/read",       authMiddleware, markAsRead);
router.patch("/read-all",       authMiddleware, markAllAsRead);

export default router;