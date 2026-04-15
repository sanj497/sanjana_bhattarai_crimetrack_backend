import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Complaint title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Complaint description is required"],
    },
    category: {
      type: String,
      enum: ["Theft", "Assault", "Vandalism", "Fraud", "Other"],
      default: "Other",
    },
    location: {
      address: { type: String },
      latitude: { type: Number },
      longitude: { type: Number },
    },
    status: {
      type: String,
      enum: ["Pending", "Verified", "In Progress", "Solved"],
      default: "Pending",
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: ["Pending", "Verified", "In Progress", "Solved"],
        },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        note: { type: String },
        changedAt: { type: Date, default: Date.now },
      },
    ],
    assignedOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    evidenceFiles: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model("Complaint", complaintSchema);