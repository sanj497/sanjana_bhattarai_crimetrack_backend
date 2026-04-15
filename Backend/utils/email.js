import nodemailer from "nodemailer";

let transporterInstance = null;

export const getTransporter = () => {
  if (!transporterInstance) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("⚠️ Email credentials missing in environment variables!");
      console.warn("📧 Email functionality will be disabled. Set EMAIL_USER and EMAIL_PASS in .env");
    }
    
    transporterInstance = nodemailer.createTransport({
      service: "gmail",
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    
    // Verify connection configuration (non-blocking)
    transporterInstance.verify(function(error, success) {
      if (error) {
        console.error("❌ Email transporter verification failed:", error.message);
        console.error("📧 Check your EMAIL_USER and EMAIL_PASS environment variables");
      } else {
        console.log("✅ Email transporter is ready to send messages");
      }
    });
  }
  return transporterInstance;
};

// Helper for professional email templates
const getEmailTemplate = (title, crimeType, location, description, priority, crimeId) => {
  const priorityColors = {
    Critical: "#ef4444",
    High: "#f97316",
    Medium: "#3b82f6",
    Low: "#10b981"
  };
  const color = priorityColors[priority] || "#3b82f6";
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  return `
    <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 32px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <span style="font-size: 28px;">🚨</span> CRIME TRACK ALERT
        </h1>
        <p style="color: #94a3b8; margin: 8px 0 0; font-size: 14px;">Real-time public safety update</p>
      </div>

      <!-- Content Body -->
      <div style="padding: 32px 24px; background-color: #ffffff;">
        <div style="display: inline-block; padding: 4px 12px; border-radius: 9999px; background-color: ${color}15; color: ${color}; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 16px;">
          ${priority} Priority Case
        </div>
        
        <h2 style="color: #111827; margin: 0 0 12px; font-size: 20px; font-weight: 700;">${title}</h2>
        <p style="color: #4b5563; line-height: 1.6; margin: 0 0 24px; font-size: 15px;">${description}</p>

        <!-- Detail Grid -->
        <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 32px; border: 1px solid #f1f5f9;">
          <div style="margin-bottom: 16px;">
            <p style="color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; margin: 0 0 4px;">Incident Type</p>
            <p style="color: #334155; font-size: 14px; margin: 0; font-weight: 500;">${crimeType}</p>
          </div>
          <div>
            <p style="color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; margin: 0 0 4px;">Location</p>
            <p style="color: #334155; font-size: 14px; margin: 0; font-weight: 500;">📍 ${location || "Location shared with authorities"}</p>
          </div>
        </div>

        <!-- Action Button -->
        <div style="text-align: center;">
          <a href="${frontendUrl}/report/${crimeId}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 32px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 14px; transition: background-color 0.2s;">
            View Full Report Status
          </a>
        </div>
      </div>

      <!-- Footer -->
      <div style="padding: 24px; background-color: #f8fafc; border-top: 1px solid #e5e7eb; text-align: center;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0 0 12px;">You are receiving this alert because you are a registered member of the Crime Track community.</p>
        <div style="color: #64748b; font-size: 12px; font-weight: 500;">
          © 2026 CrimeTrack. All rights reserved.
        </div>
      </div>
    </div>
  `;
};

// Send crime alert email (Professional version)
export const sendCrimeAlertEmail = async (user, crime, customMessage = null, customHtml = null) => {
  try {
    const html = getEmailTemplate(
      crime.title,
      crime.crimeType,
      crime.location?.address,
      customMessage || crime.description,
      crime.priority || "Medium",
      crime._id
    );

    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"Crime Track Security" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `🚨 CRIME ALERT: ${crime.title}`,
      text: customMessage || `Crime Alert: ${crime.title} (${crime.crimeType}) reported at ${crime.location?.address}. Priority: ${crime.priority || "Medium"}.`,
      html: customHtml || html,
    });

    console.log(`✅ Professional Alert Email sent to ${user.email}`);
  } catch (err) {
    console.error(`❌ Email error for ${user.email}:`, err.message);
  }
};

// Send SOS alert to Guardians
export const sendSOSEmail = async (guardian, citizen, coords) => {
  try {
    const mapLink = coords.latitude ? `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}` : "#";
    
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"CrimeTrack Emergency" <${process.env.EMAIL_USER}>`,
      to: guardian.email,
      subject: `🚨 EMERGENCY: ${citizen.username} is in trouble!`,
      html: `
        <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #ef4444; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
          <div style="background-color: #ef4444; padding: 32px 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">CRITICAL SOS ALERT</h1>
          </div>
          <div style="padding: 32px 24px;">
            <p style="font-size: 16px; color: #111827; line-height: 1.5;">
              <strong>${citizen.username}</strong> has triggered an emergency SOS alert. They may be in immediate danger.
            </p>
            
            <div style="background-color: #fef2f2; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #fee2e2;">
              <h3 style="margin: 0 0 12px; color: #b91c1c; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Last Known Location</h3>
              <a href="${mapLink}" style="display: block; color: #ef4444; font-weight: 700; font-size: 18px; text-decoration: underline; margin-bottom: 12px;">
                📍 View on Google Maps
              </a>
              <p style="margin: 0; color: #7f1d1d; font-size: 13px;">
                <strong>Coordinates:</strong> ${coords.latitude}, ${coords.longitude}<br>
                <strong>Accuracy:</strong> ${Math.round(coords.accuracy || 0)} meters
              </p>
            </div>

            <div style="background-color: #fffbeb; border-radius: 8px; padding: 16px; border: 1px solid #fef3c7;">
              <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 500;">
                ⚠️ Please contact emergency services (100) or reach out to ${citizen.username} immediately.
              </p>
            </div>
          </div>
          <div style="padding: 24px; background-color: #f8fafc; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">Sent via CrimeTrack Emergency Response System</p>
          </div>
        </div>
      `,
    });
    console.log(`📡 SOS Email sent to Guardian ${guardian.name} (${guardian.email})`);
  } catch (err) {
    console.error(`❌ SOS Email error for ${guardian.email}:`, err.message);
  }
};