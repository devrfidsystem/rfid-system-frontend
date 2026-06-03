# Pagination Standard

> Mekanisme halaman pada Datatables sisi server.

## API Request

Standar parameter kueri yang digunakan di project Warehouse Backend adalah:

- `?page=X` (Index halaman aktif, dimulai dari 1)
- `?limit=Y` (Ukuran maksimum list row tiap lembar tabel)

## API Response Envelope

Respons data berformat `ApiResponse<T>` akan memuat info paging di properti meta:

```json
"meta": {
   "page": 1,
   "limit": 20,
   "total": 354
}
```

## Integrasi UI Pagination

Informasi tersebut harus disuntikkan _(two-way bound)_ ke dalam state tabel di file Composable Frontend. Pastikan tombol "Prev" diblok saat `page === 1` dan tombol "Next" diblok ketika hitungan total lembar telah tercapai. Hati-hati dengan sinkronisasi URL Route query!
