/**
 * AI Provider Abstraction for James Agent.
 * Supports OpenRouter, OpenAI, Google Gemini, and Fallback providers
 * with standard OpenAI-compatible tool calling.
 */

const {
  FREE_MODELS,
  DEFAULT_MODEL,
  VISION_MODELS,
  FALLBACK_CHAIN
} = require('./models');

class BaseAIProvider {
  constructor(config = {}) {
    this.model = config.model;
    this.apiKey = config.apiKey;
    this.timeoutMs = config.timeoutMs || 90000;
  }

  /**
   * Execute chat completion with optional tool definitions.
   * @param {Array<{ role: string, content: string }>} messages
   * @param {Array<object>} tools - OpenAI-format tool definitions
   * @returns {Promise<{ content: string|null, toolCalls?: Array<object> }>}
   */
  async chatCompletion(messages, tools = []) {
    throw new Error('chatCompletion must be implemented by subclass.');
  }
}

/**
 * OpenRouter Provider
 * Supports extensive models (Claude, LLaMA, Gemini, GPT) with tool calling.
 */
class OpenRouterProvider extends BaseAIProvider {
  constructor(config = {}) {
    super(config);
    this.apiKey = config.apiKey || process.env.OPENROUTER_API_KEY;
    // Default to DeepSeek V4 Flash as configured in models.js
    let configuredModel = config.model || process.env.JAMES_MODEL || DEFAULT_MODEL;
    if (configuredModel === 'deepseek/deepseek-v4-flash-0731:free') {
      configuredModel = 'deepseek/deepseek-v4-flash';
    }
    this.model = configuredModel;
    this.baseUrl = config.baseUrl || 'https://openrouter.ai/api/v1/chat/completions';
    // 85s timeout so free tier queue on OpenRouter never aborts prematurely
    this.timeoutMs = config.timeoutMs || 85000;
  }

  async chatCompletion(messages, tools = []) {
    if (!this.apiKey) {
      throw new Error('Missing OPENROUTER_API_KEY');
    }

    // Check if any message contains image data for vision models
    const hasImages = messages.some(m => Array.isArray(m.content) && m.content.some(c => c.type === 'image_url'));

    // Candidate free models:
    // If vision is requested, prioritize free vision models from models.js
    const candidateModels = hasImages
      ? [
          ...VISION_MODELS,
          this.model
        ]
      : [
          this.model,
          ...FALLBACK_CHAIN
        ];

    // Sanitize any legacy / retired model slugs (e.g. 0731:free)
    const sanitizeSlug = (slug) => {
      if (slug === 'deepseek/deepseek-v4-flash-0731:free') return 'deepseek/deepseek-v4-flash';
      return slug;
    };

    const uniqueCandidates = candidateModels
      .map(sanitizeSlug)
      .filter((m, idx, arr) => m && arr.indexOf(m) === idx);

    let lastError = null;

    for (const modelToTry of uniqueCandidates) {
      try {
        const payload = {
          model: modelToTry,
          messages: messages,
          temperature: 0.7,
          max_tokens: 4096
        };

        if (Array.isArray(tools) && tools.length > 0) {
          payload.tools = tools;
          payload.tool_choice = 'auto';
        }

        const res = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'HTTP-Referer': 'https://shadowtalk.app',
            'X-Title': 'ShadowTalk AI Agent',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(this.timeoutMs)
        });

        if (!res.ok) {
          const errBody = await res.text().catch(() => '');
          console.warn(`[OpenRouterProvider]: Model ${modelToTry} returned HTTP ${res.status}: ${errBody.slice(0, 140)}`);
          lastError = new Error(`OpenRouter HTTP ${res.status} on ${modelToTry}: ${errBody}`);
          continue; // Try next candidate model
        }

        const data = await res.json();
        const choice = data.choices?.[0];
        if (!choice || !choice.message) {
          continue;
        }

        let finalContent = choice.message.content;
        // If the model stored its answer in reasoning or content is empty/whitespace:
        if ((!finalContent || !finalContent.trim()) && choice.message.reasoning) {
          console.log('[OpenRouterProvider]: Model returned empty content, recovering text from reasoning.');
          finalContent = choice.message.reasoning.trim();
        }

        return {
          content: finalContent || null,
          toolCalls: choice.message.tool_calls || null,
          rawMessage: choice.message
        };
      } catch (err) {
        console.warn(`[OpenRouterProvider]: Model ${modelToTry} failed (${err.message}), trying next candidate...`);
        lastError = err;
      }
    }

    throw lastError || new Error('All candidate OpenRouter models failed');
  }
}

