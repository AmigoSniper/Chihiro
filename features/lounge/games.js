/**
 * Data awal (seed) kategori dan daftar game default untuk Gaming Lounge.
 * Dipakai oleh: features/lounge/store.js saat inisialisasi awal database.
 * Bergantung pada: tidak ada.
 */

module.exports = {
  roomPrefix: '🎮 ',
  categories: {
    pc: {
      label: 'PC Game List',
      games: [
        { id: 'apex', name: 'Apex Legends', limit: 3, emoji: '🎮' },
        { id: 'cs2', name: 'Counter-Strike 2', limit: 5, emoji: '🔫' },
        { id: 'dota2', name: 'Dota 2', limit: 5, emoji: '🛡️' },
        { id: 'fortnite', name: 'Fortnite', limit: 4, emoji: '🪂' },
        { id: 'gtav', name: 'GTA V', limit: 32, emoji: '🚗' },
      ],
    },
    mobile: {
      label: 'Mobile Game List',
      games: [
        { id: 'amongus', name: 'Among Us', limit: 15, emoji: '🔴' },
        { id: 'aov', name: 'Arena of Valor', limit: 5, emoji: '⚔️' },
        { id: 'apexm', name: 'Apex Legends Mobile', limit: 3, emoji: '🎮' },
        { id: 'codm', name: 'Call of Duty Mobile', limit: 5, emoji: '🔫' },
        { id: 'ff', name: 'Free Fire', limit: 4, emoji: '🔥' },
      ],
    },
  },
};
