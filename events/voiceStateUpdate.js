const { Events } = require('discord.js');
const rooms = require('../rooms');
const store = require('../store');
const musicPanel = require('../musicpanel');
const voicetime = require('../voicetime');

function isMusicBot(state) {
  const roleId = store.data.musicRoles[state.guild.id];
  return !!roleId && !!state.member?.roles.cache.has(roleId);
}

module.exports = {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState) {
    const client = newState.client;

    // Top Voice: catat waktu voice
    voicetime.onUpdate(oldState, newState);

    // Gaming Lounge: hapus room kosong setelah 1 menit
    rooms.check(client, oldState.channel);
    rooms.check(client, newState.channel);

    // Bot musik: perbarui embed kalau member ber-role bot musik pindah voice
    if (
      oldState.channelId !== newState.channelId &&
      (isMusicBot(oldState) || isMusicBot(newState))
    ) {
      musicPanel.schedule(client, newState.guild.id);
    }
  },
};