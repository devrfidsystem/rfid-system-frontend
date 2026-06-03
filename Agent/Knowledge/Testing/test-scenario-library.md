# Test Scenario Library

Katalog blok fungsi _(reusable scenario building blocks)_ agar agen tidak mencetak ulang tata urutan logika murni dari nol saat menulis skrip _Selenium/Node_.

## Block: datatable-search

```text
Action: Ketik "text" pada input[data-testid="input-search"]
Wait: Tunggu 1000ms (Debounce waktu henti)
Verify: Hitung baris tabel `[data-testid^="row-"]`
Verify: Cek kolom pertama baris tabel apakah mengandung kata "text".
```

## Block: datatable-filter

```text
Action: Klik select[data-testid="select-filter-status"]
Action: Klik opsi "Active"
Wait: Tunggu hingga indikator loading hilang (Skeleton mati).
Verify: Semua lencana status pada tabel bertuliskan "Active".
```

## Block: crud-create

```text
Action: Klik btn[data-testid="btn-add-entity"]
Verify: Drawer/Modal dengan data-testid="drawer-form" muncul.
Action: Isi seluruh TextField yang mandatory.
Action: Klik btn[data-testid="btn-submit"]
Wait: Tunggu notifikasi toast sukses (data-testid="toast-success")
Verify: Record baru muncul di baris teratas Datatable.
```

## Block: crud-delete

```text
Action: Klik ikon hapus (btn[data-testid="btn-delete-row-0"])
Verify: Dialog Box konfirmasi penghapusan (data-testid="modal-delete") muncul.
Action: Klik btn[data-testid="btn-confirm-delete"]
Wait: Tunggu notifikasi toast.
Verify: Item id "X" tak dapat ditemukan di seluruh baris tabel.
```

## Block: permission-check

```text
Action: Ubah role pengguna saat ini di DB menjadi "Read-Only".
Action: Muat halaman target URL.
Verify: Tombol "Add Entity" (btn-add-entity) tidak *render* di Document Object Model.
```

## Block: empty-state

```text
Action: Tembak keyword aneh tak wajar pada kolom pencarian (ex: "XYZ_NULL").
Wait: Tunggu pemrosesan.
Verify: Gambar vektor atau teks "Tidak ada data" (data-testid="empty-placeholder") tertampil.
Verify: Komponen Datatable (AppTable) tidak memunculkan baris.
```

## Block: form-validation

```text
Action: Klik tambah data (membuka Drawer kosong).
Action: Klik tombol submit tanpa mengisi parameter satupun.
Verify: Teks pesan kesalahan berwarna merah dengan atribut data-testid="error-message-[nama-field]" muncul minimal satu buah di layar.
```
