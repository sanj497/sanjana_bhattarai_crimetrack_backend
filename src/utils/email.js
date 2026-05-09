import nodemailer from "nodemailer";

let transporterInstance = null;
let transporterReady = null;

export const getTransporter = () => {
  if (!transporterInstance) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error("Email credentials are missing. Set EMAIL_USER and EMAIL_PASS in backend environment variables.");
    }

    // Clean password
    let emailPass = process.env.EMAIL_PASS.trim().replace(/\s+/g, '');
    if (emailPass.startsWith('"') || emailPass.startsWith("'")) {
      emailPass = emailPass.slice(1, -1);
    }

    console.log("📧 Initializing simple Gmail service...");
    
    // Simplest possible Gmail configuration
    transporterInstance = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: emailPass,
      },
      // Force IPv4 via options passed to net.connect
      family: 4,
    });

    transporterReady = transporterInstance.verify();
    
    transporterReady.then(() => {
      console.log("✅ Email service is READY");
    }).catch((error) => {
      console.error("❌ Email service connection failed:", error.message);
    });
  }
  return transporterInstance;
};

export const ensureTransporterReady = async () => {
  getTransporter();
  if (transporterReady) {
    try {
      await transporterReady;
    } catch (error) {
      throw new Error(`Email service not available: ${error.message}`);
    }
  }
};

