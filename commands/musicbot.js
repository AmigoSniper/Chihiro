/**
 * Slash command untuk mengelola panel status bot musik server (/musicbot).
 * Dipakai oleh: discord.js command loader di index.js dan interactionCreate.
 * Bergantung pada: discord.js, features/musicbot.
 */

// --- Import Modul ---
const {
  PermissionFlagsBits,
  SlashCommandBuilder,
} = require('discord.js');
const musicbot = require('../features/musicbot');

// --- Definisi Command Data ---
const data = new SlashCommandBuilder()
  .setName('musicbot')
  .setDescription('Kelola embed bot musik')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .setDMPermission(false)
  .addSubcommand((s) =>
    s
      .setName('role')
      .setDescription('Atur role yang berisi bot musik')
      .addRoleOption((o) =>
        o.setName('role').setDescription('Role bot musik').setRequired(true)
      )
  )
  .addSubcommand((s) =>
    s.setName('setup').setDescription('Kirim embed bot musik ke channel ini')
  );

// --- Eksekusi Interaksi ---

/**
 * Menjalankan command /musicbot sesuai subcommand yang dipilih.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
async function execute(interaction) {
  const sub = interaction.options.getSubcommand();

  // 1. Tangani pemilihan role bot musik
  if (sub === 'role') {
    return musicbot.handleRoleCommand(interaction);
  }

  // 2. Tangani pengiriman panel embed bot musik
  if (sub === 'setup') {
    return musicbot.handleSetupCommand(interaction);
  }
}

module.exports = {
  data,
  execute,
};