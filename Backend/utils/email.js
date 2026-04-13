import nodemailer from "nodemailer";

// Create transporter using ENV variables
export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send crime alert email
export const sendCrimeAlertEmail = async (user, crime) => {
  try {
    await transporter.sendMail({
      from: `"Crime Alert" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "🚨 Crime Alert Near You",
      text: `Hello,

A crime has been reported near your location:

Title: ${crime.title}
Type: ${crime.crimeType}
Description: ${crime.description}
Location: ${crime.location?.address || "Unknown"}

Stay safe!
- Crime Alert System`,
    });

    console.log(`✅ Email sent to ${user.email}`);
  } catch (err) {
    console.error("❌ Email error:", err.message);
  }
};

// Send SOS alert to Guardians
export const sendSOSEmail = async (guardian, citizen, coords) => {
  try {
    const mapLink = coords.latitude ? `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}` : "#";
    
    await transporter.sendMail({
      from: `"Emergency SOS" <${process.env.EMAIL_USER}>`,
      to: guardian.email,
      subject: `🚨 EMERGENCY: ${citizen.username} is in trouble!`,
      text: `Hello ${guardian.name},

CRITICAL: ${citizen.username} has triggered an SOS emergency alert.

Current Reported Location: 
${mapLink}

Coordinates: ${coords.latitude || "Unknown"}, ${coords.longitude || "Unknown"}
Accuracy: ${coords.accuracy || "Unknown"} meters

Please take immediate action or contact the authorities.

- CrimeTrack Emergency System`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 2px solid #ef4444; border-radius: 12px;">
          <h2 style="color: #ef4444;">🚨 EMERGENCY SOS ALERT</h2>
          <p><strong>${citizen.username}</strong> is in trouble and has triggered an emergency alert!</p>
          <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Location:</strong> <a href="${mapLink}" style="color: #ef4444; font-weight: bold;">View on Google Maps</a></p>
            <p><strong>Accuracy:</strong> ${Math.round(coords.accuracy || 0)} meters</p>
          </div>
          <p style="font-size: 12px; color: #6b7280;">Please check on them immediately.</p>
        </div>
      `
    });
    console.log(`📡 SOS Email sent to Guardian ${guardian.name} (${guardian.email})`);
  } catch (err) {
    console.error(`❌ SOS Email error for ${guardian.email}:`, err.message);
  }
};