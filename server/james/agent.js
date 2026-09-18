/**
 * James AI — ShadowTalk Autonomous Community Agent
 * Core agent orchestrator tying together AI providers, tools, memory,
 * social awareness, moderation, and decision engines.
 */

const { createAIProvider, FallbackProvider } = require('./aiProvider');
const { ToolRegistry } = require('./tools');
const { WebResearch } = require('./webResearch');
const { MemoryService } = require('./memory');
const { SocialAwareness } = require('./social');
const { ModerationEngine } = require('./moderation');
const { DecisionEngine } = require('./decisionEngine');

// Stylized portrait SVG for James
const JAMES_AVATAR_SVG = `data:image/svg+xml;utf8,<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bgG" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%230f1b29"/><stop offset="100%" stop-color="%23070c14"/></linearGradient><linearGradient id="skG" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23f5d0b0"/><stop offset="100%" stop-color="%23e0a985"/></linearGradient><linearGradient id="hrG" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%232b3445"/><stop offset="100%" stop-color="%23171d27"/></linearGradient><linearGradient id="jkG" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%231e293b"/><stop offset="100%" stop-color="%230f172a"/></linearGradient></defs><circle cx="60" cy="60" r="58" fill="url(%23bgG)" stroke="%2300f3ff" stroke-width="2.5"/><path d="M22 118 C22 92, 40 84, 60 84 C80 84, 98 92, 98 118 Z" fill="url(%23jkG)" stroke="%23334155" stroke-width="1.5"/><path d="M48 84 L60 102 L72 84 Z" fill="%230f172a"/><line x1="38" y1="94" x2="52" y2="84" stroke="%2300f3ff" stroke-width="2" stroke-linecap="round"/><line x1="82" y1="94" x2="68" y2="84" stroke="%2300f3ff" stroke-width="2" stroke-linecap="round"/><rect x="52" y="70" width="16" height="18" rx="4" fill="url(%23skG)"/><ellipse cx="60" cy="54" rx="20" ry="24" fill="url(%23skG)"/><ellipse cx="53" cy="52" rx="2.5" ry="3" fill="%231e293b"/><ellipse cx="67" cy="52" rx="2.5" ry="3" fill="%231e293b"/><circle cx="54" cy="51" r="0.8" fill="%23ffffff"/><circle cx="68" cy="51" r="0.8" fill="%23ffffff"/><path d="M48 46 Q53 44 57 46" stroke="%231a202c" stroke-width="1.8" stroke-linecap="round" fill="none"/><path d="M63 46 Q67 44 72 46" stroke="%231a202c" stroke-width="1.8" stroke-linecap="round" fill="none"/><path d="M60 54 L58 60 L61 60" stroke="%23cf9563" stroke-width="1.4" stroke-linecap="round" fill="none"/><path d="M54 66 Q60 70 66 66" stroke="%23bc7444" stroke-width="1.8" stroke-linecap="round" fill="none"/><path d="M38 48 C36 30, 48 20, 64 20 C78 20, 84 28, 83 42 C80 34, 74 30, 64 30 C54 30, 44 36, 40 48 Z" fill="url(%23hrG)"/><path d="M38 44 C38 34, 46 26, 58 24 C72 22, 82 28, 84 38 C76 32, 66 30, 54 32 C46 34, 40 40, 38 44 Z" fill="%234a5568"/><circle cx="39" cy="56" r="3.5" fill="%23f5d0b0"/><circle cx="81" cy="56" r="3.5" fill="%23f5d0b0"/></svg>`;

