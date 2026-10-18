const {
  ChannelType,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} = require('discord.js');
const config = require('../config');
const store = require('../store');
const { buildMenus, refreshPanel } = require('../panel');
const rooms = require('../rooms');

const slug = (s) =>
  s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

const MAX_CATEGORIES = 5; // batas Discord: 5 baris komponen per pesan
const MAX_GAMES = 25; // batas Discord: 25 opsi per menu

const ephemeral = (content) => ({ content, flags: MessageFlags.Ephemeral });

function validEmoji(e) {
  return /^<a?:\w+:\d+>$/.test(e) || /^\p{Extended_Pictographic}/u.test(e);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gaminglounge')
    .setDescription('Kelola Gaming Lounge')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false)
    .addSubcommand((s) =>
      s.setName('setup').setDescription('Kirim menu Gaming Lounge ke channel ini')
    )
    .addSubcommand((s) => s.setName('daftar').setDescription('Lihat semua kategori dan game'))
    .addSubcommandGroup((g) =>
      g
        .setName('kategori')
        .setDescription('Kelola kategori game')
        .addSubcommand((s) =>
          s
            .setName('tambah')
            .setDescription('Tambah kategori baru')
            .addStringOption((o) =>
              o.setName('nama').setDescription('Contoh: Console Game List').setRequired(true).setMaxLength(100)
            )
        )
        .addSubcommand((s) =>
          s
            .setName('hapus')
            .setDescription('Hapus kategori beserta isinya')
            .addStringOption((o) =>
              o.setName('kategori').setDescription('Kategori').setRequired(true).setAutocomplete(true)
            )
        )
    )
    .addSubcommandGroup((g) =>
      g
        .setName('game')
        .setDescription('Kelola game')
        .addSubcommand((s) =>
          s
            .setName('tambah')
            .setDescription('Tambah game ke kategori')
            .addStringOption((o) =>
              o.setName('kategori').setDescription('Kategori').setRequired(true).setAutocomplete(true)
            )
            .addStringOption((o) =>
              o.setName('nama').setDescription('Nama game').setRequired(true).setMaxLength(80)
            )
            .addIntegerOption((o) =>
              o
                .setName('limit')
                .setDescription('Limit user per room (0 = tanpa limit)')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(99)
            )
            .addStringOption((o) =>
              o.setName('emoji').setDescription('Emoji unicode atau custom, contoh: 🎮 atau <:apex:123456>')
            )
        )
        .addSubcommand((s) =>
          s
            .setName('hapus')
            .setDescription('Hapus game dari kategori')
            .addStringOption((o) =>
              o.setName('kategori').setDescription('Kategori').setRequired(true).setAutocomplete(true)
            )
            .addStringOption((o) =>
              o.setName('game').setDescription('Game').setRequired(true).setAutocomplete(true)
            )
        )
    ),

  async execute(interaction) {
    const group = interaction.options.getSubcommandGroup(false);
    const sub = interaction.options.getSubcommand();
    const { categories } = store.data;
    const guildId = interaction.guildId;

    // Pesan tambahan tergantung status panel
    const panelNote = async () =>
      (await refreshPanel(interaction.client, guildId))
        ? 'Menu diperbarui.'
        : 'Belum ada menu aktif. Jalankan `/gaminglounge setup` di channel tujuan.';

    if (!group && sub === 'setup') {
      if (buildMenus().length === 0) {
        return interaction.reply(ephemeral('Belum ada game. Tambahkan dulu dengan `/gaminglounge game tambah`.'));
      }
      const embed = new EmbedBuilder()
        .setTitle('Game Lounge')
        .setDescription(
          'Menu ini digunakan untuk membuat Gaming Lounge.\n\n' +
            '**Cara menggunakannya:**\n' +
            `Silakan masuk ke <#${config.createVcId}> lalu pilih game ` +
            'melalui menu di bawah ini sesuai yang Anda inginkan.\n\n' +
            'Jika ada masalah dengan Gaming Lounge, silakan hubungi **STAFF** yang tersedia.'
        );
      const msg = await interaction.channel.send({ embeds: [embed], components: buildMenus() });
      store.data.panels[guildId] = { channelId: msg.channelId, messageId: msg.id };
      store.save();
      return interaction.reply(ephemeral('Menu Gaming Lounge terkirim. Perubahan berikutnya akan memperbarui pesan ini otomatis.'));
    }

    if (!group && sub === 'daftar') {
      const lines = Object.values(categories).map(
        (c) =>
          `**${c.label}** (${c.games.length}/${MAX_GAMES})\n` +
          (c.games.map((g) => `${g.emoji ?? '🎮'} ${g.name}: ${g.limit || '∞'}`).join('\n') || '_kosong_')
      );
      return interaction.reply(ephemeral(lines.join('\n\n') || 'Belum ada kategori.'));
    }

    if (group === 'kategori' && sub === 'tambah') {
      const label = interaction.options.getString('nama').trim();
      const key = slug(label);
      if (!key) return interaction.reply(ephemeral('Nama kategori tidak valid.'));
      if (categories[key]) return interaction.reply(ephemeral('Kategori itu sudah ada.'));
      if (Object.keys(categories).length >= MAX_CATEGORIES) {
        return interaction.reply(
          ephemeral(`Maksimal ${MAX_CATEGORIES} kategori (batas Discord: 5 menu per pesan). Hapus salah satu dulu.`)
        );
      }
      categories[key] = { label, games: [] };
      store.save();
      return interaction.reply(
        ephemeral(`Kategori **${label}** dibuat. Menu baru muncul setelah ada game di dalamnya.`)
      );
    }

    if (group === 'kategori' && sub === 'hapus') {
      const key = interaction.options.getString('kategori');
      const cat = categories[key];
      if (!cat) return interaction.reply(ephemeral('Kategori tidak ditemukan.'));
      delete categories[key];
      store.save();
      return interaction.reply(ephemeral(`Kategori **${cat.label}** dihapus. ${await panelNote()}`));
    }

    if (group === 'game' && sub === 'tambah') {
      const key = interaction.options.getString('kategori');
      const cat = categories[key];
      if (!cat) return interaction.reply(ephemeral('Kategori tidak ditemukan.'));
      if (cat.games.length >= MAX_GAMES) {
        return interaction.reply(ephemeral(`Kategori penuh (maks. ${MAX_GAMES} game per menu).`));
      }

      const name = interaction.options.getString('nama').trim();
      const id = slug(name);
      if (!id) return interaction.reply(ephemeral('Nama game tidak valid.'));
      if (cat.games.some((g) => g.id === id)) {
        return interaction.reply(ephemeral('Game itu sudah ada di kategori ini.'));
      }

      const emoji = interaction.options.getString('emoji')?.trim() || '🎮';
      if (!validEmoji(emoji)) {
        return interaction.reply(ephemeral('Emoji tidak valid. Pakai emoji unicode atau format `<:nama:id>`.'));
      }

      cat.games.push({ id, name, limit: interaction.options.getInteger('limit'), emoji });
      cat.games.sort((a, b) => a.name.localeCompare(b.name, 'id', { sensitivity: 'base', numeric: true }));
      store.save();
      return interaction.reply(ephemeral(`**${name}** ditambahkan ke ${cat.label}. ${await panelNote()}`));
    }

    if (group === 'game' && sub === 'hapus') {
      const cat = categories[interaction.options.getString('kategori')];
      if (!cat) return interaction.reply(ephemeral('Kategori tidak ditemukan.'));
      const idx = cat.games.findIndex((g) => g.id === interaction.options.getString('game'));
      if (idx === -1) return interaction.reply(ephemeral('Game tidak ditemukan.'));
      const [removed] = cat.games.splice(idx, 1);
      store.save();
      return interaction.reply(ephemeral(`**${removed.name}** dihapus dari ${cat.label}. ${await panelNote()}`));
    }
  },

  // Autocomplete untuk opsi "kategori" dan "game"
  async autocomplete(interaction) {
    const focused = interaction.options.getFocused(true);
    const q = focused.value.toLowerCase();
    const { categories } = store.data;
    let choices = [];

    if (focused.name === 'kategori') {
      choices = Object.entries(categories).map(([key, c]) => ({ name: c.label, value: key }));
    } else if (focused.name === 'game') {
      const cat = categories[interaction.options.getString('kategori')];
      choices = (cat?.games ?? []).map((g) => ({ name: g.name, value: g.id }));
    }

    await interaction.respond(
      choices.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 25)
    );
  },

  // Saat member memilih game dari menu
  async handleSelect(interaction) {
    interaction.message.edit({ components: buildMenus() }).catch(() => {});
    const key = interaction.customId.split(':')[1];
    const game = store.data.categories[key]?.games.find((g) => g.id === interaction.values[0]);
    if (!game) {
      return interaction.reply(ephemeral('Game sudah tidak tersedia. Coba pilih lagi.'));
    }

    const member = interaction.member;
    const current = member.voice.channel;
    if (!current || current.id !== config.createVcId) {
      return interaction.reply(ephemeral(`Masuk dulu ke <#${config.createVcId}>, lalu pilih game lagi.`));
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const room = await interaction.guild.channels.create({
        name: `${store.data.roomPrefix}${game.name}`.slice(0, 100),
        type: ChannelType.GuildVoice,
        parent: current.parentId,
        userLimit: game.limit,
        reason: `Gaming Lounge oleh ${interaction.user.tag}`,
      });

      interaction.client.tempChannels.add(room.id);
      rooms.check(interaction.client, room);
      await member.voice.setChannel(room);
      await interaction.editReply(
        `Room **${game.name}** dibuat (limit ${game.limit || 'tanpa limit'}): ${room}`
      );
    } catch (err) {
      console.error(err);
      await interaction.editReply(
        'Gagal membuat room. Pastikan bot punya izin **Manage Channels** dan **Move Members**.'
      );
    }
  },
};