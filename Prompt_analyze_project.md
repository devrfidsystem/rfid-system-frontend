# Prompt: Deep Project Analysis — Generate AI Knowledge Base

# For Legacy Projects — Vibe Coding Edition

## Objective

Analyze this legacy project comprehensively and generate a two-layer AI knowledge base that enables GitHub Copilot and other AI coding agents to continue development using a vibe coding workflow — without requiring the developer to re-explain project context in every session.

**Two-Layer Output Architecture:**

**Layer 1 — Deep Knowledge** (for thorough understanding, referenced on demand):

1. `Agent/Knowledge/Project.md` — Architecture, decisions, critical flows, anti-patterns
2. `Agent/Knowledge/API-Standards.md` — API contract, patterns, anti-patterns (skip if no API)
3. `Agent/Knowledge/WORKFLOWS.md` — Step-by-step procedures for safe code changes
4. `Agent/Knowledge/Domains/XX-<name>.md` — One deep-dive per business domain

**Layer 2 — Copilot Control** (loaded on every keypress, must be operational): 5. `.github/copilot-instructions.md` — **Primary operational control layer** for Copilot. NOT a summary. NOT documentation. Contains strict rules, forbidden patterns, and copy-paste-ready code templates. Generated last, after all Layer 1 files are complete.

**This process has one mandatory stop and one conditional stop before any file is written.**

---

## Pre-Flight: Cek Knowledge Base yang Sudah Ada

**Lakukan ini sebelum apapun. Tanyakan ke user dalam Bahasa Indonesia:**

Cek apakah folder `Agent/Knowledge/` sudah ada.

- **Jika belum ada** → lanjutkan ke User Involvement Policy secara normal.
- **Jika sudah ada** → tanyakan ke user:

    > **"Saya menemukan `Agent/Knowledge/` sudah ada.**
    >
    > **Pilih mode:**
    >
    > - **Update** — Saya baca file lama, bandingkan dengan kode terkini, perbarui yang tidak valid, pertahankan yang masih benar.
    > - **Buat ulang dari awal** — Analisis ulang seluruh project, timpa semua file.
    >
    > Pilihan Anda?"

    **Aturan Update Mode (ikuti ketat):**
    - Baca setiap file lama sebelum menulisnya ulang
    - Tandai konten yang sudah tidak sesuai kode sebagai `[STALE — removed]` sebelum dihapus
    - Jangan append section baru tanpa cek apakah section serupa sudah ada
    - Jangan tambahkan baris duplikat ke entity atau endpoint yang sudah terdokumentasi
    - Jangan update `.github/copilot-instructions.md` sebelum semua Layer 1 file selesai diperbarui
    - Jika rule lama masih valid → pertahankan, tidak perlu tulis ulang

---

## Language Rule

**Semua komunikasi ke user — pertanyaan, konfirmasi, progress update, ringkasan, pesan error — wajib dalam Bahasa Indonesia, terlepas dari bahasa yang dipakai user.**

Berlaku untuk: Pre-Flight, Checkpoint 1 (jika perlu bertanya), Checkpoint 2, progress report, Output Summary.

Tidak berlaku untuk: isi file knowledge base (ikuti bahasa dokumentasi codebase yang ada, atau English jika tidak ada), code snippets, identifier teknis di dalam file.

---

## User Involvement Policy

**Prinsip utama: AI harus melakukan inferensi terlebih dahulu. Tanya ke user hanya jika informasi benar-benar tidak bisa diinfer dari codebase.**

### Kapan AI BOLEH bertanya:

1. Pilihan Update vs Rebuild mode (Pre-Flight — selalu tanya)
2. Pembagian domain tidak bisa ditentukan dengan confidence tinggi dari kode saja
3. Perilaku bisnis kritis ambigu dan implementasi kode saling bertentangan
4. Ada dua implementasi berbeda untuk hal yang sama dan tidak bisa ditentukan mana yang aktif

### Kapan AI TIDAK BOLEH bertanya:

- Tujuan aplikasi → infer dari README, package name, module names, route paths, entity names, UI labels
- Pengguna utama → infer dari role/permission names, auth guards, dashboard widgets, menu items, frontend navigation
- Area kritis → infer dari nama modul yang mengandung: payment, order, stock, auth, permission, finance, billing, reporting
- Legacy traps → infer dari: pola tidak konsisten antar modul, dead code, raw SQL, kode di controller, hardcoded values, TODO/FIXME comments, area tanpa test
- Tech stack → selalu bisa diinfer dari config files
- Endpoint list → selalu bisa diinfer dari controller/route files

### Saat membuat inference:

- Beri label semua temuan dengan confidence label (lihat section Confidence Labels)
- Jangan tulis fakta tanpa konfirmasi sebagai kepastian mutlak
- Partial accurate knowledge lebih baik dari complete invented knowledge

---

## Checkpoint 1 — Optional Context Intake

**Default: NON-BLOCKING. Jangan stop di sini jika konteks bisa diinfer.**

**Sebelum memulai Phase 1:**

1. Cek apakah user sudah memberikan deskripsi project di atas prompt ini
2. Jika sudah → gunakan deskripsi tersebut, lanjutkan ke Phase 1 tanpa bertanya
3. Jika belum → lakukan quick scan: baca README, nama package, daftar modul, nama entity utama
4. Jika dari scan tersebut tujuan aplikasi bisa dipahami dengan confidence sedang atau tinggi → lanjutkan ke Phase 1 tanpa bertanya
5. **Tanya hanya jika:** setelah quick scan, domain grouping masih ambigu karena konteks bisnis tidak bisa disimpulkan

