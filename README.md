# 🎀 ChihiroBot

_Terakhir diperbarui: 2026-10-18_
> Perbarui dokumen ini saat mengubah fitur terkait.

ChihiroBot adalah bot utilitas Discord berbasis [discord.js](https://discord.js.org/) v14 dan CommonJS yang dirancang khusus untuk manajemen komunitas server Discord. Bot ini memfasilitasi pembuatan temporary voice channel otomatis untuk bermain game bersama, pemantauan status ketersediaan bot pemutar musik server, penyusunan papan peringkat (leaderboard) aktivitas voice channel, dan pemeliharaan nickname member secara massal. Seluruh arsitektur kode telah diorganisasikan ke dalam modul fitur independen agar mudah dipahami, dirawat, dan dikembangkan lebih lanjut.

## 🌟 Fitur Utama
1. **🎮 Gaming Lounge (`features/lounge`)**: Pembuatan room voice sementara secara dinamis saat member memilih game dari menu dropdown interaktif, dilengkapi pembersihan otomatis jika room ditinggalkan kosong selama 1 menit.
2. **🎵 Music Bot Panel (`features/musicbot`)**: Panel status ketersediaan bot musik berbasis role (bebas digunakan atau sedang memutar musik di voice channel) yang diperbarui secara langsung dengan jeda debounce anti-spam.
3. **🏆 Top Voice Leaderboard (`features/voicetime`)**: Papan peringkat otomatis (Top 10) yang menghitung akumulasi jam aktif pengguna manusia di setiap voice channel dengan filter kategori dan pengecualian.
4. **🔄 Mass Reset Nickname (`commands/resetnick.js`)**: Perintah pembersihan nickname member server non-bot kembali ke nama asli dengan jeda aman anti-rate limit dan penanganan batas token interaksi.
5. **🎀 Auto Mention Response (`events/messageCreate.js`)**: Sambutan interaktif saat bot di-tag/mention secara langsung di channel server.

---

## 🚀 Cara Menjalankan Bot

### 1. Prasyarat Sistem
- **Node.js**: Versi 18.0.0 atau lebih baru.
- **NPM**: Bawaan Node.js.

### 2. Instalasi Dependensi
Buka terminal di direktori proyek dan pasang seluruh paket dependensi:
```bash
npm install
```

### 3. Konfigurasi Lingkungan (`.env`)
Salin file template konfigurasi [`.env.example`](file:///D:/Game/Bot/ChihiroBot/.env.example) menjadi `.env`:
```bash
cp .env.example .env
```
Buka file `.env` lalu isi variabel wajib berikut:
- `DISCORD_TOKEN`: Token autentikasi bot dari Discord Developer Portal.
- `CREATE_VC_ID`: ID channel voice pemicu ("Create Gaming").

Variabel opsional lainnya (teks status, ikon, durasi jeda, dsb.) telah memiliki nilai default otomatis di dalam kode jika tidak didefinisikan. Detail lengkap setiap variabel dapat dibaca pada [Panduan Konfigurasi](file:///D:/Game/Bot/ChihiroBot/docs/CONFIG.md).

### 4. Menjalankan Bot
Jalankan bot menggunakan script npm start:
```bash
npm start
```

---

## 🔐 Izin & Intent Discord yang Dibutuhkan

### Gateway Intents
Bot ini membutuhkan 4 Gateway Intent aktif saat inisialisasi di [`index.js`](file:///D:/Game/Bot/ChihiroBot/index.js):
- `GatewayIntentBits.Guilds`: Mendengarkan struktur server, channel, dan peran.
- `GatewayIntentBits.GuildMembers` (**Privileged Intent**): Wajib diaktifkan di Discord Developer Portal untuk fitur `/resetnick` dan pemantauan member bot musik.
- `GatewayIntentBits.GuildVoiceStates`: Memantau join/leave/pindah voice untuk fitur Gaming Lounge, Top Voice, dan Music Bot.
- `GatewayIntentBits.GuildMessages`: Menerima sinyal pesan untuk respons mention langsung.

### Izin Bot di Server (Bot Permissions)
Pastikan role bot Discord memiliki izin minimal berikut:
- **Manage Channels**: Membuat dan menghapus temporary voice channel Gaming Lounge.
- **Move Members**: Memindahkan member dari channel pemicu ke temporary room yang baru dibuat.
- **Manage Nicknames**: Mengubah dan mereset nickname member untuk perintah `/resetnick`.
- **Send Messages & Embed Links**: Mengirimkan panel embed dan pesan respons.
- **Use External Emojis**: Menampilkan custom emoji game pada menu Gaming Lounge.

---

## 📚 Dokumentasi Lanjutan
- 🏗️ [**Arsitektur & Struktur Direktori**](file:///D:/Game/Bot/ChihiroBot/docs/ARCHITECTURE.md): Peta modul, diagram dependensi, tabel event/command handler, dan tabel data.
- 🔄 [**Alur Kerja Sistem (Flows)**](file:///D:/Game/Bot/ChihiroBot/docs/FLOWS.md): Diagram alur interaksi pengguna, urutan proses eksekusi, dan lifecycle bot.
- ⚙️ [**Referensi Konfigurasi (.env & Batas API)**](file:///D:/Game/Bot/ChihiroBot/docs/CONFIG.md): Tabel lengkap environment variables, batas teknis Discord API, dan konstanta lokal.
- 🛠️ [**Panduan Pengembangan (Development Guide)**](file:///D:/Game/Bot/ChihiroBot/docs/DEVELOPMENT.md): Panduan langkah demi langkah menambah command, event, dan fitur baru tanpa regresi.
- 🔍 [**Review Kode & Rencana Lanjutan**](file:///D:/Game/Bot/ChihiroBot/docs/REVIEW.md): Audit teknis, catatan keputusan desain, dan daftar isu teknis untuk iterasi berikutnya.
- 📁 **Dokumentasi Fitur Mandiri**:
  - [Dokumentasi Fitur Gaming Lounge](file:///D:/Game/Bot/ChihiroBot/features/lounge/README.md)
  - [Dokumentasi Fitur Music Bot Panel](file:///D:/Game/Bot/ChihiroBot/features/musicbot/README.md)
  - [Dokumentasi Fitur Top Voice](file:///D:/Game/Bot/ChihiroBot/features/voicetime/README.md)
