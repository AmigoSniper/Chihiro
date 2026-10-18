/**
 * Event MessageCreate: Menanggapi mention langsung kepada bot dengan pesan sapaan khas.
 * Dipakai oleh: discord.js event loader di index.js.
 * Bergantung pada: discord.js (Events), config.js akar.
 */

// --- Import Modul ---
const { Events } = require('discord.js');
const rootConfig = require('../config');

// --- Definisi Event ---
module.exports = {
  name: Events.MessageCreate,

  /**
   * Memeriksa pesan masuk dan membalas jika bot di-tag secara langsung.
   * @param {import('discord.js').Message} message
   */
  async execute(message) {
    // 1. Abaikan pesan dari sesama bot atau pesan direct message (DM)
    if (message.author.bot || !message.guild) return;

    // 2. Periksa apakah bot di-mention langsung (abaikan @everyone, role, atau reply pesan)
    const isDirectlyMentioned = message.mentions.has(message.client.user, {
      ignoreEveryone: true,
      ignoreRoles: true,
      ignoreRepliedUser: true,
    });

    if (!isDirectlyMentioned) return;

    // 3. Balas pesan dengan teks sambutan tanpa me-mention balik user
    await message
      .reply({
        content: rootConfig.mentionReplyText,
        allowedMentions: { repliedUser: false },
      })
      .catch(() => {});
  },
};