**Jika perlu bertanya, kirim SATU pertanyaan kompak (bukan bertahap):**

> **"Sebelum saya lanjutkan analisis, saya perlu satu klarifikasi:**
>
> Dari scan awal saya memahami project ini sebagai: `[isi inferensi kamu di sini]`. Apakah pemahaman ini benar?
>
> Jika ada koreksi atau tambahan konteks yang penting untuk pembagian domain — khususnya area yang paling kritis atau sering berubah — tolong tambahkan sekarang. Jika sudah benar, konfirmasi saja dan saya lanjutkan."

Setelah jawaban diterima (atau tidak perlu bertanya), lanjutkan ke Phase 1.

---

## Phase 1: Project Exploration

Eksplorasi dalam urutan ini. Kumpulkan semua temuan — ini menjadi input Checkpoint 2 dan konten semua file.

**Urutan tool yang direkomendasikan:**

1. Root config: `package.json` / `pyproject.toml` / `go.mod` / `Cargo.toml` / `build.gradle`
2. Directory tree top-level
3. Entry point utama: `main.ts`, `app.module.ts`, `main.py`, `cmd/main.go`, `app.py`, dll
4. Per modul: index/barrel dulu, lalu file detail
5. Semua entity/model/schema — sumber paling akurat untuk data model
6. Keyword search untuk pola berulang: guard, middleware, decorator, interceptor, transaction, audit, softdelete, archive
7. Test files — untuk memahami expected behavior, bukan hanya kode produksi
8. Secara aktif cari pola buruk (lihat 1.9)

### 1.1 — Project Root

- Isi root directory, lockfile, CI config
- Monorepo atau single-app? Package manager?

### 1.2 — Tech Stack Detection

Identifikasi setiap teknologi signifikan:

- Language, Runtime/Framework, Database + ORM, Frontend + state management
- Auth mechanism, Build tools, Testing frameworks
- Shared internal packages, Infrastructure, External services

### 1.3 — Source Structure

- Bagaimana modul/fitur diorganisir? (by domain, by layer, by route, by feature)
- Naming convention per file type, variable, endpoint, DB column
- Ada pattern arsitektur yang konsisten? (layered, CQRS, hexagonal, event-driven)
- **Ada inkonsistensi?** Catat: "Modul A menggunakan pola X, Modul B menggunakan pola Y untuk hal yang sama"

### 1.4 — Database & Data Model

- Semua entity/model/schema definition
- Relasi antar entity
- Ada migrations? Lokasi? Ada gap atau migration yang tidak lengkap?
- Ada seed script?
- Tabel/collection mana yang menjadi dependency hampir semua modul? (high-impact entities)

### 1.5 — API Layer (jika ada)

- HTTP convention (REST, GraphQL, tRPC, gRPC, JSON-RPC)
- Base URL dan versioning scheme
- Format request/response envelope global
- Auth/authorization di API layer (guard, middleware, decorator)
- Ada RBAC atau permission system?
- Catalog semua endpoint group
- **Endpoint mana yang melanggar konvensi yang berlaku?** Tandai sebagai `[LEGACY EXCEPTION]`

### 1.6 — Frontend / Client Layer (jika ada)

- State management
- Cara komunikasi ke backend
- Routing structure
- Ada file yang sudah tidak digunakan? (mock data, old implementations, dead imports)

### 1.7 — Testing

- Framework dan lokasi test, naming convention
- Strategy: unit, integration, E2E
- **Area mana yang tidak punya test?** — Ini kandidat high-risk area

### 1.8 — Existing Documentation

- Baca README, CONTRIBUTING, ARCHITECTURE, docs/\*
- Baca `.github/copilot-instructions.md` atau `.cursorrules` jika ada
- Catat inline comments yang menjelaskan keputusan non-obvious

### 1.9 — Legacy Trap & Anti-Pattern Detection (WAJIB)

Ini bukan opsional. Secara aktif cari dan catat semua temuan berikut. Setiap temuan yang ditemukan HARUS masuk ke knowledge base (bukan hanya dicatat internal).

**Pola tidak konsisten antar modul:**

- Modul A melakukan X dengan cara berbeda dari Modul B untuk tujuan yang sama
- Tentukan mana yang benar berdasarkan: test coverage, recency, atau pola mayoritas

**Kode berbahaya jika ditiru:**

- Business logic di controller atau view layer
- Raw SQL dicampur ORM query di layer yang sama
- Query N+1 (load list lalu loop dan query per item)
- Transaction yang tidak konsisten (sebagian pakai, sebagian tidak)

**Dead code yang menyesatkan:**

- File yang masih ada tapi tidak diimport oleh siapapun
- Commented-out code block yang besar (> 10 baris)
- Modul atau class yang tidak pernah diinstansiasi

**Naming yang menyesatkan:**

- Class/file dengan nama generik tapi berisi logic domain spesifik (contoh: `Utils.ts` yang berisi payment calculation)
- Class/file yang namanya berbeda dengan apa yang dilakukannya

**Hardcoded values berbahaya:**

- Credentials, URLs eksternal, API keys, atau magic numbers dalam business logic

**Bypass dan technical debt:**

- `// @ts-ignore`, `as any`, `// TODO`, `// FIXME`, `// HACK`, `// TEMP`
- `eslint-disable`, `@SuppressWarnings`, `#nosec` yang tidak ada penjelasannya

**Duplicate logic lintas module:**

