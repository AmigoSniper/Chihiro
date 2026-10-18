/**
 * Konfigurasi global aplikasi ChihiroBot dari environment variables (.env).
 * Dipakai oleh: index.js, commands, events, dan features/*\/config.js.
 * Bergantung pada: dotenv, process.env.
 */

// --- Import Modul ---
require('dotenv').config();

// --- Konstanta & Validasi Variabel Wajib ---
const REQUIRED_ENV_KEYS = ['DISCORD_TOKEN', 'CREATE_VC_ID'];
const missingKeys = REQUIRED_ENV_KEYS.filter((key) => !process.env[key]);

if (missingKeys.length > 0) {
  console.error(`Variabel .env belum diisi: ${missingKeys.join(', ')}`);
  process.exit(1);
}

// --- Objek Konfigurasi Global ---
const config = {
  // Variabel wajib
  token: process.env.DISCORD_TOKEN,
  createVcId: process.env.CREATE_VC_ID,

  // Variabel opsional (dengan nilai default sesuai kode sebelumnya)
  botStatusText: process.env.BOT_STATUS_TEXT || '🎀 ୨୧ lovely moments with Chihiro ♡',
  mentionReplyText: process.env.MENTION_REPLY_TEXT || '🎀 Ehh~ Chihiro dipanggil nih! Ada apa, sayang? ♡',
  musicIconFree: process.env.MUSIC_ICON_FREE || '✅',
  musicIconBusy: process.env.MUSIC_ICON_BUSY || '❌',
  topVoiceCount: Number.parseInt(process.env.TOP_VOICE_COUNT, 10) || 10,
  topVoiceRefreshMs: Number.parseInt(process.env.TOP_VOICE_REFRESH_MS, 10) || 300_000,
  voiceTickMs: Number.parseInt(process.env.VOICE_TICK_MS, 10) || 60_000,
  emptyRoomDelayMs: Number.parseInt(process.env.EMPTY_ROOM_DELAY_MS, 10) || 60_000,
  musicDebounceMs: Number.parseInt(process.env.MUSIC_DEBOUNCE_MS, 10) || 2_000,
};

module.exports = config;