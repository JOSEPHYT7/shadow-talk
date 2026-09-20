/**
 * Tool Registry for James Agent.
 * Exposes safe, allowlisted tools to LLM function calling.
 */

const { FreeToolsService } = require('./freeTools');

class ToolRegistry {
  constructor(dependencies = {}) {
    this.webResearch = dependencies.webResearch;
    this.memoryService = dependencies.memoryService;
    this.socialAwareness = dependencies.socialAwareness;
    this.moderationEngine = dependencies.moderationEngine;
    this.freeTools = dependencies.freeTools || new FreeToolsService();
    this.getOnlineUsersList = dependencies.getOnlineUsersList || (() => []);
    this.onPollCreated = dependencies.onPollCreated || (() => {});
    this.onReminderSet = dependencies.onReminderSet || (() => {});
  }

  /**
   * OpenAI-compatible tool specifications.
   */
  getDefinitions() {
    return [
      {
        type: 'function',
        function: {
          name: 'web_search',
          description: 'Search the live web for up-to-date information, current news, live facts, software docs, and recent events. Use whenever your knowledge may be outdated or unconfirmed.',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'The search query to look up on the internet.'
              }
            },
            required: ['query']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'web_fetch',
          description: 'Fetch and read the text content of a specific web page or documentation link.',
          parameters: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'The full URL (including https://) to retrieve.'
              }
            },
            required: ['url']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'generate_image',
          description: 'Generate an AI digital image or art from a creative prompt using free AI synthesis. Use whenever the user asks to draw, generate an image, make a picture, visual art, or wallpaper.',
          parameters: {
            type: 'object',
            properties: {
              prompt: {
                type: 'string',
                description: 'Detailed description of the image to generate (e.g. "futuristic cyber city with neon lights and flying cars").'
              }
            },
            required: ['prompt']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'generate_pdf',
          description: 'Create and format a downloadable PDF document with a title, formatted text, tables, or lists. Use whenever the user asks to create a PDF, export to PDF, or make a printable document.',
          parameters: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: 'The title of the PDF document.'
              },
              content: {
                type: 'string',
                description: 'The full document content (supports headings starting with #, bullet points with -, and table rows with |).'
              },
              filename: {
                type: 'string',
                description: 'Desired filename without extension (e.g. "prime_ministers_list").'
              }
            },
            required: ['title', 'content']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'calculate',
          description: 'Evaluate a mathematical expression or calculation accurately (arithmetic, percentages, powers, square roots, geometry).',
          parameters: {
            type: 'object',
            properties: {
              expression: {
                type: 'string',
                description: 'Mathematical expression to compute (e.g. "sqrt(144) * 15 - 20").'
              }
            },
            required: ['expression']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'get_weather',
          description: 'Retrieve live weather forecast and conditions (temperature, humidity, wind) for any city or location in the world.',
          parameters: {
            type: 'object',
            properties: {
              location: {
                type: 'string',
                description: 'Name of the city, region, or country (e.g. "London", "Tokyo", "New York").'
              }
            },
            required: ['location']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'generate_qr_code',
          description: 'Generate a downloadable QR code image for a URL, link, or text message.',
          parameters: {
            type: 'object',
            properties: {
              text: {
                type: 'string',
                description: 'The text or URL to encode into the QR code.'
              }
            },
            required: ['text']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'get_site_state',
          description: 'Check the real-time community activity, online user count, room quietness, and conversation state.',
          parameters: {
            type: 'object',
            properties: {}
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'get_online_users',
          description: 'Get a list of currently active human users in the room.',
          parameters: {
            type: 'object',
            properties: {}
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'get_recent_messages',
          description: 'Retrieve the last N messages from the ShadowTalk room conversation history to understand context.',
          parameters: {
            type: 'object',
            properties: {
              count: {
                type: 'integer',
                description: 'Number of recent messages to fetch (default 10, max 25).'
              }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'get_user_context',
          description: 'Retrieve stored notes, topics, or history about a specific user.',
          parameters: {
            type: 'object',
            properties: {
              user_id_or_alias: {
                type: 'string',
                description: 'The username or userId of the user to look up.'
              }
            },
            required: ['user_id_or_alias']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'save_memory',
          description: 'Store a useful, non-sensitive note about a user (e.g. what project they are building, their technical stack, their preferences). Do NOT store sensitive private data.',
          parameters: {
            type: 'object',
            properties: {
              user_id_or_alias: {
                type: 'string',
                description: 'The username or userId of the user.'
              },
              note: {
                type: 'string',
                description: 'The fact or project note to remember about this user.'
              }
            },
            required: ['user_id_or_alias', 'note']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'warn_user',
          description: 'Issue an official moderation warning to a user for spamming, harassment, or abusive conduct.',
          parameters: {
            type: 'object',
            properties: {
              user_id_or_alias: {
                type: 'string',
                description: 'The username or userId of the target user.'
              },
              reason: {
                type: 'string',
                description: 'The clear and specific reason for the warning.'
              }
            },
            required: ['user_id_or_alias', 'reason']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'flag_user',
          description: 'Flag a user for moderator review due to repeated violations or severe abuse.',
          parameters: {
            type: 'object',
            properties: {
              user_id_or_alias: {
                type: 'string',
                description: 'The username or userId of the target user.'
              },
              reason: {
                type: 'string',
                description: 'Reason for flagging.'
              }
            },
            required: ['user_id_or_alias', 'reason']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'run_code',
          description: 'Safely execute a JavaScript code snippet in an isolated sandbox and return console logs and evaluated result. Use when asked to test, run, evaluate, or debug JavaScript code, algorithms, or regular expressions.',
          parameters: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description: 'The JavaScript code snippet to execute.'
              },
              language: {
                type: 'string',
                description: 'Programming language (default: "javascript").'
              }
            },
            required: ['code']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'generate_voice',
          description: 'Generate a playable audio voice note for a spoken message or text. Use when the user asks you to say something out loud, speak, generate an audio note, or send a voice message.',
          parameters: {
            type: 'object',
            properties: {
              text: {
                type: 'string',
                description: 'The text message to synthesize into spoken audio (up to 300 characters).'
              }
            },
            required: ['text']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'create_poll',
          description: 'Create an interactive community poll in the room with a question and 2 to 6 multiple choice options. Use when users ask to make a poll, vote on something, or when a fun group decision is needed.',
          parameters: {
            type: 'object',
            properties: {
              question: {
                type: 'string',
                description: 'The question for the community poll.'
              },
              options: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of 2 to 6 choice options for users to vote on.'
              }
            },
            required: ['question', 'options']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'set_reminder',
          description: 'Set a timed reminder or timer for a user. Use when a user asks to be reminded of something after a certain amount of time (e.g. "remind me in 10 minutes to take a break").',
          parameters: {
            type: 'object',
            properties: {
              user_id_or_alias: {
                type: 'string',
                description: 'The username or alias to ping when the reminder triggers.'
              },
              reminder_text: {
                type: 'string',
                description: 'What the user wants to be reminded of.'
              },
              seconds: {
                type: 'number',
                description: 'Number of seconds from now when the reminder should fire (e.g. 60 for 1 min, 600 for 10 min).'
              }
            },
            required: ['user_id_or_alias', 'reminder_text', 'seconds']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'start_trivia',
          description: 'Launch a developer or tech trivia question for the room. Use when users ask for trivia, a quiz, or a fun challenge.',
          parameters: {
            type: 'object',
            properties: {
              topic: {
                type: 'string',
                description: 'Topic for trivia (e.g. "javascript", "general", "git", "web").'
              }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'roll_dice',
          description: 'Roll one or more dice with a specified number of sides (e.g., d6, d20, d100). Use for games, random selections, or when asked to roll dice.',
          parameters: {
            type: 'object',
            properties: {
              sides: {
                type: 'number',
                description: 'Number of sides per die (e.g. 6 for standard d6, 20 for d20). Default 6.'
              },
              count: {
                type: 'number',
                description: 'Number of dice to roll (1 to 10). Default 1.'
              }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'flip_coin',
          description: 'Flip a coin (Heads or Tails). Use for coin tosses, coin flips, or 50/50 decisions.',
          parameters: {
            type: 'object',
            properties: {
              count: {
                type: 'number',
                description: 'Number of coins to flip (1 to 10). Default 1.'
              }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'analyze_file',
          description: 'Read and inspect an uploaded document or code file from the room uploads. Use when a user asks to summarize, inspect, or explain a file they uploaded.',
          parameters: {
            type: 'object',
            properties: {
              filename: {
                type: 'string',
                description: 'Filename of the uploaded file to read from uploads directory.'
              }
            },
            required: ['filename']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'summarize_chat',
          description: 'Summarize recent room messages, topics, and discussions. Use when someone asks "what did I miss?", "summarize the chat", or asks for a recap of recent conversation.',
          parameters: {
            type: 'object',
            properties: {
              limit: {
                type: 'number',
                description: 'Number of recent messages to analyze (default 20, max 50).'
              }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'translate_text',
          description: 'Translate text from one language to another. Use whenever the user asks to translate a sentence, word, or paragraph into another language (e.g. Spanish, French, German, Japanese, Hindi, etc.).',
          parameters: {
            type: 'object',
            properties: {
              text: {
                type: 'string',
                description: 'The text to translate.'
              },
              target_language: {
                type: 'string',
                description: 'Target language code or name (e.g. "es" or "Spanish", "fr" or "French", "ja" or "Japanese", "de" or "German", "hi" or "Hindi").'
              }
            },
            required: ['text', 'target_language']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'explain_code',
          description: 'Analyze, explain, and break down a code snippet with time/space complexity analysis (Big-O) and potential edge cases.',
          parameters: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description: 'The code snippet to explain.'
              },
              language: {
                type: 'string',
                description: 'The programming language of the code (e.g. javascript, python, rust, go, c++).'
              }
            },
            required: ['code']
          }
        }
      }
    ];
  }

  /**
   * Execute a requested tool call safely on the server.
   * @param {string} name - Name of the tool.
   * @param {object} args - Parsed argument object.
   * @returns {Promise<string>} JSON string result to return to the model.
   */
  async executeTool(name, args = {}) {
    try {
      switch (name) {
        case 'web_search': {
          const query = args.query || '';
          if (!this.webResearch) {
            return JSON.stringify({ error: 'Web research service is unavailable.' });
          }
          const results = await this.webResearch.search(query, 5);
          return JSON.stringify({
            query,
            resultCount: results.length,
            results: results.length > 0 ? results : 'No results found on the web.'
          });
        }

        case 'web_fetch': {
          const url = args.url || '';
          if (!this.webResearch) {
            return JSON.stringify({ error: 'Web fetch service is unavailable.' });
          }
          const data = await this.webResearch.fetchUrl(url, 2500);
          return JSON.stringify(data);
        }

        case 'generate_image': {
          const prompt = args.prompt || '';
          if (!this.freeTools) {
            return JSON.stringify({ error: 'Free tools service unavailable.' });
          }
          const result = await this.freeTools.generateImage(prompt);
          return JSON.stringify(result);
        }

        case 'generate_pdf': {
          const title = args.title || 'Document';
          const content = args.content || '';
          const filename = args.filename || '';
          if (!this.freeTools) {
            return JSON.stringify({ error: 'Free tools service unavailable.' });
          }
          const result = await this.freeTools.generatePdf(title, content, filename);
          return JSON.stringify(result);
        }

        case 'calculate': {
          const expression = args.expression || '';
          if (!this.freeTools) {
            return JSON.stringify({ error: 'Free tools service unavailable.' });
          }
          const result = this.freeTools.calculate(expression);
          return JSON.stringify(result);
        }

        case 'get_weather': {
          const location = args.location || '';
          if (!this.freeTools) {
            return JSON.stringify({ error: 'Free tools service unavailable.' });
          }
          const result = await this.freeTools.getWeather(location);
          return JSON.stringify(result);
        }

        case 'generate_qr_code': {
          const text = args.text || '';
          if (!this.freeTools) {
            return JSON.stringify({ error: 'Free tools service unavailable.' });
          }
          const result = await this.freeTools.generateQrCode(text);
          return JSON.stringify(result);
        }

        case 'get_site_state': {
          if (!this.socialAwareness) {
            return JSON.stringify({ error: 'Social awareness service unavailable.' });
          }
          const state = this.socialAwareness.getSocialState();
          return JSON.stringify({
            onlineUsers: state.userCount,
            mode: state.mode,
            quietSeconds: state.quietSeconds,
            messageVelocity: state.velocity,
            jamesQuietSeconds: state.jamesQuietSeconds
          });
        }

        case 'get_online_users': {
          const users = typeof this.getOnlineUsersList === 'function' ? this.getOnlineUsersList() : [];
          return JSON.stringify({
            count: users.length,
            users: users.map(u => ({
              alias: u.alias,
              status: u.status || 'Online',
              isVerified: !!u.isVerified
            }))
          });
        }

        case 'get_recent_messages': {
          if (!this.memoryService) {
            return JSON.stringify({ error: 'Memory service unavailable.' });
          }
          const count = Math.min(Math.max(args.count || 10, 1), 25);
          const msgs = this.memoryService.getRecentMessages(count);
          return JSON.stringify(msgs.map(m => ({
            sender: m.sender,
            text: m.text,
            isJames: m.isJames,
            timeAgoSeconds: Math.floor((Date.now() - m.timestamp) / 1000)
          })));
        }

        case 'get_user_context': {
          const target = args.user_id_or_alias;
          if (!this.memoryService || !target) {
            return JSON.stringify({ error: 'Missing target user or memory service unavailable.' });
          }
          const mem = this.memoryService.getUserMemory(target, target);
          if (!mem) {
            return JSON.stringify({ status: 'No previous memory record found for this user.' });
          }
          return JSON.stringify({
            alias: mem.alias,
            interactionCount: mem.count,
            notes: mem.notes,
            topics: mem.topics
          });
        }

        case 'save_memory': {
          const target = args.user_id_or_alias;
          const note = args.note;
          if (!this.memoryService || !target || !note) {
            return JSON.stringify({ error: 'Missing target user, note, or memory service.' });
          }
          const saved = this.memoryService.saveUserNote(target, target, note);
          return JSON.stringify({
            status: saved ? 'Memory saved successfully.' : 'Note already preserved.'
          });
        }

        case 'warn_user': {
          const target = args.user_id_or_alias;
          const reason = args.reason;
          if (!this.moderationEngine) {
            return JSON.stringify({ error: 'Moderation engine unavailable.' });
          }
          const res = this.moderationEngine.warnUser(target, reason);
          return JSON.stringify(res);
        }

        case 'flag_user': {
          const target = args.user_id_or_alias;
          const reason = args.reason;
          if (!this.moderationEngine) {
            return JSON.stringify({ error: 'Moderation engine unavailable.' });
          }
          const res = this.moderationEngine.flagUser(target, reason);
          return JSON.stringify(res);
        }

        case 'run_code': {
          const code = args.code || '';
          const language = args.language || 'javascript';
          if (!this.freeTools) {
            return JSON.stringify({ error: 'Free tools service unavailable.' });
          }
          const result = await this.freeTools.runCode(language, code);
          return JSON.stringify(result);
        }

        case 'generate_voice': {
          const text = args.text || '';
          if (!this.freeTools) {
            return JSON.stringify({ error: 'Free tools service unavailable.' });
          }
          const result = await this.freeTools.generateVoice(text);
          return JSON.stringify(result);
        }

        case 'create_poll': {
          let question = (args.question || 'Community Poll').trim();
          let rawOptions = Array.isArray(args.options) ? args.options.map(o => String(o).trim()).filter(Boolean) : null;

          // If options is missing, empty, or defaulted to ['Yes', 'No'] while question has "or" / "vs":
          const isGenericYesNo = rawOptions && rawOptions.length === 2 &&
            rawOptions[0].toLowerCase() === 'yes' && rawOptions[1].toLowerCase() === 'no';

          if (!rawOptions || rawOptions.length < 2 || isGenericYesNo) {
            const orMatch = question.match(/(.*?)\s+(?:or|vs\.?)\s+(.*)/i);
            if (orMatch) {
              const opt1 = orMatch[1].replace(/^(?:should\s+we\s+|is\s+it\s+|do\s+you\s+prefer\s+|poll:\s*)/i, '').replace(/^[^\w]+|[^\w]+$/g, '').trim();
              const opt2 = orMatch[2].replace(/[?.,!]+$/g, '').trim();
              if (opt1 && opt2) {
                rawOptions = [opt1, opt2];
              }
            }
          }

          const options = (rawOptions && rawOptions.length >= 2) ? rawOptions : ['Yes', 'No'];
          const pollId = 'poll_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
          const pollData = {
            id: pollId,
            question: question,
            options: options.map(opt => ({ text: String(opt).trim(), votes: 0 })),
            totalVotes: 0,
            voters: {},
            createdAt: Date.now()
          };
          if (typeof this.onPollCreated === 'function') {
            this.onPollCreated(pollData);
          }
          return JSON.stringify({
            success: true,
            poll: pollData,
            message: `Poll created: "${question}" with options: ${options.join(', ')}.`
          });
        }

        case 'set_reminder': {
          const target = args.user_id_or_alias || 'User';
          const reminderText = args.reminder_text || 'Reminder';
          const seconds = Math.min(Math.max(parseInt(args.seconds) || 60, 5), 86400); // 5s to 24h
          if (typeof this.onReminderSet === 'function') {
            this.onReminderSet(target, reminderText, seconds);
          }
          return JSON.stringify({
            success: true,
            user: target,
            reminder: reminderText,
            seconds,
            firesAt: new Date(Date.now() + seconds * 1000).toLocaleTimeString()
          });
        }

        case 'start_trivia': {
          const topic = args.topic || 'general';
          if (!this.freeTools) {
            return JSON.stringify({ error: 'Free tools service unavailable.' });
          }
          const question = this.freeTools.getTriviaQuestion(topic);
          return JSON.stringify(question);
        }

        case 'roll_dice': {
          const sides = args.sides || 6;
          const count = args.count || 1;
          if (!this.freeTools) {
            return JSON.stringify({ error: 'Free tools service unavailable.' });
          }
          const result = this.freeTools.rollDice(sides, count);
          return JSON.stringify(result);
        }

        case 'flip_coin': {
          const count = args.count || 1;
          if (!this.freeTools) {
            return JSON.stringify({ error: 'Free tools service unavailable.' });
          }
          const result = this.freeTools.flipCoin(count);
          return JSON.stringify(result);
        }

        case 'analyze_file': {
          const filename = args.filename || '';
          if (!this.freeTools) {
            return JSON.stringify({ error: 'Free tools service unavailable.' });
          }
          const result = await this.freeTools.analyzeFile(filename);
          return JSON.stringify(result);
        }

        case 'summarize_chat': {
          const limit = Math.min(Math.max(parseInt(args.limit) || 20, 5), 50);
          const messages = this.memoryService ? this.memoryService.getRecentMessages(limit) : [];
          if (!this.freeTools) {
            return JSON.stringify({ error: 'Free tools service unavailable.' });
          }
          const summary = this.freeTools.summarizeChat(messages, limit);
          return JSON.stringify(summary);
        }

        case 'translate_text': {
          const text = args.text || '';
          const targetLang = args.target_language || 'es';
          if (!this.freeTools) {
            return JSON.stringify({ error: 'Free tools service unavailable.' });
          }
          const result = await this.freeTools.translateText(text, targetLang);
          return JSON.stringify(result);
        }

        case 'explain_code': {
          const code = args.code || '';
          const language = args.language || 'javascript';
          if (!this.freeTools) {
            return JSON.stringify({ error: 'Free tools service unavailable.' });
          }
          const result = this.freeTools.explainCode(code, language);
          return JSON.stringify(result);
        }

        default:
          return JSON.stringify({ error: `Tool "${name}" is not recognized or permitted.` });
      }
    } catch (err) {
      return JSON.stringify({ error: `Tool execution error: ${err.message}` });
    }
  }
}

module.exports = { ToolRegistry };
