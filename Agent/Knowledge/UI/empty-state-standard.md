# Empty State Standard

> Tampilan khusus saat hasil kueri / tabel data mengembalikan hasil (0).

## Varian Empty State

Setiap _Empty State Component_ biasanya membawa properti (Varian).

1. **Data Kosong Default:** Saat pengguna pertama kali meload modul dan memang datanya tidak pernah dibuat (Belum ada Master, dsb).
2. **Search Not Found Kosong:** Datanya kosong akibat _Filter_ atau _Search String_ tidak membuahkan hasil (Tampilkan tombol _Clear Filter_).

## Penerapan

Bungkus bagian tubuh Tabel dengan direktif Vue `v-if="items.length === 0"` lalu cetak komponen `<EmptyState />` dengan prop yang sesuai kondisi (default vs filtered). Dilarang menyisipkan teks "Data kosong" manual secara kaku di tengah elemen tabel native `<tr>`.
