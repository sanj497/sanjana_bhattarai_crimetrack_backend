import CrimeReport from "../Models/Crimereport.js";
import User from "../Models/usermodel.js";
import Notification from "../Models/Notification.js";
import { sendCrimeAlertEmail } from "../utils/email.js";
import { getIO } from "../socket.js";
import axios from "axios";

// Helper function for bulk notifications
const bulkNotify = async (userIds, crimeId, message, type = "personal") => {
  const expiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days
  const docs = userIds.map((userId) => ({ userId, crimeId, message, type, expiresAt }));
  await Notification.insertMany(docs, { ordered: false });
};

// Helper: Reverse geocode using Google Maps API
const reverseGeocode = async (lat, lng) => {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json`,
      {
        params: {
          latlng: `${lat},${lng}`,
          key: process.env.GOOGLE_MAPS_API_KEY,
        },
      }
    );
    if (response.data.results.length > 0) {
      return response.data.results[0].formatted_address;
    }
    return "Unknown location";
  } catch (err) {
    console.error("Geocoding error:", err.message);
    return "Unknown location";
  }
};

// Helper: Simulate alerting police (replace with actual SMS/email API)
const alertPolice = async (report) => {
  // In production: integrate Twilio, SendGrid, or your department's API
  console.log(`🚨 POLICE ALERT: New ${report.severity} crime report`);
  console.log(`   Type: ${report.crimeType}`);
  console.log(`   Location: ${report.address}`);
  console.log(
    `   Coords: ${report.location.coordinates[1]}, ${report.location.coordinates[0]}`
  );
  console.log(`   Report ID: ${report._id}`);
  // Return true to simulate success
  return true;
};

// @desc    Submit a new crime report with user location
// @route   POST /api/crime-reports
// @access  Private
export const submitCrimeReport = async (req, res) => {
  try {
    const {
      crimeType,
      description,
      latitude,
      longitude,
      severity,
      isAnonymous,
    } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Location coordinates are required.",
      });
    }

    // Reverse geocode to get human-readable address
    const address = await reverseGeocode(latitude, longitude);

    // Create the report
    const report = await CrimeReport.create({
      reportedBy: req.user._id,
      crimeType,
      description,
      severity: severity || "Medium",
      isAnonymous: isAnonymous || false,
      address,
      location: {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)], // GeoJSON: [lng, lat]
      },
    });

    // Auto-alert police for High or Critical severity
    if (severity === "High" || severity === "Critical") {
      const alerted = await alertPolice(report);
      if (alerted) {
        report.policeAlerted = true;
        report.policeAlertedAt = new Date();
        await report.save();
      }
    }

    res.status(201).json({
      success: true,
      message: "Crime report submitted successfully.",
      data: report,
    });

    // ── TARGETED PROXIMITY NOTIFICATIONS (Professional Workflow) ─────────────
    try {
      console.log("🔔 Processing targeted alerts for map incident...");
      
      // 1. Find all Admins/Police (Global safety stakeholders)
      const staff = await User.find(
        { role: { $in: ["admin", "police"] }, isOtpVerified: true },
        "_id email role"
      );
      
      // 2. Find NEARBY Citizens (within 5km of the incident)
      const nearbyCitizens = await User.find({
        role: "user",
        isOtpVerified: true,
        _id: { $ne: req.user._id }, // Don't notify the reporter in the broad alert
        "stationLocation.coordinates": {
           $near: {
             $geometry: { type: "Point", coordinates: [parseFloat(longitude), parseFloat(latitude)] },
             $maxDistance: 5000 // 5km Radius
           }
        }
      }, "_id email role");

      const adminIds = staff.filter(u => u.role === "admin").map(u => u._id);
      const policeIds = staff.filter(u => u.role === "police").map(u => u._id);
      const citizenIds = nearbyCitizens.map(u => u._id);

      console.log(`🎯 Targeted Broadcast: ${adminIds.length} admins, ${policeIds.length} police, ${citizenIds.length} nearby citizens.`);

      const adminMessage = `🚨 NEW MAP REPORT: ${report.crimeType} at ${report.address}`;
      const safeAlertMessage = `🛡️ SAFE ALERT: A ${report.crimeType} has been reported within 5km of your location on the community map. Authorities have been alerted. Please stay vigilant.`;

      // 3. In-App Notifications (Bulk)
      if (adminIds.length) await bulkNotify(adminIds, report._id, adminMessage, "admin_alert");
      if (policeIds.length) await bulkNotify(policeIds, report._id, `📋 New Map Incident: ${report.crimeType} at ${report.address}`, "police_alert");
      if (citizenIds.length) await bulkNotify(citizenIds, report._id, safeAlertMessage, "citizen_alert");

      // 4. Socket.io targeted delivery
      const io = getIO();
      if (io) {
        // Notify Admins & Police (Global/Room based)
        io.to("admin_room").emit("new_notification", { type: "map_report", message: adminMessage });
        io.to("police_room").emit("new_notification", { type: "map_report", message: `📋 New Case: ${report.crimeType}` });

        // Notify Nearby Users individually for accurate dashboard syncing
        citizenIds.forEach(id => {
          io.to(`user_${id}`).emit("new_notification", {
            type: "safe_alert",
            message: safeAlertMessage,
            timestamp: new Date().toISOString()
          });
        });
      }

      // 5. Confirmation to Reporter (In-app + Email)
      await Notification.create({
        userId: req.user._id,
        crimeId: report._id,
        message: "✅ Your report has been pinned to the community map. Nearby citizens have been alerted.",
        type: "personal",
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      });
      
      sendCrimeAlertEmail(req.user, {
        title: report.crimeType,
        crimeType: report.crimeType,
        description: report.description,
        location: { address: report.address },
        priority: report.severity || "Medium",
        _id: report._id
      }, "✅ Your map-based report has been received. Thank you for helping keep the community safe.").catch(e => console.error("Map reporter confirmation failed:", e.message));

      // 6. Targeted Emails
      staff.forEach(user => {
        sendCrimeAlertEmail(user, {
          title: report.crimeType,
          crimeType: report.crimeType,
          location: { address: report.address },
          priority: report.severity || "Medium",
          _id: report._id
        }, adminMessage).catch(e => {});
      });

      nearbyCitizens.forEach(user => {
        sendCrimeAlertEmail(user, {
          title: report.crimeType,
          crimeType: report.crimeType,
          location: { address: report.address },
          priority: report.severity || "Medium",
          _id: report._id
        }, safeAlertMessage).catch(e => {});
      });

    } catch (err) {
      console.error("Broadcast failed for map report:", err.message);
    }
  } catch (err) {
    console.error("submitCrimeReport error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// @desc    Manually alert police for a specific report
// @route   POST /api/crime-reports/:id/alert-police
// @access  Private
export const alertPoliceManually = async (req, res) => {
  try {
    const report = await CrimeReport.findById(req.params.id);

    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Report not found." });
    }

    if (report.policeAlerted) {
      return res.status(400).json({
        success: false,
        message: "Police have already been alerted for this report.",
      });
    }

    const alerted = await alertPolice(report);

    if (alerted) {
      report.policeAlerted = true;
      report.policeAlertedAt = new Date();
      await report.save();
    }

    res.status(200).json({
      success: true,
      message: "Police have been alerted.",
      data: report,
    });
  } catch (err) {
    console.error("alertPoliceManually error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// @desc    Get all crime reports (with optional radius filter)
// @route   GET /api/crime-reports
// @access  Private
export const getAllReports = async (req, res) => {
  try {
    const { latitude, longitude, radius } = req.query;

    let query = {};

    // If coordinates are provided, filter by radius (meters)
    if (latitude && longitude) {
      query = {
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [parseFloat(longitude), parseFloat(latitude)],
            },
            $maxDistance: parseInt(radius) || 5000, // Default 5km
          },
        },
      };
    }

    const reports = await CrimeReport.find(query)
      .populate("reportedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (err) {
    console.error("getAllReports error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// @desc    Get single report by ID
// @route   GET /api/crime-reports/:id
// @access  Private
export const getReportById = async (req, res) => {
  try {
    const report = await CrimeReport.findById(req.params.id).populate(
      "reportedBy",
      "name email"
    );

    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Report not found." });
    }

    res.status(200).json({ success: true, data: report });
  } catch (err) {
    console.error("getReportById error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// @desc    Update report status
// @route   PATCH /api/crime-reports/:id/status
// @access  Private (Admin/Police)
export const updateReportStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["Pending", "Acknowledged", "In Progress", "Resolved"];

    if (!validStatuses.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status value." });
    }

    const report = await CrimeReport.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Report not found." });
    }

    // ── PROFESSIONAL CLEANUP: Mark alerts as read if map report is resolved ──
    if (status === "Resolved") {
      try {
        await Notification.updateMany(
          { crimeId: report._id, type: "citizen_alert", isRead: false },
          { isRead: true }
        );
        console.log(`✅ Marked map citizen alerts as read for resolved report: ${report._id}`);
      } catch (cleanupError) {
        console.error("Map cleanup error:", cleanupError.message);
      }
    }

    res.status(200).json({ success: true, data: report });
  } catch (err) {
    console.error("updateReportStatus error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// @desc    Delete a crime report
// @route   DELETE /api/crime-reports/:id
// @access  Private
export const deleteReport = async (req, res) => {
  try {
    const report = await CrimeReport.findByIdAndDelete(req.params.id);

    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Report not found." });
    }

    res
      .status(200)
      .json({ success: true, message: "Report deleted successfully." });
  } catch (err) {
    console.error("deleteReport error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};