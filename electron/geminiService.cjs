const path = require('path');
const fs = require('fs');
const dns = require('dns');
const { app, nativeImage } = require('electron');

// Prefer IPv4 resolution if dual-stack DNS has IPv6 issues on Windows
try {
  if (dns && dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
  }
} catch (_) {}

let GoogleGenAIClass = null;

async function getGenAI() {
  if (!GoogleGenAIClass) {
    const mod = await import('@google/genai');
    GoogleGenAIClass = mod.GoogleGenAI;
  }
  return GoogleGenAIClass;
}

// Compress and scale high-resolution screen snips to eliminate network timeouts and socket hangups
function optimizeImagePayload(rawBase64) {
  if (!rawBase64) return null;
  try {
    const fullDataUrl = rawBase64.startsWith('data:') ? rawBase64 : `data:image/png;base64,${rawBase64}`;
    const img = nativeImage.createFromDataURL(fullDataUrl);
    if (!img.isEmpty()) {
      const size = img.getSize();
      const maxDim = 1280;
      let processed = img;
      if (size.width > maxDim || size.height > maxDim) {
        const scale = Math.min(maxDim / size.width, maxDim / size.height);
        processed = img.resize({
          width: Math.round(size.width * scale),
          height: Math.round(size.height * scale),
          quality: 'good',
        });
      }
      const jpegBuf = processed.toJPEG(85);
      return {
        data: jpegBuf.toString('base64'),
        mimeType: 'image/jpeg',
      };
    }
  } catch (err) {
    console.warn('[geminiService] Image optimization fallback:', err.message);
  }

  // Fallback to raw base64 extraction
  let cleanData = rawBase64;
  let mimeType = 'image/png';
  if (cleanData.includes(';base64,')) {
    const parts = cleanData.split(';base64,');
    mimeType = parts[0].replace('data:', '') || 'image/png';
    cleanData = parts[1];
  } else {
    cleanData = cleanData.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
  }
  return { data: cleanData, mimeType };
}

let defaultConfig = { DEFAULT_GEMINI_API_KEY: '', DEFAULT_MODEL: 'gemini-flash-lite-latest', FALLBACK_MODELS: ['gemini-3.1-flash-lite', 'gemini-flash-latest'] };
try {
  defaultConfig = require('./defaultConfig.cjs');
} catch (e) {
  // ignore
}

function getConfigPath() {
  try {
    const userData = app.getPath('userData');
    return path.join(userData, 'gemini_config.json');
  } catch {
    return path.join(__dirname, 'gemini_config.json');
  }
}

const AVAILABLE_MODELS = [
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    badge: 'Ultra Fast',
    description: 'Lowest latency (~1s) — best for instant screen snips & quick answers.',
  },
  {
    id: 'gemini-flash-lite-latest',
    name: 'Gemini Flash Lite (Latest)',
    badge: 'Auto-Updated',
    description: 'Always points to Google’s newest lightweight Flash-Lite release.',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    badge: 'Balanced',
    description: 'Great balance of multimodal vision accuracy, reasoning, and speed.',
  },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    badge: 'High Quota',
    description: 'Lightweight model optimized for high-volume everyday tasks.',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    badge: 'Deep Reasoning',
    description: 'Maximum intelligence for complex code debugging and deep analysis.',
  },
];

function readConfig() {
  try {
    const configPath = getConfigPath();
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf8').replace(/^\uFEFF/, '').trim();
      if (raw) {
        return JSON.parse(raw);
      }
    }
  } catch (err) {
    console.warn('[geminiService] Error reading config:', err.message);
  }
  return {};
}

function writeConfig(updates) {
  const configPath = getConfigPath();
  const current = readConfig();
  const next = { ...current, ...updates, updatedAt: Date.now() };
  if (!next.apiKey) delete next.apiKey;
  if (!next.preferredModel) delete next.preferredModel;
  fs.writeFileSync(configPath, JSON.stringify(next, null, 2), 'utf8');
  return next;
}