- Logic yang sama diimplementasi di dua tempat berbeda dengan cara sedikit berbeda
- Ini biasanya sumber bug silent yang sulit dilacak

**Area tanpa test yang menyentuh data kritis:**

- Payment, balance, stock, auth token, permission check, financial calculation yang tidak punya unit test

**Endpoint lama yang masih dipakai frontend:**

- Endpoint yang pola atau namanya tidak konsisten dengan konvensi baru, tapi masih dipanggil oleh frontend

### 1.10 — Context Inference Summary

Setelah menyelesaikan 1.1–1.9, buat ringkasan internal tentang apa yang berhasil diinfer:

```
Tujuan aplikasi: [inferensi] (Confidence: Tinggi/Sedang/Rendah)
Pengguna utama: [inferensi] (Confidence: Tinggi/Sedang/Rendah)
Area paling kritis: [inferensi] (Confidence: Tinggi/Sedang/Rendah)
Legacy traps ditemukan: [jumlah dan ringkasan]
Informasi yang TIDAK bisa diinfer: [list jika ada]
```

Jika ada informasi yang tidak bisa diinfer dan mempengaruhi pembagian domain → baru tanyakan ke user (satu pertanyaan kompak, lihat format Checkpoint 1).

### 1.11 — Draft Domain List

Berdasarkan semua temuan di atas, buat draft daftar domain. Domain = cluster fungsionalitas yang memiliki data dan behavior sendiri.

Per domain, catat:

- **Nama domain** (label pendek bermakna)
- **Modul/package yang dicakup** (nama folder/modul aktual)
- **Entitas utama** (model data yang dimiliki domain ini)
- **Kompleksitas** (rendah / sedang / tinggi)
- **Risk level** (rendah / sedang / tinggi — dari temuan 1.9)
- **Confidence** (tinggi / sedang / rendah — seberapa yakin pengelompokan ini)
- **Alasan pengelompokan**

Jangan dipaksakan. Untuk project kecil: 1–2 domain lebih baik. Split hanya jika kepemilikan data benar-benar berbeda.

---

## Checkpoint 2 — Domain Approval (STOP — WAJIB)

Ini adalah satu-satunya mandatory stop sebelum menulis file.

**Setelah Phase 1 selesai, berhenti. Sampaikan ke user dalam Bahasa Indonesia:**

> **"Saya selesai menganalisis project ini. Sebelum menulis file apapun, saya perlu konfirmasi pembagian domain.**
>
> **Dari analisis saya, project ini memiliki tujuan: `[inferensi tujuan]` [Confidence: Tinggi/Sedang/Rendah]**
>
> **Rencana pembagian [N] domain:**
>
> | #   | Nama Domain       | Modul/Package          | Entitas Utama       | Kompleksitas | Risk   | Confidence |
> | --- | ----------------- | ---------------------- | ------------------- | ------------ | ------ | ---------- |
> | 01  | Identity & Access | `auth`, `user`, `role` | User, Role, Session | Tinggi       | Tinggi | Tinggi     |
> | 02  | Organization      | `company`, `branch`    | Company, Branch     | Rendah       | Rendah | Sedang     |
> | ... |                   |                        |                     |              |        |            |
>
> **Temuan legacy yang perlu diperhatikan:**
>
> - [Temuan 1 — singkat]
> - [Temuan 2 — singkat]
>
> **Domain confidence rendah (butuh konfirmasi):** [sebutkan domain yang confidence-nya rendah dan alasannya]
>
> **Apakah pembagian ini sudah sesuai?**
>
> - **Ya / Lanjutkan** → saya generate semua file secara otomatis
> - **Tidak** → beritahu yang perlu diubah
> - **Ragu** → jelaskan dan saya sarankan alternatif"

**Tunggu persetujuan eksplisit.** "Oke", "ya", "lanjut", "setuju", "go" semuanya diterima. Jika ada koreksi → update tabel → tampilkan ulang → tunggu konfirmasi. Ulangi sampai disetujui.

**Setelah disetujui → lanjut ke Pacing Mode.**

---

## Pacing Mode

**Default: Auto Mode**

**Auto Mode (default):**

- Setelah Checkpoint 2 disetujui, generate semua file tanpa konfirmasi per file
- Berikan progress update singkat setelah setiap major file group (bukan per domain)
- Format progress: _"Project.md, API-Standards.md, WORKFLOWS.md selesai. Sekarang generate domain files [N domain]..."_
- Stop hanya jika ada blocking ambiguity yang benar-benar tidak bisa diselesaikan tanpa input user
- Beri tahu user apa yang blocking dan minta input spesifik (satu pertanyaan, bukan diskusi panjang)

**Review Mode (opt-in):**

- Aktif jika user secara eksplisit meminta: "review per file", "konfirmasi dulu sebelum lanjut", atau sejenis itu
- Dalam Review Mode: tampilkan ringkasan setiap file setelah selesai dan tanya "Lanjut?"

**Aturan default:** Jangan pernah tanya "Lanjut ke domain berikutnya?" jika user tidak minta Review Mode.

---

## Phase 2: Generate Files

Mulai hanya setelah Checkpoint 2 disetujui. Ikuti urutan ini.

**Urutan generate:**

1. `Agent/Knowledge/Project.md`
2. `Agent/Knowledge/API-Standards.md` (jika ada API)
3. `Agent/Knowledge/WORKFLOWS.md`
4. `Agent/Knowledge/Domains/XX-<name>.md` per domain (urutan: sederhana ke kompleks)
5. `.github/copilot-instructions.md` (paling terakhir — meringkas semua yang sudah selesai)

