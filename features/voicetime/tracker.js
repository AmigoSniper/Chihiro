/**
 * Pelacak sesi durasi voice channel aktif dan sinkronisasi data berkala.
 * Dipakai oleh: events/voiceStateUpdate.js, events/ready.js, features/voicetime/index.js.
 * Bergantung pada: features/voicetime/config.js, features/voicetime/store.js, features/voicetime/helpers.js, features/voicetime/panel.js.
 */

// --- Import Modul ---
const featureConfig = require('./config');
const store = require('./store');
const { isTrackable, countHumans } = require('./helpers');
const { refresh } = require('./panel');

// --- State Privat (Runtime) ---
// Menyimpan waktu mulai sesi aktif: key `${guildId}:${channelId}` -> timestamp (ms)
const activeSessions = new Map();

// --- Fungsi Privat ---

/**
 * Menghitung waktu akumulasi sesi yang sedang berjalan dan menambahkannya ke total durasi channel.
 * @param {string} sessionKey - Kunci sesi `${guildId}:${channelId}`.
 * @param {number} currentTime - Waktu saat ini dalam ms.
 * @param {boolean} keepSession - Jika true, perbarui start time menjadi sekarang. Jika false, hapus sesi.
 */
function flushSession(sessionKey, currentTime, keepSession) {
  const startTime = activeSessions.get(sessionKey);
  if (startTime == null) return;

  const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
  if (elapsedSeconds > 0) {
    const [guildId, channelId] = sessionKey.split(':');
    const guildChannels = (store.data.channels[guildId] ??= {});
    guildChannels[channelId] = (guildChannels[channelId] ?? 0) + elapsedSeconds;
    store.markDirty();
  }

  if (keepSession) {
    activeSessions.set(sessionKey, currentTime);
  } else {
    activeSessions.delete(sessionKey);
  }
}

/**
 * Menyelaraskan status sesi suatu channel dengan kondisi member aktif saat ini.
 * @param {import('discord.js').VoiceBasedChannel} ch - Channel voice.
 * @param {number} currentTime - Timestamp saat ini.
 */
function syncChannel(ch, currentTime) {
  const sessionKey = `${ch.guild.id}:${ch.id}`;
  const isActive = isTrackable(ch) && countHumans(ch) > 0;
  const isSessionStarted = activeSessions.has(sessionKey);

  if (isActive && !isSessionStarted) {
    // 1. Channel baru mulai ada orang aktif -> mulai sesi baru
    activeSessions.set(sessionKey, currentTime);
  } else if (!isActive && isSessionStarted) {
    // 2. Channel tidak lagi aktif -> simpan durasi dan tutup sesi
    flushSession(sessionKey, currentTime, false);
  }
}

/**
 * Menyinkronkan ulang seluruh voice channel pada sebuah server.
 * @param {import('discord.js').Guild} guild
 */
function resyncGuild(guild) {
  const now = Date.now();
  for (const ch of guild.channels.cache.values()) {
    if (ch.isVoiceBased()) {
      syncChannel(ch, now);
    }
  }
}

// --- Fungsi Publik ---

/**
 * Menangani pembaruan voice state dari Discord (member join/leave/mute/deaf).
 * @param {import('discord.js').VoiceState} oldState
 * @param {import('discord.js').VoiceState} newState
 */
function onUpdate(oldState, newState) {
  const now = Date.now();
  // Evaluasi channel sebelum dan sesudah perubahan (menghindari duplikasi jika sama)
  for (const ch of new Set([oldState.channel, newState.channel])) {
    if (ch) syncChannel(ch, now);
  }
}

/**
 * Memulai loop pelacakan voice time saat bot siap (ClientReady).
 * @param {import('discord.js').Client} client
 */
function start(client) {
  const now = Date.now();

  // 1. Mulai pelacakan channel yang sudah terisi member saat bot baru menyala
  for (const guild of client.guilds.cache.values()) {
    for (const ch of guild.channels.cache.values()) {
      if (ch.isVoiceBased()) syncChannel(ch, now);
    }
  }

  // 2. Interval sinkronisasi dan penyimpanan data ke file JSON
  setInterval(() => {
    const t = Date.now();
    for (const guild of client.guilds.cache.values()) {
      resyncGuild(guild);
    }
    for (const key of activeSessions.keys()) {
      flushSession(key, t, true);
    }
    if (store.getDirtyStatus()) {
      store.save();
    }
  }, featureConfig.tickMs);

  // 3. Interval pembaruan tampilan pesan panel embed
  setInterval(() => {
    for (const guild of client.guilds.cache.values()) {
      refresh(client, guild.id);
    }
  }, featureConfig.panelRefreshMs);

  // 4. Pengaman shutdown: simpan waktu berjalan saat bot dimatikan via SIGINT (Ctrl+C)
  process.on('SIGINT', () => {
    const t = Date.now();
    for (const key of activeSessions.keys()) {
      flushSession(key, t, false);
    }
    store.save();
    process.exit(0);
  });
}

module.exports = {
  syncChannel,
  resyncGuild,
  onUpdate,
  start,
};
