import nodemailer from "nodemailer";
import dns from "dns";

// Prefer IPv4 for DNS resolution to avoid ENETUNREACH IPv6 issues on certain networks (like Render)
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

let transporterInstance = null;
let transporterReady = null;

/**
 * Validates and cleans environment variables for email
 */
const getEmailConfig = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const from = process.env.EMAIL_FROM || user;

  if (!user || !pass) {
    console.error("❌ EMAIL_USER or EMAIL_PASS is not defined in environment variables.");
    return null;
  }

  // Clean password if it contains quotes or spaces (common copy-paste issue)
  const cleanPass = pass.replace(/["']/g, "").trim();

  return { user, pass: cleanPass, from };
};

/**
 * Initializes the email transporter as a singleton
 */
export const getTransporter = () => {
  if (transporterInstance) return transporterInstance;

  const config = getEmailConfig();
  if (!config) {
    throw new Error("Email service configuration is missing.");
  }

  console.log(`📧 Initializing professional email service (Gmail/IPv4 Priority)...`);

  transporterInstance = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use SSL
    auth: {
      user: config.user,
      pass: config.pass,
    },
    // Force IPv4 to prevent ENETUNREACH errors on cloud platforms
    family: 4,
    // Connection pooling for production efficiency
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    // Robust timeout settings
    connectionTimeout: 20000, // 20s
    greetingTimeout: 20000,
    socketTimeout: 30000,
  });

  return transporterInstance;
};

/**
 * Verifies that the transporter is ready to send emails
 */
export const ensureTransporterReady = async () => {
  if (transporterReady) return true;

  try {
    const transporter = getTransporter();
    await transporter.verify();
    console.log("✅ Email service is READY and authenticated.");
    transporterReady = true;
    return true;
  } catch (error) {
    console.error("❌ Email service FAILED to initialize:");
    console.error(`❌ Error: ${error.message}`);
    console.error(`❌ Code: ${error.code}`);
    transporterReady = false;
    return false;
  }
};

/**
 * Professional HTML Email Wrapper Template
 */
const getEmailTemplate = (content, title = "CrimeTrack", accentColor = "#18181b") => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${accentColor} 0%, #27272a 100%); padding: 40px 48px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">CrimeTrack</h1>
              <p style="margin: 8px 0 0; color: #a1a1aa; font-size: 14px; font-weight: 500;">Security & Community Alerts</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 48px 48px 32px;">
              ${content}
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
              <p style="margin: 0 0 12px; color: #71717a; font-size: 14px; line-height: 1.6;">
                This is an automated notification from the CrimeTrack platform. Please do not reply to this email.
              </p>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <p style="margin: 0; color: #a1a1aa; font-size: 12px;">&copy; 2026 CrimeTrack Inc. All rights reserved.</p>
                <p style="margin: 0; color: #a1a1aa; font-size: 12px;"><a href="#" style="color: #71717a; text-decoration: underline;">Privacy Policy</a></p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

/**
 * Sends a professional OTP email
 */
export const sendOtpEmail = async ({ email, username, subject, otp, context }) => {
  try {
    await ensureTransporterReady();
    const config = getEmailConfig();

    const htmlContent = `
      <h2 style="margin: 0 0 24px; color: #18181b; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">Verify your identity</h2>
      <p style="margin: 0 0 16px; color: #52525b; font-size: 16px; line-height: 1.6;">Hi ${username},</p>
      <p style="margin: 0 0 32px; color: #52525b; font-size: 16px; line-height: 1.6;">You are receiving this email because a request was made for <strong>${context}</strong>. Use the following verification code to proceed:</p>
      
      <!-- OTP Box -->
      <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 32px;">
        <tr>
          <td style="background-color: #fafafa; border: 2px dashed #e4e4e7; border-radius: 12px; padding: 40px; text-align: center;">
            <p style="margin: 0 0 8px; color: #71717a; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Verification Code</p>
            <p style="margin: 0; font-size: 56px; font-weight: 800; color: #18181b; letter-spacing: 12px; font-family: 'SF Mono', 'Roboto Mono', Menlo, monospace;">${otp}</p>
          </td>
        </tr>
      </table>
      
      <div style="background-color: #fff7ed; border-left: 4px solid #f97316; padding: 16px; margin-bottom: 32px;">
        <p style="margin: 0; color: #9a3412; font-size: 14px; line-height: 1.5;">
          <strong>Security Notice:</strong> This code will expire in 10 minutes. If you did not request this code, please ignore this email or contact security if you suspect unauthorized access.
        </p>
      </div>
    `;

    const info = await getTransporter().sendMail({
      from: `"CrimeTrack Security" <${config.from}>`,
      to: email,
      subject: subject || "CrimeTrack Verification Code",
      html: getEmailTemplate(htmlContent, "Verification"),
      text: `Your CrimeTrack verification code is: ${otp}. It expires in 10 minutes.`,
      priority: 'high',
    });

    console.log(`✅ OTP Email (${context}) sent to ${email}. ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ OTP Email failed for ${email}:`, error.message);
    throw error;
  }
};

