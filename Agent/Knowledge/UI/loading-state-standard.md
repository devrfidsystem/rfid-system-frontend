# Loading State Standard

> Penjamin kenyamanan pengguna dan pencegahan double-submission saat sistem sibuk.

## Rule of Loading

1. **Form Submission:** Tombol `Submit` wajib berada dalam kondisi _disabled_ / berubah jadi indikator _Spinner_ segera setelah ditekan hingga _Promise_ merespon sukses/gagal.
2. **Page Load (Init):** Saat halaman dipanggil dan mem- _fetch_ data API utama, kosongkan _space_ layar (sembunyikan datatable) dan gunakan `<LoadingState>` atau Skeleton Loader.
3. Jangan biarkan _UI Freeze_ (beku tanpa indikator visual) saat terjadi pertukaran network lambat.
