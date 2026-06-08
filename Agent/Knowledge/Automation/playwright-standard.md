# Playwright Standard

Standar otomasi pengujian menggunakan framework Playwright.

## Dasar

- Integrasi dan selector dalam Playwright wajib mematuhi panduan [Object ID Standard](object-id-standard.md).
- Prioritaskan pemanggilan `page.getByTestId('...')` yang di-*override* untuk membaca custom attribute `object-id`.

*(Dokumen ini bersifat *stub* dan akan dilengkapi seiring dengan migrasi ke Playwright).*
