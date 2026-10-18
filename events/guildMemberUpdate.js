/**
 * Event GuildMemberUpdate: Menangani perubahan peran (role) dan nama tampilan (nickname) member.
 * Dipakai oleh: discord.js event loader di index.js.
 * Bergantung pada: discord.js, features/musicbot.
 */

// --- Import Modul ---
const { Events } = require('discord.js');
const musicbot = require('../features/musicbot');

// --- Definisi Event ---
module.exports = {
  name: Events.GuildMemberUpdate,

  /**
   * Mengalirkan event pembaruan member ke fitur bot musik.
   * @param {import('discord.js').GuildMember} oldMember
   * @param {import('discord.js').GuildMember} newMember
   */
  async execute(oldMember, newMember) {
    // Memeriksa dan memperbarui panel jika role bot musik bertambah/berkurang atau bot berganti nama
    musicbot.handleGuildMemberUpdate(oldMember, newMember);
  },
};