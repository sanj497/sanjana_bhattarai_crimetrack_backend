import User from '../Models/usermodel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getTransporter } from "../utils/email.js";
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// Shared transporter is imported from utils/email.js
// SMTP verification is handled in the utility if needed, or we can just trust the pool.

/* =========================
   Generate OTP
========================= */
const generateOTP = () => Math.floor(100000 + Math.random() * 900000);

/* =========================
   REGISTER STAFF (Admin / Police) — Send OTP
========================= */
export const registerStaff = async (req, res) => {
  try {
    const { username, email, password, role, secretKey, stationDistrict, badgeNumber } = req.body;

    console.log(`📝 Staff registration attempt - Role: ${role}, Email: ${email}`);

    // Validate role
    if (!["admin", "police"].includes(role)) {
      console.error("❌ Invalid role attempted:", role);
      return res.status(400).json({ msg: "Invalid role. Must be admin or police." });
    }

    // Check secret key for each role
    const adminSecret = process.env.ADMIN_SECRET_KEY || "ADMIN@2025";
    const policeSecret = process.env.POLICE_SECRET_KEY || "POLICE@2025";

    const expectedSecret = role === "admin" ? adminSecret : policeSecret;
    if (secretKey !== expectedSecret) {
      console.error("❌ Invalid secret key for role:", role);
      return res.status(403).json({ msg: `Invalid authorization key for ${role} registration.` });
    }

    if (!username || !email || !password) {
      return res.status(400).json({ msg: "All fields are required." });
    }

    if (role === "police" && !stationDistrict) {
      return res.status(400).json({ msg: "Station district is required for police registration." });
    }

    // Check existing
    const existingUser = await User.findOne({ email }).select("+isOtpVerified");
    if (existingUser && existingUser.isOtpVerified) {
      return res.status(400).json({ msg: "An account with this email already exists and is verified." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();

    // Create or update user
    if (existingUser) {
      existingUser.username = username;
      existingUser.password = hashedPassword;
      existingUser.role = role;
      existingUser.otp = otp;
      existingUser.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      if (stationDistrict) existingUser.stationDistrict = stationDistrict;
      await existingUser.save();
      console.log("✅ Updated existing user record:", email);
    } else {
      const newUser = new User({
        username,
        email,
        password: hashedPassword,
        role,
        otp,
        otpExpiry: new Date(Date.now() + 10 * 60 * 1000),
        isOtpVerified: false,
        stationDistrict: stationDistrict || null,
      });
      await newUser.save();
      console.log("✅ Created new user record:", email);
    }

    // Send email (non-blocking but with proper error tracking)
    const emailPromise = getTransporter().sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: `CrimeTrack ${role === "admin" ? "Admin" : "Police Officer"} Account Verification`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; background: #0B1F3B; color: white; padding: 40px; border-radius: 16px;">
          <h2 style="color: #00B8D9; margin-bottom: 4px;">CrimeTrack Staff Registration</h2>
          <p style="color: #9CA3AF; margin-bottom: 24px;">Role: <strong style="color: white;">${role.toUpperCase()}</strong></p>
          <p>Hello <strong>${username}</strong>,</p>
          <p>Use the OTP below to complete your ${role} account registration. Valid for <strong>10 minutes</strong>.</p>
          <div style="font-size: 40px; font-weight: bold; letter-spacing: 12px; margin: 24px 0; color: #1E5EFF; background: white; padding: 16px; border-radius: 12px; text-align: center;">
            ${otp}
          </div>
          <p style="color: #9CA3AF; font-size: 12px;">If you did not initiate this registration, please disregard this email.</p>
        </div>
      `,
    });

    // Track email delivery but don't block response
    emailPromise
      .then(info => console.log(`✅ Staff OTP email sent to ${email}:`, info.response))
      .catch(err => console.error(`❌ Staff OTP email failed for ${email}:`, err.message));

    // Respond immediately after user is saved
    console.log(`✅ ${role} registration successful, responding to client`);
    res.status(201).json({
      msg: `${role === "admin" ? "Admin" : "Police officer"} registration initiated. OTP sent to email.`,
    });
  } catch (error) {
    console.error("❌ registerStaff error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ 
      msg: "Server error during staff registration", 
      error: error.message 
    });
  }
};

/* =========================
   REGISTER — Send OTP
========================= */
export const register = async (req, res) => {
  try {
    const { username, email, password, role = "user", stationDistrict, badgeNumber, department } = req.body;

    if (!["user", "police"].includes(role)) {
      return res.status(400).json({ msg: "Invalid role selected." });
    }

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ msg: 'All fields are required' });
    }

    if (role === "police" && (!stationDistrict || !badgeNumber || !department)) {
      return res.status(400).json({ msg: "Station district, badge number, and department are required for police registration." });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email }).select('+isOtpVerified');
    if (existingUser && existingUser.isOtpVerified) {
      return res.status(400).json({ msg: 'User already exists and is already verified.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = generateOTP();

    // Send OTP email
    // Create or update user
    if (existingUser) {
      existingUser.username = username;
      existingUser.password = hashedPassword;
      existingUser.otp = otp;
      existingUser.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      if (role === "police") {
        existingUser.role = "user";
        existingUser.stationDistrict = stationDistrict;
        existingUser.policeVerification = {
          status: "pending",
          badgeNumber,
          department,
          stationDistrict,
          appliedAt: new Date(),
          reviewedAt: null,
          reviewedBy: null,
          reviewNote: "",
        };
      } else {
        existingUser.policeVerification = {
          status: "none",
          badgeNumber: null,
          department: null,
          stationDistrict: null,
          appliedAt: null,
          reviewedAt: null,
          reviewedBy: null,
          reviewNote: "",
        };
      }
      await existingUser.save();
    } else {
      const newUser = new User({
        username,
        email,
        password: hashedPassword,
        role: 'user',
        otp,
        otpExpiry: new Date(Date.now() + 10 * 60 * 1000),
        isOtpVerified: false,
        stationDistrict: role === "police" ? stationDistrict : null,
        policeVerification: role === "police"
          ? {
              status: "pending",
              badgeNumber,
              department,
              stationDistrict,
              appliedAt: new Date(),
              reviewedAt: null,
              reviewedBy: null,
              reviewNote: "",
            }
          : {
              status: "none",
              badgeNumber: null,
              department: null,
              stationDistrict: null,
              appliedAt: null,
              reviewedAt: null,
              reviewedBy: null,
              reviewNote: "",
            },
      });
      await newUser.save();
    }

    // Send OTP email in background
    getTransporter().sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: role === "police" ? "Verify your police application - OTP" : "Verify your account - OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 400px; margin: auto;">
          <h2>${role === "police" ? "Police Registration Verification" : "Email Verification"}</h2>
          <p>Hello <strong>${username}</strong>,</p>
          <p>Use the OTP below to verify your ${role === "police" ? "police application" : "account"}. It is valid for <strong>10 minutes</strong>.</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0; color: #4F46E5;">
            ${otp}
          </div>
          ${role === "police" ? "<p>After OTP verification, your profile will be reviewed by an admin before police access is approved.</p>" : ""}
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `,
    }).then(info => console.log("EMAIL SENT:", info.response))
      .catch(err => console.error("EMAIL FAILED:", err));

    res.status(201).json({
      msg: role === "police"
        ? "Police registration initiated. OTP sent to email. Your profile will be reviewed by admin after verification."
        : 'Registration initiated. OTP sent to email.',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

/* =========================
   VERIFY OTP
========================= */
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ msg: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email }).select('+otp +otpExpiry +isOtpVerified');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // Check OTP expiry
    if (user.otpExpiry && user.otpExpiry < new Date()) {
      return res.status(400).json({ msg: 'OTP has expired. Please register again or request a new OTP.' });
    }

    // Check OTP match
    if (user.otp !== Number(otp)) {
      return res.status(400).json({ msg: 'Invalid OTP' });
    }

    // Mark as verified and clear OTP
    user.isOtpVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.json({ msg: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'OTP verification failed', error: error.message });
  }
};

/* =========================
   LOGIN
========================= */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ msg: 'Email and password are required' });
    }

    // Find user by email
    const user = await User.findOne({ email }).select('+password +isOtpVerified');
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    // Check if email is verified
    if (!user.isOtpVerified) {
      return res.status(401).json({ msg: 'Please verify your email before logging in.' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const allowedRoles = ["user", "police", "admin"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ msg: "Invalid role" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    user.role = role;
    await user.save();

    res.json({
      msg: `User role updated to ${role}`,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password -otp");

    res.json({
      total: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({
      msg: "Server error",
      error: error.message,
    });
  }
};

export const verifyPoliceApplication = async (req, res) => {
  try {
    const { userId } = req.params;
    const { action, reviewNote } = req.body;

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ msg: "Action must be approve or reject." });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (user.policeVerification?.status !== "pending") {
      return res.status(400).json({ msg: "This police application is not pending review." });
    }

    if (action === "approve") {
      user.role = "police";
      user.stationDistrict = user.policeVerification?.stationDistrict || user.stationDistrict;
      user.policeVerification.status = "approved";
    } else {
      user.role = "user";
      user.policeVerification.status = "rejected";
    }

    user.policeVerification.reviewedAt = new Date();
    user.policeVerification.reviewedBy = req.user.userId;
    user.policeVerification.reviewNote = reviewNote || "";
    await user.save();

    res.json({
      msg: action === "approve" ? "Police application approved successfully." : "Police application rejected.",
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        policeVerification: user.policeVerification,
      },
    });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

/* =========================
   FORGOT PASSWORD — Send OTP
========================= */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ msg: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: "User with this email does not exist" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Save OTP and expiry (10 mins)
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // Send Email
    try {
      await getTransporter().sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: email,
        subject: "Password Reset OTP",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 400px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #4F46E5;">Password Reset</h2>
            <p>You requested a password reset. Use the OTP below to proceed. It is valid for 10 minutes.</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0; color: #4F46E5; text-align: center;">
              ${otp}
            </div>
            <p>If you did not request this, please ignore this email.</p>
          </div>
        `,
      });
    } catch (mailErr) {
      console.error("FORGOT PASSWORD EMAIL FAILED:", mailErr);
      return res.status(500).json({ msg: "Failed to send reset email" });
    }

    res.json({ msg: "Reset OTP sent to your email" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

/* =========================
   RESET PASSWORD
========================= */
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    const user = await User.findOne({ email }).select("+resetPasswordOTP +resetPasswordOTPExpiry");
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Check OTP
    if (!user.resetPasswordOTP || user.resetPasswordOTP !== Number(otp)) {
      return res.status(400).json({ msg: "Invalid OTP" });
    }

    // Check Expiry
    if (user.resetPasswordOTPExpiry < new Date()) {
      return res.status(400).json({ msg: "OTP has expired" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    // Clear reset fields
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpiry = undefined;
    await user.save();

    res.json({ msg: "Password reset successful! You can now log in with your new password." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

/* =========================
   UPDATE PROFILE
 ========================= */
export const updateProfile = async (req, res) => {
  try {
    const { username, email } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ msg: "Email already in use" });
      user.email = email;
    }

    if (username) user.username = username;
    if (req.body.stationDistrict && user.role === "police") {
      user.stationDistrict = req.body.stationDistrict;
    }

    await user.save();

    res.json({
      msg: "Profile updated successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

