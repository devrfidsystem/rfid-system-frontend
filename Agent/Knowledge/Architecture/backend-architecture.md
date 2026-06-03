# Backend Architecture

> Standar arsitektur NestJS untuk project Warehouse (Referensi Frontend untuk keselarasan integrasi).

## BE Layering

1. **Controller Layer**: Menangani routing HTTP, ekstraksi body/query params, anotasi dokumentasi Swagger, dan perlindungan _Auth Guards/Decorators_.
2. **Service Layer**: Mengandung _core business logic_, validasi multi-langkah, kalkulasi (contoh: mutasi stok), dan _error throwing_.
3. **Repository / Prisma Layer**: Berkomunikasi langsung dengan _Database_.

## Separation of Concern

Sistem BE menggunakan pendekatan modul vertikal (contoh: modul `Transactions`, modul `Rfid`, modul `Master`). Masing-masing domain memiliki DTO (_Data Transfer Object_) sendiri yang dibagikan secara implisit (sebagai interface kontrak) dengan Frontend.

## No Direct DB calls from Controller

Semua kueri dialirkan lewat _Service_. Transaksi yang kompleks (seperti _Inbound_ yang mengubah mutasi stok dan history log) menggunakan _Prisma Transactions_ `$transaction` untuk menjaga atomicity.