function getPreferredModel() {
  const cfg = readConfig();
  if (cfg.preferredModel && typeof cfg.preferredModel === 'string' && cfg.preferredModel.trim()) {
    return cfg.preferredModel.trim();
  }
  return defaultConfig.DEFAULT_MODEL || 'gemini-3.1-flash-lite';
}

function getApiKeyInfo() {
  // 1. User custom key explicitly saved in app settings
  const data = readConfig();
  if (data.apiKey && data.apiKey.trim()) {
    return { key: data.apiKey.trim(), tier: 'custom', hasKey: true };
  }

  // 2. Check process.env
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) {
    return { key: process.env.GEMINI_API_KEY.trim(), tier: 'custom', hasKey: true };
  }

  // 3. Bundled developer default key for all users
  if (defaultConfig.DEFAULT_GEMINI_API_KEY && defaultConfig.DEFAULT_GEMINI_API_KEY.trim()) {
    return { key: defaultConfig.DEFAULT_GEMINI_API_KEY.trim(), tier: 'bundled', hasKey: true };
  }

  return { key: '', tier: 'none', hasKey: false };
}

function getStoredApiKey() {
  const info = getApiKeyInfo();
  return info.key;
}

function getAiStatus() {
  const info = getApiKeyInfo();
  return {
    hasKey: info.hasKey,
    tier: info.tier, // 'bundled' | 'custom' | 'none'
    activeModel: getPreferredModel(),
    availableModels: AVAILABLE_MODELS,
    maskedKey: info.key ? `${info.key.slice(0, 4)}...${info.key.slice(-4)}` : '',
    hasBundledKey: Boolean(defaultConfig.DEFAULT_GEMINI_API_KEY && defaultConfig.DEFAULT_GEMINI_API_KEY.trim()),
  };
}

function saveApiKey(apiKey) {
  try {
    const cleanKey = (apiKey || '').trim();
    if (!cleanKey) {
      // Clear custom key while preserving preferredModel
      writeConfig({ apiKey: '' });
      delete process.env.GEMINI_API_KEY;
      return { success: true, cleared: true, status: getAiStatus() };
    }
    writeConfig({ apiKey: cleanKey });
    process.env.GEMINI_API_KEY = cleanKey;
    return { success: true, status: getAiStatus() };
  } catch (err) {
    console.error('[geminiService] Error saving apiKey:', err);
    return { success: false, error: err.message };
  }
}

function saveModel(modelId) {
  try {
    const cleanModel = (modelId || '').trim();
    if (!cleanModel) {
      return { success: false, error: 'Model ID cannot be empty.' };
    }
    writeConfig({ preferredModel: cleanModel });
    return { success: true, status: getAiStatus() };
  } catch (err) {
    console.error('[geminiService] Error saving model:', err);
    return { success: false, error: err.message };
  }
}

async function getAiClient(customKey = null) {
  let key = (customKey || '').trim();
  if (!key) {
    const info = getApiKeyInfo();
    key = info.key;
  }
  if (!key) {
    throw new Error('NO_API_KEY: No API key found. Either bundle a DEFAULT_GEMINI_API_KEY in defaultConfig.cjs, or enter an optional key in settings.');
  }
  const GenAI = await getGenAI();
  return new GenAI({
    apiKey: key,
  });
}

// Available model candidates in order of preference (preferred model is always tried first)
const MODEL_CANDIDATES = [
  'gemini-3.1-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro',
];

function getOrderedCandidates(overrideModel = null) {
  const preferred = (overrideModel || getPreferredModel() || '').trim();
  const list = preferred ? [preferred, ...MODEL_CANDIDATES] : [...MODEL_CANDIDATES];
  return Array.from(new Set(list));
}

function formatErrorMessage(err) {
  if (!err) return 'Unknown error occurred.';
  const msg = err.message || String(err);

  if (msg.includes('fetch failed') || msg.includes('ENOTFOUND') || msg.includes('ECONNREFUSED') || msg.includes('ETIMEDOUT') || msg.includes('ECONNRESET')) {
    return 'Internet connection error. Please verify your internet or Wi-Fi connection and try again.';
  }
  if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid')) {
    return 'Your Gemini API key is invalid. Please verify your Google AI Studio key.';
  }
  if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429')) {
    return 'Gemini rate limit reached. Please wait a moment and try again.';
  }

  try {
    // If the message is a JSON string from Google API, parse the human-readable text
    const parsed = JSON.parse(msg);
    if (parsed.error && parsed.error.message) {
      return parsed.error.message;
    }
  } catch {
    // ignore json parse error
  }
  return msg;
}

