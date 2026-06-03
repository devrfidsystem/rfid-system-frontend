# Contract: Warehouse List

## Menu

Daftar Gudang / Warehouse Master

## Route

`/master/warehouses`

## Permission

`MASTER_DATA_VIEW`

## API

`GET /api/v1/master/warehouses`

## Query Params

- `page` (number, default 1)
- `limit` (number, default 10)
- `search` (string, optional)

## Request DTO

N/A (GET request)

## Response DTO

```typescript
{
    id: string;
    code: string;
    name: string;
    address: string;
    companyId: string;
    isActive: boolean;
    createdAt: string;
}
```

## Datatable Columns

1. Warehouse Code
2. Warehouse Name
3. Address
4. Status (Active/Inactive Badge)
5. Actions

## Filters

- Search Input (by Code/Name)
- Status Dropdown

## Actions

- Add New
- Edit
- Delete

## Dependencies

- Master Company (Untuk menyaring / menautkan Gudang)
