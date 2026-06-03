# Selector Standard

Standarisasi elemen pengikatan _(bindings)_ agar Selenium/Webdriver dapat mencari elemen antarmuka secara stabil, aman terhadap guncangan refaktor kode, dan independen terhadap _framework_ CSS/Tailwind.

## Golden Rule

Seluruh komponen interaktif (Input, Tombol, Select, Baris Tabel) **WAJIB** memiliki atribut:

```html
data-testid="[identitas-unik-elemen]"
```

## Aturan Penamaan Test ID

Gunakan konvensi `[jenis]-[nama-elemen]` (menggunakan _kebab-case_).

- **Button**: `btn-[action]-[target]` (contoh: `btn-add-product`, `btn-confirm-delete`, `btn-submit`)
- **Input text**: `input-[name]` (contoh: `input-search-product`, `input-product-name`)
- **Select/Dropdown**: `select-[name]` (contoh: `select-filter-status`, `select-warehouse-id`)
- **Row/Baris**: `row-[entity]-[id/index]` (contoh: `row-product-0`, `row-product-WH01`)
- **Container Spesifik**: `modal-delete-confirmation`, `drawer-product-form`

## Aturan Remediasi (Autofix)

Jika Agen diminta menjalankan skenario tes untuk suatu halaman, namun saat melakukan _tracing_ file `.vue` Agen menemukan bahwa tombol atau isian target **belum memiliki** `data-testid`, maka:

1. Agen **wajib merekomendasikan** dan/atau **menuliskan** penambahan atribut `data-testid="..."` pada _source code_ komponen Vue tersebut.
2. Agen **DILARANG KERAS** menggunakan selektor XPath rapuh seperti `//div[2]/div/span[text()='Simpan']` atau mengikat nama kelas Tailwind seperti `button.bg-blue-500.px-4`.