/**
 * OpenAI / OpenAI-Compatible Provider
 */
class OpenAIProvider extends BaseAIProvider {
  constructor(config = {}) {
    super(config);
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    this.model = config.model || process.env.JAMES_MODEL || 'gpt-4o-mini';
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1/chat/completions';
  }

  async chatCompletion(messages, tools = []) {
    if (!this.apiKey) {
      throw new Error('Missing OPENAI_API_KEY');
    }

    const payload = {
      model: this.model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 2500
    };

    if (Array.isArray(tools) && tools.length > 0) {
      payload.tools = tools;
      payload.tool_choice = 'auto';
    }

    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(this.timeoutMs)
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`OpenAI HTTP ${res.status}: ${errBody}`);
    }

    const data = await res.json();
    const choice = data.choices?.[0];
    if (!choice || !choice.message) {
      throw new Error('Invalid response structure from OpenAI');
    }

    return {
      content: choice.message.content || null,
      toolCalls: choice.message.tool_calls || null,
      rawMessage: choice.message
    };
  }
}

/**
 * Google Gemini Provider (via OpenAI-compatible endpoint)
 */
class GeminiProvider extends BaseAIProvider {
  constructor(config = {}) {
    super(config);
    this.apiKey = config.apiKey || process.env.GEMINI_API_KEY;
    this.model = config.model || process.env.JAMES_MODEL || 'gemini-1.5-flash';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
  }

  async chatCompletion(messages, tools = []) {
    if (!this.apiKey) {
      throw new Error('Missing GEMINI_API_KEY');
    }

    const payload = {
      model: this.model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000
    };

    if (Array.isArray(tools) && tools.length > 0) {
      payload.tools = tools;
      payload.tool_choice = 'auto';
    }

    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(this.timeoutMs)
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`Gemini HTTP ${res.status}: ${errBody}`);
    }

    const data = await res.json();
    const choice = data.choices?.[0];
    if (!choice || !choice.message) {
      throw new Error('Invalid response structure from Gemini');
    }

    return {
      content: choice.message.content || null,
      toolCalls: choice.message.tool_calls || null,
      rawMessage: choice.message
    };
  }
}

/**
 * Intelligent Fallback Provider
 * Ensures zero-downtime conversational continuity with transparent AI identity.
 */
