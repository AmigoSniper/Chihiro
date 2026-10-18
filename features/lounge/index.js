/**
 * Pintu masuk utama (API publik) untuk fitur Gaming Lounge.
 * Dipakai oleh: commands/gaminglounge.js, events/interactionCreate.js, events/voiceStateUpdate.js.
 * Bergantung pada: features/lounge/panel.js, features/lounge/rooms.js, features/lounge/handlers.js, features/lounge/store.js.
 */

// --- Import Modul Fitur ---
const panel = require('./panel');
const rooms = require('./rooms');
const handlers = require('./handlers');
const store = require('./store');

// --- Ekspor API Publik ---
module.exports = {
  // Panel & Komponen Dropdown
  buildMenus: panel.buildMenus,
  refreshPanel: panel.refreshPanel,
  parseEmoji: panel.parseEmoji,

  // Manajemen Room Voice Sementara
  checkRoom: rooms.check,
  cancelRoom: rooms.cancel,

  // Handler Interaksi & Command
  handleSelect: handlers.handleSelect,
  handleAutocomplete: handlers.handleAutocomplete,
  handleSetup: handlers.handleSetup,
  handleDaftar: handlers.handleDaftar,
  handleCategoryGroup: handlers.handleCategoryGroup,
  handleGameGroup: handlers.handleGameGroup,

  // Store & Data Persisten
  store,
};