**Anti-hallucination rule (berlaku untuk semua file):**

- Jangan copy description lines dari schema — itu instruksi, bukan konten
- Setiap section harus berisi data aktual dari codebase: nama class aktual, path file aktual, nama field aktual
- File yang masih mengandung frasa seperti "table of..." atau "list of..." adalah file yang belum selesai
- Gunakan Confidence Labels pada semua temuan yang bukan Confirmed (lihat section Confidence Labels)

---

### File 1: `Agent/Knowledge/Project.md`

Project bible. File pertama yang dibaca AI sebelum menyentuh codebase ini.

````markdown
# <Project Name> — Project Knowledge

> <Satu kalimat: aplikasi ini apa dan untuk siapa.> [Confidence: Tinggi/Sedang/Rendah]

---

## 1. Vision & Scope

Tujuan aplikasi, masalah yang diselesaikan, pengguna utama, journey utama mereka.
Apa yang TIDAK dibangun (MVP boundary, future work).
[Tandai setiap klaim dengan confidence label yang sesuai]

---

## 2. Repository Layout

Annotated directory tree. Setiap folder top-level dan sub-folder penting.
Untuk monorepo: workspace package names.

---

## 3. Tech Stack

Tabel per layer. Kolom: Layer | Teknologi | Catatan.
Layer: backend, frontend, database, infrastructure, shared packages.

---

## 4. Domain Map

Tabel: Domain | File Knowledge | Modul/Package yang Terlibat.
Gunakan exact domain breakdown yang disetujui di Checkpoint 2.

---

## 5. System Architecture

Topologi runtime: bagaimana komponen berkomunikasi, middleware/guard/interceptor dan urutannya, request lifecycle, cara auth/session di-resolve, cara multi-tenancy atau multi-branch dihandle.
Sertakan ASCII diagram jika membantu.

---

## 6. Code Conventions

### Module / Feature Structure

Folder layout modul yang konsisten. Jika ada inkonsistensi, dokumentasikan keduanya dan tandai mana yang aktif.

### Naming Conventions

Aturan naming per file type, variable, API endpoint, DB column.

### State Management (jika ada frontend)

Di mana state tinggal, struktur, cara side effect dihandle.

### Dead Code & Deprecated Files

List file yang ada di repo tapi tidak aktif.
Format: `path/ke/file.ts` — JANGAN DIJADIKAN REFERENSI — [alasan konkret]

---

## 7. How to Run

```bash
# Semua perintah dari clone sampai dev server berjalan
# install → build packages → env setup → migration → seed → dev server
```
````

---

## 8. Testing Strategy

Per layer: framework, lokasi, naming convention, apa yang ditest, apa yang TIDAK ditest.
Golden rule: "Jika mengubah X, wajib update Y."

---

## 9. Architectural Decisions

| Keputusan                     | Alasan           | Yang Rusak Jika Diubah | File Terkait  |
| ----------------------------- | ---------------- | ---------------------- | ------------- |
| [keputusan konkret dari kode] | [alasan konkret] | [konsekuensi konkret]  | [path aktual] |

Minimal 5 entries. Fokus pada yang terlihat aneh dari kode saja.

---

## 10. Critical Flows & Risk Areas

### Critical Business Flows

Tabel: Nama Flow | Endpoint/Trigger | Mengapa Kritis | Modul yang Terlibat

### High-Risk Modules

Tabel: Nama Modul | Mengapa Berisiko | Yang Harus Dicek Sebelum Modifikasi | Test yang Dijalankan

### High-Impact Entities

Tabel/list entity yang jika diubah skema-nya akan mempengaruhi banyak modul lain.

---

## 11. Anti-Patterns & Legacy Traps

Pola dari codebase ini yang TIDAK BOLEH ditiru. Satu entry per temuan.

Format per entry:
**[NAMA POLA]** — Ditemukan: `path/file.ts:baris` — Jangan ditiru karena: [alasan spesifik] — Cara yang benar: [alternatif konkret]

Jika belum ditemukan tapi umum dilakukan AI di project seperti ini: tandai sebagai `[AI-RISK — not found in codebase but commonly introduced]`

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

````

---

### File 2: `Agent/Knowledge/API-Standards.md`

**Hanya buat jika project punya API layer. Jangan copy description lines.**

```markdown
# API Standards & Contract

> Referensi wajib untuk setiap endpoint baru.

---

## 1. Core Principles

Tabel aturan non-negotiable: HTTP method, base URL, content type, auth header, status code strategy.
Jelaskan alasan di balik pilihan yang tidak biasa.

---

## 2. Request Envelope

Format exact dengan code block. Framework binding yang digunakan.

---

## 3. Response Envelope

Format success, error, list/paginated. Semua response code dan kapan digunakan.
TypeScript/shared type yang mendefinisikan envelope.

---

## 4. Authentication & Authorization

Guard/middleware yang tersedia + cara pasang (code snippet).
Cara ekstrak current user/session. Shape session/context payload.

---

## 5. Endpoint Naming Conventions

Pola URL. Tabel: Pola | Contoh | Kapan digunakan.

---

## 6. Field Naming Conventions

Case untuk: request fields, response fields, foreign key fields, boolean fields, date filters.

---

## 7. Complete Endpoint Directory

Group by resource/module. Per endpoint: method + path, guards, permission (jika RBAC), request fields, response fields.
Tandai endpoint yang melanggar konvensi: `[LEGACY EXCEPTION — reason]`

---

## 8. Code Patterns (Copy-Paste Ready)

Derive dari file aktual — gunakan nama class, method, decorator yang benar-benar ada.
Jika pattern tidak konsisten antar modul → tampilkan keduanya dan tandai mana yang canonical.

### Controller Pattern
```<language>
<derive dari controller file aktual di project ini>
````

