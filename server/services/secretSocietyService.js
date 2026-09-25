/**
 * Secret Society Member Administration & Cryptographic Verification Service
 * Manages member induction, secure password hashing (PBKDF2/SHA-512), credential generation,
 * and email transmission of enclave passphrases.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const dns = require('dns');

const membersFile = path.join(__dirname, '..', 'data', 'secret_society_members.json');
const societyMessagesFile = path.join(__dirname, '..', 'data', 'society_messages.json');
const applicationsFile = path.join(__dirname, '..', 'data', 'membership_applications.json');

// Ensure data files exist
if (!fs.existsSync(membersFile)) {
  fs.writeFileSync(membersFile, JSON.stringify([], null, 2), 'utf8');
}
if (!fs.existsSync(societyMessagesFile)) {
  fs.writeFileSync(societyMessagesFile, JSON.stringify([], null, 2), 'utf8');
}

// Word lists for high-entropy, strong memorable passphrases
const PREFIX_WORDS = [
  'OMEGA', 'CIPHER', 'NEXUS', 'SOLAR', 'QUANTUM', 'OBSIDIAN',
  'CITADEL', 'AEGIS', 'PHOENIX', 'VALKYRIE', 'KAIROS', 'CHRONOS',
  'AURORA', 'COBALT', 'TITAN', 'VORTEX', 'SYNAPSE', 'ORION'
];

const SUFFIX_WORDS = [
  'SHADOW', 'HORIZON', 'SANCTUARY', 'VECTOR', 'ENCLAVE', 'ARCHON',
  'SPECTRUM', 'PROTOCOL', 'GATEWAY', 'ZENITH', 'PARADOX', 'MATRIX',
  'BASTION', 'GRID', 'EMBER', 'TEMPEST', 'RELAY', 'GENESIS'
];

/**
 * Generate a strong, memorable, human-rememberable enclave secret passphrase
 * Example: "OMEGA-HORIZON-7492"
 */
