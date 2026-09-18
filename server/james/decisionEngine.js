/**
 * Decision Engine for James Agent.
 * Evaluates context, user intent, social state, rate-limits, and debounces rapid messages.
 */

class DecisionEngine {
  constructor(dependencies = {}) {
    this.socialAwareness = dependencies.socialAwareness;
    this.moderationEngine = dependencies.moderationEngine;
    
    // Debounce buffers: userId/key -> { timer, messages: [] }
    this.debounceBuffers = new Map();
    this.userLastRequestTime = new Map();
  }

  getUserKey(msg) {
    if (msg.userId) return `uid:${msg.userId.toLowerCase()}`;
    if (msg.alias) return `alias:${msg.alias.toLowerCase()}`;
    return 'unknown';
  }

  /**
   * Evaluate whether James should respond to this message.
   * @param {object} msg - Incoming message object.
   * @returns {{ action: 'RESPOND' | 'OBSERVE' | 'MODERATE' | 'IGNORE', reason: string, isDirect: boolean, moderationViolation?: object }}
   */
  evaluate(msg) {
    // 1. Ignore encrypted messages (Respect ShadowTalk client AES-256 Vault)
    if (msg.encrypted) {
      return { action: 'IGNORE', reason: 'encrypted_payload', isDirect: false };
    }

    // 2. Ignore James's own messages
    if (msg.alias === 'James' || msg.userId === 'bot_james') {
      return { action: 'IGNORE', reason: 'self_message', isDirect: false };
    }

    const text = (msg.text || '').trim();
    if (!text && !msg.fileUrl) {
      return { action: 'IGNORE', reason: 'empty_content', isDirect: false };
    }

    // 3. Check deterministic moderation violations (flooding, duplicate text, link spam)
    if (this.moderationEngine) {
      const modCheck = this.moderationEngine.checkDeterministicViolation(msg);
      if (modCheck.violation) {
        return {
          action: 'MODERATE',
          reason: modCheck.reason,
          isDirect: false,
          moderationViolation: modCheck
        };
      }
    }

    // 4. Check for direct mention or reply
    const isDirectMention = /@?james\b/i.test(text);
    const isDirectReply = !!(msg.replyTo && (msg.replyTo.alias === 'James' || msg.replyTo.userId === 'bot_james'));
    const isDirect = isDirectMention || isDirectReply;

    if (isDirect) {
      return { action: 'RESPOND', reason: isDirectMention ? 'direct_mention' : 'direct_reply', isDirect: true };
    }

    // 5. Check social awareness state
    const socialState = this.socialAwareness ? this.socialAwareness.getSocialState() : { mode: 'PARTICIPANT', userCount: 1 };

    // Dormant room (no users online) -> Ignore
    if (socialState.mode === 'DORMANT') {
      return { action: 'IGNORE', reason: 'room_dormant', isDirect: false };
    }

    // Single-user companion mode: James stays present and naturally conversant
    if (socialState.mode === 'COMPANION') {
      // If user asks a question, greets, or shares content, engage naturally
      return { action: 'RESPOND', reason: 'single_user_companion', isDirect: false };
    }

    // Small room (2-4 users): Participates when asked questions, greeted, or helpful
    if (socialState.mode === 'PARTICIPANT') {
      const isQuestion = /\?|how|what|why|who|can someone|help|explain/i.test(text);
      const isGreeting = /^(hi|hello|hey|yo|greetings|morning|evening)\b/i.test(text) && text.split(' ').length <= 4;
      const isTechHelp = /error|bug|issue|react|node|javascript|python|deploy|css|html|api|database|syntax/i.test(text);

      if (isQuestion || isGreeting || isTechHelp) {
        return { action: 'RESPOND', reason: 'participant_helpful_interest', isDirect: false };
      }
      return { action: 'OBSERVE', reason: 'participant_observing', isDirect: false };
    }

    // Busy room (5+ users or high velocity): Quiet observer
    return { action: 'OBSERVE', reason: 'busy_room_observing', isDirect: false };
  }

  /**
   * Debounce rapid messages from the same user within 1500ms
   * Merges them so James answers the complete thought rather than multiple partial fragments.
   */
  debounceMessage(msg, onReady) {
    const key = this.getUserKey(msg);
    let buffer = this.debounceBuffers.get(key);

    if (buffer) {
      clearTimeout(buffer.timer);
      buffer.messages.push(msg);
    } else {
      buffer = {
        messages: [msg],
        timer: null
      };
      this.debounceBuffers.set(key, buffer);
    }

    buffer.timer = setTimeout(() => {
      this.debounceBuffers.delete(key);
      const combinedMsg = this.combineMessages(buffer.messages);
      onReady(combinedMsg);
    }, 1400);
  }

  combineMessages(messages) {
    if (messages.length === 1) return messages[0];
    const latest = messages[messages.length - 1];
    const combinedText = messages.map(m => (m.text || '').trim()).filter(Boolean).join('\n');
    return {
      ...latest,
      text: combinedText
    };
  }

  /**
   * Check per-user rate limit (e.g. max 1 request every 2.5 seconds).
   */
  isRateLimited(msg) {
    const key = this.getUserKey(msg);
    const now = Date.now();
    const last = this.userLastRequestTime.get(key) || 0;
    if (now - last < 2200) {
      return true;
    }
    this.userLastRequestTime.set(key, now);
    return false;
  }
}

module.exports = { DecisionEngine };
