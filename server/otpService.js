const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '.env');

// Auto-reload server/.env on demand
function loadEnv() {
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [k, ...v] = trimmed.split('=');
        if (k && v.length) {
          process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
        }
      }
    });
  }
}
loadEnv();

// In-memory OTP Store: email -> { otp, expiresAt, attempts }
const otpStore = new Map();

// Helper to get or create nodemailer transporter
function getTransporter() {
  loadEnv();
  const user = (process.env.EMAIL_USER || '').trim();
  // Strip any spaces from Google 16-character app password (e.g. 'xxxx xxxx xxxx xxxx' -> 'xxxxxxxxxxxxxxxx')
  const rawPass = (process.env.EMAIL_APP_PASSWORD || '').trim();
  const pass = rawPass.replace(/\s+/g, '');

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });
}

/**
 * Generate and send 4-digit OTP to user's email address
 */
async function sendOtp(email) {
  if (!email || !email.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Generate a clean 4-digit numeric OTP (e.g. 7482)
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

  otpStore.set(normalizedEmail, { otp, expiresAt, attempts: 0 });

  console.log(`[Email OTP Service]: Generated 4-digit OTP for ${normalizedEmail} -> ${otp}`);

  const transporter = getTransporter();

  if (transporter) {
    try {
      const htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0b111e; border: 1px solid #1e293b; border-radius: 16px; padding: 28px; color: #f8fafc;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-flex; align-items: center; justify-content: center; width: 50px; height: 50px; background: rgba(0, 243, 255, 0.1); border: 1.5px solid #00f3ff; border-radius: 14px; margin-bottom: 12px;">
              <span style="font-size: 24px; color: #00f3ff; font-weight: bold;">⚡</span>
            </div>
            <h2 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">ShadowTalk Verification</h2>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: #94a3b8;">Quantum Mesh Network &bull; Verified Profile Attestation</p>
          </div>

          <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <p style="margin: 0 0 12px 0; font-size: 13px; color: #cbd5e1;">Your 4-digit verification code is:</p>
            <div style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 12px; color: #00f3ff; text-shadow: 0 0 20px rgba(0, 243, 255, 0.4); padding: 10px 0;">
              ${otp}
            </div>
            <p style="margin: 12px 0 0 0; font-size: 12px; color: #64748b;">This code expires in 10 minutes. Do not share it with anyone.</p>
          </div>

          <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5; text-align: center;">
            Entering this code will grant your profile the official <strong>Verified Blue Tick</strong> badge across all encrypted mesh transmissions.
          </p>
        </div>
      `;

      await transporter.sendMail({
        from: `"ShadowTalk Security" <${process.env.EMAIL_USER}>`,
        to: normalizedEmail,
        subject: `${otp} is your ShadowTalk Verification Code`,
        html: htmlContent
      });

      console.log(`[Email OTP Service]: Real email sent successfully to ${normalizedEmail}`);
      return {
        success: true,
        message: `Verification code sent to ${normalizedEmail}`,
        email: normalizedEmail
      };
    } catch (mailErr) {
      console.error(`[Email OTP Service]: Failed to send via Gmail SMTP (${mailErr.message})`);
      throw new Error(`Failed to send email: ${mailErr.message}. Please verify the email address.`);
    }
  } else {
    throw new Error('Email service is not configured on the server. Please ensure EMAIL_USER and EMAIL_APP_PASSWORD are set in server/.env.');
  }
}

/**
 * Verify submitted 4-digit OTP
 */
function verifyOtp(email, enteredOtp) {
  if (!email || !enteredOtp) {
    throw new Error('Email and 4-digit code are required.');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const record = otpStore.get(normalizedEmail);

  if (!record) {
    throw new Error('No verification code requested for this email. Please click Resend Code.');
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(normalizedEmail);
    throw new Error('Verification code has expired. Please request a new code.');
  }

  record.attempts += 1;
  if (record.attempts > 5) {
    otpStore.delete(normalizedEmail);
    throw new Error('Too many invalid attempts. Please request a new code.');
  }

  if (record.otp.trim() !== enteredOtp.trim()) {
    throw new Error('Incorrect 4-digit verification code. Please check and try again.');
  }

  // OTP is valid!
  otpStore.delete(normalizedEmail);
  console.log(`[Email OTP Service]: Email successfully verified -> ${normalizedEmail}`);

  return { success: true, verified: true, email: normalizedEmail };
}

/**
 * Save / update email credentials in server/.env and reload
 */
function updateEmailConfig(user, pass) {
  if (!user || !pass) {
    throw new Error('Both email and app password are required.');
  }

  process.env.EMAIL_USER = user.trim();
  process.env.EMAIL_APP_PASSWORD = pass.trim();

  // Persist to server/.env
  const content = `PORT=5000\nEMAIL_USER=${user.trim()}\nEMAIL_APP_PASSWORD=${pass.trim()}\n`;
  fs.writeFileSync(envPath, content, 'utf8');

  console.log(`[Email OTP Service]: Updated Gmail SMTP credentials in .env -> ${user}`);
  return { success: true, emailUser: user.trim() };
}

module.exports = {
  sendOtp,
  verifyOtp,
  updateEmailConfig,
  isConfigured: () => {
    loadEnv();
    return Boolean(process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD);
  }
};
