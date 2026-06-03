# Workflow Enhancement

Gunakan workflow ini saat user memberikan prompt dengan tag `ENHANCEMENT:`.

## Tujuan

Memodifikasi atau menambah fitur minor ke eksosistem _existing_ tanpa merusak aliran bisnis yang sudah berjalan.

## 1. Impact Analysis

- Cari komponen/page target.
- Telusuri seberapa dalam modifikasi ini akan memengaruhi aplikasi. Apakah menambahkan filter baru membutuhkan perubahan skema _state_ global?
- Apakah _enhancement_ memengaruhi validasi form existing?

## 2. API Impact

- Cek kontrak terkait di `Contracts/`.
- Periksa apakah _enhancement_ UI ini memerlukan penambahan _query parameter_ atau parameter payload ke backend.
- Jika API tidak mendukung fitur ini (contoh: API belum punya filter kategori), **STOP dan Laporkan Gap API**. Jangan menggunakan manipulasi DOM lokal.

## 3. UI Impact

- Cek `Components/component-catalog.md`.
- Jika menambahkan tombol atau filter, gunakan komponen _Atomic_ yang sesuai.
- Cek posisi tata letak UI apakah akan merusak layar perangkat berukuran kecil (_Responsive design_).

## 4. Validation

- Pastikan _Enhancement_ ter- _type-safe_ (Tidak merusak interface DTO).
- Cek status _Loading_ / _Empty state_ terkait tambahan fitur ini.

## 5. Summary Output

Berikan output akhir:

```md
## Enhancement Summary

- **Scope**: [Nama halaman / Fitur]
- **Existing Behavior**: [Sebelum di-enhance]
- **New Behavior**: [Setelah di-enhance]
- **Files Changed**: [List file]
- **API Impact**: [Modifikasi parameter request/response DTO]
- **Validation**: [Lolos TS, Lolos Aturan]
- **Risk / Notes**: [Catatan tambahan]
```
