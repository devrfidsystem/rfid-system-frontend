# Onboarding & Handover Guide (AOS)

> **Dokumen ini ditujukan untuk Developer Penerus atau apabila Anda memindahkan proyek ini ke IDE / Editor berbasis AI yang berbeda (Cursor, VSCode Copilot, Gemini IDE, dsb).**

Selamat datang di proyek **Warehouse**!
Proyek ini tidak dikembangkan dengan cara tradisional. Proyek ini digerakkan oleh **Warehouse Agent Operating System (AOS)**—sebuah sistem basis pengetahuan yang memaksa _AI Agent_ untuk mematuhi standar _Enterprise_, arsitektur yang kaku, dan melarang keras asumsi/halusinasi.

Jika Anda baru saja mem- _pull_ proyek ini dari Git atau membukanya di _IDE_ baru, ikuti panduan berikut agar AI asisten Anda bisa langsung beradaptasi dengan _AOS_ tanpa perlu diajari dari nol.

---

## 1. Konsep Dasar AOS

Seluruh otak, aturan main, kontrak API, dan pedoman UI proyek ini terkunci di dalam folder:
`Agent/Knowledge/`

Folder ini bukanlah kode sumber aplikasi (aplikasi berada di `src/` dan backend), melainkan **otak sekunder (Second Brain)** bagi asisten AI Anda.

## 2. Pindah IDE / Inisiasi AI Baru

Jika Anda menggunakan IDE baru (seperti beralih dari Gemini Antigravity ke Cursor, atau sebaliknya), AI di IDE baru tersebut pada awalnya **tidak tahu menahu** tentang sejarah dan arsitektur proyek ini.

Untuk mengaktifkan kembali "Sistem Operasi" ini, berikan **Prompt Inisiasi** pertama Anda kepada AI seperti ini:

```text
Halo, saya developer baru di proyek Warehouse ini.
Proyek ini dikendalikan oleh Agent Operating System (AOS).
Tolong baca dan pahami secara mutlak file:
1. Agent/Knowledge/AGENT-RULES.md
2. Agent/HOW-TO-USE.md

Jangan lakukan coding apapun sebelum Anda memahami aturan di atas.
Balas "SISTEM AOS AKTIF" jika Anda mengerti.
```

Setelah AI menjawab, ia telah mewarisi _seluruh memori, standar kualitas, dan struktur project_ yang telah dibangun dengan susah payah oleh developer sebelumnya.

## 3. Cara Bekerja Selanjutnya

Setelah AOS diaktifkan pada AI, Anda sebagai developer tidak perlu menulis _prompt_ panjang untuk _coding_. Cukup gunakan **Magic Tags** yang sudah disediakan. AI akan otomatis mencari sendiri file rujukan SOP di folder `Agent/Knowledge/Workflows/`.

Ketikkan saja perintah minimal seperti:

- `BUG: Form edit produk error`
- `ENHANCEMENT: Tambah kolom harga di tabel warehouse`
- `NEW PAGE: Bikin halaman riwayat hapus`
- `CONTRACT GENERATE: Modul Auth`
- `TEST: Halaman Master Lokasi`
- `RELEASE REVIEW: Modul Master Data`

Selengkapnya tentang daftar _Magic Tags_, silakan baca:
[Agent/HOW-TO-USE.md](HOW-TO-USE.md)

---

## 4. Menambah Aturan / Modul Baru (Untuk Developer)

Jika Anda, sebagai developer manusia, ingin mengubah standar arsitektur _(misal: membolehkan penggunaan state manager lain selain Pinia, atau mengubah framework CSS)_:

- **JANGAN** memberi tahu AI hanya lewat _chat_. Chat akan terhapus/terlupakan.
- **TULISLAH** aturan baru Anda di dalam file _Markdown_ di bawah folder `Agent/Knowledge/` (misalnya di `Agent/Knowledge/Decisions/`).
- Saat Anda menuliskan aturan secara statis di folder tersebut, AI hari ini dan AI di masa depan (ataupun developer penerus Anda kelak) akan selalu membaca dan mematuhinya.

Selamat melanjutkan pengembangan proyek Warehouse secara beradab dan terotomatisasi penuh! 🚀
