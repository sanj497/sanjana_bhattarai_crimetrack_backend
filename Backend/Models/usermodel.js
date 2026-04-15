import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
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
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
