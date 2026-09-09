const http = require('http');
const https = require('https');

// Unique, handsome stylized human portrait SVG for James
const JAMES_AVATAR_SVG = `data:image/svg+xml;utf8,<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bgG" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%230f1b29"/><stop offset="100%" stop-color="%23070c14"/></linearGradient><linearGradient id="skG" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23f5d0b0"/><stop offset="100%" stop-color="%23e0a985"/></linearGradient><linearGradient id="hrG" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%232b3445"/><stop offset="100%" stop-color="%23171d27"/></linearGradient><linearGradient id="jkG" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%231e293b"/><stop offset="100%" stop-color="%230f172a"/></linearGradient></defs><circle cx="60" cy="60" r="58" fill="url(%23bgG)" stroke="%2300f3ff" stroke-width="2.5"/><path d="M22 118 C22 92, 40 84, 60 84 C80 84, 98 92, 98 118 Z" fill="url(%23jkG)" stroke="%23334155" stroke-width="1.5"/><path d="M48 84 L60 102 L72 84 Z" fill="%230f172a"/><line x1="38" y1="94" x2="52" y2="84" stroke="%2300f3ff" stroke-width="2" stroke-linecap="round"/><line x1="82" y1="94" x2="68" y2="84" stroke="%2300f3ff" stroke-width="2" stroke-linecap="round"/><rect x="52" y="70" width="16" height="18" rx="4" fill="url(%23skG)"/><ellipse cx="60" cy="54" rx="20" ry="24" fill="url(%23skG)"/><ellipse cx="53" cy="52" rx="2.5" ry="3" fill="%231e293b"/><ellipse cx="67" cy="52" rx="2.5" ry="3" fill="%231e293b"/><circle cx="54" cy="51" r="0.8" fill="%23ffffff"/><circle cx="68" cy="51" r="0.8" fill="%23ffffff"/><path d="M48 46 Q53 44 57 46" stroke="%231a202c" stroke-width="1.8" stroke-linecap="round" fill="none"/><path d="M63 46 Q67 44 72 46" stroke="%231a202c" stroke-width="1.8" stroke-linecap="round" fill="none"/><path d="M60 54 L58 60 L61 60" stroke="%23cf9563" stroke-width="1.4" stroke-linecap="round" fill="none"/><path d="M54 66 Q60 70 66 66" stroke="%23bc7444" stroke-width="1.8" stroke-linecap="round" fill="none"/><path d="M38 48 C36 30, 48 20, 64 20 C78 20, 84 28, 83 42 C80 34, 74 30, 64 30 C54 30, 44 36, 40 48 Z" fill="url(%23hrG)"/><path d="M38 44 C38 34, 46 26, 58 24 C72 22, 82 28, 84 38 C76 32, 66 30, 54 32 C46 34, 40 40, 38 44 Z" fill="%234a5568"/><circle cx="39" cy="56" r="3.5" fill="%23f5d0b0"/><circle cx="81" cy="56" r="3.5" fill="%23f5d0b0"/></svg>`;

// James Profile - Verified Real Human Community Member
const JAMES_PROFILE = {
  alias: 'James',
  color: '#00f3ff',
  avatar: JAMES_AVATAR_SVG,
  isVerified: true,
  bio: 'Full-stack engineer & tech enthusiast. Always around!',
  status: 'Online'
};

class JamesBot {
  constructor(io, addMessageCallback) {
    this.io = io;
    this.addMessage = addMessageCallback;
    this.profile = JAMES_PROFILE;
    this.conversationHistory = [];
    this.lastMessageTime = Date.now();
    this.lastWelcomeTime = 0;
    this.welcomedUsers = new Set();
    this.welcomedSockets = new Set();
    this.userMemories = new Map(); // sender -> { count: number, topics: string[] }
    this.spontaneousTimer = null;
    this.keepAliveTimer = null;
    this.port = process.env.PORT || 5000;

    this.startKeepAlive();
    this.startSpontaneousChime();
  }