/**
 * Sends a rich Crime Alert email
 */
export const sendCrimeAlertEmail = async (user, crime, message) => {
  try {
    await ensureTransporterReady();
    const config = getEmailConfig();

    const priorityColor = 
      crime.priority === "Critical" ? "#ef4444" : 
      crime.priority === "High" ? "#f97316" : 
      "#3b82f6";

    const htmlContent = `
      <div style="display: flex; align-items: center; margin-bottom: 24px;">
        <span style="background-color: ${priorityColor}; color: #ffffff; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase;">${crime.priority || 'Alert'}</span>
      </div>
      
      <h2 style="margin: 0 0 16px; color: #18181b; font-size: 22px; font-weight: 700;">${crime.title}</h2>
      
      <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 32px;">
        <p style="margin: 0; color: #334155; font-size: 16px; line-height: 1.6; font-style: italic;">"${message}"</p>
      </div>

      <h3 style="color: #18181b; font-size: 16px; font-weight: 700; margin-bottom: 12px;">Incident Details</h3>
      <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
        <tr>
          <td style="padding: 8px 0; color: #71717a; font-size: 14px; width: 120px;">Category:</td>
          <td style="padding: 8px 0; color: #18181b; font-size: 14px; font-weight: 600;">${crime.crimeType}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #71717a; font-size: 14px;">Location:</td>
          <td style="padding: 8px 0; color: #18181b; font-size: 14px; font-weight: 600;">${crime.location?.address || 'View map for details'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #71717a; font-size: 14px;">Status:</td>
          <td style="padding: 8px 0; color: #18181b; font-size: 14px;">
            <span style="color: #059669; font-weight: 700;">${crime.status}</span>
          </td>
        </tr>
      </table>

      <div style="text-align: center;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" 
           style="display: inline-block; background-color: #18181b; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
          View Report in Dashboard
        </a>
      </div>
    `;

    const info = await getTransporter().sendMail({
      from: `"CrimeTrack Alerts" <${config.from}>`,
      to: user.email,
      subject: `🚨 Crime Alert: ${crime.title}`,
      html: getEmailTemplate(htmlContent, "Crime Alert", priorityColor),
      text: `Crime Alert: ${crime.title}\n\n${message}\n\nLocation: ${crime.location?.address}\nStatus: ${crime.status}`,
    });

    console.log(`✅ Crime Alert Email sent to ${user.email}. ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Crime Alert Email failed for ${user.email}:`, error.message);
    return null;
  }
};

/**
 * Sends a critical SOS email to guardians
 */
