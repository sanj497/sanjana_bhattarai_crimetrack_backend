import Complaint from "../Models/Complaint.js";
import User from "../Models/usermodel.js";
import Notification from "../Models/Notification.js";
import { transporter } from "../utils/email.js";
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
      adminUsers.forEach(admin => {
        transporter.sendMail({
          from: `"CrimeTrack Complaints" <${process.env.EMAIL_USER}>`,
          to: admin.email,
          subject: "📬 New User Complaint Submitted",
          html: `
            <div style="font-family: sans-serif; padding: 24px; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
              <h2 style="color: #4f46e5; margin-bottom: 16px;">New Complaint Received</h2>
              <p style="color: #374151;">A new user complaint has been submitted and requires review.</p>
              <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4f46e5;">
                <p><strong>Title:</strong> ${title}</p>
                <p><strong>Category:</strong> ${category}</p>
                <p><strong>Submitted by:</strong> ${req.user.username} (${req.user.email})</p>
                <p><strong>Description:</strong> ${description}</p>
              </div>
              <p style="font-size: 13px; color: #6b7280;">Please log in to the admin dashboard to take action.</p>
            </div>
          `
        }).catch(err => console.error("Admin complaint email failed:", err.message));
      });

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