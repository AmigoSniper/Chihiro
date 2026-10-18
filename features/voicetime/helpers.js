/**
 * Fungsi utilitas dan filter untuk channel voice pada fitur Top Voice.
 * Dipakai oleh: features/voicetime/tracker.js, features/voicetime/panel.js.
 * Bergantung pada: features/voicetime/store.js.
 */

// --- Import Modul ---
const store = require('./store');

// --- Fungsi Format Waktu ---

/**
 * Menambahkan padding 0 di depan angka jika kurang dari 2 digit.
 * @param {number} n
 * @returns {string}
 */
const pad = (n) => String(n).padStart(2, '0');

/**
 * Mengubah detik menjadi format jam:menit:detik (H:MM:SS).
 * @param {number} sec - Durasi dalam detik.
 * @returns {string}
 */
const formatHms = (sec) =>
  `${Math.floor(sec / 3600)}:${pad(Math.floor((sec % 3600) / 60))}:${pad(sec % 60)}`;

/**
 * Mengubah detik menjadi format teks kalimat bahasa Indonesia.
 * @param {number} sec - Durasi dalam detik.
 * @returns {string}
 */
const formatFmt = (sec) =>
  `${Math.floor(sec / 3600)} jam ${Math.floor((sec % 3600) / 60)} menit`;

// --- Fungsi Evaluasi Channel ---

/**
 * Menghitung jumlah member manusia (non-bot) di suatu voice channel.
 * @param {import('discord.js').VoiceBasedChannel} ch - Channel voice.
 * @returns {number}
 */
const countHumans = (ch) => ch.members.filter((m) => !m.user.bot).size;

/**
 * Menentukan apakah suatu voice channel memenuhi syarat untuk dihitung waktunya.
 * Syarat: bukan AFK, bukan temporary channel, tidak ada di daftar pengecualian,
 * dan sesuai dengan filter kategori aktif.
 * @param {import('discord.js').VoiceBasedChannel} ch - Channel voice.
 * @returns {boolean}
 */
function isTrackable(ch) {
  // 1. Abaikan jika merupakan AFK channel server
  if (ch.guild.afkChannelId === ch.id) return false;

  // 2. Abaikan jika merupakan temporary room Gaming Lounge
  if (ch.client.tempChannels?.has(ch.id)) return false;

  // 3. Abaikan jika masuk ke dalam daftar channel yang dikecualikan
  const excluded = store.getExcluded(ch.guild.id);
  if (excluded.includes(ch.id)) return false;

  // 4. Periksa filter kategori (jika kosong, semua kategori dihitung)
  const categories = store.getCategories(ch.guild.id);
  return categories.length === 0 || categories.includes(ch.parentId);
}

module.exports = {
  pad,
  formatHms,
  formatFmt,
  countHumans,
  isTrackable,
};
