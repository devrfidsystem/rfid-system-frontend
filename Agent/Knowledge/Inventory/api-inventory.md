# API Inventory

Katalog Endpoint backend untuk acuan agen.

## API: Get Warehouses

- **Method**: GET
- **Endpoint**: `/api/v1/master/warehouses`
- **Module**: Master Data
- **Controller**: `MasterWarehouseController`
- **DTO**: `WarehouseResponseDto`
- **Used By Pages**: `MasterEntityPage.vue` (warehouses)
- **Permission**: `MASTER_DATA_VIEW`

## API: Get Products

- **Method**: GET
- **Endpoint**: `/api/v1/master/products`
- **Module**: Master Data
- **Controller**: `MasterProductController`
- **DTO**: `ProductResponseDto`
- **Used By Pages**: `MasterEntityPage.vue` (products)
- **Permission**: `MASTER_DATA_VIEW`

## API: Post Adjustment

- **Method**: POST
- **Endpoint**: `/api/v1/transactions/adjustment`
- **Module**: Inventory / Transactions
- **Controller**: `TransactionController`
- **DTO**: `AdjustmentCreateDto`
- **Used By Pages**: `StockAdjustmentPage.vue`
- **Permission**: `TRANSACTION_CREATE`

## API: Get RFID Tags

- **Method**: GET
- **Endpoint**: `/api/v1/rfid/tags`
- **Module**: RFID Operations
- **Controller**: `RfidController`
- **DTO**: `RfidTagResponseDto`
- **Used By Pages**: `TagRegistrationPage.vue`
- **Permission**: `RFID_VIEW`
