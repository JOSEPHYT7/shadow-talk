/**
 * Secret Chat Action Verification Module
 * Silently validates the user's outgoing chat transmission on the backend:
 * - Checks that an active authentication session exists in stage 'VOICE_VERIFIED'.
 * - Checks that the predefined secret sleeping/offline user is @mentioned.
 * - Checks that the exact secret verification message is present.
 * - Stores sender alias and userId on session to lock sequence and identity.
 */

const { ADMIN_CONFIG } = require('./adminConfig');
const { activeSessions, advanceSessionStage, invalidateSession, logAuditEvent } = require('./adminAuthSession');

/**
 * Returns the profile object for the predefined secret user.
 * Designed to look like an authentic sleeping/offline user in the community.
 */
function getSecretUserProfile() {
  return {
    alias: ADMIN_CONFIG.secretUserAlias,
    userId: ADMIN_CONFIG.secretUserId,
    color: '#94a3b8',
    avatar: 'avatar_9',
    bio: 'Encrypted mesh node. Dormant.',
    status: 'Offline',
    isOnline: false,
    isVerified: true,
    welcomed: true,
    lastSeen: Date.now() - (7 * 24 * 60 * 60 * 1000), // 7 days ago
    createdAt: Date.now() - (30 * 24 * 60 * 60 * 1000),
    updatedAt: Date.now() - (7 * 24 * 60 * 60 * 1000)
  };
}

/**
 * Normalize message text for reliable comparison
 */
function normalizeChatMessage(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Inspect an outgoing chat message from a socket connection.
 * Returns { isSecretMatch: boolean, session: object|null }
 */
function inspectChatMessage(msg, socketId, clientIp) {
  if (!msg || !msg.text) return { isSecretMatch: false };

  const rawText = msg.text;
  const lowerText = rawText.toLowerCase();

  const normClientIp = String(clientIp || '').replace(/^::ffff:/, '').replace(/^::1$/, '127.0.0.1');

  // Find if there is an active session in VOICE_VERIFIED stage
  let candidateSession = null;
  for (const session of activeSessions.values()) {
    if (session.stage === 'VOICE_VERIFIED') {
      const normSessionIp = String(session.ip || '').replace(/^::ffff:/, '').replace(/^::1$/, '127.0.0.1');
      if (session.socketId === socketId || normSessionIp === normClientIp || activeSessions.size === 1) {
        candidateSession = session;
        break;
      }
    }
  }

  // 1. Check if the message targets the secret user
  const secretUserLower = ADMIN_CONFIG.secretUserAlias.toLowerCase();
  const mentionsSecretUser =
    lowerText.includes(`@${secretUserLower}`) ||
    lowerText.includes('@cipher_sentinel') ||
    (msg.replyTo && msg.replyTo.alias && (
      msg.replyTo.alias.toLowerCase() === secretUserLower ||
      msg.replyTo.alias.toLowerCase() === 'cipher_sentinel'
    ));

  // 2. Check if text contains the secret verification message
  const normalizedText = normalizeChatMessage(rawText);
  const normalizedSecret = normalizeChatMessage(ADMIN_CONFIG.secretChatMessage);
  const hasSecretMessage = normalizedText.includes(normalizedSecret);

  // If someone targets the secret user or attempts the secret message
  if (mentionsSecretUser || hasSecretMessage) {
    // If there is NO active session in VOICE_VERIFIED stage, this is an unauthorized/out-of-sequence attempt
    if (!candidateSession) {
      logAuditEvent('CHAT_VERIFY_OUT_OF_SEQUENCE', {
        alias: msg.alias,
        mentionsSecretUser,
        hasSecretMessage
      }, clientIp);
      return { isSecretMatch: false };
    }

    // Must have BOTH: correct secret user @mention AND correct secret message
    if (mentionsSecretUser && hasSecretMessage) {
      // Advance session stage to CHAT_VERIFIED
      candidateSession.senderAlias = msg.alias || 'Anonymous';
      candidateSession.senderUserId = msg.userId || null;
      candidateSession.socketId = socketId;

      advanceSessionStage(candidateSession, 'CHAT_VERIFIED');

      logAuditEvent('CHAT_VERIFICATION_SUCCESS', {
        alias: msg.alias,
        sessionId: candidateSession.sessionId.slice(0, 10) + '...'
      }, clientIp);

      return {
        isSecretMatch: true,
        session: candidateSession
      };
    } else {
      // Partial attempt or incorrect secret message -> silently invalidate session
      invalidateSession(candidateSession.sessionId);
      logAuditEvent('CHAT_VERIFICATION_FAILED', {
        alias: msg.alias,
        mentionsSecretUser,
        hasSecretMessage: false
      }, clientIp);
      return { isSecretMatch: false };
    }
  }

  return { isSecretMatch: false };
}

module.exports = {
  getSecretUserProfile,
  inspectChatMessage,
  normalizeChatMessage
};
