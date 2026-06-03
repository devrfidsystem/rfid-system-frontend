# Definition of Done

> Standardisasi kriteria yang menandakan suatu tugas agen/pengembang dapat dinyatakan tuntas.

Task dianggap selesai jika telah memenuhi _checklist_ berikut:

- [ ] **Build success**: Proyek (`pnpm run build`) dapat dicompile tanpa peringatan fatal.
- [ ] **Lint success**: Tidak ada error linter yang diabaikan.
- [ ] **Type-safe**: Interface Typescript digunakan sepenuhnya pada parameter dan _return_.
- [ ] **No `any`**: Tidak ada satupun tipe `any` pada kode yang baru ditulis/dirubah.
- [ ] **API terhubung**: Komunikasi dengan API sesungguhnya _(Network Layer)_ berhasil.
- [ ] **Empty state**: Skenario ketika data balikan API bernilai `[]` sudah dirender ke komponen kosong.
- [ ] **Loading state**: Tombol & tabel memiliki status disabilitas / putar ketika _Promise_ berjalan.
- [ ] **Error state**: Kesalahan _catch_ menghasilkan `toast`/notifikasi yang manusiawi (bukan sekadar `console.log`).
- [ ] **Permission terpasang**: `v-if="hasPermission(...)"` diatur di elemen UI yang sensitif.
- [ ] **Menu expose benar**: Tersinkronisasi dengan konfigurasi Sidebar.
- [ ] **Route benar**: Router Vue diregistrasi dengan `meta: { requiresAuth: true }`.
- [ ] **E2E pass**: Lolos selenium _test_ jika fitur krusial berubah (atau minimal tidak merusak flow lama).
- [ ] **No mock data**: TIDAK ADA array dummy `const data = [{id: 1}]`. Data wajib _live_.
- [ ] **Contract sesuai**: Sesuai dengan spesifikasi `Contracts/` atau JSON DTO backend.
