import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profilePicture: { type: String, default: null },
    role: {
      type: String,
      enum: ["user", "admin", "police"],
      default: "user"
    },
    otp: {
      type: Number,
      select: false
    },
    otpExpiry: {
      type: Date,
      select: false
    },
    isOtpVerified: {
      type: Boolean,
      default: false,
      select: false
    },
    resetPasswordOTP: {
      type: Number,
      select: false
    },
    resetPasswordOTPExpiry: {
      type: Date,
      select: false
    },
    guardians: [
      {
        name: String,
        email: String,
        phone: String,
      }
    ],
    stationDistrict: {
      type: String,
      default: null,
    },
    stationLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: undefined,
        index: "2dsphere",
      },
    },
    policeVerification: {
      status: {
        type: String,
        enum: ["none", "pending", "approved", "rejected"],
        default: "none",
      },
      badgeNumber: { type: String, default: null },
      department: { type: String, default: null },
      stationDistrict: { type: String, default: null },
      stationLat: { type: Number, default: null },
      stationLng: { type: Number, default: null },
      appliedAt: { type: Date, default: null },
      reviewedAt: { type: Date, default: null },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      reviewNote: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
