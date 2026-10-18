/**
 * Pembuatan komponen menu dropdown interaktif untuk Gaming Lounge dan pembaruan panel.
 * Dipakai oleh: features/lounge/handlers.js, features/lounge/index.js.
 * Bergantung pada: discord.js, features/lounge/store.js, features/lounge/config.js.
 */

// --- Import Modul ---
const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const store = require('./store');
const featureConfig = require('./config');

// --- Fungsi Parsing & Utilitas ---

/**
 * Mem-parse string emoji menjadi objek emoji Discord (baik custom emoji maupun unicode).
 * @param {string|null|undefined} emojiString - String emoji masukan.
 * @returns {{ animated?: boolean, name: string, id?: string }}
 */
function parseEmoji(emojiString) {
  const customEmojiMatch = /^<(a?):(\w+):(\d+)>$/.exec(emojiString ?? '');
  if (customEmojiMatch) {
    return {
      animated: Boolean(customEmojiMatch[1]),
      name: customEmojiMatch[2],
      id: customEmojiMatch[3],
    };
  }
  return { name: emojiString || '🎮' };
}

// --- Fungsi Pembangun Komponen ---

/**
 * Menyusun deretan ActionRow berisi StringSelectMenu untuk setiap kategori game aktif.
 * Maksimal 5 baris komponen per pesan dan 25 opsi per menu (batasan Discord API).
 * @returns {ActionRowBuilder<StringSelectMenuBuilder>[]}
 */
function buildMenus() {
  return Object.entries(store.data.categories)
    .filter(([, category]) => category.games.length > 0)
    .slice(0, featureConfig.maxCategories)
    .map(([categoryKey, category]) =>
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`gaming:${categoryKey}`)
          .setPlaceholder(category.label)
          .addOptions(
            [...category.games]
              .sort((a, b) => a.name.localeCompare(b.name, 'id', { sensitivity: 'base', numeric: true }))
              .slice(0, featureConfig.maxGamesPerMenu)
              .map((game) => ({
                label: game.name.slice(0, 100),
                description: game.limit ? `Limit Room: ${game.limit} users` : 'Tanpa limit',
                value: game.id,
                emoji: parseEmoji(game.emoji),
              }))
          )
      )
    );
}

/**
 * Memperbarui komponen menu pada pesan panel Gaming Lounge di server.
 * @param {import('discord.js').Client} client - Discord Client.
 * @param {string} guildId - ID server Discord.
 * @returns {Promise<boolean>} True jika pesan berhasil diedit, false jika belum ada/gagal.
 */
async function refreshPanel(client, guildId) {
  const panel = store.data.panels[guildId];
  if (!panel) return false;

  try {
    const channel = await client.channels.fetch(panel.channelId);
    const msg = await channel.messages.fetch(panel.messageId);
    await msg.edit({ components: buildMenus() });
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  parseEmoji,
  buildMenus,
  refreshPanel,
};