### Service Method Pattern

```<language>
<derive dari service file aktual, dengan audit log jika ada>
```

### DTO / Validation Pattern

```<language>
<derive dari DTO file aktual>
```

### Error Handling Pattern

```<language>
<cara lempar error yang benar — derive dari exception filter aktual>
```

### Transaction Pattern (jika ada)

```<language>
<derive dari operasi transaksional aktual>
```

---

## 9. Checklist Endpoint Baru

Checkbox list semua yang harus diverifikasi sebelum endpoint dianggap selesai.
Derive dari pattern aktual di project ini — bukan generic best practice.

---

## 10. API Anti-Patterns

Pola yang DILARANG. Derive dari temuan aktual di codebase ini.

Format: **[NAMA]** — Contoh ditemukan: `path:baris` — Jangan karena: [alasan] — Gunakan: [alternatif]

Jika tidak ditemukan tapi berisiko: `[AI-RISK]` — Contoh: endpoint yang tidak menggunakan guard — Jangan karena: ...

---

## 11. Pagination

Format input dan output standar. Default dan maksimum.

````

---

### File 3: `Agent/Knowledge/WORKFLOWS.md`

**Setiap step harus menyebut nama file aktual dan command aktual. Tidak ada langkah abstrak.**

```markdown
# Development Workflows

> Baca workflow yang relevan SEBELUM mulai coding. Jangan skip langkah.

---

## 1. Menambahkan API Endpoint Baru

**Baca dulu:** `Agent/Knowledge/API-Standards.md` — semua section.

**Langkah:**
1. [Langkah konkret dengan path file aktual dari project ini]
2. [...]
...

**Files yang terdampak:** [list aktual]
**Command test:** [command aktual]
**Kesalahan umum di project ini:** [derive dari anti-patterns 1.9]

---

## 2. Memodifikasi Endpoint yang Sudah Ada

**Baca dulu:** Domain file relevan §4 + `API-Standards.md`.

**Langkah:**
1. Cek caller di frontend — jika ada, update bersamaan
2. [...]
3. Jika request/response shape berubah: update `API-Standards.md` §7
4. Update unit test yang ada, jangan hapus tanpa alasan

**Files yang terdampak:** [list aktual]
**Command test:** [command aktual]
**Kesalahan umum:** [derive dari codebase]

---

## 3. Menambah atau Mengubah Field Entity / DB Schema

**Baca dulu:** Domain file entity tersebut §3.

**Langkah:**
1. Ubah entity di [path aktual entitas]
2. Buat migration baru — JANGAN andalkan auto-sync
3. [Command buat migration di project ini]
4. Update DTO yang menggunakan field ini
5. Update unit test yang mock entity ini
6. Update domain file §3 di knowledge base
7. Jika field muncul di response API: update `API-Standards.md` §7

**Files yang terdampak:** [list aktual]
**Command test:** [command aktual]
**Kesalahan umum:** Lupa migration, lupa update DTO, synchronize:true diabaikan

---

## 4. Mengubah Business Flow / Logika di Service

**Baca dulu:** Domain file §4 + §10.

**Langkah:**
1. Baca existing test di [path test file] untuk memahami expected behavior saat ini
2. Ubah logika di service
3. Update atau tambah test untuk logika baru
4. Verifikasi side effect masih terjadi: audit log, event, notifikasi (jika relevan)
5. Update domain file §4 jika flow berubah signifikan

**Command test:** [command aktual]
**Kesalahan umum:** [derive dari codebase]

---

## 5. Memperbaiki Bug dengan Aman

**Langkah:**
1. Baca domain file yang relevan untuk memahami intended behavior
2. Baca test yang ada untuk memahami apa yang sudah diverifikasi
3. Tulis failing test yang mereproduksi bug SEBELUM fix
4. Fix bug
5. Verifikasi failing test sekarang pass
6. Verifikasi test lain di domain yang sama tidak ada yang break
7. Jika bug disebabkan anti-pattern: tambahkan ke §11 domain file dan `copilot-instructions.md` Forbidden Patterns

**Command test:** [command aktual]
**Kesalahan umum:** Fix tanpa test — bug yang sama biasanya muncul lagi

---

## 6. Refactoring Legacy Code dengan Aman

**PERINGATAN:** Jika tidak ada test untuk area yang akan direfactor → tulis test dulu.

**Langkah:**
1. Verifikasi coverage test untuk area yang akan direfactor
2. Jika tidak ada coverage → tulis characterization test untuk behavior saat ini
3. Lakukan refactor dalam langkah kecil
4. Jalankan test suite setelah setiap langkah
5. Jangan gabungkan refactor dengan perubahan fungsional
6. Update knowledge file jika ada pola yang berubah

**Command test:** full test suite untuk domain yang disentuh
**Kesalahan umum:** [derive dari anti-patterns di codebase]

---

## 7. Menambahkan Test

**Unit Test (Backend):**
- Lokasi: [path pattern aktual]
- Naming: [naming convention aktual]
- Mock strategy: [cara mock dependency di project ini]
- Template: [snippet derive dari test file aktual]

**Unit Test (Frontend, jika ada):**
- Lokasi: [path pattern aktual]
- Framework: [framework aktual]
- Template: [snippet aktual]

**E2E Test (jika ada):**
- Lokasi: [path pattern aktual]
- Framework: [framework aktual]
- Cara start environment: [command aktual]
- Template: [snippet aktual]

---

## 8. Mengupdate Knowledge Base Setelah Perubahan Kode

Urutan update:
1. Domain file yang relevan (section yang berubah saja)
2. `API-Standards.md` jika endpoint berubah
3. `WORKFLOWS.md` jika prosedur berubah
4. `Project.md` §9 jika ada keputusan arsitektur baru
5. `.github/copilot-instructions.md` terakhir

Jangan update `copilot-instructions.md` langsung — selalu update source-nya dulu.
````

---

### File 4: `Agent/Knowledge/Domains/XX-<domain-name>.md`

Satu file per domain. Nomor berurutan (01, 02, ...). Format: `01-identity-access.md`.

**Jangan copy description lines. Setiap section berisi data aktual. File yang masih mengandung frasa seperti "list of..." atau "table of..." adalah file yang belum selesai.**

```markdown
# Domain: <Nama Domain>

