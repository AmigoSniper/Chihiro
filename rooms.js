const EMPTY_DELAY = 60_000; // 1 menit
const timers = new Map(); // channelId -> timeout

function cancel(id) {
  clearTimeout(timers.get(id));
  timers.delete(id);
}

// Mulai hitung mundur kalau room kosong, batalkan kalau ada isinya
function check(client, channel) {
  if (!channel || !client.tempChannels.has(channel.id)) return;

  if (channel.members.size > 0) return cancel(channel.id);
  if (timers.has(channel.id)) return;

  timers.set(
    channel.id,
    setTimeout(async () => {
      timers.delete(channel.id);
      const ch = await client.channels.fetch(channel.id).catch(() => null);
      if (ch && ch.members.size > 0) return; // ada yang masuk lagi
      client.tempChannels.delete(channel.id);
      if (ch) await ch.delete('Gaming Lounge kosong 1 menit').catch(() => {});
    }, EMPTY_DELAY)
  );
}

module.exports = { check };