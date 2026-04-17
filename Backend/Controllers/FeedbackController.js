import mongoose from "mongoose";
import Feedback from "../Models/Feedback.js";

// Submit feedback (guest)
export const submitGuestFeedback = async (req, res) => {
  try {
    const { name, email, message, rating } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    const feedback = await Feedback.create({ name, email, message, rating });
    res.status(201).json({ success: true, feedback });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// Submit feedback (authenticated user)
export const submitAuthFeedback = async (req, res) => {
  try {
    const { message, rating, crimeId, policeId } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    const payload = {
      userId: req.user.id,
      message,
      rating,
    };

    if (crimeId) payload.crimeId = crimeId;
    if (policeId) payload.policeId = policeId;

    const feedback = await Feedback.create(payload);
    res.status(201).json({ success: true, feedback });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// Get all feedback (admin only)
export const getAllFeedback = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Feedback.countDocuments({});
    const feedbacks = await Feedback.find({})
      .populate("userId", "email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ 
      success: true, 
      feedbacks,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// Delete feedback (admin only)
export const deleteFeedback = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid feedback ID" });
    }

    const deleted = await Feedback.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: "Feedback not found" });
    }

    res.json({ success: true, message: "Feedback deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};