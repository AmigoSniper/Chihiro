/**
 * Manajemen penghapusan otomatis temporary room Gaming Lounge yang kosong.
 * Dipakai oleh: events/voiceStateUpdate.js, features/lounge/handlers.js, features/lounge/index.js.
 * Bergantung pada: features/lounge/config.js.
 */

// --- Import Modul ---
const featureConfig = require('./config');

// --- State Privat (Runtime) ---
// Menyimpan timer penghapusan aktif: channelId -> NodeJS.Timeout
const cleanupTimers = new Map();

// --- Fungsi Privat ---

/**
 * Membatalkan timer penghapusan untuk suatu channel jika member kembali masuk.
 * @param {string} channelId
 */
function cancel(channelId) {
  clearTimeout(cleanupTimers.get(channelId));
  cleanupTimers.delete(channelId);
}

// --- Fungsi Publik ---

/**
 * Memeriksa status channel temporary: memulai hitung mundur jika kosong,
 * atau membatalkan hitung mundur jika ada orang di dalamnya.
 * @param {import('discord.js').Client} client - Discord Client.
 * @param {import('discord.js').VoiceBasedChannel|null} channel - Channel voice yang diperiksa.
 */
function check(client, channel) {
  // 1. Abaikan jika channel tidak ada atau bukan room temporary yang terdaftar
  if (!channel || !client.tempChannels.has(channel.id)) return;

  // 2. Jika ada orang di dalam room, batalkan timer penghapusan
  if (channel.members.size > 0) {
    return cancel(channel.id);
  }

  // 3. Jika timer sudah berjalan, jangan buat timer baru
  if (cleanupTimers.has(channel.id)) return;

  // 4. Set timer penghapusan otomatis setelah jeda waktu yang ditentukan
  cleanupTimers.set(
    channel.id,
    setTimeout(async () => {
      cleanupTimers.delete(channel.id);

      // Verifikasi ulang apakah ada member yang baru saja bergabung kembali
      const ch = await client.channels.fetch(channel.id).catch(() => null);
      if (ch && ch.members.size > 0) return;

      // Hapus dari daftar temporary channel dan hapus channel dari server Discord
      client.tempChannels.delete(channel.id);
      if (ch) {
        await ch.delete('Gaming Lounge kosong 1 menit').catch(() => {});
      }
    }, featureConfig.emptyDelayMs)
  );
}

module.exports = {
  check,
  cancel,
};
