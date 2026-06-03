# Screen: Warehouse List

## Page Name

Warehouse Master Page

## Purpose

Menampilkan daftar gudang yang terdaftar di dalam sistem, serta form laci (drawer) untuk menambah/mengedit data gudang.

## Route

`/master/warehouses`

## Permission

`MASTER_DATA_VIEW`

## API Used

- `GET /api/v1/master/warehouses`
- `POST /api/v1/master/warehouses` (Create)
- `PATCH /api/v1/master/warehouses/:id` (Update)
- `DELETE /api/v1/master/warehouses/:id` (Delete)

## Components

- `MasterEntityPage.vue` (Komponen Induk Dinamis)
- `AppTable` (Atomic Datatable)
- `AppDrawer` (Side panel form)
- `<FormRoot>` (VeeValidate Form)

## Filters

- Search Text (Code/Name)

## Actions

- View List
- Create Warehouse
- Edit Warehouse
- Soft-Delete Warehouse

## Related Pages

- Product List (Master Data)
- Location List (Sub-entity dari Warehouse)

## Known Issues

- Konfigurasi form dinamis sangat kaku jika ada custom address picker.
