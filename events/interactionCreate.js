/**
 * Event InteractionCreate: Router utama interaksi Discord (slash command, autocomplete, select menu).
 * Dipakai oleh: discord.js event loader di index.js.
 * Bergantung pada: discord.js (Events, MessageFlags).
 */

// --- Import Modul ---
const { Events, MessageFlags } = require('discord.js');

// --- Definisi Event ---
module.exports = {
  name: Events.InteractionCreate,

  /**
   * Menangani dan mengarahkan interaksi yang masuk ke handler yang tepat.
   * @param {import('discord.js').Interaction} interaction
   */
  async execute(interaction) {
    try {
      // 1. Rute untuk permintaan autocomplete opsi command
      if (interaction.isAutocomplete()) {
        const command = interaction.client.commands.get(interaction.commandName);
        return await command?.autocomplete?.(interaction);
      }

      // 2. Rute untuk eksekusi slash command (/command)
      if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return;
        return await command.execute(interaction);
      }

      // 3. Rute untuk pemilihan dropdown Gaming Lounge
      if (interaction.isStringSelectMenu() && interaction.customId.startsWith('gaming:')) {
        const gamingLoungeCommand = interaction.client.commands.get('gaminglounge');
        return await gamingLoungeCommand?.handleSelect?.(interaction);
      }
    } catch (err) {
      console.error(err);

      // Autocomplete tidak dapat membalas pesan teks
      if (interaction.isAutocomplete()) return;

      const errorMessage = {
        content: 'Terjadi error saat menjalankan command.',
        flags: MessageFlags.Ephemeral,
      };

      // Tangani respon error sesuai kondisi interaksi saat ini
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage).catch(() => {});
      } else {
        await interaction.reply(errorMessage).catch(() => {});
      }
    }
  },
};