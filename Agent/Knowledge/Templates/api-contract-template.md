# API Contract: [ENDPOINT_NAME_PLACEHOLDER]

## Info

- **Method**: `[GET/POST/PUT/DELETE]`
- **Endpoint**: `/api/v1/[path]`
- **Module**: `[Nama_Module_Terkait]`

## Headers

- `Authorization: Bearer <token>`

## Request Body (DTO)

```typescript
export interface RequestDto {
    // properties
}
```

## Success Response (200/201)

```json
{
    "success": true,
    "message": "Data retrieved",
    "data": {
        // properties
    },
    "meta": null
}
```

## Error Responses

- **400 Bad Request**: Validasi DTO gagal.
- **401 Unauthorized**: Token habis.
- **403 Forbidden**: Role tidak diizinkan.
