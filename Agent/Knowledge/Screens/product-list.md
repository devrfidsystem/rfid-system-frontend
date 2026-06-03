# Screen: Product List

## Page Name

Product Master Page

## Purpose

Mengelola katalog produk (barang inventori) beserta metadatanya (Kategori, UOM).

## Route

`/master/products`

## Permission

`MASTER_DATA_VIEW`

## API Used

- `GET /api/v1/master/products`
- `GET /api/v1/master/options?key=categories` (Untuk Form)
- `GET /api/v1/master/options?key=uoms` (Untuk Form)

## Components

- `MasterEntityPage.vue`
- `AppTable`
- `AppDrawer`
- `SelectField` (Dropdown Kategori & UOM)

## Filters

- Search Text
- Category Filter

## Actions

- Tambah Produk Baru
- Edit Metadata Produk
- Hapus Produk

## Related Pages

- Transaction Inbound Page (Memilih Produk ini)
- Stock Balance Page (Menampilkan saldo Produk ini)

## Known Issues

- Memuat dropdown _Category_ yang berisi >1000 data bisa menyebabkan browser _lagging_ jika tidak di-paginate pada API opsi.
