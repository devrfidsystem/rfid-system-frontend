# Workflow Contract Generator

Gunakan workflow ini saat user memberikan prompt dengan tag `CONTRACT GENERATE:`.

## Tujuan

Menginspeksi modul/layar eksisting dan secara mandiri menghasilkan atau me- _sync_ file _Contract Markdown_ resmi di dalam `Agent/Knowledge/Contracts/`.

## 1. Sync & Merge Rule

- Jika file contract belum ada (contoh: `Contracts/my-module.md`), buat dari nol.
- Jika file contract sudah ada, JANGAN membuat duplikat (seperti `my-module-2.md`). Lakukan _merge_ (pembaharuan) pada file yang eksis. Jaga agar tidak ada spesifikasi yang bertentangan _(conflict)_.

## 2. Data Extraction

Lakukan _Reverse Engineering_ parsial untuk mengekstrak:

- Nama Menu & Router
- Konstanta Otorisasi
- API DTO & Query Parameters
- Kolom Tabel (Header UI)
- Komponen _Filter_ & Aksi Tombol

## 3. Output Wajib

Hasil akhirnya wajib disuntikkan ke dalam file `Contracts/[nama-module].md` dengan format:

```md
## Menu

[Nama Halaman]

## Route

[Vue Router Path]

## Permission

[RBAC Code]

## Page

[File Vue utama]

## API

[List of Endpoints]

## Request DTO

[JSON/Type]

## Response DTO

[JSON/Type]

## Entities

[Entitas Bisnis]

## Database Tables

[Tabel Prisma]

## Relationships

[Hubungan Foreign Key atau Modul]

## Actions

[Aksi User (Create/Update)]

## Filters

[Filter Tabel]

## Dependencies

[Modul/Service yang dibutuhkan]
```
