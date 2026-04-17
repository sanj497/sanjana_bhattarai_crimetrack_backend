import Notification from "../Models/Notification.js";
import { sendNotificationToUser } from "../socket.js";

// GET /api/notifications  — paginated, newest first
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;

    // Only show notification types relevant to this user's role
    let typeFilter;
    if (role === "admin") {
      typeFilter = { $in: ["personal", "admin_alert", "complaint"] };
    } else if (role === "police") {
      typeFilter = { $in: ["personal", "police_alert"] };
    } else {
      // citizen/user — only see their own personal messages and nearby safe alerts
      typeFilter = { $in: ["personal", "citizen_alert"] };
    }

    const notifications = await Notification.find({ userId, type: typeFilter })
      .populate("crimeId", "title status location crimeType")
      .sort({ createdAt: -1 });

    const unreadCount = notifications.filter((n) => !n.isRead).length;
    return res.json({ success: true, unreadCount, notifications });
  } catch (error) {
    console.error("getUserNotifications error:", error);
    return res.status(500).json({ msg: "Server error" });
  }
};

// PATCH /api/notifications/:id/read  — mark one as read
export const markAsRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id }, // ← scoped to owner
      { isRead: true }
    );
    return res.json({ success: true });
  } catch (error) {
    console.error("markAsRead error:", error);
    return res.status(500).json({ msg: "Server error" });
  }
};

// PATCH /api/notifications/read-all  — mark all as read
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    return res.json({ success: true });
  } catch (error) {
    console.error("markAllAsRead error:", error);
    return res.status(500).json({ msg: "Server error" });
  }
};

// Helper: Notify a user about a crime status change
export const notifyUserCrimeStatus = async (userId, crimeId, message, type = "personal") => {
  try {
    const notification = await Notification.create({
      userId,
      crimeId,
      message,
      type,
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    });
    
    // PUSH VIA SOCKET
    sendNotificationToUser(userId, {
      _id: notification._id,
      message,
      crimeId,
      createdAt: notification.createdAt,
      isRead: false
    });

    return notification;
  } catch (error) {
    console.error("notifyUserCrimeStatus error:", error);
  }
};