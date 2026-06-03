# Drawer Standard

> Panel laci samping (Side-panel) untuk proses form atau tampilan detail padat.

## Penggunaan

1. **Form Besar (Master Data):** Input produk, pengaturan konfigurasi kompleks (lebih dari 3 form field).
2. **Notification / Filter Panel:** Menampilkan log aktivitas atau menampung banyak _dropdown filter_ panjang.

## Aturan Komponen

- Seperti Dialog, pisahkan komponen laci menjadi berkas tersendiri jika memuat Form.
- Gunakan prop boolean `v-model:isOpen` untuk mengelola rendering laci.
- Drawer tidak boleh menutupi lebih dari 40-50% layar lebar PC/Desktop standar.
