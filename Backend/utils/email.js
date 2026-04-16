import nodemailer from "nodemailer";

let transporterInstance = null;
let transporterReady = null;

export const getTransporter = () => {
  if (!transporterInstance) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error("Email credentials are missing. Set EMAIL_USER and EMAIL_PASS in backend environment variables.");
    }

    // Handle EMAIL_PASS with or without quotes
    let emailPass = process.env.EMAIL_PASS;
    if (emailPass && (emailPass.startsWith('"') || emailPass.startsWith("'"))) {
      emailPass = emailPass.slice(1, -1);
    }

    const hasCustomSmtp =
      process.env.EMAIL_HOST && process.env.EMAIL_PORT && process.env.EMAIL_SECURE !== undefined;

    transporterInstance = nodemailer.createTransport(
      hasCustomSmtp
        ? {
            host: process.env.EMAIL_HOST,
            port: Number(process.env.EMAIL_PORT),
            secure: process.env.EMAIL_SECURE === "true",
            auth: {
              user: process.env.EMAIL_USER,
              pass: emailPass,
            },
          }
        : {
            service: "gmail",
            auth: {
              user: process.env.EMAIL_USER,
              pass: emailPass,
            },
          }
    );

    transporterReady = transporterInstance
      .verify()
      .then(() => {
        console.log("✅ Email transporter is ready to send messages");
      })
      .catch((error) => {
        console.error("❌ Email transporter verification failed:", error.message);
      });
  }
  return transporterInstance;
};

export const ensureTransporterReady = async () => {
  getTransporter();
  if (transporterReady) {
    await transporterReady;
  }
};

