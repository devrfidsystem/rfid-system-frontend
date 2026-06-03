# Workflow Release Review

Gunakan workflow ini saat user memberikan prompt dengan tag `RELEASE REVIEW:`.

## Tujuan

Melakukan audit menyeluruh layaknya _Quality Assurance (QA) Gate_ untuk meninjau status _Checklist_ rilis sebuah Modul/Fitur dan menjatuhkan vonis kelayakan _Production Deployment_.

## 1. Audit Referensi

- Buka panduan di `Agent/Knowledge/Release/release-checklist.md`.
- Bandingkan kelengkapan kode eksisting (FE & BE) dari modul terkait terhadap 23 kriteria dalam panduan tersebut.

## 2. Verdict Logic

- Jika **SATU SAJA** komponen kritis belum terpenuhi (contoh: _Empty State_ belum ada, Route belum dijaga _Permission_), maka hasil vonis adalah `BLOCKER`.
- Jika seluruh pilar telah kokoh _(Checklist 100% terpenuhi)_, maka hasil vonis adalah `PASS`.

## 3. Output Wajib

Hasil akhir wajib berformat sebagai berikut:

```md
## Release Review Report

**Vonis**: [ PASS | BLOCKER ]

### Rincian Evaluasi:

- **Build**: [OK / Fail - Alasan]
- **Lint**: [OK / Fail - Alasan]
- **Contract**: [OK / Fail - Kepatuhan DTO]
- **Permission**: [OK / Fail - RBAC Binding]
- **Menu**: [OK / Fail - Registrasi]
- **API**: [OK / Fail - Service File Binding]
- **Integration**: [OK / Fail - FE to DB Mapping]
- **Testing**: [OK / Fail - E2E Coverage]
- **Deployment Readiness**: [Ready / Not Ready]

### Blocker Details (Jika Ada)

- [List masalah kritis penghambat rilis]
```
