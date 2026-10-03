/**
 * Administrator Authentication & Security Configuration
 * Configures the multi-layer authentication parameters, secret phrases, and rate limits.
 * All sensitive values are managed server-side and never exposed to the client.
 */

const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

function getPersistentSecret() {
  if (process.env.ADMIN_SESSION_SECRET) {
    return process.env.ADMIN_SESSION_SECRET;
  }
  const secretPath = path.join(__dirname, '../data/.session_secret');
  try {
    if (fs.existsSync(secretPath)) {
      const saved = fs.readFileSync(secretPath, 'utf8').trim();
      if (saved && saved.length >= 32) return saved;
    }
    const newSecret = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(secretPath, newSecret, 'utf8');
    return newSecret;
  } catch {
    return 'shadowtalk_sec_core_admin_secret_key_8f29d47a_9b61_48e7_bc32_fa5e01d29381';
  }
}

const ADMIN_CONFIG = {
  // Predefined administrator username
  adminUsername: process.env.ADMIN_USERNAME || 'joseph_creator',

  // Predefined secret user account that appears as a sleeping/offline user
  secretUserAlias: process.env.ADMIN_SECRET_USER || 'system_root',
  secretUserId: 'usr_system_root_0x9',

  // Secret verification message required when @mentioning the secret user
  secretChatMessage: process.env.ADMIN_SECRET_MESSAGE || 'override protocol omega',

  // Secret voice phrase required during voice verification layer
  secretVoicePhrase: process.env.ADMIN_VOICE_PHRASE || "i'm back buddy",

  // Voice activation trigger phrase
  voiceActivationPhrase: 'hey creator',

  // HMAC secret for signing temporary session tokens and admin session tokens (persisted across restarts)
  sessionSecret: getPersistentSecret(),

  // Time-to-live for a temporary authentication flow session (5 minutes max)
  sessionTtlMs: 5 * 60 * 1000,

  // Maximum inactivity tolerance per authentication stage (90 seconds)
  stageInactivityTtlMs: 90 * 1000,

  // Anti-brute-force rate limiting: max 5 failed attempts per IP per 15 minutes
  maxFailedAttempts: 5,
  lockoutDurationMs: 15 * 60 * 1000,

  // Admin session duration once fully authenticated (24 hours)
  adminSessionDurationMs: 24 * 60 * 60 * 1000
};

module.exports = { ADMIN_CONFIG };