async function callWithModelFallback(ai, contents, config = {}) {
  let lastError = null;
  const candidates = getOrderedCandidates();
  for (const model of candidates) {
    try {
      console.log(`[geminiService] Attempting inference with model: ${model}`);
      const response = await ai.models.generateContent({
        model: model,
        contents: contents,
        config: config,
      });
      if (response && response.text) {
        return { text: response.text, modelUsed: model };
      }
    } catch (err) {
      console.warn(`[geminiService] Model ${model} failed:`, err.message);
      lastError = err;
      // If error is invalid API key, don't keep retrying other models
      if (err.message && (err.message.includes('API_KEY_INVALID') || err.message.includes('API key not valid'))) {
        throw new Error('API key is invalid. Please verify your Google AI Studio API key.');
      }
      // If network offline / fetch failed, wait briefly before trying next candidate
      if (err.message && (err.message.includes('fetch failed') || err.message.includes('ENOTFOUND') || err.message.includes('ETIMEDOUT'))) {
        await new Promise((res) => setTimeout(res, 600));
      }
    }
  }
  const cleanMsg = formatErrorMessage(lastError);
  throw new Error(cleanMsg || 'Inference failed across all Gemini model candidates.');
}

async function testConnection({ customKey = null, model = null } = {}) {
  const start = Date.now();
  try {
    const keyInfo = getApiKeyInfo();
    const effectiveKey = (customKey || '').trim() || keyInfo.key;
    const effectiveTier = (customKey || '').trim() ? 'custom' : keyInfo.tier;
    if (!effectiveKey) {
      return {
        success: false,
        latencyMs: Date.now() - start,
        error: 'No Gemini API key configured. Paste a Google AI Studio key to connect.',
      };
    }

    const ai = await getAiClient(effectiveKey);
    const targetModel = (model || getPreferredModel() || 'gemini-3.1-flash-lite').trim();
    const candidates = getOrderedCandidates(targetModel);
    let lastError = null;

    for (const m of candidates) {
      try {
        const res = await ai.models.generateContent({
          model: m,
          contents: [{ role: 'user', parts: [{ text: 'Reply with only: OK' }] }],
          config: { maxOutputTokens: 8, temperature: 0 },
        });
        if (res && res.text) {
          return {
            success: true,
            latencyMs: Date.now() - start,
            modelUsed: m,
            requestedModel: targetModel,
            usedFallback: m !== targetModel,
            tier: effectiveTier,
          };
        }
      } catch (err) {
        lastError = err;
        if (err.message && (err.message.includes('API_KEY_INVALID') || err.message.includes('API key not valid'))) {
          throw err;
        }
      }
    }

    throw lastError || new Error('Gemini did not return a valid response.');
  } catch (err) {
    return {
      success: false,
      latencyMs: Date.now() - start,
      error: formatErrorMessage(err),
    };
  }
}

async function chat({ prompt, history = [], customKey = null, imageBase64 = null }) {
  try {
    const ai = await getAiClient(customKey);
    const systemPrompt = "You are a helpful, smart, direct AI assistant. Answer directly and naturally in clean markdown. Never output artificial banners, meta headers like '### Eyeland Neural Multimodal Suite: Analysis Report', or fake status reports. Write concise, insightful, natural responses just like top-tier conversational LLMs.";

    // Format chat turns if history exists
    const contents = [];
    if (Array.isArray(history) && history.length > 0) {
      for (const turn of history.slice(-8)) {
        if (turn.role && turn.text) {
          contents.push({
            role: turn.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: turn.text }],
          });
        }
      }
    }

    const userParts = [];
    if (imageBase64) {
      const opt = optimizeImagePayload(imageBase64);
      if (opt && opt.data) {
        userParts.push({
          inlineData: {
            mimeType: opt.mimeType,
            data: opt.data,
          },
        });
      }
    }
    userParts.push({ text: prompt || 'Analyze this image.' });

    contents.push({
      role: 'user',
      parts: userParts,
    });

    const result = await callWithModelFallback(ai, contents, {
      systemInstruction: systemPrompt,
      temperature: 0.7,
    });

    return {
      success: true,
      text: result.text,
      model: result.modelUsed,
    };
  } catch (err) {
    console.error('[geminiService chat error]', err);
    return {
      success: false,
      error: formatErrorMessage(err),
    };
  }
}

