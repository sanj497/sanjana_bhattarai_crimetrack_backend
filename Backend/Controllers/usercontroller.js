import User from '../Models/usermodel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

/* =========================
   Validate environment variables
========================= */
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.warn("WARNING: EMAIL_USER or EMAIL_PASS not set in environment variables. Email features will not work.");
}

/* =========================
   Email Transporter
========================= */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // must be App Password
  },
});

// Verify SMTP on startup
transporter.verify((err, success) => {
  if (err) console.error("SMTP ERROR:", err);
  else console.log("SMTP READY ✓");
});

/* =========================
   Generate OTP
========================= */
const generateOTP = () => Math.floor(100000 + Math.random() * 900000);

/* =========================
   REGISTER — Send OTP
========================= */
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ msg: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ msg: 'User already exists' });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = generateOTP();

    // Send OTP email
    try {
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: email,
        subject: "Verify your account - OTP",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 400px; margin: auto;">
            <h2>Email Verification</h2>
            <p>Hello <strong>${username}</strong>,</p>
            <p>Use the OTP below to verify your account. It is valid for <strong>10 minutes</strong>.</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0; color: #4F46E5;">
              ${otp}
            </div>
            <p>If you did not request this, please ignore this email.</p>
          </div>
        `,
      });
      console.log("EMAIL SENT:", info.response);
    } catch (mailErr) {
      console.error("EMAIL FAILED:", mailErr);
      return res.status(500).json({
        msg: "Failed to send OTP email",
        error: mailErr.message,
      });
    }

    // Create new user (unverified)
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: 'user',
      otp,
      otpExpiry: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      isOtpVerified: false,
    });

    await newUser.save();

    res.status(201).json({
      msg: 'User registered successfully. OTP sent to email.',
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
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
      await transporter.sendMail({
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
