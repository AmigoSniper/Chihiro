const {
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} = require('discord.js');
const store = require('../store');
const { buildEmbed, refresh } = require('../musicpanel');

const ephemeral = (content) => ({ content, flags: MessageFlags.Ephemeral });

module.exports = {
  data: new SlashCommandBuilder()
    .setName('musicbot')
    .setDescription('Kelola embed bot musik')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false)
    .addSubcommand((s) =>
      s
        .setName('role')
        .setDescription('Atur role yang berisi bot musik')
        .addRoleOption((o) =>
          o.setName('role').setDescription('Role bot musik').setRequired(true)
        )
    )
    .addSubcommand((s) =>
      s.setName('setup').setDescription('Kirim embed bot musik ke channel ini')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    if (sub === 'role') {
      const role = interaction.options.getRole('role');
      store.data.musicRoles[guildId] = role.id;
      store.save();
      const ok = await refresh(interaction.client, guildId);
      return interaction.reply(
        ephemeral(
          `Role ${role} dipakai sebagai daftar bot musik (${role.members.size} member). ` +
            (ok ? 'Embed diperbarui.' : 'Jalankan `/musicbot setup` di channel tujuan.')
        )
      );
    }

    if (sub === 'setup') {
      if (!store.data.musicRoles[guildId]) {
        return interaction.reply(ephemeral('Atur dulu rolenya dengan `/musicbot role`.'));
      }
      const msg = await interaction.channel.send({ embeds: [buildEmbed(interaction.guild)] });
      store.data.musicPanels[guildId] = { channelId: msg.channelId, messageId: msg.id };
      store.save();
      return interaction.reply(ephemeral('Embed bot musik terkirim. Akan diperbarui otomatis.'));
    }
  },
};