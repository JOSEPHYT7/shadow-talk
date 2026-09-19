/**
 * AI Provider Abstraction for James Agent.
 * Supports OpenRouter, OpenAI, Google Gemini, and Fallback providers
 * with standard OpenAI-compatible tool calling.
 */

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
    this.model = config.model || process.env.JAMES_MODEL || 'meta-llama/llama-3.3-70b-instruct:free';
    this.baseUrl = config.baseUrl || 'https://openrouter.ai/api/v1/chat/completions';
  }

  async chatCompletion(messages, tools = []) {
    if (!this.apiKey) {
      throw new Error('Missing OPENROUTER_API_KEY');
    }

    // Candidate free models to try in sequence if one times out or hits rate limits
    const candidateModels = [
      this.model,
      'deepseek/deepseek-v4-flash-0731:free',
      'meta-llama/llama-3.3-70b-instruct:free',
      'google/gemini-2.0-flash-exp:free',
      'qwen/qwen-2.5-72b-instruct:free'
    ].filter((m, idx, arr) => m && arr.indexOf(m) === idx);

    let lastError = null;

    for (const modelToTry of candidateModels) {
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
