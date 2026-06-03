# Panduan Penggunaan Agent Operating System (AOS)

Selamat datang di ekosistem **Warehouse Agent Operating System (AOS)**!
Sistem ini dirancang untuk mendidik _AI Agent_ secara otomatis agar mengerti keseluruhan arsitektur proyek (Frontend Vue & Backend NestJS Prisma) sebelum menulis satu baris kode pun.

Dengan sistem ini, Anda tidak perlu lagi menjelaskan _tech-stack_, memberikan _context_ berulang-ulang, atau takut AI menghasilkan kode halusinasi/asumsi. AOS memaksa AI untuk mengikuti standar kelas _Enterprise_.

---

## 🔑 Inisiasi AOS (Wajib Bagi Developer/IDE Baru)

Jika Anda adalah developer penerus yang baru mengambil alih proyek ini, atau Anda **memindahkan proyek ini ke IDE / Editor AI baru** (seperti beralih ke Cursor, Windsurf, atau sesi _chat_ baru), AI pada awalnya **tidak tahu menahu** tentang sejarah dan arsitektur proyek ini.

Untuk "membangunkan" dan mengunci AI pada arsitektur yang sudah di- _set_, salin dan kirimkan **Prompt Inisiasi** berikut sebagai pesan pertama Anda ke AI:

```text
Halo, saya developer baru di proyek Warehouse ini.
Proyek ini dikendalikan oleh Agent Operating System (AOS).
Tolong baca dan pahami secara mutlak file:
1. Agent/Knowledge/AGENT-RULES.md
2. Agent/HOW-TO-USE.md

Jangan lakukan coding apapun sebelum Anda memahami aturan di atas.
Balas "SISTEM AOS AKTIF" jika Anda mengerti.
```

Setelah AI menjawab, barulah Anda dapat memberikan perintah kerja menggunakan tata cara di bawah ini.

---

## 🚀 Cara Penggunaan (Minimal Prompting)

Untuk memberikan perintah kepada Agen, Anda **wajib** mengawali pesan (prompt) Anda dengan salah satu dari **9 Kata Kunci Ajaib (Magic Tags)** berikut.

Kata kunci ini akan dibaca oleh Agen dan otomatis dialihkan _(routed)_ ke Standar Operasional Prosedur (SOP) / _Workflow_ yang tepat.

### 1. Memperbaiki Bug (`BUG:`)

Gunakan saat sistem tidak berjalan sebagaimana mestinya. Agen akan mencari akar masalah _(Root Cause)_ tanpa membuat asumsi.

**Contoh Prompt:**

```text
BUG:
- Halaman Inbound Transaction error 500 saat disubmit.
```

### 2. Menambah Fitur Minor (`ENHANCEMENT:`)

Gunakan saat ingin memperbarui atau memodifikasi fungsionalitas yang sudah ada tanpa merombak arsitektur besar.

**Contoh Prompt:**

```text
ENHANCEMENT:
- Halaman Product List
- Tambahkan filter pencarian berdasarkan "Kategori".
```

### 3. Membuat Layar/Fitur Baru (`NEW PAGE:`)

Gunakan saat ingin membangun modul dari nol (Frontend hingga Backend).

**Contoh Prompt:**

```text
NEW PAGE:
- Buat halaman Laporan Stok.
- Berisi tabel yang merangkum data dari tabel stock_balances.
```

### 4. Bongkar & Analisis Kode (`ANALYZE:`)

Gunakan jika Anda (_Reverse Engineer_) ingin mengetahui cara kerja modul lama yang dokumentasinya minim. Agen akan memetakan _route_, API, dan tabel DB-nya.

**Contoh Prompt:**

```text
ANALYZE:
- Modul RFID Assignment
```

### 5. Buat Kontrak API Otomatis (`CONTRACT GENERATE:`)

Gunakan untuk memaksa Agen mengekstrak file kode eksisting dan menjadikannya dokumen spesifikasi formal (DTO, Endpoint, dsb).

**Contoh Prompt:**

```text
CONTRACT GENERATE:
- Modul Settings / Role Access
```

### 6. Review Kesiapan Rilis (`RELEASE REVIEW:`)

Gunakan untuk melakukan audit QA ketat (mencari `any`, mengecek _Loading State_, dsb) sebelum kode diluncurkan ke _Production_.

**Contoh Prompt:**

```text
RELEASE REVIEW:
- Modul Inventory
```

### 7. Pengujian E2E (`E2E TEST:`)

Gunakan untuk memerintahkan Agen membuat _script_ automasi klik UI (Selenium).

**Contoh Prompt:**

```text
E2E TEST:
- Halaman Master Warehouse
```

### 8. Audit Kepatuhan (`AUDIT:`)

Gunakan untuk memeriksa apakah sebuah file sudah mengikuti standar komponen dan arsitektur _Atomic Design_ AOS.

**Contoh Prompt:**

```text
AUDIT:
- src/views/master/MasterEntityPage.vue
```

### 9. Verifikasi Integrasi FE-BE (`INTEGRATION VERIFY:`)

Gunakan untuk menelusuri secara urut dari _View_ (Vue) hingga ke Tabel Database (Prisma) guna mencari _mismatch_ nama _property_ (contoh: `company_id` vs `companyId`).

**Contoh Prompt:**

```text
INTEGRATION VERIFY:
- Alur penyimpanan Outbound Transaction
```

---

## ⚠️ Aturan Emas (Golden Rules)

1. **Jangan Berikan Data Palsu (Mock)**: AOS didesain untuk menolak _Mock Data_. Jika API belum ada, Agen akan menyuruh Anda/Dirinya membuat _Service_ aslinya.
2. **Biarkan Agen Membaca Dahulu**: Terkadang Agen membutuhkan waktu 1-2 turn/langkah untuk mencari _file_ yang relevan (Tracing). Biarkan ia mencari, jangan paksa langsung _coding_.
3. **Patuhi Template AOS**: Jika Anda ingin menambah aturan baru ke agen, tulis di folder `Agent/Knowledge/` (seperti `Decisions/` atau `Contracts/`) dengan format Markdown yang telah disepakati. Agen akan membacanya secara otomatis di interaksi berikutnya.
