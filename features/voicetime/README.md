# 🏆 Fitur: Top Voice (Voicetime)

_Terakhir diperbarui: 2026-10-18_
> Perbarui dokumen ini saat mengubah fitur terkait.

## 1. Tujuan
Melacak total akumulasi waktu aktivitas member di voice channel per server, menyaring channel yang memenuhi syarat, dan menampilkan leaderboard (Top 10) yang diperbarui secara otomatis.

## 2. Cara Kerja Singkat
1. Saat bot menyala (`ClientReady`), bot menyinkronkan voice channel yang sudah terisi manusia dan memulai interval pelacak.
2. Setiap kali ada perubahan status voice (`voiceStateUpdate`), bot menyinkronkan status sesi channel (memulai sesi jika ada member manusia, atau menghitung dan menutup sesi jika kosong/tidak memenuhi syarat).
3. Setiap 1 menit (`VOICE_TICK_MS`), akumulasi durasi sesi aktif dihitung dan disimpan ke `data/voicetime.json` jika terdapat perubahan (`dirty`).
4. Setiap 5 menit (`TOP_VOICE_REFRESH_MS`), pesan panel leaderboard di Discord diperbarui secara otomatis.
5. Saat bot dimatikan via `SIGINT` (Ctrl+C), sisa durasi sesi yang sedang berjalan segera dihitung dan disimpan ke disk sebelum proses berhenti.

## 3. File dan Tanggung Jawabnya
- [`config.js`](file:///D:/Game/Bot/ChihiroBot/features/voicetime/config.js): Membaca konfigurasi lokal fitur dari `config.js` akar (durasi tick, interval refresh panel, jumlah peringkat, ikon medali).
- [`store.js`](file:///D:/Game/Bot/ChihiroBot/features/voicetime/store.js): Mengelola penyimpanan data durasi channel, panel, kategori, dan pengecualian ke file `data/voicetime.json`.
- [`helpers.js`](file:///D:/Game/Bot/ChihiroBot/features/voicetime/helpers.js): Fungsi pembantu independen untuk format waktu (`H:MM:SS`), penghitungan manusia non-bot, dan pengecekan kelayakan channel (`isTrackable`).
- [`panel.js`](file:///D:/Game/Bot/ChihiroBot/features/voicetime/panel.js): Membuat objek `EmbedBuilder` leaderboard dan memperbarui pesan panel di Discord.
- [`tracker.js`](file:///D:/Game/Bot/ChihiroBot/features/voicetime/tracker.js): Mengelola state sesi runtime (`Map`), deteksi durasi channel, interval berkala, dan penanganan graceful shutdown.
- [`handlers.js`](file:///D:/Game/Bot/ChihiroBot/features/voicetime/handlers.js): Penangan eksekusi subcommand `/topvoice` dan builder opsi channel bertingkat (1 sampai 5).
- [`index.js`](file:///D:/Game/Bot/ChihiroBot/features/voicetime/index.js): Pintu masuk tunggal yang mengekspor seluruh API publik fitur.

## 4. API Publik
Diekspor melalui [`features/voicetime/index.js`](file:///D:/Game/Bot/ChihiroBot/features/voicetime/index.js):

| Fungsi / Properti | Input | Output | Deskripsi |
|---|---|---|---|
| `onUpdate(oldState, newState)` | `oldState, newState: VoiceState` | `void` | Handler saat terjadi perubahan voice state di Discord. |
| `start(client)` | `client: Client` | `void` | Menginisialisasi sesi awal dan memulai loop interval tracking. |
| `buildEmbed(guild)` | `guild: Guild` | `EmbedBuilder` | Menyusun embed Top Voice Leaderboard. |
| `refresh(client, guildId)` | `client: Client, guildId: string` | `Promise<boolean>` | Memperbarui pesan embed panel di channel Discord. |
| `setPanel(guildId, channelId, messageId)` | `guildId, channelId, messageId: string` | `void` | Menyimpan koordinat pesan panel leaderboard. |
| `getCategories(guildId)` | `guildId: string` | `string[]` | Mengambil daftar ID kategori yang dipantau. |
| `setCategories(guild, ids)` | `guild: Guild, ids: string[]` | `void` | Menyimpan daftar ID kategori dan menyinkronkan ulang channel. |
| `getExcluded(guildId)` | `guildId: string` | `string[]` | Mengambil daftar ID channel yang dikecualikan. |
| `setExcluded(guild, ids)` | `guild: Guild, ids: string[]` | `void` | Menyimpan daftar ID pengecualian dan menyinkronkan ulang channel. |
| `handleSetup(interaction)` | `interaction: ChatInputCommandInteraction` | `Promise<any>` | Eksekusi subcommand `/topvoice setup`. |
| `handleCategoryGroup(interaction, sub)` | `interaction: ChatInputCommandInteraction, sub: string` | `Promise<any>` | Eksekusi grup `/topvoice kategori`. |
| `handleExcludedGroup(interaction, sub)` | `interaction: ChatInputCommandInteraction, sub: string` | `Promise<any>` | Eksekusi grup `/topvoice kecuali`. |
| `addChannels(sub, baseName, desc, types)` | `sub: Builder, baseName: string, desc: string, types: ChannelType[]` | `Builder` | Menambahkan 5 opsi channel berurutan ke subcommand builder. |

## 5. Data yang Dipakai
Tersimpan di `data/voicetime.json`:
- `channels`: Pemetaan `guildId -> { channelId: detik_aktif }`.
- `panels`: Pemetaan `guildId -> { channelId, messageId }`.
- `categories`: Pemetaan `guildId -> [categoryId, ...]`.
- `excluded`: Pemetaan `guildId -> [channelId, ...]`.
- `totals`: Data per-user yang ada di file data lama (saat ini tidak dibaca/ditulis oleh kode).

## 6. Variabel Konfigurasi
Berasal dari `.env` melalui `config.js` akar:
- `TOP_VOICE_COUNT`: Jumlah channel yang masuk leaderboard (default: `10`).
- `TOP_VOICE_REFRESH_MS`: Interval pembaruan embed panel (default: `300000` = 5 menit).
- `VOICE_TICK_MS`: Interval kalkulasi & penyimpanan durasi sesi ke disk (default: `60000` = 1 menit).

## 7. Event dan Command Terkait
- Command: `/topvoice` (subcommand: `setup`, `kategori`, `kecuali`) di [`commands/topvoice.js`](file:///D:/Game/Bot/ChihiroBot/commands/topvoice.js).
- Event:
  - `ClientReady` di [`events/ready.js`](file:///D:/Game/Bot/ChihiroBot/events/ready.js) (`voicetime.start(client)`).
  - `VoiceStateUpdate` di [`events/voiceStateUpdate.js`](file:///D:/Game/Bot/ChihiroBot/events/voiceStateUpdate.js) (`voicetime.onUpdate(oldState, newState)`).

## 8. Batasan yang Diketahui
- Channel hanya tampil di leaderboard jika total durasi aktif telah mencapai minimal 60 detik (`MINIMUM_DURATION_SECONDS`).
- Channel AFK server dan temporary room Gaming Lounge otomatis diabaikan dari perhitungan.
- Input pemilihan channel pada slash command dibatasi maksimal 5 channel per eksekusi karena batasan opsi Discord.
