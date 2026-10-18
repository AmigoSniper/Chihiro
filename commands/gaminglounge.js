/**
 * Slash command untuk mengelola Gaming Lounge dan pembuatan temporary voice room (/gaminglounge).
 * Dipakai oleh: discord.js command loader di index.js dan interactionCreate.
 * Bergantung pada: discord.js, features/lounge.
 */

// --- Import Modul ---
const {
  PermissionFlagsBits,
  SlashCommandBuilder,
} = require('discord.js');
const lounge = require('../features/lounge');

// --- Definisi Command Data ---
const data = new SlashCommandBuilder()
  .setName('gaminglounge')
  .setDescription('Kelola Gaming Lounge')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .setDMPermission(false)
  .addSubcommand((s) =>
    s.setName('setup').setDescription('Kirim menu Gaming Lounge ke channel ini')
  )
  .addSubcommand((s) =>
    s.setName('daftar').setDescription('Lihat semua kategori dan game')
  )
  .addSubcommandGroup((g) =>
    g
      .setName('kategori')
      .setDescription('Kelola kategori game')
      .addSubcommand((s) =>
        s
          .setName('tambah')
          .setDescription('Tambah kategori baru')
          .addStringOption((o) =>
            o.setName('nama').setDescription('Contoh: Console Game List').setRequired(true).setMaxLength(100)
          )
      )
      .addSubcommand((s) =>
        s
          .setName('hapus')
          .setDescription('Hapus kategori beserta isinya')
          .addStringOption((o) =>
            o.setName('kategori').setDescription('Kategori').setRequired(true).setAutocomplete(true)
          )
      )
  )
  .addSubcommandGroup((g) =>
    g
      .setName('game')
      .setDescription('Kelola game')
      .addSubcommand((s) =>
        s
          .setName('tambah')
          .setDescription('Tambah game ke kategori')
          .addStringOption((o) =>
            o.setName('kategori').setDescription('Kategori').setRequired(true).setAutocomplete(true)
          )
          .addStringOption((o) =>
            o.setName('nama').setDescription('Nama game').setRequired(true).setMaxLength(80)
          )
          .addIntegerOption((o) =>
            o
              .setName('limit')
              .setDescription('Limit user per room (0 = tanpa limit)')
              .setRequired(true)
              .setMinValue(0)
              .setMaxValue(99)
          )
          .addStringOption((o) =>
            o.setName('emoji').setDescription('Emoji unicode atau custom, contoh: 🎮 atau <:apex:123456>')
          )
      )
      .addSubcommand((s) =>
        s
          .setName('hapus')
          .setDescription('Hapus game dari kategori')
          .addStringOption((o) =>
            o.setName('kategori').setDescription('Kategori').setRequired(true).setAutocomplete(true)
          )
          .addStringOption((o) =>
            o.setName('game').setDescription('Game').setRequired(true).setAutocomplete(true)
          )
      )
  );

// --- Eksekusi Interaksi ---

/**
 * Menjalankan command /gaminglounge sesuai subcommand atau grup yang dipilih.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
async function execute(interaction) {
  const group = interaction.options.getSubcommandGroup(false);
  const sub = interaction.options.getSubcommand();

  // 1. Eksekusi subcommand setup
  if (!group && sub === 'setup') {
    return lounge.handleSetup(interaction);
  }

  // 2. Eksekusi subcommand daftar
  if (!group && sub === 'daftar') {
    return lounge.handleDaftar(interaction);
  }

  // 3. Eksekusi grup subcommand kategori
  if (group === 'kategori') {
    return lounge.handleCategoryGroup(interaction, sub);
  }

  // 4. Eksekusi grup subcommand game
  if (group === 'game') {
    return lounge.handleGameGroup(interaction, sub);
  }
}

/**
 * Memberikan saran autocomplete untuk opsi kategori dan game.
 * @param {import('discord.js').AutocompleteInteraction} interaction
 */
async function autocomplete(interaction) {
  return lounge.handleAutocomplete(interaction);
}

/**
 * Menangani pemilihan game dari menu select dropdown Gaming Lounge.
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 */
async function handleSelect(interaction) {
  return lounge.handleSelect(interaction);
}

module.exports = {
  data,
  execute,
  autocomplete,
  handleSelect,
};