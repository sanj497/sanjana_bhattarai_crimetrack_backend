import mongoose from "mongoose";

const crimeReportSchema = new mongoose.Schema(
  {
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    crimeType: {
      type: String,
      required: true,
      enum: [
        "Theft",
        "Assault",
        "Robbery",
        "Vandalism",
        "Fraud",
        "Harassment",
        "Other",
      ],
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    address: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Pending", "Acknowledged", "In Progress", "Resolved"],
      default: "Pending",
    },
    severity: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    policeAlerted: {
      type: Boolean,
      default: false,
    },
    policeAlertedAt: {
      type: Date,
    },
    images: [
      {
        type: String, // URLs to uploaded images
      },
    ],
    isAnonymous: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Geospatial index for location-based queries
crimeReportSchema.index({ location: "2dsphere" });

export default mongoose.model("CrimeReport", crimeReportSchema);