// Helper for professional email templates
const getEmailTemplate = (crime, customMessage = null) => {
  const priorityColors = {
    Critical: "#ef4444",
    High: "#f97316",
    Medium: "#3b82f6",
    Low: "#10b981"
  };
  const color = priorityColors[crime.priority] || "#3b82f6";
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
export const sendCrimeAlertEmail = async (user, crime, customMessage = null, customHtml = null) => {
  try {
    // Check if this is an admin notification (simple message only)
    const isAdminNotification = customMessage && customMessage.includes("New crime report has been submitted");
    
    // Check if this is a verification notification
    const isVerifiedNotification = customMessage && customMessage.includes("Your crime report has been verified");
    const isRejectedNotification = customMessage && customMessage.includes("Your crime report has been rejected");
    const isPoliceAssignment = customMessage && customMessage.includes("New case has been assigned to you");
    const isReporterForwarded = customMessage && customMessage.includes("Your crime report has been forwarded to the police");
    
    let html;
    if (isAdminNotification) {
      // Simple email for admin notifications
      html = `
        <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 32px 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">
              📋 New Case Report
            </h1>
          </div>

          <!-- Content Body -->
          <div style="padding: 32px 24px; background-color: #ffffff;">
            <p style="color: #4b5563; line-height: 1.8; margin: 0 0 24px; font-size: 16px; font-weight: 500;">${customMessage}</p>

            <!-- Action Button -->
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/adReport" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 32px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 14px;">
                View Reports Dashboard
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="padding: 24px; background-color: #f8fafc; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #94a3b8; font-size: 11px; margin: 0;">
              © 2026 CrimeTrack. Secure Network Transmission.
            </p>
          </div>
        </div>
      `;
    } else if (isReporterForwarded) {
      // Reporter notification when case is forwarded to police
      html = `
        <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 32px 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">
              ✅ Case Forwarded to Police
            </h1>
            <p style="color: #ede9fe; margin: 8px 0 0; font-size: 14px;">Your report is now under investigation</p>
          </div>

          <!-- Content Body -->
          <div style="padding: 32px 24px; background-color: #ffffff;">
            <p style="color: #4b5563; line-height: 1.8; margin: 0 0 24px; font-size: 16px; font-weight: 500;">${customMessage}</p>

            <!-- Status Update Box -->
            <div style="background-color: #faf5ff; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #e9d5ff;">
              <p style="color: #6b21a8; font-size: 14px; margin: 0 0 12px; font-weight: 600;">
                📊 Case Status Timeline:
              </p>
              <div style="color: #581c87; font-size: 13px; line-height: 2;">
                <div>✅ Report Submitted</div>
                <div>✅ Admin Verified</div>
                <div style="font-weight: 700; color: #7c3aed;">👮 Forwarded to Police (Current)</div>
                <div>⏳ Under Investigation</div>
                <div>⏳ Resolution</div>
              </div>
            </div>

            <!-- Info Box -->
            <div style="background-color: #fef3c7; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #fde68a;">
              <p style="color: #92400e; font-size: 14px; margin: 0; font-weight: 500;">
                💡 <strong>What happens next?</strong><br/>
                The police will review your report, investigate the incident, and take appropriate action. You'll receive email updates at each stage of the process.
              </p>
            </div>

            <!-- Action Button -->
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/citizen" style="display: inline-block; background-color: #8b5cf6; color: #ffffff; padding: 14px 32px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 14px;">
                Track Your Report
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="padding: 24px; background-color: #f8fafc; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #94a3b8; font-size: 11px; margin: 0 0 12px;">Your courage to report helps make our community safer. Thank you!</p>
            <p style="color: #64748b; font-size: 12px; font-weight: 500;">
              © 2026 CrimeTrack. Secure Network Transmission.
            </p>
          </div>
        </div>
      `;
    } else if (isPoliceAssignment) {
      // Police case assignment email
      html = `
        <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 32px 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">
              🚨 Case Assignment
            </h1>
            <p style="color: #dbeafe; margin: 8px 0 0; font-size: 14px;">New case assigned for investigation</p>
          </div>

          <!-- Content Body -->
          <div style="padding: 32px 24px; background-color: #ffffff;">
            <p style="color: #4b5563; line-height: 1.8; margin: 0 0 24px; font-size: 16px; font-weight: 500;">${customMessage}</p>

            <!-- Action Required Box -->
            <div style="background-color: #eff6ff; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #bfdbfe;">
              <p style="color: #1e40af; font-size: 14px; margin: 0 0 12px; font-weight: 600;">
                📋 Required Actions:
              </p>
              <ul style="color: #1e3a8a; font-size: 13px; margin: 0; padding-left: 20px; line-height: 1.8;">
                <li>Review case details and evidence</li>
                <li>Initiate field investigation</li>
                <li>Update case status as you progress</li>
                <li>Mark as resolved when complete</li>
              </ul>
            </div>

            <!-- Action Button -->
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/police/reports" style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 14px 32px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 14px;">
                View Case Details
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="padding: 24px; background-color: #f8fafc; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #94a3b8; font-size: 11px; margin: 0 0 12px;">This is an official case assignment. Please prioritize accordingly.</p>
            <p style="color: #64748b; font-size: 12px; font-weight: 500;">
              © 2026 CrimeTrack. Secure Network Transmission.
            </p>
          </div>
        </div>
      `;
    } else if (isVerifiedNotification) {
      // Verified report email
      html = `
        <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">
              ✅ Report Verified
            </h1>
            <p style="color: #d1fae5; margin: 8px 0 0; font-size: 14px;">Your submission has been approved</p>
          </div>

          <!-- Content Body -->
          <div style="padding: 32px 24px; background-color: #ffffff;">
            <p style="color: #4b5563; line-height: 1.8; margin: 0 0 24px; font-size: 16px; font-weight: 500;">${customMessage}</p>

            <!-- Status Box -->
            <div style="background-color: #f0fdf4; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #bbf7d0;">
              <p style="color: #166534; font-size: 14px; margin: 0; font-weight: 600; text-align: center;">
                🎯 Status: Under Investigation
              </p>
            </div>

            <!-- Action Button -->
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/citizen" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 14px 32px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 14px;">
                View Your Report
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="padding: 24px; background-color: #f8fafc; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #94a3b8; font-size: 11px; margin: 0 0 12px;">Thank you for helping keep our community safe. You will be notified of any updates.</p>
            <p style="color: #64748b; font-size: 12px; font-weight: 500;">
              © 2026 CrimeTrack. Secure Network Transmission.
            </p>
          </div>
        </div>
      `;
    } else if (isRejectedNotification) {
      // Rejected report email
      html = `
        <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 32px 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">
              ❌ Report Rejected
            </h1>
            <p style="color: #fecaca; margin: 8px 0 0; font-size: 14px;">Action required on your submission</p>
          </div>

          <!-- Content Body -->
          <div style="padding: 32px 24px; background-color: #ffffff;">
            <p style="color: #4b5563; line-height: 1.8; margin: 0 0 24px; font-size: 16px; font-weight: 500;">${customMessage}</p>

            <!-- Info Box -->
            <div style="background-color: #fef2f2; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #fecaca;">
              <p style="color: #991b1b; font-size: 14px; margin: 0 0 12px; font-weight: 600;">
                ⚠️ What you can do:
              </p>
              <ul style="color: #7f1d1d; font-size: 13px; margin: 0; padding-left: 20px; line-height: 1.8;">
                <li>Submit a new report with additional evidence</li>
                <li>Contact support if you believe this is an error</li>
                <li>Provide more details about the incident</li>
              </ul>
            </div>

            <!-- Action Button -->
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/citizen" style="display: inline-block; background-color: #ef4444; color: #ffffff; padding: 14px 32px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 14px;">
                View Report Details
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="padding: 24px; background-color: #f8fafc; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #94a3b8; font-size: 11px; margin: 0 0 12px;">Need help? Contact our support team for assistance.</p>
            <p style="color: #64748b; font-size: 12px; font-weight: 500;">
              © 2026 CrimeTrack. Secure Network Transmission.
            </p>
          </div>
        </div>
      `;
    } else {
      // Use the standard template for other notifications
      html = getEmailTemplate(crime, customMessage);
    }

    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"Crime Track Security" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `🚨 CRIME ALERT`,
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
