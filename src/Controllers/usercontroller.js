import User from '../Models/usermodel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getTransporter, ensureTransporterReady } from "../utils/email.js";
import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";

// Helper function to get JWT_SECRET
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }
  return secret;
};

// Shared transporter is imported from utils/email.js
// SMTP verification is handled in the utility if needed, or we can just trust the pool.

/* =========================
   Generate OTP
========================= */
const generateOTP = () => Math.floor(100000 + Math.random() * 900000);

const sendOtpEmail = async ({ email, username, subject, html, text, context }) => {
  try {
    console.log(`📧 Attempting to send ${context} OTP to ${email}`);
    console.log(`📧 Email User: ${process.env.EMAIL_USER}`);
    console.log(`📧 Email From: ${process.env.EMAIL_FROM}`);
    
    await ensureTransporterReady();
    
    const info = await getTransporter().sendMail({
      from: `"CrimeTrack" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: html,
      text: text || `Your verification code is ready. Please open this email in an HTML-compatible email client to view your verification code.`,
      headers: {
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        'Importance': 'Normal',
        'List-Unsubscribe': `<mailto:${process.env.EMAIL_FROM || process.env.EMAIL_USER}?subject=unsubscribe>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'Feedback-ID': `crimetrack:${context}:production`,
        'X-Entity-Ref-ID': `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      },
      // Production email settings
      priority: 'normal',
      encoding: 'utf-8'
    });
    
    console.log(`✅ ${context} OTP email sent successfully to ${email}`);
    console.log(`✅ Message ID: ${info.messageId}`);
    console.log(`✅ Response: ${info.response}`);
    return info;
  } catch (error) {
    console.error(`❌ ${context} OTP email failed for ${email}:`);
    console.error(`❌ Error: ${error.message}`);
    console.error(`❌ Error Code: ${error.code}`);
    console.error(`❌ Full Error:`, error);
    throw error;
  }
};

/* =========================
   REGISTER STAFF (Admin / Police) — Send OTP
========================= */
export const registerStaff = async (req, res) => {
  try {
    const { username, email, password, role, secretKey, stationDistrict } = req.body;

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
      return res.status(400).json({ msg: "Station Hub/District is required for police registration." });
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
      if (stationDistrict) {
          existingUser.stationDistrict = stationDistrict;
          // Coordinates are now optional during simplified registration
      }
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
        // Default empty location if not provided (simplified UI)
        stationLocation: { lat: null, lng: null }
      });
      await newUser.save();
      console.log("✅ Created new user record:", email);
    }

    // Send OTP email and fail request if delivery fails
    try {
      await sendOtpEmail({
        email,
        username,
        subject: `CrimeTrack ${role === "admin" ? "Admin" : "Police Officer"} Account Verification`,
        context: "Staff registration",
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Account</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color: #18181b; padding: 40px 48px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">CrimeTrack</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 48px 48px 32px;">
              <h2 style="margin: 0 0 24px; color: #18181b; font-size: 24px; font-weight: 600;">Verify your email address</h2>
              <p style="margin: 0 0 16px; color: #52525b; font-size: 16px; line-height: 1.6;">Hi ${username},</p>
              <p style="margin: 0 0 32px; color: #52525b; font-size: 16px; line-height: 1.6;">Thank you for registering as a ${role === "admin" ? "Admin" : "Police Officer"}. Please use the verification code below to complete your registration:</p>
              
              <!-- OTP Code -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 32px;">
                <tr>
                  <td style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; padding: 32px; text-align: center;">
                    <p style="margin: 0 0 8px; color: #71717a; font-size: 14px; font-weight: 500;">Verification code</p>
                    <p style="margin: 0; font-size: 48px; font-weight: 700; color: #18181b; letter-spacing: 8px; font-family: 'SF Mono', 'Roboto Mono', monospace;">${otp}</p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 24px; color: #52525b; font-size: 14px; line-height: 1.6;">This code will expire in 10 minutes. If you did not request this verification, you can safely ignore this email.</p>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding: 0 48px;">
              <div style="border-top: 1px solid #e4e4e7;"></div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 32px 48px 48px;">
              <p style="margin: 0 0 8px; color: #71717a; font-size: 14px; line-height: 1.6;">Need help? Contact our support team.</p>
              <p style="margin: 0; color: #a1a1aa; font-size: 12px;">&copy; 2026 CrimeTrack. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
        text: `Hi ${username},\n\nThank you for registering as a ${role === "admin" ? "Admin" : "Police Officer"}.\n\nYour verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you did not request this verification, you can safely ignore this email.\n\nCrimeTrack Support`
      });
    } catch (mailErr) {
      console.error(`❌ Staff OTP email failed for ${email}:`, mailErr.message);
      return res.status(500).json({ msg: "Registration saved, but OTP email delivery failed. Please check email configuration and try again." });
    }

    // Respond immediately after user is saved
    console.log(`✅ ${role} registration successful, responding to client`);
    res.status(201).json({
      msg: `${role === "admin" ? "Admin" : "Police officer"} registration initiated. OTP sent to email.`,
    });
  } catch (error) {
    console.error("❌ registerStaff error:", error);
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
    const {
      username,
      email,
      password,
      role = "user",
      stationDistrict,
      badgeNumber,
      department,
      // Lat/Lng are now optional to support the minimal UI
      stationLat,
      stationLng,
    } = req.body;

    if (!["user", "police"].includes(role)) {
      return res.status(400).json({ msg: "Invalid role selected." });
    }

    // Validate basic input
    if (!username || !email || !password) {
      return res.status(400).json({ msg: 'All fields are required' });
    }

    // Professional validation for Police applicants (Minimal requirement)
    if (role === "police" && (!stationDistrict || !badgeNumber || !department)) {
      return res.status(400).json({ msg: "Station district, badge number, and department are required for police registration." });
    }

    const parsedStationLat = (stationLat !== undefined && stationLat !== null) ? Number(stationLat) : null;
    const parsedStationLng = (stationLng !== undefined && stationLng !== null) ? Number(stationLng) : null;
    
    const hasValidStationCoordinates =
      parsedStationLat !== null &&
      parsedStationLng !== null &&
      !isNaN(parsedStationLat) &&
      !isNaN(parsedStationLng);

    // Check if user already exists
    const existingUser = await User.findOne({ email }).select('+isOtpVerified');
    if (existingUser && existingUser.isOtpVerified) {
      return res.status(400).json({ msg: 'User already exists and is already verified.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = generateOTP();

    // Create or update user
    if (existingUser) {
      existingUser.username = username;
      existingUser.password = hashedPassword;
      existingUser.otp = otp;
      existingUser.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      
      if (hasValidStationCoordinates) {
        existingUser.stationLocation = {
          lat: parsedStationLat,
          lng: parsedStationLng,
          coordinates: [parsedStationLng, parsedStationLat],
        };
      }
      
      if (role === "police") {
        existingUser.stationDistrict = stationDistrict;
        existingUser.policeVerification = {
          status: "pending",
          badgeNumber,
          department,
          stationDistrict,
          stationLat: parsedStationLat,
          stationLng: parsedStationLng,
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
        role: 'user', // Assigned 'user' until verification (if police)
        otp,
        otpExpiry: new Date(Date.now() + 10 * 60 * 1000),
        isOtpVerified: false,
        stationDistrict: stationDistrict || null,
        stationLocation: hasValidStationCoordinates
          ? {
              lat: parsedStationLat,
              lng: parsedStationLng,
              coordinates: [parsedStationLng, parsedStationLat],
            }
          : { lat: null, lng: null },
        policeVerification: role === "police"
          ? {
              status: "pending",
              badgeNumber,
              department,
              stationDistrict,
              stationLat: parsedStationLat,
              stationLng: parsedStationLng,
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
              stationLat: null,
              stationLng: null,
              appliedAt: null,
              reviewedAt: null,
              reviewedBy: null,
              reviewNote: "",
            },
      });
      await newUser.save();
    }

    // Dispatch OTP
    try {
      await sendOtpEmail({
        email,
        username,
        subject: role === "police" ? "Verify your police application - OTP" : "Verify your account - OTP",
        context: "User registration",
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Account</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color: #18181b; padding: 40px 48px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">CrimeTrack</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 48px 48px 32px;">
              <h2 style="margin: 0 0 24px; color: #18181b; font-size: 24px; font-weight: 600;">${role === "police" ? "Verify your officer application" : "Verify your email address"}</h2>
              <p style="margin: 0 0 16px; color: #52525b; font-size: 16px; line-height: 1.6;">Hi ${username},</p>
              <p style="margin: 0 0 32px; color: #52525b; font-size: 16px; line-height: 1.6;">${role === "police" ? "Thank you for applying as a Police Officer. Please use the verification code below to complete your application:" : "Thank you for registering with CrimeTrack. Please use the verification code below to complete your registration:"}</p>
              
              <!-- OTP Code -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 32px;">
                <tr>
                  <td style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; padding: 32px; text-align: center;">
                    <p style="margin: 0 0 8px; color: #71717a; font-size: 14px; font-weight: 500;">Verification code</p>
                    <p style="margin: 0; font-size: 48px; font-weight: 700; color: #18181b; letter-spacing: 8px; font-family: 'SF Mono', 'Roboto Mono', monospace;">${otp}</p>
                  </td>
                </tr>
              </table>
              
              ${role === "police" ? `
              <p style="margin: 0 0 24px; color: #52525b; font-size: 14px; line-height: 1.6;">After verification, your badge and credentials will be reviewed by our admin team before full access is granted.</p>
              ` : ''}
              
              <p style="margin: 0 0 24px; color: #52525b; font-size: 14px; line-height: 1.6;">This code will expire in 10 minutes. If you did not request this verification, you can safely ignore this email.</p>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding: 0 48px;">
              <div style="border-top: 1px solid #e4e4e7;"></div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 32px 48px 48px;">
              <p style="margin: 0 0 8px; color: #71717a; font-size: 14px; line-height: 1.6;">Need help? Contact our support team.</p>
              <p style="margin: 0; color: #a1a1aa; font-size: 12px;">&copy; 2026 CrimeTrack. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
        text: `Hi ${username},\n\n${role === "police" ? "Thank you for applying as a Police Officer." : "Thank you for registering with CrimeTrack."}\n\nYour verification code is: ${otp}\n\n${role === "police" ? "After verification, your badge and credentials will be reviewed by our admin team before full access is granted." : "This code will expire in 10 minutes."}\n\nIf you did not request this verification, you can safely ignore this email.\n\nCrimeTrack Support`
      });
      
      console.log(`✅ OTP email successfully delivered to ${email}`);
    } catch (mailErr) {
      console.error(`❌ Registration OTP email failed for ${email}:`, mailErr.message);
      console.error(`❌ Error details:`, mailErr);
      
      // Return detailed error to help debug
      return res.status(500).json({ 
        msg: "Registration saved, but OTP email delivery failed.",
        error: mailErr.message,
        errorCode: mailErr.code,
        hint: "Please check: 1) EMAIL_USER and EMAIL_PASS in .env, 2) Gmail App Password is valid, 3) Less secure apps access is enabled"
      });
    }

    res.status(201).json({
      msg: role === "police"
        ? "Police registration initiated. OTP sent to email. Review starts after verification."
        : 'Registration initiated. OTP sent to email.',
    });
  } catch (error) {
    console.error("❌ Registration error:", error);
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
      return res.status(400).json({ msg: 'OTP has expired. Please register again.' });
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
   LOGIN: Enhanced Multi-Session Safety
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

    // Generate JWT (1 hour expiry)
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      getJwtSecret(),
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error("❌ Login error:", error);
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;
    const skip = (page - 1) * limit;

    const total = await User.countDocuments();
    const users = await User.find().select("-password -otp").skip(skip).limit(limit);

    res.json({
      total: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
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
      const approvedLat = Number(user.policeVerification?.stationLat);
      const approvedLng = Number(user.policeVerification?.stationLng);
      if (!isNaN(approvedLat) && !isNaN(approvedLng)) {
        user.stationLocation = {
          lat: approvedLat,
          lng: approvedLng,
          coordinates: [approvedLng, approvedLat],
        };
      }
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

    const otp = Math.floor(100000 + Math.random() * 900000);
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    try {
      await getTransporter().sendMail({
        from: `"CrimeTrack" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: email,
        subject: "CrimeTrack - Password Reset Code",
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color: #18181b; padding: 40px 48px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">CrimeTrack</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 48px 48px 32px;">
              <h2 style="margin: 0 0 24px; color: #18181b; font-size: 24px; font-weight: 600;">Reset your password</h2>
              <p style="margin: 0 0 16px; color: #52525b; font-size: 16px; line-height: 1.6;">Hello,</p>
              <p style="margin: 0 0 32px; color: #52525b; font-size: 16px; line-height: 1.6;">We received a request to reset your password. Please use the verification code below to proceed:</p>
              
              <!-- OTP Code -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 32px;">
                <tr>
                  <td style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; padding: 32px; text-align: center;">
                    <p style="margin: 0 0 8px; color: #71717a; font-size: 14px; font-weight: 500;">Verification code</p>
                    <p style="margin: 0; font-size: 48px; font-weight: 700; color: #18181b; letter-spacing: 8px; font-family: 'SF Mono', 'Roboto Mono', monospace;">${otp}</p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 24px; color: #52525b; font-size: 14px; line-height: 1.6;">This code will expire in 10 minutes.</p>
              
              <p style="margin: 0; color: #52525b; font-size: 14px; line-height: 1.6;">If you did not request a password reset, you can safely ignore this email. Your account remains secure.</p>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding: 0 48px;">
              <div style="border-top: 1px solid #e4e4e7;"></div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 32px 48px 48px;">
              <p style="margin: 0 0 8px; color: #71717a; font-size: 14px; line-height: 1.6;">Need help? Contact our support team.</p>
              <p style="margin: 0; color: #a1a1aa; font-size: 12px;">&copy; 2026 CrimeTrack. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
        text: `Hello,\n\nWe received a request to reset your password.\n\nYour verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you did not request a password reset, you can safely ignore this email. Your account remains secure.\n\nCrimeTrack Support`
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

    if (!user.resetPasswordOTP || user.resetPasswordOTP !== Number(otp)) {
      return res.status(400).json({ msg: "Invalid OTP" });
    }

    if (user.resetPasswordOTPExpiry < new Date()) {
      return res.status(400).json({ msg: "OTP has expired" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpiry = undefined;
    await user.save();

    res.json({ msg: "Password reset successful! You can now log in." });
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

/* =========================
   DELETE USER (ADMIN ONLY)
 ========================= */
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Prevent admin from deleting themselves (handle varying JWT middleware decoding)
    const adminId = req.user?.userId || req.user?._id;
    if (adminId && adminId.toString() === userId) {
      return res.status(400).json({ msg: "Cannot delete your own admin account." });
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) return res.status(404).json({ msg: "User not found." });

    res.json({ msg: "User removed successfully", success: true });
  } catch (error) {
    console.error("deleteUser error:", error);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

/* =========================
   GET USER PROFILE
 ========================= */
export const getProfile = async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId;
    const user = await User.findById(userId).select("-password -otp -otpExpiry -isOtpVerified -resetPasswordOTP -resetPasswordOTPExpiry");
    
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        guardians: user.guardians,
        stationDistrict: user.stationDistrict,
      }
    });
  } catch (error) {
    console.error("getProfile error:", error);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

/* =========================
   UPLOAD PROFILE PICTURE
 ========================= */
export const uploadProfilePicture = async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId;
    
    if (!req.file) {
      return res.status(400).json({ msg: "No file uploaded" });
    }

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(req.file);
    
    // Update user profile
    const user = await User.findByIdAndUpdate(
      userId,
      { profilePicture: uploadResult.url },
      { new: true }
    ).select("-password -otp -otpExpiry -isOtpVerified -resetPasswordOTP -resetPasswordOTPExpiry");

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json({
      success: true,
      msg: "Profile picture updated successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
      }
    });
  } catch (error) {
    console.error("uploadProfilePicture error:", error);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};