function generateMemorablePassphrase() {
  const prefix = PREFIX_WORDS[Math.floor(Math.random() * PREFIX_WORDS.length)];
  const suffix = SUFFIX_WORDS[Math.floor(Math.random() * SUFFIX_WORDS.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${suffix}-${num}`;
}

/**
 * Cryptographically hash a password using SHA-512 with a unique 16-byte random salt.
 * Stored format: "salt:hash"
 * RAW PASSWORDS ARE NEVER PERSISTED ON DISK.
 */
function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password.trim(), salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Constant-time comparison to verify password against stored salt:hash
 */
function verifyPassword(password, storedSaltHash) {
  if (!password || !storedSaltHash || !storedSaltHash.includes(':')) {
    return false;
  }
  const [salt, expectedHash] = storedSaltHash.split(':');
  if (!salt || !expectedHash) return false;

  const actualHash = crypto.pbkdf2Sync(password.trim(), salt, 100000, 64, 'sha512').toString('hex');
  const actualBuf = Buffer.from(actualHash, 'hex');
  const expectedBuf = Buffer.from(expectedHash, 'hex');

  if (actualBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(actualBuf, expectedBuf);
}

function loadMembers() {
  try {
    const raw = fs.readFileSync(membersFile, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveMembers(members) {
  try {
    fs.writeFileSync(membersFile, JSON.stringify(members, null, 2), 'utf8');
  } catch (err) {
    console.error('[Secret Society Service]: Failed to save members:', err.message);
  }
}

function loadSocietyMessages() {
  try {
    const raw = fs.readFileSync(societyMessagesFile, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveSocietyMessages(msgs) {
  try {
    fs.writeFileSync(societyMessagesFile, JSON.stringify(msgs.slice(-250), null, 2), 'utf8');
  } catch (err) {
    console.error('[Secret Society Service]: Failed to save society messages:', err.message);
  }
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
    console.error('[Secret Society Service]: Failed to save applications:', err.message);
  }
}

/**
 * Dispatch acceptance email with confidential secret passphrase to candidate
 */
async function sendAcceptanceEmail(email, alias, rawPassphrase) {
  const hostUser = (process.env.EMAIL_USER || '').trim();
  const rawPass = (process.env.EMAIL_APP_PASSWORD || '').trim();
  const pass = rawPass.replace(/\s+/g, '');

  if (!hostUser || !pass || !email) {
    console.log(`[Secret Society Service]: Email not configured. Passphrase for @${alias}: ${rawPassphrase}`);
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: hostUser, pass },
      tls: { servername: 'smtp.gmail.com', rejectUnauthorized: false }
    });

    const htmlContent = `
      <div style="background:#030712; color:#f8fafc; font-family:'Segoe UI',sans-serif; max-width:580px; margin:0 auto; padding:32px; border:1px solid #1e293b; border-radius:14px;">
        <div style="text-align:center; margin-bottom:28px;">
          <div style="display:inline-block; padding:12px; border:1.5px solid #00f3ff; border-radius:50%; background:rgba(0,243,255,0.08); margin-bottom:12px;">
            <span style="font-size:28px; color:#00f3ff;">Ω</span>
          </div>
          <h2 style="margin:0; font-size:22px; color:#ffffff; letter-spacing:0.04em;">INDUCTION CONFERRED // LEVEL-4 CLEARANCE</h2>
          <p style="margin:6px 0 0 0; color:#00f3ff; font-size:12px; font-family:monospace;">SHADOWTALK SOVEREIGN CITADEL</p>
        </div>

        <p style="font-size:14px; line-height:1.6; color:#cbd5e1;">
          Greetings, <strong>@${alias}</strong>. Your candidate dossier has been verified and unanimously approved by the High Council.
          You have been formally inducted into the <strong>Secret Society</strong> of sovereign thinkers, researchers, and planetary guardians.
        </p>

        <div style="background:rgba(15,23,42,0.95); border:1px solid rgba(0,243,255,0.4); border-radius:10px; padding:20px; margin:24px 0; text-align:center;">
          <span style="font-size:11px; color:#94a3b8; letter-spacing:0.12em; text-transform:uppercase; display:block; margin-bottom:8px;">YOUR CONFIDENTIAL ENCLAVE PASSPHRASE</span>
          <div style="font-family:'Courier New',monospace; font-size:22px; font-weight:800; color:#00f3ff; letter-spacing:0.1em; background:#020617; padding:12px 18px; border-radius:8px; border:1px dashed #00f3ff;">
            ${rawPassphrase}
          </div>
          <span style="font-size:11px; color:#f59e0b; display:block; margin-top:10px;">⚠️ MEMORIZE THIS PASSPHRASE. DO NOT SHARE OR TRANSMIT ON OPEN CHANNELS.</span>
        </div>

        <div style="background:#090d16; border-left:3px solid #10b981; padding:14px; border-radius:0 8px 8px 0; margin-bottom:24px; font-size:13px; line-height:1.5; color:#94a3b8;">
          <strong style="color:#10b981;">HOW TO ENTER THE SECRET SOCIETY CHAT:</strong><br/>
          1. Navigate to the Secret Enclave Page (Citadel).<br/>
          2. Locate the secret emblem and execute the member cadence: <strong>2 taps &rarr; wait 3s &rarr; 4 taps</strong>.<br/>
          3. Enter your alias (<code>@${alias}</code>) and your passphrase above.<br/>
          4. Access the unredacted frequency and engage with members and James Autonomous Intelligence.
        </div>

        <p style="font-size:12px; color:#64748b; text-align:center; margin:0; border-top:1px solid #1e293b; padding-top:16px;">
          Zero persistent logs on disk &bull; 42 Sovereign Nodes &bull; We work for the Earth and humanity.
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: `"ShadowTalk High Council" <${hostUser}>`,
      to: email,
      subject: `[CONFIDENTIAL] Secret Society Induction Conferred: @${alias}`,
      html: htmlContent
    });
    console.log(`[Secret Society Service]: Dispatched induction email with credentials to ${email}`);
    return true;
  } catch (err) {
    console.error(`[Secret Society Service]: Email dispatch failed for ${email}:`, err.message);
    return false;
  }
}

/**
 * Approve a pending application and induct candidate as a Secret Society Member
 */