async function executeTool({ tool, text = '', imageBase64 = null, options = {}, customKey = null }) {
  try {
    const ai = await getAiClient(customKey);
    let prompt = '';
    let systemInstruction = 'You are a smart, direct AI assistant. Answer directly and naturally in clean markdown. Never output artificial banners, corporate headers like "### Eyeland Neural Multimodal Suite: Analysis Report", or fake status symbols. Write concise, insightful responses just like top-tier conversational LLMs.';

    const contents = [];

    // If an image (snip or vision scan) was provided, optimize & add it as inlineData
    if (imageBase64) {
      const opt = optimizeImagePayload(imageBase64);
      if (opt && opt.data) {
        contents.push({
          inlineData: {
            data: opt.data,
            mimeType: opt.mimeType,
          },
        });
      }
    }

    if (tool === 'explain') {
      prompt = `Explain the following content clearly and directly in plain English:
${text ? `"${text}"` : 'Explain what is shown in the attached screen image.'}

Provide:
- A clear, simple explanation in plain English.
- Key takeaways or critical points in clean bullets.
- Definitions of any technical jargon if present.
Answer directly without boilerplate intros or titles.`;
    } else if (tool === 'polish') {
      const tone = options.tone || 'professional';
      prompt = `Rewrite and polish the following text with a ${tone} tone:
"${text}"

Provide:
1. The polished version.
2. 2-3 brief bullet points explaining key improvements.
Answer directly without boilerplate intros or titles.`;
    } else if (tool === 'translate') {
      const targetLang = options.targetLang || 'Spanish';
      prompt = `Translate the following content to ${targetLang}:
${text ? `"${text}"` : 'The text in the attached image.'}

Provide:
1. The natural translation in ${targetLang}.
2. Phonetic pronunciation guide if applicable.
Answer directly without boilerplate intros or titles.`;
    } else if (tool === 'summarize') {
      prompt = `Summarize the following content concisely:
${text ? `"${text}"` : 'The attached image.'}

Provide:
- A clear, concise summary.
- Core bullet points.
- Any action items if applicable.
Answer directly without boilerplate intros or titles.`;
    } else if (tool === 'code') {
      prompt = `Debug and fix the following code or error:
${text ? `\`\`\`\n${text}\n\`\`\`` : 'The code or error shown in the attached image.'}

Provide:
1. Root cause in 1-2 concise sentences.
2. The corrected code in a code block.
3. Brief explanation of the fix.
Answer directly without boilerplate intros or titles.`;
    } else if (tool === 'snip') {
      const q = options.question || 'Explain what is shown in this screen selection and provide helpful insights.';
      prompt = `${q}
Answer directly, clearly, and concisely without boilerplate intros or titles.`;
    } else {
      prompt = text || 'Analyze this content directly and concisely.';
    }

    contents.push({ text: prompt });

    const result = await callWithModelFallback(ai, contents, {
      systemInstruction: systemInstruction,
      temperature: 0.5,
    });

    return {
      success: true,
      text: result.text,
      model: result.modelUsed,
    };
  } catch (err) {
    console.error('[geminiService executeTool error]', err);
    return {
      success: false,
      error: formatErrorMessage(err),
    };
  }
}

module.exports = {
  getStoredApiKey,
  getAiStatus,
  saveApiKey,
  saveModel,
  testConnection,
  chat,
  executeTool,
};
