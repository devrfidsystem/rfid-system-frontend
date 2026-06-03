# Domain: RFID Operations

> **AGENT RULE:** Pelacakan log RFID berpotensi masif. Wajib mengimplementasikan _server-side pagination_ dan _filters_ sesuai dengan contract backend. Jangan berasumsi bahwa data akan ditarik sekaligus. Cek endpoint aslinya bila ambigu.

## Overview

Manajemen fisik hardware _Electronic Product Code_ (EPC) Tag ke entitas produk dan dokumen referensi, serta melacak pemindaian tag melalui gerbang (Portal/Scanner).

## Business Goal

Menjembatani dunia logistik fisik secara presisi (identitas tiap barang terpisah) dengan sistem pergerakan data tanpa input manusia terus menerus.

## Actors

- **RFID Staff**: Meregistrasi gulungan Tag RFID kosong.
- **Packer**: Menempelkan Tag ke barang (Assignment).

## Use Cases

1. **Tag Registration**: Mengubah tag _draft_ menjadi _available_ ke dalam database sistem.
2. **Tag Assignment**: Menghubungkan ID EPC tag (contoh: `E200...`) ke `Product ID` spesifik dan meletakkannya di `Location ID` tertentu.
3. **Event Tracking**: Melihat riwayat pergerakan log setiap kali tag dipindai antena.

## Entities

- `EpcTag` (EpcRecord)
- `RfidEvent` (Log)

## Database Tables

- `epc_tags`
- `rfid_events`

## API Endpoints

- `GET /api/v1/rfid/tags`
- `POST /api/v1/rfid/assignments`
- `GET /api/v1/log/tracking`

## Permissions

- `RFID_ASSIGN`, `RFID_READ`, `RFID_EVENT_VIEW`.

## UI Pages

- `src/views/rfid/TagRegistrationPage.vue`
- `src/views/rfid/RfidAssignmentPage.vue`
- `src/views/rfid/RfidEventPage.vue`

## Relationships

- **Inventory Transaksi**: Validasi scan RFID memastikan barang yang lewat sesuai dengan dokumen transaksi.

## Common Bugs

- **Manual Form Errors**: Beberapa komponen lama (seperti `RfidAssignmentPage`) masih menggunakan objek error lokal alih-alih `FormRoot` yang terstandarisasi, membuat validasi rumit.
- **Render Ribuan Log**: Jika backend tidak memaginate `tracking` dengan baik, Frontend akan nge-_freeze_ merender tabel 10.000 baris event RFID.

## Known Constraints

- UI tidak secara aktif 'berkomunikasi' langsung dengan hardware RFID Reader (itu tugas backend / worker server lokal). UI hanya merender log pasif.
