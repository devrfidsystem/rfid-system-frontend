# Decision: Pelarangan Tipe `any` (No Any)

## Decision

Melarang secara mutlak penggunaan tipe `any` di dalam _codebase_ Frontend, khususnya pada _services_ dan _composables_.

## Reason

Penggunaan `any` menghilangkan perlindungan linter TypeScript, menyebabkan _bug_ terkait _undefined properties_ tidak terdeteksi hingga fase kompilasi/run-time, serta membingungkan developer selanjutnya saat mengecek properti objek yang dirender di template.

## Impact

Pekerjaan _Agent_ / _Developer_ menjadi sedikit lebih lambat di awal karena diwajibkan menulis interface DTO yang presisi atau melakukan _tracing_ ke kode Backend.

## Examples

**Salah (Forbidden):**

```typescript
async function fetchUser(): Promise<any> {
    const res = await apiRequest({ url: "/users/1" });
    return res.data;
}
```

**Benar:**

```typescript
import type { UserRecord } from "@/model/User";

async function fetchUser(): Promise<UserRecord> {
    const res = await apiRequest<UserRecord>({ url: "/users/1" });
    return res.data;
}
```
