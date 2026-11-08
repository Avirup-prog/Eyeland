const path = require('path');
const fs = require('fs');
const { app } = require('electron');

let GoogleGenAIClass = null;

async function getGenAI() {
  if (!GoogleGenAIClass) {
    const mod = await import('@google/genai');
    GoogleGenAIClass = mod.GoogleGenAI;
  }
  return GoogleGenAIClass;
}

let defaultConfig = { DEFAULT_GEMINI_API_KEY: '', DEFAULT_MODEL: 'gemini-2.5-flash', FALLBACK_MODELS: ['gemini-2.0-flash', 'gemini-1.5-flash'] };
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

function getApiKeyInfo() {
  // 1. User custom key explicitly saved in app settings
  try {
    const configPath = getConfigPath();
    if (fs.existsSync(configPath)) {
      const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (data.apiKey && data.apiKey.trim()) {
        return { key: data.apiKey.trim(), tier: 'custom', hasKey: true };
      }
    }
  } catch (err) {
    console.warn('[geminiService] Error reading config:', err.message);
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
    activeModel: defaultConfig.DEFAULT_MODEL || 'gemini-2.5-flash',
    maskedKey: info.key ? `${info.key.slice(0, 4)}...${info.key.slice(-4)}` : '',
    hasBundledKey: Boolean(defaultConfig.DEFAULT_GEMINI_API_KEY && defaultConfig.DEFAULT_GEMINI_API_KEY.trim()),
  };
}

function saveApiKey(apiKey) {
  try {
    const configPath = getConfigPath();
    const cleanKey = (apiKey || '').trim();
    if (!cleanKey) {
      // Clear custom key so it reverts back to bundled default
      if (fs.existsSync(configPath)) {
        fs.unlinkSync(configPath);
      }
      delete process.env.GEMINI_API_KEY;
      return { success: true, cleared: true };
    }
    fs.writeFileSync(configPath, JSON.stringify({ apiKey: cleanKey, updatedAt: Date.now() }, null, 2), 'utf8');
    process.env.GEMINI_API_KEY = cleanKey;
    return { success: true };
  } catch (err) {
    console.error('[geminiService] Error saving apiKey:', err);
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
  return new GenAI({ apiKey: key });
}

// Available model candidates in order of preference
const MODEL_CANDIDATES = [
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-flash-latest',
];

function formatErrorMessage(err) {
  if (!err) return 'Unknown error occurred.';
  const msg = err.message || String(err);
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
  for (const model of MODEL_CANDIDATES) {
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
    }
  }
  const cleanMsg = formatErrorMessage(lastError);
  throw new Error(cleanMsg || 'Inference failed across all Gemini model candidates.');
}

async function chat({ prompt, history = [], customKey = null, imageBase64 = null }) {
  try {
    const ai = await getAiClient(customKey);
    const systemPrompt = "You are Eyeland, a living, intelligent ambient AI desktop companion running flush with the screen bezel on Windows. Your answers must be direct, knowledgeable, helpful, concise, and beautifully formatted in markdown. When asked about specific tools, software, or workflows, provide accurate, actionable steps.";

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
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
      userParts.push({
        inlineData: {
          mimeType: 'image/png',
          data: cleanBase64,
        },
      });
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
    let systemInstruction = 'You are Eyeland Neural Multimodal Suite. Provide structured, precise, clean analysis.';

    const contents = [];

    // If an image (snip or vision scan) was provided, add it as inlineData
    if (imageBase64) {
      let cleanData = imageBase64;
      let mimeType = 'image/png';
      if (cleanData.includes(';base64,')) {
        const parts = cleanData.split(';base64,');
        mimeType = parts[0].replace('data:', '') || 'image/png';
        cleanData = parts[1];
      }
      contents.push({
        inlineData: {
          data: cleanData,
          mimeType: mimeType,
        },
      });
    }

    if (tool === 'explain') {
      prompt = `Analyze the provided content (text or screen image).
Target: ${text ? `"${text}"` : 'The attached screen selection'}

Please provide a clean structured breakdown with:
1. **In Plain English (ELI5)**: Explain what this means in simple, accessible language (1-2 clear paragraphs).
2. **Key Takeaways**: Exactly 3 distinct bullet points summarizing the most critical points.
3. **Jargon Decoded**: If any technical terms, acronyms, or jargon are present, briefly define them.`;
    } else if (tool === 'polish') {
      const tone = options.tone || 'professional';
      prompt = `Rewrite and polish the following text.
Target: "${text}"
Desired Tone: ${tone}

Please provide:
1. **Polished Version**: The refined, polished text with perfect grammar, spelling, and tone.
2. **Key Improvements**: 2-3 brief bullet points explaining what was corrected (e.g. tone adjustment, conciseness, grammar fixes).`;
    } else if (tool === 'translate') {
      const targetLang = options.targetLang || 'Spanish';
      prompt = `Translate the following content to ${targetLang}.
Target: ${text ? `"${text}"` : 'The text visible in the attached screen crop'}

Please provide:
1. **Translation**: The direct, natural translation into ${targetLang}.
2. **Phonetic Pronunciation**: Romanized phonetic guide for pronunciation.
3. **Context Note**: 1 brief sentence on nuance or formality.`;
    } else if (tool === 'summarize') {
      prompt = `Summarize the provided content thoroughly and concisely.
Target: ${text ? `"${text}"` : 'The attached screen crop'}

Please provide:
1. **Executive TL;DR**: A punchy 1-sentence summary.
2. **Key Insights**: 3-4 bullet points capturing the core facts or insights.
3. **Action Tasks**: A checklist of actionable next steps or tasks, each formatted with "[ ] <task>".`;
    } else if (tool === 'code') {
      prompt = `You are an expert software engineer and debugger.
Analyze this code or error message:
Target: ${text ? `\`\`\`\n${text}\n\`\`\`` : 'The code/error visible in the attached image'}

Please provide:
1. **Root Cause**: Explain exactly why this bug or error occurs.
2. **Fixed Code**: Provide the clean, production-ready corrected code in a code block.
3. **Explanation**: 2-3 concise sentences explaining the fix and how to prevent it.`;
    } else if (tool === 'snip') {
      const q = options.question || 'Explain what is shown in this screen selection and provide helpful insights.';
      prompt = `Question: ${q}
Analyze this screen image thoroughly and give a direct, actionable answer.`;
    } else {
      prompt = text || 'Analyze this content.';
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
  chat,
  executeTool,
};
