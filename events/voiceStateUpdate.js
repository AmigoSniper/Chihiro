/**
 * Event VoiceStateUpdate: Menangani perubahan aktivitas member di channel voice.
 * Dipakai oleh: discord.js event loader di index.js.
 * Bergantung pada: discord.js, features/voicetime, features/lounge, features/musicbot.
 */

// --- Import Modul ---
const { Events } = require('discord.js');
const voicetime = require('../features/voicetime');
const lounge = require('../features/lounge');
const musicbot = require('../features/musicbot');

// --- Definisi Event ---
module.exports = {
  name: Events.VoiceStateUpdate,

  /**
   * Mengalirkan event pembaruan voice ke seluruh fitur yang berkepentingan.
   * @param {import('discord.js').VoiceState} oldState
   * @param {import('discord.js').VoiceState} newState
   */
  async execute(oldState, newState) {
    const client = newState.client;

    // 1. Top Voice: Sinkronisasi durasi waktu aktif pada channel voice terkait
    voicetime.onUpdate(oldState, newState);

    // 2. Gaming Lounge: Periksa channel lama dan baru untuk auto-cleanup room kosong
    lounge.checkRoom(client, oldState.channel);
    lounge.checkRoom(client, newState.channel);

    // 3. Music Bot Panel: Jadwalkan pembaruan embed jika bot musik berpindah voice channel
    musicbot.handleVoiceStateUpdate(oldState, newState);
  },
};