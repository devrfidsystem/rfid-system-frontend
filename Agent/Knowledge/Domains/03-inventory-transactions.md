# Domain: Inventory & Transactions

> **AGENT RULE:** Operasi transaksi bersifat multi-step dan high-risk. DILARANG berasumsi terkait status flow mutasi (Inbound/Outbound, dsb). Selalu tracing dari `src/api/feature/dto/transactions.dto.ts` atau endpoint terkait. Semua field payload mutasi harus dipastikan dari bentuk asli backend.

## Overview

Mesin pergerakan stok, mengelola siklus Inbound, Outbound, Relocation, Transfer, Return, serta penghitungan opname dan penayangan Ledger/Buku Besar inventaris.

## Business Goal

Menjaga akurasi kuantitas barang di dalam gudang secara real-time dan memberikan jejak audit setiap mutasi aset.

## Actors

- **Warehouse Operator**: Melakukan input draft mutasi.
- **Warehouse Manager**: Melakukan persetujuan (Posting) dokumen.

## Use Cases

1. **Create Document (Inbound/Outbound)**: Menyusun header dokumen dan list item yang digerakkan.
2. **Post/Approve Document**: Merubah status dari `draft` ke `posted` yang akan mengunci dokumen dan menggeser saldo _(Stock Balance)_ secara permanen.
3. **View Stock Balance**: Menampilkan total kuantitas per produk per lokasi saat ini.

## Entities

- `Transaction` (Header)
- `TransactionItem` (Detail array)
- `StockBalance` (Agregat berjalan)

## Database Tables

- `transactions`
- `transaction_items`
- `stock_balances`
- `stock_ledgers` (History)

## API Endpoints

- `GET /api/v1/transactions/:type`
- `POST /api/v1/transactions/:type`
- `PATCH /api/v1/transactions/:id/status` (Update state machine)
- `GET /api/v1/stock/balance`

## Permissions

- `TRANSACTION_CREATE`, `TRANSACTION_POST`, `STOCK_VIEW`.

## UI Pages

- `src/views/transactions/TransactionListPage.vue`
- `src/views/transactions/TransactionDetailPage.vue`
- `src/views/stock/StockBalancePage.vue`

## Relationships

- **Master Data**: Jantung dari transaksi (rujukan ID).
- **RFID**: Digunakan sebagai alat pemicu validasi barang yang sedang lewat gerbang _(Inbound/Outbound)_.

## Common Bugs

- **State Array Hilang**: Karena form item dinamis (Tambah/Hapus Baris), jika tidak menggunakan VeeValidate `useFieldArray` dengan benar, reaktivitas index baris bisa rusak.
- **Tipe Transaksi Hardcode**: Routing yang menggunakan hardcode `'inbound'` alih-alih `route.params.type` membuat komponen tidak dapat di- _reuse_ untuk 'outbound'.

## Known Constraints

- Validasi item stok yang dikirim saat _Outbound_ harus mengecek ketersediaan _Stock Balance_. Backend menangani validasi final, tapi Frontend harus memblokir lebih awal jika _quantity_ > saldo.
