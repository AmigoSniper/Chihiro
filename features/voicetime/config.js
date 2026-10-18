/**
 * Konfigurasi lokal untuk fitur Top Voice (Voicetime).
 * Dipakai oleh: features/voicetime/store.js, features/voicetime/panel.js, features/voicetime/tracker.js.
 * Bergantung pada: config.js (konfigurasi global).
 */

// --- Import Modul ---
const rootConfig = require('../../config');

// --- Konfigurasi Fitur ---
const config = {
  // Interval sync & simpan durasi sesi ke disk (ms)
  tickMs: rootConfig.voiceTickMs,

  // Interval pembaruan embed leaderboard (ms)
  panelRefreshMs: rootConfig.topVoiceRefreshMs,

  // Jumlah channel teratas yang ditampilkan
  topCount: rootConfig.topVoiceCount,

  // Ikon medali untuk peringkat 1, 2, dan 3
  medals: ['🥇', '🥈', '🥉'],
};

module.exports = config;
