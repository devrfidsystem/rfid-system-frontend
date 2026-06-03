# Contract: Stock Adjustment

## Menu

Penyesuaian Stok / Opname

## Route

`/transactions/adjustment`

## Permission

`TRANSACTION_CREATE`

## API

`POST /api/v1/transactions/adjustment`

## Query Params

N/A

## Request DTO

```typescript
{
    warehouseId: string;
    notes: string;
    items: {
        productId: string;
        locationId: string;
        actualQuantity: number;
    }
    [];
}
```

## Response DTO

```typescript
{
    id: string;
    docNumber: string;
    status: "draft" | "posted";
}
```

## Datatable Columns

(For the list of items inside the form)

1. Product
2. Location
3. System Quantity (Read-only)
4. Actual Quantity (Input)
5. Discrepancy (Calculated)

## Filters

- N/A (Form input mode)

## Actions

- Submit as Draft
- Post Adjustment

## Dependencies

- Master Warehouse
- Master Product
- Master Location
- Stock Balance Endpoint (Untuk mendapatkan _System Quantity_)
