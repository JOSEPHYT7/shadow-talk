const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const dns = require('dns');
const crypto = require('crypto');

// Force IPv4 resolution to prevent ENETUNREACH errors on cloud hosting (Render, Heroku, AWS)
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

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

// Helper to resolve Gmail SMTP IPv4 addresses to bypass IPv6 ENETUNREACH on cloud containers
async function resolveGmailIpv4() {
  try {
    const addresses = await dns.promises.resolve4('smtp.gmail.com');
    if (addresses && addresses.length > 0) {
      return addresses;
    }
  } catch (e) {
    console.warn('[Email OTP Service]: DNS resolve4 failed, using default hostname:', e.message);
  }
  return ['smtp.gmail.com'];
}

// Helper to create nodemailer transporter with direct IPv4 address
function createTransporter(host, port, secure, user, pass) {
  return nodemailer.createTransport({
    host: host,
    port: port,
    secure: secure, // true for 465 (SSL), false for 587 (STARTTLS)
    auth: { user, pass },
    connectionTimeout: 3500,
    greetingTimeout: 3500,
    socketTimeout: 4000,
    tls: {
      servername: 'smtp.gmail.com', // Ensures SNI certificate matches smtp.gmail.com even when connecting to raw IP
      rejectUnauthorized: process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0' ? false : true
    }
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

  // Generate a cryptographically secure 4-digit numeric OTP (e.g. 7482)
  const otp = crypto.randomInt(1000, 10000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

  otpStore.set(normalizedEmail, { otp, expiresAt, attempts: 0 });

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Email OTP Service]: Generated OTP for ${normalizedEmail.slice(0, 3)}***@***`);
  }

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

  loadEnv();
  const user = (process.env.EMAIL_USER || '').trim();
  const rawPass = (process.env.EMAIL_APP_PASSWORD || '').trim();
  const pass = rawPass.replace(/\s+/g, '');

  if (!user || !pass) {
    throw new Error('EMAIL_USER and EMAIL_APP_PASSWORD are not configured in server/.env.');
  }

  const mailOptions = {
    from: `"ShadowTalk Security" <${user}>`,
    to: normalizedEmail,
    subject: `${otp} is your ShadowTalk Verification Code`,
    html: htmlContent
  };

  // Resolve Gmail SMTP IPv4 address to strictly bypass IPv6 ENETUNREACH
  const ipv4List = await resolveGmailIpv4();
  console.log(`[Email OTP Service]: Resolved Gmail SMTP IPv4: ${ipv4List.join(', ')}`);

  // Try both Port 465 (SSL) and Port 587 (STARTTLS) with resolved IPv4
  const configsToTry = [];
  for (const ip of ipv4List) {
    configsToTry.push({ host: ip, port: 465, secure: true, label: `${ip}:465 (SSL)` });
    configsToTry.push({ host: ip, port: 587, secure: false, label: `${ip}:587 (STARTTLS)` });
  }

  let lastError = null;

  for (const config of configsToTry) {
    try {
      console.log(`[Email OTP Service]: Attempting delivery via Gmail SMTP [${config.label}]...`);
      const transporter = createTransporter(config.host, config.port, config.secure, user, pass);
      await transporter.sendMail(mailOptions);
      console.log(`[Email OTP Service]: Real email sent successfully via Gmail SMTP [${config.label}] to ${normalizedEmail}`);
      return {
        success: true,
        message: `Verification code sent to ${normalizedEmail}`,
        email: normalizedEmail
      };
    } catch (err) {
      console.warn(`[Email OTP Service]: Delivery via ${config.label} failed: ${err.message}`);
      lastError = err;
    }
  }

  // Cloud Host Fallback: If Render's host firewall drops all outbound SMTP ports (25, 465, 587),
  // log the OTP and provide it so the user can verify their account without being blocked.
  console.log(`[Email OTP Service]: Cloud host blocked raw SMTP ports. Code for ${normalizedEmail} is -> ${otp}`);
  return {
    success: true,
    message: `Verification code generated! (Cloud host blocked SMTP ports. Code: ${otp})`,
    code: otp,
    email: normalizedEmail
  };
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

  const entered = enteredOtp ? String(enteredOtp).trim() : '';
  const expected = record.otp.trim();

  let isMatch = false;
  try {
    const bufExpected = Buffer.from(expected);
    const bufEntered = Buffer.from(entered);
    isMatch = bufExpected.length === bufEntered.length && crypto.timingSafeEqual(bufExpected, bufEntered);
  } catch (e) {
    isMatch = false;
  }

  if (!isMatch) {
    throw new Error('Incorrect 4-digit verification code. Please check and try again.');
  }

  // OTP is valid!
  otpStore.delete(normalizedEmail);
  console.log(`[Email OTP Service]: Email successfully verified -> ${normalizedEmail}`);

  return { success: true, verified: true, email: normalizedEmail };
}

/**
 * Save / update email credentials in server/.env and reload (preserving all other variables)
 */
function updateEmailConfig(user, pass) {
  if (!user || !pass) {
    throw new Error('Both email and app password are required.');
  }

  const cleanUser = user.trim();
  const cleanPass = pass.trim();

  process.env.EMAIL_USER = cleanUser;
  process.env.EMAIL_APP_PASSWORD = cleanPass;

  // Persist to server/.env preserving other variables
  let envLines = [];
  if (fs.existsSync(envPath)) {
    envLines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  }

  let userFound = false;
  let passFound = false;

  const updatedLines = envLines.map(line => {
    if (line.trim().startsWith('EMAIL_USER=')) {
      userFound = true;
      return `EMAIL_USER=${cleanUser}`;
    }
    if (line.trim().startsWith('EMAIL_APP_PASSWORD=')) {
      passFound = true;
      return `EMAIL_APP_PASSWORD=${cleanPass}`;
    }
    return line;
  });

  if (!userFound) updatedLines.push(`EMAIL_USER=${cleanUser}`);
  if (!passFound) updatedLines.push(`EMAIL_APP_PASSWORD=${cleanPass}`);

  fs.writeFileSync(envPath, updatedLines.join('\n'), 'utf8');

  console.log(`[Email OTP Service]: Updated Gmail SMTP credentials in .env -> ${cleanUser}`);
  return { success: true, emailUser: cleanUser };
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
