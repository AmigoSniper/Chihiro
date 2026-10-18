/**
 * Pembuatan embed leaderboard Top Voice dan pembaruan pesan panel.
 * Dipakai oleh: features/voicetime/tracker.js, commands/topvoice.js, features/voicetime/index.js.
 * Bergantung pada: discord.js, features/voicetime/config.js, features/voicetime/store.js, features/voicetime/helpers.js.
 */

// --- Import Modul ---
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const featureConfig = require('./config');
const store = require('./store');
const { formatHms, countHumans, isTrackable } = require('./helpers');

// --- Konstanta ---
const EMBED_COLOR = 0xf5b942;
const MINIMUM_DURATION_SECONDS = 60; // hanya tampil jika aktif minimal 1 menit

// --- Fungsi Publik ---

/**
 * Menyusun embed Leaderboard Top Voice untuk server tertentu.
 * @param {import('discord.js').Guild} guild - Server Discord.
 * @returns {EmbedBuilder} Embed Discord siap kirim.
 */
function buildEmbed(guild) {
  // 1. Ambil seluruh data durasi channel pada server ini
  const channelData = store.data.channels[guild.id] ?? {};

  // 2. Filter hanya channel yang ada, memenuhi syarat, dan aktif >= 60 detik
  const rows = Object.entries(channelData)
    .filter(([id, seconds]) => {
      const ch = guild.channels.cache.get(id);
      return seconds >= MINIMUM_DURATION_SECONDS && ch && isTrackable(ch);
    })
    .sort((a, b) => b[1] - a[1])
    .slice(0, featureConfig.topCount);

  // 3. Susun baris per channel
  const lines = rows.map(([id, seconds], i) => {
    const ch = guild.channels.cache.get(id);
    // Catatan: permission 'open' dihitung pada kode asli namun belum ditampilkan pada string output
    const open = ch.permissionsFor(guild.roles.everyone)?.has(PermissionFlagsBits.Connect);
    const rank = featureConfig.medals[i] ?? `**${i + 1}.**`;
    const activeHumans = countHumans(ch);
    return `${rank} ${ch}\n👥 \`${activeHumans}\` Member • ⏱️ \`${formatHms(seconds)}\``;
  });

  // 4. Susun deskripsi lengkap embed
  const body = rows.length > 0 ? lines.join('\n\n') : '_Belum ada data voice._';
  const desc = `# 🏆 TOP ${featureConfig.topCount} Voice Channels\n## 🏅 Top 1-${featureConfig.topCount}\n${body}`;

  return new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setDescription(desc)
    .setFooter({ text: 'Diperbarui tiap 5 menit' })
    .setTimestamp();
}

/**
 * Memperbarui embed pada pesan panel Top Voice yang tersimpan di server.
 * @param {import('discord.js').Client} client
 * @param {string} guildId
 * @returns {Promise<boolean>}
 */
async function refresh(client, guildId) {
  const panel = store.getPanel(guildId);
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

module.exports = {
  buildEmbed,
  refresh,
};
