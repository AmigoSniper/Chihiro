const { Events, MessageFlags } = require('discord.js');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    try {
      if (interaction.isAutocomplete()) {
        const command = interaction.client.commands.get(interaction.commandName);
        return await command?.autocomplete?.(interaction);
      }

      if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return;
        return await command.execute(interaction);
      }

      if (interaction.isStringSelectMenu() && interaction.customId.startsWith('gaming:')) {
        return await interaction.client.commands.get('gaminglounge').handleSelect(interaction);
      }
    } catch (err) {
      console.error(err);
      if (interaction.isAutocomplete()) return;
      const msg = {
        content: 'Terjadi error saat menjalankan command.',
        flags: MessageFlags.Ephemeral,
      };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(msg).catch(() => {});
      } else {
        await interaction.reply(msg).catch(() => {});
      }
    }
  },
};