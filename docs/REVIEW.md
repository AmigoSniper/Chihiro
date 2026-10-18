# 🔍 Review Kode & Audit Teknis (Technical Review)

_Terakhir diperbarui: 2026-10-18_
> Perbarui dokumen ini saat mengubah fitur terkait.

Dokumen ini memuat hasil audit teknis kode ChihiroBot pasca-refaktorisasi, inventarisasi temuan masalah yang sengaja tidak diubah (sesuai aturan refactoring tanpa perubahan perilaku), daftar keputusan arsitektur, catatan berkas yang dipindahkan/dihapus, serta rencana pengembangan lanjutan.

---

## 1. Ringkasan Kondisi Kode

### Yang Sudah Rapi & Bagus
- **Arsitektur Modular**: Seluruh logika bisnis telah dikelompokkan ke dalam modul fitur independen di [`features/`](file:///D:/Game/Bot/ChihiroBot/features/) (`lounge`, `musicbot`, `voicetime`). Setiap fitur memiliki `index.js` sebagai satu-satunya pintu masuk API publik.
- **Pembersihan Folder `commands/` dan `events/`**: Direktori [`commands/`](file:///D:/Game/Bot/ChihiroBot/commands/) kini murni hanya berisi file command (definisi `data` dan `execute`), sedangkan [`events/`](file:///D:/Game/Bot/ChihiroBot/events/) murni hanya berisi listener event.
- **Standar Keterbacaan**: Setiap berkas memiliki header komentar seragam (tujuan, dipakai oleh, bergantung pada), pemisahan blok kode yang rapi, anotasi JSDoc pada seluruh fungsi publik, dan komentar bernomor yang menjelaskan alasan alur bertahap.
- **Sentralisasi Variabel Lingkungan**: Pembacaan `process.env` kini terisolasi 100% pada [`config.js`](file:///D:/Game/Bot/ChihiroBot/config.js) akar dengan template [`.env.example`](file:///D:/Game/Bot/ChihiroBot/.env.example) yang terdokumentasi lengkap.
- **Konsistensi Snapshot**: Definisi semua slash command terbukti identik 100% sebelum dan sesudah refaktorisasi.

### Yang Masih Perlu Perhatian (Isu Bawaan yang Belum Diubah)
- **Persistensi File JSON Sinkron (Sync I/O)**: Penulisan file database menggunakan `fs.writeFileSync` yang memblokir Node.js Event Loop dan berisiko korup jika bot crash di tengah proses tulis.
- **State In-Memory Rentan Hilang**: Daftar temporary room (`client.tempChannels`) dan sesi voice yang sedang aktif berada di memori RAM, sehingga restart bot akan menghilangkan data tracking tersebut.
- **Fetch Penuh Seluruh Member Saat Startup**: Eksekusi `guild.members.fetch()` di `ready.js` dapat memicu gateway rate limit jika bot berada di server berskala besar dengan puluhan ribu member.
- **Error yang Ditelan Tanpa Log**: Terdapat beberapa blok `catch () {}` kosong yang menyembunyikan error API Discord.

---

## 2. Tabel Temuan Masalah (Audit Teknis)

> [!NOTE]
> Seluruh temuan di bawah ini sengaja **TIDAK diperbaiki** pada tahap refactoring ini agar menjamin 100% tidak ada perubahan perilaku bot saat ini.

| ID | Tingkat | File & Baris | Masalah | Dampak | Saran Perbaikan | Perkiraan Usaha |
|---|---|---|---|---|---|---|
| **ISS-01** | **Tinggi** | [`features/lounge/store.js#L38`](file:///D:/Game/Bot/ChihiroBot/features/lounge/store.js#L38), [`features/voicetime/store.js#L40`](file:///D:/Game/Bot/ChihiroBot/features/voicetime/store.js#L40) | Penulisan file JSON non-atomic (`fs.writeFileSync`). | Jika server mati mendadak atau bot crash saat menulis file, data JSON bisa terpotong (0 byte / invalid JSON) dan merusak seluruh data. | Gunakan penulisan atomic (tulis ke file temporer `.tmp` terlebih dahulu, lalu lakukan `fs.renameSync` / `fs.promises.rename`). | Kecil |
| **ISS-02** | **Tinggi** | [`features/lounge/handlers.js#L81`](file:///D:/Game/Bot/ChihiroBot/features/lounge/handlers.js#L81), [`features/lounge/rooms.js#L39`](file:///D:/Game/Bot/ChihiroBot/features/lounge/rooms.js#L39) | State `client.tempChannels` hanya tersimpan di memori (in-memory Set). | Saat bot restart, room Gaming Lounge yang sedang aktif menjadi "orphan". Jika kosong, room tidak akan pernah dihapus otomatis. | Simpan array ID channel temporary ke dalam `data/lounge.json`, dan pulihkan Set saat startup bot. | Sedang |
| **ISS-03** | **Sedang** | [`events/ready.js#L26`](file:///D:/Game/Bot/ChihiroBot/events/ready.js#L26) | `guild.members.fetch()` dipanggil untuk seluruh member di setiap guild saat startup tanpa chunking. | Berisiko terkena `GatewayRateLimitError` pada server besar dan memperlambat waktu startup bot secara drastis. | Lakukan fetch member secara lazy (hanya saat dibutuhkan), atau gunakan pagination/chunking bertahap. | Sedang |
| **ISS-04** | **Sedang** | [`commands/resetnick.js#L87`](file:///D:/Game/Bot/ChihiroBot/commands/resetnick.js#L87) | Reset nickname massal menggunakan jeda tetap 1 detik per member dengan batas interaksi Discord 15 menit. | Pada server dengan 1.000 member bernickname, proses memakan waktu >16 menit sehingga interaksi kedaluwarsa dan bot mengirim pesan fallback. | Gunakan queue asynchronous dengan progress bar berkala atau batch endpoint jika tersedia. | Sedang |
| **ISS-05** | **Sedang** | [`features/voicetime/panel.js#L41`](file:///D:/Game/Bot/ChihiroBot/features/voicetime/panel.js#L41) | Variabel `open` (pengecekan izin connect channel) dihitung namun tidak ditampilkan pada embed output. | Fitur tampilan status gembok/kunci channel tampak belum selesai dibuat, membuang komputasi permission. | Tampilkan indikator visual (misal `🔒` jika terkunci) pada string leaderboard, atau hapus perhitungan jika tidak digunakan. | Kecil |
| **ISS-06** | **Rendah** | [`data/voicetime.json`](file:///D:/Game/Bot/ChihiroBot/data/voicetime.json) | Terdapat field `totals` di data JSON yang berisi data per-user, namun tidak pernah dibaca atau ditulis oleh kode. | Dead data / sisa fitur pelacakan waktu perorangan yang belum rampung. | Implementasikan command `/topvoice user` atau hapus field ini dari database secara aman. | Sedang |
| **ISS-07** | **Rendah** | [`events/ready.js#L18`](file:///D:/Game/Bot/ChihiroBot/events/ready.js#L18) | Registrasi slash command bersifat global (`client.application.commands.set()`). | Perubahan definisi command membutuhkan waktu hingga 1 jam untuk terpropagasi di seluruh server Discord. | Sediakan opsi mode registrasi scoped per-guild untuk keperluan testing dan development. | Kecil |
| **ISS-08** | **Rendah** | [`features/lounge/rooms.js#L61`](file:///D:/Game/Bot/ChihiroBot/features/lounge/rooms.js#L61), [`events/messageCreate.js#L35`](file:///D:/Game/Bot/ChihiroBot/events/messageCreate.js#L35) | Error tertelan pada blok `catch(() => {})` tanpa logging. | Kesalahan API Discord (misal bot kehilangan izin menghapus channel) tidak terlihat di konsol log server. | Tambahkan minimal `console.debug` atau logger terpusat agar kegagalan API dapat didiagnosis. | Kecil |

---

## 3. Daftar Keputusan Desain Refactor

Keputusan-keputusan desain yang diambil dalam proses refaktorisasi ini:
1. **Pemisahan Modul Fitur (`features/`)**: Setiap fitur utama (`lounge`, `musicbot`, `voicetime`) dijadikan paket terisolasi dengan `index.js` sebagai satu-satunya fasad publik.
2. **Koleksi Tunggal Data Lounge**: File `data/lounge.json` tetap menyimpan konfigurasi lounge dan bot musik agar format data tidak berubah. Modul `features/musicbot/store.js` membaca dan menulis melalui `features/lounge/store.js` guna menjamin single-source of truth di memori Node.js dan menghindari race condition.
3. **Pembersihan Root Directory**: Semua file fungsional pendukung di direktori akar (`panel.js`, `rooms.js`, `musicpanel.js`, `voicetime.js`, `games.js`, `store.js`) telah dipindahkan ke folder fitur yang sesuai, sehingga direktori akar hanya menyisakan `index.js`, `config.js`, dan konfigurasi proyek.
4. **Perbaikan Penempatan `tempChannels` di `index.js`**: Sebelumnya `client.tempChannels = new Set()` berada di dalam loop pemuatan command sehingga dibuat ulang berulang kali. Kini inisialisasi diletakkan di luar loop sebelum pemuatan command.

---

## 4. Catatan Migrasi File (Pindah, Pecah, Hapus)

| File Lama (Sebelum) | Lokasi Baru (Sesudah) | Alasan Perubahan |
|---|---|---|
| `store.js` (akar) | [`features/lounge/store.js`](file:///D:/Game/Bot/ChihiroBot/features/lounge/store.js) | Pengelolaan data `lounge.json` dijadikan bagian dari modul fitur lounge. |
| `games.js` (akar) | [`features/lounge/games.js`](file:///D:/Game/Bot/ChihiroBot/features/lounge/games.js) | Data seed awal game adalah dependensi khusus milik fitur Gaming Lounge. |
| `panel.js` (akar) | [`features/lounge/panel.js`](file:///D:/Game/Bot/ChihiroBot/features/lounge/panel.js) | Logika select menu dropdown game lounge dipindahkan ke fitur lounge. |
| `rooms.js` (akar) | [`features/lounge/rooms.js`](file:///D:/Game/Bot/ChihiroBot/features/lounge/rooms.js) | Logika pembersihan temporary voice channel dipindahkan ke fitur lounge. |
| `musicpanel.js` (akar) | [`features/musicbot/panel.js`](file:///D:/Game/Bot/ChihiroBot/features/musicbot/panel.js) | Logika embed status bot musik dipindahkan ke fitur khusus musicbot. |
| `voicetime.js` (akar) | [`features/voicetime/`](file:///D:/Game/Bot/ChihiroBot/features/voicetime/) (Dipecah menjadi `store.js`, `helpers.js`, `panel.js`, `tracker.js`, `handlers.js`, `index.js`) | File besar (monolitik) dipecah per tanggung jawab: persistensi data, kalkulasi sesi, pembuatan embed, dan handler command. |

---

## 5. Rencana Pengembangan Lanjutan (Roadmap)

Daftar usulan peningkatan fitur untuk masa mendatang, diurutkan berdasarkan prioritas:

### Prioritas 1 (Stabilitas & Reliabilitas)
- **Implementasi Atomic File Saving**: Mencegah korupsi data JSON saat server crash (mengatasi ISS-01).
- **Persistensi State Temporary Room**: Menyimpan `tempChannels` ke database agar auto-cleanup tetap berjalan setelah bot restart (mengatasi ISS-02).
- **Graceful Error Logger**: Mengganti `console.error`/`console.warn` dengan logger terstruktur (misal Winston atau Pino) untuk memudahkan audit log server.

### Prioritas 2 (Penyelesaian Fitur Gantung)
- **Leaderboard User Voice Time**: Memanfaatkan data `totals` di `data/voicetime.json` untuk menghadirkan command leaderboard member teraktif `/topvoice member`.
- **Indikator Channel Terkunci**: Menampilkan ikon gembok pada channel yang tidak bisa dimasuki oleh `@everyone` di embed Top Voice (mengatasi ISS-05).

### Prioritas 3 (Optimasi Skalabilitas)
- **Database Engine Ringan**: Mempertimbangkan migrasi dari file JSON mentah ke database embedded seperti SQLite (menggunakan `better-sqlite3`) jika data server terus bertumbuh besar.
- **Guild Command Deployment**: Menambahkan flag script `npm run deploy:guild` untuk update instan slash command saat tahap pengembangan di server dev.
