# API Pattern Standard

> Pola integrasi layer komunikasi _network_ aplikasi dengan Backend API.

## Aturan `apiRequest` Helper

- Semua permintaan jaringan _(HTTP Requests)_ WAJIB dibungkus menggunakan `apiRequest` yang telah diekspor dari `@/lib/api/client`.
- **DILARANG KERAS** memanggil `axios.get` atau `axios.post` langsung (seperti di Vue component atau store file). Fungsi `apiRequest` bertindak sebagai _Gatekeeper_ yang secara otomatis menempelkan header JWT dan mem- _parsing_ bentuk envelope backend.

## Abstraksi Service

Semua panggilan `apiRequest` wajib digabungkan dalam berkas khusus layanan (contoh: `src/services/master.service.ts`). File komponen UI Vue dilarang melakukan impor dari `@/lib/api/client`. Semua komponen berurusan dengan file `services/` yang abstrak, bukan URL endpoint harfiah.

## Payload Mapping

Agent DILARANG menembak payload (request body JSON) secara membabi buta. Wajib men-_tracing_ bentuk DTO yang ada di `src/api/feature/dto/`. Pastikan setiap key objek terdefinisi rapi _(type-safe)_.
