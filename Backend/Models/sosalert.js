import mongoose from "mongoose";

const sosAlertSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    accuracy: { type: Number, default: null },
    timestamp: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["pending", "acknowledged", "resolved", "active"],
      default: "pending",
    },
    trackingHistory: [
      {
        latitude: Number,
        longitude: Number,
        accuracy: Number,
        timestamp: { type: Date, default: Date.now }
      }
    ],
    message: {
      type: String,
      default: "Emergency request sent",
    },
  },
  { timestamps: true }
);

const SosAlert = mongoose.model("SosAlert", sosAlertSchema);

export default SosAlert;