/**
 * Slash command untuk mereset nickname seluruh member non-bot di server (/resetnick).
 * Dipakai oleh: discord.js command loader di index.js dan interactionCreate.
 * Bergantung pada: discord.js (PermissionFlagsBits, SlashCommandBuilder, MessageFlags).
 */

// --- Import Modul ---
const {
  PermissionFlagsBits,
  SlashCommandBuilder,
  MessageFlags,
} = require('discord.js');

// --- Konstanta ---
const MEMBER_FETCH_CACHE_TTL_MS = 5 * 60_000; // 5 menit: hindari fetch berulang ke Discord API
const RATE_LIMIT_DELAY_MS = 1000;              // 1 detik: jeda aman per panggilan ganti nickname

// --- State Privat (Runtime) ---
const runningGuilds = new Set();               // guildId: mencegah eksekusi ganda bersamaan di server yang sama
const memberFetchTimestamps = new Map();       // guildId -> timestamp (ms)

// --- Helper Privat ---

/**
 * Menghentikan eksekusi sementara selama durasi tertentu.
 * @param {number} ms - Durasi tunda dalam milidetik.
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mengambil daftar member server dengan sistem caching untuk menghemat bandwidth & rate limit.
 * @param {import('discord.js').Guild} guild
 * @returns {Promise<import('discord.js').Collection<string, import('discord.js').GuildMember>>}
 */
async function fetchGuildMembersWithCache(guild) {
  const lastFetched = memberFetchTimestamps.get(guild.id) ?? 0;
  const isCacheExpired = Date.now() - lastFetched > MEMBER_FETCH_CACHE_TTL_MS;

  if (isCacheExpired) {
    try {
      // Fetch penuh hanya jika cache lokal sudah melewati masa kedaluwarsa
      await guild.members.fetch();
      memberFetchTimestamps.set(guild.id, Date.now());
    } catch (err) {
      if (err.name === 'GatewayRateLimitError') {
        const retrySeconds = Math.ceil(err.data.retry_after);
        throw new Error(`Rate limit Discord. Coba lagi dalam ${retrySeconds} detik.`);
      }
      throw err;
    }
  }

  return guild.members.cache;
}

// --- Definisi Command Data ---
const data = new SlashCommandBuilder()
  .setName('resetnick')
  .setDescription('Reset nickname semua member')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames)
  .setDMPermission(false);

// --- Eksekusi Interaksi ---

/**
 * Menjalankan operasi reset nickname secara bertahap.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
async function execute(interaction) {
  const { guild, user } = interaction;

  // 1. Guarding: Cegah proses ganda berjalan di server yang sama
  if (runningGuilds.has(guild.id)) {
    return interaction.reply({
      content: 'Reset sedang berjalan di server ini.',
      flags: MessageFlags.Ephemeral,
    });
  }

  // 2. Tandai server sedang dalam proses dan tunda balasan (defer reply)
  runningGuilds.add(guild.id);
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  let successCount = 0;
  let skippedCount = 0;

  try {
    // 3. Ambil member dan saring hanya member manusia yang memiliki custom nickname
    const members = await fetchGuildMembersWithCache(guild);
    const targets = members.filter((member) => !member.user.bot && member.nickname);

    await interaction.editReply(
      `Mereset **${targets.size}** nickname... Mohon tunggu.`
    );

    // 4. Lakukan reset satu per satu dengan jeda aman untuk mencegah rate limit
    for (const member of targets.values()) {
      if (!member.manageable) {
        skippedCount++;
        continue;
      }

      try {
        await member.setNickname(null, `Reset oleh ${user.tag}`);
        successCount++;
        await sleep(RATE_LIMIT_DELAY_MS);
      } catch {
        skippedCount++;
      }
    }
  } finally {
    // 5. Pastikan status running selalu dibersihkan setelah selesai atau terjadi error
    runningGuilds.delete(guild.id);
  }

  // 6. Laporkan hasil akhir eksekusi kepada user
  const resultMessage = `Selesai. Berhasil: ${successCount}, dilewati: ${skippedCount}`;
  try {
    await interaction.editReply(resultMessage);
  } catch {
    // Fallback: Jika operasi memakan waktu >15 menit, token interaksi Discord kedaluwarsa
    await interaction.channel?.send(`${resultMessage} (oleh ${user})`);
  }
}

module.exports = {
  data,
  execute,
};