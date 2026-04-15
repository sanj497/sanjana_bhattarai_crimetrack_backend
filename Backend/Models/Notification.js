// models/Notification.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  crimeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Crime",
    required: false, // optional — complaint notifications don't have a linked crime
  },
  message: {
    type: String,
    required: true,
  },
  // Who this notification is intended for:
  // 'personal'       = sent to the specific reporter/reporter confirmation
  // 'citizen_alert'  = safe alert for nearby citizens  
  // 'admin_alert'    = alert for admin staff
  // 'police_alert'   = alert for police officers
  // 'complaint'      = complaint filed — admin/police only
  type: {
    type: String,
    enum: ["personal", "citizen_alert", "admin_alert", "police_alert", "complaint"],
    default: "personal",
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  // Auto-expire notifications after 5 days to keep the system clean
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    index: { expiresAfterSeconds: 0 }
  }
}, { timestamps: true });

export default mongoose.model("Notification", notificationSchema);
