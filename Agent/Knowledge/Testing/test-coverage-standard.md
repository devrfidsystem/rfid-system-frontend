# Test Coverage Standard

Standar ambang batas persentase kelulusan otomatisasi pengujian (_Test Coverage Thresholds_) berdasarkan klasifikasi domain fungsional _(Criticality)_ dari tiap modul.

## Kategori Modul

### 1. Critical Module

- **Definisi**: Jantung operasional aplikasi. Kesalahan pada layar ini langsung berdampak fatal terhadap nilai aset stok (_Inventory_) fisik.
- **Coverage Minimum**: **90%**
- **Daftar Modul**:
    - `Transactions` (Inbound, Outbound, Adjustment, Relocation)
    - `IAM` (Perubahan Role/Password Authentication)

### 2. Normal Module

- **Definisi**: Pendaftaran master data yang berisiko menengah. Kesalahan hanya menghambat aktivitas di satu divisi, tidak mematikan inti proses mutasi stok berjalan.
- **Coverage Minimum**: **80%**
- **Daftar Modul**:
    - `Master Data` (Produk, Gudang, Lokasi, Kategori)
    - `RFID Operations` (Pendaftaran/Assignment Tag)

### 3. Utility Module

- **Definisi**: Fitur pendukung, sekunder, visualisasi atau pengaya.
- **Coverage Minimum**: **70%**
- **Daftar Modul**:
    - `Dashboard` (Grafik, Peringatan Stok)
    - `Reports` (Ekspor Excel, Ledger Laporan)
    - `Settings` (Konfigurasi warna aplikasi/tema)

## Rumus Kalkulasi (Agent Guidance)

_Test Coverage_ bukan sekadar perbandingan persentase eksekusi kode _Lines of Code (LoC)_, melainkan persentase fitur tersimulasi. Jika sebuah layar memuat 10 fungsi uji yang dimandatkan oleh `testing-standard.md`, maka skor **90%** berarti setidaknya **9** dari 10 aksi tes tersebut wajib dijalankan _(PASS/FAIL)_ tanpa terkecuali (_Skip tidak dihitung di penyebut_).
