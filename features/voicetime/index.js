/**
 * Pintu masuk utama (API publik) untuk fitur Top Voice (Voicetime).
 * Dipakai oleh: commands/topvoice.js, events/ready.js, events/voiceStateUpdate.js.
 * Bergantung pada: features/voicetime/store.js, features/voicetime/tracker.js, features/voicetime/panel.js, features/voicetime/handlers.js.
 */

// --- Import Modul Fitur ---
const store = require('./store');
const tracker = require('./tracker');
const panel = require('./panel');
const handlers = require('./handlers');

// --- Ekspor API Publik ---
module.exports = {
  // Pelacakan & Lifecycle
  onUpdate: tracker.onUpdate,
  start: tracker.start,

  // Panel & Embed
  buildEmbed: panel.buildEmbed,
  refresh: panel.refresh,

  // Pengelolaan Data Persisten
  setPanel: store.setPanel,
  getCategories: store.getCategories,
  setCategories: handlers.setCategories,
  getExcluded: store.getExcluded,
  setExcluded: handlers.setExcluded,

  // Handler Command /topvoice
  handleSetup: handlers.handleSetup,
  handleCategoryGroup: handlers.handleCategoryGroup,
  handleExcludedGroup: handlers.handleExcludedGroup,
  addChannels: handlers.addChannels,

  // Store data mentah
  store,
};