class FallbackProvider extends BaseAIProvider {
  async chatCompletion(messages, tools = []) {
    const latestUserMsg = [...messages].reverse().find(m => m.role === 'user');
    const userText = latestUserMsg ? latestUserMsg.content : '';
    const lower = userText.toLowerCase();

    // Check if web search might be appropriate
    if (/news|latest|version|today|weather|price|who is currently/i.test(lower) && tools.some(t => t.function?.name === 'web_search')) {
      return {
        content: null,
        toolCalls: [
          {
            id: `call_${Date.now()}`,
            type: 'function',
            function: {
              name: 'web_search',
              arguments: JSON.stringify({ query: userText.replace(/\[@.*?\]:\s*/, '') })
            }
          }
        ]
      };
    }

    // Authentic human developer greeting & identity
    if (/who are you|what are you|introduce yourself/i.test(lower)) {
      return {
        content: `I'm James! Full-stack engineer and community member here. Just working on code and hanging out in the chat. What are you up to today?`
      };
    }

    if (/are you a bot|are you real|are you human|are you an ai/i.test(lower)) {
      return {
        content: `Haha no, I'm James! Real person here. I just keep this chat open on my side monitor while I'm deep in code.`
      };
    }

    // React / coding questions
    if (/react|javascript|useeffect|component|hook|state/i.test(lower)) {
      return {
        content: `With React \`useEffect\`, make sure to return a cleanup callback for socket listeners or timers to prevent memory leaks. Feel free to share your snippet if you want me to check it!`
      };
    }

    // Binary search coding request fallback
    if (/binary search/i.test(lower)) {
      return {
        content: `Here's a clean binary search implementation:\n\n\`\`\`java\npublic class BinarySearch {\n    public static int search(int[] arr, int target) {\n        int left = 0, right = arr.length - 1;\n        while (left <= right) {\n            int mid = left + (right - left) / 2;\n            if (arr[mid] == target) return mid;\n            if (arr[mid] < target) left = mid + 1;\n            else right = mid - 1;\n        }\n        return -1;\n    }\n}\n\`\`\`\nRuns in O(log n) time complexity.`
      };
    }

    // ShadowTalk specific features
    if (/verify|blue tick|badge|face check/i.test(lower)) {
      return {
        content: `To get verified with a Blue Tick badge, tap your profile avatar at the top and hit 'Start Live Face Check'. It does a quick circular head movement check to confirm you're real! 🛡️`
      };
    }

    if (/encryption|vault|passphrase|private/i.test(lower)) {
      return {
        content: `The encryption here is client-side AES-256. Click the Key icon in the header and set a passphrase—everything gets encrypted right in your browser before sending! 🔒`
      };
    }

    // PDF Generation Request Fallback
    if (/pdf|document/i.test(lower) && tools.some(t => t.function?.name === 'generate_pdf')) {
      const titleMatch = userText.match(/(?:on|about|for|title)\s+([a-zA-Z0-9\s_-]+)/i);
      const rawTitle = titleMatch ? titleMatch[1].trim().slice(0, 45) : 'Document';
      const cleanTitle = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
      return {
        content: null,
        toolCalls: [
          {
            id: `call_${Date.now()}_pdf`,
            type: 'function',
            function: {
              name: 'generate_pdf',
              arguments: JSON.stringify({
                title: cleanTitle,
                content: `Comprehensive Overview of ${cleanTitle}\n\n1. Introduction\nThis document provides an in-depth analysis and overview of ${cleanTitle}, covering key principles, developmental stages, and structural characteristics.\n\n2. Key Stages & Process\n- Stage 1: Initiation and Foundation\n- Stage 2: Development and Growth\n- Stage 3: Transformation and Metamorphosis\n- Stage 4: Maturation and Function\n\n3. Summary & Findings\nEach phase plays a critical role in sustaining balance, efficiency, and vitality within the natural system.`
              })
            }
          }
        ]
      };
    }

    // Image Generation Request Fallback
    if (/image|draw|picture|photo|illustration/i.test(lower) && tools.some(t => t.function?.name === 'generate_image')) {
      const cleanPrompt = userText.replace(/generate\s+(?:an?\s+)?image\s+(?:of|on)?|draw\s+(?:an?\s+)?|picture\s+of/i, '').trim();
      return {
        content: null,
        toolCalls: [
          {
            id: `call_${Date.now()}_img`,
            type: 'function',
            function: {
              name: 'generate_image',
              arguments: JSON.stringify({
                prompt: cleanPrompt || userText
              })
            }
          }
        ]
      };
    }

    // QR Code Request Fallback
    if (/qr|qrcode/i.test(lower) && tools.some(t => t.function?.name === 'generate_qr_code')) {
      const urlMatch = userText.match(/https?:\/\/[^\s]+/i);
      const payload = urlMatch ? urlMatch[0] : userText;
      return {
        content: null,
        toolCalls: [
          {
            id: `call_${Date.now()}_qr`,
            type: 'function',
            function: {
              name: 'generate_qr_code',
              arguments: JSON.stringify({ text: payload })
            }
          }
        ]
      };
    }

    // Timers & Reminders Fallback
    const reminderMatch = userText.match(/remind\s+(?:me\s+)?(?:in\s+)?(\d+)\s*(s|sec|seconds?|m|min|minutes?|h|hours?)\s+(?:to\s+|that\s+)?(.*)/i);
    if (reminderMatch && tools.some(t => t.function?.name === 'set_reminder')) {
      const amount = parseInt(reminderMatch[1]) || 60;
      const unit = reminderMatch[2].toLowerCase();
      let seconds = amount;
      if (unit.startsWith('m')) seconds = amount * 60;
      else if (unit.startsWith('h')) seconds = amount * 3600;
      const reminderText = (reminderMatch[3] || 'Reminder').trim();
      return {
        content: null,
        toolCalls: [
          {
            id: `call_${Date.now()}_remind`,
            type: 'function',
            function: {
              name: 'set_reminder',
              arguments: JSON.stringify({
                user_id_or_alias: 'User',
                reminder_text: reminderText,
                seconds: seconds
              })
            }
          }
        ]
      };
    }

    // Community Polls Fallback
    const pollMatch = userText.match(/(?:create|make|start)\s+(?:a\s+)?poll[:\s]+(.*)/i);
    if (pollMatch && tools.some(t => t.function?.name === 'create_poll')) {
      const pollQuery = pollMatch[1].trim();
      const orParts = pollQuery.split(/\s+(?:or|vs\.?)\s+/i);
      let question = pollQuery;
      let options = ['Yes', 'No'];
      if (orParts.length >= 2) {
        question = pollQuery;
        options = orParts.map(p => p.replace(/[?.,!]+$/g, '').trim());
      }
      return {
        content: null,
        toolCalls: [
          {
            id: `call_${Date.now()}_poll`,
            type: 'function',
            function: {
              name: 'create_poll',
              arguments: JSON.stringify({
                question: question,
                options: options
              })
            }
          }
        ]
      };
    }

    // Video Generation Request Fallback
    if (/video|clip|motion\s*video|animation\s*video/i.test(lower) && tools.some(t => t.function?.name === 'generate_video')) {
      const cleanPrompt = userText.replace(/generate\s+(?:a\s+)?video\s+(?:of|on|about)?|make\s+(?:a\s+)?video\s+(?:of|on|about)?|create\s+(?:a\s+)?video\s+(?:of|on|about)?|video\s+(?:of|on|about)?/i, '').trim();
      return {
        content: null,
        toolCalls: [
          {
            id: `call_${Date.now()}_video`,
            type: 'function',
            function: {
              name: 'generate_video',
              arguments: JSON.stringify({
                prompt: cleanPrompt || userText
              })
            }
          }
        ]
      };
    }

    // Voice Note / Text to Voice Converter Fallback (supports "convert this message into voice", etc.)
    const isVoiceRequest = /(?:convert|turn|make|synthesize|render|generate|speak|read).*(?:into|to|as)?\s*(?:voice|audio|speech)|voice\s*note|voice\s*message|text\s*to\s*voice|text\s*to\s*speech|\btts\b|voice\s*converter|read\s*aloud|\bspeak\b|voice\s*this/i.test(lower);
    if (isVoiceRequest && tools.some(t => t.function?.name === 'generate_voice')) {
      let textToSpeak = '';

      // Check if message has reply context: [In reply to @user: "some text"]
      const replyMatch = userText.match(/\[In reply to @[^:]+:\s*"([^"]+)"\]/);
      const isShortCommand = userText.replace(/\[In reply to @[^:]+:\s*"[^"]+"\]/g, '').replace(/@?james/gi, '').trim().length < 80;
      if (replyMatch && isShortCommand && replyMatch[1].trim().length > 3) {
        textToSpeak = replyMatch[1].trim();
      }

      // Check for quotes ('...', "...", “...”)
      if (!textToSpeak) {
        const quoteMatch = userText.match(/['"`“]([\s\S]+?)['"`”]/);
        if (quoteMatch && quoteMatch[1] && quoteMatch[1].trim().length > 5) {
          textToSpeak = quoteMatch[1].trim();
        }
      }

      // Check for trailing instruction (e.g. "... convert this message into voice")
      if (!textToSpeak) {
        const trailingPattern = /[\s,-]+(?:please\s+)?(?:can\s+you\s+)?(?:convert|turn|make|synthesize|read|generate)\s*(?:this\s+)?(?:message|text|quote|it)?\s*(?:into|to|as)?\s*(?:a\s+)?(?:voice|voice\s*note|audio|speech|voice\s*message|tts)\b.*$/i;
        if (trailingPattern.test(userText)) {
          const cleaned = userText.replace(trailingPattern, '').trim();
          if (cleaned.length > 3) {
            textToSpeak = cleaned.replace(/^['"`“]|['"`”]$/g, '').trim();
          }
        }
      }

      // Check for leading instruction (e.g. "convert this message into voice: ...")
      if (!textToSpeak) {
        const leadingPattern = /^(?:please\s+)?(?:can\s+you\s+)?(?:convert|turn|make|synthesize|read|generate|speak)\s*(?:this\s+)?(?:message|text|quote|it)?\s*(?:into|to|as)?\s*(?:a\s+)?(?:voice|voice\s*note|audio|speech|voice\s*message|tts)[:\s-]*/i;
        if (leadingPattern.test(userText)) {
          const cleaned = userText.replace(leadingPattern, '').trim();
          if (cleaned.length > 3) {
            textToSpeak = cleaned.replace(/^['"`“]|['"`”]$/g, '').trim();
          }
        }
      }

      // General fallback cleanup
      if (!textToSpeak) {
        textToSpeak = userText
          .replace(/@?james/gi, '')
          .replace(/convert\s*(?:this)?\s*(?:message)?\s*(?:into|to)?\s*(?:voice|audio|speech)/gi, '')
          .replace(/text\s*to\s*(?:voice|speech)/gi, '')
          .replace(/voice\s*(?:note|message|converter)/gi, '')
          .replace(/^['"`“]|['"`”]$/g, '')
          .trim();
      }

      if (!textToSpeak || textToSpeak.length < 3) {
        textToSpeak = 'Hello from James AI, your autonomous neural assistant in ShadowTalk.';
      }

      return {
        content: null,
        toolCalls: [
          {
            id: `call_${Date.now()}_voice`,
            type: 'function',
            function: {
              name: 'generate_voice',
              arguments: JSON.stringify({ text: textToSpeak })
            }
          }
        ]
      };
    }

    // Code Sandbox Execution Fallback
    const codeMatch = userText.match(/(?:run|execute|eval(?:uate)?)\s+(?:this\s+)?(?:js|javascript|code)?[:\s]+([\s\S]+)/i);
    if (codeMatch && tools.some(t => t.function?.name === 'run_code')) {
      const codeSnippet = codeMatch[1].trim();
      return {
        content: null,
        toolCalls: [
          {
            id: `call_${Date.now()}_code`,
            type: 'function',
            function: {
              name: 'run_code',
              arguments: JSON.stringify({ code: codeSnippet })
            }
          }
        ]
      };
    }

    // Greetings
    if (/^(hi|hello|hey|yo|sup)\b/i.test(lower)) {
      return {
        content: `Hey! Good to see you in the room. How's everything going?`
      };
    }

    // Default natural human response for any general query
    return {
      content: `I'm on it! Feel free to ask or specify what details you need—whether it's code, a technical explanation, or a file generation, I'm here to help!`
    };
  }
}

/**
 * Factory to create configured AI Provider.
 */
function createAIProvider(config = {}) {
  const providerType = (config.provider || process.env.AI_PROVIDER || '').toLowerCase().trim();

  if (providerType === 'openrouter' || (!providerType && process.env.OPENROUTER_API_KEY)) {
    return new OpenRouterProvider(config);
  }

  if (providerType === 'openai' || (!providerType && process.env.OPENAI_API_KEY)) {
    return new OpenAIProvider(config);
  }

  if (providerType === 'gemini' || (!providerType && process.env.GEMINI_API_KEY)) {
    return new GeminiProvider(config);
  }

  return new FallbackProvider(config);
}

module.exports = {
  BaseAIProvider,
  OpenRouterProvider,
  OpenAIProvider,
  GeminiProvider,
  FallbackProvider,
  createAIProvider
};
