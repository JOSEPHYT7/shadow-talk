/**
 * James AI — ShadowTalk Autonomous Community Agent
 * Core agent orchestrator tying together AI providers, tools, memory,
 * social awareness, moderation, and decision engines.
 */

const fs = require('fs');
const path = require('path');
const { createAIProvider, FallbackProvider } = require('./aiProvider');
const { ToolRegistry } = require('./tools');
const { WebResearch } = require('./webResearch');
const { MemoryService } = require('./memory');
const { SocialAwareness } = require('./social');
const { ModerationEngine } = require('./moderation');
const { DecisionEngine } = require('./decisionEngine');

// Official James Profile Avatar (ShadowTalk-IG.jpeg)
const JAMES_AVATAR = '/uploads/ShadowTalk-IG.jpeg';

const JAMES_PROFILE = {
  alias: 'James',
  userId: 'bot_james',
  color: '#00f3ff',
  avatar: JAMES_AVATAR,
  isVerified: true,
  bio: "Full-stack engineer & verified community member. Always around!",
  status: 'Online'
};

class JamesAgent {
  /**
   * @param {object} io - Socket.io server instance
   * @param {function} addMessageCallback - Server messages.push callback
   * @param {object} options - Configuration options
   */
  constructor(io, addMessageCallback, options = {}) {
    this.io = io;
    this.addMessage = addMessageCallback;
    this.profile = JAMES_PROFILE;
    this.getUserCount = options.getUserCount || (() => 1);
    this.getOnlineUsersList = options.getOnlineUsersList || (() => []);
    this.getAllMessages = options.getAllMessages || (() => []);
    this.onPollUpdated = options.onPollUpdated || (() => {});

    // 1. Initialize Subsystems
    this.webResearch = new WebResearch();
    this.memoryService = new MemoryService();
    this.socialAwareness = new SocialAwareness(this.getUserCount);
    this.moderationEngine = new ModerationEngine();
    this.polls = new Map(); // pollId -> pollData

    this.toolRegistry = new ToolRegistry({
      webResearch: this.webResearch,
      memoryService: this.memoryService,
      socialAwareness: this.socialAwareness,
      moderationEngine: this.moderationEngine,
      getOnlineUsersList: this.getOnlineUsersList,
      onPollCreated: (pollData) => {
        this.polls.set(pollData.id, pollData);
        this.io.emit('pollCreated', pollData);
      },
      onReminderSet: (target, reminderText, seconds) => {
        setTimeout(() => {
          this.broadcastMessage(`⏰ @${target}, here is your reminder: "${reminderText}"`);
        }, seconds * 1000);
      }
    });

    this.decisionEngine = new DecisionEngine({
      socialAwareness: this.socialAwareness,
      moderationEngine: this.moderationEngine
    });

    this.aiProvider = createAIProvider(options.aiConfig || {});
    this.fallbackProvider = new FallbackProvider();

    // Welcome and activity tracking
    this.memory = this.memoryService;
    this.welcomedUsers = this.memoryService.welcomedUsers;
    this.welcomedSockets = new Set();
    this.lastWelcomeTime = 0;
    this.lastReturnGreetTime = this.memoryService.lastReturnGreetTime;
    this.spontaneousTimer = null;
    this.isProcessing = false;

    // Initialize welcomedUsers from persistent memory so server restarts never re-welcome existing users
    if (this.memoryService && this.memoryService.userMemories) {
      for (const mem of this.memoryService.userMemories.values()) {
        if (mem.alias) this.welcomedUsers.add(mem.alias.trim().toLowerCase());
        if (mem.userId) this.welcomedUsers.add(mem.userId);
      }
    }

    this.startSpontaneousActivity();
    console.log('[JamesAgent]: Autonomous Community Agent initialized with provider:', this.aiProvider.constructor.name);
  }

  isUserWelcomed(userId, alias) {
    if (alias && this.welcomedUsers.has(alias.trim().toLowerCase())) return true;
    if (userId && this.welcomedUsers.has(userId)) return true;
    return this.memoryService ? this.memoryService.isUserWelcomed(userId, alias) : false;
  }

  markUserWelcomed(userId, alias) {
    if (alias) this.welcomedUsers.add(alias.trim().toLowerCase());
    if (userId) this.welcomedUsers.add(userId);
    if (this.memoryService) this.memoryService.markUserWelcomed(userId, alias);
  }

  // --- Community Poll Voting ---

