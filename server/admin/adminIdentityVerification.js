/**
 * Final Administrator Identity Verification Module
 * Verifies the authenticated user's account username against the server-configured administrator username.
 * Uses constant-time buffer comparison to prevent timing attacks.
 */

const crypto = require('crypto');
const { ADMIN_CONFIG } = require('./adminConfig');
const {
  createAdminSession,
  invalidateSession,
  recordFailedAttempt,
  logAuditEvent
} = require('./adminAuthSession');

/**
 * Constant-time string equality check using SHA-256 hash comparison
 */
function secureCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const hashA = crypto.createHash('sha256').update(a.trim()).digest();
  const hashB = crypto.createHash('sha256').update(b.trim()).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

/**
 * Perform final username verification against configured administrator identity.
 * Pre-requisite: Session MUST be in 'CHAT_VERIFIED' stage.
 */
function verifyAdminIdentity(session, candidateUsername, clientIp) {
  if (!session || session.stage !== 'CHAT_VERIFIED') {
    if (session) invalidateSession(session.sessionId);
    recordFailedAttempt(clientIp, 'Invalid session stage for identity check');
    return { success: false };
  }

  const expectedAdmin = ADMIN_CONFIG.adminUsername;

  // 1. Verify candidate username matches configured admin username
  const matchesConfig = secureCompare(candidateUsername, expectedAdmin);

  // 2. Verify candidate username also matches the sender alias captured during the chat verification
  const matchesSender = session.senderAlias ? secureCompare(candidateUsername, session.senderAlias) : true;

  if (matchesConfig && matchesSender) {
    // Identity confirmed! Invalidate temporary session and generate permanent admin session
    invalidateSession(session.sessionId);
    const { adminToken, expiresAt } = createAdminSession(expectedAdmin, clientIp);

    logAuditEvent('ADMIN_IDENTITY_VERIFIED', {
      username: expectedAdmin
    }, clientIp);

    return {
      success: true,
      adminToken,
      expiresAt,
      username: expectedAdmin
    };
  } else {
    // Identity verification failed -> completely invalidate session
    invalidateSession(session.sessionId);
    recordFailedAttempt(clientIp, 'Username mismatch on final layer');

    logAuditEvent('ADMIN_IDENTITY_REJECTED', {
      attemptedAlias: candidateUsername
    }, clientIp);

    return { success: false };
  }
}

module.exports = {
  verifyAdminIdentity,
  secureCompare
};
