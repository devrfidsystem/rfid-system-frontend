# Permission Registry

Daftar kode hak akses (RBAC) yang dijaga secara global di Frontend Guard dan Backend Middleware.

## Permission Code: MASTER_DATA_VIEW

- **Description**: Akses baca _(read-only)_ untuk seluruh daftar data referensi utama.
- **Related Menu**: `/master/*`
- **Related API**: `GET /api/v1/master/*`
- **Related Page**: `MasterEntityPage.vue`

## Permission Code: MASTER_DATA_CREATE

- **Description**: Izin untuk menambah entitas master baru.
- **Related Menu**: `/master/*`
- **Related API**: `POST /api/v1/master/*`
- **Related Page**: `MasterEntityPage.vue` (Laci/Drawer Form)

## Permission Code: TRANSACTION_CREATE

- **Description**: Izin untuk menyusun draf mutasi barang baru.
- **Related Menu**: `/transactions/*`
- **Related API**: `POST /api/v1/transactions/*`
- **Related Page**: `TransactionListPage.vue`

## Permission Code: TRANSACTION_POST

- **Description**: Izin manajerial untuk menyetujui mutasi _(Stock Balance Shift)_.
- **Related Menu**: `/transactions/*`
- **Related API**: `PATCH /api/v1/transactions/:id/status` (Post)
- **Related Page**: `TransactionDetailPage.vue`

## Permission Code: SETTINGS_MANAGE

- **Description**: Izin krusial admin untuk mengubah hierarki tenant & roles.
- **Related Menu**: `/settings/*`, `/iam/*`
- **Related API**: `POST/PUT /api/v1/settings/*`, `POST/PUT /api/v1/iam/*`
- **Related Page**: `RolesPage.vue`, `AppsPage.vue`
