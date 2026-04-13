import Notification from "../Models/Notification.js";

// GET /api/notifications  — paginated, newest first
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const notifications = await Notification.find({ userId })
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
export const notifyUserCrimeStatus = async (userId, crimeId, message) => {
  try {
    return await Notification.create({
      userId,
      crimeId,
      message,
    });
  } catch (error) {
    console.error("notifyUserCrimeStatus error:", error);
  }
};