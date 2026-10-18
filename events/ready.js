const { Events, ActivityType } = require('discord.js');
const store = require('../store');
const musicPanel = require('../musicpanel');
const voicetime = require('../voicetime');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    await client.application.commands.set(
      client.commands.map((c) => c.data.toJSON())
    );
    for (const guild of client.guilds.cache.values()) {
        try {
          await guild.members.fetch(); // sekali saja saat start
        } catch (err) {
          console.warn(`Gagal fetch member ${guild.name}:`, err.message);
        }
        await musicPanel.refresh(client, guild.id);
      }
    voicetime.start(client);
    client.user.setPresence({
    status: 'idle',
    activities: [
      {
        name: 'custom', // wajib diisi, tapi tidak ditampilkan
        type: ActivityType.Custom,
        state: '🎀 ୨୧ lovely moments with Chihiro ♡', // teks yang tampil
      },
    ],
  });
    console.log(`Login sebagai ${client.user.tag}`);
  },
};