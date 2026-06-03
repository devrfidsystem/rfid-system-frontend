# Dependency Map

Memetakan dampak berantai _(Butterfly Effect)_ jika satu modul diubah.

## Module: IAM (Identity & Access Management)

↓
**Dependencies**: Menyuplai `roles` dan `permissions`.
↓
**Impact Area**:

- Merubah cara login berdampak ke **SEMUA MODUL** (kegagalan JWT).
- Menghapus sebuah _Permission Code_ dapat mengunci halaman Frontend (_403 Forbidden_ pada Vue Router Guard).

## Module: Master Data (Product & Warehouse)

↓
**Dependencies**: Master dari segala operasional stok.
↓
**Impact Area**:

- Mengubah tipe data ID dari UUID ke Integer akan merusak tabel **TRANSACTIONS** dan **STOCK BALANCES**.
- Mengubah `categoryId` wajib diikuti dengan perubahan Dropdown di `TransactionForm`.

## Module: RFID Operations

↓
**Dependencies**: Bergantung ke pendaftaran `Product ID`.
↓
**Impact Area**:

- Merubah alur `rfid_events` berdampak pada modul validasi _Outbound_ dan modul _Dashboard Snapshot_ (Jumlah tag aktif).
- Tidak berdampak ke modul Master Data.
