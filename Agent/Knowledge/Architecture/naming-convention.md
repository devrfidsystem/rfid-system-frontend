# Naming Convention

> Standar penamaan identitas variabel, file, dan arsitektur kode.

## General Standard

- **CamelCase (`camelCase`)**: Untuk penamaan variabel lokal, _properties_, JSON DTO dari BE, _functions_, composable hooks (`useXxx`), dan penamaan file di `/services`, `/store`.
- **PascalCase (`PascalCase`)**: Untuk penamaan `Interface`, `Type`, `Class`, Enum, dan File Komponen Vue (`Button.vue`, `DashboardPage.vue`).
- **Kebab-Case (`kebab-case`)**: Hanya untuk struktur penamaan parameter URL/Route (`/transactions/inbound-process`). Jangan gunakan untuk file Vue.

## DTO Standard

Data Transfer Objects harus berakhiran `Record` (untuk tipe entitas murni, misal `UserRecord`) atau `Dto` (untuk spesifik request/response contract, misal `CreateTransactionDto`).

## No Duplicated Logic

Hindari penamaan nama generik seperti `utils.ts` atau `helpers.ts` jika tujuannya spesifik (contoh kalkulasi harga). Gunakan `calculatePrice.ts` atau pindahkan ke dalam blok `useXxx.ts`.
