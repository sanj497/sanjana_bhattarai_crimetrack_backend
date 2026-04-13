import Complaint from "../Models/Complaint.js";

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