const JAMES_PROFILE = {
  alias: 'James',
  userId: 'bot_james',
  color: '#00f3ff',
  avatar: JAMES_AVATAR_SVG,
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

    // 1. Initialize Subsystems
    this.webResearch = new WebResearch();
    this.memoryService = new MemoryService();
    this.socialAwareness = new SocialAwareness(this.getUserCount);
    this.moderationEngine = new ModerationEngine();

    this.toolRegistry = new ToolRegistry({
      webResearch: this.webResearch,
      memoryService: this.memoryService,
      socialAwareness: this.socialAwareness,
      moderationEngine: this.moderationEngine,
      getOnlineUsersList: this.getOnlineUsersList
    });

    this.decisionEngine = new DecisionEngine({
      socialAwareness: this.socialAwareness,
      moderationEngine: this.moderationEngine
    });

    this.aiProvider = createAIProvider(options.aiConfig || {});
    this.fallbackProvider = new FallbackProvider();

    // Welcome and activity tracking
    this.welcomedUsers = new Set();
    this.welcomedSockets = new Set();
    this.lastWelcomeTime = 0;
    this.spontaneousTimer = null;
    this.isProcessing = false;

    this.startSpontaneousActivity();
    console.log('[JamesAgent]: Autonomous Community Agent initialized with provider:', this.aiProvider.constructor.name);
  }

  // --- Natural User Welcoming ---

  welcomeUser(alias, socketId = null, userId = null) {
    if (!alias) return;
    const cleanAlias = alias.trim().toLowerCase();

    // Ignore bot itself or invalid aliases
    if (cleanAlias === 'james' || cleanAlias === 'bot_james' || cleanAlias.length < 3) {
      return;
    }

    // Only welcome socket once
    if (socketId && this.welcomedSockets.has(socketId)) {
      return;
    }

    // Only welcome username once per server lifetime
    if (this.welcomedUsers.has(cleanAlias)) {
      return;
    }

    // Cooldown: at least 40s between welcomes to prevent greeting bursts
    const now = Date.now();
    if (now - this.lastWelcomeTime < 40000) {
      return;
    }

    this.welcomedUsers.add(cleanAlias);
    if (socketId) this.welcomedSockets.add(socketId);
    this.lastWelcomeTime = now;

    // Natural human community greetings
    const socialState = this.socialAwareness.getSocialState();
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
      id: Date.now() + Math.random(),
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
    // If the user sends rapid successive messages, debounce and combine
    this.decisionEngine.debounceMessage(msg, (debouncedMsg) => {
      this.processMessageToAI(debouncedMsg, decision.isDirect);
    });
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

CRITICAL CONVERSATION & ANSWERING RULES:
- ALWAYS read the recent conversation history carefully. If the user asks a follow-up question (e.g. "give me that list of names", "summarize that", "what did it say?"), directly and accurately answer their specific question based on prior messages or site data.
- NEVER repeatedly ask "What are you going to build?", "What are you building next?", or "Working on any cool projects?". Speak naturally, answer the question asked, and let the conversation develop organically.
- Keep responses sharp, direct, concise, and helpful (1 to 3 sentences for normal questions, or exact requested lists/tables/code).
- If the user asks for a list, names, or code, provide the exact list, names, or code snippet without hesitation.
- When sharing code, always output clean code inside markdown triple backticks with the language tag (e.g. \`\`\`python ... \`\`\`).

CRITICAL FORMATTING & TABLE RULES:
- When the user asks for a table (e.g., list of prime ministers, comparative data, schedules), ALWAYS output a clean markdown table using | Header | Header | format.
- When asked for an extensive world list (e.g., all prime ministers on Earth), provide a curated, high-quality table of 15 to 25 major countries across all continents with S.No, Name, Country, and Party, and let the user know they can ask for more countries or specific regions.
- NEVER leave the final message content empty or hidden in internal reasoning.

CRITICAL FREE TOOLS CAPABILITY (100% FREE):
- You have access to powerful, 100% free autonomous tools:
  * generate_image: Generate high-quality digital artwork or photos when asked to draw, generate image, create visual art, or make a wallpaper.
  * generate_pdf: Create and format a downloadable PDF document with title and content when asked to make a PDF, export to PDF, or generate a document.
  * calculate: Compute math expressions accurately.
  * get_weather: Fetch live weather conditions for any city.
  * generate_qr_code: Generate a downloadable QR code image.
  * web_search & web_fetch: Live web research and page reading.

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

    // Append latest prompt if not already in history
    const userPromptContent = msg.replyTo
      ? `[In reply to @${msg.replyTo.alias}: "${(msg.replyTo.text || '').substring(0, 120)}"] [@${sender}]: ${text}`
      : `[@${sender}]: ${text}`;

    if (!messages.some(m => m.content.includes(text))) {
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
      if (capturedAttachment?.fileUrl) {
        finalResponseText = `Hey @${sender}, I've created your PDF document! You can download and view it directly below.`;
      } else if (capturedAttachment?.imageUrl) {
        finalResponseText = `Hey @${sender}, here is the image I generated for you!`;
      } else if (collectedSources.length > 0) {
        finalResponseText = `Hey @${sender}, I searched through ${collectedSources.length} sources on this. Let me know if you want me to expand on any specific part!`;
      } else {
        finalResponseText = `Hey @${sender}, I hear you! Let me know if you need any more details on that.`;
      }
    }

    // 2. Transition status to typing with collected sources attached
    this.io.emit('jamesStatus', {
      alias: 'James',
      status: 'typing',
      text: 'James is drafting a response...',
      sources: collectedSources
    });

    // Dynamic natural typing delay
    const wordsCount = finalResponseText.split(/\s+/).length;
    const typingDuration = Math.min(Math.max(600, wordsCount * 20), 1500);

    setTimeout(() => {
      this.broadcastMessage(finalResponseText, {
        id: msg.id,
        alias: msg.alias,
        color: msg.color,
        text: msg.text,
        fileName: msg.fileName,
        fileType: msg.fileType
      }, collectedSources, capturedAttachment);
    }, typingDuration);
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
      'generate_qr_code'
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

        for (const toolCall of result.toolCalls) {
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
              status: 'typing',
              text: `Synthesizing creative image: "${(parsedArgs.prompt || '').slice(0, 40)}..."`,
              sources: collectedSources
            });
          } else if (fnName === 'generate_pdf') {
            this.io.emit('jamesStatus', {
              alias: 'James',
              status: 'typing',
              text: `Compiling downloadable PDF document: "${parsedArgs.title || 'Document'}"...`,
              sources: collectedSources
            });
          } else if (fnName === 'get_weather') {
            this.io.emit('jamesStatus', {
              alias: 'James',
              status: 'searching',
              text: `Checking live weather conditions for ${parsedArgs.location}...`,
              sources: collectedSources
            });
          }

          console.log(`[JamesAgent]: Executing tool "${fnName}" with args:`, parsedArgs);
          const toolOutput = await this.toolRegistry.executeTool(fnName, parsedArgs);

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
          content: 'Synthesize the final answer for the user based on the tool results above. Format the final output cleanly with markdown (tables/code blocks/lists if requested). Provide the complete final response now.'
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

  // --- Spontaneous Activity ---

  startSpontaneousActivity() {
    const CHECK_INTERVAL = 15 * 60 * 1000; // Check every 15 minutes
    this.spontaneousTimer = setInterval(async () => {
      if (this.socialAwareness.canInitiateSpontaneous()) {
        const state = this.socialAwareness.getSocialState();
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
