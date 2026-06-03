# Reference Projects & Implementations

> Pola tiruan dari dalam (atau luar) ekosistem agar Agent menggunakan referensi _Existing_ sebelum menemukan _Pattern_ baru.

## Tujuan Referensi

Jika Anda perlu membangun form Master Data baru, **JANGAN** membuat fungsi CRUD dari awal. Silakan mencontek pola dari arsitektur _Config-Driven_ di `src/views/master/entityConfig.ts`.

Jika Anda perlu membangun tabel dinamis laporan mutasi stok, telusuri cara `TransactionListPage.vue` membangun halaman dengan `useTransaction` dan `AppTable`.

> **ATURAN EMAS:** Temukan kode di project yang paling menyerupai tugas yang diminta oleh Prompt. Tirulah gaya dan konvensi _naming_ darinya. Jangan memasukkan _pattern_ arsitektur asing meskipun itu diyakini lebih modern oleh AI. Hati-hati dengan sinkronisasi versi library yang mungkin tidak kompatibel.
