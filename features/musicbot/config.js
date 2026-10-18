/**
 * Konfigurasi lokal untuk fitur Music Bot.
 * Dipakai oleh: features/musicbot/panel.js, features/musicbot/handlers.js.
 * Bergantung pada: config.js (konfigurasi global).
 */

// --- Import Modul ---
const rootConfig = require('../../config');

// --- Konfigurasi Fitur ---
const config = {
  iconFree: rootConfig.musicIconFree,
  iconBusy: rootConfig.musicIconBusy,
  debounceMs: rootConfig.musicDebounceMs,
};

module.exports = config;
