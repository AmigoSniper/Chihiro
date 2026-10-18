/**
 * Titik masuk utama (entry point) aplikasi bot Discord ChihiroBot.
 * Dipakai oleh: node index.js / npm start.
 * Bergantung pada: node:fs, node:path, discord.js, config.js akar.
 */

// --- Import Modul ---
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const config = require('./config');

// --- Inisialisasi Klien Discord ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
  ],
});

// --- Inisialisasi State Global Klien ---
// Koleksi slash commands terdaftar
client.commands = new Collection();

// Set penampung ID temporary voice channel Gaming Lounge aktif
client.tempChannels = new Set();

// --- 1. Memuat Seluruh Command dari folder commands/ ---
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if (command?.data?.name && typeof command.execute === 'function') {
    client.commands.set(command.data.name, command);
  } else {
    console.warn(`[Peringatan] Command pada ${file} tidak memiliki properti "data" atau "execute" yang valid.`);
  }
}

// --- 2. Memuat Seluruh Event Listener dari folder events/ ---
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith('.js'));

for (const file of eventFiles) {
  const event = require(path.join(eventsPath, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

// --- 3. Login Bot ke Jaringan Discord ---
client.login(config.token);