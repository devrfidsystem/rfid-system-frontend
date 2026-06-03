# Permission Mapping

> Sinkronisasi batasan RBAC aplikasi Frontend (Gembok UI).

## Otorisasi

- **Cocokkan Permission:** Dilarang me-render opsi "Hapus", "Edit", atau tombol "Post Transaksi" bila _payload_ peran dari Pengguna tidak memiliki akses hak _Role_ tersebut.
- Implementasikan logic pemeriksaan status `hasPermission()` (berasal dari `auth.store`) pada elemen sensitif dengan sintaksis render kondisional Vue `v-if="hasPermission('UPDATE_STOCK')"`.
- Sembunyikan dan tolak (Redirect 403 Forbidden) via Navigation Guard di `src/router/index.ts` untuk pengguna yang tak punya perizinan.
