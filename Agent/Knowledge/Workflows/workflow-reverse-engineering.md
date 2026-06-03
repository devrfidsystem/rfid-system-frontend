# Workflow Reverse Engineering

Gunakan workflow ini saat user memberikan prompt dengan tag `ANALYZE:`.

## Tujuan

Membedah _(tear-down)_ komponen atau fitur eksisting dari UI sampai ke Database untuk memahami alur bisnis, menemukan _technical debt_, dan merumuskan spesifikasi tanpa membaca dokumen bisnis sama sekali.

## 1. Tracing Hierarchy

Agen wajib menelusuri rantai kode berikut _(The Trace Chain)_:

1. **Route**: Cek `src/router/index.ts` untuk menemukan komponen.
2. **Page**: Baca file `.vue` terluar.
3. **Component**: Baca atomik input / tabel di dalam page.
4. **Composable**: Buka `useFeature.ts` jika logika ditarik keluar.
5. **Store**: Cek Pinia di `src/store/` bila ada _global state_.
6. **Service**: Telusuri panggilan di `src/services/`.
7. **API**: Ekstrak URL endpoint.
8. **Controller** (Backend): Baca fungsi penerima di NestJS.
9. **Service** (Backend): Baca logika manipulasi DB.
10. **Repository**: Baca kueri Prisma.
11. **Database**: Identifikasi tabel terkait.

## 2. Output Wajib

Output akhir harus _strict_ sesuai format berikut:

```md
## Reverse Engineering Analysis

- **Business Flow**: [Deskripsi singkat alur fungsi]
- **FE Structure**: [Hierarki file Frontend]
- **BE Structure**: [Hierarki file Backend]
- **API Used**: [List of endpoints]
- **DTO**: [Struktur body JSON in/out]
- **Database Tables**: [Tabel Prisma]
- **Dependencies**: [Kaitan dengan modul lain]
- **Known Issues**: [Cacat kode, lack of error handling, dll]
- **Risks**: [Risiko apabila fitur ini diubah]
- **Recommendations**: [Saran standarisasi/refactor]
```
