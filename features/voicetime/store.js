/**
 * Pengelolaan penyimpanan data persisten untuk fitur Top Voice (Voicetime).
 * Dipakai oleh: features/voicetime/tracker.js, features/voicetime/panel.js, features/voicetime/handlers.js.
 * Bergantung pada: node:fs, node:path, data/voicetime.json.
 */

// --- Import Modul ---
const fs = require('node:fs');
const path = require('node:path');

// --- Konstanta ---
const FILE_PATH = path.join(__dirname, '..', '..', 'data', 'voicetime.json');

// --- Helper Privat: Muat Data ---
function loadData() {
  try {
    return JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));
  } catch {
    return {};
  }
}

// --- State Penyimpanan ---
const data = loadData();
data.channels ??= {};   // guildId -> { channelId: detik aktif }
data.panels ??= {};     // guildId -> { channelId, messageId }
data.categories ??= {}; // guildId -> [categoryId]
data.excluded ??= {};   // guildId -> [channelId]

let isDirty = false;

// --- Fungsi Publik ---

/**
 * Menyimpan seluruh data voicetime ke file JSON secara sinkron.
 */
function save() {
  fs.mkdirSync(path.dirname(FILE_PATH), { recursive: true });
  fs.writeFileSync(FILE_PATH, JSON.stringify(data));
  isDirty = false;
}

/**
 * Menandai adanya perubahan data yang perlu disimpan ke disk pada tick berikutnya.
 */
function markDirty() {
  isDirty = true;
}

/**
 * Memeriksa apakah ada perubahan yang belum tersimpan.
 * @returns {boolean}
 */
function getDirtyStatus() {
  return isDirty;
}

/**
 * Mengambil daftar ID kategori yang dihitung untuk guild tertentu.
 * @param {string} guildId
 * @returns {string[]}
 */
function getCategories(guildId) {
  return data.categories[guildId] ?? [];
}

/**
 * Menyimpan daftar ID kategori yang dihitung untuk guild tertentu.
 * @param {string} guildId
 * @param {string[]} ids
 */
function setCategories(guildId, ids) {
  data.categories[guildId] = ids;
  save();
}

/**
 * Mengambil daftar ID channel yang dikecualikan untuk guild tertentu.
 * @param {string} guildId
 * @returns {string[]}
 */
function getExcluded(guildId) {
  return data.excluded[guildId] ?? [];
}

/**
 * Menyimpan daftar ID channel yang dikecualikan untuk guild tertentu.
 * @param {string} guildId
 * @param {string[]} ids
 */
function setExcluded(guildId, ids) {
  data.excluded[guildId] = ids;
  save();
}

/**
 * Menyimpan info panel Top Voice untuk guild tertentu.
 * @param {string} guildId
 * @param {string} channelId
 * @param {string} messageId
 */
function setPanel(guildId, channelId, messageId) {
  data.panels[guildId] = { channelId, messageId };
  save();
}

/**
 * Mengambil info panel Top Voice yang tersimpan.
 * @param {string} guildId
 * @returns {{ channelId: string, messageId: string }|undefined}
 */
function getPanel(guildId) {
  return data.panels[guildId];
}

module.exports = {
  data,
  save,
  markDirty,
  getDirtyStatus,
  getCategories,
  setCategories,
  getExcluded,
  setExcluded,
  setPanel,
  getPanel,
};
