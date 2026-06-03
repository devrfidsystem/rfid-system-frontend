# Contract: Product List

## Menu

Daftar Produk / Product Master

## Route

`/master/products`

## Permission

`MASTER_DATA_VIEW`

## API

`GET /api/v1/master/products`

## Query Params

- `page` (number, default 1)
- `limit` (number, default 10)
- `search` (string, optional)
- `categoryId` (string, optional)

## Request DTO

N/A (GET request)

## Response DTO

```typescript
{
    id: string;
    code: string;
    name: string;
    categoryId: string;
    uomId: string;
    createdAt: string;
}
```

## Datatable Columns

1. Product Code
2. Product Name
3. Category
4. UOM
5. Actions

## Filters

- Search Input (by Code/Name)
- Category Dropdown

## Actions

- Add New
- Edit
- Delete

## Dependencies

- Master Category
- Master UOM