> <Satu kalimat: domain ini memiliki apa dan mengapa ada.>

---

## 1. Responsibilities

Daftar konkret. Bukan "mengelola user" — tapi "mengelola lifecycle user (create, update, deactivate), assign role-branch access, issue dan rotasi JWT token."

---

## 2. Modules / Packages Involved

Tabel: Modul/Package | Path Backend | Path Frontend | Catatan.
Hanya modul yang benar-benar milik domain ini.

---

## 3. Data Model

Per entity yang dimiliki domain ini:

- Nama entity sebagai heading
- Tabel fields: Field | Type | Constraint/Catatan
- Jelaskan field non-obvious
- Tandai foreign key ke domain lain dengan `→ Domain [nama]`

---

## 4. Key Business Flows

Per operasi write penting (create, update, delete, state transition):

- Endpoint + request shape
- Setiap langkah dinomeri
- Cantumkan: validasi, side effect, DB write, urutan write, transaction boundary

Format: step-list/pseudocode. Exhaustive untuk flow yang kompleks.

---

## 5. State Machines (jika ada)

Jika ada entity dengan status field:

- Semua state dan maknanya
- Transition graph (ASCII atau tabel)
- Guard yang enforce transition
- Side effect per transition

---

## 6. Relationships to Other Domains

Tabel: Domain Lain | Relasi | Catatan.
Data yang domain ini baca dari luar. Data yang domain lain baca dari sini.
Cross-domain invariant yang harus dijaga.

---

## 7. Frontend (jika ada)

### Pages / Routes

Tabel: File | Route | Tujuan.

### Hooks / Stores

Per hook/slice: nama, apa yang di-expose, bagaimana data di-load.

### Component-Specific Notes

Pola non-obvious: optimistic update, polling, dll.

---

## 8. Code Patterns (Copy-Paste Ready)

Derive dari file aktual di domain ini. Gunakan nama class, method, decorator yang benar-benar ada.
Jika tidak ada pola yang konsisten → tulis: `No consistent pattern found. Current implementation: [path file]`

Sertakan patterns yang relevan untuk domain ini:

- Service method yang umum
- Query pattern yang digunakan
- Error throw pattern
- Apapun yang spesifik untuk domain ini

---

## 9. Testing Coverage

### Unit Tests (Backend)

Tabel: Test File | Coverage (method by method).
Catat edge case dan error path yang ditest.

### Unit Tests (Frontend)

Tabel: Test File | Coverage.

### E2E / Integration Tests

Tabel: Test File | Skenario user yang dicakup.

### Coverage Gaps

Area di domain ini tanpa test → ini adalah high-risk area.

---

## 10. Rules for Changes

Format wajib per rule:
**[MUST / MUST NOT / ALWAYS / NEVER]** [aksi konkret] — **Mengapa:** [alasan konkret dari kode ini] — **Jika dilanggar:** [konsekuensi konkret dan spesifik]

Derive setiap rule dari: pola aktual kode, bug yang bisa ditebak dari kode, invariant yang dijaga oleh test, atau keputusan arsitektur yang sudah didokumentasikan. Jangan tulis generic best practice.

---

## 11. Anti-Patterns (Strictly Forbidden)

Format per entry:
**[NAMA]** — Ditemukan di: `path:baris` ATAU `[AI-RISK — not found but commonly introduced]` — Jangan karena: [alasan spesifik domain ini] — Gunakan: [alternatif konkret]

---

## 12. High-Risk Changes

