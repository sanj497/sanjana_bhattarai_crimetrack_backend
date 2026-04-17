// Email Configuration Test Script
// Run this with: node test-email.js
// Note: This uses the existing .env from your backend

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simple .env file parser
const envPath = join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  line = line.trim();
  if (line && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      let value = valueParts.join('=').trim();
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      envVars[key.trim()] = value;
    }
  }
});

// Set environment variables
Object.keys(envVars).forEach(key => {
  process.env[key] = envVars[key];
});

console.log('🔍 Testing Email Configuration...\n');
console.log('📋 Environment Variables:');
console.log(`   EMAIL_USER: ${process.env.EMAIL_USER || 'NOT SET'}`);
console.log(`   EMAIL_PASS: ${process.env.EMAIL_PASS ? 'SET (hidden)' : 'NOT SET'}`);
console.log(`   EMAIL_FROM: ${process.env.EMAIL_FROM || 'NOT SET'}`);
console.log(`   EMAIL_HOST: ${process.env.EMAIL_HOST || 'NOT SET'}`);
console.log(`   EMAIL_PORT: ${process.env.EMAIL_PORT || 'NOT SET'}`);
console.log(`   EMAIL_SECURE: ${process.env.EMAIL_SECURE || 'NOT SET'}\n`);

// Clean up EMAIL_PASS (remove quotes if present)
let emailPass = process.env.EMAIL_PASS;
if (emailPass && (emailPass.startsWith('"') || emailPass.startsWith("'"))) {
  emailPass = emailPass.slice(1, -1);
  console.log('⚠️  Removed quotes from EMAIL_PASS\n');
}

async function testEmail() {
  try {
    console.log('📧 Creating transporter...\n');
    
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: emailPass,
      },
    });

    console.log('🔌 Verifying connection to SMTP server...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');

    // Test email
    const testEmail = process.env.EMAIL_USER; // Send to yourself
    console.log(`📤 Sending test email to: ${testEmail}`);
    
    const info = await transporter.sendMail({
      from: `"CrimeTrack Test" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: testEmail,
      subject: '✅ CrimeTrack Email Test Successful',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; color: white;">
          <h1 style="margin: 0 0 20px; font-size: 32px;">🎉 Success!</h1>
          <p style="font-size: 18px; margin: 0 0 20px;">Your email configuration is working perfectly!</p>
          <div style="background: rgba(255,255,255,0.2); padding: 20px; border-radius: 12px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px;"><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
            <p style="margin: 10px 0 0; font-size: 14px;"><strong>Status:</strong> ✅ All systems operational</p>
          </div>
          <p style="font-size: 14px; opacity: 0.8; margin: 20px 0 0;">If you received this email, your OTP system should work correctly.</p>
        </div>
      `,
    });

    console.log('\n✅ Test email sent successfully!');
    console.log(`📬 Message ID: ${info.messageId}`);
    console.log(`📬 Response: ${info.response}`);
    console.log('\n🎉 Email configuration is working! OTP emails should now be sent successfully.');
    
  } catch (error) {
    console.error('\n❌ Email test FAILED!');
    console.error(`\n🔴 Error: ${error.message}`);
    console.error(`🔴 Error Code: ${error.code}`);
    console.error(`🔴 Command: ${error.command}`);
    
    console.error('\n📋 Common Issues & Solutions:');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (error.code === 'EAUTH') {
      console.error('\n🔐 Authentication Error (EAUTH):');
      console.error('   1. Gmail App Password is incorrect or expired');
      console.error('   2. Go to: https://myaccount.google.com/apppasswords');
      console.error('   3. Generate a NEW App Password');
      console.error('   4. Update EMAIL_PASS in Backend/.env');
      console.error('   5. Restart the backend server');
    } else if (error.code === 'ESOCKET' || error.code === 'ECONNECTION') {
      console.error('\n🌐 Connection Error:');
      console.error('   1. Check your internet connection');
      console.error('   2. Firewall may be blocking port 587');
      console.error('   3. Try using EMAIL_SECURE=true with port 465');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('\n⏰ Timeout Error:');
      console.error('   1. SMTP server is not responding');
      console.error('   2. Check if EMAIL_HOST is correct (smtp.gmail.com)');
      console.error('   3. Try increasing timeout or check network');
    } else {
      console.error('\n🔧 General Troubleshooting:');
      console.error('   1. Verify EMAIL_USER is a valid Gmail address');
      console.error('   2. Ensure 2-Factor Authentication is enabled on Gmail');
      console.error('   3. Generate App Password (not regular password)');
      console.error('   4. Check Backend/.env file has correct values');
      console.error('   5. Restart backend server after .env changes');
    }
    
    console.error('\n💡 Quick Fix Steps:');
    console.error('   1. Visit: https://myaccount.google.com/security');
    console.error('   2. Enable 2-Step Verification (if not enabled)');
    console.error('   3. Visit: https://myaccount.google.com/apppasswords');
    console.error('   4. Select "Mail" and your device');
    console.error('   5. Copy the 16-character password');
    console.error('   6. Update EMAIL_PASS in Backend/.env');
    console.error('   7. Run this test again: node test-email.js\n');
    
    process.exit(1);
  }
}

testEmail();
