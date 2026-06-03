# GitHub Copilot Instructions — Warehouse RFID Frontend

> Primary control layer. Rules here override Copilot defaults.
> Deep documentation: `Agent/Knowledge/`

---

## Project Context

Dashboard Frontend web untuk mengelola pergerakan aset gudang modern via RFID.
Sistem sudah 100% matang dan tidak memiliki data _mock_, setiap endpoint terkoneksi _live_ ke backend.

Stack: Vue 3 (Composition API), Vite, Tailwind, VeeValidate + Zod, Pinia, Axios.
Layout: Single-app repo (Frontend).

**DO NOT use as reference (dead code / deprecated):**

- `src/components/organisms/Table.vue` — Jangan tiru cara _prop-typing_ tabel yang menggunakan Record bebas.

---

## MUST Follow — Project-Wide Rules

1. MUST gunakan `useAuthStore` atau interceptor untuk membaca token JWT — Memastikan reaktivitas data auth.
2. MUST bungkus semua panggila API melalui helper `apiRequest` di `@/lib/api/client` — Menyisipkan token secara otomatis dan parse Response Envelope.
3. MUST gunakan konfigurasi meta di `src/views/master/entityConfig.ts` saat menambah Master Data — Mencegah redundansi pembuatan halaman statik baru.
4. MUST bungkus komponen form baru ke dalam ekosistem Atomic VeeValidate (`<FormRoot>`, `<TextField>`, dll) — Validasi dan error handling terstandarisasi.
5. NEVER tembak `/dashboard` secara bertingkat/paralel (_cascading HTTP_) di anak komponen — Menyebabkan backend crash akibat Prism DB pool timeout.
6. NEVER gunakan manipulasi DOM asli (seperti `document.getElementById`) — Merusak integrasi _Virtual DOM_ dari Vue.

---

## Code Patterns (Copy-Paste Ready)

### Reactive Query Hook Pattern (Vue 3)

```typescript
import { watch } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

watch(
    () => state.filterId,
    (newId) => {
        router.replace({ query: { ...route.query, filter: newId } });
    },
);
```

### Standard Vue Component Skeleton (Script Setup)

```vue
<template>
    <Card>
        <div v-if="loading">Loading...</div>
        <div v-else>Data ter-render</div>
    </Card>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import Card from "@/components/molecules/Card.vue";

const loading = ref(false);
</script>
```

### Form Input Pattern (Atomic VeeValidate)

```vue
<template>
    <FormRoot :schema="myZodSchema" @submit="handleSubmit">
        <TextField
            name="productCode"
            label="Product Code"
            placeholder="A-123"
        />
        <Button type="submit">Save</Button>
    </FormRoot>
</template>
```

---

## Forbidden Patterns

NEVER write:

- `axios.get('...')` → gunakan `apiRequest({ url: '...' })` — Axios dibalut agar global error dan token JWT otomatis ter-handle.
- `ref<any>()` → gunakan Interface konkrit dari `src/api/feature/dto/` atau `src/model/entities.ts` — Menjaga strict-typing.
- `<form @submit.prevent>` dengan manual refs untuk input error → gunakan `<FormRoot>` dengan `<TextField>` — Validasi UI diserahkan ke Zod.
- `<AppTable>` untuk membangun list baru → gunakan `<Table>` modern — _Technical debt_.

---

## Domain Map

| Area           | File Knowledge                                         |
| -------------- | ------------------------------------------------------ |
| IAM            | `Agent/Knowledge/Domains/01-identity-access.md`        |
| Master Data    | `Agent/Knowledge/Domains/02-master-data.md`            |
| Transaksi Stok | `Agent/Knowledge/Domains/03-inventory-transactions.md` |
| Operasi RFID   | `Agent/Knowledge/Domains/04-rfid-operations.md`        |
| Analytics      | `Agent/Knowledge/Domains/05-analytics-system.md`       |

---

## Change Safety

Sebelum modifikasi area berikut, baca dulu:

- Ubah form transaksi stok: `Agent/Knowledge/Domains/03-inventory-transactions.md#12-high-risk-changes`
- Ubah Vue Router Guard: `Agent/Knowledge/Domains/01-identity-access.md#12-high-risk-changes`
- Tambah endpoint API baru: `Agent/Knowledge/WORKFLOWS.md#1-menambahkan-fitur--endpoint-api-baru-ke-frontend`
- Refactor legacy code (terutama tabel): `Agent/Knowledge/WORKFLOWS.md#6-refactoring-legacy-code-dengan-aman`