async function approveCandidate(applicationId, customPassphrase = null) {
  const apps = loadApplications();
  const appIdx = apps.findIndex(a => a.id === applicationId);
  if (appIdx < 0) {
    throw new Error('Application dossier not found');
  }

  const app = apps[appIdx];
  const members = loadMembers();

  // Check if alias or email already an active member
  const existing = members.find(
    m => (app.alias && m.alias && m.alias.toLowerCase() === app.alias.toLowerCase()) ||
         (app.email && m.email && m.email.toLowerCase() === app.email.toLowerCase())
  );

  const rawPassphrase = customPassphrase?.trim() || generateMemorablePassphrase();
  const hashedPassword = hashPassword(rawPassphrase);

  if (existing) {
    // Update existing member record
    existing.passwordHash = hashedPassword;
    existing.status = 'active';
    existing.updatedAt = Date.now();
    existing.role = app.role || existing.role;
    existing.fullName = app.fullName || existing.fullName;
    existing.location = app.ageLocation || existing.location;
  } else {
    // Add new member
    const newMember = {
      id: 'soc_mbr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      alias: app.alias,
      userId: app.userId || ('usr_' + app.alias.toLowerCase()),
      email: app.email,
      fullName: app.fullName,
      role: app.role,
      location: app.ageLocation,
      purpose: app.purpose,
      clearance: 'LEVEL-4 INDUCTED',
      passwordHash: hashedPassword,
      status: 'active',
      joinedAt: Date.now(),
      lastAccess: null
    };
    members.push(newMember);
  }

  // Update application status
  app.status = 'approved';
  app.inductedAt = new Date().toISOString();
  saveApplications(apps);
  saveMembers(members);

  // Send induction email asynchronously
  sendAcceptanceEmail(app.email, app.alias, rawPassphrase).catch(() => {});

  return {
    success: true,
    alias: app.alias,
    email: app.email,
    rawPassphrase,
    message: `Induction confirmed for @${app.alias}. Passphrase generated and dispatched.`
  };
}

/**
 * Reject a candidate application
 */
function rejectCandidate(applicationId, reason = '') {
  const apps = loadApplications();
  const app = apps.find(a => a.id === applicationId);
  if (!app) throw new Error('Application dossier not found');

  app.status = 'rejected';
  app.rejectionReason = reason || 'Dossier did not meet council maturity standards.';
  app.rejectedAt = new Date().toISOString();
  saveApplications(apps);

  return { success: true, message: `Application ${applicationId} rejected.` };
}

/**
 * Directly add a Secret Society Member from the Admin Panel
 */
async function addMemberDirect({ alias, email, fullName, role, location, customPassphrase }) {
  if (!alias || !alias.trim()) throw new Error('Member Alias is required');

  const members = loadMembers();
  const cleanAlias = alias.trim().replace(/^@/, '');
  const cleanEmail = (email || '').trim().toLowerCase();

  const existingIdx = members.findIndex(
    m => m.alias && m.alias.toLowerCase() === cleanAlias.toLowerCase()
  );

  const rawPassphrase = customPassphrase?.trim() || generateMemorablePassphrase();
  const hashedPassword = hashPassword(rawPassphrase);

  let memberRecord;
  if (existingIdx >= 0) {
    memberRecord = members[existingIdx];
    memberRecord.passwordHash = hashedPassword;
    memberRecord.status = 'active';
    memberRecord.email = cleanEmail || memberRecord.email;
    memberRecord.fullName = fullName || memberRecord.fullName;
    memberRecord.role = role || memberRecord.role;
    memberRecord.location = location || memberRecord.location;
    memberRecord.updatedAt = Date.now();
  } else {
    memberRecord = {
      id: 'soc_mbr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      alias: cleanAlias,
      userId: 'usr_' + cleanAlias.toLowerCase(),
      email: cleanEmail,
      fullName: fullName || cleanAlias,
      role: role || 'Council Appointee',
      location: location || 'Global Relay',
      clearance: 'LEVEL-4 INDUCTED',
      passwordHash: hashedPassword,
      status: 'active',
      joinedAt: Date.now(),
      lastAccess: null
    };
    members.push(memberRecord);
  }

  saveMembers(members);

  if (cleanEmail) {
    sendAcceptanceEmail(cleanEmail, cleanAlias, rawPassphrase).catch(() => {});
  }

  return {
    success: true,
    member: {
      id: memberRecord.id,
      alias: memberRecord.alias,
      email: memberRecord.email,
      role: memberRecord.role,
      clearance: memberRecord.clearance,
      status: memberRecord.status,
      joinedAt: memberRecord.joinedAt
    },
    rawPassphrase
  };
}

