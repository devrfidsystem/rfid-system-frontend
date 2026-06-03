# API Standards & Contract Index

> Direktori tata kelola komunikasi HTTP dari sisi Frontend Project Warehouse.

Direktori ini dipindahkan ke dalam modul arsitektur `API/`. Seluruh aturan spesifik mengenai protokol _HTTP_, _Envelope Error Handling_, _Format DTO_, hingga _JWT Auth Token_, kini merujuk pada standar-standar terpisah berikut ini:

- **[API Pattern](API/api-pattern.md):** Aturan ketat penggunaan `apiRequest` di _Network Layer_.
- **[Response Standard](API/response-standard.md):** Abstraksi amplop response Backend (`ApiResponse<T>`) yang berisi data/metadata.
- **[Error Handling](API/error-handling.md):** Panduan `try...catch` di service dan UI, serta penolakan _silent-failures_.
- **[Pagination Standard](API/pagination-standard.md):** Interaksi sinkronisasi query parameter (API Request) dan pembacaan meta object.
- **[Authentication Standard](API/authentication-standard.md):** Sumber dan aturan token persisten pada `auth.store.ts` menuju `client.ts`.

> **AGENT RULE (WAJIB TRACING):** DILARANG berasumsi terkait bentuk kontrak API (contoh: menebak-nebak tipe DTO/URL). Jika bentuk API belum didokumentasikan di sini secara spesifik, Anda **WAJIB TRACING** dari `src/api/feature/dto/` atau _Backend Controller_ yang berkaitan untuk menyelaraskan tipe datanya (_FE/BE Alignment_). Tidak menembak secara buta dengan array bebas atau `any`.
