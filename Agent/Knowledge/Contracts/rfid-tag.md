# Contract: RFID Tag

## Menu

Manajemen Tag RFID / Registrasi EPC

## Route

`/rfid/tags`

## Permission

`RFID_ASSIGN`

## API

`GET /api/v1/rfid/tags`
`POST /api/v1/rfid/tags`

## Query Params

- `page` (number, default 1)
- `limit` (number, default 10)
- `search` (string, optional - searches EPC)
- `status` (string, optional)

## Request DTO (POST)

```typescript
{
    epc: string;
    type: string; // Misal 'asset', 'pallet'
}
```

## Response DTO

```typescript
{
    epc: string;
    status: "available" | "assigned" | "shipped";
    registeredAt: string;
}
```

## Datatable Columns

1. EPC Code
2. Status
3. Assigned To (Product/Doc)
4. Registered Date
5. Actions

## Filters

- Search EPC
- Status Filter

## Actions

- Register New Tag
- Assign Tag (Navigasi ke `/rfid/assignments`)

## Dependencies

- None for registration.
- Master Product & Location untuk Assignment.
