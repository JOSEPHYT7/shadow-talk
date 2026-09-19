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

    // Comprehensive query detection: commands, generation requests, questions, tech queries, greetings, or any meaningful text
    const isQuestion = /\?|how|what|why|who|where|when|which|is|are|can|could|would|should|do|does|did|will/i.test(text);
    const isGreeting = /^(hi|hello|hey|yo|greetings|morning|evening|sup|good)\b/i.test(text);
    const isActionOrRequest = /generate|create|make|draw|build|write|search|find|calculate|summarize|show|tell|give|convert|format|design|pdf|qr|image|photo|picture|code|script|test|explain|help|solve|compare|review/i.test(text);
    const isTechHelp = /error|bug|issue|react|node|javascript|python|deploy|css|html|api|database|syntax|docker|git/i.test(text);
    const isMeaningfulQuery = text.trim().length > 2;

    // Single-user companion mode: James stays present and naturally conversant
    if (socialState.mode === 'COMPANION') {
      return { action: 'RESPOND', reason: 'single_user_companion', isDirect: false };
    }

    // In any room state, answer any query, request, question, or greeting (short or long)
    if (isActionOrRequest || isQuestion || isGreeting || isTechHelp || isMeaningfulQuery) {
      return { action: 'RESPOND', reason: 'user_query_active', isDirect: isDirectMention };
    }

    return { action: 'RESPOND', reason: 'general_room_response', isDirect: false };
  }

  /**
   * Ultra-fast debounce for rapid typing
   * Direct mentions/replies are dispatched immediately with 0ms delay.
   * General messages are buffered for only 100ms to combine rapid multi-line pastes.
   */
  debounceMessage(msg, onReady, isDirect = false) {
    if (isDirect) {
      // Zero delay for direct user queries or replies
      onReady(msg);
      return;
    }

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
    }, 100);
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
   * Generous rate limit: allows continuous conversational queries without dropping messages.
   * Only throttles aggressive bot spam (more than 25 requests within 10 seconds).
   */
  isRateLimited(msg) {
    const key = this.getUserKey(msg);
    const now = Date.now();
    if (!this.userRequestTimestamps) {
      this.userRequestTimestamps = new Map();
    }
    let timestamps = this.userRequestTimestamps.get(key) || [];
    timestamps = timestamps.filter(t => now - t < 10000);
    if (timestamps.length >= 25) {
      return true;
    }
    timestamps.push(now);
    this.userRequestTimestamps.set(key, timestamps);
    return false;
  }
}

module.exports = { DecisionEngine };
