# Decision: Server-Side Pagination & Filtering

## Decision

Semua implementasi Tabel Data (Master maupun Transaksional) diwajibkan menggunakan paginasi (page/limit) dan pencarian (search) sisi server.

## Reason

Aplikasi Warehouse memuat ribuan row log _(RFID Events, Stock Mutasi)_. Meload semua data lalu memfilternya secara lokal _(Client-side rendering)_ akan menyebabkan _memory leak_ dan membekukan tab peramban pengguna.

## Impact

State tabel tidak lagi bersifat final; state filter di UI harus direaktifkan sedemikian rupa sehingga jika berubah, tabel secara dinamis menembak API parameter baru.

## Examples

**Data Table Fetch Pattern:**

```typescript
const filterState = reactive({ page: 1, limit: 10, search: "" });

watch(
    filterState,
    async (newParams) => {
        // Akan ditembakkan ke Backend misal: ?page=1&limit=10&search=xyz
        await service.fetchData(newParams);
    },
    { deep: true },
);
```
