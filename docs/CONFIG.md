# ⚙️ Panduan Konfigurasi & Batas Sistem (Configuration)

_Terakhir diperbarui: 2026-10-18_
> Perbarui dokumen ini saat mengubah fitur terkait.

Dokumen ini memuat seluruh referensi konfigurasi lingkungan (`.env`), konstanta lokal per modul, serta batasan teknis Discord API yang memengaruhi desain arsitektur bot.

---

## 📋 Tabel Variabel Environment (`.env`)

Satu-satunya modul dalam aplikasi yang diperbolehkan membaca `process.env` adalah [`config.js`](file:///D:/Game/Bot/ChihiroBot/config.js) di direktori akar. Modul-modul lain di dalam `features/`, `commands/`, atau `events/` mengambil nilai konfigurasi melalui objek export `config.js`.

> **Aturan Pengisian Nilai:** Jika nilai mengandung spasi atau karakter khusus/emoji, bungkus nilai dengan tanda kutip dua (`"`), contoh: `BOT_STATUS_TEXT="🎀 ୨୧ lovely moments with Chihiro ♡"`.

| Nama Variabel | Status | Nilai Default | Dipakai di File | Deskripsi & Fungsi |
|---|---|---|---|---|
| `DISCORD_TOKEN` | **Wajib** | _Tidak ada_ | [`config.js`](file:///D:/Game/Bot/ChihiroBot/config.js), [`index.js`](file:///D:/Game/Bot/ChihiroBot/index.js) | Token autentikasi bot Discord dari Developer Portal. Wajib diisi saat bot mulai berjalan. |
| `CREATE_VC_ID` | **Wajib** | _Tidak ada_ | [`config.js`](file:///D:/Game/Bot/ChihiroBot/config.js), [`features/lounge/config.js`](file:///D:/Game/Bot/ChihiroBot/features/lounge/config.js) | ID voice channel pemicu pembuatan room Gaming Lounge ("Create Gaming"). |
| `BOT_STATUS_TEXT` | Opsional | `"🎀 ୨୧ lovely moments with Chihiro ♡"` | [`events/ready.js`](file:///D:/Game/Bot/ChihiroBot/events/ready.js) | Teks status custom activity bot saat online di Discord. |
| `MENTION_REPLY_TEXT` | Opsional | `"🎀 Ehh~ Chihiro dipanggil nih! Ada apa, sayang? ♡"` | [`events/messageCreate.js`](file:///D:/Game/Bot/ChihiroBot/events/messageCreate.js) | Pesan balasan saat bot di-tag/mention secara langsung di chat server. |
| `MUSIC_ICON_FREE` | Opsional | `"✅"` | [`features/musicbot/config.js`](file:///D:/Game/Bot/ChihiroBot/features/musicbot/config.js) | Ikon penanda status bot musik sedang bebas (tidak ada di voice channel). |
| `MUSIC_ICON_BUSY` | Opsional | `"❌"` | [`features/musicbot/config.js`](file:///D:/Game/Bot/ChihiroBot/features/musicbot/config.js) | Ikon penanda status bot musik sedang digunakan di suatu voice channel. |
| `TOP_VOICE_COUNT` | Opsional | `10` | [`features/voicetime/config.js`](file:///D:/Game/Bot/ChihiroBot/features/voicetime/config.js) | Jumlah channel terbanyak yang ditampilkan pada pesan embed leaderboard. |
| `TOP_VOICE_REFRESH_MS` | Opsional | `300000` (5 menit) | [`features/voicetime/config.js`](file:///D:/Game/Bot/ChihiroBot/features/voicetime/config.js) | Interval pembaruan otomatis pesan embed panel leaderboard (milidetik). |
| `VOICE_TICK_MS` | Opsional | `60000` (1 menit) | [`features/voicetime/config.js`](file:///D:/Game/Bot/ChihiroBot/features/voicetime/config.js) | Interval kalkulasi durasi aktif voice dan penyimpanan ke JSON (milidetik). |
| `EMPTY_ROOM_DELAY_MS` | Opsional | `60000` (1 menit) | [`features/lounge/config.js`](file:///D:/Game/Bot/ChihiroBot/features/lounge/config.js) | Jeda waktu sebelum menghapus temporary voice room yang kosong (milidetik). |
| `MUSIC_DEBOUNCE_MS` | Opsional | `2000` (2 detik) | [`features/musicbot/config.js`](file:///D:/Game/Bot/ChihiroBot/features/musicbot/config.js) | Jeda penundaan (debounce) pembaruan embed bot musik saat terjadi rentetan event (milidetik). |

---

## 📍 Daftar Konstanta Lokal Fitur

Konstanta yang didefinisikan secara internal pada modul-modul fitur:

### 1. Fitur Gaming Lounge (`features/lounge`)
- `maxCategories = 5` di [`features/lounge/config.js`](file:///D:/Game/Bot/ChihiroBot/features/lounge/config.js): Batas maksimal 5 kategori game per panel.
- `maxGamesPerMenu = 25` di [`features/lounge/config.js`](file:///D:/Game/Bot/ChihiroBot/features/lounge/config.js): Batas maksimal 25 game per menu dropdown.

### 2. Fitur Music Bot Panel (`features/musicbot`)
- `EMBED_COLOR = 0xe8575a` di [`features/musicbot/panel.js`](file:///D:/Game/Bot/ChihiroBot/features/musicbot/panel.js): Warna aksen embed panel bot musik (merah muda kemerahan).
- `MAX_EMBED_DESC_LENGTH = 4000` & `TRUNCATE_LENGTH = 3997` di [`features/musicbot/panel.js`](file:///D:/Game/Bot/ChihiroBot/features/musicbot/panel.js): Batas pemotongan teks deskripsi embed agar aman dari batas Discord 4096 karakter.

### 3. Fitur Top Voice (`features/voicetime`)
- `medals = ['🥇', '🥈', '🥉']` di [`features/voicetime/config.js`](file:///D:/Game/Bot/ChihiroBot/features/voicetime/config.js): Ikon medali untuk peringkat 1, 2, dan 3.
- `EMBED_COLOR = 0xf5b942` di [`features/voicetime/panel.js`](file:///D:/Game/Bot/ChihiroBot/features/voicetime/panel.js): Warna aksen embed leaderboard (emas/kuning).
- `MINIMUM_DURATION_SECONDS = 60` di [`features/voicetime/panel.js`](file:///D:/Game/Bot/ChihiroBot/features/voicetime/panel.js): Durasi akumulasi minimal sebelum sebuah channel ditampilkan di leaderboard.
- `MAX_PICK = 5` di [`features/voicetime/handlers.js`](file:///D:/Game/Bot/ChihiroBot/features/voicetime/handlers.js): Jumlah maksimal opsi slot channel per pemanggilan command `/topvoice`.

### 4. Command Mass Reset Nickname (`commands/resetnick.js`)
- `MEMBER_FETCH_CACHE_TTL_MS = 300000` (5 menit): Masa berlaku cache member server sebelum melakukan fetch penuh ke Discord API.
- `RATE_LIMIT_DELAY_MS = 1000` (1 detik): Jeda istirahat antar panggilan API ganti nickname per member.

---

## 🚫 Batasan Teknis Discord API yang Memengaruhi Desain

Tabel ini memetakan batasan resmi Discord API dan bagaimana batas tersebut diimplementasikan dalam kode:

| Batasan Discord API | Nilai Limit | Implementasi di Kode | Alasan Desain |
|---|---|---|---|
| **Komponen Baris per Pesan** | Maksimal 5 `ActionRow` per pesan | [`features/lounge/panel.js`](file:///D:/Game/Bot/ChihiroBot/features/lounge/panel.js) (`.slice(0, featureConfig.maxCategories)`) | Membatasi jumlah kategori game maksimal 5 agar seluruh menu muat dalam satu pesan panel. |
| **Opsi per Select Menu** | Maksimal 25 opsi per `StringSelectMenu` | [`features/lounge/panel.js`](file:///D:/Game/Bot/ChihiroBot/features/lounge/panel.js) (`.slice(0, featureConfig.maxGamesPerMenu)`) | Membatasi jumlah game maksimal 25 per kategori agar dropdown menu tidak melempar error Discord API. |
| **Pilihan Autocomplete** | Maksimal 25 pilihan per respon | [`features/lounge/handlers.js`](file:///D:/Game/Bot/ChihiroBot/features/lounge/handlers.js) (`.slice(0, 25)`) | Discord API membatasi hasil pencarian autocomplete maksimal 25 item. |
| **Karakter Deskripsi Embed** | Maksimal 4096 karakter | [`features/musicbot/panel.js`](file:///D:/Game/Bot/ChihiroBot/features/musicbot/panel.js) (`.slice(0, 3997) + '...'`) | Mencegah error API jika terdapat banyak bot musik dengan nama panjang di server. |
| **Opsi Slash Command per Perintah** | Maksimal 25 opsi parameter | [`features/voicetime/handlers.js`](file:///D:/Game/Bot/ChihiroBot/features/voicetime/handlers.js) (`MAX_PICK = 5`) | Membatasi input penambahan channel hingga 5 opsi per perintah agar formulir command tetap ringkas dan tidak rumit. |
| **Masa Berlaku Token Interaksi** | Maksimal 15 menit sejak defer | [`commands/resetnick.js`](file:///D:/Game/Bot/ChihiroBot/commands/resetnick.js) (blok `try/catch` pada `editReply`) | Jika proses `/resetnick` memakan waktu >15 menit di server dengan ribuan member, bot beralih mengirim laporan akhir via pesan biasa di channel. |