export const sendSOSEmail = async (guardian, user, location) => {
  try {
    await ensureTransporterReady();
    const config = getEmailConfig();

    const mapsUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;

    const htmlContent = `
      <div style="background-color: #fee2e2; border: 2px solid #ef4444; border-radius: 12px; padding: 24px; margin-bottom: 32px; text-align: center;">
        <h2 style="margin: 0; color: #991b1b; font-size: 24px; font-weight: 800; text-transform: uppercase;">🚨 CRITICAL SOS ALERT 🚨</h2>
      </div>
      
      <p style="margin: 0 0 16px; color: #18181b; font-size: 18px; font-weight: 600;">Dear Guardian,</p>
      <p style="margin: 0 0 24px; color: #ef4444; font-size: 16px; font-weight: 700; line-height: 1.6;">
        ${user.name || user.username} (${user.phone || 'N/A'}) has triggered an EMERGENCY SOS alert!
      </p>

      <div style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; padding: 20px; margin-bottom: 32px;">
        <h3 style="margin: 0 0 12px; color: #18181b; font-size: 14px; text-transform: uppercase;">Last Known Location</h3>
        <p style="margin: 0 0 16px; color: #52525b; font-size: 14px;">Coordinates: ${location.latitude}, ${location.longitude}</p>
        <a href="${mapsUrl}" target="_blank" style="color: #2563eb; font-weight: 700; text-decoration: underline;">View on Google Maps &rarr;</a>
      </div>

      <p style="margin: 0 0 32px; color: #52525b; font-size: 14px; line-height: 1.6;">
        Please try to contact them immediately or notify local authorities if they do not respond.
      </p>

      <div style="text-align: center;">
        <a href="${mapsUrl}" 
           style="display: inline-block; background-color: #ef4444; color: #ffffff; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 18px; box-shadow: 0 4px 14px 0 rgba(239, 68, 68, 0.39);">
          TRACK LIVE LOCATION
        </a>
      </div>
    `;

    const info = await getTransporter().sendMail({
      from: `"CrimeTrack Emergency" <${config.from}>`,
      to: guardian.email,
      subject: `🚨 EMERGENCY: SOS Alert from ${user.name || user.username}`,
      html: getEmailTemplate(htmlContent, "SOS Alert", "#ef4444"),
      text: `EMERGENCY SOS: ${user.name} has triggered an alert. Location: ${mapsUrl}`,
      priority: 'high',
    });

    console.log(`✅ SOS Email sent to guardian ${guardian.email}. ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ SOS Email failed for guardian ${guardian.email}:`, error.message);
    return null;
  }
};

/**
 * Sends a professional complaint update email
 */
export const sendComplaintEmail = async (user, complaint, message) => {
  try {
    await ensureTransporterReady();
    const config = getEmailConfig();

    const htmlContent = `
      <h2 style="margin: 0 0 16px; color: #18181b; font-size: 22px; font-weight: 700;">Complaint Update: ${complaint.title}</h2>
      
      <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; margin-bottom: 32px;">
        <p style="margin: 0; color: #0c4a6e; font-size: 16px; line-height: 1.6;">${message}</p>
      </div>

      <h3 style="color: #18181b; font-size: 16px; font-weight: 700; margin-bottom: 12px;">Complaint Information</h3>
      <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
        <tr>
          <td style="padding: 8px 0; color: #71717a; font-size: 14px; width: 120px;">Category:</td>
          <td style="padding: 8px 0; color: #18181b; font-size: 14px; font-weight: 600;">${complaint.category}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #71717a; font-size: 14px;">Status:</td>
          <td style="padding: 8px 0; color: #18181b; font-size: 14px;">
            <span style="color: #0ea5e9; font-weight: 700;">${complaint.status}</span>
          </td>
        </tr>
      </table>

      <div style="text-align: center;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/complaints" 
           style="display: inline-block; background-color: #18181b; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
          Track Complaint Status
        </a>
      </div>
    `;

    const info = await getTransporter().sendMail({
      from: `"CrimeTrack Complaints" <${config.from}>`,
      to: user.email,
      subject: `📋 Update on your Complaint: ${complaint.title}`,
      html: getEmailTemplate(htmlContent, "Complaint Update", "#0ea5e9"),
      text: `Complaint Update: ${complaint.title}\n\n${message}\n\nStatus: ${complaint.status}`,
    });

    console.log(`✅ Complaint Email sent to ${user.email}. ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Complaint Email failed for ${user.email}:`, error.message);
    return null;
  }
};
