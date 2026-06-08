# Contract: Product List

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
