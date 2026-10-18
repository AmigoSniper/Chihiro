/**
 * Slash command untuk mengelola leaderboard aktivitas voice channel (/topvoice).
 * Dipakai oleh: discord.js command loader di index.js dan interactionCreate.
 * Bergantung pada: discord.js, features/voicetime.
 */

// --- Import Modul ---
const {
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} = require('discord.js');
const voicetime = require('../features/voicetime');

// --- Konstanta Jenis Channel ---
const CATEGORY_CHANNEL_TYPES = [ChannelType.GuildCategory];
const VOICE_CHANNEL_TYPES = [ChannelType.GuildVoice, ChannelType.GuildStageVoice];

// --- Definisi Command Data ---
const data = new SlashCommandBuilder()
  .setName('topvoice')
  .setDescription('Kelola embed top voice')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .setDMPermission(false)
  .addSubcommand((s) =>
    s.setName('setup').setDescription('Kirim embed Top Voice ke channel ini')
  )
  .addSubcommandGroup((g) =>
    g
      .setName('kategori')
      .setDescription('Atur kategori yang dihitung')
      .addSubcommand((s) =>
        voicetime.addChannels(
          s.setName('tambah').setDescription('Hitung voice di kategori ini (maks. 5 sekaligus)'),
          'kategori',
          'Kategori voice channel',
          CATEGORY_CHANNEL_TYPES
        )
      )
      .addSubcommand((s) =>
        voicetime.addChannels(
          s.setName('hapus').setDescription('Berhenti menghitung kategori ini (maks. 5 sekaligus)'),
          'kategori',
          'Kategori voice channel',
          CATEGORY_CHANNEL_TYPES
        )
      )
      .addSubcommand((s) =>
        s.setName('daftar').setDescription('Lihat kategori yang dihitung')
      )
      .addSubcommand((s) =>
        s.setName('semua').setDescription('Hitung semua voice channel (hapus filter)')
      )
  )
  .addSubcommandGroup((g) =>
    g
      .setName('kecuali')
      .setDescription('Atur voice yang dikecualikan')
      .addSubcommand((s) =>
        voicetime.addChannels(
          s.setName('tambah').setDescription('Jangan hitung voice ini (maks. 5 sekaligus)'),
          'voice',
          'Voice channel',
          VOICE_CHANNEL_TYPES
        )
      )
      .addSubcommand((s) =>
        voicetime.addChannels(
          s.setName('hapus').setDescription('Hitung kembali voice ini (maks. 5 sekaligus)'),
          'voice',
          'Voice channel',
          VOICE_CHANNEL_TYPES
        )
      )
      .addSubcommand((s) =>
        s.setName('daftar').setDescription('Lihat voice yang dikecualikan')
      )
  );

// --- Eksekusi Interaksi ---

/**
 * Menjalankan command /topvoice sesuai subcommand dan grup yang dipilih.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
async function execute(interaction) {
  const group = interaction.options.getSubcommandGroup(false);
  const sub = interaction.options.getSubcommand();

  // 1. Eksekusi subcommand setup
  if (!group && sub === 'setup') {
    return voicetime.handleSetup(interaction);
  }

  // 2. Eksekusi grup subcommand kategori
  if (group === 'kategori') {
    return voicetime.handleCategoryGroup(interaction, sub);
  }

  // 3. Eksekusi grup subcommand kecuali
  if (group === 'kecuali') {
    return voicetime.handleExcludedGroup(interaction, sub);
  }
}

module.exports = {
  data,
  execute,
};