Per area berisiko:
**[Nama Area]** — Mengapa berisiko — File/entity yang terlibat — Yang harus dicek sebelum modifikasi — Test yang harus dijalankan setelah modifikasi
```

---

### File 5: `.github/copilot-instructions.md`

**INI ADALAH PRIMARY CONTROL LAYER UNTUK COPILOT — BUKAN SUMMARY. BUKAN DOKUMENTASI.**

Dibaca Copilot untuk setiap saran kode. Harus mengontrol perilaku Copilot, bukan menjelaskan project.

**Dibuat paling terakhir** setelah semua Layer 1 selesai.

**Target ketat: di bawah 150 baris.**

**Kriteria setiap baris:** Apakah baris ini mempengaruhi kode yang Copilot generate? Jika tidak → hapus.

**Jangan copy description lines. Isi dengan konten aktual dari project yang sudah dianalisis.**

````markdown
# GitHub Copilot Instructions — <Project Name>

> Primary control layer. Rules here override Copilot defaults.
> Deep documentation: `Agent/Knowledge/`

---

## Project Context

<2–3 kalimat: aplikasi ini apa, untuk siapa, kondisi saat ini>

Stack: <ringkasan satu baris>
Layout: <satu baris per app/package untuk monorepo, atau "single-app repo">

**DO NOT use as reference (dead code / deprecated):**

- `<path/ke/file>` — <alasan singkat dan konkret>

---

## MUST Follow — Project-Wide Rules

Format setiap rule: [MUST/MUST NOT/ALWAYS/NEVER] + [aksi] — [alasan satu kalimat]
Derive dari temuan aktual di codebase ini. Tidak ada generic best practice.

1. MUST [aturan konkret] — [alasan satu kalimat]
2. MUST NOT [aturan konkret] — [alasan satu kalimat]
3. ALWAYS [aturan konkret] — [alasan satu kalimat]
4. NEVER [aturan konkret] — [alasan satu kalimat]
   [tambahkan semua rules kritis dari domain files §10 dan API-Standards §1]

---

## Code Patterns (Copy-Paste Ready)

Derive dari file aktual. Jika pattern tidak konsisten, tampilkan yang canonical dan tandai.
Maksimal 15 baris per snippet.

### <Nama Pattern aktual — contoh: NestJS Controller>

```<language>
<derive dari file aktual, dengan guard/decorator yang benar>
```
````

### <Nama Pattern aktual — contoh: Service Write Method>

```<language>
<derive dari file aktual, dengan audit log jika ada>
```

### <Nama Pattern aktual — contoh: Frontend API Call>

```<language>
<derive dari file aktual>
```

[Tambahkan pattern per layer yang ada di project ini. Skip layer yang tidak ada.]

---

## Forbidden Patterns

NEVER write:

- `<contoh pattern konkret dari codebase>` → gunakan `<alternatif>` — <alasan satu kalimat>
- `<contoh>` → gunakan `<alternatif>` — <alasan>
  [Derive dari §11 di setiap domain file dan §10 di API-Standards]

---

## Domain Map

| Area          | File Knowledge                         |
| ------------- | -------------------------------------- |
| <domain name> | `Agent/Knowledge/Domains/XX-<name>.md` |

---

## Change Safety

Sebelum modifikasi area berikut, baca dulu:

- Ubah <area high-risk spesifik>: `Agent/Knowledge/Domains/XX-<name>.md#12-high-risk-changes`
- Tambah endpoint baru: `Agent/Knowledge/WORKFLOWS.md#1-menambahkan-api-endpoint-baru`
- Ubah DB schema: `Agent/Knowledge/WORKFLOWS.md#3-menambah-atau-mengubah-field-entity--db-schema`
- Refactor legacy code: `Agent/Knowledge/WORKFLOWS.md#6-refactoring-legacy-code-dengan-aman`