// Helper for professional email templates
const getEmailTemplate = (crime, customMessage = null, user = null) => {
  const priorityColors = {
    Critical: "#ef4444",
    High: "#f97316",
    Medium: "#3b82f6",
    Low: "#10b981"
  };
  const color = priorityColors[crime.priority] || "#3b82f6";
  const userName = user?.username || user?.name || "Citizen";
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const mapLink = crime.location?.lat ? `https://www.google.com/maps?q=${crime.location.lat},${crime.location.lng}` : "#";

  let evidenceHtml = "";
  if (crime.evidence && crime.evidence.length > 0) {
    evidenceHtml = `
      <div style="margin-top: 24px;">
        <p style="color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; margin: 0 0 12px;">Evidence / Attachments</p>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          ${crime.evidence.map(ev => `
            <div style="width: 120px; height: 120px; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
              <img src="${ev.url}" alt="Evidence" style="width: 100%; height: 100%; object-fit: cover;" />
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  return `
    <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 32px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <span style="font-size: 28px;">🚨</span> CRIME ALERT
        </h1>
        <p style="color: #94a3b8; margin: 8px 0 0; font-size: 14px;">Real-time public safety update</p>
      </div>

      <!-- Content Body -->
      <div style="padding: 32px 24px; background-color: #ffffff;">
        <div style="display: inline-block; padding: 4px 12px; border-radius: 9999px; background-color: ${color}15; color: ${color}; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 16px;">
          ${crime.priority || 'Medium'} Priority Case
        </div>
        
        <p style="color: #1e293b; font-size: 18px; font-weight: 600; margin: 0 0 8px;">Hi ${userName},</p>
        <p style="color: #4b5563; line-height: 1.6; margin: 0 0 24px; font-size: 15px;">${customMessage}</p>

        <!-- Action Button -->
        <div style="text-align: center;">
          <a href="${frontendUrl}/report/${crime._id}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 32px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 14px; transition: background-color 0.2s;">
            View Details
          </a>
        </div>
      </div>

      <!-- Footer -->
      <div style="padding: 24px; background-color: #f8fafc; border-top: 1px solid #e5e7eb; text-align: center;">
        <p style="color: #94a3b8; font-size: 11px; margin: 0 0 12px;">This is an automated safety alert. If this is an active emergency, call 100 or use the SOS feature in your dashboard.</p>
        <div style="color: #64748b; font-size: 12px; font-weight: 500;">
          © 2026 CrimeTrack. Secure Network Transmission.
        </div>
      </div>
    </div>
  `;
};

// Send crime alert email (Professional version)
export const sendCrimeAlertEmail = async (user, crime, customMessage = null, customHtml = null, subject = null) => {
  try {
    await ensureTransporterReady();
    
    if (!user || !user.email) {
      console.warn("⚠️ Cannot send crime alert email: User email is missing.");
      return;
    }

    const isVerified = customMessage && customMessage.includes("verified");
    const isRejected = customMessage && customMessage.includes("rejected");
    const isForwarded = customMessage && customMessage.includes("forwarded");
    const isAssigned = customMessage && customMessage.includes("assigned");
    const isNewReport = customMessage && customMessage.includes("submitted");

    let defaultSubject = "🚨 CRIME ALERT";
    if (isVerified) defaultSubject = "✅ Report Verified - CrimeTrack";
    else if (isRejected) defaultSubject = "❌ Report Status Update - CrimeTrack";
    else if (isForwarded) defaultSubject = "👮 Case Forwarded to Police";
    else if (isAssigned) defaultSubject = "🚨 New Case Assignment";
    else if (isNewReport) defaultSubject = "📋 Report Received - CrimeTrack";

    const emailSubject = subject || defaultSubject;
    const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER;

    const isAdminNotification = customMessage && customMessage.includes("New crime report has been submitted");
    const isVerifiedNotification = customMessage && customMessage.includes("Your crime report has been verified");
    const isRejectedNotification = customMessage && customMessage.includes("Your crime report has been rejected");
    const isPoliceAssignment = customMessage && customMessage.includes("New case has been assigned to you");
    const isReporterForwarded = customMessage && customMessage.includes("Your crime report has been forwarded to the police");
    
    let html;
    if (isAdminNotification) {
      html = `
        <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 32px 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">📋 New Case Report</h1>
          </div>
          <div style="padding: 32px 24px; background-color: #ffffff;">
            <p style="color: #4b5563; line-height: 1.8; margin: 0 0 24px; font-size: 16px; font-weight: 500;">${customMessage}</p>
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/adReport" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 32px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 14px;">View Reports Dashboard</a>
            </div>
          </div>
          <div style="padding: 24px; background-color: #f8fafc; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #94a3b8; font-size: 11px; margin: 0;">© 2026 CrimeTrack. Secure Network Transmission.</p>
          </div>
        </div>
      `;
    } else if (isReporterForwarded) {
      html = `
        <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 32px 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">✅ Case Forwarded to Police</h1>
          </div>
          <div style="padding: 32px 24px; background-color: #ffffff;">
            <p style="color: #4b5563; line-height: 1.8; margin: 0 0 24px; font-size: 16px; font-weight: 500;">${customMessage}</p>
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/citizen" style="display: inline-block; background-color: #8b5cf6; color: #ffffff; padding: 14px 32px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 14px;">Track Your Report</a>
            </div>
          </div>
        </div>
      `;
    } else if (isPoliceAssignment) {
      html = `
        <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 32px 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">🚨 Case Assignment</h1>
          </div>
          <div style="padding: 32px 24px; background-color: #ffffff;">
            <p style="color: #4b5563; line-height: 1.8; margin: 0 0 24px; font-size: 16px; font-weight: 500;">${customMessage}</p>
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/police/reports" style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 14px 32px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 14px;">View Case Details</a>
            </div>
          </div>
        </div>
      `;
    } else if (isVerifiedNotification) {
      html = `
        <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">✅ Report Verified</h1>
          </div>
          <div style="padding: 32px 24px; background-color: #ffffff;">
            <p style="color: #4b5563; line-height: 1.8; margin: 0 0 24px; font-size: 16px; font-weight: 500;">${customMessage}</p>
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/citizen" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 14px 32px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 14px;">View Your Report</a>
            </div>
          </div>
        </div>
      `;
    } else if (isRejectedNotification) {
      html = `
        <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 32px 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">❌ Report Rejected</h1>
          </div>
          <div style="padding: 32px 24px; background-color: #ffffff;">
            <p style="color: #4b5563; line-height: 1.8; margin: 0 0 24px; font-size: 16px; font-weight: 500;">${customMessage}</p>
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/citizen" style="display: inline-block; background-color: #ef4444; color: #ffffff; padding: 14px 32px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 14px;">View Report Details</a>
            </div>
          </div>
        </div>
      `;
    } else {
      html = getEmailTemplate(crime, customMessage, user);
    }

    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"CrimeTrack Alerts" <${fromAddress}>`,
      to: user.email,
      subject: emailSubject,
      text: customMessage || `Crime Alert: ${crime.title}`,
      html: customHtml || html,
    });
    console.log(`📨 Email sent successfully to: ${user.email}`);
  } catch (err) {
    console.error(`❌ Email error for ${user.email || "Unknown"}:`, err.message);
  }
};

export const sendSOSEmail = async (guardian, citizen, coords) => {
  try {
    const mapLink = coords.latitude ? `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}` : "#";
    const fromAddress = `"CrimeTrack Emergency" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`;
    const transporter = getTransporter();
    await transporter.sendMail({
      from: fromAddress,
      to: guardian.email,
      subject: `🚨 EMERGENCY: ${citizen.username} is in trouble!`,
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #ef4444; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
          <div style="background-color: #ef4444; padding: 32px 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">CRITICAL SOS ALERT</h1>
          </div>
          <div style="padding: 32px 24px;">
            <p style="font-size: 16px; color: #111827;"><strong>${citizen.username}</strong> has triggered an emergency SOS alert.</p>
            <a href="${mapLink}" style="display: block; color: #ef4444; font-weight: 700; font-size: 18px; text-decoration: underline;">📍 View on Maps</a>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error(`❌ SOS Email error for ${guardian.email}:`, err.message);
  }
};

export const sendComplaintEmail = async (user, complaint, customMessage = null) => {
  try {
    await ensureTransporterReady();
    if (!user || !user.email) return;
    const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    const isStatusUpdate = customMessage && (customMessage.includes("Verified") || customMessage.includes("Progress") || customMessage.includes("Solved"));
    const subject = isStatusUpdate ? "📋 Complaint Status Update" : "📩 New Complaint Filed";

    const html = `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
        <div style="background: linear-gradient(135deg, #6366f1 0%, #4338ca 100%); padding: 32px 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">${isStatusUpdate ? "📋 STATUS UPDATE" : "📩 NEW COMPLAINT"}</h1>
        </div>
        <div style="padding: 32px 24px; background-color: #ffffff;">
          <p style="color: #4b5563;">${customMessage || 'A complaint has been updated.'}</p>
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/citizen" style="display: inline-block; background-color: #4338ca; color: #ffffff; padding: 14px 32px; border-radius: 8px; font-weight: 600; text-decoration: none;">View Dashboard</a>
          </div>
        </div>
      </div>
    `;

    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"CrimeTrack Complaints" <${fromAddress}>`,
      to: user.email,
      subject: subject,
      text: customMessage || `Complaint Update: ${complaint.title}`,
      html: html,
    });
  } catch (err) {
    console.error(`❌ Complaint Email error for ${user.email || "Unknown"}:`, err.message);
  }
};
