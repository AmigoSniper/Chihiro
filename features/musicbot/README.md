# 🎵 Fitur: Music Bot Panel

_Terakhir diperbarui: 2026-10-18_
> Perbarui dokumen ini saat mengubah fitur terkait.

## 1. Tujuan
Menyediakan panel embed informasi status ketersediaan bot musik di server Discord (apakah sedang bebas digunakan atau sedang memutar lagu di voice channel tertentu) yang diperbarui secara otomatis.

## 2. Cara Kerja Singkat
1. Administrator menetapkan role khusus bot musik menggunakan command `/musicbot role`.
2. Administrator mengirimkan embed status ke channel tujuan menggunakan `/musicbot setup`.
3. Bot mengamati setiap perpindahan voice channel (`voiceStateUpdate`) serta penambahan role atau perubahan nama member (`guildMemberUpdate`).
4. Jika terjadi perubahan status pada bot musik, pembaruan embed dijadwalkan dengan jeda (debounce) 2 detik agar tidak memicu spam edit ke API Discord.

## 3. File dan Tanggung Jawabnya
- [`config.js`](file:///D:/Game/Bot/ChihiroBot/features/musicbot/config.js): Membaca konfigurasi lokal fitur dari `config.js` akar (ikon status bebas/sibuk dan durasi debounce).
- [`store.js`](file:///D:/Game/Bot/ChihiroBot/features/musicbot/store.js): Mengelola penyimpanan data ID role dan koordinat pesan panel ke file `data/lounge.json`.
- [`panel.js`](file:///D:/Game/Bot/ChihiroBot/features/musicbot/panel.js): Membuat objek `EmbedBuilder` daftar bot musik dan menangani logika refresh pesan panel dengan debounce timer.
- [`handlers.js`](file:///D:/Game/Bot/ChihiroBot/features/musicbot/handlers.js): Berisi logika penanganan event (`voiceStateUpdate`, `guildMemberUpdate`) dan eksekusi command (`/musicbot role`, `/musicbot setup`).
- [`index.js`](file:///D:/Game/Bot/ChihiroBot/features/musicbot/index.js): Pintu masuk tunggal yang mengekspor seluruh API publik fitur untuk digunakan oleh file di `commands/` dan `events/`.

## 4. API Publik
Diekspor melalui [`features/musicbot/index.js`](file:///D:/Game/Bot/ChihiroBot/features/musicbot/index.js):

| Fungsi / Properti | Input | Output | Deskripsi |
|---|---|---|---|
| `buildEmbed(guild)` | `guild: Guild` | `EmbedBuilder` | Membuat embed daftar status bot musik. |
| `refresh(client, guildId)` | `client: Client, guildId: string` | `Promise<boolean>` | Memperbarui pesan embed panel di Discord. |
| `schedule(client, guildId)` | `client: Client, guildId: string` | `void` | Menjadwalkan `refresh` dengan debounce. |
| `getBots(guild)` | `guild: Guild` | `GuildMember[] \| null` | Mengambil member ber-role bot musik terurut alfabet. |
| `isMusicBot(state)` | `state: VoiceState` | `boolean` | Mengecek apakah voice state milik member ber-role bot musik. |
| `handleVoiceStateUpdate(oldState, newState)` | `oldState, newState: VoiceState` | `void` | Handler pembaruan status voice bot musik. |
| `handleGuildMemberUpdate(oldMember, newMember)` | `oldMember, newMember: GuildMember` | `void` | Handler pembaruan role/nama bot musik. |
| `handleRoleCommand(interaction)` | `interaction: CommandInteraction` | `Promise<any>` | Eksekusi `/musicbot role`. |
| `handleSetupCommand(interaction)` | `interaction: CommandInteraction` | `Promise<any>` | Eksekusi `/musicbot setup`. |
| `store` | - | `Object` | Objek akses data persisten (`getRole`, `setRole`, `getPanel`, `setPanel`). |

## 5. Data yang Dipakai
Tersimpan di `data/lounge.json`:
- `musicRoles`: Objek pemetaan `guildId -> roleId`.
- `musicPanels`: Objek pemetaan `guildId -> { channelId, messageId }`.

## 6. Variabel Konfigurasi
Berasal dari `.env` melalui `config.js` akar:
- `MUSIC_ICON_FREE`: Ikon indikator bot bebas (default: `✅`).
- `MUSIC_ICON_BUSY`: Ikon indikator bot sedang dipakai (default: `❌`).
- `MUSIC_DEBOUNCE_MS`: Waktu jeda tunda pembaruan embed dalam ms (default: `2000`).

## 7. Event dan Command Terkait
- Command: `/musicbot role`, `/musicbot setup` di [`commands/musicbot.js`](file:///D:/Game/Bot/ChihiroBot/commands/musicbot.js).
- Event:
  - `ClientReady` di [`events/ready.js`](file:///D:/Game/Bot/ChihiroBot/events/ready.js) (refresh awal saat bot menyala).
  - `VoiceStateUpdate` di [`events/voiceStateUpdate.js`](file:///D:/Game/Bot/ChihiroBot/events/voiceStateUpdate.js).
  - `GuildMemberUpdate` di [`events/guildMemberUpdate.js`](file:///D:/Game/Bot/ChihiroBot/events/guildMemberUpdate.js).

## 8. Batasan yang Diketahui
- Batas panjang deskripsi embed Discord adalah 4096 karakter; teks akan dipotong (`slice(0, 3997) + '...'`) jika melebihi 4000 karakter.
- Hanya mendukung 1 role dan 1 pesan panel per server (`guildId`).
