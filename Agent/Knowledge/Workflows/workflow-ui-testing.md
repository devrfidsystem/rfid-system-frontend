# Workflow UI Testing Automation

Gunakan workflow ini saat user memberikan prompt dengan awalan tag `TEST:`, `TEST MODULE:`, `TEST REGRESSION:`, atau `TEST BUG:`.

## Step 1: Cari Halaman

Identifikasi nama halaman atau modul yang diminta.
Baca sumber kebenaran berikut:

- `Screens/` Registry
- `Contracts/` Registry
- `Menu/` Registry
- `Security/` Registry

## Step 2: Pahami Halaman

Lakukan analisis statis atas _Contract_ halaman. Identifikasi paramter mutlaknya:

- Route URL yang akan diuji
- Kunci `Permission` (RBAC)
- Metode API yang terlibat
- Filter, Komponen, dan Tombol-tombol yang tersedia untuk interaksi.

## Step 3: Generate Scenario

Berdasarkan `testing-standard.md`, susun cetak biru fungsional tes yang mencakup minimal:

1. Page Load
2. Permission
3. Search
4. Filter
5. Pagination
6. Sorting
7. CRUD (Create/Edit/Delete)
8. Validation
9. Empty State
10. Error State

_Note_: Jika fitur tertentu tidak tersedia pada laman (contoh: halaman sekadar laporan tanpa aksi Edit), Anda diwajibkan untuk melewatkannya _(Skip)_ secara formal di Laporan, lengkap dengan alasan bisnisnya. Anda dilarang mengarang skenario.

## Step 4: Generate Selenium Test

- Produksi skrip Node.js Selenium.
- Anda wajib memanggil pedoman taktik dari pustaka: `test-scenario-library.md`.
- Target selektor interaksi wajib ditautkan secara mutlak pada atribut `data-testid="..."`.
- **Dilarang** menyusun logika uji bertumpu pada XPATH atau teks tulisan label komponen yang mudah berubah.
- Bila komponen `.vue` terkait ternyata belum memiliki selektor `data-testid`, maka **wajib perbaiki dulu komponennya**.

## Step 5: Execute

- Simulasikan penjalanan tes skrip di peramban _Chrome_ _(headful/headless)_.

## Step 6: Generate Report

Berikan hasil laporan _(Output)_ wajib persis seperti di bawah ini:

```md
## Test Summary

- **Page/Module**: [Nama Target]
- **Execution Time**: [Durasi]
- **Coverage**: [Score % berdasarkan test-coverage-standard.md]

**PASS:**

- [Nama Skenario Lolos 1]
- [Nama Skenario Lolos 2]

**FAIL:**

- [Nama Skenario Gagal]

**SKIPPED:**

- [Nama Skenario Ditinggalkan - Alasan Skip]

---

### Failed Scenario Details

- **Scenario**: [Nama Skenario]
- **Expected**: [Harapan DOM behavior]
- **Actual**: [Kenyataan di UI]
- **Root Cause**: [Kesalahan elemen, dll]
- **Recommendation**: [Saran perbaikan]
```
