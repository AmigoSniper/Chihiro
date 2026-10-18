const {
  ChannelType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} = require('discord.js');
const voicetime = require('../voicetime');

const ephemeral = (content) => ({ content, flags: MessageFlags.Ephemeral });

const MAX_PICK = 5; // jumlah opsi channel per perintah

// Tambah opsi channel berurutan: base, base2, ... base5 (hanya yang pertama wajib)
function addChannels(sub, base, desc, types) {
  for (let i = 1; i <= MAX_PICK; i++) {
    sub.addChannelOption((o) =>
      o
        .setName(i === 1 ? base : `${base}${i}`)
        .setDescription(i === 1 ? desc : `${desc} (tambahan ${i})`)
        .addChannelTypes(...types)
        .setRequired(i === 1)
    );
  }
  return sub;
}

// Ambil semua channel yang diisi, tanpa duplikat
function picked(interaction, base) {
  const map = new Map();
  for (let i = 1; i <= MAX_PICK; i++) {
    const ch = interaction.options.getChannel(i === 1 ? base : `${base}${i}`);
    if (ch) map.set(ch.id, ch);
  }
  return [...map.values()];
}

const names = (list) => list.map((c) => `**${c.name}**`).join(', ');
const bullets = (ids) => ids.map((id) => `• <#${id}>`).join('\n');

const CATEGORY = [ChannelType.GuildCategory];
const VOICE = [ChannelType.GuildVoice, ChannelType.GuildStageVoice];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('topvoice')
    .setDescription('Kelola embed top voice')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false)
    .addSubcommand((s) =>
      s.setName('setup').setDescription('Kirim embed Top Voice ke channel ini')
    )
    .addSubcommandGroup((g) =>
      g
        .setName('kategori')
        .setDescription('Atur kategori yang dihitung')
        .addSubcommand((s) =>
          addChannels(
            s.setName('tambah').setDescription('Hitung voice di kategori ini (maks. 5 sekaligus)'),
            'kategori',
            'Kategori voice channel',
            CATEGORY
          )
        )
        .addSubcommand((s) =>
          addChannels(
            s.setName('hapus').setDescription('Berhenti menghitung kategori ini (maks. 5 sekaligus)'),
            'kategori',
            'Kategori voice channel',
            CATEGORY
          )
        )
        .addSubcommand((s) =>
          s.setName('daftar').setDescription('Lihat kategori yang dihitung')
        )
        .addSubcommand((s) =>
          s.setName('semua').setDescription('Hitung semua voice channel (hapus filter)')
        )
    )
    .addSubcommandGroup((g) =>
      g
        .setName('kecuali')
        .setDescription('Atur voice yang dikecualikan')
        .addSubcommand((s) =>
          addChannels(
            s.setName('tambah').setDescription('Jangan hitung voice ini (maks. 5 sekaligus)'),
            'voice',
            'Voice channel',
            VOICE
          )
        )
        .addSubcommand((s) =>
          addChannels(
            s.setName('hapus').setDescription('Hitung kembali voice ini (maks. 5 sekaligus)'),
            'voice',
            'Voice channel',
            VOICE
          )
        )
        .addSubcommand((s) =>
          s.setName('daftar').setDescription('Lihat voice yang dikecualikan')
        )
    ),

  async execute(interaction) {
    const group = interaction.options.getSubcommandGroup(false);
    const sub = interaction.options.getSubcommand();
    const { guild, guildId } = interaction;

    const note = async () =>
      (await voicetime.refresh(interaction.client, guildId))
        ? 'Embed diperbarui.'
        : 'Belum ada embed aktif. Jalankan `/topvoice setup`.';

    // /topvoice setup
    if (!group && sub === 'setup') {
      const msg = await interaction.channel.send({
        embeds: [voicetime.buildEmbed(guild)],
      });
      voicetime.setPanel(guildId, msg.channelId, msg.id);
      return interaction.reply(
        ephemeral('Embed Top Voice terkirim. Akan diperbarui otomatis tiap 5 menit.')
      );
    }

    // /topvoice kategori ...
    if (group === 'kategori') {
      const current = voicetime.getCategories(guildId);

      if (sub === 'daftar') {
        return interaction.reply(
          ephemeral(
            current.length
              ? `Kategori yang dihitung (${current.length}):\n${bullets(current)}`
              : 'Semua voice channel dihitung (belum ada filter kategori).'
          )
        );
      }

      if (sub === 'semua') {
        voicetime.setCategories(guild, []);
        return interaction.reply(
          ephemeral(`Filter dihapus, semua voice channel dihitung. ${await note()}`)
        );
      }

      const chosen = picked(interaction, 'kategori');

      if (sub === 'tambah') {
        const fresh = chosen.filter((c) => !current.includes(c.id));
        if (fresh.length === 0) {
          return interaction.reply(ephemeral('Semua kategori itu sudah ada di daftar.'));
        }
        voicetime.setCategories(guild, [...current, ...fresh.map((c) => c.id)]);
        return interaction.reply(
          ephemeral(`Ditambahkan: ${names(fresh)}. ${await note()}`)
        );
      }

      if (sub === 'hapus') {
        const gone = chosen.filter((c) => current.includes(c.id));
        if (gone.length === 0) {
          return interaction.reply(ephemeral('Kategori itu tidak ada di daftar.'));
        }
        const ids = new Set(gone.map((c) => c.id));
        voicetime.setCategories(guild, current.filter((id) => !ids.has(id)));
        return interaction.reply(
          ephemeral(`Dihapus dari daftar: ${names(gone)}. ${await note()}`)
        );
      }
    }

    // /topvoice kecuali ...
    if (group === 'kecuali') {
      const current = voicetime.getExcluded(guildId);

      if (sub === 'daftar') {
        return interaction.reply(
          ephemeral(
            current.length
              ? `Voice yang dikecualikan (${current.length}):\n${bullets(current)}`
              : 'Belum ada voice yang dikecualikan.'
          )
        );
      }

      const chosen = picked(interaction, 'voice');

      if (sub === 'tambah') {
        const fresh = chosen.filter((c) => !current.includes(c.id));
        if (fresh.length === 0) {
          return interaction.reply(ephemeral('Semua voice itu sudah dikecualikan.'));
        }
        voicetime.setExcluded(guild, [...current, ...fresh.map((c) => c.id)]);
        return interaction.reply(
          ephemeral(`Dikecualikan: ${names(fresh)}. ${await note()}`)
        );
      }

      if (sub === 'hapus') {
        const back = chosen.filter((c) => current.includes(c.id));
        if (back.length === 0) {
          return interaction.reply(
            ephemeral('Voice itu tidak ada di daftar pengecualian.')
          );
        }
        const ids = new Set(back.map((c) => c.id));
        voicetime.setExcluded(guild, current.filter((id) => !ids.has(id)));
        return interaction.reply(
          ephemeral(`Dihitung kembali: ${names(back)}. ${await note()}`)
        );
      }
    }
  },
};