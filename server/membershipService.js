/**
 * Secret Society Membership Application Service
 * Receives real candidate data and dispatches notifications to the host via Gmail SMTP.
 */

const nodemailer = require('nodemailer');
const dns = require('dns');
const fs = require('fs');
const path = require('path');

const applicationsFile = path.join(__dirname, 'data', 'membership_applications.json');

// Ensure data directory and applications store exist
if (!fs.existsSync(path.dirname(applicationsFile))) {
  fs.mkdirSync(path.dirname(applicationsFile), { recursive: true });
}
if (!fs.existsSync(applicationsFile)) {
  fs.writeFileSync(applicationsFile, JSON.stringify([]), 'utf8');
}

function loadApplications() {
  try {
    const raw = fs.readFileSync(applicationsFile, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveApplications(apps) {
  try {
    fs.writeFileSync(applicationsFile, JSON.stringify(apps, null, 2), 'utf8');
  } catch (err) {
    console.error('[Membership Service]: Failed to save application:', err.message);
  }
}

// Resolve Gmail SMTP IPv4 address to bypass IPv6 ENETUNREACH
async function resolveGmailIpv4() {
  return new Promise((resolve) => {
    dns.resolve4('smtp.gmail.com', (err, addresses) => {
      if (!err && addresses && addresses.length > 0) {
        resolve(addresses);
      } else {
        resolve(['smtp.gmail.com']);
      }
    });
  });
}

function createTransporter(host, port, secure, user, pass) {
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: {
      servername: 'smtp.gmail.com',
      rejectUnauthorized: false
    },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 20000
  });
}

/**
 * Submit candidate application for Secret Society membership
 * @param {object} candidateData
 */
async function submitApplication(candidateData = {}) {
  const {
    alias,
    userId,
    fullName,
    email,
    role,
    ageLocation,
    purpose,
    socialHandle
  } = candidateData;

  if (!fullName || !fullName.trim()) {
    throw new Error('Full Name is required');
  }
  if (!email || !email.includes('@')) {
    throw new Error('Valid Email Address is required');
  }
  if (!purpose || purpose.trim().length < 10) {
    throw new Error('Please share a meaningful reason for joining (at least 10 characters)');
  }

  const applicationId = 'app_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  const newApp = {
    id: applicationId,
    alias: (alias || 'Anonymous').trim(),
    userId: userId || null,
    fullName: fullName.trim(),
    email: email.trim().toLowerCase(),
    role: (role || 'Independent Learner').trim(),
    ageLocation: (ageLocation || 'Unspecified').trim(),
    purpose: purpose.trim(),
    socialHandle: (socialHandle || 'None').trim(),
    status: 'pending',
    submittedAt: new Date().toISOString(),
    timestamp: Date.now()
  };

  // Save to disk
  const allApps = loadApplications();
  allApps.push(newApp);
  saveApplications(allApps);
  console.log(`[Membership Service]: Stored new candidate application: ${newApp.fullName} (@${newApp.alias})`);

  // Send email to EMAIL_USER (Host)
  const hostUser = (process.env.EMAIL_USER || '').trim();
  const rawPass = (process.env.EMAIL_APP_PASSWORD || '').trim();
  const pass = rawPass.replace(/\s+/g, '');

  if (!hostUser || !pass) {
    console.warn('[Membership Service]: EMAIL_USER / EMAIL_APP_PASSWORD not set. Stored to disk without email.');
    return {
      success: true,
      applicationId,
      message: 'Application recorded for council review.'
    };
  }

  const htmlEmail = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; background: #080c16; border: 1px solid #1e293b; border-radius: 16px; padding: 28px; color: #f8fafc;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-flex; align-items: center; justify-content: center; width: 52px; height: 52px; background: rgba(0, 243, 255, 0.1); border: 1.5px solid #00f3ff; border-radius: 14px; margin-bottom: 12px;">
          <span style="font-size: 26px;">👁</span>
        </div>
        <h2 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">New Secret Society Candidate</h2>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #00f3ff; font-family: monospace;">[SHADOWTALK // COUNCIL MEMORANDUM]</p>
      </div>

      <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 8px 0; color: #94a3b8; width: 140px;"><strong>Candidate Name:</strong></td>
            <td style="padding: 8px 0; color: #f8fafc; font-weight: 600;">${newApp.fullName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #94a3b8;"><strong>Chat Alias:</strong></td>
            <td style="padding: 8px 0; color: #00f3ff; font-weight: 600;">@${newApp.alias}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #94a3b8;"><strong>Email Address:</strong></td>
            <td style="padding: 8px 0; color: #f8fafc;"><a href="mailto:${newApp.email}" style="color: #38bdf8; text-decoration: none;">${newApp.email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #94a3b8;"><strong>Role / Status:</strong></td>
            <td style="padding: 8px 0; color: #cbd5e1;">${newApp.role}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #94a3b8;"><strong>Age / Location:</strong></td>
            <td style="padding: 8px 0; color: #cbd5e1;">${newApp.ageLocation}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #94a3b8;"><strong>Social Handle:</strong></td>
            <td style="padding: 8px 0; color: #cbd5e1;">${newApp.socialHandle}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #94a3b8;"><strong>Application ID:</strong></td>
            <td style="padding: 8px 0; color: #64748b; font-family: monospace;">${newApp.id}</td>
          </tr>
        </table>
      </div>

      <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(0, 243, 255, 0.2); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <h4 style="margin: 0 0 10px 0; font-size: 13px; color: #00f3ff; text-transform: uppercase; letter-spacing: 0.5px;">Statement of Purpose:</h4>
        <p style="margin: 0; font-size: 14px; color: #e2e8f0; line-height: 1.6; white-space: pre-wrap;">${newApp.purpose}</p>
      </div>

      <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5; text-align: center;">
        Review this candidate's credentials. Once approved, grant the Verified Badge in ShadowTalk to welcome them to the Inner Circle.
      </p>
    </div>
  `;

  const mailOptions = {
    from: `"ShadowTalk Society" <${hostUser}>`,
    to: hostUser,
    replyTo: newApp.email,
    subject: `[Secret Society Application] ${newApp.fullName} (@${newApp.alias})`,
    html: htmlEmail
  };

  try {
    const ipv4List = await resolveGmailIpv4();
    const configsToTry = [];
    for (const ip of ipv4List) {
      configsToTry.push({ host: ip, port: 465, secure: true, label: `${ip}:465 (SSL)` });
      configsToTry.push({ host: ip, port: 587, secure: false, label: `${ip}:587 (STARTTLS)` });
    }

    for (const config of configsToTry) {
      try {
        const transporter = createTransporter(config.host, config.port, config.secure, hostUser, pass);
        await transporter.sendMail(mailOptions);
        console.log(`[Membership Service]: Application email dispatched to ${hostUser} via [${config.label}]`);
        break;
      } catch (err) {
        console.warn(`[Membership Service]: Delivery via ${config.label} failed: ${err.message}`);
      }
    }
  } catch (err) {
    console.error('[Membership Service]: Email dispatch error:', err.message);
  }

  return {
    success: true,
    applicationId,
    message: 'Application successfully received by the council.'
  };
}

module.exports = {
  submitApplication,
  loadApplications
};
