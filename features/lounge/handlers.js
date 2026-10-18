/**
 * Penangan interaksi slash command, menu select, dan autocomplete untuk Gaming Lounge.
 * Dipakai oleh: commands/gaminglounge.js, events/interactionCreate.js, features/lounge/index.js.
 * Bergantung pada: discord.js, features/lounge/config.js, features/lounge/store.js, features/lounge/panel.js, features/lounge/rooms.js.
 */

// --- Import Modul ---
const {
  ChannelType,
  EmbedBuilder,
  MessageFlags,
} = require('discord.js');
const featureConfig = require('./config');
const store = require('./store');
const { buildMenus, refreshPanel } = require('./panel');
const rooms = require('./rooms');

// --- Helper Privat ---
const createEphemeralMessage = (content) => ({ content, flags: MessageFlags.Ephemeral });

/**
 * Mengubah string teks menjadi slug yang aman sebagai kunci identifikasi unik.
 * @param {string} text
 * @returns {string}
 */
const generateSlug = (text) =>
  text.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

/**
 * Memvalidasi apakah suatu string merupakan emoji valid (custom Discord atau unicode).
 * @param {string} emojiString
 * @returns {boolean}
 */
function isValidEmoji(emojiString) {
  return /^<a?:\w+:\d+>$/.test(emojiString) || /^\p{Extended_Pictographic}/u.test(emojiString);
}

// --- Handler Pemilihan Menu Dropdown (Pintu Pembuatan Room) ---

/**
 * Menangani pemilihan game dari menu dropdown Gaming Lounge oleh member.
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 */
async function handleSelect(interaction) {
  // 1. Pulihkan pilihan menu pada pesan agar tidak stuck di opsi yang dipilih
  interaction.message.edit({ components: buildMenus() }).catch(() => {});

  // 2. Ambil data kategori dan game yang dipilih
  const categoryKey = interaction.customId.split(':')[1];
  const selectedGameId = interaction.values[0];
  const game = store.data.categories[categoryKey]?.games.find((g) => g.id === selectedGameId);

  if (!game) {
    return interaction.reply(createEphemeralMessage('Game sudah tidak tersedia. Coba pilih lagi.'));
  }

  // 3. Pastikan member sudah berada di dalam voice channel pemicu ("Create Gaming")
  const member = interaction.member;
  const currentVoice = member.voice.channel;
  if (!currentVoice || currentVoice.id !== featureConfig.createVcId) {
    return interaction.reply(
      createEphemeralMessage(`Masuk dulu ke <#${featureConfig.createVcId}>, lalu pilih game lagi.`)
    );
  }

  // 4. Defer balasan karena pembuatan channel membutuhkan waktu jaringan
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    // 5. Buat channel temporary baru di kategori yang sama dengan channel pemicu
    const room = await interaction.guild.channels.create({
      name: `${store.data.roomPrefix}${game.name}`.slice(0, 100),
      type: ChannelType.GuildVoice,
      parent: currentVoice.parentId,
      userLimit: game.limit,
      reason: `Gaming Lounge oleh ${interaction.user.tag}`,
    });

    // 6. Daftarkan room ke daftar temporary channel dan pasang listener pembersih otomatis
    interaction.client.tempChannels.add(room.id);
    rooms.check(interaction.client, room);

    // 7. Pindahkan member ke room yang baru saja dibuat
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
}

// --- Handler Autocomplete ---

/**
 * Menangani respon autocomplete untuk opsi kategori dan nama game.
 * @param {import('discord.js').AutocompleteInteraction} interaction
 */
async function handleAutocomplete(interaction) {
  const focusedOption = interaction.options.getFocused(true);
  const query = focusedOption.value.toLowerCase();
  const { categories } = store.data;
  let choices = [];

  if (focusedOption.name === 'kategori') {
    choices = Object.entries(categories).map(([key, c]) => ({ name: c.label, value: key }));
  } else if (focusedOption.name === 'game') {
    const selectedCategory = categories[interaction.options.getString('kategori')];
    choices = (selectedCategory?.games ?? []).map((g) => ({ name: g.name, value: g.id }));
  }

  await interaction.respond(
    choices.filter((choice) => choice.name.toLowerCase().includes(query)).slice(0, 25)
  );
}

// --- Handler Eksekusi Subcommand /gaminglounge ---

