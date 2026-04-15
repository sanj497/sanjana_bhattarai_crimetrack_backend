// Crime Report Model - Professional Workflow
import mongoose from "mongoose";

const crimeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    isAnonymous: { type: Boolean, default: false },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    crimeType: { type: String, required: true },
    location: {
      address: { type: String, required: true },
      lat: { type: Number },
      lng: { type: Number },
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: "2dsphere",
      },
    },
    evidence: [
      {
        url: String,
        publicId: String,
        resourceType: { type: String, default: "image" },
      },
    ],

    // ═══════════════════════════════════════════════════════════
    // PROFESSIONAL WORKFLOW STATUS TRACKING
    // ═══════════════════════════════════════════════════════════
    status: {
      type: String,
      enum: ["Pending", "Verified", "Rejected", "ForwardedToPolice", "UnderInvestigation", "Resolved"],
      default: "Pending",
    },

    // Workflow tracking fields
    workflow: {
      // Admin verification stage
      adminVerified: { type: Boolean, default: false },
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      verifiedAt: { type: Date },
      verificationNotes: { type: String, default: "" },

      // Police forwarding stage
      forwardedToPolice: { type: Boolean, default: false },
      forwardedAt: { type: Date },
      forwardedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

      // Police investigation stage
      assignedToOfficer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      assignedAt: { type: Date },
      investigationNotes: { type: String, default: "" },

      // Resolution
      resolvedAt: { type: Date },
      resolutionSummary: { type: String, default: "" },
    },

    // Legacy fields for backward compatibility
    adminNotes: { type: String, default: "" },
    // ────────────────────────────────────────────────────────────

    // Priority based on crime type
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },

    // Status change history for audit trail
    statusHistory: [
      {
        status: { type: String },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        changedAt: { type: Date, default: Date.now },
        notes: { type: String },
      },
    ],

    // Notification tracking
    notificationsSent: {
      admin: { type: Boolean, default: false },
      police: { type: Boolean, default: false },
      reporter: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

// Index for efficient queries
crimeSchema.index({ status: 1, createdAt: -1 });
crimeSchema.index({ userId: 1, createdAt: -1 });
crimeSchema.index({ "workflow.forwardedToPolice": 1, status: 1 });

// Pre-save middleware to track status changes
// NOTE: On newer Mongoose versions, callback `next` may not be provided
// in certain middleware flows. Keep this hook synchronous and avoid calling next().
crimeSchema.pre("save", function () {
  if (this.isModified("status")) {
    this.statusHistory.push({
      status: this.status,
      changedBy: this.modifiedBy, // Should be set before saving
      notes: this.statusNotes || "",
    });
  }
});

export default mongoose.model("Crime", crimeSchema);
