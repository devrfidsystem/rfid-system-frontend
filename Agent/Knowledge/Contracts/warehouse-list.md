# Contract: Warehouse List

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
