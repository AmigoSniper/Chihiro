const { Events } = require('discord.js');

const BALASAN = '🎀 Ehh~ Chihiro dipanggil nih! Ada apa, sayang? ♡';

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot || !message.guild) return;

    // Hanya kalau bot di-tag langsung (bukan @everyone, @here, atau tag role)
    const ditag = message.mentions.has(message.client.user, {
      ignoreEveryone: true,
      ignoreRoles: true,
      ignoreRepliedUser: true, // membalas pesan bot tidak dihitung sebagai tag
    });
    if (!ditag) return;

    await message
      .reply({ content: BALASAN, allowedMentions: { repliedUser: false } })
      .catch(() => {});
  },
};