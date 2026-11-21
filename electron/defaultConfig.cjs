// Eyeland Default Configuration
// Place your developer/bundled Gemini API Key here so all users get Gemini Flash out of the box with zero setup.
// To get a free key: https://aistudio.google.com/apikey (100% free, no credit card required)

module.exports = {
  // Bundled default key for all users (paste your free key here or set GEMINI_API_KEY env variable)
  DEFAULT_GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',

  // Default models (gemini-3.1-flash-lite is hyperfast, ~1s latency on Windows)
  DEFAULT_MODEL: 'gemini-3.1-flash-lite',
  FALLBACK_MODELS: ['gemini-flash-lite-latest', 'gemini-flash-latest', 'gemini-3.8-flash'],

  // Optional webhook/endpoint (e.g. Formspree, Google Apps Script, Supabase) to collect beta tester emails centrally
  BETA_REGISTER_ENDPOINT: process.env.EYELAND_BETA_ENDPOINT || '',
};