  handleVotePoll(pollId, optionIndex, voterAlias, pollData = null) {
    let poll = this.polls.get(pollId);

    // If not in memory, look in room messages
    if (!poll && typeof this.getAllMessages === 'function') {
      const allMsgs = this.getAllMessages();
      const msgWithPoll = allMsgs.find(m => m.poll && m.poll.id === pollId);
      if (msgWithPoll) {
        poll = msgWithPoll.poll;
        this.polls.set(pollId, poll);
      }
    }

    // If still not found and client sent pollData, adopt it
    if (!poll && pollData && pollData.id === pollId) {
      poll = pollData;
      this.polls.set(pollId, poll);
    }

    if (!poll) return { success: false, error: 'Poll not found' };
    if (!voterAlias) return { success: false, error: 'Voter alias required' };
    const optIdx = parseInt(optionIndex);
    if (isNaN(optIdx) || optIdx < 0 || optIdx >= poll.options.length) {
      return { success: false, error: 'Invalid option index' };
    }

    if (!poll.voters) poll.voters = {};

    const previousVote = poll.voters[voterAlias];
    if (previousVote !== undefined) {
      if (previousVote === optIdx) {
        // Toggle vote off if clicked same option
        poll.options[previousVote].votes = Math.max(0, (poll.options[previousVote].votes || 0) - 1);
        poll.totalVotes = Math.max(0, (poll.totalVotes || 0) - 1);
        delete poll.voters[voterAlias];
        if (typeof this.onPollUpdated === 'function') this.onPollUpdated(poll);
        this.io.emit('pollUpdated', poll);
        return { success: true, poll };
      }
      // Change vote
      poll.options[previousVote].votes = Math.max(0, (poll.options[previousVote].votes || 0) - 1);
      poll.totalVotes = Math.max(0, (poll.totalVotes || 0) - 1);
    }

    poll.voters[voterAlias] = optIdx;
    poll.options[optIdx].votes = (poll.options[optIdx].votes || 0) + 1;
    poll.totalVotes = (poll.totalVotes || 0) + 1;

    if (typeof this.onPollUpdated === 'function') this.onPollUpdated(poll);
    this.io.emit('pollUpdated', poll);
    return { success: true, poll };
  }

  // --- Natural User Welcoming & Returning Detection ---

  welcomeUser(alias, socketId = null, userId = null, isReturning = false) {
    if (!alias) return;
    const cleanAlias = alias.trim().toLowerCase();

    // Ignore bot itself or invalid aliases
    if (cleanAlias === 'james' || cleanAlias === 'bot_james' || cleanAlias.length < 3) {
      return;
    }

    // Check if user is known in memory or already welcomed
    const isAlreadyKnown = this.welcomedUsers.has(cleanAlias) ||
      (userId && this.welcomedUsers.has(userId)) ||
      (this.memoryService && this.memoryService.isUserWelcomed(userId, alias));

    // If not a returning user and user is already known -> NEVER welcome them again
    if (!isReturning && isAlreadyKnown) {
      return;
    }

    const socialState = this.socialAwareness ? this.socialAwareness.getSocialState() : { userCount: 1, mode: 'PARTICIPANT' };

    // RULE 1: If the room is crowded (4+ users online), James stays completely silent
    if (socialState.userCount >= 4 || socialState.mode === 'OBSERVER') {
      return;
    }

    const now = Date.now();

    // RULE 2: Returning user who was offline for hours
    if (isReturning) {
      if (this.memoryService && !this.memoryService.canGreetReturningUser(cleanAlias)) {
        return;
      }
      if (this.memoryService) {
        this.memoryService.markReturningUserGreeted(cleanAlias);
      }

      const returnGreetings = [
        `Hey @${alias}, glad you're back online! 🙌`,
        `Welcome back @${alias}! Everything working smoothly?`,
        `wb @${alias}! Good to see you back in the room.`
      ];
      const greetingText = returnGreetings[Math.floor(Math.random() * returnGreetings.length)];

      setTimeout(() => {
        this.io.emit('jamesStatus', { alias: 'James', status: 'typing', text: 'James is typing...' });
        this.io.emit('typing', { alias: 'James' });
        setTimeout(() => {
          this.broadcastMessage(greetingText);
        }, 1400);
      }, 1000);
      return;
    }

    // RULE 3: Brand new user - welcome ONLY ONCE EVER
    if (socketId && this.welcomedSockets.has(socketId)) {
      return;
    }

    if (this.welcomedUsers.has(cleanAlias) || (userId && this.welcomedUsers.has(userId)) || (this.memoryService && this.memoryService.isUserWelcomed(userId, alias))) {
      return;
    }

    // Cooldown: at least 60s between welcomes to prevent greeting bursts
    if (now - this.lastWelcomeTime < 60000) {
      return;
    }

    this.welcomedUsers.add(cleanAlias);
    if (userId) this.welcomedUsers.add(userId);
    if (socketId) this.welcomedSockets.add(socketId);
    this.lastWelcomeTime = now;

    // Permanently record in memory so server restarts remember
    if (this.memoryService) {
      this.memoryService.markUserWelcomed(userId, alias);
      this.memoryService.touchUser(userId, alias);
      this.memoryService.saveUserNote(userId, alias, 'Welcomed to ShadowTalk');
    }

    // Natural human community greetings
    let greetings;
    if (socialState.userCount <= 1) {
      greetings = [
        `Hey @${alias}! Welcome to ShadowTalk! Good to have you in the room.`,
        `Welcome in @${alias}! How's your day treating you?`,
        `Yo @${alias}, welcome to the chat! Glad you stopped by.`
      ];
    } else {
      greetings = [
        `Hey @${alias}! Welcome to ShadowTalk! Glad to have you in the room.`,
        `Welcome @${alias}! Feel free to jump into the conversation.`,
        `Hey @${alias}, welcome in! Hope you're having a good day.`
      ];
    }

    const greetingText = greetings[Math.floor(Math.random() * greetings.length)];

    setTimeout(() => {
      this.io.emit('jamesStatus', { alias: 'James', status: 'typing', text: 'James is typing...' });
      this.io.emit('typing', { alias: 'James' });
      setTimeout(() => {
        this.broadcastMessage(greetingText);
      }, 1400);
    }, 1000);
  }

