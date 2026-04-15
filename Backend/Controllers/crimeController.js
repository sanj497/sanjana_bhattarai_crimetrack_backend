// Crime Report Controller - Professional Workflow
import Crime from "../Models/Crime.js";
import Crimereport from "../Models/Crimereport.js";
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
    console.log("📝 Crime report submission started");
    console.log("📋 Request body:", {
      title: req.body.title,
      crimeType: req.body.crimeType,
      hasDescription: !!req.body.description,
      hasLocation: !!req.body.location || !!req.body.address,
      hasFiles: req.files && req.files.length > 0,
      fileCount: req.files ? req.files.length : 0
    });

    const { isAnonymous, title, description, crimeType, location } = req.body;

    // Support both JSON { location: {address,lat,lng} } and flat FormData
    const address = location?.address ?? req.body.address;
    const lat = location?.lat ?? req.body.lat;
    const lng = location?.lng ?? req.body.lng;

    if (!title || !description || !crimeType) {
      console.error("❌ Validation failed: Missing required fields");
      return res.status(400).json({ error: "title, description and crimeType are required" });
    }
    if (!address || String(address).trim() === "") {
      console.error("❌ Validation failed: Missing address");
      return res.status(400).json({ error: "location.address is required" });
    }

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      console.error("❌ Validation failed: Invalid coordinates", { lat, lng });
      return res.status(400).json({ error: "Valid lat and lng are required" });
    }

    console.log("✅ Validation passed, processing files...");

    // ── Upload files to Cloudinary & build evidence ─────────────
    const evidence = [];
    if (req.files && req.files.length > 0) {
      console.log(`📤 Uploading ${req.files.length} file(s) to Cloudinary...`);
      try {
        const uploads = await Promise.all(req.files.map((file) => uploadToCloudinary(file)));
        evidence.push(...uploads);
        console.log("✅ File upload successful");
      } catch (uploadError) {
        console.error("❌ Cloudinary upload failed:", uploadError.message);
        // Continue without files instead of failing
        console.warn("⚠️ Continuing report submission without files");
      }
    }

    console.log("💾 Saving crime report to database...");

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

    console.log("✅ Crime report saved to database:", crime._id);

    // ═══════════════════════════════════════════════════════════
    // PROFESSIONAL WORKFLOW: IMMEDIATE BROADCAST NOTIFICATION
    // ═══════════════════════════════════════════════════════════

    try {
      console.log("🔔 Starting notification broadcast...");
      
      // 1. Fetch all stakeholders (Admins, Police, and Citizens)
      const allStakeholders = await User.find(
        { isOtpVerified: true },
        "_id email role"
      );

      const adminIds = [];
      const policeIds = [];
      const citizenIds = [];
      const recipients = [];

      allStakeholders.forEach(u => {
        if (u.role === "admin") adminIds.push(u._id);
        else if (u.role === "police") policeIds.push(u._id);
        else citizenIds.push(u._id);

        // Add to email list (don't send to the reporter)
        if (u._id.toString() !== req.user._id.toString()) {
          recipients.push(u);
        }
      });

      console.log(`👥 Found ${allStakeholders.length} stakeholders: ${adminIds.length} admins, ${policeIds.length} police, ${citizenIds.length} citizens`);

      const adminMessage = `🔴 URGENT: New crime report requires verification - "${crime.title}"`;
      const adminHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ef4444; border-radius: 10px;">
          <h2 style="color: #b91c1c;">New Critical Report</h2>
          <p>A new crime report has been submitted and is awaiting your verification.</p>
          <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>Title:</strong> ${crime.title}</p>
            <p><strong>Type:</strong> ${crime.crimeType}</p>
            <p><strong>Location:</strong> ${crime.location.address}</p>
          </div>
          <a href="${process.env.FRONTEND_URL}/admin/verify/${crime._id}" style="display: inline-block; background: #2563eb; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Report Now</a>
        </div>
      `;
      const generalMessage = `📢 Community Alert: A new crime report has been filed: "${crime.title}" (${crime.crimeType}). Our team is currently verifying the incident.`;

      // 2. In-App Notifications (Bulk)
      console.log("📱 Creating in-app notifications...");
      if (adminIds.length) await bulkNotify(adminIds, crime._id, adminMessage);
      if (policeIds.length) await bulkNotify(policeIds, crime._id, `📋 New verified report pending: ${crime.title}`);
      if (citizenIds.length) await bulkNotify(citizenIds, crime._id, generalMessage);
      console.log("✅ In-app notifications created");

      // 3. Socket.io Real-time Broadcast
      const io = getIO();
      if (io) {
        console.log("📡 Broadcasting via Socket.io...");
        // Notify Admin Room
        io.to("admin_room").emit("new_notification", {
          type: "crime_report",
          crimeId: crime._id,
          title: crime.title,
          message: adminMessage,
          priority: "high",
          actionRequired: true,
          timestamp: new Date().toISOString()
        });

        // Notify Police Room
        io.to("police_room").emit("new_notification", {
          type: "crime_info",
          crimeId: crime._id,
          title: crime.title,
          message: "New report submitted",
          timestamp: new Date().toISOString()
        });

        // Notify General Room (Optional awareness)
        io.emit("new_public_alert", {
          title: crime.title,
          type: crime.crimeType,
          location: crime.location.address
        });
        console.log("✅ Socket.io broadcast complete");
      }

      // 4. Production-Level Email Broadcast (Non-blocking)
      console.log(`📧 Sending email notifications to ${recipients.length} users (${adminIds.length} admins, ${policeIds.length} police, ${citizenIds.length} citizens)`);
      
      recipients.forEach((recipient) => {
        const msg = recipient.role === "admin" ? adminMessage : generalMessage;
        const customHtml = recipient.role === "admin" ? adminHtml : null;
        sendCrimeAlertEmail(recipient, crime, msg, customHtml)
          .then(() => console.log(`✅ Email sent to ${recipient.email} (${recipient.role})`))
          .catch((err) => console.error(`❌ Email failed for ${recipient.email}:`, err.message));
      });

      // 5. Send Confirmation to Reporter
      sendCrimeAlertEmail(req.user, crime, "✅ Thank you for your report. Our team has been notified and will verify the details shortly.")
        .then(() => console.log(`✅ Confirmation email sent to reporter: ${req.user.email}`))
        .catch((err) => console.error(`❌ Reporter confirmation failed for ${req.user.email}:`, err.message));

      console.log("✅ All notifications processed successfully");
    } catch (notificationError) {
      // Don't fail the entire request if notifications fail
      console.error("⚠️ Notification broadcast failed (non-critical):", notificationError.message);
      console.error("Stack:", notificationError.stack);
    }

    return res.status(201).json({
      success: true,
      msg: "Crime reported successfully. Admin has been notified immediately.",
      crime,
      notifiedAdmins: adminIds?.length || 0,
      notifiedPolice: policeIds?.length || 0,
      notifiedUsers: citizenIds?.length || 0,
    });
  } catch (error) {
    console.error("❌ createCrimeReport error:", error);
    console.error("Error stack:", error.stack);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      name: error.name
    });
    return res.status(500).json({ 
      error: "Failed to submit crime report", 
      details: error.message,
      type: error.name
    });
  }
};

// ─────────────────────────────────────────────────────────────────
// UPDATE CRIME STATUS  (admin / police)
// Sends an in-app notification + email to the original reporter
// ─────────────────────────────────────────────────────────────────
export const updateCrimeStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    const validStatuses = ["Pending", "Verified", "Rejected", "ForwardedToPolice", "UnderInvestigation", "Resolved"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
    }

    const crime = await Crime.findByIdAndUpdate(
      req.params.id,
      {
        status,
        ...(adminNotes && { adminNotes }),
        ...(status === "Verified" && { "workflow.adminVerified": true, "workflow.verifiedBy": req.user._id, "workflow.verifiedAt": new Date() }),
        ...(status === "ForwardedToPolice" && { "workflow.forwardedToPolice": true, "workflow.forwardedAt": new Date(), "workflow.forwardedBy": req.user._id }),
        ...(status === "UnderInvestigation" && { "workflow.assignedToOfficer": req.user._id, "workflow.assignedAt": new Date() }),
        ...(status === "Resolved" && { "workflow.resolvedAt": new Date(), "workflow.resolutionSummary": adminNotes }),
        // For status history tracking
        modifiedBy: req.user._id,
        statusNotes: adminNotes || `Status updated to ${status}`
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
    const { adminNotes, verificationNotes, action } = req.body;
    const isApproved = action !== "reject";

    const crime = await Crime.findByIdAndUpdate(
      req.params.id,
      {
        status: isApproved ? "Verified" : "Rejected",
        adminNotes: adminNotes || "",
        // Update workflow fields
        "workflow.adminVerified": isApproved,
        "workflow.verifiedBy": req.user._id,
        "workflow.verifiedAt": new Date(),
        "workflow.verificationNotes": verificationNotes || adminNotes || "",
        // Set modifiedBy for status history tracking
        modifiedBy: req.user._id,
        statusNotes: verificationNotes || `${isApproved ? 'Verified' : 'Rejected'} by admin`,
      },
      { new: true }
    ).populate("userId", "email username name");

    if (!crime) return res.status(404).json({ error: "Crime not found" });

    // ═══════════════════════════════════════════════════════════
    // PROFESSIONAL WORKFLOW: VERIFICATION COMPLETE
    // ═══════════════════════════════════════════════════════════

    // 1. Notify the reporter
    if (crime.userId) {
      const message = `✅ Your crime report "${crime.title}" has been verified by an admin.`;
      
      await notifyUserCrimeStatus(
        crime.userId._id,
        crime._id,
        message
      );

      // Email Notification
      if (crime.userId.email) {
        sendCrimeAlertEmail(crime.userId, crime, message).catch((err) =>
          console.error(`Verification email failed for ${crime.userId.email}:`, err.message)
        );
      }
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
    const assignedOfficerId = req.body.assignedOfficerId;

    if (assignedOfficerId) {
      // Specifically update the assigned officer in the workflow
      await Crime.findByIdAndUpdate(crime._id, {
        "workflow.assignedToOfficer": assignedOfficerId,
        "workflow.assignedAt": new Date()
      });

      // Notify THE specific officer
      if (io) {
        io.to(`user_${assignedOfficerId}`).emit("new_notification", {
          type: "crime_assigned",
          crimeId: crime._id,
          title: crime.title,
          message: `🚨 NEW CASE ASSIGNED: "${crime.title}" - Evidence has been successfully forwarded to your unit. Please review the details and initiate field investigation immediately.`,
          priority: "high",
          timestamp: new Date().toISOString()
        });
      }

      // 3. Email notification to the assigned officer
      const officer = await User.findById(assignedOfficerId).select("email username");
      if (officer && officer.email) {
        sendCrimeAlertEmail(officer, crime, `🚨 NEW CASE ASSIGNED: "${crime.title}" - Evidence has been successfully forwarded to your unit. Please initiate field investigation.`).catch(err => 
          console.error(`Email failed for officer ${officer.email}:`, err.message)
        );
      }
    }

    if (io) {
      // Also notify General Police Room for awareness
      io.to("police_room").emit("new_notification", {
        type: "crime_forwarded",
        crimeId: crime._id,
        title: crime.title,
        crimeType: crime.crimeType,
        location: crime.location.address,
        status: "ForwardedToPolice",
        message: `📋 New case forwarded for ${assignedOfficerId ? "specific assignment" : "general review"}: "${crime.title}"`,
        timestamp: new Date().toISOString()
      });

      // Also notify admins that forwarding is complete
      io.to("admin_room").emit("new_notification", {
        type: "crime_forwarded_complete",
        crimeId: crime._id,
        title: crime.title,
        status: "ForwardedToPolice",
        message: `✅ Case "${crime.title}" successfully forwarded to police`,
        timestamp: new Date().toISOString()
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
      const inProgressCount = await Crime.countDocuments({ 
        "workflow.assignedToOfficer": officer._id, 
        status: "UnderInvestigation" 
      });

      return {
        id: officer._id,
        name: officer.username,
        email: officer.email,
        assigned: assignedCount,
        resolved: resolvedCount,
        inProgress: inProgressCount,
        efficiency: assignedCount > 0 ? Math.round((resolvedCount / assignedCount) * 100) : 0
      };
    }));

    // Neighborhood analysis (based on address substrings or coordinates)
    // Here we'll just group by crimeType for better community insight
    const crimeTypeTrend = await Crime.aggregate([
      { $group: { _id: "$crimeType", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    return res.json({
      success: true,
      stats: {
        totalReports,
        statusBreakdown: statusCounts,
        officerPerformance: officerStats,
        crimeTrends: crimeTypeTrend,
        resolutionRate: totalReports > 0 ? Math.round((statusCounts.find(s => s._id === 'Resolved')?.count || 0) / totalReports * 100) : 0,
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
    res.status(500).json({ 
      success: false,
      error: "Stats fetch failed",
      details: error.message 
    });
  }
};

// @desc    Get single crime report by ID (Resilient Multi-Source)
// @route   GET /api/report/detail/:id
export const getCrimeById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Attempt to find in primary Crime collection
    let crime = await Crime.findById(id)
      .populate("userId", "username email name")
      .populate("workflow.assignedToOfficer", "username name email rank badgeNumber phone");

    // Fallback: Check map-based reports if not found in primary
    if (!crime) {
      const mapReport = await Crimereport.findById(id).populate("userId", "username email name");
      if (mapReport) {
        // Convert to standard format for the Verify UI
        crime = mapReport.toObject();
        crime.isMapReport = true; // Flag for UI if needed
        crime.crimeType = mapReport.category || mapReport.crimeType;
      }
    }

    if (!crime) return res.status(404).json({ error: "Intelligence Record not found across any databases" });

    res.json({ success: true, crime });
  } catch (error) {
    console.error("getCrimeById error:", error);
    res.status(500).json({ error: "Internal Clearance Error", details: error.message });
  }
};

// @desc    Get nearby police officers for a case
// @route   GET /api/report/:id/nearby-police
export const getNearbyPolice = async (req, res) => {
  try {
    const crime = await Crime.findById(req.params.id);
    if (!crime) return res.status(404).json({ error: "Case not found" });

    const caseAddress = crime.location?.address || "";
    
    // Find all police officers
    const policeOfficers = await User.find({ 
      role: "police",
      isOtpVerified: true 
    }).select("username name email stationDistrict phone");

    // Filter by matching district/location mentioned in address
    const matchedPolice = policeOfficers.filter(police => {
      if (!police.stationDistrict) return false;
      const district = police.stationDistrict.toLowerCase();
      const address = caseAddress.toLowerCase();
      return address.includes(district) || district.includes(address);
    });

    res.json({
      success: true,
      count: matchedPolice.length,
      policeOfficers: matchedPolice.length > 0 ? matchedPolice : policeOfficers.slice(0, 5) // Fallback to some police if no match
    });
  } catch (error) {
    console.error("getNearbyPolice error:", error);
    res.status(500).json({ error: "Failed to find officers" });
  }
};