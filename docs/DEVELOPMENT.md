# 🛠️ Panduan Pengembangan (Development Guide)

_Terakhir diperbarui: 2026-10-18_
> Perbarui dokumen ini saat mengubah fitur terkait.

Dokumen ini memuat panduan praktis (recipes) langkah demi langkah untuk developer yang ingin menambahkan atau memodifikasi fungsionalitas ChihiroBot secara konsisten dan aman tanpa merusak arsitektur yang sudah ada.

---

## 1. Menambah Slash Command Baru

Semua file command baru diletakkan di dalam folder [`commands/`](file:///D:/Game/Bot/ChihiroBot/commands/) dan dimuat secara otomatis oleh [`index.js`](file:///D:/Game/Bot/ChihiroBot/index.js).

### Langkah-langkah:
1. Buat file baru di `commands/<nama_command>.js`, contoh: `commands/ping.js`.
2. Tulis struktur file standar (CommonJS) dengan mengekspor objek `data` (`SlashCommandBuilder`) dan fungsi `execute(interaction)`:

```javascript
/**
 * Slash command untuk mengecek status latensi bot (/ping).
 * Dipakai oleh: discord.js command loader di index.js dan interactionCreate.
 * Bergantung pada: discord.js.
 */

// --- Import Modul ---
const { SlashCommandBuilder } = require('discord.js');

// --- Definisi Command Data ---
const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Cek latensi koneksi bot ke Discord');

// --- Eksekusi Interaksi ---

/**
 * Menjalankan command /ping.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
async function execute(interaction) {
  const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
  const latency = sent.createdTimestamp - interaction.createdTimestamp;
  await interaction.editReply(`Pong! 🏓 Latensi: ${latency}ms (API: ${interaction.client.ws.ping}ms)`);
}

module.exports = {
  data,
  execute,
};
```
3. Restart bot. Command akan otomatis terdaftar secara global saat event `ClientReady` di [`events/ready.js`](file:///D:/Game/Bot/ChihiroBot/events/ready.js) berjalan.

---

## 2. Menambah Event Listener Baru

Semua listener event Discord diletakkan di dalam folder [`events/`](file:///D:/Game/Bot/ChihiroBot/events/) dan didaftarkan secara otomatis oleh [`index.js`](file:///D:/Game/Bot/ChihiroBot/index.js).

### Langkah-langkah:
1. Tentukan event Discord yang ingin didengarkan dari `Events` milik `discord.js`.
2. Buat file baru di `events/<nama_event>.js`, contoh: `events/guildCreate.js`.
3. Tulis struktur listener event:

```javascript
/**
 * Event GuildCreate: Menangani saat bot bergabung ke server Discord baru.
 * Dipakai oleh: discord.js event loader di index.js.
 * Bergantung pada: discord.js.
 */

// --- Import Modul ---
const { Events } = require('discord.js');

// --- Definisi Event ---
module.exports = {
  name: Events.GuildCreate,
  once: false, // set true jika hanya dieksekusi satu kali

  /**
   * Menangani event bergabungnya bot ke guild baru.
   * @param {import('discord.js').Guild} guild
   */
  async execute(guild) {
    console.log(`[Info] Bergabung ke server baru: ${guild.name} (${guild.id})`);
  },
};
```

---

## 3. Menambah Fitur Baru di `features/`

Jika Anda membuat fitur kompleks yang memiliki komponen embed, logika bisnis, penyimpanan data, atau helper independen, buat subfolder baru di dalam [`features/`](file:///D:/Game/Bot/ChihiroBot/).

### Template Struktur Folder Fitur:
```text
features/<nama_fitur>/
├── config.js       # Konfigurasi lokal fitur (mengambil dari root config.js)
├── store.js        # State persisten (membaca/menulis file data JSON)
├── panel.js        # Pembuat embed Discord, ActionRow, atau SelectMenu
├── handlers.js     # Penangan event dan command terkait fitur
├── index.js        # Pintu masuk publik (public API) satu-satunya
└── README.md       # Dokumentasi mandiri fitur
```

### Aturan Wajib Fitur:
- **`index.js` sebagai Public API**: File di luar fitur (seperti `commands/` atau `events/`) **hanya boleh** mengimpor dari `features/<nama_fitur>/index.js` (atau `require('../features/<nama_fitur>')`), bukan mengimpor file internal fitur secara langsung.
- **Isolasi State**: State runtime privat (`Map`, `Set`, timer) harus disimpan secara privat di dalam file fitur terkait dan diakses melalui fungsi.

---

## 4. Menambah Variabel `.env` Baru

Semua pembacaan `process.env` wajib dipusatkan di [`config.js`](file:///D:/Game/Bot/ChihiroBot/config.js) akar.

### Langkah-langkah:
1. Buka [`.env.example`](file:///D:/Game/Bot/ChihiroBot/.env.example) dan tambahkan deklarasi variabel baru beserta komentar penjelas.
2. Buka [`config.js`](file:///D:/Game/Bot/ChihiroBot/config.js):
   - Jika **wajib**: tambahkan nama variabel ke array `REQUIRED_ENV_KEYS`.
   - Jika **opsional**: tambahkan properti ke objek `config` dengan nilai default fallback.
3. Buka [`docs/CONFIG.md`](file:///D:/Game/Bot/ChihiroBot/docs/CONFIG.md) dan perbarui tabel variabel.
4. Gunakan nilai tersebut di modul fitur melalui `const rootConfig = require('../../config');`.

---

## 5. Menambah Subcommand atau Opsi pada Command yang Ada

Contoh: Menambahkan subcommand `status` pada `/musicbot`.

### Langkah-langkah:
1. Buka [`commands/musicbot.js`](file:///D:/Game/Bot/ChihiroBot/commands/musicbot.js).
2. Tambahkan rantai `.addSubcommand()` pada definisi `data`:
```javascript
.addSubcommand((s) =>
  s.setName('status').setDescription('Lihat status konfigurasi bot musik')
)
```
3. Tambahkan penanganan kondisi pada fungsi `execute(interaction)`:
```javascript
if (sub === 'status') {
  return musicbot.handleStatusCommand(interaction);
}
```
4. Tambahkan fungsi `handleStatusCommand` pada [`features/musicbot/handlers.js`](file:///D:/Game/Bot/ChihiroBot/features/musicbot/handlers.js), lalu ekspor melalui [`features/musicbot/index.js`](file:///D:/Game/Bot/ChihiroBot/features/musicbot/index.js).

---

## 6. Cara Menguji Kode & Membaca Log Umum

### Menguji Sintaks (Linting Check Ringan)
Jalankan perintah berikut untuk memastikan tidak ada kesalahan penulisan JavaScript:
```bash
node --check config.js
node --check index.js
```

### Menguji Dependensi & Import Tanpa Token Asli
Anda dapat menjalankan pemeriksaan verifikasi modul menggunakan token dummy:
```bash
node -e "process.env.DISCORD_TOKEN='dummy'; process.env.CREATE_VC_ID='123'; require('./config.js'); require('./features/lounge'); require('./features/musicbot'); require('./features/voicetime'); console.log('Modul valid!');"
```

### Membaca Log Umum
- `Variabel .env belum diisi: ...`: Variabel wajib (`DISCORD_TOKEN` atau `CREATE_VC_ID`) tidak ditemukan di `.env`.
- `[Peringatan] Command pada ... tidak memiliki properti "data"`: File di dalam folder `commands/` bukan merupakan command discord.js yang valid (mungkin salah menaruh file pembantu/helper di folder `commands/`).
- `GatewayRateLimitError`: Discord membatasi frekuensi panggilan API karena terlalu cepat (misal saat reset nickname tanpa jeda).

---

## ⚠️ Jebakan yang Sering Terjadi (Known Pitfalls)

1. **Menaruh File Pendukung di Folder `commands/` atau `events/`**:
   [`index.js`](file:///D:/Game/Bot/ChihiroBot/index.js) memindai **seluruh** file `.js` di dalam folder `commands/` dan menganggapnya sebagai slash command. Jika Anda meletakkan file helper di folder tersebut, bot akan menampilkan peringatan atau error saat startup. Letakkan file pendukung di dalam `features/` atau subdirektori terpisah.
2. **Lupa Mengaktifkan Gateway Intents**:
   Jika event member atau voice tidak terpanggil, pastikan intent yang bersangkutan (`GuildMembers`, `GuildVoiceStates`) sudah dicentang pada **Privileged Gateway Intents** di Discord Developer Portal.
3. **Delay Propagasi Slash Command Global**:
   Pendaftaran command menggunakan `client.application.commands.set()` bersifat global dan dapat membutuhkan waktu propagasi hingga 1 jam di cache Discord. Untuk pengujian instan pada server uji coba, daftarkan command langsung pada guild ID tertentu (`guild.commands.set()`).
4. **State Hilang Saat Bot Restart**:
   Data di dalam `client.tempChannels` atau Map sesi yang sedang berjalan bersifat in-memory. Jika bot direstart, room temporary yang aktif sebelum restart tidak lagi tercatat dalam `tempChannels` sehingga fitur auto-cleanup tidak akan menghapusnya saat kosong.
