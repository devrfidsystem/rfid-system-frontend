# Workflow New Page

Gunakan workflow ini saat user memberikan prompt dengan tag `NEW PAGE:`.

## Tujuan

Membangun menu/halaman utuh (Front-to-back jika BE terlibat) berdasarkan spesifikasi bisnis yang ketat.

## 1. Business Analysis

- Telusuri Domain Playbook yang relevan.
- Pahami aktor, entitas data, dan tujuan pembuatan layar.
- Periksa apakah _Business Flow_ masuk akal terhadap arsitektur berjalan.

## 2. API Wiring

- Telusuri apakah _endpoint_ untuk layar ini sudah ada.
- Bangun/Daftarkan `Contract` baru di `Contracts/` yang merincikan spesifikasi endpoint, parameter, dan DTO.
- Bangun _Service Class_ di Frontend (`src/services`).

## 3. FE Structure

- Bangun file DTO / Model murni.
- Buat composable `useFeature.ts` yang menangani form atau list.
- Buat file `.vue` untuk merender tampilan (Gunakan katalog komponen).
- Pastikan `Loading/Empty/Error` state tersedia.

## 4. BE Structure (Bila Diperlukan)

- Jika agen ditugaskan merakit _Backend_, patuhi Layering NestJS (Controller -> Service).
- Jangan campur validasi DB langsung di Controller.

## 5. Route & Menu Wiring

- Tambahkan entry di `src/router/index.ts` (Route wiring).
- Pastikan meta `requiresAuth` diterapkan.
- Tambahkan entry di `Menu/menu-registry.md`.

## 6. Permission Wiring

- Ikat layar atau aksi tombol ke kunci otorisasi.
- Tambahkan kode otorisasi ke `Security/permission-registry.md`.

## 7. Summary Output

Berikan output akhir:

```md
## New Page Summary

- **Page/Menu**: [Nama]
- **Business Flow**: [Deskripsi singkat]
- **API Used**: [List endpoints]
- **FE Files Created/Changed**: [...]
- **BE Files Created/Changed**: [...]
- **Route/Menu Wiring**: [Status integrasi Router]
- **Validation**: [Lolos kriteria DoD]
- **Remaining Notes**: [Catatan]
```
