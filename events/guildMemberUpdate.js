const { Events } = require('discord.js');
const store = require('../store');
const musicPanel = require('../musicpanel');

module.exports = {
  name: Events.GuildMemberUpdate,
  async execute(oldMember, newMember) {
    const roleId = store.data.musicRoles[newMember.guild.id];
    if (!roleId) return;

    const had = oldMember.roles.cache.has(roleId);
    const has = newMember.roles.cache.has(roleId);
    const renamed = oldMember.displayName !== newMember.displayName;

    if (had !== has || (has && renamed)) {
      musicPanel.schedule(newMember.client, newMember.guild.id);
    }
  },
};