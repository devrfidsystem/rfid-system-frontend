# Datatable Standard

> Menstandarisasi penggunaan dan penayangan data array ke dalam tabel interaktif.

## Core Rules

1. Selalu gunakan komponen `<Table>` (dan `<Pagination>` pendampingnya jika diperlukan) dari Atomic Component library, jangan membongkar ulang dengan `<table>` HTML native kecuali dipaksa design.
2. **Server-Side Pagination:** Semua datatable yang mengambil data dari database backend besar WAJIB dipaginate di API.
3. State tabel (`limit`, `page`, `total`) dikelola secara sinkron dengan parameter API query (`?page=X&limit=Y`).
4. Komponen tabel tidak diperbolehkan untuk memanggil fungsi _service_ API secara langsung; ia hanya disuntik array _Rows_ lewat `props`.

## Loading & Empty States

Saat proses fetch berlangsung, bungkus tabel dengan komponen atau kerangka LoadingState (seperti _Skeleton_).
Saat response `items.length === 0`, gunakan `<EmptyState>` untuk menginformasikan kepada pengguna. Jangan tampilkan tabel kosong tanpa panduan.
