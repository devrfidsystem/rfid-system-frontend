# Release Checklist

Daftar periksa _(checklist)_ pamungkas sebelum sebuah modul dinyatakan _Production Ready_.

## Frontend Readiness

- [ ] **Route registered**: Rute dapat diakses dan dijaga oleh `requiresAuth`.
- [ ] **Menu registered**: Muncul di _Sidebar/Navbar_ sesuai hirarki `menu-registry`.
- [ ] **Permission registered**: Dilindungi dengan kode RBAC yang tepat.
- [ ] **Composable connected**: Logika terpisah rapi di `useFeature.ts`.
- [ ] **Service connected**: Pemanggilan HTTP lewat `src/services/` tanpa Axios murni.
- [ ] **Build success**: Lolos _vite build_ (`pnpm run build`) tanpa error.
- [ ] **Lint success**: Lolos TypeScript linter dan formatter.
- [ ] **E2E pass**: Lolos skenario Selenium/End-to-End.

## Backend Readiness

- [ ] **DTO**: DTO Request/Response berdekorator _class-validator_ yang lengkap.
- [ ] **Validation**: Tidak ada `any` yang meloloskan payload sampah.
- [ ] **Controller**: Rapi, mengembalikan format standar (Envelope).
- [ ] **Service**: Mengelola bisnis logika dan melemparkan `HttpException` spesifik.
- [ ] **Repository**: Prisma query optimal tanpa `N+1 problem`.
- [ ] **Migration**: File migrasi DB (_Prisma migrate_) berstatus _applied_.
- [ ] **Seed**: Ketersediaan _seeders_ untuk data rujukan (Master data awal).
- [ ] **Swagger**: Anotasi _ApiProperty_ dan _ApiOperation_ 100% tergambar di Swagger UI.

## Integration & Quality

- [ ] **FE → API**: Tidak ada asimetri nama _property_ JSON.
- [ ] **API → DB**: Data tersimpan persis sesuai yang dikirimkan klien.
- [ ] **Permission**: Backend menolak (_403 Forbidden_) jika diakses _bypass_ cURL.
- [ ] **Audit log**: Tabel historis (contoh: _ledgers_, _event logs_) merekam mutasi dengan benar.
- [ ] **Error handling**: Muncul _Toast UI_ manusiawi saat HTTP Gagal.
- [ ] **Empty state**: Tidak ada tampilan tabel bolong putih; menampilkan _Placeholder_.
- [ ] **Loading state**: Komponen memuat (_Spinner/Skeleton_) sebelum data utuh tiba.
