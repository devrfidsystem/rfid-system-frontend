# Regression Strategy

Strategi eksekusi tes regresi untuk meminimalisasi kerusakan saat perilisan (release) baru.

## Pemicu (Trigger)

- **Nightly Build**: Tes penuh (Full Regression) dijalankan setiap tengah malam (00:00).
- **PR Check**: Tes fungsional esensial (Smoke Test) dijalankan saat ada pengajuan _Pull Request_.

## Penanganan Flakiness

1. Selalu jalankan `retry: 2` untuk setiap pengujian.
2. Skrip gagal dua kali berturut-turut diisolasi dan dianalisis secara manual.
3. Hindari _hard wait_ (`sleep`). Selalu gunakan _implicit_ atau _explicit wait_ berbasis `object-id`.
