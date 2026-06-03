# Project Map (Traceability Tree)

Menggambarkan alur eksekusi aplikasi dari ujung jari pengguna di Browser hingga ke baris Database.

## Master Data: Warehouse

`Menu: Warehouses`
↓
`Route: /master/warehouses`
↓
`Page: MasterEntityPage.vue`
↓
`Component: <AppTable /> & <AppDrawer />`
↓
`API Client: src/services/master.service.ts`
↓
**(Network Boundary)**
↓
`API Endpoint: GET /api/v1/master/warehouses`
↓
`BE Controller: MasterWarehouseController`
↓
`BE Service: MasterWarehouseService`
↓
`BE Repository: Prisma (this.prisma.warehouse.findMany)`
↓
`Database Table: warehouses`

## Inventory: Transactions

`Menu: Inbound`
↓
`Route: /transactions/inbound`
↓
`Page: TransactionListPage.vue`
↓
`Component: <TransactionForm />`
↓
`API Client: src/services/transaction.service.ts`
↓
**(Network Boundary)**
↓
`API Endpoint: POST /api/v1/transactions/inbound`
↓
`BE Controller: TransactionController`
↓
`BE Service: TransactionService`
↓
`BE Repository: Prisma Transaction (Create Transaction + Mutasi Stock)`
↓
`Database Tables: transactions, transaction_items, stock_balances, stock_movements`
