/**
 * Pintu masuk utama (API publik) untuk fitur Music Bot.
 * Dipakai oleh: commands/musicbot.js, events/ready.js, events/voiceStateUpdate.js, events/guildMemberUpdate.js.
 * Bergantung pada: features/musicbot/panel.js, features/musicbot/handlers.js, features/musicbot/store.js.
 */

// --- Import Modul Fitur ---
const panel = require('./panel');
const handlers = require('./handlers');
const store = require('./store');

// --- Ekspor API Publik ---
module.exports = {
  // Panel & Embed
  buildEmbed: panel.buildEmbed,
  refresh: panel.refresh,
  schedule: panel.schedule,
  getBots: panel.getBots,

  // Event & Command Handlers
  isMusicBot: handlers.isMusicBot,
  handleVoiceStateUpdate: handlers.handleVoiceStateUpdate,
  handleGuildMemberUpdate: handlers.handleGuildMemberUpdate,
  handleRoleCommand: handlers.handleRoleCommand,
  handleSetupCommand: handlers.handleSetupCommand,

  // Penyimpanan Data
  store,
};
