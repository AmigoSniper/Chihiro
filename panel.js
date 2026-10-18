const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const store = require('./store');

function parseEmoji(e) {
  const m = /^<(a?):(\w+):(\d+)>$/.exec(e ?? '');
  if (m) return { animated: !!m[1], name: m[2], id: m[3] };
  return { name: e || '🎮' };
}

// Satu menu per kategori yang punya game (maks. 5 baris per pesan)
function buildMenus() {
  return Object.entries(store.data.categories)
    .filter(([, cat]) => cat.games.length > 0)
    .slice(0, 5)
    .map(([key, cat]) =>
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`gaming:${key}`)
          .setPlaceholder(cat.label)
          .addOptions(
            [...cat.games]
                .sort((a, b) => a.name.localeCompare(b.name, 'id', { sensitivity: 'base', numeric: true }))
                .slice(0, 25)
                .map((g) => ({
                label: g.name.slice(0, 100),
                description: g.limit ? `Limit Room: ${g.limit} users` : 'Tanpa limit',
                value: g.id,
                emoji: parseEmoji(g.emoji),
                }))
            )
      )
    );
}

// Perbarui menu di pesan panel. Return false jika panel belum ada / pesan terhapus.
async function refreshPanel(client, guildId) {
  const p = store.data.panels[guildId];
  if (!p) return false;
  try {
    const channel = await client.channels.fetch(p.channelId);
    const msg = await channel.messages.fetch(p.messageId);
    await msg.edit({ components: buildMenus() });
    return true;
  } catch {
    return false;
  }
}

module.exports = { buildMenus, refreshPanel, parseEmoji };