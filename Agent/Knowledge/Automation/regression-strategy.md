# Regression Strategy

Strategi eksekusi tes regresi untuk meminimalisasi kerusakan saat perilisan (release) baru.

## Pemicu (Trigger)

- **Nightly Build**: Tes penuh (Full Regression) dijalankan setiap tengah malam (00:00).
- **PR Check**: Tes fungsional esensial (Smoke Test) dijalankan saat ada pengajuan *Pull Request*.

## Penanganan Flakiness

1. Selalu jalankan `retry: 2` untuk setiap pengujian.
2. Skrip gagal dua kali berturut-turut diisolasi dan dianalisis secara manual.
3. Hindari *hard wait* (`sleep`). Selalu gunakan *implicit* atau *explicit wait* berbasis `object-id`.
