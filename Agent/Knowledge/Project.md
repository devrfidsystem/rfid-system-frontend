# Warehouse Frontend — Project Knowledge

> Frontend dashboard berbasis web untuk mengelola operasional gudang modern yang diotentikasi dan dilengkapi manajemen tag RFID. [Confirmed from code]

---

## 1. Agent Core Directives (Must Read)

Sebagai Agent, Anda terikat oleh prinsip ketat berikut sebelum menulis kode apapun:

- **NO ASSUMPTIONS**: Dilarang berasumsi tentang API contract, struktur FE/BE, business flow, DTO, permission, menu, action, maupun sumber data.
- **MANDATORY TRACING**: Jika informasi kurang, **wajib** tracing dari page/component existing, service/composable/store, route/menu config, backend controller/DTO, atau swagger/postman collections.
- **NO MOCK DATA**: Semua data harus nyata dari API atau parameter. Dilarang menyisipkan data statis palsu.
- **TYPE-SAFE**: Dilarang menggunakan tipe `any`. Selalu _derive_ tipe dari backend DTO atau model entitas.
- **COMPONENT STANDARDS**: Wajib menangani _loading/empty/error state_. Form harus memiliki skema validasi Zod. Datatable harus mendukung server-side pagination & filter jika didukung API.
- **CLEAN CODE**: Hindari `watch/watchEffect` yang tidak perlu. Pertahankan arsitektur _Separation of Concern_ yang ada.

---

## 2. Vision & Scope

Tujuan aplikasi ini adalah memberikan interface yang responsif, modern, dan aman bagi operator serta manajer gudang untuk memantau pergerakan stok, menugaskan tag RFID, dan mencetak laporan mutasi stok.
Pengguna utama: Admin sistem, Manajer Gudang, Staff Gudang. [Inferred from code structure — verify with team]
Tidak mencakup: Manajemen sistem peranti keras (hardware RFID reader), integrasi HR / Payroll. [Inferred from code structure — verify with team]

---

## 3. Repository Layout

- `src/api/` — DTOs, request/response models.
- `src/components/` — Atomic UI components (`atoms`, `molecules`, `organisms`, `templates`, `ui`).
- `src/composable/` — Global Vue composables (state & hooks).
- `src/lib/` — Shared libraries (API client, normalizers, formatters).
- `src/model/` — Entity definitions dan type model.
- `src/router/` — Vue Router configuration.
- `src/services/` — API service wrapper layer per domain.
- `src/store/` — Pinia state management.
- `src/views/` — Page components per feature module (IAM, Master Data, Dashboard, Stock, dll).

---

## 3. Tech Stack

| Layer      | Teknologi                | Catatan                                       |
| ---------- | ------------------------ | --------------------------------------------- |
| Frontend   | Vue 3 (Composition API)  | Menggunakan `<script setup>`                  |
| State      | Pinia                    | Global reactive state (`useAuthStore`)        |
| Router     | Vue Router 4             | Route guarding di `index.ts`                  |
| UI/Styling | Tailwind CSS, Lucide-Vue | Atomic Design architecture                    |
| Forms      | VeeValidate + Zod        | Dikelola melalui custom wrappers di `ui/form` |
| API        | Axios                    | Dibungkus dalam `apiRequest` wrapper          |
| Testing    | Belum ada                | [Not found in codebase]                       |

---

## 4. Domain Map

| Domain                   | File Knowledge                                         | Modul/Package yang Terlibat              |
| ------------------------ | ------------------------------------------------------ | ---------------------------------------- |
| Identity & Access        | `Agent/Knowledge/Domains/01-identity-access.md`        | `auth`, `iam`, `users`, `profile`        |
| Master Data              | `Agent/Knowledge/Domains/02-master-data.md`            | `master`                                 |
| Inventory & Transactions | `Agent/Knowledge/Domains/03-inventory-transactions.md` | `stock`, `transactions`                  |
| RFID Operations          | `Agent/Knowledge/Domains/04-rfid-operations.md`        | `rfid`, `tag-registration`               |
| Analytics & System       | `Agent/Knowledge/Domains/05-analytics-system.md`       | `dashboard`, `report`, `settings`, `log` |

---

## 5. System Architecture

Aplikasi ini menggunakan pola **Service-Oriented Frontend Architecture**:

1. **View Layer** (`src/views/*`): Komponen Vue murni tanpa _HTTP call_ langsung. Menggunakan composable (`useXxx`) untuk merangkum logika interaksi.
2. **Composable Layer** (`src/views/*/composables/*`): Mengatur reactive state (loading, error, form data) dan memanggil service layer.
3. **Service Layer** (`src/services/*`): Berisi kelas/objek tunggal (misal `iamService`, `masterService`) yang mengeksekusi HTTP requests.
4. **Network Layer** (`src/lib/api/client.ts`): Interceptor, token management, error handling global.

---

## 6. Code Conventions

### Module / Feature Structure

Fitur diisolasi ke dalam direktori di dalam `src/views/<feature>/`. Di dalamnya biasa terdapat:

- `pages/` atau komponen utama di root.
- `components/` untuk komponen khusus fitur.
- `composables/` untuk pemisahan logika Vue.

### Naming Conventions

- Nama file komponen: `PascalCase.vue` (misal `RolesPage.vue`).
- Nama composable: `use[Feature].ts` (misal `useTracking.ts`).
- Nama service: `camelCase.service.ts` (misal `iam.service.ts`).

### State Management

State aplikasi yang transient diletakkan dalam _Composable_. State global / shared (seperti sesi user & hak akses) diletakkan di Pinia (`src/store/`).

