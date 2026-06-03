# Domain: Analytics & System

> **AGENT RULE:** Tidak boleh meniru API Call paralelisasi tanpa _promise resolve_ (resiko Prisma connection pool leak di BE). Dilarang keras memalsukan (mock) diagram statistik. Lakukan tracing agregat snapshot ke BE DTO.

## Overview

Lapisan intelijen bisnis dan pengaturan inti aplikasi. Merangkum Dashboard, Snapshot Analytics, Laporan Excel/Print, dan Pengaturan Admin.

## Business Goal

Memberikan visibilitas menyeluruh (_Bird's-eye view_) untuk eksekutif dan manajemen atas metrik gudang yang dikelolanya.

## Actors

- **Executive/Manager**: Membaca grafik dan peringatan _Low Stock_.
- **Super Admin**: Mengonfigurasi modul Aplikasi dan Menu sistem.

## Use Cases

1. **Dashboard Load**: Memuat _Snapshot_ metrik real-time (jumlah EPC aktif, heatmap lokasi).
2. **Filtering Dashboard**: Mengubah parameter _Warehouse_ dan melihat chart direfresh.
3. **App & Menu Settings**: Konfigurasi teknis multi-tenant aplikasi.

## Entities

- `DashboardSnapshot` (Non-persistent/On-the-fly)
- `Company`, `App`, `Menu`

## Database Tables

- `companies`
- `apps`
- `menus`

## API Endpoints

- `GET /api/v1/dashboard/snapshot`
- `GET /api/v1/settings/apps`

## Permissions

- `DASHBOARD_VIEW`, `SETTINGS_MANAGE`.

## UI Pages

- `src/views/dashboard/DashboardPage.vue`
- `src/views/settings/AppsPage.vue`
- `src/views/report/*`

## Relationships

- **IAM**: Membutuhkan `Apps` dan `Menus` untuk konfigurasi Role & Akses pengguna multi-tenant.
- **Seluruh Domain**: Terlibat pasif sebagai penyumbang data ke Snapshot.

## Common Bugs

- **Cascading API (Waterfall)**: Jika komponen Dashboard dipisah (Chart A, Chart B) lalu masing-masing melempar _fetch_ ke backend bersamaan `onMounted`, akan membanjiri koneksi DB Backend. Solusi: Lakukan 1 kali _fetch_ besar dari Bapak komponen (_DashboardPage_).
- **Stale Filter Params**: Parameter dropdown gudang tidak tersinkronisasi ke rute URL, sehingga di-refresh kembali ke _default_.

## Known Constraints

- Dashboard _Heatmap_ membutuhkan performa client besar untuk merender matriks baris jika lokasinya sangat banyak. Wajib di-_slice_ jika terlampau padat.
