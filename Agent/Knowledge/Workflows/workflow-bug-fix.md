# Workflow Bug Fix

Gunakan workflow ini saat user memberikan prompt dengan tag `BUG:`.

## Tujuan

Memperbaiki _bug_ tanpa memunculkan _bug_ baru, mengidentifikasi akar masalah secara akurat, dan merespons tanpa asumsi.

## 1. Tracing Bug

- Temukan layar/komponen UI yang disebutkan dalam laporan.
- Telusuri hirarki file Vue, baca blok `useXxx.ts` jika error bersumber dari _state/logic_.
- Jika error dari API (contoh: status HTTP gagal), telusuri Payload request dan periksa formatnya.
- **Penting:** Dilarang menebak _root cause_ tanpa meninjau kode aktual.

## 2. Root Cause Analysis

- Identifikasi apakah ini error UI murni (HTML/CSS), error sinkronisasi state (Vue reaktivitas), atau ketidaksesuaian DTO ke API.
- Cek `Known-Issues/` untuk memastikan apakah ini _bug_ warisan atau fenomena lazim.

## 3. Implementation & Validation

- Terapkan perbaikan dengan pendekatan paling minimal _(Least invasive)_.
- Validasikan solusi terhadap aturan `AGENT-RULES.md` (Pastikan _Type-Safe_, Tanpa _Mock_).
- Jika ada file yang direfactor, pastikan linter TS hijau.

## 4. Summary Output

Berikan output akhir persis seperti format ini:

```md
## Bug Fix Summary

- **Bug**: [Deskripsi singkat bug dari user]
- **Root Cause**: [Akar permasalahan teknis]
- **Files Changed**: [File apa saja yang dimodifikasi]
- **Fix Implemented**: [Apa yang diubah/diperbaiki]
- **Validation**: [Kriteria apa yang dicek untuk memastikan perbaikan]
- **Risk / Notes**: [Potensi regresi jika ada]
```
