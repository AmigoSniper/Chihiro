const { EmbedBuilder } = require('discord.js');
const store = require('./store');

const ICON_FREE = '✅'; // tidak ada di voice
const ICON_BUSY = '❌'; // sedang di voice

// Semua member yang punya role bot musik, urut nama supaya posisi baris tetap
function getBots(guild) {
  const roleId = store.data.musicRoles[guild.id];
  const role = roleId && guild.roles.cache.get(roleId);
  if (!role) return null; // role belum diatur / terhapus
  return [...role.members.values()].sort((a, b) =>
    a.displayName.localeCompare(b.displayName, 'id', { numeric: true })
  );
}

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
        const vc = guild.voiceStates.cache.get(m.id)?.channelId;
        return vc
          ? `${ICON_BUSY} | ${m.displayName} → <#${vc}>`
          : `${ICON_FREE} | ${m.displayName}`;
      })
      .join('\n');
    if (desc.length > 4000) desc = desc.slice(0, 3997) + '...';
  }

  return new EmbedBuilder()
    .setTitle('Available Music Bot')
    .setColor(0xe8575a)
    .setDescription(desc)
    .setFooter({ text: 'Diperbarui otomatis' })
    .setTimestamp();
}

async function refresh(client, guildId) {
  const p = store.data.musicPanels[guildId];
  if (!p) return false;
  try {
    const guild = client.guilds.cache.get(guildId);
    const channel = await client.channels.fetch(p.channelId);
    const msg = await channel.messages.fetch(p.messageId);
    await msg.edit({ embeds: [buildEmbed(guild)] });
    return true;
  } catch {
    return false;
  }
}

// Tunda 2 detik supaya banyak perubahan beruntun hanya jadi satu edit
const timers = new Map();
function schedule(client, guildId) {
  clearTimeout(timers.get(guildId));
  timers.set(
    guildId,
    setTimeout(() => {
      timers.delete(guildId);
      refresh(client, guildId);
    }, 2000)
  );
}

module.exports = { buildEmbed, refresh, schedule };