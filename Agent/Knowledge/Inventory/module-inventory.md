# Module Inventory

Pemetaan pengelompokan modul berskala besar.

## Module Name: Master Data

- **Purpose**: Mengelola seluruh rujukan data master yang esensial untuk operasional transaksi.
- **Tables**: `warehouses`, `products`, `locations`, `categories`, `uoms`
- **APIs**: `/api/v1/master/*`
- **Pages**: `/master/*` (Warehouse List, Product List)
- **Dependencies**: IAM (Role checking)

## Module Name: Transactions

- **Purpose**: Jantung operasional pergerakan dan mutasi stok secara dokumen fisik.
- **Tables**: `transactions`, `transaction_items`, `stock_balances`, `stock_movements`
- **APIs**: `/api/v1/transactions/*`, `/api/v1/stock/*`
- **Pages**: `/transactions/*` (Inbound, Outbound, Adjustment)
- **Dependencies**: Master Data (untuk mengisi dropdown referensi input)

## Module Name: RFID Operations

- **Purpose**: Sinkronisasi tag hardware RFID dengan _Product_ untuk pemindaian otomatis di gerbang.
- **Tables**: `epc_tags`, `rfid_events`
- **APIs**: `/api/v1/rfid/*`
- **Pages**: `/rfid/*` (Tags, Assignments)
- **Dependencies**: Master Data, Transactions
