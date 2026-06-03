# Workflow Audit Standardization

Gunakan workflow ini saat user memberikan prompt dengan tag `AUDIT:`.

## Tujuan

Melakukan penyisiran ketat terhadap kode eksisting guna memastikan _compliance_ (kepatuhan) terhadap standar desain _vibe coding_ proyek ini.

## 1. UI Audit

- Cek kepatuhan penggunaan _Atomic Components_ dari `Components/component-catalog.md`.
- Cek apakah status `Empty`, `Loading`, dan `Error` sudah ditangani.
- Cek responsivitas dasar dan _UX (User Experience)_ tata letak form/tabel.

## 2. Architecture Audit

- Cek pemisahan _Separation of Concern_. Apakah file `.vue` melebihi 200 baris dengan logika tebal?
- Apakah pemanggilan fungsi berada di tempat semestinya (UI -> Composable -> Service)?

## 3. API Audit

- Cek larangan `axios` langsung (_Direct HTTP calls_).
- Cek penggunaan `try...catch` dan respons _error notification_.

## 4. Contract Audit

- Lakukan penyelarasan _(Alignment)_ antara tipe Frontend dan spesifikasi di `Contracts/`.
- Cek pengiriman nama field (apakah salah penulisan CamelCase?).

## 5. Code Quality Audit

- Cek keberadaan tipe `any`.
- Cek penggunaan `watchEffect` yang tidak perlu.
- Cek keberadaan _Mock data_ (Array/Object dummy) yang tertinggal.

## 6. Summary Output

Berikan output akhir:

```md
## Audit Summary

- **Scope**: [Nama Layar/Modul]
- **Overall Status**: PASS / NEEDS IMPROVEMENT / CRITICAL

## Findings

| Area | Finding | Severity | Recommendation |
| ---- | ------- | -------- | -------------- |

## Required Fix Plan

1. [Langkah 1]...
```
