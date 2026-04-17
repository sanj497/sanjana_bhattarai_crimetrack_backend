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
const bulkNotify = async (userIds, crimeId, message, type = "personal") => {
  const expiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days
  const docs = userIds.map((userId) => ({ userId, crimeId, message, type, expiresAt }));
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

const toRadians = (degrees) => (degrees * Math.PI) / 180;

const haversineDistanceKm = (lat1, lng1, lat2, lng2) => {
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

const formatDistance = (distanceKm) => {
  if (!Number.isFinite(distanceKm)) return "Distance unavailable";
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`;
  return `${distanceKm.toFixed(2)} km`;
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
      priority: getPriorityFromCrimeType(crimeType),
      statusHistory: [{
        status: "Pending",
        changedBy: req.user._id,
        notes: "Report submitted by citizen"
      }]
    });

    console.log("✅ Crime report saved to database:", crime._id);

    // ── 1. IMMEDIATE REPORTER CONFIRMATION ────────────────────────────
    const reporterMessage = "✅ Your report has been submitted. Our admin team is reviewing your record.";
    try {
      await Notification.create({
        userId: req.user._id,
        crimeId: crime._id,
        message: reporterMessage,
        type: "personal",
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      });
      
      const io = getIO();
      if (io) {
        io.to(`user_${req.user._id}`).emit("new_notification", {
          type: "report_confirmation",
          crimeId: crime._id,
          message: reporterMessage,
          timestamp: new Date().toISOString()
        });
      }

      await sendCrimeAlertEmail(req.user, crime, `✅ Your report has been submitted. Our admin team is reviewing your record.`)
        .catch(err => console.error(`❌ Reporter email failed: ${req.user.email}`, err.message));
    } catch (confError) {
      console.error("⚠️ Reporter confirmation failed:", confError.message);
    }

    // ═══════════════════════════════════════════════════════════
    // PROFESSIONAL WORKFLOW: ADMIN-ONLY BROADCAST (Initial Review)
    // ═══════════════════════════════════════════════════════════
    let adminIds = [];
    try {
      console.log("🔔 Notifying administrators of new report...");
      
      // 1. Find all Admins (Always notified)
      const admins = await User.find({ role: "admin", isOtpVerified: true }, "_id email role");
      adminIds = admins.map(a => a._id);
      
      const adminMessage = `📋 New crime report has been submitted. Please check your dashboard to review, verify, and take necessary action.`;

      // 2. In-App Notifications (Bulk) — tagged for admin review
      if (adminIds.length) await bulkNotify(adminIds, crime._id, adminMessage, "admin_alert");

      // 3. Socket.io Real-time Broadcast to Admin Room
      const io = getIO();
      if (io) {
        io.to("admin_room").emit("new_notification", {
          type: "crime_report",
          crimeId: crime._id,
          title: crime.title,
          message: adminMessage,
          priority: "high",
          actionRequired: true,
          timestamp: new Date().toISOString()
        });
      }

      // 4. Email Broadcast to Admins
      admins.forEach(admin => {
        sendCrimeAlertEmail(admin, crime, adminMessage)
          .catch(err => console.error(`❌ Admin email failed: ${admin.email}`, err.message));
      });

      console.log("✅ Admin notifications processed successfully");
    } catch (notificationError) {
      console.error("⚠️ Admin notification failed:", notificationError.message);
    }

    // ═══════════════════════════════════════════════════════════
    // PROFESSIONAL WORKFLOW: COMMUNITY SAFETY ALERT (Nearby Users)
    // Broadcasts the report to the nearest users for better protection
    // ═══════════════════════════════════════════════════════════
    let notifiedCitizens = 0;
    try {
      console.log("🔔 Broadcasting safety alert to community nearby users...");
      
      if (parsedLat && parsedLng) {
        // Find nearby citizens (within 5km) for community protection
        const nearestCitizens = await User.find({
          role: "user",
          _id: { $ne: req.user._id },
          "stationLocation.coordinates": {
            $near: {
              $geometry: { type: "Point", coordinates: [parsedLng, parsedLat] },
              $maxDistance: 5000 // 5km radius
            }
          }
        });
        
        notifiedCitizens = nearestCitizens.length;
        const citizenMessage = `⚠️ COMMUNITY SAFETY ALERT: A ${crime.crimeType} was just reported near your location at ${crime.location.address}. Please stay vigilant and safe.`;

        if (notifiedCitizens > 0) {
          const citizenIds = nearestCitizens.map(c => c._id);
          
          // 1. In-App Notifications
          await bulkNotify(citizenIds, crime._id, citizenMessage, "citizen_alert");
          
          // 2. Real-time Socket.io Broadcast to specific nearby users
          const io = getIO();
          if (io) {
            citizenIds.forEach(id => {
              io.to(`user_${id}`).emit("new_notification", {
                type: "community_alert",
                crimeId: crime._id,
                title: "Safety Alert",
                message: citizenMessage,
                priority: crime.priority,
                timestamp: new Date().toISOString()
              });
            });
            // Also broad broadcast to users room for the live community feed
            io.to("users_room").emit("new_notification", {
              type: "community_alert",
              crimeId: crime._id,
              title: "Area Alert",
              message: `⚠️ New ${crime.crimeType} reported in the community at ${crime.location.address}.`,
              priority: crime.priority,
              timestamp: new Date().toISOString()
            });
          }

          // 3. Email Broadcast
          nearestCitizens.forEach(citizen => {
            if (citizen.email) {
              sendCrimeAlertEmail(citizen, crime, citizenMessage)
                .catch(err => console.error(`❌ Citizen email failed: ${citizen.email}`, err.message));
            }
          });
        } else {
          // Fallback realtime broadcast if no precise users match radius
          const io = getIO();
          if (io) {
            io.to("users_room").emit("new_notification", {
              type: "community_alert",
              crimeId: crime._id,
              title: "Community Safety Alert",
              message: `⚠️ New ${crime.crimeType} reported at ${crime.location.address}.`,
              priority: crime.priority,
              timestamp: new Date().toISOString()
            });
          }
        }
        console.log(`✅ Community alerts processed: Notified ${notifiedCitizens} nearest users.`);
      }
    } catch (communityError) {
      console.error("⚠️ Community broadcast failed:", communityError.message);
    }

    return res.status(201).json({
      success: true,
      msg: "Crime reported successfully. Admin and nearest users have been notified for safety.",
      crime,
      notifiedAdmins: adminIds?.length || 0,
      notifiedCitizens,
      notifiedPolice: 0,
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

    // ── PROFESSIONAL CLEANUP: Mark alerts as read if crime is resolved/rejected ──
    if (status === "Resolved" || status === "Rejected") {
      try {
        await Notification.updateMany(
          { crimeId: crime._id, type: "citizen_alert", isRead: false },
          { isRead: true }
        );
        console.log(`✅ Marked citizen alerts as read for ${status} crime: ${crime._id}`);
      } catch (cleanupError) {
        console.error("Cleanup error:", cleanupError.message);
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
      let reporterMessage;
      let emailSubject;
      
      if (isApproved) {
        // Verified message
        reporterMessage = `✅ Your crime report has been verified by our admin team. The case is now under further investigation and will be forwarded to the appropriate authorities for action. Thank you for helping keep our community safe.`;
        
        // In-app notification
        await notifyUserCrimeStatus(
          crime.userId._id,
          crime._id,
          reporterMessage
        );

        // Email Notification
        if (crime.userId.email) {
          sendCrimeAlertEmail(crime.userId, crime, reporterMessage).catch((err) =>
            console.error(`Verification email failed for ${crime.userId.email}:`, err.message)
          );
        }
      } else {
        // Rejected message
        reporterMessage = `❌ Your crime report has been rejected after admin review. This decision may be due to insufficient evidence, duplicate reporting, or the incident not meeting our criteria. If you believe this is an error, please contact support or submit a new report with additional details.`;
        
        // In-app notification
        await notifyUserCrimeStatus(
          crime.userId._id,
          crime._id,
          reporterMessage
        );

        // Email Notification
        if (crime.userId.email) {
          sendCrimeAlertEmail(crime.userId, crime, reporterMessage).catch((err) =>
            console.error(`Rejection email failed for ${crime.userId.email}:`, err.message)
          );
        }
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
        status: isApproved ? "Verified" : "Rejected",
        priority: crime.priority?.toLowerCase() || "medium",
        message: isApproved 
          ? `✅ Crime report verified: "${crime.title}" - Ready to forward to police`
          : `❌ Crime report rejected: "${crime.title}"`,
        timestamp: new Date().toISOString(),
        actionRequired: isApproved,
        nextAction: isApproved ? "forwardToPolice" : null
      });
    }

    // ── PROFESSIONAL CLEANUP: If rejected, mark any preliminary alerts as read ──
    if (action === "reject") {
      try {
        await Notification.updateMany(
          { crimeId: crime._id, type: "citizen_alert", isRead: false },
          { isRead: true }
        );
        console.log(`✅ Marked preliminary citizen alerts as read for rejected crime: ${crime._id}`);
      } catch (cleanupError) {
        console.error("Cleanup error in verification:", cleanupError.message);
      }
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
    const { assignedOfficerId } = req.body;
    if (!assignedOfficerId) {
      return res.status(400).json({ error: "assignedOfficerId is required to forward a case to police." });
    }

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
      const reporterMessage = `✅ Your crime report has been forwarded to the police for further investigation. The authorities will review your submission and take appropriate action. You will receive updates as the case progresses. Thank you for helping keep our community safe.`;
      
      await notifyUserCrimeStatus(
        crime.userId._id,
        crime._id,
        reporterMessage
      );
      
      // Send email to reporter
      if (crime.userId.email) {
        sendCrimeAlertEmail(crime.userId, crime, reporterMessage).catch((err) =>
          console.error(`Forward notification email failed for ${crime.userId.email}:`, err.message)
        );
      }
      
      console.log(`✅ Reporter notified: ${crime.userId.email}`);
    }

    // 2. Real-time notification to POLICE (urgent - new case assigned)
    await Crime.findByIdAndUpdate(crime._id, {
      "workflow.assignedToOfficer": assignedOfficerId,
      "workflow.assignedAt": new Date()
    });

    // Get the assigned officer details
    const officer = await User.findById(assignedOfficerId).select("email username name");
    
    if (officer) {
      const assignedMessage = `🚨 New case has been assigned to you: "${crime.title}" (${crime.crimeType}). The report has been verified by admin and is ready for your investigation. Please check your dashboard for full details and evidence.`;

      // Create in-app notification for assigned officer (DB + realtime socket)
      await notifyUserCrimeStatus(assignedOfficerId, crime._id, assignedMessage, "police_alert");

      // Email notification ONLY to the assigned officer
      if (officer.email) {
        await sendCrimeAlertEmail(officer, crime, assignedMessage).catch(err => 
          console.error(`Email failed for officer ${officer.email}:`, err.message)
        );
      }
      
      console.log(`✅ Case forwarded to officer: ${officer.username || officer.name} (${officer.email})`);
    }

    // 4. Send crime alert to nearby citizens
    try {
      const citizenAlertMessage = `🚨 Crime Alert: A new incident has been reported in your area. The case has been forwarded to authorities for review. For your safety, stay alert, be cautious while traveling, avoid isolated places, and report any suspicious activity immediately.`;
      
      // Find nearby citizens within 10km
      const nearbyCitizens = await User.find({
        role: "user",
        isOtpVerified: true,
        location: {
          $near: {
            $geometry: { type: "Point", coordinates: crime.location.coordinates },
            $maxDistance: 10000 // 10km
          }
        }
      }).select("_id email username");

      if (nearbyCitizens.length > 0) {
        // Send notifications to nearby citizens
        const citizenIds = nearbyCitizens.map(c => c._id);
        await bulkNotify(citizenIds, crime._id, citizenAlertMessage, "citizen_alert");

        // Send real-time notifications and emails
        const io = getIO();
        nearbyCitizens.forEach(citizen => {
          // Real-time dashboard notification
          if (io) {
            io.to(`user_${citizen._id}`).emit("new_notification", {
              type: "citizen_alert",
              crimeId: crime._id,
              title: "Crime Alert",
              message: citizenAlertMessage,
              priority: "high",
              timestamp: new Date().toISOString()
            });
          }

          // Email alert
          sendCrimeAlertEmail(citizen, crime, citizenAlertMessage)
            .catch(err => console.error(`❌ Citizen alert email failed: ${citizen.email}`, err.message));
        });

        console.log(`✅ Crime alert sent to ${nearbyCitizens.length} nearby citizens`);
      }
    } catch (citizenAlertError) {
      console.error("⚠️ Citizen alert failed:", citizenAlertError.message);
    }

    const io = getIO();

    if (io) {
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = {};
    if (req.user?.role === "police") {
      query = { "workflow.assignedToOfficer": req.user._id };
    }
    
    // Support server-side filtering
    if (req.query.status && req.query.status !== "All") {
      query.status = req.query.status;
    }
    
    // Support server-side searching
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: "i" } },
        { description: { $regex: req.query.search, $options: "i" } }
      ];
    }

    const total = await Crime.countDocuments(query);
    const crimes = await Crime.find(query)
      .populate("userId", "email role username")
      .populate("workflow.assignedToOfficer", "username email stationDistrict")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.json({ 
      success: true, 
      crimes,
      totalItems: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
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
    const crimes = await Crime.find({ userId: req.user._id })
      .populate("workflow.assignedToOfficer", "username email stationDistrict")
      .sort({ createdAt: -1 });
    return res.json({ success: true, crimes });
  } catch (error) {
    console.error("getMyCrimes error:", error);
    return res.status(500).json({ error: "Server error", details: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// GET MAP DATA (Role-Based Global Reports)
// ─────────────────────────────────────────────────────────────────
export const getMapData = async (req, res) => {
  try {
    const userRole = req.user?.role;
    let query = {};
    
    if (userRole === "police") {
      // Police should ONLY see reports specifically assigned to them that are in active/resolved investigation states
      query = { 
        status: { $in: ["ForwardedToPolice", "UnderInvestigation", "Resolved"] },
        "workflow.assignedToOfficer": req.user._id 
      };
    } else if (userRole === "admin") {
      query.status = { $ne: "Pending" };
    } else {
      query["notificationsSent.community"] = true;
    }

    const reports = await Crime.find(query)
      .select("-evidence.publicId -workflow.verificationNotes")
      .populate("userId", "username")
      .sort({ createdAt: -1 })
      .limit(100); 

    const sanitizedReports = reports.map(r => {
      const obj = r.toObject();
      if (obj.isAnonymous) obj.userId = { username: "Anonymous" };
      return obj;
    });

    return res.json({ success: true, reports: sanitizedReports });
  } catch (error) {
    console.error("getMapData error:", error);
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
    // Only show reports that the admin has officially broadcasted as a community alert
    const reports = await Crime.find({ 
      "notificationsSent.community": true,
      status: { $in: ["Verified", "ForwardedToPolice", "UnderInvestigation", "Resolved"] }
    })
      .select("-evidence.publicId -workflow.verificationNotes") 
      .populate("userId", "username") 
      .sort({ updatedAt: -1 });

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

    const userRole = req.user?.role;
    let statusFilter = { $ne: "Pending" };

    if (userRole === "police") {
      statusFilter = { $in: ["ForwardedToPolice", "UnderInvestigation", "Resolved"] };
    } else if (userRole === "user") {
      // For general users, nearby reports should follow public feed rules (admin alerts)
      statusFilter = { "notificationsSent.community": true };
    }

    const reports = await Crime.find({
      "location.coordinates": {
        $near: {
          $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius),
        },
      },
      status: statusFilter
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
    
    // ── SECURITY CLEARANCE CHECK ─────────────────────────────────
    // Allow if: User is Admin, User is Police, OR User is the original reporter
    const isStaff = ["admin", "police"].includes(req.user.role);
    const isOwner = crime.userId && crime.userId._id?.toString() === req.user._id?.toString();
    
    if (!isStaff && !isOwner) {
      console.warn(`🔒 Unauthorized detail access attempt: User ${req.user._id} on Case ${id}`);
      return res.status(403).json({ error: "Insufficient security clearance to view full intelligence data." });
    }

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

    const caseLat = Number(crime.location?.lat);
    const caseLng = Number(crime.location?.lng);
    const hasCaseCoordinates = Number.isFinite(caseLat) && Number.isFinite(caseLng);
    
    // Find all police officers
    const policeOfficers = await User.find({ 
      role: "police",
      isOtpVerified: true,
      $or: [
        { "policeVerification.status": "approved" },
        { policeVerification: { $exists: false } },
        { "policeVerification.status": { $in: [null, "none"] } },
      ],
    }).select("username name email stationDistrict stationLocation");

    const policeWithDistances = policeOfficers
      .map((police) => {
        const stationLat = Number(police.stationLocation?.lat);
        const stationLng = Number(police.stationLocation?.lng);
        const hasStationCoordinates =
          Number.isFinite(stationLat) && Number.isFinite(stationLng);

        if (!hasCaseCoordinates || !hasStationCoordinates) {
          return {
            ...police.toObject(),
            distanceKm: null,
            distanceText: "Distance unavailable",
          };
        }

        const distanceKm = haversineDistanceKm(caseLat, caseLng, stationLat, stationLng);
        return {
          ...police.toObject(),
          distanceKm,
          distanceText: formatDistance(distanceKm),
        };
      })
      .sort((a, b) => {
        if (a.distanceKm === null && b.distanceKm === null) return 0;
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      });

    res.json({
      success: true,
      count: policeWithDistances.length,
      policeOfficers: policeWithDistances.slice(0, 10),
    });
  } catch (error) {
    console.error("getNearbyPolice error:", error);
    res.status(500).json({ error: "Failed to find officers" });
  }
};

// ─────────────────────────────────────────────────────────────────
// GET NEARBY CITIZENS (Admin Console Feature)
// @desc    Find all citizens within radius of a specific crime
// @route   GET /api/report/:id/nearby-citizens
// ─────────────────────────────────────────────────────────────────
export const getNearbyCitizens = async (req, res) => {
  try {
    const crime = await Crime.findById(req.params.id);
    if (!crime) return res.status(404).json({ error: "Case not found" });

    const radius = parseInt(req.query.radius) || 20000; // Default 20km
    
    // Find all verified citizens (users with role 'user')
    // Since most citizens don't have location saved, we'll get all verified users
    // and the broadcast will notify them all (or you can implement location tracking)
    const nearbyCitizens = await User.find({
      role: "user",
      isOtpVerified: true
    }).select("username name email stationLocation stationDistrict").limit(100);

    // If crime has location and users have location, calculate distance
    const citizensWithDistance = [];
    
    if (crime.location?.lat && crime.location?.lng) {
      for (const citizen of nearbyCitizens) {
        let distance = null;
        let distanceText = "Location not set";
        
        // Check if citizen has location data
        if (citizen.stationLocation?.coordinates && citizen.stationLocation.coordinates.length === 2) {
          const [citLng, citLat] = citizen.stationLocation.coordinates;
          if (citLat && citLng) {
            // Calculate distance using Haversine formula
            const R = 6371e3; // Earth's radius in meters
            const φ1 = crime.location.lat * Math.PI/180;
            const φ2 = citLat * Math.PI/180;
            const Δφ = (citLat - crime.location.lat) * Math.PI/180;
            const Δλ = (citLng - crime.location.lng) * Math.PI/180;

            const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                      Math.cos(φ1) * Math.cos(φ2) *
                      Math.sin(Δλ/2) * Math.sin(Δλ/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            distance = R * c;
            
            if (distance <= radius) {
              const km = (distance / 1000).toFixed(1);
              distanceText = `${km} km away`;
              
              citizensWithDistance.push({
                ...citizen.toObject(),
                distance,
                distanceText
              });
            }
          }
        } else {
          // Include citizens without location (they'll still get notified)
          citizensWithDistance.push({
            ...citizen.toObject(),
            distance: null,
            distanceText: "Distance unknown"
          });
        }
      }
      
      // Sort by distance (those with location first, then by distance)
      citizensWithDistance.sort((a, b) => {
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    } else {
      // If crime has no location, return all citizens
      citizensWithDistance.push(...nearbyCitizens.map(c => ({
        ...c.toObject(),
        distance: null,
        distanceText: "Crime location not set"
      })));
    }

    return res.json({
      success: true,
      count: citizensWithDistance.length,
      citizens: citizensWithDistance
    });
  } catch (error) {
    console.error("getNearbyCitizens error:", error);
    return res.status(500).json({ error: "Search failed" });
  }
};

// ─────────────────────────────────────────────────────────────────
// SEND MANUAL SAFE ALERT (Admin Manual Action)
// @desc    Admin manually triggers a SAFE ALERT to specific users or all nearby
// @route   POST /api/report/:id/broadcast-safe-alert
// ─────────────────────────────────────────────────────────────────
export const sendManualSafeAlert = async (req, res) => {
  try {
    const { customMessage } = req.body;
    let { citizenIds } = req.body;
    const crime = await Crime.findById(req.params.id);
    if (!crime) return res.status(404).json({ error: "Case not found" });

    // 1. If no specific citizens selected, automatically find all un-notified users in 10km zone
    if (!citizenIds || !citizenIds.length) {
      const nearby = await User.find({
        role: "user",
        _id: { $ne: crime.userId }, // Exclude the original reporter
        location: {
          $near: {
            $geometry: { type: "Point", coordinates: crime.location.coordinates },
            $maxDistance: 20000 // 20km
          }
        }
      }).select("_id email username");
      
      citizenIds = nearby.map(u => u._id);
      
      if (!citizenIds.length) {
        return res.status(200).json({ success: true, notifiedCount: 0, msg: "No citizens identified in the alert zone." });
      }
    }

    const safeAlertMessage = customMessage || `🚨 Crime Alert: A new incident has been reported in your area. The case has been forwarded to authorities for review. For your safety, stay alert, be cautious while traveling, avoid isolated places, and report any suspicious activity immediately.`;

    // 2. Bulk Database Notifications
    await bulkNotify(citizenIds, crime._id, safeAlertMessage, "citizen_alert");

    // 3. Real-time Dispatch (Email + Socket)
    const io = getIO();
    const citizens = await User.find({ _id: { $in: citizenIds } }, "email username");

    citizens.forEach(citizen => {
      // Real-time Dashboard Popup
      if (io) {
        io.to(`user_${citizen._id}`).emit("new_notification", {
          type: "safe_alert",
          crimeId: crime._id,
          title: "SAFE ALERT",
          message: safeAlertMessage,
          priority: "high",
          timestamp: new Date().toISOString()
        });
      }

      // Email Alert
      sendCrimeAlertEmail(citizen, crime, safeAlertMessage)
        .catch(err => console.error(`❌ Safe Alert email failed: ${citizen.email}`, err.message));
    });

    // 4. Mark crime as community-notified
    await Crime.findByIdAndUpdate(crime._id, { "notificationsSent.community": true });

    return res.json({
      success: true,
      msg: `Safety broadcast successfully dispatched to ${citizens.length} citizens in the vicinity.`,
      notifiedCount: citizens.length
    });
  } catch (error) {
    console.error("sendManualSafeAlert error:", error);
    return res.status(500).json({ error: "Emergency broadcast failed" });
  }
};

// ─────────────────────────────────────────────────────────────────
// BROADCAST COMMUNITY ALERT (Admin Action)
// @desc    Notify ALL verified citizens about a dangerous/critical incident
// @route   POST /api/report/:id/broadcast-community-alert
// ─────────────────────────────────────────────────────────────────
export const broadcastCommunityAlert = async (req, res) => {
  try {
    const { customMessage } = req.body;
    const crime = await Crime.findById(req.params.id);
    if (!crime) return res.status(404).json({ error: "Case not found" });

    // 1. Target all verified users
    const verifiedUsers = await User.find({ role: "user", isOtpVerified: true }, "_id email username");
    if (!verifiedUsers.length) {
      return res.status(400).json({ error: "No verified citizens found in database." });
    }

    const alertTitle = `🚨 CRIME ALERT`;
    const alertMessage = customMessage || `🚨 Crime Alert: A new incident has been reported in your area. The case has been forwarded to authorities for review. For your safety, stay alert, be cautious while traveling, avoid isolated places, and report any suspicious activity immediately.`;

    // 2. Prepare bulk notifications (Database)
    const userIds = verifiedUsers.map(u => u._id);
    await bulkNotify(userIds, crime._id, alertMessage, "citizen_alert");

    // 3. Real-time Broadcasting (Email + Socket)
    const io = getIO();
    
    // Broadcast to the whole users room via socket for immediate impact
    if (io) {
      io.to("users_room").emit("new_notification", {
        type: "citizen_alert",
        crimeId: crime._id,
        title: "CRITICAL SAFETY ALERT",
        message: alertMessage,
        priority: "critical",
        timestamp: new Date().toISOString()
      });
    }

    // Individual Emails (Processed in background to avoid blocking response)
    verifiedUsers.forEach(user => {
      sendCrimeAlertEmail(user, crime, alertMessage)
        .catch(err => console.error(`❌ Community Alert email failed: ${user.email}`, err.message));
    });

    // 4. Mark crime record with persistent notification flag
    await Crime.findByIdAndUpdate(crime._id, { "notificationsSent.community": true });

    console.log(`📡 Community-wide alert issued for ${crime._id} to ${verifiedUsers.length} users`);

    return res.json({
      success: true,
      msg: `Critical community alert successfully issued to ${verifiedUsers.length} verified citizens.`,
      notifiedCount: verifiedUsers.length
    });
  } catch (error) {
    console.error("broadcastCommunityAlert error:", error);
    return res.status(500).json({ error: "Community broadcast failed" });
  }
};

// ─────────────────────────────────────────────────────────────────
// GET ALERT QUEUE (Admin Dashboard Feature)
// @desc    Find verified crimes that haven't been broadcast to community yet
// ─────────────────────────────────────────────────────────────────
export const getAlertQueue = async (req, res) => {
  try {
    const queue = await Crime.find({
      status: "Verified",
      "notificationsSent.community": false
    })
    .sort({ createdAt: -1 })
    .populate("userId", "username email");

    // Enhance queue with nearby citizen count
    const enhancedQueue = await Promise.all(queue.map(async (crime) => {
      let nearbyCount = 0;
      if (crime.location && crime.location.coordinates) {
        nearbyCount = await User.countDocuments({
          role: "user",
          location: {
            $near: {
              $geometry: { type: "Point", coordinates: crime.location.coordinates },
              $maxDistance: 10000 // 10km
            }
          }
        });
      }
      return { ...crime.toObject(), nearbyCitizenCount: nearbyCount };
    }));

    return res.json({ success: true, count: enhancedQueue.length, queue: enhancedQueue });
  } catch (error) {
    console.error("getAlertQueue error:", error);
    res.status(500).json({ error: "Failed to fetch alert queue" });
  }
};