/**
 * Remove / Revoke a Secret Society Member
 */
function removeMember(memberId) {
  const members = loadMembers();
  const idx = members.findIndex(m => m.id === memberId || m.alias.toLowerCase() === memberId.toLowerCase());
  if (idx < 0) throw new Error('Member not found in society roster');

  const removed = members.splice(idx, 1)[0];
  saveMembers(members);

  return { success: true, message: `Access clearance revoked for @${removed.alias}.` };
}

/**
 * Regenerate member passphrase
 */
async function regenerateMemberPassword(memberId) {
  const members = loadMembers();
  const member = members.find(m => m.id === memberId || m.alias.toLowerCase() === memberId.toLowerCase());
  if (!member) throw new Error('Member not found');

  const rawPassphrase = generateMemorablePassphrase();
  member.passwordHash = hashPassword(rawPassphrase);
  member.updatedAt = Date.now();
  saveMembers(members);

  if (member.email) {
    sendAcceptanceEmail(member.email, member.alias, rawPassphrase).catch(() => {});
  }

  return {
    success: true,
    alias: member.alias,
    email: member.email,
    rawPassphrase,
    message: `New enclave passphrase issued for @${member.alias}.`
  };
}

/**
 * Verify member credentials for secret society entry
 */
function verifyMemberLogin(alias, password) {
  if (!alias || !password) return { success: false, error: 'Alias and Passphrase required' };

  const cleanAlias = alias.trim().replace(/^@/, '').toLowerCase();
  const members = loadMembers();
  const member = members.find(m => m.alias && m.alias.toLowerCase() === cleanAlias);

  if (!member) {
    return { success: false, error: 'Unrecognized candidate alias' };
  }

  if (member.status !== 'active') {
    return { success: false, error: 'Clearance revoked by High Council' };
  }

  const isValid = verifyPassword(password, member.passwordHash);
  if (!isValid) {
    return { success: false, error: 'Cipher mismatch: Invalid secret passphrase' };
  }

  // Update last access timestamp
  member.lastAccess = Date.now();
  saveMembers(members);

  // Generate signed society access token
  const tokenPayload = {
    memberId: member.id,
    alias: member.alias,
    clearance: member.clearance || 'LEVEL-4 INDUCTED',
    issuedAt: Date.now(),
    expiresAt: Date.now() + (12 * 60 * 60 * 1000) // 12 hours
  };

  const societyToken = crypto
    .createHmac('sha256', process.env.ADMIN_SESSION_SECRET || 'secret_society_key_0x9')
    .update(JSON.stringify(tokenPayload))
    .digest('hex') + '.' + Buffer.from(JSON.stringify(tokenPayload)).toString('base64url');

  return {
    success: true,
    societyToken,
    token: societyToken,
    alias: member.alias,
    clearance: member.clearance || 'LEVEL-4 INDUCTED'
  };
}

/**
 * Validate society token
 */
