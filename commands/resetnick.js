const {
  PermissionFlagsBits,
  SlashCommandBuilder,
  MessageFlags,
} = require('discord.js');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const running = new Set(); // guildId yang sedang eksekusi

const FETCH_TTL = 5 * 60_000; // 5 menit
const fetchedAt = new Map(); // guildId -> timestamp

async function getMembers(guild) {
  const last = fetchedAt.get(guild.id) ?? 0;
  if (Date.now() - last > FETCH_TTL) {
    try {
      await guild.members.fetch(); // fetch penuh hanya kalau cache sudah basi
      fetchedAt.set(guild.id, Date.now());
    } catch (err) {
      if (err.name === 'GatewayRateLimitError') {
        const detik = Math.ceil(err.data.retry_after);
        throw new Error(`Rate limit Discord. Coba lagi dalam ${detik} detik.`);
      }
      throw err;
    }
  }
  return guild.members.cache;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resetnick')
    .setDescription('Reset nickname semua member')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames)
    .setDMPermission(false),

  async execute(interaction) {
    const { guild, user } = interaction;

    if (running.has(guild.id)) {
      return interaction.reply({
        content: 'Reset sedang berjalan di server ini.',
        flags: MessageFlags.Ephemeral,
      });
    }

    running.add(guild.id);
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    let ok = 0;
    let skip = 0;
    try {
      const members = await getMembers(guild);
      const targets = members.filter((m) => !m.user.bot && m.nickname);

      await interaction.editReply(
        `Mereset **${targets.size}** nickname... Mohon tunggu.`
      );

      for (const member of targets.values()) {
        if (!member.manageable) {
          skip++;
          continue;
        }
        try {
          await member.setNickname(null, `Reset oleh ${user.tag}`);
          ok++;
          await sleep(1000); // hindari rate limit
        } catch {
          skip++;
        }
      }
    } finally {
      running.delete(guild.id);
    }

    const hasil = `Selesai. Berhasil: ${ok}, dilewati: ${skip}`;
    try {
      await interaction.editReply(hasil);
    } catch {
      // token interaksi kedaluwarsa (>15 menit) pada server besar
      await interaction.channel?.send(`${hasil} (oleh ${user})`);
    }
  },
};