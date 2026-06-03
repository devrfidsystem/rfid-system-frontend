# Database Inventory

Katalog tabel database untuk modul Warehouse Backend (diambil dari Prisma Schema).

## Table: warehouses

- **Purpose**: Menyimpan data identitas lokasi gudang secara makro.
- **Module**: Master Data
- **Relations**: 1-to-M `locations`, 1-to-M `stock_balances`
- **Referenced By**: `Transaction`, `Adjustment`, `UserAccess`
- **Related APIs**: `GET /api/v1/master/warehouses`, `POST /api/v1/master/warehouses`
- **Related Pages**: `MasterEntityPage.vue` (warehouses)

## Table: products

- **Purpose**: Menyimpan katalog master barang.
- **Module**: Master Data
- **Relations**: M-to-1 `categories`, M-to-1 `uoms`
- **Referenced By**: `TransactionItem`, `StockBalance`, `RfidTag`
- **Related APIs**: `GET /api/v1/master/products`
- **Related Pages**: `MasterEntityPage.vue` (products)

## Table: stock_balances

- **Purpose**: Mencatat saldo agregat _(Current state)_ jumlah barang per gudang dan per lokasi.
- **Module**: Inventory / Transactions
- **Relations**: M-to-1 `products`, M-to-1 `warehouses`, M-to-1 `locations`
- **Referenced By**: `OutboundTransaction` (Validation)
- **Related APIs**: `GET /api/v1/stock/balance`
- **Related Pages**: `StockBalancePage.vue`

## Table: stock_movements (ledgers)

- **Purpose**: Buku besar mutasi untuk menyimpan riwayat historis _(Audit trail)_ pergerakan stok.
- **Module**: Inventory / Transactions
- **Relations**: M-to-1 `transactions`, M-to-1 `products`
- **Referenced By**: `StockReport`
- **Related APIs**: `GET /api/v1/reports/movements`
- **Related Pages**: `LedgerReportPage.vue`

## Table: rfid_tags (epc_tags)

- **Purpose**: Registri tag RFID elektronik ke produk fisik.
- **Module**: RFID Operations
- **Relations**: M-to-1 `products`
- **Referenced By**: `RfidEvent`
- **Related APIs**: `GET /api/v1/rfid/tags`
- **Related Pages**: `TagRegistrationPage.vue`
