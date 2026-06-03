# Domain: Master Data

> **AGENT RULE:** Halaman ini bersifat _Config-Driven_. Dilarang berasumsi tentang penambahan field master secara _hardcode_. Wajib tracing konfigurasi via `src/views/master/entityConfig.ts` dan DTO API terkait jika menambahkan model data master baru.

## Overview

Entitas inti sistem yang mengatur dimensi gudang, lokasi fisik, data produk, supplier, dan konfigurasi master lainnya.

## Business Goal

Menyediakan kamus data (rujukan) yang _Single Source of Truth_ untuk operasional pergerakan barang.

## Actors

- **Admin Master**: Mengatur kategori barang, menambah gudang baru.
- **System**: Mengonsumsi data ini sebagai _dropdown options_.

## Use Cases

1. **Auto-Generated CRUD**: Merender tabel dan form secara dinamis dari meta-config.
2. **Options Provider**: Menyuplai dropdown untuk domain Transaksi (misal `getOptions('warehouses')`).

## Entities

- `Warehouse`, `Location`, `Product`, `Category`, `Uom`, `Supplier`.

## Database Tables

- `warehouses`, `locations`, `products`, `product_categories`, `uoms`, `suppliers`.

## API Endpoints

- `GET /api/v1/master/:entity` - List pagination dinamis.
- `POST /api/v1/master/:entity` - Buat baru.
- `GET /api/v1/master/options` - List singkat untuk Select input.

## Permissions

- `MASTER_DATA_VIEW`, `MASTER_DATA_CREATE`, `MASTER_DATA_EDIT`, `MASTER_DATA_DELETE`.

## UI Pages

- `src/views/master/MasterEntityPage.vue` (`/master/:entity`) - Render dinamis.

## Relationships

- **Inventory & Transactions**: Setiap item transaksi butuh _Product ID_ dan _Location ID_.

## Common Bugs

- **Mismatch Config**: Type data di `entityConfig.ts` (`number` vs `string`) tidak selaras dengan DTO backend menyebabkan form submit gagal divalidasi NestJS.

## Known Constraints

- Form dinamis sulit dimodifikasi jika ada satu entitas yang butuh UI _highly custom_ (seperti map picker). Harus membangun komponen kustom (Form component injection).
