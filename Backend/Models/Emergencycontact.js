import mongoose from "mongoose";

const emergencyContactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Contact name is required"],
      trim: true,
    },
    number: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: ["police", "fire", "medical", "disaster", "women", "child", "other"],
      default: "other",
    },
    description: {
      type: String,
      trim: true,
    },
    region: {
      type: String,
      trim: true,
      default: "National",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const EmergencyContact = mongoose.model("EmergencyContact", emergencyContactSchema);

export default EmergencyContact;