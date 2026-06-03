# Workflow E2E Selenium

Gunakan workflow ini saat user memberikan prompt dengan tag `E2E TEST:`.

## Tujuan

Mengembangkan atau menjalankan simulasi E2E _(End-to-End)_ Test via Selenium di atas browser sungguhan untuk meniru interaksi pengguna penuh.

## 1. Selenium Rules

- Test difokuskan menguji layar fungsional.
- Jangan gunakan _hard timeout_ panjang; utamakan fungsi _wait-for-element_ dinamis.

## 2. Selector Rules

- Wajib menyasar elemen HTML dengan target prioritas tinggi: Atribut `data-testid="..."`.
- Jika komponen belum memilikinya, Agen berhak melakukan pembaruan file `.vue` untuk merajut _Test ID_ pada elemen tersebut.
- Hindari menyasar XPath rapuh atau _Class CSS_ Tailwind (karena dapat berubah).

## 3. Test Scenarios

- **Happy Path:** Mengikuti panduan _Business Flow_ di dokumentasi Domain.
- **Negative Path:** Menguji pengosongan _mandatory field_ (dan mengharapkan validasi tertampil).
- **Security Path:** Menguji penolakan halaman akibat sesi yang kedaluwarsa atau tanpa izin.

## 4. Validation

- Test script harus sukses berjalan setidaknya di environment lokal.
- Lakukan pembersihan (Teardown) pada _test data_ jika script membuat row di Database.

## 5. Summary Output

Berikan output akhir:

```md
## E2E Test Summary

- **Page**: [Nama Halaman]
- **Scenarios Covered**: [List test case]
- **Test Files Created/Changed**: [...]
- **Selectors Added**: [Jika Agen memodifikasi file Vue]
- **How To Run**: [Command cli untuk execute]
- **Result**: [PASS / FAIL]
- **Notes/Risk**: [...]
```