```

---

## Confidence Labels

**Gunakan label ini di semua knowledge file. Terutama wajib pada:** tujuan aplikasi, role pengguna, domain grouping, critical flow, business rule, anti-pattern, deprecated file.

| Label | Kapan digunakan |
|-------|-----------------|
| `Confirmed from code` | Ada di kode secara eksplisit, tidak ambigu |
| `Inferred from code structure — verify with team` | Disimpulkan dari pola kode, tapi tidak ada pernyataan eksplisit |
| `Not found in codebase` | Dicari tapi tidak ada — jangan diinvent |
| `Documentation conflict: docs say X, code does Y — code is source of truth` | Ada konflik antara dokumentasi lama dan implementasi aktual |
| `Unverified pattern — may be legacy, may be intentional` | Ada pattern tapi tidak bisa ditentukan apakah disengaja atau technical debt |
| `AI-RISK — not found but commonly introduced` | Tidak ditemukan di codebase tapi sering dibuat AI secara tidak sengaja |

**Jangan tulis fakta tentang project tanpa label jika belum Confirmed.**

---

## Phase 3: Self-Validation Checklist

Sebelum menyatakan selesai, verifikasi setiap item. Jika gagal → perbaiki dulu.

**User Involvement:**
- [ ] Checkpoint 1 tidak menjadi blocker kecuali konteks bisnis benar-benar tidak bisa diinfer
- [ ] Checkpoint 2 dijalankan dan disetujui sebelum menulis file apapun
- [ ] AI tidak bertanya per-domain atau per-file kecuali user meminta Review Mode
- [ ] Pertanyaan ke user minimal — hanya untuk blocking ambiguity

**Copilot Control Layer:**
- [ ] `copilot-instructions.md` berisi MUST/MUST NOT/ALWAYS/NEVER — bukan "conventions"
- [ ] `copilot-instructions.md` punya "Forbidden Patterns" dengan contoh konkret dari codebase ini
- [ ] `copilot-instructions.md` di bawah 150 baris
- [ ] Setiap code pattern di `copilot-instructions.md` di-derive dari kode nyata, bukan invented
- [ ] Setiap rule di `copilot-instructions.md` mempengaruhi kode yang Copilot generate
- [ ] `copilot-instructions.md` dibuat terakhir setelah semua Layer 1 selesai

**Deep Knowledge Layer:**
- [ ] Confidence labels digunakan pada semua temuan yang belum Confirmed
- [ ] `Project.md` §11 berisi temuan nyata dari codebase (bukan generic advice)
- [ ] `Project.md` §10 mengidentifikasi minimal satu area high-risk dengan alasan konkret
- [ ] `Project.md` §9 punya 4 kolom: Keputusan | Alasan | Yang Rusak | File Terkait
- [ ] `API-Standards.md` §8 di-derive dari file aktual (bukan template kosong)
- [ ] `API-Standards.md` §10 berisi temuan aktual atau label `AI-RISK`
- [ ] Setiap domain file §10 menggunakan format MUST/MUST NOT/ALWAYS/NEVER
- [ ] Setiap domain file §11 berisi entry dengan path file atau label `AI-RISK`
- [ ] Setiap domain file §12 mengidentifikasi area berisiko nyata
- [ ] `WORKFLOWS.md` setiap langkah menyebut nama file aktual dan command aktual
- [ ] Tidak ada placeholder: TODO, TBD, "...", atau kalimat instruksi template yang tidak diisi

**Domain Coverage:**
- [ ] Setiap domain dari daftar yang disetujui Checkpoint 2 punya file tersendiri
- [ ] Tidak ada domain ditambah atau dihapus setelah Checkpoint 2 tanpa sepengetahuan user
- [ ] Setiap domain file §3 mencantumkan semua entity di domain tersebut
- [ ] Setiap domain file §4 mencantumkan semua operasi write sebagai numbered flow

---

## Failure Handling

- **Jika tidak ditemukan:** Tulis `Not found in codebase.` — jangan invent
- **Jika disimpulkan dari struktur:** Tulis `Inferred from code structure — verify with team.`
- **Jika ada konflik dokumentasi vs kode:** Tulis `Documentation conflict: docs say X, code does Y — code is source of truth.`
- **Jika tidak yakin pattern disengaja atau legacy:** Tulis `Unverified pattern — may be legacy, may be intentional.`
- **Jika pattern berpotensi dibuat AI tapi tidak ada di codebase:** Tulis `AI-RISK — not found but commonly introduced.`
- **Tanya ke user hanya jika:** informasi yang hilang memblokir pengelompokan domain atau interpretasi bisnis kritis. Jangan tanya untuk hal yang bisa dibiarkan dengan label inference.

---

## Writing Guidelines

**Tone:** Teknikal, langsung, zero filler. Untuk engineer senior yang butuh fakta.

**Depth over breadth:** 5 flow detail lebih baik dari 20 flow dangkal.

**Tables, not prose:** Untuk list field, endpoint, test coverage.

**Pseudocode for flows:** Nomeri setiap langkah. Sertakan validasi, side effect, DB write.

**Name things precisely:** Nama class, path file, method, field yang aktual. Jangan invent.

**Note what's absent:** Entity tanpa soft-delete, domain tanpa E2E test — absensi adalah konteks penting.

**Rules must be actionable:** Buruk: "handle errors properly." Baik: "Throw `NotFoundException` when record not found — global filter converts it to `{ code: 300 }`. DO NOT return null or undefined."

**Derive, don't invent:** Setiap rule, anti-pattern, dan code pattern harus berasal dari kode aktual atau ditandai `AI-RISK`.

**Language (files):** Ikuti bahasa dokumentasi codebase yang ada. Jika tidak ada → English. Komunikasi ke user tetap Bahasa Indonesia.

---

## Handling Edge Cases

**Frontend-only (tidak ada backend):**
- Skip `API-Standards.md`
- Domain files: ganti "Data Model" → "State Shape", "Business Flows" → "User Flows"
- Dokumentasikan data-fetching layer sebagai pengganti "API Layer"
- `WORKFLOWS.md`: ganti workflow API dengan workflow state management

**Backend-only / API service:**
- Skip section Frontend di domain files
- Expand section database dan infrastructure di `Project.md`

**Library / SDK / CLI tool:**
- Ganti "Domain Map" → "Module Map"
- Ganti "Business Flows" → "API Surface" (exported functions, signatures, behavior contracts)
- Ganti Frontend section → "Consumer Integration Patterns"
- `WORKFLOWS.md`: fokus ke workflow publish, versioning, breaking change

**Tidak ada test suite:**
- Tetap tulis section §9 di tiap domain file: "No tests. Flows MUST have tests before modification: ..."
- `WORKFLOWS.md` §5 dan §6: tambahkan peringatan tinggi bahwa area ini sangat berisiko tanpa test

**Project sangat kecil (< 5 modul):**
- Gabung domain menjadi 1–2 file
- `copilot-instructions.md` di bawah 80 baris
- `WORKFLOWS.md` lebih ringkas tapi tetap harus ada

**Project sangat besar (> 20 modul):**
- Sub-domain grouping: folder `Domains/commerce/` instead of flat files
- `Project.md` domain map reference sub-domain files
- `WORKFLOWS.md` bisa dibagi per domain jika prosedurnya sangat berbeda

---

## Output Summary

Setelah semua file selesai, sampaikan ke user **dalam Bahasa Indonesia**:

1. **File yang dibuat:** path + deskripsi satu baris per file
2. **Domain yang didokumentasikan:** nama + deskripsi singkat (sesuai Checkpoint 2)
3. **Anti-patterns yang ditemukan:** ringkasan temuan dari codebase (bukan generic)
4. **Area high-risk:** domain/modul paling berisiko untuk dimodifikasi
5. **Confidence summary:** domain atau section mana yang confidence-nya rendah dan perlu diverifikasi tim
6. **Kesenjangan atau asumsi:** contoh: "migration files tidak ditemukan — schema disimpulkan dari entity definitions"
7. **Rekomendasi langkah berikutnya:** contoh: "tulis test coverage untuk domain Commerce sebelum modifikasi apapun — lihat `WORKFLOWS.md` §7"
```
