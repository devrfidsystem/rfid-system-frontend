# Known Issue: Connection Pool Exhaustion

## Problem

Dashboard utama atau halaman log gagal dimuat dengan mengembalikan Error 500 (Internal Server Error) secara intermiten (kadang muncul kadang tidak). Console browser menunjukkan `net::ERR_CONNECTION_TIMED_OUT` atau `PrismaClientKnownRequestError: P2024`.

## Root Cause

Aplikasi Frontend melempar terlalu banyak permintaan HTTP (Axios Calls) secara serentak _(parallel)_ pada komponen-komponen grafik anak (_children components_) yang di- _mount_ secara bersamaan. Backend Prisma tidak bisa melayani lusinan query database yang datang berbarengan dalam satu detik karena batasan _connection limit_ koneksi pool ke database.

## Fix

1. Mengubah struktur _fetching_ Frontend agar menggunakan satu _Promise.all()_ terukur atau menarik satu _endpoint agregator_ (contoh: `dashboard/snapshot`) di komponen induk (_DashboardPage.vue_), lalu mendistribusikan datanya via `props` ke grafik anak.
2. Memperbaiki kode `DashboardService` di NestJS Backend untuk memproses iterasi transaksi secara _sequential_ (await loop) bukan via `Promise.all` _brute-force_.

## Related Files

- `src/views/dashboard/DashboardPage.vue`
- `src/views/dashboard/composables/useDashboard.ts`

## Related API

- `GET /api/v1/dashboard/snapshot`
