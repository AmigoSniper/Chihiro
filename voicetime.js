const fs = require('node:fs');
const path = require('node:path');
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const FILE = path.join(__dirname, 'data', 'voicetime.json');
const TICK = 60_000; // simpan waktu tiap 1 menit
const PANEL_REFRESH = 5 * 60_000; // perbarui embed tiap 5 menit
const TOP = 10;
const MEDALS = ['🥇', '🥈', '🥉'];
const pad = (n) => String(n).padStart(2, '0');
const hms = (sec) =>
  `${Math.floor(sec / 3600)}:${pad(Math.floor((sec % 3600) / 60))}:${pad(sec % 60)}`;
function load() {
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    return {};
  }
}

const data = load();
data.channels ??= {}; // guildId -> { channelId: detik aktif }
data.panels ??= {}; // guildId -> { channelId, messageId }
data.categories ??= {};
data.excluded ??= {};
let dirty = false;

function save() {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(data));
  dirty = false;
}

// key `${guildId}:${channelId}` -> waktu mulai aktif (ms)
const sessions = new Map();

// Channel yang dihitung: bukan AFK, bukan room sementara, bukan pengecualian, dan masuk kategori terpilih
function trackable(ch) {
  if (ch.guild.afkChannelId === ch.id) return false;
  if (ch.client.tempChannels?.has(ch.id)) return false;
  if ((data.excluded[ch.guild.id] ?? []).includes(ch.id)) return false;
  const cats = data.categories[ch.guild.id] ?? [];
  return cats.length === 0 || cats.includes(ch.parentId);
}

const humans = (ch) => ch.members.filter((m) => !m.user.bot).size;

// Samakan status sesi dengan isi channel saat ini
function sync(ch, now) {
  const key = `${ch.guild.id}:${ch.id}`;
  const active = trackable(ch) && humans(ch) > 0;
  const has = sessions.has(key);
  if (active && !has) sessions.set(key, now);
  else if (!active && has) flush(key, now, false);
}

function flush(key, now, keep) {
  const start = sessions.get(key);
  if (start == null) return;
  const sec = Math.floor((now - start) / 1000);
  if (sec > 0) {
    const [guildId, channelId] = key.split(':');
    const g = (data.channels[guildId] ??= {});
    g[channelId] = (g[channelId] ?? 0) + sec;
    dirty = true;
  }
  if (keep) sessions.set(key, now);
  else sessions.delete(key);
}

function onUpdate(oldState, newState) {
  const now = Date.now();
  for (const ch of new Set([oldState.channel, newState.channel])) {
    if (ch) sync(ch, now); // channel lama (mungkin jadi kosong) dan channel baru
  }
}

const fmt = (sec) => `${Math.floor(sec / 3600)} jam ${Math.floor((sec % 3600) / 60)} menit`;

function buildEmbed(guild) {
  const rows = Object.entries(data.channels[guild.id] ?? {})
    .filter(([id, s]) => {
      const ch = guild.channels.cache.get(id);
      return s >= 60 && ch && trackable(ch); // channel terhapus / di luar filter tidak tampil
    })
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP);

  const cats = (data.categories[guild.id] ?? []).length;
  const scope = cats ? `${cats} Lounge` : 'Semua Kategori';

  const lines = rows.map(([id, s], i) => {
    const ch = guild.channels.cache.get(id);
    const open = ch.permissionsFor(guild.roles.everyone)?.has(PermissionFlagsBits.Connect);
    const rank = MEDALS[i] ?? `**${i + 1}.**`;
    const now = humans(ch);
    return `${rank} ${ch}\n👥 \`${now}\` Member • ⏱️ \`${hms(s)}\``;
  });

  const body = rows.length
  ? lines.join('\n\n')
  : '_Belum ada data voice._';

const desc = `# 🏆 TOP ${TOP} Voice Channels\n## 🏅 Top 1-${TOP}\n${body}`;

return new EmbedBuilder()
  .setColor(0xf5b942)
  .setDescription(desc)
  .setFooter({ text: 'Diperbarui tiap 5 menit' })
  .setTimestamp();
}

async function refresh(client, guildId) {
  const p = data.panels[guildId];
  if (!p) return false;
  try {
    const guild = client.guilds.cache.get(guildId);
    const channel = await client.channels.fetch(p.channelId);
    const msg = await channel.messages.fetch(p.messageId);
    await msg.edit({ embeds: [buildEmbed(guild)] });
    return true;
  } catch {
    return false;
  }
}

function setPanel(guildId, channelId, messageId) {
  data.panels[guildId] = { channelId, messageId };
  save();
}

function resync(guild) {
  const now = Date.now();
  for (const ch of guild.channels.cache.values()) {
    if (ch.isVoiceBased()) sync(ch, now);
  }
}

const getCategories = (guildId) => data.categories[guildId] ?? [];

function setCategories(guild, ids) {
  data.categories[guild.id] = ids;
  resync(guild);
  save();
}

const getExcluded = (guildId) => data.excluded[guildId] ?? [];

function setExcluded(guild, ids) {
  data.excluded[guild.id] = ids;
  resync(guild);
  save();
}

// Dipanggil sekali saat bot siap
function start(client) {
  // Mulai hitung untuk channel yang sudah berisi orang saat bot menyala
  const now = Date.now();
  for (const guild of client.guilds.cache.values()) {
    for (const ch of guild.channels.cache.values()) {
      if (ch.isVoiceBased()) sync(ch, now);
    }
  }

    setInterval(() => {
    const t = Date.now();
    for (const guild of client.guilds.cache.values()) resync(guild);
    for (const key of sessions.keys()) flush(key, t, true);
    if (dirty) save();
  }, TICK);

  setInterval(() => {
    for (const guild of client.guilds.cache.values()) refresh(client, guild.id);
  }, PANEL_REFRESH);

  // Simpan waktu yang belum tercatat saat bot dimatikan (Ctrl+C)
  process.on('SIGINT', () => {
    const t = Date.now();
    for (const key of sessions.keys()) flush(key, t, false);
    save();
    process.exit(0);
  });
}

module.exports = {
  onUpdate, start, buildEmbed, refresh, setPanel,
  getCategories, setCategories, getExcluded, setExcluded,
};