function validateSocietyToken(token) {
  if (!token || !token.includes('.')) return null;
  const [signature, b64Payload] = token.split('.');
  try {
    const raw = Buffer.from(b64Payload, 'base64url').toString('utf8');
    const expectedSig = crypto
      .createHmac('sha256', process.env.ADMIN_SESSION_SECRET || 'secret_society_key_0x9')
      .update(raw)
      .digest('hex');

    if (signature !== expectedSig) return null;
    const payload = JSON.parse(raw);
    if (payload.expiresAt && Date.now() > payload.expiresAt) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Permanently delete a rejected candidate application
 */
function deleteRejectedApplication(applicationId) {
  const apps = loadApplications();
  const idx = apps.findIndex(a => a.id === applicationId);
  if (idx < 0) throw new Error('Application dossier not found');
  if (apps[idx].status !== 'rejected') {
    throw new Error('Only rejected applications can be permanently deleted');
  }
  const deleted = apps.splice(idx, 1)[0];
  saveApplications(apps);
  return { success: true, message: `Rejected application for @${deleted.alias} deleted permanently.` };
}

// ------------------------------------------------------------------
// MEMBER WITHDRAWAL REQUESTS
// ------------------------------------------------------------------
const withdrawalsFile = path.join(__dirname, '..', 'data', 'membership_withdrawals.json');
if (!fs.existsSync(withdrawalsFile)) {
  fs.writeFileSync(withdrawalsFile, JSON.stringify([], null, 2), 'utf8');
}

function loadWithdrawals() {
  try {
    const raw = fs.readFileSync(withdrawalsFile, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveWithdrawals(list) {
  try {
    fs.writeFileSync(withdrawalsFile, JSON.stringify(list, null, 2), 'utf8');
  } catch (err) {
    console.error('[Secret Society Service]: Failed to save withdrawals:', err.message);
  }
}

function submitWithdrawalRequest({ alias, userId, reason }) {
  if (!alias || !reason) throw new Error('Alias and reason are required');
  const cleanAlias = alias.trim().replace(/^@/, '');
  const members = loadMembers();
  const isMember = members.some(m => m.alias && m.alias.toLowerCase() === cleanAlias.toLowerCase() && m.status === 'active');
  if (!isMember) {
    throw new Error(`@${cleanAlias} is not an active inducted member.`);
  }

  const withdrawals = loadWithdrawals();
  const existingPending = withdrawals.find(w => w.alias.toLowerCase() === cleanAlias.toLowerCase() && w.status === 'pending');
  if (existingPending) {
    existingPending.reason = reason;
    existingPending.updatedAt = new Date().toISOString();
    saveWithdrawals(withdrawals);
    return { success: true, message: 'Withdrawal reason updated. Transmitted to High Council.' };
  }

  const req = {
    id: 'wdr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    alias: cleanAlias,
    userId: userId || ('usr_' + cleanAlias.toLowerCase()),
    reason: reason.trim(),
    submittedAt: new Date().toISOString(),
    status: 'pending'
  };
  withdrawals.push(req);
  saveWithdrawals(withdrawals);
  return { success: true, message: 'Withdrawal request transmitted to High Council.' };
}

function processWithdrawal(withdrawalId, action = 'approved') {
  const withdrawals = loadWithdrawals();
  const item = withdrawals.find(w => w.id === withdrawalId);
  if (!item) throw new Error('Withdrawal request not found');

  item.status = action;
  item.processedAt = new Date().toISOString();
  saveWithdrawals(withdrawals);

  let memberRemoved = false;
  if (action === 'approved') {
    try {
      removeMember(item.alias);
      memberRemoved = true;
    } catch (e) {
      console.warn(`[Withdrawal]: Member @${item.alias} might have already been removed:`, e.message);
    }
  }

  return {
    success: true,
    alias: item.alias,
    status: action,
    memberRemoved,
    message: action === 'approved'
      ? `Withdrawal approved. @${item.alias} has been removed from Secret Society.`
      : `Withdrawal request for @${item.alias} dismissed.`
  };
}

/**
 * Get all members (safe - without password hashes)
 */
function getSanitizedMembers() {
  const members = loadMembers();
  return members.map(m => ({
    id: m.id,
    alias: m.alias,
    email: m.email,
    fullName: m.fullName,
    role: m.role,
    location: m.location,
    clearance: m.clearance,
    status: m.status,
    joinedAt: m.joinedAt,
    lastAccess: m.lastAccess
  }));
}

module.exports = {
  generateMemorablePassphrase,
  hashPassword,
  verifyPassword,
  loadMembers,
  saveMembers,
  loadSocietyMessages,
  saveSocietyMessages,
  loadApplications,
  saveApplications,
  approveCandidate,
  rejectCandidate,
  deleteRejectedApplication,
  loadWithdrawals,
  saveWithdrawals,
  submitWithdrawalRequest,
  processWithdrawal,
  addMemberDirect,
  removeMember,
  regenerateMemberPassword,
  verifyMemberLogin,
  validateSocietyToken,
  getSanitizedMembers
};
