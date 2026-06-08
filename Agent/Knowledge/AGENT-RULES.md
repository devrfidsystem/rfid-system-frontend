# Agent Startup Rules

> Ini adalah instruksi absolut. Anda wajib membacanya sebelum melakukan _coding_.

## Mandatory Pre-Flight Checklist

Sebelum menyentuh _source code_, Agent **WAJIB**:

1. Tentukan workflow dari `PROMPT-ROUTER.md`.
2. Baca `PROMPT-ROUTER.md`.
3. Baca `Project.md`.
4. Baca `Domains/*.md` terkait.
5. Baca `API-Standards.md` & `API/*.md`.
6. Baca `Architecture/*.md`.
7. Baca `Wiring/*.md`.
8. Lakukan **Tracing** implementasi existing di dalam `src/`.
9. Lakukan **Validasi Contract** di dalam `Agent/Knowledge/Contracts/`.
10. Baru Anda diizinkan untuk memulai _coding_.

---

## Anti-Assumption Policy

Sebagai Agent, Anda **DILARANG KERAS** melakukan asumsi atas:

- **Asumsi Endpoint**: Menebak URL (misal `/api/v1/users`). Wajib cek _Contract_ atau _Tracing_ service/controller.
- **Asumsi DTO**: Menebak bentuk JSON object. Wajib cek `src/api/feature/dto/`.
- **Asumsi Response**: Menebak letak pagination atau pembungkus data. Wajib patuhi `response-standard.md`.
- **Asumsi Permission**: Menebak _Role_ atau kunci izin. Wajib cek _Permission Registry_.
- **Asumsi Menu**: Menebak hirarki router. Wajib cek _Menu Registry_.
- **Asumsi Business Process**: Menebak alur bisnis. Wajib cek _Domain Playbook_.

---

## Escalation Rules

Jika informasi esensial **TIDAK DITEMUKAN** di dokumen _Knowledge Base_, maka:
**STOP.**

Agent harus melakukan _tracing_ dan pencarian mandiri ke:

- Existing page (`src/views/`)
- Existing service (`src/services/`)
- Existing composable (`src/views/*/composables/`)
- Existing DTO (`src/api/feature/dto/`)
- Existing API client (`src/lib/api/`)
- Existing controller (di backend project jika tersedia)
- Existing contract (`Contracts/`)

Jika data tersebut **TETAP TIDAK DITEMUKAN**, maka:
**LAPORKAN GAP KEPADA USER.**
**JANGAN MELAKUKAN CODING MENGGUNAKAN ASUMSI ATAU MOCK DATA.**

---

## Knowledge Governance

Rule wajib:

1. Read `MASTER-INDEX.md` first.
2. Use Source Of Truth.
3. Do not duplicate documentation.
4. Do not create alternative standards.
5. If conflict found:
    - stop implementation
    - report conflict
    - request clarification
6. Any implementation affecting knowledge must update Source Of Truth.
7. Screen owns UI specification.
8. Contract owns DTO/API contract.
9. Domain owns business rules.
10. Testing owns automation standards.