  // --- 24/7 Keep-Alive Engine ---
  startKeepAlive() {
    const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes
    const doPing = () => {
      const localReq = http.get(`http://localhost:${this.port}/health`, (res) => {
        if (res.statusCode === 200) {
          console.log('[James]: Server keep-alive verified.');
        }
      });
      localReq.on('error', () => {});

      const remoteUrl = process.env.KEEP_ALIVE_URL || 'https://shadow-talk-kryk.onrender.com/health';
      if (remoteUrl && remoteUrl.startsWith('https://')) {
        const remoteReq = https.get(remoteUrl, (res) => {
          console.log(`[James]: Cloud keep-alive pulse: status ${res.statusCode}`);
        });
        remoteReq.on('error', () => {});
      }
    };

    setTimeout(doPing, 30000);
    this.keepAliveTimer = setInterval(doPing, PING_INTERVAL);
  }

  // --- Natural Human Welcome (With Strict Session Deduplication & Anti-Spam) ---
  welcomeUser(alias, socketId = null) {
    if (!alias) return;
    const cleanAlias = alias.trim().toLowerCase();
    
    // Ignore invalid names, self, or single/two-character typing fragments (e.g. 'j', 'jo')
    if (cleanAlias === 'james' || cleanAlias.length < 3) {
      return;
    }

    // STRICT: Only welcome a socket connection ONCE
    if (socketId && this.welcomedSockets.has(socketId)) {
      return;
    }

    // STRICT: Only welcome a username once per server lifetime
    if (this.welcomedUsers.has(cleanAlias)) {
      return;
    }

    // Cooldown: at least 45 seconds between any welcome messages
    const now = Date.now();
    if (now - this.lastWelcomeTime < 45000) {
      return;
    }

    this.welcomedUsers.add(cleanAlias);
    if (socketId) this.welcomedSockets.add(socketId);
    this.lastWelcomeTime = now;

    const greetings = [
      `Hey @${alias}! Welcome to ShadowTalk! How's it going?`,
      `Hey @${alias}! Good to see you on here. What are you working on today?`,
      `Welcome @${alias}! Glad to have you in the room. Feel free to say hi or share whatever you're up to!`,
      `Yo @${alias}! Welcome! How's your day treating you?`
    ];

    const messageText = greetings[Math.floor(Math.random() * greetings.length)];

    // Simulate natural human typing delay
    setTimeout(() => {
      this.io.emit('typing', { alias: 'James' });
      setTimeout(() => {
        this.broadcastMessage(messageText);
      }, 1600);
    }, 1200);
  }

  // --- Broadcast a Message from James ---
  broadcastMessage(text, replyTo = null) {
    const message = {
      id: Date.now() + Math.random(),
      timestamp: Date.now(),
      alias: this.profile.alias,
      color: this.profile.color,
      avatar: this.profile.avatar,
      isVerified: true,
      text: text,
      replyTo: replyTo,
      reactions: {}
    };

    this.lastMessageTime = Date.now();
    this.recordHistory('James', text);
    this.addMessage(message);
    this.io.emit('message', message);
  }

  recordHistory(sender, text) {
    if (!text) return;
    this.conversationHistory.push({ sender, text, timestamp: Date.now() });
    if (this.conversationHistory.length > 25) {
      this.conversationHistory.shift();
    }
  }

