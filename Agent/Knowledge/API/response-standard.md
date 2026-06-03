# Response Standard

> Memahami pembungkus balikan _(Response Envelope)_ dari Backend.

## Envelope Interface

Hampir seluruh endpoint backend (berbasis NestJS Prisma) akan mereturn response body berwujud:

```typescript
{
    success: boolean;
    message: string;
    data: T;           // <-- Target data murni yang dibutuhkan Frontend
    error: any;
    meta: { page, limit, total } | null; // <-- Penting untuk Datatables
}
```

## Normalisasi oleh Helper

Fungsi interseptor HTTP pada `@/lib/api/client` sudah secara otomatis mengambil properti `.data` untuk _success_ call. Namun, dalam beberapa kasus _Paginated Results_, agent wajib membongkar data array murni dari objek berlapis tersebut sesuai dengan return model dari tipe Axios. Jangan menaruh tipe `any` ketika mencocokkan _return_ data service dengan DTO.
