# Object ID Standard

Standarisasi elemen pengikatan (bindings) UI agar Selenium, Playwright, dan framework automation lainnya dapat mencari elemen antarmuka secara stabil, independen terhadap perubahan struktur DOM atau framework CSS.

## Prefix Standard

Semua Object ID wajib menggunakan prefix berikut untuk mengidentifikasi tipe komponen:

- `btn_` : Button
- `txt_` : Text Input
- `cmb_` : ComboBox / Select
- `tbl_` : Table
- `chk_` : Checkbox
- `dtp_` : DatePicker
- `txa_` : TextArea
- `swc_` : Switch
- `dab_` : Dialog Box / Modal
- `wdg_` : Widget
- `fld_` : File Upload
- `pgn_` : Pagination
- `acd_` : Accordion
- `bdb_` : Breadcrumb
- `ctm_` : Context Menu
- `trm_` : Tree Menu
- `lsb_` : List Box
- `img_` : Image (Interactive)
- `icn_` : Icon (Interactive)
- `pcb_` : Progress Bar
- `lkl_` : Link Label
- `rdb_` : Radio Button
- `nmf_` : Number Field
- `msb_` : Message Box / Alert / Toast

## Naming Convention

Setelah prefix, penamaan wajib menggunakan **PascalCase**.

Contoh:
- `btn_Login`
- `btn_SimpanProduct`
- `txt_ProductName`
- `cmb_ProductCategory`
- `tbl_ProductList`

## Selector Priority

Saat menulis skrip automation, urutan prioritas strategi pemilihan elemen (selector) adalah sebagai berikut:

1. `object-id`
2. `data-testid`
3. `id`
4. `aria-label`
5. `css selector`
6. `xpath`

Aturan utama: Dilarang keras menggunakan selector rapuh seperti XPath jika `object-id` dapat disematkan.
