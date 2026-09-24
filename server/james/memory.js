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
    this.welcomedUsers = new Set();
    this.lastReturnGreetTime = new Map();
    
    // Daily news dispatch tracking (5 to 10 news per day on different categories)
    this.dailyNewsStats = {
      date: new Date().toISOString().slice(0, 10),
      count: 0,
      targetToday: Math.floor(Math.random() * 6) + 5, // Random 5 to 10 per day
      lastSentTime: 0,
      lastCategory: null
    };

    this.storagePath = options.storagePath || path.join(__dirname, '..', 'data', 'james_memory.json');
    this.saveTimeout = null;

    this.loadPersistedMemory();
  }

  // --- Daily News Limits & Category Rotation (5-10/day) ---

  canSendDailyNews() {
    const today = new Date().toISOString().slice(0, 10);
    if (this.dailyNewsStats.date !== today) {
      this.dailyNewsStats.date = today;
      this.dailyNewsStats.count = 0;
      this.dailyNewsStats.targetToday = Math.floor(Math.random() * 6) + 5; // 5 to 10
      this.scheduleSave();
    }

    // Check daily ceiling (5-10 news per day)
    if (this.dailyNewsStats.count >= this.dailyNewsStats.targetToday) {
      return false;
    }

    // Minimum spacing between news dispatches: at least 60 minutes
    const timeSinceLast = Date.now() - (this.dailyNewsStats.lastSentTime || 0);
    if (timeSinceLast < 60 * 60 * 1000) {
      return false;
    }

    return true;
  }

  recordNewsSent(category) {
    const today = new Date().toISOString().slice(0, 10);
    if (this.dailyNewsStats.date !== today) {
      this.dailyNewsStats.date = today;
      this.dailyNewsStats.count = 0;
      this.dailyNewsStats.targetToday = Math.floor(Math.random() * 6) + 5;
    }
    this.dailyNewsStats.count++;
    this.dailyNewsStats.lastSentTime = Date.now();
    this.dailyNewsStats.lastCategory = category;
    this.scheduleSave();
    console.log(`[MemoryService]: Recorded daily news dispatch (${this.dailyNewsStats.count}/${this.dailyNewsStats.targetToday} today) - Category: ${category}`);
  }

  pickNextDailyNewsCategory() {
    const allCategories = ['viral', 'x_platform', 'geopolitics', 'tech', 'healthcare', 'science', 'finance', 'world'];
    const candidates = allCategories.filter(c => c !== this.dailyNewsStats.lastCategory);
    return candidates[Math.floor(Math.random() * candidates.length)] || 'viral';
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
      fileUrl: msg.fileUrl || msg.imageUrl || null,
      imageUrl: msg.imageUrl || (msg.fileType?.startsWith('image/') ? msg.fileUrl : null),
      fileType: msg.fileType || null,
      replyTo: msg.replyTo ? {
        id: msg.replyTo.id,
        alias: msg.replyTo.alias,
        text: (msg.replyTo.text || '').substring(0, 100),
        fileUrl: msg.replyTo.fileUrl || msg.replyTo.imageUrl || null,
        imageUrl: msg.replyTo.imageUrl || msg.replyTo.fileUrl || null,
        fileType: msg.replyTo.fileType || null
      } : null,
      isJames: msg.alias === 'James' || msg.userId === 'bot_james'
    };

    this.conversationHistory.push(entry);
    if (this.conversationHistory.length > this.maxHistory) {
      this.conversationHistory.shift();
    }
    this.cleanupOldHistory();
  }

  /**
   * Purge conversation history turns older than 24 hours.
   */
  cleanupOldHistory() {
    const now = Date.now();
    const MS_24_HOURS = 24 * 60 * 60 * 1000;
    this.conversationHistory = this.conversationHistory.filter(
      m => (now - (m.timestamp || 0)) < MS_24_HOURS
    );
  }

  /**
   * Find a past message in memory by ID.
   * @param {string|number} id
   */
  getMessageById(id) {
    if (!id) return null;
    const strId = String(id);
    return this.conversationHistory.find(m => String(m.id) === strId) || null;
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

  touchUser(userId, alias) {
    this.recordUserInteraction(userId, alias);
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

  // --- Welcomed Users & Greeting Persistence ---

  isUserWelcomed(userId, alias) {
    if (alias && this.welcomedUsers.has(alias.trim().toLowerCase())) return true;
    if (userId && this.welcomedUsers.has(userId.trim().toLowerCase())) return true;
    if (this.getUserMemory(userId, alias)) return true;
    return false;
  }

  markUserWelcomed(userId, alias) {
    let changed = false;
    if (alias) {
      const a = alias.trim().toLowerCase();
      if (!this.welcomedUsers.has(a)) {
        this.welcomedUsers.add(a);
        changed = true;
      }
    }
    if (userId) {
      const u = userId.trim().toLowerCase();
      if (!this.welcomedUsers.has(u)) {
        this.welcomedUsers.add(u);
        changed = true;
      }
    }
    if (changed) {
      this.scheduleSave();
    }
  }

  canGreetReturningUser(alias) {
    if (!alias) return false;
    const a = alias.trim().toLowerCase();
    const lastTime = this.lastReturnGreetTime.get(a) || 0;
    return (Date.now() - lastTime) > (24 * 60 * 60 * 1000);
  }

  markReturningUserGreeted(alias) {
    if (!alias) return;
    const a = alias.trim().toLowerCase();
    this.lastReturnGreetTime.set(a, Date.now());
    this.scheduleSave();
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
              if (u.alias) this.welcomedUsers.add(u.alias.trim().toLowerCase());
              if (u.userId) this.welcomedUsers.add(u.userId.trim().toLowerCase());
            });
          }
          if (Array.isArray(parsed.welcomedUsers)) {
            parsed.welcomedUsers.forEach(u => {
              if (u && typeof u === 'string') this.welcomedUsers.add(u.trim().toLowerCase());
            });
          }
          if (parsed.lastReturnGreetTime && typeof parsed.lastReturnGreetTime === 'object') {
            for (const [k, v] of Object.entries(parsed.lastReturnGreetTime)) {
              if (k && v) this.lastReturnGreetTime.set(k.toLowerCase(), Number(v));
            }
          }
          if (parsed.dailyNewsStats && typeof parsed.dailyNewsStats === 'object') {
            this.dailyNewsStats = { ...this.dailyNewsStats, ...parsed.dailyNewsStats };
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
    }, 2000); // 2-second debounce
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
        welcomedUsers: Array.from(this.welcomedUsers),
        lastReturnGreetTime: Object.fromEntries(this.lastReturnGreetTime),
        dailyNewsStats: this.dailyNewsStats,
        users: usersArray
      };

      fs.writeFileSync(this.storagePath, JSON.stringify(payload, null, 2), 'utf8');
    } catch (err) {
      console.warn('[MemoryService]: Failed to save memory to disk:', err.message);
    }
  }
}

module.exports = { MemoryService };
