/**
 * Pengelolaan data persisten untuk Gaming Lounge dan data bersama pada lounge.json.
 * Dipakai oleh: features/lounge/panel.js, features/lounge/handlers.js, features/musicbot/store.js.
 * Bergantung pada: node:fs, node:path, features/lounge/games.js, data/lounge.json.
 */

// --- Import Modul ---
const fs = require('node:fs');
const path = require('node:path');
const seed = require('./games');

// --- Konstanta ---
const FILE_PATH = path.join(__dirname, '..', '..', 'data', 'lounge.json');

// --- Helper Privat: Muat Data ---
function loadData() {
  if (fs.existsSync(FILE_PATH)) {
    return JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));
  }
  // Pertama kali dijalankan: inisialisasi dari seed games
  return {
    roomPrefix: seed.roomPrefix,
    categories: JSON.parse(JSON.stringify(seed.categories)),
    panels: {}, // guildId -> { channelId, messageId }
  };
}

// --- State Penyimpanan ---
const data = loadData();
data.musicRoles ??= {};  // guildId -> roleId
data.musicPanels ??= {}; // guildId -> { channelId, messageId }

// --- Fungsi Publik ---

/**
 * Menyimpan seluruh data lounge dan bot musik ke file lounge.json secara sinkron.
 */
function save() {
  fs.mkdirSync(path.dirname(FILE_PATH), { recursive: true });
  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
}

// Inisialisasi awal file jika belum ada
save();

module.exports = {
  data,
  save,
};
