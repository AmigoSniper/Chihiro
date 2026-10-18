/**
 * Konfigurasi lokal untuk fitur Gaming Lounge.
 * Dipakai oleh: features/lounge/rooms.js, features/lounge/panel.js, features/lounge/handlers.js.
 * Bergantung pada: config.js (konfigurasi global).
 */

// --- Import Modul ---
const rootConfig = require('../../config');

// --- Konfigurasi Fitur ---
const config = {
  // ID channel voice pemicu ("Create Gaming")
  createVcId: rootConfig.createVcId,

  // Jeda waktu sebelum menghapus room yang kosong (ms)
  emptyDelayMs: rootConfig.emptyRoomDelayMs,

  // Batasan teknis Discord API
  maxCategories: 5,     // batas Discord: maksimal 5 baris komponen (ActionRow) per pesan
  maxGamesPerMenu: 25,  // batas Discord: maksimal 25 opsi per StringSelectMenu
};

module.exports = config;