### Dead Code & Deprecated Files

- `src/components/organisms/Table.vue` — JANGAN DIJADIKAN REFERENSI IDEAL — Pola prop typingnya kaku, tapi masih banyak dipakai. Prioritaskan Atomic Data Table modern jika membuat komponen baru, atau sesuaikan dengan penggunaannya. [Confirmed from code]

---

## 7. How to Run

```bash
# Instalasi
pnpm install

# Jalankan dev server
pnpm run dev

# Jalankan type-check
pnpm run type-check

# Build untuk production
pnpm run build
```

---

## 8. Testing Strategy

Saat ini **TIDAK ADA** E2E atau Unit Testing pada _codebase_ ini.
Golden rule: "Lakukan pengujian manual fungsional (Click-through) secara teliti setiap kali mengubah logic form atau state di composable layer."

---

## 9. Architectural Decisions

| Keputusan                      | Alasan                                                                                 | Yang Rusak Jika Diubah                                             | File Terkait                             |
| ------------------------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------- |
| Centralized `apiRequest`       | Standarisasi envelope response dan auto-token injection                                | Semua endpoint akan gagal Auth atau gagal parsing data             | `src/lib/api/client.ts`                  |
| Route Guarding via `useAccess` | Mengamankan modul dari user tanpa akses perusahaan/role                                | Navigasi menu dan perizinan sistem jebol                           | `src/router/index.ts`                    |
| Master Data via `entityConfig` | Form dan tabel entity Master dibuat 100% dinamis untuk menekan duplikasi kode          | Halaman master tidak bisa merender kolom dan API endpoint terputus | `src/views/master/entityConfig.ts`       |
| Atomic Forms via VeeValidate   | Mencegah bug validasi manual dan standarisasi UI form                                  | Layout form rusak dan behavior submit error                        | `src/components/ui/form/*`               |
| Tab Navigation per Modul Utama | Menghindari menu sidebar penuh, menyatukan sub-domain secara hierarkis (IAM, Settings) | Pengguna tidak bisa navigasi antar sub-halaman di layout yang sama | `src/components/templates/IamLayout.vue` |

---

## 10. Critical Flows & Risk Areas

### Critical Business Flows

| Nama Flow           | Endpoint/Trigger               | Mengapa Kritis                                                        | Modul yang Terlibat |
| ------------------- | ------------------------------ | --------------------------------------------------------------------- | ------------------- |
| User Authorization  | `auth.store.ts` initialization | Menentukan rute apa yang bisa dilihat dan API apa yang bisa dipanggil | Auth, IAM, Router   |
| Transaction Posting | `/api/v1/transactions/*`       | Berpengaruh langsung pada Stock Ledger dan Stock Balance di backend   | Transactions        |

### High-Risk Modules

| Nama Modul        | Mengapa Berisiko                                             | Yang Harus Dicek Sebelum Modifikasi                              | Test yang Dijalankan   |
| ----------------- | ------------------------------------------------------------ | ---------------------------------------------------------------- | ---------------------- |
| `transactions`    | Kompleksitas tinggi, memproses array of items, multi-status  | Pastikan validasi form tidak memutus submit payload struktur DTO | Manual E2E test submit |
| `router/index.ts` | Kesalahan guard menyebabkan looping redirect / halaman putih | Cek behavior auth (ter-login vs belum)                           | Manual route test      |

### High-Impact Entities

- `User`, `Role` (Mempengaruhi navigasi & security)
- `StockBalance` (Dipakai oleh Dashboard, Report, dan Validasi Transaksi)

---

## 11. Anti-Patterns & Legacy Traps

**[RAW NATIVE DOM MANIPULATION]** — Ditemukan: `[AI-RISK — not found in codebase but commonly introduced]` — Jangan ditiru karena: Vue menggunakan Virtual DOM, manipulasi DOM manual menyebabkan state tidak sinkron — Cara yang benar: Gunakan `ref` dan reactive bindings.

**[USING ANY IN SERVICES]** — Ditemukan: `[Unverified pattern — may be legacy, may be intentional]` di layanan lama — Jangan ditiru karena: Membatalkan manfaat TypeScript dan memunculkan runtime error — Cara yang benar: Gunakan interface dari `src/api/feature/dto/` atau `src/model/entities.ts`.

**[SKIPPING FORM ROOT WRAPPERS]** — Ditemukan: `src/views/rfid/RfidAssignmentPage.vue:20` — Jangan ditiru karena: Membuat validasi form menjadi _spaghetti_ manual state — Cara yang benar: Selalu gunakan `FormRoot`, `FormSection`, `TextField` dll untuk input data form.

---

## 12. Knowledge Maintenance Rules

| Jenis Perubahan                     | File yang Harus Diupdate                                                  |
| ----------------------------------- | ------------------------------------------------------------------------- |
| Tambah/ubah API endpoint            | `API-Standards.md` §7 + domain file §4                                    |
| Ubah entity/DB schema               | Domain file §3 + `WORKFLOWS.md` jika prosedur berubah                     |
| Ubah business rule di service       | Domain file §4 + §10                                                      |
| Ubah arsitektur (guard, middleware) | `Project.md` §5 + `copilot-instructions.md`                               |
| Temukan anti-pattern baru           | `Project.md` §11 + `copilot-instructions.md` Forbidden Patterns           |
| Hapus atau deprecate modul          | Update Domain Map + tandai di `copilot-instructions.md` sebagai dead code |
| Ubah cara run/deploy                | `Project.md` §7 + `WORKFLOWS.md`                                          |
