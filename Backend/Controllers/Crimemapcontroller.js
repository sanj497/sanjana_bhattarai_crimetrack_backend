import CrimeReport from "../Models/Crimereport.js";
import axios from "axios";

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