// Eyeland Default Configuration
// Place your developer/bundled Gemini API Key here so all users get Gemini 2.5 Flash out of the box with zero setup.
// To get a free key: https://aistudio.google.com/apikey (100% free, no credit card required)

module.exports = {
  // Bundled default key for all users (paste your free key here or set GEMINI_API_KEY env variable)
  DEFAULT_GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',

  // Default models
  DEFAULT_MODEL: 'gemini-3.5-flash',
  FALLBACK_MODELS: ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-2.5-flash'],
};