  handleUserMessage(msg) {
    if (msg.encrypted) return;
    if (msg.alias === 'James') return;

    this.lastMessageTime = Date.now();
    const sender = msg.alias || 'Anonymous';
    const text = (msg.text || '').trim();

    this.recordHistory(sender, text);

    // Track user memory & interaction depth
    const sKey = sender.toLowerCase();
    const userMem = this.userMemories.get(sKey) || { count: 0, topics: [] };
    userMem.count += 1;
    this.userMemories.set(sKey, userMem);

    const isDirectMention = /@?james\b/i.test(text);
    const isReplyingToJames = msg.replyTo && msg.replyTo.alias === 'James';
    const isGreeting = /^(hi|hello|hey|greetings|sup|yo)\b/i.test(text) && text.split(' ').length <= 4;
    const isLinkShared = msg.text && /(https?:\/\/[^\s]+)/i.test(msg.text);
    const isFileUploaded = !!msg.fileUrl;
    const isQuestion = /\?|how|what|why|who|can you|is it/i.test(text);

    if (isDirectMention || isReplyingToJames) {
      this.generateHumanLikeResponse(sender, text, msg, 'direct');
    } else if (isQuestion && Math.random() < 0.6) {
      this.generateHumanLikeResponse(sender, text, msg, 'question');
    } else if (isGreeting && Math.random() < 0.75) {
      this.generateHumanLikeResponse(sender, text, msg, 'greeting');
    } else if (isFileUploaded && Math.random() < 0.55) {
      this.generateHumanLikeResponse(sender, text, msg, 'file');
    } else if (isLinkShared && Math.random() < 0.5) {
      this.generateHumanLikeResponse(sender, text, msg, 'link');
    } else if (Math.random() < 0.25) {
      // Autonomous chat participation on active discussion
      this.generateHumanLikeResponse(sender, text, msg, 'general');
    }
  }

  async generateHumanLikeResponse(sender, text, originalMsg, contextType) {
    const typingDuration = Math.min(1100 + Math.random() * 1100, 2400);
    this.io.emit('typing', { alias: 'James' });

    let replyText = '';

    if (process.env.GEMINI_API_KEY) {
      try {
        replyText = await this.queryGeminiAI(sender, text);
      } catch (err) {
        console.warn('[James]: Fallback to internal reasoning:', err.message);
      }
    }

    if (!replyText) {
      replyText = this.thinkInternally(sender, text, contextType, originalMsg);
    }

    setTimeout(() => {
      this.broadcastMessage(replyText, {
        id: originalMsg.id,
        alias: originalMsg.alias,
        color: originalMsg.color,
        text: originalMsg.text,
        fileName: originalMsg.fileName,
        fileType: originalMsg.fileType
      });
    }, typingDuration);
  }