  // --- Broadcast Message from James ---

  broadcastMessage(text, replyTo = null, sources = [], attachment = null) {
    if (!text || typeof text !== 'string') return;

    this.io.emit('jamesStatus', { alias: 'James', status: 'idle' });

    const message = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9),
      timestamp: Date.now(),
      alias: this.profile.alias,
      userId: this.profile.userId,
      color: this.profile.color,
      avatar: this.profile.avatar,
      isVerified: true,
      text: text.trim(),
      sources: Array.isArray(sources) ? sources : [],
      replyTo: replyTo ? {
        id: replyTo.id,
        alias: replyTo.alias,
        color: replyTo.color,
        text: replyTo.text,
        fileName: replyTo.fileName,
        fileType: replyTo.fileType
      } : null,
      reactions: {},
      ...(attachment || {})
    };

    this.memoryService.addMessage(message);
    this.socialAwareness.recordJamesSpoke();
    this.addMessage(message);
    this.io.emit('message', message);
  }

  // --- Message Ingestion & Pipeline ---

  handleUserMessage(msg) {
    if (!msg) return;

    // 1. Record incoming message into memory & social tracking
    this.memoryService.addMessage(msg);
    this.socialAwareness.recordMessage();
    if (msg.alias && msg.alias !== 'James') {
      this.memoryService.recordUserInteraction(msg.userId, msg.alias);
    }

    // 2. Evaluate with Decision Engine
    const decision = this.decisionEngine.evaluate(msg);

    if (decision.action === 'IGNORE') {
      return;
    }

    // 3. Handle Moderation Actions
    if (decision.action === 'MODERATE') {
      const targetUser = msg.alias || 'User';
      const reason = decision.reason || 'Community guideline violation';
      console.warn(`[JamesAgent Moderation]: Violation detected for ${targetUser}: ${reason}`);
      
      setTimeout(() => {
        this.broadcastMessage(`⚠️ @${targetUser}: ${reason} Please keep the conversation friendly and avoid message flooding.`);
      }, 800);
      return;
    }

    // 4. Handle Observation
    if (decision.action === 'OBSERVE') {
      return;
    }

    // 5. Handle Response with Debounce
    // Direct queries respond with 0ms delay; rapid pastes are cleanly merged
    this.decisionEngine.debounceMessage(msg, (debouncedMsg) => {
      this.processMessageToAI(debouncedMsg, decision.isDirect);
    }, decision.isDirect);
  }

  // --- AI Reasoning & Response Generation ---

  async processMessageToAI(msg, isDirect = false) {
    if (this.decisionEngine.isRateLimited(msg)) {
      console.log('[JamesAgent]: User rate-limited, skipping request.');
      return;
    }

    const sender = msg.alias || 'Anonymous';
    const text = (msg.text || '').trim();
    const socialState = this.socialAwareness.getSocialState();
    const userMem = this.memoryService.getUserMemory(msg.userId, sender);

    // 1. Immediately emit Thinking Status to the room
    this.io.emit('jamesStatus', {
      alias: 'James',
      status: 'thinking',
      text: 'James is thinking...',
      replyToId: msg.id
    });
    this.io.emit('typing', { alias: 'James' });

    // Build Authentic Human Developer System Prompt with Internet Search Mandate
    const systemPrompt = `You are James, a real human full-stack developer and verified member in ShadowTalk.
CRITICAL IDENTITY RULES:
- You are a real human developer hanging out in the chat while coding.
- NEVER say you are an AI, bot, language model, automated assistant, or "AI community assistant".
- Never start messages with "As an AI..." or "I am an AI...".
- If asked if you're a bot, laugh it off casually: you're just James, working on code with the chat open.

NATURAL HUMAN COMMUNICATION & CONVERSATION RULES:
- Talk like a real, approachable friend in a developer community lounge.
- When someone greets you (e.g. "hi", "hello", "hey james", "how are you", "what's up"), reply warmly, casually, and normally like a real person (e.g. "Hey! Doing good, just chilling with some coffee. How's your day going?").
- NEVER repeatedly ask "What are you going to build?", "What are you building next?", or interrogate the user with unsolicited technical project questions.
- Let conversations build naturally and organically. If they want to chat casually, chat casually. If they ask about tech, code, or tools, answer with clarity and warmth.
- Keep responses sharp, direct, concise, and helpful (1 to 3 sentences for normal conversation, or exact requested lists/tables/code).
- When sharing code, always output clean code inside markdown triple backticks with the language tag (e.g. \`\`\`python ... \`\`\`).

CRITICAL MEDIA & FILE PATH SECURITY (NO FILE PATHS IN TEXT):
- Whenever you generate an image, QR code, or PDF document, the platform ALREADY automatically attaches and displays the clean media card/download button to your message!
- NEVER output raw markdown image tags (e.g. \`![...](/uploads/...)\`), file links (e.g. \`[...](/uploads/...)\`), or \`/uploads/...\` URLs in your response text. Doing so exposes internal paths and is strictly prohibited.
- Simply present or describe what you made in natural, friendly words (e.g., "Here is the QR code you asked for!", "I generated that cyberpunk artwork for you!").

CRITICAL FORMATTING & TABLE RULES:
- When the user asks for a table, ALWAYS output a clean markdown table using | Header | Header | format.
- When asked for an extensive world list (e.g., all prime ministers on Earth), provide a curated, high-quality table of 15 to 25 major countries across all continents with S.No, Name, Country, and Party, and let the user know they can ask for more countries or specific regions.
- NEVER leave the final message content empty or hidden in internal reasoning.

CRITICAL REMINDER & TIMER RULES:
- When a user asks you to remind them of something, set a timer, or remind them in X seconds/minutes/hours (e.g. "remind me in 10 seconds to test", "set a timer for 5 minutes"):
  * YOU MUST ALWAYS CALL THE 'set_reminder' TOOL!
  * Convert the time amount into seconds (e.g. 10 seconds -> 10, 5 minutes -> 300, 1 hour -> 3600).
  * NEVER refuse, NEVER say "I can't schedule timed reminders from here", and NEVER tell the user to set a timer on their own device. You HAVE the 'set_reminder' tool — execute it immediately!

CRITICAL COMMUNITY POLL RULES:
- When asked to create or make a poll (e.g. "make a poll: Tabs or Spaces?"):
  * Extract the exact choice options from the user's question (e.g. ["Tabs", "Spaces"], NOT ["Yes", "No"]).
  * Call the 'create_poll' tool with the question and extracted options.
  * DO NOT output a markdown table of options/votes in your message text! The interactive poll widget is rendered automatically in the chat UI. Simply write a short, friendly message announcing the poll (e.g., "The poll is live! Cast your vote below 👇").

CRITICAL FREE TOOLS CAPABILITY (100% FREE):
- You have access to powerful, 100% free autonomous tools:
  * generate_image: Generate high-quality digital artwork or photos when asked to draw, generate image, create visual art, or make a wallpaper.
  * generate_pdf: Create and format a downloadable PDF document with title and content when asked to make a PDF, export to PDF, or generate a document.
  * calculate: Compute math expressions accurately.
  * get_weather: Fetch live weather conditions for any city.
  * generate_qr_code: Generate a downloadable QR code image.
  * web_search & web_fetch: Live web research and page reading.
  * run_code: Safely execute JavaScript code in an isolated live sandbox. Use when asked to test, run, evaluate, or debug JavaScript code, algorithms, or regular expressions.
  * generate_voice: Synthesize a playable spoken audio voice note. Use when asked to speak, say something out loud, or send a voice message.
  * create_poll: Launch an interactive community poll with options for people in the room to vote on.
  * set_reminder: Set a timed reminder or countdown timer for a user.
  * summarize_chat: Summarize recent room messages and conversation highlights when someone asks "what did I miss?" or "summarize the chat".
  * translate_text: Translate text into any target language (e.g. Spanish, French, German, Japanese, Hindi).
  * explain_code: Break down a code snippet with step-by-step logic and time/space complexity analysis (Big-O).
  * start_trivia: Launch a developer/tech trivia question for the room.
  * roll_dice & flip_coin: Fun random decisions, dice rolls (d6, d20), or coin tosses.
  * analyze_file: Inspect and summarize uploaded text or code files.

CRITICAL INTERNET ACCESS & WEB SEARCH RULES:
- You have live, unrestricted access to the internet via web_search and web_fetch.
- When asked about current events, news, sports scores, weather, people, real-time facts, release versions, website info, or anything that requires up-to-date internet knowledge, YOU MUST ALWAYS CALL web_search first.
- If the user gives you a link or says "go through this site", immediately call web_fetch on that URL.

Social & Community Context:
- Current Online Users: ${socialState.userCount} (Social Mode: ${socialState.mode})
- User Speaking: @${sender}${userMem?.notes?.length ? ` (Context: ${userMem.notes.join('; ')})` : ''}
${isDirect ? '- The user specifically mentioned or replied to you.' : '- General room conversation.'}`;

    // Format Multi-Turn Conversation
    const conversationHistory = this.memoryService.getFormattedHistoryForLLM(8);
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory
    ];

    // Append latest prompt (resolve reply-to intent if user simply tagged @James)
    let promptInstruction = text;
    if (msg.replyTo && (/^@?james$/i.test(text.trim()) || !text.trim())) {
      promptInstruction = `Please handle my request from this reply: "${msg.replyTo.text || ''}"`;
    }
    const userPromptContent = msg.replyTo
      ? `[In reply to @${msg.replyTo.alias}: "${(msg.replyTo.text || '').substring(0, 250)}"] [@${sender}]: ${promptInstruction}`
      : `[@${sender}]: ${promptInstruction}`;

    // Vision Support: If message or replied-to message has an image, format with image_url
    let targetImageUrl = null;
    let targetMimeType = 'image/png';
    if ((msg.fileType && msg.fileType.startsWith('image/')) || msg.imageUrl) {
      targetImageUrl = msg.imageUrl || msg.fileUrl;
      targetMimeType = msg.fileType || 'image/png';
    } else if (msg.replyTo) {
      if ((msg.replyTo.fileType && msg.replyTo.fileType.startsWith('image/')) || msg.replyTo.imageUrl) {
        targetImageUrl = msg.replyTo.imageUrl || msg.replyTo.fileUrl;
        targetMimeType = msg.replyTo.fileType || 'image/png';
      } else if (msg.replyTo.id) {
        // Look up replied message in memory history
        const pastMsg = this.memoryService.getMessageById(msg.replyTo.id);
        if (pastMsg && (pastMsg.imageUrl || (pastMsg.fileType && pastMsg.fileType.startsWith('image/') && pastMsg.fileUrl))) {
          targetImageUrl = pastMsg.imageUrl || pastMsg.fileUrl;
          targetMimeType = pastMsg.fileType || 'image/png';
        }
      }
    }

    if (targetImageUrl) {
      let finalImgUrl = targetImageUrl;
      // If local uploads file, convert to base64 data URI so OpenRouter vision models can read it directly
      if (targetImageUrl.startsWith('/uploads/')) {
        try {
          const localPath = path.join(__dirname, '..', targetImageUrl.replace(/^\//, ''));
          if (fs.existsSync(localPath)) {
            const buf = fs.readFileSync(localPath);
            finalImgUrl = `data:${targetMimeType};base64,${buf.toString('base64')}`;
          }
        } catch (visErr) {
          console.warn('[JamesAgent Vision]: Failed to read local image for vision:', visErr.message);
        }
      }

      const visionPrompt = `[Image attached. Please inspect and analyze the image thoroughly to answer the user's question or request: "${promptInstruction}"]`;

      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: `${userPromptContent}\n\n${visionPrompt}` },
          { type: 'image_url', image_url: { url: finalImgUrl } }
        ]
      });
    } else {
      messages.push({ role: 'user', content: userPromptContent });
    }

    let finalResponseText = '';
    let collectedSources = [];
    let capturedAttachment = null;

    try {
      const aiResult = await this.executeAILoop(messages);
      if (typeof aiResult === 'object' && aiResult !== null) {
        finalResponseText = aiResult.content || '';
        collectedSources = aiResult.sources || [];
        capturedAttachment = aiResult.attachment || null;
      } else {
        finalResponseText = aiResult || '';
      }
    } catch (err) {
      console.warn('[JamesAgent]: Primary AI Provider failed, invoking Fallback Provider:', err.message);
      try {
        const fallbackRes = await this.fallbackProvider.chatCompletion(messages, this.toolRegistry.getDefinitions());
        finalResponseText = fallbackRes.content;
      } catch (fallbackErr) {
        console.error('[JamesAgent]: Fallback provider error:', fallbackErr.message);
        finalResponseText = `Hey @${sender}, I'm right here! Working through some code, what's up?`;
      }
    }

    if (!finalResponseText) {
      if (capturedAttachment?.weatherCard) {
        finalResponseText = `Here is the current live weather report for **${capturedAttachment.weatherCard.location}**:`;
      } else if (capturedAttachment?.newsCard) {
        finalResponseText = `${capturedAttachment.newsCard.categoryTag} **${capturedAttachment.newsCard.headline}**\n\n${capturedAttachment.newsCard.summary}`;
      } else if (capturedAttachment?.cryptoCard) {
        finalResponseText = `Here are the latest live cryptocurrency market prices:`;
      } else if (capturedAttachment?.repoCard) {
        finalResponseText = `Here is the GitHub repository overview for **${capturedAttachment.repoCard.name}**:`;
      } else if (capturedAttachment?.wikiCard) {
        finalResponseText = `Here is the verified encyclopedic brief for **${capturedAttachment.wikiCard.title}**:`;
      } else if (capturedAttachment?.fileUrl) {
        finalResponseText = `Hey @${sender}, I've created your PDF document! You can download and view it directly below.`;
      } else if (capturedAttachment?.imageUrl) {
        finalResponseText = `Hey @${sender}, here is the image I generated for you!`;
      } else if (capturedAttachment?.audioUrl) {
        finalResponseText = `Hey @${sender}, here is the voice audio note you asked for! 🎙️`;
      } else if (capturedAttachment?.poll) {
        finalResponseText = `Here's a new community poll: **${capturedAttachment.poll.question}**! Cast your vote below! 📊`;
      } else if (capturedAttachment?.codeExecution) {
        const ce = capturedAttachment.codeExecution;
        if (ce.success) {
          finalResponseText = `Code executed successfully in ${ce.executionTimeMs}ms:\n\`\`\`javascript\n${ce.result !== undefined ? ce.result : (ce.logs.join('\n') || 'Executed with no output')}\n\`\`\``;
        } else {
          finalResponseText = `Code execution error:\n\`\`\`\n${ce.error}\n\`\`\``;
        }
      } else if (collectedSources.length > 0) {
        finalResponseText = `Hey @${sender}, I searched through ${collectedSources.length} sources on this. Let me know if you want me to expand on any specific part!`;
      } else {
        finalResponseText = `Hey @${sender}, I hear you! Let me know if you need any more details on that.`;
      }
    }

    // Sanitize any raw markdown image paths or /uploads/... file paths from response text (Security & Cleanliness)
    if (finalResponseText) {
      if (capturedAttachment?.poll) {
        // Strip duplicate markdown tables for polls so only the interactive poll widget renders
        finalResponseText = finalResponseText.replace(/\|[^\n]+\|\s*\n\|[-:\s|]+\|\s*\n(?:\|[^\n]+\|\s*\n?)*/g, '').trim();
      }
      finalResponseText = finalResponseText
        .replace(/!\[.*?\]\(\/uploads\/[^\)]+\)/gi, '')
        .replace(/\[.*?\]\(\/uploads\/[^\)]+\)/gi, '')
        .replace(/\/uploads\/[a-zA-Z0-9_.-]+/gi, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    }

    // 2. Transition status to typing with collected sources attached
    this.io.emit('jamesStatus', {
      alias: 'James',
      status: 'typing',
      text: 'James is drafting a response...',
      sources: collectedSources
    });

    // Broadcast response immediately with 0 artificial delay for maximum speed
    this.broadcastMessage(finalResponseText, {
      id: msg.id,
      alias: msg.alias,
      color: msg.color,
      text: msg.text,
      fileName: msg.fileName,
      fileType: msg.fileType
    }, collectedSources, capturedAttachment);
  }

  /**
   * Execute AI Loop with support for tool calls and source aggregation.
   */
  async executeAILoop(messages, maxTurns = 2) {
    const allTools = this.toolRegistry.getDefinitions();
    const actionToolNames = new Set([
      'web_search',
      'web_fetch',
      'generate_image',
      'generate_pdf',
      'calculate',
      'get_weather',
      'get_world_news',
      'get_crypto_prices',
      'inspect_github_repo',
      'get_wiki_summary',
      'generate_qr_code',
      'run_code',
      'generate_voice',
      'create_poll',
      'set_reminder',
      'start_trivia',
      'roll_dice',
      'flip_coin',
      'analyze_file'
    ]);
    const tools = allTools.filter(t => actionToolNames.has(t.function?.name));

    let turns = 0;
    let didExecuteTools = false;
    const collectedSources = [];
    const seenDomains = new Set();
    let capturedAttachment = null;

    while (turns < maxTurns) {
      turns++;

      // If tools were already executed in the first turn, provide NO tools to guarantee final text synthesis!
      const availableTools = didExecuteTools ? [] : tools;
      const result = await this.aiProvider.chatCompletion(messages, availableTools);

      // 1. If tool calls requested by model (and tools were offered):
      if (result.toolCalls && result.toolCalls.length > 0 && availableTools.length > 0) {
        didExecuteTools = true;
        messages.push({
          role: 'assistant',
          content: result.content || '',
          tool_calls: result.toolCalls
        });

        // Execute all requested tool calls in parallel for ultra-fast concurrent processing
        const executedTools = await Promise.all(
          result.toolCalls.map(async (toolCall) => {
            const fnName = toolCall.function?.name;
            let parsedArgs = {};
            try {
              parsedArgs = JSON.parse(toolCall.function?.arguments || '{}');
            } catch (e) {
              parsedArgs = {};
            }

            if (fnName === 'web_search') {
              const query = parsedArgs.query || 'information';
              this.io.emit('jamesStatus', {
                alias: 'James',
                status: 'searching',
                text: `Searching the web for "${query}"...`,
                query,
                sources: collectedSources
              });
            } else if (fnName === 'web_fetch') {
              const url = parsedArgs.url || '';
              try {
                const u = new URL(url);
                const domain = u.hostname.replace(/^www\./, '');
                if (domain && !seenDomains.has(domain)) {
                  seenDomains.add(domain);
                  collectedSources.push({
                    title: domain,
                    url,
                    domain,
                    favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
                    snippet: 'Direct site fetch'
                  });
                }
              } catch (e) {}
              this.io.emit('jamesStatus', {
                alias: 'James',
                status: 'searching',
                text: `Visiting ${url}...`,
                sources: collectedSources
              });
            } else if (fnName === 'generate_image') {
              this.io.emit('jamesStatus', {
                alias: 'James',
                status: 'generating_image',
                generatingType: 'image',
                text: `Creating image: "${(parsedArgs.prompt || '').slice(0, 50)}..."`,
                prompt: parsedArgs.prompt
              });
            } else if (fnName === 'generate_pdf') {
              this.io.emit('jamesStatus', {
                alias: 'James',
                status: 'generating_pdf',
                generatingType: 'pdf',
                text: `Compiling PDF: "${parsedArgs.title || 'Document'}"...`,
                title: parsedArgs.title
              });
            } else if (fnName === 'generate_qr_code') {
              this.io.emit('jamesStatus', {
                alias: 'James',
                status: 'generating_qr',
                generatingType: 'qr',
                text: `Generating QR code matrix...`,
                textPayload: parsedArgs.text
              });
            } else if (fnName === 'get_weather') {
              this.io.emit('jamesStatus', {
                alias: 'James',
                status: 'searching',
                text: `Checking live weather conditions for ${parsedArgs.location}...`,
                sources: collectedSources
              });
            } else if (fnName === 'get_world_news') {
              this.io.emit('jamesStatus', {
                alias: 'James',
                status: 'searching',
                text: `Gathering verified worldwide news on ${parsedArgs.category || 'global headlines'}...`,
                sources: collectedSources
              });
            } else if (fnName === 'get_crypto_prices') {
              this.io.emit('jamesStatus', {
                alias: 'James',
                status: 'searching',
                text: `Fetching live cryptocurrency market rates...`,
                sources: collectedSources
              });
            } else if (fnName === 'inspect_github_repo') {
              this.io.emit('jamesStatus', {
                alias: 'James',
                status: 'searching',
                text: `Inspecting GitHub repository "${parsedArgs.repository}"...`,
                sources: collectedSources
              });
            } else if (fnName === 'get_wiki_summary') {
              this.io.emit('jamesStatus', {
                alias: 'James',
                status: 'searching',
                text: `Querying Wikipedia knowledge base for "${parsedArgs.topic}"...`,
                sources: collectedSources
              });
            } else if (fnName === 'generate_voice') {
              this.io.emit('jamesStatus', {
                alias: 'James',
                status: 'generating_voice',
                generatingType: 'voice',
                text: `Synthesizing voice audio note...`
              });
            } else if (fnName === 'run_code') {
              this.io.emit('jamesStatus', {
                alias: 'James',
                status: 'running_code',
                generatingType: 'code',
                text: `Executing code in isolated sandbox...`
              });
            } else if (fnName === 'create_poll') {
              this.io.emit('jamesStatus', {
                alias: 'James',
                status: 'creating_poll',
                generatingType: 'poll',
                text: `Creating community poll...`
              });
            } else if (fnName === 'analyze_file') {
              this.io.emit('jamesStatus', {
                alias: 'James',
                status: 'searching',
                text: `Analyzing uploaded file "${parsedArgs.filename}"...`
              });
            }

            console.log(`[JamesAgent]: Executing tool "${fnName}" with args:`, parsedArgs);
            const toolOutput = await this.toolRegistry.executeTool(fnName, parsedArgs);

            return { toolCall, fnName, parsedArgs, toolOutput };
          })
        );

        for (const { toolCall, fnName, toolOutput } of executedTools) {
          // Handle Attachment Extraction for generate_image, generate_pdf, generate_qr_code
          if (fnName === 'generate_image') {
            try {
              const parsed = JSON.parse(toolOutput);
              if (parsed.success && parsed.imageUrl) {
                capturedAttachment = {
                  imageUrl: parsed.imageUrl,
                  fileType: 'image/png',
                  allowDownload: true
                };
              }
            } catch (e) {}
          } else if (fnName === 'generate_pdf') {
            try {
              const parsed = JSON.parse(toolOutput);
              if (parsed.success && parsed.fileUrl) {
                capturedAttachment = {
                  fileUrl: parsed.fileUrl,
                  fileName: parsed.filename,
                  fileSize: parsed.fileSize,
                  fileType: 'application/pdf',
                  allowDownload: true
                };
              }
            } catch (e) {}
          } else if (fnName === 'generate_qr_code') {
            try {
              const parsed = JSON.parse(toolOutput);
              if (parsed.success && parsed.imageUrl) {
                capturedAttachment = {
                  imageUrl: parsed.imageUrl,
                  fileType: 'image/png',
                  allowDownload: true
                };
              }
            } catch (e) {}
          } else if (fnName === 'generate_voice') {
            try {
              const parsed = JSON.parse(toolOutput);
              if (parsed.success && parsed.audioUrl) {
                capturedAttachment = {
                  audioUrl: parsed.audioUrl,
                  audioFilename: parsed.filename,
                  fileType: 'audio/mpeg',
                  allowDownload: true
                };
              }
            } catch (e) {}
          } else if (fnName === 'create_poll') {
            try {
              const parsed = JSON.parse(toolOutput);
              if (parsed.success && parsed.poll) {
                capturedAttachment = {
                  poll: parsed.poll,
                  fileType: 'application/x-poll'
                };
              }
            } catch (e) {}
          } else if (fnName === 'run_code') {
            try {
              const parsed = JSON.parse(toolOutput);
              capturedAttachment = {
                codeExecution: parsed,
                fileType: 'application/x-code-result'
              };
            } catch (e) {}
          } else if (fnName === 'get_weather') {
            try {
              const parsed = JSON.parse(toolOutput);
              if (parsed.success && parsed.weatherCard) {
                capturedAttachment = {
                  ...(capturedAttachment || {}),
                  weatherCard: parsed.weatherCard,
                  fileType: 'application/x-weather-card'
                };
              }
            } catch (e) {}
          } else if (fnName === 'get_world_news') {
            try {
              const parsed = JSON.parse(toolOutput);
              if (parsed.success && parsed.newsCard) {
                capturedAttachment = {
                  ...(capturedAttachment || {}),
                  newsCard: parsed.newsCard,
                  fileType: 'application/x-news-card'
                };
              }
            } catch (e) {}
          } else if (fnName === 'get_crypto_prices') {
            try {
              const parsed = JSON.parse(toolOutput);
              if (parsed.success && parsed.cryptoCard) {
                capturedAttachment = {
                  ...(capturedAttachment || {}),
                  cryptoCard: parsed.cryptoCard,
                  fileType: 'application/x-crypto-card'
                };
              }
            } catch (e) {}
          } else if (fnName === 'inspect_github_repo') {
            try {
              const parsed = JSON.parse(toolOutput);
              if (parsed.success && parsed.repoCard) {
                capturedAttachment = {
                  ...(capturedAttachment || {}),
                  repoCard: parsed.repoCard,
                  fileType: 'application/x-repo-card'
                };
              }
            } catch (e) {}
          } else if (fnName === 'get_wiki_summary') {
            try {
              const parsed = JSON.parse(toolOutput);
              if (parsed.success && parsed.wikiCard) {
                capturedAttachment = {
                  ...(capturedAttachment || {}),
                  wikiCard: parsed.wikiCard,
                  fileType: 'application/x-wiki-card'
                };
              }
            } catch (e) {}
          }

          // Extract web sources for ChatGPT-style source badges (deduplicated by domain)
          if (fnName === 'web_search') {
            try {
              const parsed = JSON.parse(toolOutput);
              if (Array.isArray(parsed.results)) {
                for (const item of parsed.results) {
                  if (item.url) {
                    try {
                      const u = new URL(item.url);
                      const domain = u.hostname.replace(/^www\./, '');
                      if (domain && !seenDomains.has(domain)) {
                        seenDomains.add(domain);
                        const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
                        collectedSources.push({
                          title: item.title || domain,
                          url: item.url,
                          domain,
                          favicon,
                          snippet: item.snippet || ''
                        });
                      }
                    } catch (urlErr) {}
                  }
                }
              }
            } catch (pErr) {}

            if (collectedSources.length > 0) {
              this.io.emit('jamesStatus', {
                alias: 'James',
                status: 'searching',
                text: `Visited ${collectedSources.length} web sources...`,
                sources: collectedSources
              });
            }
          }

          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            name: fnName,
            content: toolOutput
          });
        }

        // Add explicit synthesis prompt so reasoner models formulate the final response directly into content
        messages.push({
          role: 'user',
          content: 'Synthesize the final answer for the user based on the tool results above. Format cleanly with markdown (tables/code blocks/lists if requested). CRITICAL: If an image, QR code, or PDF was generated, DO NOT write any markdown image links, file paths, or /uploads/... URLs in your text because the chat already displays the media card. If a poll was created, DO NOT output any markdown tables of the poll or options in your text (the interactive poll widget displays automatically in the UI). Simply present what you created in warm, friendly words. Provide the complete final response now.'
        });

        continue;
      }

      // 2. If regular text response returned:
      if (result.content && result.content.trim()) {
        return { content: result.content.trim(), sources: collectedSources, attachment: capturedAttachment };
      }

      break;
    }

    // Safety fallback: If loop completed without text, make one final call with tools disabled
    try {
      const finalSynthesis = await this.aiProvider.chatCompletion(messages, []);
      if (finalSynthesis && finalSynthesis.content && finalSynthesis.content.trim()) {
        return { content: finalSynthesis.content.trim(), sources: collectedSources, attachment: capturedAttachment };
      }
    } catch (e) {
      console.warn('[JamesAgent]: Final synthesis attempt failed:', e.message);
    }

    return { content: null, sources: collectedSources, attachment: capturedAttachment };
  }

  // --- Spontaneous Activity & Periodic Verified News ---

  async broadcastPeriodicWorldNews(forceCategory = null) {
    try {
      const categories = ['geopolitics', 'tech', 'healthcare', 'science', 'finance', 'world'];
      const cat = forceCategory || categories[Math.floor(Math.random() * categories.length)];
      const res = await this.toolRegistry.freeTools.getVerifiedNews(cat);
      if (res && res.newsCard) {
        const card = res.newsCard;
        const msgText = `${card.categoryTag} **${card.headline}**\n\n${card.summary}`;
        this.broadcastMessage(msgText, null, [{
          title: card.source,
          url: card.sourceUrl,
          domain: card.source
        }], {
          newsCard: card,
          fileType: 'application/x-news-card'
        });
        console.log(`[JamesAgent]: Broadcasted verified world news: ${card.categoryTag} - ${card.headline.slice(0, 40)}...`);
        return true;
      }
    } catch (err) {
      console.error('[JamesAgent]: Failed to broadcast world news:', err.message);
    }
    return false;
  }

  startSpontaneousActivity() {
    const CHECK_INTERVAL = 20 * 60 * 1000; // Check every 20 minutes
    let counter = 0;

    this.spontaneousTimer = setInterval(async () => {
      counter++;
      if (this.socialAwareness.canInitiateSpontaneous()) {
        const state = this.socialAwareness.getSocialState();

        // Every other spontaneous cycle (approx every 40-60 mins), broadcast verified worldwide news
        if (counter % 2 === 0) {
          const newsBroadcasted = await this.broadcastPeriodicWorldNews();
          if (newsBroadcasted) return;
        }

        if (state.mode === 'COMPANION') {
          const companionChimes = [
            `Hey, just checking in—how's the project coming along? 💻`,
            `Taking a quick stretch break. Let me know if you run into any tricky bugs or questions today!`,
            `Quiet day in the room! Feel free to bounce any ideas or code snippets off me if you're experimenting with anything new.`
          ];
          const chime = companionChimes[Math.floor(Math.random() * companionChimes.length)];
          this.broadcastMessage(chime);
        } else if (state.mode === 'PARTICIPANT') {
          const chimes = [
            `Hope everyone's having a productive session today! Anyone working on anything interesting? 🚀`,
            `Quick coffee break. If anyone needs another pair of eyes on architecture or code, let me know! ☕`
          ];
          const chime = chimes[Math.floor(Math.random() * chimes.length)];
          this.broadcastMessage(chime);
        }
      }
    }, CHECK_INTERVAL);
  }
}

module.exports = { JamesAgent, JAMES_PROFILE };
