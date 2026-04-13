// Crime Report Controller - Professional Workflow
import Crime from "../Models/Crime.js";
import User from "../Models/usermodel.js";
import Notification from "../Models/Notification.js";
import CrimeInteraction from "../Models/CrimeInteraction.js";
import { sendCrimeAlertEmail } from "../utils/email.js";
import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";
import { notifyUserCrimeStatus } from "./notificationController.js";
import { getIO } from "../socket.js";

// Helper function to create notifications for specific roles
const notifyByRole = async (role, crimeId, message) => {
  const users = await User.find({ role }, "_id");
  const docs = users.map((user) => ({ userId: user._id, crimeId, message }));
  await Notification.insertMany(docs, { ordered: false });

  // Real-time notification via Socket.io
  const io = getIO();
  if (io) {
    const roomName = role === "police" ? "police_room" : role === "admin" ? "admin_room" : "users_room";
    io.to(roomName).emit("new_notification", {
      crimeId,
      message,
      type: "crime_update",
      timestamp: new Date().toISOString()
    });
  }
};

// Helper function for bulk notifications
const bulkNotify = async (userIds, crimeId, message) => {
  const docs = userIds.map((userId) => ({ userId, crimeId, message }));
  await Notification.insertMany(docs, { ordered: false });
};

// Helper function to determine priority based on crime type
const getPriorityFromCrimeType = (crimeType) => {
  const highPriorityCrimes = ["Assault", "Robbery", "Harassment"];
  const criticalPriorityCrimes = ["Murder", "Kidnapping", "Terrorism"];

  if (criticalPriorityCrimes.includes(crimeType)) return "Critical";
  if (highPriorityCrimes.includes(crimeType)) return "High";
  if (crimeType === "Fraud") return "Medium";
  return "Medium"; // Default
};

