/**
 * Moderation Engine for James Agent.
 * Combines fast deterministic filtering (flood, duplicates, link spam)
 * with validated AI moderation actions (warn_user, flag_user).
 */

class ModerationEngine {
  constructor(options = {}) {
    this.userMessageHistory = new Map(); // userId/key -> Array<{ timestamp, text }>
    this.userWarnings = new Map(); // userId/key -> Array<{ timestamp, reason }>
    this.flaggedUsers = new Set();
  }

  getUserKey(userId, alias) {
    if (userId) return `uid:${userId.toLowerCase()}`;
    if (alias) return `alias:${alias.toLowerCase()}`;
    return null;
  }

  /**
   * Deterministic fast check on incoming messages.
   * Returns: { violation: boolean, reason?: string, type?: 'flood'|'duplicate'|'link_spam' }
   */
  checkDeterministicViolation(msg) {
    if (!msg || msg.alias === 'James' || msg.userId === 'bot_james') {
      return { violation: false };
    }

    const key = this.getUserKey(msg.userId, msg.alias);
    if (!key) return { violation: false };

    const now = Date.now();
    const text = (msg.text || '').trim();

    let history = this.userMessageHistory.get(key);
    if (!history) {
      history = [];
      this.userMessageHistory.set(key, history);
    }

    history.push({ timestamp: now, text });
    // Keep only last 10 seconds of history
    const tenSecondsAgo = now - 10000;
    history = history.filter(h => h.timestamp > tenSecondsAgo);
    this.userMessageHistory.set(key, history);

    // 1. Message Flooding: > 5 messages in 4 seconds
    const fourSecondsAgo = now - 4000;
    const recentCount = history.filter(h => h.timestamp > fourSecondsAgo).length;
    if (recentCount >= 6) {
      return {
        violation: true,
        type: 'flood',
        reason: 'Sending messages too rapidly. Please slow down.'
      };
    }

    // 2. Duplicate Text Spam: Same text 3+ times in the last 10 seconds
    if (text.length > 2) {
      const duplicateCount = history.filter(h => h.text.toLowerCase() === text.toLowerCase()).length;
      if (duplicateCount >= 3) {
        return {
          violation: true,
          type: 'duplicate',
          reason: 'Repeatedly sending identical messages.'
        };
      }
    }

    // 3. Link Spam: > 3 links sent in 10 seconds
    const linkRegex = /(https?:\/\/[^\s]+)/gi;
    const totalLinks = history.reduce((acc, h) => acc + (h.text.match(linkRegex) || []).length, 0);
    if (totalLinks >= 4) {
      return {
        violation: true,
        type: 'link_spam',
        reason: 'Too many links posted in a short time.'
      };
    }

    return { violation: false };
  }

  /**
   * Validate and record an AI-requested moderation warning.
   * @param {string} targetId - User ID or alias to warn.
   * @param {string} reason - Reason for warning.
   * @returns {{ success: boolean, warningCount: number, message: string }}
   */
  warnUser(targetId, reason) {
    if (!targetId || typeof targetId !== 'string') {
      return { success: false, warningCount: 0, message: 'Invalid target user.' };
    }

    const cleanTarget = targetId.trim().toLowerCase();
    if (cleanTarget === 'james' || cleanTarget === 'bot_james') {
      return { success: false, warningCount: 0, message: 'Cannot issue a warning to James.' };
    }

    const warnings = this.userWarnings.get(cleanTarget) || [];
    warnings.push({ timestamp: Date.now(), reason: reason || 'Community guideline violation' });
    this.userWarnings.set(cleanTarget, warnings);

    const count = warnings.length;
    if (count >= 3) {
      this.flaggedUsers.add(cleanTarget);
    }

    return {
      success: true,
      warningCount: count,
      message: `Warning issued to @${targetId}: ${reason}`
    };
  }

  /**
   * Validate and record an AI-requested flag action.
   */
  flagUser(targetId, reason) {
    if (!targetId || typeof targetId !== 'string') {
      return { success: false, message: 'Invalid target user.' };
    }

    const cleanTarget = targetId.trim().toLowerCase();
    if (cleanTarget === 'james' || cleanTarget === 'bot_james') {
      return { success: false, message: 'Cannot flag James.' };
    }

    this.flaggedUsers.add(cleanTarget);
    return {
      success: true,
      message: `User @${targetId} flagged for administrative review: ${reason}`
    };
  }

  isFlagged(targetId) {
    if (!targetId) return false;
    return this.flaggedUsers.has(targetId.trim().toLowerCase());
  }
}

module.exports = { ModerationEngine };
