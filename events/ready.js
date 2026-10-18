/**
 * Event ClientReady: Inisialisasi awal saat bot berhasil login ke Discord.
 * Dipakai oleh: discord.js event loader di index.js.
 * Bergantung pada: discord.js, config.js akar, features/musicbot, features/voicetime.
 */

// --- Import Modul ---
const { Events, ActivityType } = require('discord.js');
const rootConfig = require('../config');
const musicbot = require('../features/musicbot');
const voicetime = require('../features/voicetime');

// --- Definisi Event ---
module.exports = {
  name: Events.ClientReady,
  once: true,

  /**
   * Menjalankan prosedur startup setelah bot online.
   * @param {import('discord.js').Client} client
   */
  async execute(client) {
    // 1. Daftarkan semua slash command ke Discord Application API secara global
    await client.application.commands.set(
      client.commands.map((command) => command.data.toJSON())
    );

    // 2. Fetch seluruh member server untuk cache role bot musik, lalu refresh panel musik awal
    for (const guild of client.guilds.cache.values()) {
      try {
        await guild.members.fetch();
      } catch (err) {
        console.warn(`Gagal fetch member ${guild.name}:`, err.message);
      }
      await musicbot.refresh(client, guild.id);
    }

    // 3. Mulai sistem pelacakan durasi voice channel (Top Voice)
    voicetime.start(client);

    // 4. Pasang status presence bot
    client.user.setPresence({
      status: 'idle',
      activities: [
        {
          name: 'custom', // wajib diisi oleh discord.js, namun tidak ditampilkan
          type: ActivityType.Custom,
          state: rootConfig.botStatusText,
        },
      ],
    });

    console.log(`Login sebagai ${client.user.tag}`);
  },
};