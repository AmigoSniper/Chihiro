# 🎮 Fitur: Gaming Lounge

_Terakhir diperbarui: 2026-10-18_
> Perbarui dokumen ini saat mengubah fitur terkait.

## 1. Tujuan
Menyediakan sistem pembuatan temporary voice channel otomatis berdasarkan game yang dipilih oleh member melalui menu dropdown Discord, serta melakukan penghapusan otomatis saat room ditinggalkan kosong.

## 2. Cara Kerja Singkat
1. Administrator mengatur daftar kategori dan game menggunakan perintah `/gaminglounge kategori` dan `/gaminglounge game`.
2. Administrator mengirimkan panel interaktif ke channel teks dengan `/gaminglounge setup`.
3. Member bergabung ke channel voice pemicu (`CREATE_VC_ID` / "Create Gaming"), lalu memilih game pada dropdown yang tersedia.
4. Bot membuat voice channel baru khusus game tersebut dengan limit user sesuai konfigurasi, lalu memindahkan member ke dalam room baru tersebut.
5. Bot memantau status keterisian room (`voiceStateUpdate`). Jika room kosong, hitung mundur 60 detik (`EMPTY_ROOM_DELAY_MS`) dimulai. Jika tetap kosong hingga waktu habis, room akan dihapus otomatis.

## 3. File dan Tanggung Jawabnya
- [`config.js`](file:///D:/Game/Bot/ChihiroBot/features/lounge/config.js): Konfigurasi lokal (ID channel pemicu, jeda pembersihan room kosong, batas maksimal Discord).
- [`store.js`](file:///D:/Game/Bot/ChihiroBot/features/lounge/store.js): Mengelola persistensi data kategori, game, panel, dan awalan room pada `data/lounge.json`.
- [`games.js`](file:///D:/Game/Bot/ChihiroBot/features/lounge/games.js): Data default (seed) kategori PC & Mobile yang dimuat saat file database belum terbentuk.
- [`rooms.js`](file:///D:/Game/Bot/ChihiroBot/features/lounge/rooms.js): Mengelola timer hitung mundur dan penghapusan channel temporary yang ditinggalkan kosong.
- [`panel.js`](file:///D:/Game/Bot/ChihiroBot/features/lounge/panel.js): Merakit komponen `StringSelectMenu` dan memperbarui komponen pada pesan panel.
- [`handlers.js`](file:///D:/Game/Bot/ChihiroBot/features/lounge/handlers.js): Berisi logika penanganan pemilihan dropdown (`handleSelect`), autocomplete kategori/game, dan eksekusi subcommand.
- [`index.js`](file:///D:/Game/Bot/ChihiroBot/features/lounge/index.js): Pintu masuk tunggal yang mengekspor seluruh API publik fitur.

## 4. API Publik
Diekspor melalui [`features/lounge/index.js`](file:///D:/Game/Bot/ChihiroBot/features/lounge/index.js):

| Fungsi / Properti | Input | Output | Deskripsi |
|---|---|---|---|
| `buildMenus()` | - | `ActionRowBuilder[]` | Menyusun deretan menu dropdown per kategori. |
| `refreshPanel(client, guildId)` | `client: Client, guildId: string` | `Promise<boolean>` | Memperbarui komponen menu pada pesan panel. |
| `parseEmoji(emojiString)` | `emojiString: string` | `Object` | Mem-parse string emoji ke format komponen Discord. |
| `checkRoom(client, channel)` | `client: Client, channel: VoiceChannel` | `void` | Memeriksa dan mengelola timer penghapusan room kosong. |
| `cancelRoom(channelId)` | `channelId: string` | `void` | Membatalkan timer penghapusan suatu channel. |
| `handleSelect(interaction)` | `interaction: SelectMenuInteraction` | `Promise<any>` | Membuat room baru dan memindahkan member yang memilih game. |
| `handleAutocomplete(interaction)` | `interaction: AutocompleteInteraction` | `Promise<any>` | Memberikan saran nama kategori/game pada command. |
| `handleSetup(interaction)` | `interaction: CommandInteraction` | `Promise<any>` | Mengirim panel Gaming Lounge ke channel teks. |
| `handleDaftar(interaction)` | `interaction: CommandInteraction` | `Promise<any>` | Menampilkan daftar seluruh kategori dan game saat ini. |
| `handleCategoryGroup(interaction, sub)` | `interaction: CommandInteraction, sub: string` | `Promise<any>` | Eksekusi penambahan / penghapusan kategori. |
| `handleGameGroup(interaction, sub)` | `interaction: CommandInteraction, sub: string` | `Promise<any>` | Eksekusi penambahan / penghapusan game. |
| `store` | - | `Object` | Objek akses data persisten lounge (`data`, `save`). |

## 5. Data yang Dipakai
Tersimpan di `data/lounge.json`:
- `roomPrefix`: Awalan nama room temporary (default: `'🎮 '`).
- `categories`: Objek kategori game bersarang `{ [slug]: { label, games: [{ id, name, limit, emoji }] } }`.
- `panels`: Pemetaan `guildId -> { channelId, messageId }`.

## 6. Variabel Konfigurasi
Berasal dari `.env` melalui `config.js` akar:
- `CREATE_VC_ID` (Wajib): ID voice channel pemicu pembuatan room.
- `EMPTY_ROOM_DELAY_MS`: Durasi jeda sebelum room kosong dihapus (default: `60000` = 1 menit).

## 7. Event dan Command Terkait
- Command: `/gaminglounge` di [`commands/gaminglounge.js`](file:///D:/Game/Bot/ChihiroBot/commands/gaminglounge.js).
- Event:
  - `InteractionCreate` di [`events/interactionCreate.js`](file:///D:/Game/Bot/ChihiroBot/events/interactionCreate.js) (autocomplete dan select menu `gaming:`).
  - `VoiceStateUpdate` di [`events/voiceStateUpdate.js`](file:///D:/Game/Bot/ChihiroBot/events/voiceStateUpdate.js) (`rooms.checkRoom`).

## 8. Batasan yang Diketahui
- Batas maksimal 5 kategori game karena batasan Discord API (maksimal 5 `ActionRow` per pesan).
- Batas maksimal 25 game per kategori karena batasan Discord API (maksimal 25 opsi per `StringSelectMenu`).
- Member wajib berada di channel `CREATE_VC_ID` saat memilih menu agar dapat dipindahkan ke room baru.
- Room temporary yang sudah dibuat dicatat di memori runtime (`client.tempChannels`), sehingga restart bot akan menyebabkan room lama kehilangan status auto-cleanup jika tidak di-persist.
