/**
 * Pembuatan embed status bot musik dan penjadwalan pembaruan pesan panel.
 * Dipakai oleh: features/musicbot/handlers.js, features/musicbot/index.js.
 * Bergantung pada: discord.js (EmbedBuilder), features/musicbot/config.js, features/musicbot/store.js.
 */

// --- Import Modul ---
const { EmbedBuilder } = require('discord.js');
const featureConfig = require('./config');
const featureStore = require('./store');

// --- Konstanta ---
const EMBED_COLOR = 0xe8575a;
const MAX_EMBED_DESC_LENGTH = 4000; // batas aman Discord (maksimal 4096 karakter)
const TRUNCATE_LENGTH = 3997;

// --- State Privat (Runtime) ---
const refreshTimers = new Map(); // guildId -> NodeJS.Timeout

// --- Fungsi Publik ---

/**
 * Mengambil daftar member yang memiliki role bot musik, diurutkan menurut nama tampilan.
 * @param {import('discord.js').Guild} guild - Objek server Discord.
 * @returns {import('discord.js').GuildMember[]|null} Daftar member atau null jika role belum disetel.
 */
function getBots(guild) {
  // 1. Ambil ID role yang tersimpan untuk server ini
  const roleId = featureStore.getRole(guild.id);
  const role = roleId && guild.roles.cache.get(roleId);
  if (!role) return null; // role belum diatur atau sudah terhapus

  // 2. Ambil member dan urutkan secara alfabetis agar posisi baris konsisten
  return [...role.members.values()].sort((a, b) =>
    a.displayName.localeCompare(b.displayName, 'id', { numeric: true })
  );
}

/**
 * Menyusun embed status ketersediaan bot musik.
 * @param {import('discord.js').Guild} guild - Objek server Discord.
 * @returns {EmbedBuilder} Embed Discord yang siap dikirim.
 */
function buildEmbed(guild) {
  const bots = getBots(guild);

  let desc;
  if (!bots) {
    desc = '_Role bot musik belum diatur. Pakai `/musicbot role`._';
  } else if (bots.length === 0) {
    desc = '_Tidak ada member dengan role ini._';
  } else {
    desc = bots
      .map((m) => {
        const voiceChannelId = guild.voiceStates.cache.get(m.id)?.channelId;
        return voiceChannelId
          ? `${featureConfig.iconBusy} | ${m.displayName} → <#${voiceChannelId}>`
          : `${featureConfig.iconFree} | ${m.displayName}`;
      })
      .join('\n');

    if (desc.length > MAX_EMBED_DESC_LENGTH) {
      desc = desc.slice(0, TRUNCATE_LENGTH) + '...';
    }
  }

  return new EmbedBuilder()
    .setTitle('Available Music Bot')
    .setColor(EMBED_COLOR)
    .setDescription(desc)
    .setFooter({ text: 'Diperbarui otomatis' })
    .setTimestamp();
}

/**
 * Memperbarui isi embed pada pesan panel bot musik yang sudah terkirim.
 * @param {import('discord.js').Client} client - Discord Client.
 * @param {string} guildId - ID server Discord.
 * @returns {Promise<boolean>} True jika berhasil diperbarui, false jika gagal atau panel belum ada.
 */
async function refresh(client, guildId) {
  const panel = featureStore.getPanel(guildId);
  if (!panel) return false;

  try {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return false;

    const channel = await client.channels.fetch(panel.channelId);
    const msg = await channel.messages.fetch(panel.messageId);
    await msg.edit({ embeds: [buildEmbed(guild)] });
    return true;
  } catch {
    return false;
  }
}

/**
 * Menjadwalkan pembaruan embed dengan jeda debounce agar rentetan perubahan tidak memicu spam edit.
 * @param {import('discord.js').Client} client - Discord Client.
 * @param {string} guildId - ID server Discord.
 */
function schedule(client, guildId) {
  clearTimeout(refreshTimers.get(guildId));
  refreshTimers.set(
    guildId,
    setTimeout(() => {
      refreshTimers.delete(guildId);
      refresh(client, guildId);
    }, featureConfig.debounceMs)
  );
}

module.exports = {
  getBots,
  buildEmbed,
  refresh,
  schedule,
};
