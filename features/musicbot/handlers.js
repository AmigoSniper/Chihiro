/**
 * Penangan event dan eksekusi command yang berkaitan dengan bot musik.
 * Dipakai oleh: commands/musicbot.js, events/voiceStateUpdate.js, events/guildMemberUpdate.js, features/musicbot/index.js.
 * Bergantung pada: discord.js (MessageFlags), features/musicbot/store.js, features/musicbot/panel.js.
 */

// --- Import Modul ---
const { MessageFlags } = require('discord.js');
const featureStore = require('./store');
const { buildEmbed, refresh, schedule } = require('./panel');

// --- Helper Privat ---
const createEphemeralMessage = (content) => ({ content, flags: MessageFlags.Ephemeral });

// --- Fungsi Publik ---

/**
 * Memeriksa apakah suatu voice state berasal dari member dengan role bot musik.
 * @param {import('discord.js').VoiceState} state - Voice state yang diperiksa.
 * @returns {boolean} True jika member memiliki role bot musik.
 */
function isMusicBot(state) {
  const roleId = featureStore.getRole(state.guild.id);
  return Boolean(roleId && state.member?.roles.cache.has(roleId));
}

/**
 * Menangani perubahan voice state untuk bot musik (masuk/keluar/pindah voice).
 * @param {import('discord.js').VoiceState} oldState - Voice state sebelumnya.
 * @param {import('discord.js').VoiceState} newState - Voice state terbaru.
 */
function handleVoiceStateUpdate(oldState, newState) {
  const isChannelChanged = oldState.channelId !== newState.channelId;
  const isRelevantBot = isMusicBot(oldState) || isMusicBot(newState);

  if (isChannelChanged && isRelevantBot) {
    schedule(newState.client, newState.guild.id);
  }
}

/**
 * Menangani perubahan member (role bot musik ditambahkan/dihapus atau nama diganti).
 * @param {import('discord.js').GuildMember} oldMember - Data member sebelum update.
 * @param {import('discord.js').GuildMember} newMember - Data member setelah update.
 */
function handleGuildMemberUpdate(oldMember, newMember) {
  const roleId = featureStore.getRole(newMember.guild.id);
  if (!roleId) return;

  const hadRole = oldMember.roles.cache.has(roleId);
  const hasRole = newMember.roles.cache.has(roleId);
  const isRenamed = oldMember.displayName !== newMember.displayName;

  if (hadRole !== hasRole || (hasRole && isRenamed)) {
    schedule(newMember.client, newMember.guild.id);
  }
}

/**
 * Menjalankan subcommand `/musicbot role`.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction - Objek interaksi slash command.
 */
async function handleRoleCommand(interaction) {
  // 1. Ambil opsi role dari input user
  const role = interaction.options.getRole('role');
  const guildId = interaction.guildId;

  // 2. Simpan role ke store
  featureStore.setRole(guildId, role.id);

  // 3. Coba perbarui embed jika panel sudah aktif
  const isRefreshed = await refresh(interaction.client, guildId);

  // 4. Berikan pesan respon ephemeral
  return interaction.reply(
    createEphemeralMessage(
      `Role ${role} dipakai sebagai daftar bot musik (${role.members.size} member). ` +
        (isRefreshed ? 'Embed diperbarui.' : 'Jalankan `/musicbot setup` di channel tujuan.')
    )
  );
}

/**
 * Menjalankan subcommand `/musicbot setup`.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction - Objek interaksi slash command.
 */
async function handleSetupCommand(interaction) {
  const guildId = interaction.guildId;

  // 1. Validasi apakah role bot musik sudah disetel
  if (!featureStore.getRole(guildId)) {
    return interaction.reply(createEphemeralMessage('Atur dulu rolenya dengan `/musicbot role`.'));
  }

  // 2. Kirim embed ke channel saat ini
  const msg = await interaction.channel.send({ embeds: [buildEmbed(interaction.guild)] });

  // 3. Simpan koordinat panel ke store
  featureStore.setPanel(guildId, msg.channelId, msg.id);

  // 4. Balas user bahwa panel sudah siap
  return interaction.reply(createEphemeralMessage('Embed bot musik terkirim. Akan diperbarui otomatis.'));
}

module.exports = {
  isMusicBot,
  handleVoiceStateUpdate,
  handleGuildMemberUpdate,
  handleRoleCommand,
  handleSetupCommand,
};
