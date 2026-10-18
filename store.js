const fs = require('node:fs');
const path = require('node:path');
const seed = require('./games');

const FILE = path.join(__dirname, 'data', 'lounge.json');

function load() {
  if (fs.existsSync(FILE)) return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  // Pertama kali jalan: isi dari games.js
  return {
    roomPrefix: seed.roomPrefix,
    categories: JSON.parse(JSON.stringify(seed.categories)),
    panels: {}, // guildId -> { channelId, messageId }
  };
}

const data = load();
data.musicRoles ??= {};  // guildId -> roleId
data.musicPanels ??= {}; // guildId -> { channelId, messageId }

function save() {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

save();
module.exports = { data, save };