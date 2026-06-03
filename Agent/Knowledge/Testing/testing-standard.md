# UI Testing Standard

Standar minimal cakupan skenario pengujian untuk seluruh halaman aplikasi.
Setiap halaman **wajib** melalui verifikasi tes berikut jika fiturnya memang ada pada laman tersebut.

Jika fitur tertentu tidak tersedia pada laman (contoh: Laporan Stok tidak memiliki tombol "Hapus"), Agen harus melewatkan tes tersebut secara eksplisit _(Skip)_ dengan membubuhkan alasan di laporan.

## Wajib Ada (Mandatory Core Testing)

1. **Page Load Test**: Memastikan layar berhasil ter- _render_ (Status 200) tanpa macet.
2. **Permission Test**: Memastikan pengguna tanpa peran yang tepat ditolak (_403 Forbidden_ / dialihkan).
3. **Empty State Test**: Memastikan visual placeholder ("Data tidak ditemukan") muncul bila API mereturn array kosong.
4. **Error State Test**: Memastikan _Toast/Alert_ UI muncul saat API gagal (disimulasikan atau karena _bad request_).

## Fungsional Tabel (Datatable Features)

5. **Pagination Test**: Mengklik halaman 2 dan mengecek mutasi parameter URL/request.
6. **Sorting Test**: Mengklik header tabel dan memastikan panah indikator _(sort direction)_ berubah.
7. **Search Test**: Mengetik kata kunci, memastikan _debounce_ selesai, dan tabel me-_refresh_.
8. **Filter Test**: Mengganti status menu tarik-turun (dropdown) dan memastikan _payload_ tersaring.

## Fungsional CRUD (Data Modification)

9. **Validation Test**: Menekan _Submit_ pada isian form kosong, memastikan peringatan validasi form (teks warna merah) muncul secara visual.
10. **Create Test**: Mengisi seluruh parameter isian form dan menekan simpan (_Happy Path_).
11. **Edit Test**: Membuka laci _(drawer)_ atau modal data eksisting, merubah 1 isian, dan menyimpan.
12. **Delete Test**: Menekan ikon tong sampah, menekan tombol "Konfirmasi" pada _dialog box_, lalu memastikan _item_ lenyap dari tabel.