// ─────────────────────────────────────────────────────────────────
// CREATE CRIME REPORT
// ─────────────────────────────────────────────────────────────────
export const createCrimeReport = async (req, res) => {
  try {
    const { isAnonymous, title, description, crimeType, location } = req.body;

    // Support both JSON { location: {address,lat,lng} } and flat FormData
    const address = location?.address ?? req.body.address;
    const lat = location?.lat ?? req.body.lat;
    const lng = location?.lng ?? req.body.lng;

    if (!title || !description || !crimeType) {
      return res.status(400).json({ error: "title, description and crimeType are required" });
    }
    if (!address || String(address).trim() === "") {
      return res.status(400).json({ error: "location.address is required" });
    }

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      return res.status(400).json({ error: "Valid lat and lng are required" });
    }

    // ── Upload files to Cloudinary & build evidence ─────────────
    const evidence = [];
    if (req.files && req.files.length > 0) {
      const uploads = await Promise.all(req.files.map((file) => uploadToCloudinary(file)));
      evidence.push(...uploads);
    }

    // ── Persist crime with professional workflow ─────────────────
    const crime = await Crime.create({
      userId: req.user._id,
      isAnonymous: String(isAnonymous).toLowerCase() === "true",
      title,
      description,
      crimeType,
      location: { 
        address: String(address).trim(), 
        lat: parsedLat, 
        lng: parsedLng,
        coordinates: [parsedLng, parsedLat] 
      },
      evidence,
      // Set priority based on crime type
      priority: getPriorityFromCrimeType(crimeType),
      // Initial status history entry
      statusHistory: [{
        status: "Pending",
        changedBy: req.user._id,
        notes: "Report submitted by citizen"
      }]
    });

    // ═══════════════════════════════════════════════════════════
    // PROFESSIONAL WORKFLOW: IMMEDIATE ADMIN NOTIFICATION
    // ═══════════════════════════════════════════════════════════

    // 1. IMMEDIATELY notify ALL ADMINS (priority - real-time)
    const adminUsers = await User.find({ role: "admin" }, "_id email");
    const adminIds = adminUsers.map((u) => u._id);
    const adminMessage = `🔴 URGENT: New crime report requires verification - "${crime.title}" (${crime.crimeType})`;

    await bulkNotify(adminIds, crime._id, adminMessage);

    // Real-time socket notification to admin dashboard
    const io = getIO();
    if (io) {
      io.to("admin_room").emit("new_notification", {
        type: "crime_report",
        crimeId: crime._id,
        title: crime.title,
        crimeType: crime.crimeType,
        location: crime.location.address,
        status: crime.status,
        priority: "high",
        message: adminMessage,
        timestamp: new Date().toISOString(),
        actionRequired: true
      });
    }

    // 2. Notify police (informational - they see it in their dashboard)
    const policeUsers = await User.find({ role: "police" }, "_id email");
    const policeIds = policeUsers.map((u) => u._id);
    const policeMessage = `📋 New crime reported in your area - "${crime.title}" (Pending verification)`;

    await bulkNotify(policeIds, crime._id, policeMessage);

    if (io) {
      io.to("police_room").emit("new_notification", {
        type: "crime_info",
        crimeId: crime._id,
        title: crime.title,
        crimeType: crime.crimeType,
        status: "Pending",
        message: policeMessage,
        timestamp: new Date().toISOString(),
        actionRequired: false
      });
    }

    // 3. Notify other users (general awareness)
    const otherUsers = await User.find({
      role: "user",
      _id: { $ne: crime.userId }
    }, "_id email");
    const userIds = otherUsers.map((u) => u._id);
    const userMessage = `🚨 Crime reported nearby: "${crime.title}" (${crime.crimeType})`;

    await bulkNotify(userIds, crime._id, userMessage);

    // 4. Send email alerts (fire-and-forget - don't block response)
    const allUsers = [...adminUsers, ...policeUsers, ...otherUsers];
    allUsers.forEach((user) =>
      sendCrimeAlertEmail(user, crime).catch((err) =>
        console.error(`Email failed for ${user.email}:`, err.message)
      )
    );

    return res.status(201).json({
      success: true,
      msg: "Crime reported successfully. Admin has been notified immediately.",
      crime,
      notifiedAdmins: adminIds.length,
      notifiedPolice: policeIds.length,
      notifiedUsers: userIds.length,
    });
  } catch (error) {
    console.error("createCrimeReport error:", error);
    return res.status(500).json({ error: "Server error", details: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// UPDATE CRIME STATUS  (admin / police)
// Sends an in-app notification + email to the original reporter
// ─────────────────────────────────────────────────────────────────
export const updateCrimeStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    const validStatuses = ["Pending", "Verified", "Rejected", "ForwardedToPolice"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
    }

    const crime = await Crime.findByIdAndUpdate(
      req.params.id,
      {
        status,
        ...(adminNotes && { adminNotes }),
        ...(status === "Verified" && { verifiedBy: req.user._id, verifiedAt: new Date() }),
        ...(status === "ForwardedToPolice" && { forwardedToPolice: true, forwardedAt: new Date() }),
      },
      { new: true }
    ).populate("userId", "email name");

    if (!crime) {
      return res.status(404).json({ error: "Crime not found" });
    }

    // ── Notify the reporter (if not anonymous) ───────────────────
    if (crime.userId) {
      const message = `The status of your reported crime "${crime.title}" has been updated to "${crime.status}".`;

      // In-app notification
      await notifyUserCrimeStatus(crime.userId._id, crime._id, message);

      // Email notification
      if (crime.userId.email) {
        sendCrimeAlertEmail(crime.userId, crime, message).catch((err) =>
          console.error(`Status email failed for ${crime.userId.email}:`, err.message)
        );
      }
    }

    return res.json({ success: true, crime });
  } catch (error) {
    console.error("updateCrimeStatus error:", error);
    return res.status(500).json({ error: "Server error", details: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// VERIFY CRIME  (admin) - Professional Workflow with real-time notifications
// ─────────────────────────────────────────────────────────────────
export const verifyCrimeReport = async (req, res) => {
  try {
    const { adminNotes, verificationNotes } = req.body;

    const crime = await Crime.findByIdAndUpdate(
      req.params.id,
      {
        status: "Verified",
        adminNotes: adminNotes || "",
        // Update workflow fields
        "workflow.adminVerified": true,
        "workflow.verifiedBy": req.user._id,
        "workflow.verifiedAt": new Date(),
        "workflow.verificationNotes": verificationNotes || adminNotes || "",
        // Set modifiedBy for status history tracking
        modifiedBy: req.user._id,
        statusNotes: verificationNotes || `Verified by admin`,
      },
      { new: true }
    ).populate("userId", "email name");

    if (!crime) return res.status(404).json({ error: "Crime not found" });

    // ═══════════════════════════════════════════════════════════
    // PROFESSIONAL WORKFLOW: VERIFICATION COMPLETE
    // ═══════════════════════════════════════════════════════════

    // 1. Notify the reporter
    if (crime.userId) {
      await notifyUserCrimeStatus(
        crime.userId._id,
        crime._id,
        `✅ Your crime report "${crime.title}" has been verified by an admin.`
      );
    }

    // 2. Real-time notification to admin (ready for forwarding)
    const io = getIO();
    if (io) {
      io.to("admin_room").emit("new_notification", {
        type: "crime_verified",
        crimeId: crime._id,
        title: crime.title,
        crimeType: crime.crimeType,
        status: "Verified",
        priority: crime.priority?.toLowerCase() || "medium",
        message: `✅ Crime report verified: "${crime.title}" - Ready to forward to police`,
        timestamp: new Date().toISOString(),
        actionRequired: true,
        nextAction: "forwardToPolice"
      });
    }

    return res.json({
      success: true,
      crime,
      message: "Crime report verified successfully. Ready to forward to police."
    });
  } catch (error) {
    console.error("verifyCrimeReport error:", error);
    return res.status(500).json({ error: "Server error", details: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// FORWARD TO POLICE  (admin) - Professional Workflow with real-time notifications
// ─────────────────────────────────────────────────────────────────
export const forwardToPolice = async (req, res) => {
  try {
    const crime = await Crime.findByIdAndUpdate(
      req.params.id,
      {
        status: "ForwardedToPolice",
        // Update workflow fields
        "workflow.forwardedToPolice": true,
        "workflow.forwardedAt": new Date(),
        "workflow.forwardedBy": req.user._id,
        // Set modifiedBy for status history tracking
        modifiedBy: req.user._id,
        statusNotes: "Forwarded to police for investigation",
      },
      { new: true }
    ).populate("userId", "email name");

    if (!crime) return res.status(404).json({ error: "Crime not found" });

    // ═══════════════════════════════════════════════════════════
    // PROFESSIONAL WORKFLOW: FORWARDED TO POLICE
    // ═══════════════════════════════════════════════════════════

    // 1. Notify the reporter
    if (crime.userId) {
      await notifyUserCrimeStatus(
        crime.userId._id,
        crime._id,
        `👮 Your crime report "${crime.title}" has been forwarded to the police for investigation.`
      );
    }

    // 2. Real-time notification to POLICE (urgent - new case assigned)
    const io = getIO();
    if (io) {
      // Notify police room about new case
      io.to("police_room").emit("new_notification", {
        type: "crime_forwarded",
        crimeId: crime._id,
        title: crime.title,
        crimeType: crime.crimeType,
        location: crime.location.address,
        description: crime.description,
        status: "ForwardedToPolice",
        priority: crime.priority?.toLowerCase() || "high",
        message: `🚨 NEW CASE ASSIGNED: "${crime.title}" - Requires immediate attention`,
        timestamp: new Date().toISOString(),
        actionRequired: true,
        requiresInvestigation: true
      });

      // Also notify admins that forwarding is complete
      io.to("admin_room").emit("new_notification", {
        type: "crime_forwarded_complete",
        crimeId: crime._id,
        title: crime.title,
        status: "ForwardedToPolice",
        message: `✅ Case "${crime.title}" successfully forwarded to police`,
        timestamp: new Date().toISOString(),
        actionRequired: false
      });
    }

    // 3. Send email to police department
    const policeUsers = await User.find({ role: "police" }, "email");
    policeUsers.forEach((officer) =>
      sendCrimeAlertEmail(officer, crime, "🚨 New case assigned for investigation").catch((err) =>
        console.error(`Police alert email failed for ${officer.email}:`, err.message)
      )
    );

    return res.json({
      success: true,
      crime,
      message: "Case successfully forwarded to police for investigation."
    });
  } catch (error) {
    console.error("forwardToPolice error:", error);
    return res.status(500).json({ error: "Server error", details: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// GET ALL CRIMES  (admin / police)
// ─────────────────────────────────────────────────────────────────
export const getAllCrimes = async (req, res) => {
  try {
    const crimes = await Crime.find({}).populate("userId", "email role username");
    return res.json({ success: true, crimes });
  } catch (error) {
    console.error("getAllCrimes error:", error);
    return res.status(500).json({ error: "Server error", details: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// GET MY CRIMES  (authenticated user)
// ─────────────────────────────────────────────────────────────────
export const getMyCrimes = async (req, res) => {
  try {
    const crimes = await Crime.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return res.json({ success: true, crimes });
  } catch (error) {
    console.error("getMyCrimes error:", error);
    return res.status(500).json({ error: "Server error", details: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// GET TRANSPARENCY & PERFORMANCE STATS
// ─────────────────────────────────────────────────────────────────
export const getTransparencyStats = async (req, res) => {
  try {
    const totalReports = await Crime.countDocuments();
    const statusCounts = await Crime.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const officers = await User.find({ role: "police" }, "username email");
    const officerStats = await Promise.all(officers.map(async (officer) => {
      const assignedCount = await Crime.countDocuments({ "workflow.assignedToOfficer": officer._id });
      const resolvedCount = await Crime.countDocuments({ 
        "workflow.assignedToOfficer": officer._id, 
        status: "Resolved" 
      });
      return {
        id: officer._id,
        name: officer.username,
        email: officer.email,
        assigned: assignedCount,
        resolved: resolvedCount,
        efficiency: assignedCount > 0 ? Math.round((resolvedCount / assignedCount) * 100) : 0
      };
    }));

    return res.json({
      success: true,
      stats: {
        totalReports,
        statusBreakdown: statusCounts,
        officerPerformance: officerStats,
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error("getTransparencyStats error:", error);
    return res.status(500).json({ error: "Server error", details: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// GET PUBLIC COMMUNITY FEED
// ─────────────────────────────────────────────────────────────────
export const getPublicFeed = async (req, res) => {
  try {
    // Show reports that are beyond the initial "Pending" state
    const publicStatuses = ["Verified", "ForwardedToPolice", "UnderInvestigation", "Resolved"];
    
    const reports = await Crime.find({ status: { $in: publicStatuses } })
      .select("-evidence.publicId -workflow.verificationNotes") 
      .populate("userId", "username") // Only show username, hide email for public view
      .sort({ createdAt: -1 });

    // Further sanitize: if isAnonymous is true, hide the username
    const sanitizedReports = reports.map(report => {
      const r = report.toObject();
      if (r.isAnonymous) {
        r.userId = { username: "Anonymous Citizen" };
      }
      return r;
    });

    return res.json({ success: true, reports: sanitizedReports });
  } catch (error) {
    console.error("getPublicFeed error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────
// ADD INTERACTION (Comment/Feedback)
// ─────────────────────────────────────────────────────────────────
export const addReportInteraction = async (req, res) => {
  try {
    const { content, type } = req.body;
    const interaction = await CrimeInteraction.create({
      crimeId: req.params.id,
      userId: req.user._id,
      username: req.user.username,
      content,
      type
    });
    return res.status(201).json({ success: true, interaction });
  } catch (error) {
    console.error("addReportInteraction error:", error);
    return res.status(500).json({ error: "Feedback failed" });
  }
};

// ─────────────────────────────────────────────────────────────────
// GET INTERACTIONS
// ─────────────────────────────────────────────────────────────────
export const getReportInteractions = async (req, res) => {
  try {
    const interactions = await CrimeInteraction.find({ crimeId: req.params.id })
      .populate("userId", "username")
      .sort({ createdAt: -1 });
    return res.json({ success: true, interactions });
  } catch (error) {
    console.error("getReportInteractions error:", error);
    return res.status(500).json({ error: "Failed to load interactions" });
  }
};

// @desc    Get reports within a radius
// @route   GET /api/report/nearby
export const getNearbyReports = async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query; 
    if (!lat || !lng) return res.status(400).json({ error: "Location required" });

    const reports = await Crime.find({
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius),
        },
      },
      status: { $ne: "Pending" }
    }).populate("userId", "username").limit(20);

    const sanitized = reports.map(r => {
      const obj = r.toObject();
      if (obj.isAnonymous) obj.userId = { username: "Anonymous" };
      return obj;
    });

    res.json({ success: true, reports: sanitized });
  } catch (error) {
    console.error("getNearbyReports error:", error);
    res.status(500).json({ error: "Nearby search failed" });
  }
};

// @desc    Get dashboard summary statistics
// @route   GET /api/report/stats
export const getDashboardStats = async (req, res) => {
  try {
    const [total, pending, verified, resolved] = await Promise.all([
      Crime.countDocuments({}),
      Crime.countDocuments({ status: "Pending" }),
      Crime.countDocuments({ status: "Verified" }),
      Crime.countDocuments({ status: "Resolved" })
    ]);

    // Fetch last 10 activities (most recent status updates)
    const recentCrimes = await Crime.find({})
      .sort({ updatedAt: -1 })
      .limit(10)
      .populate("userId", "username")
      .select("title crimeType status updatedAt location");

    const activities = recentCrimes.map(c => ({
      title: `Case Updated: ${c.title}`,
      meta: `${c.crimeType} • ${c.location?.address || "Location Hidden"} • ${new Date(c.updatedAt).toLocaleTimeString()}`,
      badge: c.status
    }));

    res.json({
      success: true,
      stats: { total, pending, verified, resolved },
      activities
    });
  } catch (error) {
    console.error("getDashboardStats error:", error);
    res.status(500).json({ error: "Stats fetch failed" });
  }
};