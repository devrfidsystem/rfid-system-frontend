# Page to API Wiring

> Alur sinkronisasi pergerakan interaksi UI halaman dengan jembatan API Backend.

## Wiring Process

Agent WAJIB mengikuti urutan perakitan UI sebelum melakukan implementasi _coding_:

1. **Cari API:** Telusuri di `src/api/` atau file backend _controller_ mana endpoint yang akan dituju.
2. **Kumpulkan Parameter:** Kumpulkan daftar filter atau ID apa yang wajib ditransmisikan (berdasarkan `useRoute` params atau query params).
3. **Bangun Composable:** Bungkus panggilan service ke dalam variabel _reactive_ `ref` yang dapat dirender ke template (termasuk _flag_ Loading & Error).
4. **Pasang di Page Component (`.vue`):** Tarik _composable hooks_ ke blok _setup_ dan tempel data hasilnya ke properti `props` komponen tabel / grafik.
