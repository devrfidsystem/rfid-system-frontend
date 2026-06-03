# Selenium Scripting Standard

Pedoman baku untuk seluruh _file_ skrip _Selenium WebDriver_ yang dihasilkan oleh Agen untuk platform _Warehouse_.

## Folder Structure

- File tes harus diletakkan dalam direktori terpusat proyek: `tests/e2e/`
- Konvensi Penamaan file uji: `[module]-[page].e2e.test.ts` (Contoh: `master-products.e2e.test.ts`).

## Test Data

- Dilarang keras menembak (menggantungkan nasib) tes pada ID _hardcode_ produksi (`id: 42`).
- Wajib menggunakan mekanisme _Seeding_ dinamis atau mencetak _(generate)_ nama produk rawak menggunakan _Timestamp/UUID_ (contoh: `"TestProduct_" + Date.now()`) untuk mereduksi regresi atau gagal saat pengulangan penjalanan tes.

## Wait Strategy (Strategi Tunggu)

- **Dilarang** menggunakan `driver.sleep(5000)` (Hard wait) kecuali untuk perbaikan kilat _intermittent_.
- **Wajib** memanfaatkan _Explicit Waits_ (`driver.wait(until.elementLocated(...), 5000)`). Tunggu indikator _spinner_ CSS hilang atau tunggu `data-testid` muncul dengan batas _timeout_ logis (5 - 10 detik).

## Retry Rules

- Apabila tes gagal karena lonjakan koneksi sementara _(stale element reference)_, skrip Selenium dibolehkan _(dan direkomendasikan)_ untuk dibungkus pengulangan `retry: 2`.

## Error Handling & Screenshot

- Jika pengujian skenario terbukti kandas _(AssertionError / Element Not Found)_, skrip secara otomatis harus melumpuhkan _(catch)_ laju kesalahan tersebut guna mengambil tangkapan layar `driver.takeScreenshot()`.
- Tangkapan layar _(Screenshot)_ disimpan di folder `tests/e2e/screenshots/` dengan nama yang memuat parameter tanggal-waktu rincinya.

## Report Generation

- Ujung _skrip_ harus menyemburkan hasil log ringkas yang koheren menuju konsol Terminal atau file format XML (contoh: JUnit Reporter standar), agar Agen/CI/CD bisa menyerap dan mem-parsing skor 12 blok fitur (Pass/Fail) secara cepat.
