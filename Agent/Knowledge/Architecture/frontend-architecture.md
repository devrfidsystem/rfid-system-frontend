# Frontend Architecture

> Standar arsitektur Vue 3 untuk project Warehouse.

## FE Layering

Aplikasi dibagi menjadi lapisan yang ketat:

1. **View Layer** (`src/views/*/pages/*.vue`): Hanya berisi template UI dan sedikit state reaktif untuk view-model (contoh: status dialog). Dilarang berisi pemanggilan `apiRequest`.
2. **Composable Layer** (`src/views/*/composables/*.ts`): Menyimpan _business logic_ Frontend, state global transient, _loading flags_, dan menangkap _Error_.
3. **Service Layer** (`src/services/*.ts`): Berfungsi semata-mata sebagai jembatan _HTTP client_ ke Backend dan pemetaan payload.
4. **State Management** (`src/store/*.ts`): Pinia store khusus untuk state persisten atau lintas-modul (contoh: Auth, User Profile, Filter Global Dashboard).

## Reusable Component Strategy

Kami menggunakan filosofi Atomic Design.

- Komponen dasar wajib digunakan (contoh: `Button.vue`, `Input.vue`). Dilarang keras membuat elemen `<button>` atau `<input>` native tanpa styling di file spesifik.
- Selalu merujuk ke folder `src/components/ui/` sebelum membangun komponen baru.
