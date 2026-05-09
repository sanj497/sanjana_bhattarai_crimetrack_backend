import Complaint from "../Models/Complaint.js";
import User from "../Models/usermodel.js";
import Notification from "../Models/Notification.js";
import { sendComplaintEmail } from "../utils/email.js";
import { getIO } from "../socket.js";

// ─── USER: Submit a new complaint ───────────────────────────────────────────
export const submitComplaint = async (req, res) => {
  try {
    const { title, description, category, location } = req.body;

    const complaint = await Complaint.create({
      userId: req.user._id,
      title,
      description,
      category,
      location,
      status: "Pending",
      statusHistory: [
        {
          status: "Pending",
          changedBy: req.user._id,
          note: "Complaint submitted by user.",
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Complaint submitted successfully.",
      complaint,
    });

    // ── PROFESSIONAL BROADCAST: Notify Admins ────────────────────────
    try {
      const adminUsers = await User.find({ role: "admin" }, "_id email username");
      const adminIds = adminUsers.map(a => a._id);
      
      const message = `📨 New Complaint Filed: "${title}" by ${req.user.username}`;
      const io = getIO();

      // 1. In-App Bulk Notification
      if (adminIds.length > 0) {
        const docs = adminIds.map(adminId => ({
          userId: adminId,
          message,
          type: "complaint"
        }));
        await Notification.insertMany(docs, { ordered: false });
      }

      // 2. Socket.io Real-time
      if (io) {
        io.to("admin_room").emit("new_notification", {
          type: "complaint",
          title: title,
          message,
          timestamp: new Date().toISOString()
        });
      }

      // 3. Email Alert to Admins
      for (const admin of adminUsers) {
        await sendComplaintEmail(admin, complaint, message)
          .catch(err => console.error("Admin complaint email failed:", err.message));
      }

    } catch (err) {
      console.error("Complaint notification failed:", err.message);
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── USER: Get all complaints by logged-in user ──────────────────────────────
export const getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .select("title category status createdAt updatedAt");

    res.status(200).json({ success: true, count: complaints.length, complaints });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── USER: Track status of a single complaint ────────────────────────────────
export const trackComplaintStatus = async (req, res) => {
  try {
    const complaint = await Complaint.findOne({
      _id: req.params.id,
      userId: req.user._id,
    })
      .populate("assignedOfficer", "name email")
      .select("title category status statusHistory assignedOfficer createdAt");

    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found." });
    }

    res.status(200).json({ success: true, complaint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ADMIN/POLICE: Get all complaints ───────────────────────────────────────
export const getAllComplaints = async (req, res) => {
  try {
    const { status, category } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    const complaints = await Complaint.find(filter)
      .populate("userId", "name email")
      .populate("assignedOfficer", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: complaints.length, complaints });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ADMIN/POLICE: Update complaint status ───────────────────────────────────
export const updateComplaintStatus = async (req, res) => {
  try {
    const { status, note, assignedOfficer } = req.body;

    const validStatuses = ["Pending", "Verified", "In Progress", "Solved"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value." });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found." });
    }

    complaint.statusHistory.push({
      status,
      changedBy: req.user._id,
      note: note || `Status updated to ${status}.`,
    });

    complaint.status = status;
    if (assignedOfficer) complaint.assignedOfficer = assignedOfficer;

    await complaint.save();
    
    // ── PROFESSIONAL BROADCAST: Notify User ────────────────────────
    try {
      const user = await User.findById(complaint.userId);
      if (user && user.email) {
        const updateMessage = `✅ Your complaint status has been updated to "${status}". ${note || ""}`;
        await sendComplaintEmail(user, complaint, updateMessage)
          .catch(err => console.error("User complaint update email failed:", err.message));
      }
    } catch (notifErr) {
      console.error("User status notification failed:", notifErr.message);
    }

    res.status(200).json({
      success: true,
      message: `Complaint status updated to "${status}".`,
      complaint,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ADMIN: Delete a complaint ───────────────────────────────────────────────
export const deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndDelete(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found." });
    }
    res.status(200).json({ success: true, message: "Complaint deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ADMIN: Get nearby police officers for a complaint ────────────────────────
export const getNearbyPolice = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found." });
    }

    const complaintAddress = complaint.location?.address || "";
    
    // Simple logic: Find police whose stationDistrict is mentioned in or matches the complaint address
    // In a real app, you'd use geospatial queries or a defined mapping.
    // Here we'll search for police where stationDistrict is a substring of complaintAddress or vice versa.
    
    const policeOfficers = await User.find({
      role: "police",
      stationDistrict: { $ne: null }
    }).select("username email stationDistrict");

    // Filter by matching district (case-insensitive)
    const matchedPolice = policeOfficers.filter(police => {
      const district = police.stationDistrict.toLowerCase();
      const address = complaintAddress.toLowerCase();
      return address.includes(district) || district.includes(address);
    });

    res.status(200).json({
      success: true,
      count: matchedPolice.length,
      policeOfficers: matchedPolice
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};