/**
 * Penangan eksekusi command /topvoice dan utilitas pemilih opsi channel.
 * Dipakai oleh: commands/topvoice.js, features/voicetime/index.js.
 * Bergantung pada: discord.js (MessageFlags), features/voicetime/store.js, features/voicetime/panel.js, features/voicetime/tracker.js.
 */

// --- Import Modul ---
const { MessageFlags } = require('discord.js');
const store = require('./store');
const { buildEmbed, refresh } = require('./panel');
const { resyncGuild } = require('./tracker');

// --- Konstanta ---
const MAX_PICK = 5; // batas maksimal input slot channel per eksekusi perintah

// --- Helper Privat Format Teks ---
const createEphemeralMessage = (content) => ({ content, flags: MessageFlags.Ephemeral });
const formatNames = (list) => list.map((c) => `**${c.name}**`).join(', ');
const formatBullets = (ids) => ids.map((id) => `• <#${id}>`).join('\n');

// --- Helper Pembangun Opsi Slash Command ---

/**
 * Menambahkan opsi channel secara berulang (1 sampai 5) ke builder subcommand.
 * @param {import('discord.js').SlashCommandSubcommandBuilder} sub
 * @param {string} baseName - Nama dasar opsi (mis. 'kategori' atau 'voice').
 * @param {string} description - Deskripsi opsi.
 * @param {import('discord.js').ChannelType[]} channelTypes - Jenis channel yang diizinkan.
 */
function addChannels(sub, baseName, description, channelTypes) {
  for (let i = 1; i <= MAX_PICK; i++) {
    sub.addChannelOption((o) =>
      o
        .setName(i === 1 ? baseName : `${baseName}${i}`)
        .setDescription(i === 1 ? description : `${description} (tambahan ${i})`)
        .addChannelTypes(...channelTypes)
        .setRequired(i === 1)
    );
  }
  return sub;
}

/**
 * Mengambil seluruh channel yang diisi pengguna pada interaksi tanpa duplikat.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {string} baseName
 * @returns {import('discord.js').GuildChannel[]}
 */
function getPickedChannels(interaction, baseName) {
  const channelMap = new Map();
  for (let i = 1; i <= MAX_PICK; i++) {
    const channel = interaction.options.getChannel(i === 1 ? baseName : `${baseName}${i}`);
    if (channel) {
      channelMap.set(channel.id, channel);
    }
  }
  return [...channelMap.values()];
}

// --- Fungsi Operasi Kategori & Pengecualian ---

/**
 * Mengatur filter kategori yang dihitung, lalu melakukan sinkronisasi ulang channel.
 * @param {import('discord.js').Guild} guild
 * @param {string[]} ids
 */
function setCategories(guild, ids) {
  store.setCategories(guild.id, ids);
  resyncGuild(guild);
}

/**
 * Mengatur daftar channel yang dikecualikan, lalu melakukan sinkronisasi ulang channel.
 * @param {import('discord.js').Guild} guild
 * @param {string[]} ids
 */
function setExcluded(guild, ids) {
  store.setExcluded(guild.id, ids);
  resyncGuild(guild);
}

// --- Penangan Eksekusi Subcommand ---

/**
 * Menjalankan command /topvoice setup.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
async function handleSetup(interaction) {
  const { guild, guildId } = interaction;
  const msg = await interaction.channel.send({
    embeds: [buildEmbed(guild)],
  });
  store.setPanel(guildId, msg.channelId, msg.id);
  return interaction.reply(
    createEphemeralMessage('Embed Top Voice terkirim. Akan diperbarui otomatis tiap 5 menit.')
  );
}

/**
 * Menjalankan grup subcommand /topvoice kategori ...
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {string} sub
 */
async function handleCategoryGroup(interaction, sub) {
  const { guild, guildId } = interaction;
  const current = store.getCategories(guildId);

  const getStatusNote = async () =>
    (await refresh(interaction.client, guildId))
      ? 'Embed diperbarui.'
      : 'Belum ada embed aktif. Jalankan `/topvoice setup`.';

  if (sub === 'daftar') {
    return interaction.reply(
      createEphemeralMessage(
        current.length
          ? `Kategori yang dihitung (${current.length}):\n${formatBullets(current)}`
          : 'Semua voice channel dihitung (belum ada filter kategori).'
      )
    );
  }

  if (sub === 'semua') {
    setCategories(guild, []);
    return interaction.reply(
      createEphemeralMessage(`Filter dihapus, semua voice channel dihitung. ${await getStatusNote()}`)
    );
  }

  const chosen = getPickedChannels(interaction, 'kategori');

  if (sub === 'tambah') {
    const fresh = chosen.filter((c) => !current.includes(c.id));
    if (fresh.length === 0) {
      return interaction.reply(createEphemeralMessage('Semua kategori itu sudah ada di daftar.'));
    }
    setCategories(guild, [...current, ...fresh.map((c) => c.id)]);
    return interaction.reply(
      createEphemeralMessage(`Ditambahkan: ${formatNames(fresh)}. ${await getStatusNote()}`)
    );
  }

  if (sub === 'hapus') {
    const gone = chosen.filter((c) => current.includes(c.id));
    if (gone.length === 0) {
      return interaction.reply(createEphemeralMessage('Kategori itu tidak ada di daftar.'));
    }
    const ids = new Set(gone.map((c) => c.id));
    setCategories(guild, current.filter((id) => !ids.has(id)));
    return interaction.reply(
      createEphemeralMessage(`Dihapus dari daftar: ${formatNames(gone)}. ${await getStatusNote()}`)
    );
  }
}

/**
 * Menjalankan grup subcommand /topvoice kecuali ...
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {string} sub
 */
async function handleExcludedGroup(interaction, sub) {
  const { guild, guildId } = interaction;
  const current = store.getExcluded(guildId);

  const getStatusNote = async () =>
    (await refresh(interaction.client, guildId))
      ? 'Embed diperbarui.'
      : 'Belum ada embed aktif. Jalankan `/topvoice setup`.';

  if (sub === 'daftar') {
    return interaction.reply(
      createEphemeralMessage(
        current.length
          ? `Voice yang dikecualikan (${current.length}):\n${formatBullets(current)}`
          : 'Belum ada voice yang dikecualikan.'
      )
    );
  }

  const chosen = getPickedChannels(interaction, 'voice');

  if (sub === 'tambah') {
    const fresh = chosen.filter((c) => !current.includes(c.id));
    if (fresh.length === 0) {
      return interaction.reply(createEphemeralMessage('Semua voice itu sudah dikecualikan.'));
    }
    setExcluded(guild, [...current, ...fresh.map((c) => c.id)]);
    return interaction.reply(
      createEphemeralMessage(`Dikecualikan: ${formatNames(fresh)}. ${await getStatusNote()}`)
    );
  }

  if (sub === 'hapus') {
    const back = chosen.filter((c) => current.includes(c.id));
    if (back.length === 0) {
      return interaction.reply(createEphemeralMessage('Voice itu tidak ada di daftar pengecualian.'));
    }
    const ids = new Set(back.map((c) => c.id));
    setExcluded(guild, current.filter((id) => !ids.has(id)));
    return interaction.reply(
      createEphemeralMessage(`Dihitung kembali: ${formatNames(back)}. ${await getStatusNote()}`)
    );
  }
}

module.exports = {
  addChannels,
  getPickedChannels,
  setCategories,
  setExcluded,
  handleSetup,
  handleCategoryGroup,
  handleExcludedGroup,
};