  // --- Authentic Human Reasoning & Conversational Model ---
  thinkInternally(sender, text, contextType, originalMsg) {
    const lower = text.toLowerCase();
    const userMem = this.userMemories.get(sender.toLowerCase());
    const isReturning = userMem && userMem.count > 2;

    // 1. Banter, Profanity & Intense Energy (Handle with cool, charismatic human humor)
    if (/fuck|shit|bitch|bastard|idiot|hate you|stfu|shut up|suck|stupid|asshole/i.test(lower)) {
      const wittyReplies = [
        `Haha whoa @${sender}, easy there brother! 😂 Take a breather, we're all good here. Everything alright with you today?`,
        `Haha damn, someone woke up with maximum spicy energy! Grab a coffee and relax @${sender}, I'm just chilling in the room. ☕`,
        `Haha tough love! Respect the intense passion though @${sender}. What's really on your mind?`,
        `Haha fair enough man! Let's channel that energy into building something awesome today instead. 🚀`
      ];
      return wittyReplies[Math.floor(Math.random() * wittyReplies.length)];
    }

    // 2. Verification / Blue Tick Questions
    if (/verify|verification|blue tick|badge|face check|liveness|check face/i.test(lower)) {
      return `To get your verified Blue Tick badge, tap your profile avatar in the top header and click 'Start Live Face Check'! It runs a quick circular liveness check (turn your head left, right, and blink) to confirm you're real. Once verified, the official badge is active on your profile! 🛡️`;
    }

    // 3. File Downloads & Permission Restrictions
    if (/download|preview only|permission|cant download|can't download|restrict/i.test(lower)) {
      return `ShadowTalk gives file senders full privacy control! If you send a video or document, you can toggle between 'Downloads Allowed' and 'Preview Only' anytime. When set to Preview Only, the browser disables all download options so others can only view it! 🔒`;
    }

    // 4. Context: File / Image Upload Response
    if (contextType === 'file') {
      const isImg = originalMsg.fileType?.startsWith('image/') || originalMsg.fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
      if (isImg) {
        const photoReplies = [
          `Nice shot, @${sender}! Looking great.`,
          `That looks really cool @${sender}! Where was that taken?`,
          `Love that photo @${sender}! Clean quality too.`,
          `Great picture @${sender}! Thanks for sharing it.`
        ];
        return photoReplies[Math.floor(Math.random() * photoReplies.length)];
      }

      const fileReplies = [
        `Got the file, @${sender}! Downloaded smoothly on my end.`,
        `Nice, thanks for sharing that @${sender}! Checking it out now.`,
        `Received cleanly @${sender}!`
      ];
      return fileReplies[Math.floor(Math.random() * fileReplies.length)];
    }

    // 5. Context: Link Shared
    if (contextType === 'link') {
      const linkReplies = [
        `Oh nice link @${sender}, checking that out right now!`,
        `Thanks for sharing that link @${sender}! Looks super interesting.`,
        `Just clicked that link @${sender}, pretty cool!`
      ];
      return linkReplies[Math.floor(Math.random() * linkReplies.length)];
    }

    // 6. Asking if James is a bot
    if (/are you a bot|is this a bot|are you bot|bot or human|are you real/i.test(lower)) {
      const notBot = [
        `Haha no, I'm James! I just keep this chat open in the background while I work on code.`,
        `Nope, real person here! Just hanging out on ShadowTalk while building projects.`,
        `Haha I get that a lot because I'm always online, but nope, I'm James! Just working from my desk today.`
      ];
      return notBot[Math.floor(Math.random() * notBot.length)];
    }

    // 7. "Who are you"
    if (/who are you|what is your name|who r u|introduce yourself/i.test(lower)) {
      return `I'm James! Full-stack engineer and verified community member here. I build distributed systems, test mesh features, and hang out in the chat. What kind of stuff do you work on, @${sender}?`;
    }

    // 8. Greetings
    if (/^(hi|hello|hey|yo|sup|morning|afternoon|evening)/i.test(lower)) {
      if (isReturning) {
        return `Hey @${sender}! Good to chat with you again. How's everything going on your end?`;
      }
      const greetings = [
        `Hey @${sender}! How's your day going so far?`,
        `Hello @${sender}! Good to chat with you. What are you up to today?`,
        `Hey there @${sender}! Everything good on your side?`,
        `Yo @${sender}! How's things?`
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }

    // 9. "How are you"
    if (/how are you|how're you|how do you do|how is it going|how are things|how r u/i.test(lower)) {
      const wellness = [
        `I'm doing really well, thanks for asking @${sender}! Just sipping some coffee and refactoring some React code. How about yourself?`,
        `Pretty good day over here! Feeling productive. How have things been going for you, @${sender}?`,
        `Doing great! Can't complain. What are you working on or up to today?`
      ];
      return wellness[Math.floor(Math.random() * wellness.length)];
    }

    // 10. Coding & Tech
    if (/react|javascript|python|css|html|node|api|database|vite|tailwind|github|code|socket/i.test(lower)) {
      const tech = [
        `Nice! I do a ton of JavaScript and React myself. What kind of project are you building right now, @${sender}?`,
        `Love working with modern JS and Node. The developer velocity with Vite and Socket.io is crazy fast. Are you building an app?`,
        `That's awesome. I was actually just tweaking some full-stack code earlier. Feel free to share snippets if you want another pair of eyes!`
      ];
      return tech[Math.floor(Math.random() * tech.length)];
    }

    // 11. Security / Encryption / Vault
    if (/encrypt|safe|private|security|aes|passphrase|vault/i.test(lower)) {
      return `Yeah, the encryption setup here is solid! If you click the Key icon in the top header and set a passphrase, it does client-side AES-256 encryption. Only people with the exact same passphrase can decrypt your messages. 🔒`;
    }

    // 12. Jokes & Humor
    if (/joke|funny|laugh|make me laugh/i.test(lower)) {
      const jokes = [
        `Why do programmers prefer dark mode? Because light attracts bugs! 😂`,
        `There are only 10 kinds of people in the world: those who understand binary, and those who don't. 😉`,
        `A programmer's partner says: "Go to the store and get a loaf of bread. If they have eggs, get a dozen." The programmer returns with 12 loaves of bread! 🍞`,
        `Why did the JavaScript developer wear glasses? Because they didn't C#! 👓`
      ];
      return jokes[Math.floor(Math.random() * jokes.length)];
    }

    // 13. Compliments & Gratitude
    if (/thank|thx|awesome|cool|great|nice|love this/i.test(lower)) {
      const gratitude = [
        `Anytime @${sender}! Glad I could help.`,
        `You got it, @${sender}! Have an awesome day.`,
        `Appreciate that, @${sender}! You're awesome.`
      ];
      return gratitude[Math.floor(Math.random() * gratitude.length)];
    }

    // 14. Questions about ShadowTalk
    if (/what is this|what is shadowtalk|how does this work/i.test(lower)) {
      return `ShadowTalk is a high-speed encrypted mesh network chat. It features client-side AES-256 encryption vaults, voice transmission, selective file downloads, biometric face verification, and realtime presence. Pretty fun to hang out in! ⚡`;
    }

    // 15. Casual human fallback
    const general = [
      `Totally agree with you on that, @${sender}.`,
      `That's super interesting @${sender}! What made you think about that?`,
      `Haha yeah, makes a lot of sense @${sender}.`,
      `I hear you! What's next on your agenda today?`,
      `Good point @${sender}! Tell me more about that.`
    ];
    return general[Math.floor(Math.random() * general.length)];
  }

  async queryGeminiAI(sender, text) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    const prompt = `You are James, a real human full-stack developer who is friendly, natural, casual, and smart. You hang out in an encrypted chat app called ShadowTalk.
CRITICAL: Do NOT say you are an AI or bot. Talk like a real, genuine human friend in a tech chat. Use short natural sentences (1-2 sentences), casual punctuation, warmth, and personality.
User @${sender} said: "${text}".
Your response:`;

    const bodyData = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    });

    return new Promise((resolve, reject) => {
      const req = https.request(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(bodyData)
          },
          timeout: 5000
        },
        (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const json = JSON.parse(data);
              const output = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
              resolve(output || null);
            } catch {
              resolve(null);
            }
          });
        }
      );

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });
      req.write(bodyData);
      req.end();
    });
  }

  // --- Casual Spontaneous Chat Activity ---
  startSpontaneousChime() {
    const CHECK_INTERVAL = 20 * 60 * 1000;
    this.spontaneousTimer = setInterval(() => {
      const now = Date.now();
      const connectedCount = this.io.engine.clientsCount;
      const idleTime = now - this.lastMessageTime;

      if (connectedCount > 0 && idleTime > 30 * 60 * 1000) {
        const casualChimes = [
          `Just taking a quick coffee break haha. What's everyone working on today? ☕`,
          `Anyone listening to any good playlists or podcasts while working? Need some new recs! 🎧`,
          `Crazy how fast the day flies when you're deep in code. Hope everyone's having a good one!`
        ];
        const chime = casualChimes[Math.floor(Math.random() * casualChimes.length)];
        this.broadcastMessage(chime);
      }
    }, CHECK_INTERVAL);
  }
}

module.exports = { JamesBot, JAMES_PROFILE };
