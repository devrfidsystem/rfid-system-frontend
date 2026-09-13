# Putaway API Payload Contract

> Scope: `putaway` only.

## Purpose

Define the request and response payload shape for the first implementation of `putaway`.

## Shared Field Types

- `id`: string or UUID, depending on backend convention
- `companyId`: string or UUID
- `warehouseId`: string or UUID
- `productId`: string or UUID
- `locationId`: string or UUID
- `lineId`: string or UUID
- `docNumber`: string
- `docDate`: ISO date string
- `status`: one of `draft`, `posted`, `done`, `canceled`
- `notes`: string or null

## Create Payload

### `POST /putaway`

Request body:

```json
{
    "companyId": "cmp_001",
    "docNumber": "PUT-2026-0001",
    "docDate": "2026-07-12",
    "warehouseId": "wh_001",
    "referenceType": "inbound",
    "referenceId": "inb_001",
    "notes": "Place to zone A",
    "lines": [
        {
            "lineNo": 1,
            "productId": "prd_001",
            "qty": 10,
            "sourceLocationId": "loc_rcv_01",
            "targetLocationId": "loc_put_01",
            "notes": "Fragile"
        }
    ]
}
```

Validation rules:

- `companyId` is required.
- `docNumber` is required.
- `docDate` is required.
- `warehouseId` is required.
- `lines` must be a non-empty array.
- each line requires `productId`, `qty`, `targetLocationId`, and `lineNo`.
- `qty` must be greater than zero.

Response body:

```json
{
    "id": "put_001",
    "companyId": "cmp_001",
    "docNumber": "PUT-2026-0001",
    "docDate": "2026-07-12",
    "warehouseId": "wh_001",
    "referenceType": "inbound",
    "referenceId": "inb_001",
    "status": "draft",
    "notes": "Place to zone A",
    "createdById": "usr_001",
    "createdAt": "2026-07-12T08:00:00.000Z",
    "updatedAt": "2026-07-12T08:00:00.000Z",
    "lines": [
        {
            "id": "put_line_001",
            "docId": "put_001",
            "lineNo": 1,
            "productId": "prd_001",
            "qty": 10,
            "sourceLocationId": "loc_rcv_01",
            "targetLocationId": "loc_put_01",
            "notes": "Fragile",
            "status": null
        }
    ]
}
```

## List Payload

### `GET /putaway`

Query params:

- `companyId`
- `warehouseId`
- `status`
- `docNumber`
- `dateFrom`
- `dateTo`

Recommended mobile query:

- `status=posted`

List response:

```json
[
    {
        "id": "put_001",
        "docNumber": "PUT-2026-0001",
        "docDate": "2026-07-12",
        "warehouseId": "wh_001",
        "warehouse": {
            "id": "wh_001",
            "name": "Warehouse A"
        },
        "status": "posted",
        "notes": "Place to zone A"
    }
]
```

## Detail Payload

### `GET /putaway/:id`

Response body:

```json
{
    "id": "put_001",
    "companyId": "cmp_001",
    "docNumber": "PUT-2026-0001",
    "docDate": "2026-07-12",
    "warehouseId": "wh_001",
    "warehouse": {
        "id": "wh_001",
        "name": "Warehouse A"
    },
    "referenceType": "inbound",
    "referenceId": "inb_001",
    "status": "posted",
    "notes": "Place to zone A",
    "createdById": "usr_001",
    "createdAt": "2026-07-12T08:00:00.000Z",
    "updatedAt": "2026-07-12T08:15:00.000Z",
    "lines": [
        {
            "id": "put_line_001",
            "docId": "put_001",
            "lineNo": 1,
            "productId": "prd_001",
            "product": {
                "id": "prd_001",
                "name": "Product A"
            },
            "qty": 10,
            "sourceLocationId": "loc_rcv_01",
            "sourceLocation": {
                "id": "loc_rcv_01",
                "name": "Receiving Bay"
            },
            "targetLocationId": "loc_put_01",
            "targetLocation": {
                "id": "loc_put_01",
                "name": "Aisle A-01"
            },
            "notes": "Fragile",
            "status": null
        }
    ]
}
```

## Update Payload

### `PATCH /putaway/:id`

Allowed only in `draft`.

Supported changes:

- `docDate`
- `warehouseId`
- `referenceType`
- `referenceId`
- `notes`
- `lines`

Update request example:

```json
{
    "docDate": "2026-07-13",
    "notes": "Updated note",
    "lines": [
        {
            "id": "put_line_001",
            "lineNo": 1,
            "productId": "prd_001",
            "qty": 12,
            "targetLocationId": "loc_put_01",
            "notes": "Adjusted qty"
        }
    ]
}
```

## Status Action Payloads

### `POST /putaway/:id/post`

Request body:

```json
{}
```

Behavior:

- moves document from `draft` to `posted`
- no line mutation is required

### `POST /putaway/:id/cancel`

Request body:

```json
{}
```

Behavior:

- moves document to `canceled`

### `POST /putaway/:id/complete`

Request body:

```json
{}
```

Behavior:

- moves document from `posted` to `done`
- hidden from the mobile list after completion

## Mobile Selection Contract

Recommended mobile list filter:

```text
GET /putaway?status=posted
```

Recommended list label:

- primary: `docNumber`
- secondary: `docDate`
- tertiary: `warehouse.name`

## Error Shape

If the backend uses a standard validation response, keep it consistent across all `putaway` endpoints.

Recommended validation messages:

- missing required field
- invalid status transition
- quantity must be greater than zero
- target location is required
- draft-only action attempted on a non-draft document