/**
 * Menjalankan command /gaminglounge setup.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
async function handleSetup(interaction) {
  const guildId = interaction.guildId;

  if (buildMenus().length === 0) {
    return interaction.reply(
      createEphemeralMessage('Belum ada game. Tambahkan dulu dengan `/gaminglounge game tambah`.')
    );
  }

  const embed = new EmbedBuilder()
    .setTitle('Game Lounge')
    .setDescription(
      'Menu ini digunakan untuk membuat Gaming Lounge.\n\n' +
        '**Cara menggunakannya:**\n' +
        `Silakan masuk ke <#${featureConfig.createVcId}> lalu pilih game ` +
        'melalui menu di bawah ini sesuai yang Anda inginkan.\n\n' +
        'Jika ada masalah dengan Gaming Lounge, silakan hubungi **STAFF** yang tersedia.'
    );

  const msg = await interaction.channel.send({ embeds: [embed], components: buildMenus() });
  store.data.panels[guildId] = { channelId: msg.channelId, messageId: msg.id };
  store.save();

  return interaction.reply(
    createEphemeralMessage('Menu Gaming Lounge terkirim. Perubahan berikutnya akan memperbarui pesan ini otomatis.')
  );
}

/**
 * Menjalankan command /gaminglounge daftar.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
async function handleDaftar(interaction) {
  const { categories } = store.data;
  const lines = Object.values(categories).map(
    (c) =>
      `**${c.label}** (${c.games.length}/${featureConfig.maxGamesPerMenu})\n` +
      (c.games.map((g) => `${g.emoji ?? '🎮'} ${g.name}: ${g.limit || '∞'}`).join('\n') || '_kosong_')
  );

  return interaction.reply(createEphemeralMessage(lines.join('\n\n') || 'Belum ada kategori.'));
}

/**
 * Menjalankan subcommand kategori (tambah / hapus).
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {string} sub
 */
async function handleCategoryGroup(interaction, sub) {
  const { categories } = store.data;
  const guildId = interaction.guildId;

  const getPanelNote = async () =>
    (await refreshPanel(interaction.client, guildId))
      ? 'Menu diperbarui.'
      : 'Belum ada menu aktif. Jalankan `/gaminglounge setup` di channel tujuan.';

  if (sub === 'tambah') {
    const label = interaction.options.getString('nama').trim();
    const key = generateSlug(label);

    if (!key) return interaction.reply(createEphemeralMessage('Nama kategori tidak valid.'));
    if (categories[key]) return interaction.reply(createEphemeralMessage('Kategori itu sudah ada.'));

    if (Object.keys(categories).length >= featureConfig.maxCategories) {
      return interaction.reply(
        createEphemeralMessage(
          `Maksimal ${featureConfig.maxCategories} kategori (batas Discord: 5 menu per pesan). Hapus salah satu dulu.`
        )
      );
    }

    categories[key] = { label, games: [] };
    store.save();
    return interaction.reply(
      createEphemeralMessage(`Kategori **${label}** dibuat. Menu baru muncul setelah ada game di dalamnya.`)
    );
  }

  if (sub === 'hapus') {
    const key = interaction.options.getString('kategori');
    const cat = categories[key];
    if (!cat) return interaction.reply(createEphemeralMessage('Kategori tidak ditemukan.'));

    delete categories[key];
    store.save();
    return interaction.reply(
      createEphemeralMessage(`Kategori **${cat.label}** dihapus. ${await getPanelNote()}`)
    );
  }
}

/**
 * Menjalankan subcommand game (tambah / hapus).
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {string} sub
 */
async function handleGameGroup(interaction, sub) {
  const { categories } = store.data;
  const guildId = interaction.guildId;

  const getPanelNote = async () =>
    (await refreshPanel(interaction.client, guildId))
      ? 'Menu diperbarui.'
      : 'Belum ada menu aktif. Jalankan `/gaminglounge setup` di channel tujuan.';

  if (sub === 'tambah') {
    const key = interaction.options.getString('kategori');
    const cat = categories[key];
    if (!cat) return interaction.reply(createEphemeralMessage('Kategori tidak ditemukan.'));

    if (cat.games.length >= featureConfig.maxGamesPerMenu) {
      return interaction.reply(
        createEphemeralMessage(`Kategori penuh (maks. ${featureConfig.maxGamesPerMenu} game per menu).`)
      );
    }

    const name = interaction.options.getString('nama').trim();
    const id = generateSlug(name);
    if (!id) return interaction.reply(createEphemeralMessage('Nama game tidak valid.'));

    if (cat.games.some((g) => g.id === id)) {
      return interaction.reply(createEphemeralMessage('Game itu sudah ada di kategori ini.'));
    }

    const emoji = interaction.options.getString('emoji')?.trim() || '🎮';
    if (!isValidEmoji(emoji)) {
      return interaction.reply(
        createEphemeralMessage('Emoji tidak valid. Pakai emoji unicode atau format `<:nama:id>`.')
      );
    }

    cat.games.push({ id, name, limit: interaction.options.getInteger('limit'), emoji });
    cat.games.sort((a, b) => a.name.localeCompare(b.name, 'id', { sensitivity: 'base', numeric: true }));
    store.save();

    return interaction.reply(
      createEphemeralMessage(`**${name}** ditambahkan ke ${cat.label}. ${await getPanelNote()}`)
    );
  }

  if (sub === 'hapus') {
    const cat = categories[interaction.options.getString('kategori')];
    if (!cat) return interaction.reply(createEphemeralMessage('Kategori tidak ditemukan.'));

    const idx = cat.games.findIndex((g) => g.id === interaction.options.getString('game'));
    if (idx === -1) return interaction.reply(createEphemeralMessage('Game tidak ditemukan.'));

    const [removed] = cat.games.splice(idx, 1);
    store.save();

    return interaction.reply(
      createEphemeralMessage(`**${removed.name}** dihapus dari ${cat.label}. ${await getPanelNote()}`)
    );
  }
}

module.exports = {
  handleSelect,
  handleAutocomplete,
  handleSetup,
  handleDaftar,
  handleCategoryGroup,
  handleGameGroup,
};
