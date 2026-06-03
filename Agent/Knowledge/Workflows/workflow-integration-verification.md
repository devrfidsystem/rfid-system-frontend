# Workflow Integration Verification

Gunakan workflow ini saat user memberikan prompt dengan tag `INTEGRATION VERIFY:`.

## Tujuan

Memastikan rantai sambungan dari interaksi komponen UI di peramban pengguna _(Browser)_ secara presisi menembus sampai ke kueri Database Backend, dan memvalidasi tidak adanya tipe/DTO yang meleset _(miss-mapping)_.

## 1. Verifikasi (The Verification Chain)

Lakukan _tracing_ dan pencocokan kode berurut dari ujung ke ujung:

1. `Route` (Vue Router path)
2. `Page` (Komponen Induk `.vue`)
3. `Component` (Input/Tombol Atomik)
4. `Composable` (Blok logika `useX.ts`)
5. `Service` (Client HTTP di `src/services/`)
6. `API` (Jaringan HTTP Interceptor)
7. `Controller` (NestJS Controller)
8. `Service` (NestJS Service)
9. `Repository` (Prisma PrismaClient)
10. `Database` (Tabel Aktual)

## 2. Pengecekan Kesesuaian Kunci

- Pastikan payload yang dikirim Service FE (`camelCase`) sama dengan yang diekstraksi Controller BE (`camelCase`).
- Cek tipe numerik (terkadang Input FE mengembalikan String, tapi Prisma menuntut Number/Int).

## 3. Output Wajib

Berikan output akhir berwujud tabel atau list dengan status final.

**Bila Sukses:**

```md
## Integration Verification Report

PASS

(Semua layer FE ke BE tersambung dengan aman dan type-safe).
```

**Bila Ditemukan Kesenjangan:**

```md
## Integration Verification Report

GAP

Missing / Errors:

- API Wiring: [contoh: Service FE menembak /users, tapi BE mendengar /user]
- DTO Mapping: [contoh: FE mengirim `company_id`, BE mengharapkan `companyId`]
- Route Mapping: [contoh: Router memanggil komponen yang belum diregistrasi]
  ...
```
