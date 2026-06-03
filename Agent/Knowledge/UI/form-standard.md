# Form Standard

> Standar implementasi pengumpulan data dari pengguna.

## VeeValidate & Zod

Seluruh form (terutama untuk proses mutasi/submit) wajib menggunakan ekosistem atomic form.

1. Kerangka utama wajib menggunakan `<FormRoot>` dari `src/components/ui/form/`.
2. Validasi harus dideklarasikan via Zod schema di level _Composable_.

## Implementation Rules

- Data `v-model` tidak diizinkan diubah secara mutasi sepihak tanpa terhubung dengan blok `<FormRoot>`.
- Jika form berada dalam modal/dialog, pastikan state reset setelah modal ditutup agar sisa data form sebelumnya terhapus.
- Error validation (seperti form kosong atau format salah) dikelola secara otomatis oleh VeeValidate, jangan membikin _checker logic if/else_ kotor di _Composable_.
