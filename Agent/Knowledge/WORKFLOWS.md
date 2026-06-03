# Development Workflows Index

> File ini adalah INDEX UTAMA untuk semua workflow pengembangan di project Warehouse.
> Setiap kali mendapat prompt singkat (minimal prompt), Agent WAJIB merujuk ke workflow spesifik di bawah ini.

---

## Minimal Prompt Mapping

Gunakan mapping berikut berdasarkan instruksi awal dari user:

- **BUG** → gunakan `Agent/Knowledge/Workflows/workflow-bug-fix.md`
- **ENHANCEMENT** → gunakan `Agent/Knowledge/Workflows/workflow-enhancement.md`
- **NEW PAGE** → gunakan `Agent/Knowledge/Workflows/workflow-new-page.md`
- **AUDIT** → gunakan `Agent/Knowledge/Workflows/workflow-audit-standardization.md`
- **E2E TEST** → gunakan `Agent/Knowledge/Workflows/workflow-e2e-selenium.md`

---

## Aturan Fundamental Agent (No Assumptions)

Sebelum menjalankan workflow apa pun, Agent terikat pada aturan berikut:

1. **DILARANG BERSUMSI** terhadap API contract, struktur FE/BE, business flow, DTO/request/response, permission/menu/action, atau source data.
2. Jika informasi kurang atau ambigu, **WAJIB TRACING** dari:
    - Page/component existing.
    - Service/composable/store.
    - Route/menu config.
    - Backend controller/service/DTO.
    - Swagger/OpenAPI/API collection (jika tersedia).
    - Sample response.
    - Domain knowledge di `Agent/Knowledge/Domains/`.
3. Seluruh implementasi harus memenuhi standar kualitas:
    - No mock data (data harus dari API).
    - No `any` (wajib type-safe).
    - No unnecessary `watch/watchEffect`.
    - Reusable component (Atomic Design).
    - Selalu sediakan loading/empty/error state.
    - API wiring harus presisi sesuai contract.
    - FE/BE alignment yang ketat.
    - Clean separation of concern (UI di `.vue`, logic di `composable`, network di `service`).
    - Consistent naming convention.
    - Form wajib menggunakan schema validation (Zod + VeeValidate).
    - Datatable wajib server-side (jika API mendukung).
    - Route/menu/permission wiring sesuai dengan standar IAM.

---

## Mengupdate Knowledge Base Setelah Perubahan Kode

Urutan update:

1. Domain file yang relevan (section yang berubah saja) di `Agent/Knowledge/Domains/`
2. `API-Standards.md` jika pola envelope atau endpoint global berubah.
3. `WORKFLOWS.md` atau spesifik sub-workflow jika prosedur dasar berubah.
4. `Project.md` §9 jika ada keputusan arsitektur baru.
5. `.github/copilot-instructions.md` terakhir.

Jangan update `copilot-instructions.md` langsung — selalu update source-nya dulu.
