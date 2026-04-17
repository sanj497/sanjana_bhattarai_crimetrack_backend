import SosAlert from "../Models/sosalert.js";
import { getIO } from "../socket.js";
import User from "../Models/usermodel.js";
import { sendSOSEmail } from "../utils/email.js";
import Emergencycontact from "../Models/Emergencycontact.js";

// @desc    Trigger a new SOS alert
// @route   POST /api/emergency/sos
export const sendSOS = async (req, res) => {
  try {
    const { latitude, longitude, accuracy, timestamp } = req.body;
    const userId = req.user ? req.user._id : null;

    const alert = await SosAlert.create({
      userId,
      latitude: latitude || null,
      longitude: longitude || null,
      accuracy: accuracy || null,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      status: "active",
      trackingHistory: latitude && longitude ? [{ latitude, longitude, accuracy }] : [],
      message: " EMERGENCY SOS TRIGGERED",
    });

    // Get police contacts for immediate notification
    const policeContacts = await Emergencycontact.find({ category: 'police' });
    
    // Notify Police/Admin via Socket.io with enhanced priority
    const io = getIO();
    if (io) {
      const alertData = {
        id: alert._id,
        user: req.user ? { name: req.user.name, email: req.user.email, phone: req.user.phone } : "Anonymous",
        location: { latitude, longitude, accuracy },
        timestamp: alert.timestamp,
        status: "active",
        priority: "CRITICAL",
        type: "EMERGENCY_SOS",
        policeContacts: policeContacts.map(c => ({ name: c.name, number: c.number })),
        requiresImmediateResponse: true
      };
      
      // Send to police room with high priority
      io.to("police_room").emit("critical_sos_alert", alertData);
      
      // Also send general notification for backup systems
      io.to("police_room").emit("new_sos_alert", alertData);
      
      console.log(` CRITICAL SOS ALERT: User ${req.user?.name || 'Anonymous'} at ${latitude}, ${longitude}`);
    }

    // Notify Personal Guardians
    if (req.user && req.user.guardians && req.user.guardians.length > 0) {
      req.user.guardians.forEach(guardian => {
        sendSOSEmail(guardian, req.user, { latitude, longitude, accuracy });
      });
    }
    
    // Auto-call nearest police station if location is available
    if (latitude && longitude && policeContacts.length > 0) {
      console.log(` Auto-dialing nearest police: ${policeContacts[0].number}`);
      // In a real implementation, this would integrate with an automated calling system
      // For now, we'll log it and include in the response
    }

    res.status(201).json({
      success: true,
      message: " CRITICAL SOS ALERT DISPATCHED! Police, admins, and guardians have been notified with your live location.",
      alertId: alert._id,
      priority: "CRITICAL",
      policeNotified: policeContacts.length > 0,
      requiresImmediateResponse: true
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update live location during an active SOS
// @route   POST /api/emergency/sos/:id/track
export const trackSosLocation = async (req, res) => {
  try {
    const { latitude, longitude, accuracy } = req.body;
    const alert = await SosAlert.findById(req.params.id);

    if (!alert) return res.status(404).json({ success: false, message: "Alert not found" });
    if (alert.status !== "active") return res.status(400).json({ success: false, message: "SOS session is no longer active" });

    alert.trackingHistory.push({ latitude, longitude, accuracy });
    alert.latitude = latitude;
    alert.longitude = longitude;
    alert.accuracy = accuracy;
    await alert.save();

    // Broadcast update to responders
    const io = getIO();
    if (io) {
      io.to("police_room").emit("sos_location_update", {
        id: alert._id,
        location: { latitude, longitude, accuracy }
      });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update SOS status (Resolved/Acknowledged)
// @route   PATCH /api/emergency/sos/:id
export const updateSOSStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const alert = await SosAlert.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!alert) return res.status(404).json({ success: false, message: "Alert not found" });

    res.status(200).json({ success: true, data: alert });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Get all SOS alerts
// @route   GET /api/emergency/sos
export const getAllSOS = async (req, res) => {
  try {
    // ✅ Pagination params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    const skip = (page - 1) * limit;

    // ✅ Total alerts
    const total = await SosAlert.countDocuments();

    // ✅ Paginated data
    const sosList = await SosAlert.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "name email phone");

    res.status(200).json({
      success: true,
      data: sosList,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};