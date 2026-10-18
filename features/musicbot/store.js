/**
 * Pengelolaan data persisten untuk fitur Music Bot.
 * Dipakai oleh: features/musicbot/panel.js, features/musicbot/handlers.js.
 * Bergantung pada: features/lounge/store.js (penyimpanan lounge.json).
 */

// --- Import Modul ---
const loungeStore = require('../lounge/store');

// --- Fungsi Publik (Getter & Setter) ---

/**
 * Mengambil ID role bot musik pada guild tertentu.
 * @param {string} guildId - ID server Discord.
 * @returns {string|undefined} ID role bot musik jika ada.
 */
function getRole(guildId) {
  return loungeStore.data.musicRoles?.[guildId];
}

/**
 * Menyimpan ID role bot musik untuk guild tertentu.
 * @param {string} guildId - ID server Discord.
 * @param {string} roleId - ID role yang berisi bot musik.
 */
function setRole(guildId, roleId) {
  loungeStore.data.musicRoles ??= {};
  loungeStore.data.musicRoles[guildId] = roleId;
  loungeStore.save();
}

/**
 * Mengambil data pesan panel bot musik yang tersimpan.
 * @param {string} guildId - ID server Discord.
 * @returns {{ channelId: string, messageId: string }|undefined} Info lokasi pesan panel.
 */
function getPanel(guildId) {
  return loungeStore.data.musicPanels?.[guildId];
}

/**
 * Menyimpan data pesan panel bot musik untuk pembaruan otomatis.
 * @param {string} guildId - ID server Discord.
 * @param {string} channelId - ID channel tempat panel dikirim.
 * @param {string} messageId - ID pesan panel.
 */
function setPanel(guildId, channelId, messageId) {
  loungeStore.data.musicPanels ??= {};
  loungeStore.data.musicPanels[guildId] = { channelId, messageId };
  loungeStore.save();
}

module.exports = {
  getRole,
  setRole,
  getPanel,
  setPanel,
  rawStore: loungeStore,
};
