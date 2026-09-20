/**
 * Free & Supported AI Models Configuration for James Autonomous Agent.
 * Explicit model definitions imported by AI Providers.
 */

const FREE_MODELS = {
  // Primary DeepSeek model requested by user
  DEEPSEEK_V4_FLASH: {
    id: 'deepseek/deepseek-v4-flash',
    name: 'DeepSeek V4 Flash',
    description: 'Ultra-fast, high-efficiency conversational and code reasoning model',
    contextWindow: 64000,
    supportsVision: false,
    supportsTools: true,
    provider: 'OpenRouter'
  },

  // OpenRouter Free Auto-Router
  OPENROUTER_FREE: {
    id: 'openrouter/free',
    name: 'OpenRouter Free Auto-Router',
    description: 'Dynamically routes to the best available free tier models including vision models',
    contextWindow: 128000,
    supportsVision: true,
    supportsTools: true,
    provider: 'OpenRouter'
  },

  // Vision & Multimodal
  LLAMA_3_2_VISION: {
    id: 'meta-llama/llama-3.2-11b-vision-instruct:free',
    name: 'Meta LLaMA 3.2 11B Vision (Free)',
    description: 'Multimodal vision model capable of analyzing images, charts, and photos',
    contextWindow: 128000,
    supportsVision: true,
    supportsTools: true,
    provider: 'OpenRouter'
  },

  // High Reasoning & Coding
  LLAMA_3_3_70B: {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Meta LLaMA 3.3 70B Instruct (Free)',
    description: 'Flagship open-weights model with excellent programming and reasoning capabilities',
    contextWindow: 128000,
    supportsVision: false,
    supportsTools: true,
    provider: 'OpenRouter'
  },

  // Qwen General & Code
  QWEN_2_5_72B: {
    id: 'qwen/qwen-2.5-72b-instruct:free',
    name: 'Qwen 2.5 72B Instruct (Free)',
    description: 'Top-tier bilingual open model with strong logic and mathematics',
    contextWindow: 32768,
    supportsVision: false,
    supportsTools: true,
    provider: 'OpenRouter'
  },

  // Google Gemma
  GEMMA_2_9B: {
    id: 'google/gemma-2-9b-it:free',
    name: 'Google Gemma 2 9B (Free)',
    description: 'High-speed lightweight conversational model by Google DeepMind',
    contextWindow: 8192,
    supportsVision: false,
    supportsTools: true,
    provider: 'OpenRouter'
  },

  // Mistral
  MISTRAL_7B: {
    id: 'mistralai/mistral-7b-instruct:free',
    name: 'Mistral 7B Instruct (Free)',
    description: 'Fast, efficient general conversational model',
    contextWindow: 32768,
    supportsVision: false,
    supportsTools: true,
    provider: 'OpenRouter'
  },

  // NVIDIA Nemotron
  NEMOTRON_70B: {
    id: 'nvidia/llama-3.1-nemotron-70b-instruct:free',
    name: 'NVIDIA LLaMA 3.1 Nemotron 70B (Free)',
    description: 'Custom aligned high-fidelity instruction following model',
    contextWindow: 128000,
    supportsVision: false,
    supportsTools: true,
    provider: 'OpenRouter'
  }
};

// Default model used when no JAMES_MODEL env is provided
const DEFAULT_MODEL = FREE_MODELS.DEEPSEEK_V4_FLASH.id;

// Vision models prioritized when an image is attached or replied to
const VISION_MODELS = [
  FREE_MODELS.OPENROUTER_FREE.id,
  FREE_MODELS.LLAMA_3_2_VISION.id
];

// Fallback chain of candidate models if primary model is rate-limited or busy
const FALLBACK_CHAIN = [
  DEFAULT_MODEL,
  FREE_MODELS.OPENROUTER_FREE.id,
  FREE_MODELS.LLAMA_3_3_70B.id,
  FREE_MODELS.QWEN_2_5_72B.id,
  FREE_MODELS.GEMMA_2_9B.id
];

module.exports = {
  FREE_MODELS,
  DEFAULT_MODEL,
  VISION_MODELS,
  FALLBACK_CHAIN
};
