# Menu Registry

Daftar struktur hierarki navigasi utama aplikasi Warehouse.
Digunakan oleh Vue Router dan Komponen Sidebar/Navbar.

## Menu Name: Dashboard

- **Route**: `/`
- **Permission**: `DASHBOARD_VIEW`
- **Parent Menu**: ROOT
- **Children Menu**: N/A
- **Related APIs**: `/api/v1/dashboard/snapshot`
- **Related Pages**: `DashboardPage.vue`

## Menu Name: Master Data

- **Route**: `/master` (Prefix)
- **Permission**: `MASTER_DATA_VIEW`
- **Parent Menu**: ROOT
- **Children Menu**:
    - Warehouses (`/master/warehouses`)
    - Products (`/master/products`)
    - Locations (`/master/locations`)
- **Related APIs**: `/api/v1/master/*`
- **Related Pages**: `MasterEntityPage.vue`

## Menu Name: Transactions

- **Route**: `/transactions` (Prefix)
- **Permission**: `TRANSACTION_VIEW`
- **Parent Menu**: ROOT
- **Children Menu**:
    - Inbound (`/transactions/inbound`)
    - Outbound (`/transactions/outbound`)
    - Adjustment (`/transactions/adjustment`)
- **Related APIs**: `/api/v1/transactions/*`
- **Related Pages**: `TransactionListPage.vue`, `TransactionDetailPage.vue`

## Menu Name: RFID Operations

- **Route**: `/rfid` (Prefix)
- **Permission**: `RFID_VIEW`
- **Parent Menu**: ROOT
- **Children Menu**:
    - Tag Registration (`/rfid/tags`)
    - Tag Assignment (`/rfid/assignments`)
- **Related APIs**: `/api/v1/rfid/*`
- **Related Pages**: `TagRegistrationPage.vue`, `RfidAssignmentPage.vue`

## Menu Name: Settings & IAM

- **Route**: `/settings` & `/iam`
- **Permission**: `SETTINGS_MANAGE`
- **Parent Menu**: ROOT
- **Children Menu**:
    - Roles (`/iam/roles`)
    - Users (`/iam/users`)
    - Apps (`/settings/apps`)
- **Related APIs**: `/api/v1/iam/*`, `/api/v1/settings/*`
- **Related Pages**: `RolesPage.vue`, `UserAccessPage.vue`
