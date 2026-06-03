# Route Mapping

> Cara memetakan komponen ke dalam sistem navigasi Vue Router.

## Routing Registry

- Rute-rute aplikasi terdaftar secara terpusat di `src/router/index.ts`.
- **Cocokkan Route:** Saat mengklik tautan, jangan gunakan parameter `href` native melainkan manfaatkan instance `<router-link :to="...">` atau fungsi `router.push({ name: 'namaRoute', params: { ... } })`.
- **Cocokkan Menu Contract:** Pastikan pendaftaran halaman (_route path_) di _Frontend_ sesuai dan koheren dengan menu yang dideklarasikan oleh tabel Master Aplikasi di Backend / Menu Settings. Halaman rute `/my-feature` harus memiliki hak identitas _Key_ yang setara.
