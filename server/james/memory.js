const fs = require('fs');
const path = require('path');

/**
 * Multi-layer Memory Service for James Agent:
 * 1. Short-term conversation buffer (recent context turns)
 * 2. Rolling conversation summary & active topics
 * 3. User-specific persistent memory keyed by stable userId
 */
class MemoryService {
  constructor(options = {}) {
    this.maxHistory = options.maxHistory || 30;
    this.conversationHistory = [];
    this.activeTopics = new Set();
    this.conversationSummary = '';
    
    // User memories: Map of userId/key -> { userId, alias, notes: [], topics: [], count: 0, lastSeen: number }
    this.userMemories = new Map();
    
    this.storagePath = options.storagePath || path.join(__dirname, '..', 'data', 'james_memory.json');
    this.saveTimeout = null;

    this.loadPersistedMemory();
  }

  // --- Short-Term Conversation History ---

  /**
   * Add a message to the rolling conversation history.
   * Only stores unencrypted messages.
   */
  addMessage(msg) {
    if (!msg || msg.encrypted) return;
    
    const entry = {
      id: msg.id || Date.now(),
      sender: msg.alias || 'Anonymous',
      userId: msg.userId || null,
      text: (msg.text || '').trim(),
      timestamp: msg.timestamp || Date.now(),
      replyTo: msg.replyTo ? {
        alias: msg.replyTo.alias,
        text: (msg.replyTo.text || '').substring(0, 100)
      } : null,
      isJames: msg.alias === 'James' || msg.userId === 'bot_james'
    };

    this.conversationHistory.push(entry);
    if (this.conversationHistory.length > this.maxHistory) {
      this.conversationHistory.shift();
    }
  }

  /**
   * Get recent messages formatted for context injection.
   * @param {number} count - Number of messages to retrieve.
   */
  getRecentMessages(count = 15) {
    return this.conversationHistory.slice(-count);
  }

  /**
   * Format history as multi-turn messages for the LLM.
   */
  getFormattedHistoryForLLM(limit = 12) {
    const slice = this.conversationHistory.slice(-limit);
    return slice.map(m => {
      if (m.isJames) {
        return {
          role: 'assistant',
          content: m.text
        };
      } else {
        const prefix = m.replyTo ? `[In reply to @${m.replyTo.alias}: "${m.replyTo.text}"] ` : '';
        return {
          role: 'user',
          content: `[@${m.sender}]: ${prefix}${m.text}`
        };
      }
    });
  }

  // --- Active Topics & Summaries ---

  setConversationSummary(summary) {
    if (typeof summary === 'string') {
      this.conversationSummary = summary.trim();
    }
  }

  getConversationSummary() {
    return this.conversationSummary;
  }

  addTopic(topic) {
    if (topic && typeof topic === 'string') {
      this.activeTopics.add(topic.trim());
      if (this.activeTopics.size > 8) {
        const first = this.activeTopics.values().next().value;
        this.activeTopics.delete(first);
      }
    }
  }

  getActiveTopics() {
    return Array.from(this.activeTopics);
  }

  // --- User-Specific Context & Memory ---

  getUserKey(userId, alias) {
    if (userId && typeof userId === 'string' && userId.trim()) {
      return `uid:${userId.trim().toLowerCase()}`;
    }
    if (alias && typeof alias === 'string' && alias.trim()) {
      return `alias:${alias.trim().toLowerCase()}`;
    }
    return null;
  }

  /**
   * Retrieve memory record for a specific user.
   */
  getUserMemory(userId, alias) {
    const key = this.getUserKey(userId, alias);
    if (!key) return null;
    return this.userMemories.get(key) || null;
  }

  /**
   * Record an interaction with a user and update their stats.
   */
  recordUserInteraction(userId, alias) {
    const key = this.getUserKey(userId, alias);
    if (!key) return;

    let mem = this.userMemories.get(key);
    if (!mem) {
      mem = {
        userId: userId || null,
        alias: alias || 'Anonymous',
        count: 0,
        notes: [],
        topics: [],
        lastSeen: Date.now()
      };
    }

    mem.count += 1;
    mem.lastSeen = Date.now();
    if (alias) mem.alias = alias;
    if (userId) mem.userId = userId;

    this.userMemories.set(key, mem);
    this.scheduleSave();
  }

  /**
   * Save a relevant fact, preference, or technical note about a user.
   * @param {string} userId - User identifier.
   * @param {string} alias - User display name.
   * @param {string} note - Note to preserve (e.g. "Building weather app with Open-Meteo").
   */
  saveUserNote(userId, alias, note) {
    const key = this.getUserKey(userId, alias);
    if (!key || !note) return false;

    let mem = this.userMemories.get(key);
    if (!mem) {
      mem = {
        userId: userId || null,
        alias: alias || 'Anonymous',
        count: 1,
        notes: [],
        topics: [],
        lastSeen: Date.now()
      };
      this.userMemories.set(key, mem);
    }

    const cleanNote = note.trim();
    // Avoid duplicate notes
    if (!mem.notes.includes(cleanNote)) {
      mem.notes.push(cleanNote);
      if (mem.notes.length > 10) {
        mem.notes.shift(); // Keep most recent 10 notes
      }
      this.scheduleSave();
      return true;
    }
    return false;
  }

  // --- Persistence ---

  loadPersistedMemory() {
    try {
      if (fs.existsSync(this.storagePath)) {
        const data = fs.readFileSync(this.storagePath, 'utf8');
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.users)) {
            parsed.users.forEach(u => {
              if (u.key) {
                this.userMemories.set(u.key, u);
              }
            });
          }
          if (parsed.summary) {
            this.conversationSummary = parsed.summary;
          }
          if (Array.isArray(parsed.topics)) {
            parsed.topics.forEach(t => this.activeTopics.add(t));
          }
        }
      }
    } catch (err) {
      console.warn('[MemoryService]: Could not load persisted memory, starting clean:', err.message);
    }
  }

  scheduleSave() {
    if (this.saveTimeout) return;
    this.saveTimeout = setTimeout(() => {
      this.saveTimeout = null;
      this.saveToDisk();
    }, 5000); // 5-second debounce
  }

  saveToDisk() {
    try {
      const dir = path.dirname(this.storagePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const usersArray = [];
      for (const [key, val] of this.userMemories.entries()) {
        usersArray.push({ key, ...val });
      }

      const payload = {
        updatedAt: Date.now(),
        summary: this.conversationSummary,
        topics: Array.from(this.activeTopics),
        users: usersArray
      };

      fs.writeFileSync(this.storagePath, JSON.stringify(payload, null, 2), 'utf8');
    } catch (err) {
      console.warn('[MemoryService]: Failed to save memory to disk:', err.message);
    }
  }
}

module.exports = { MemoryService };
