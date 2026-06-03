# DTO Mapping

> Cara menghubungkan tipe data antar sisi Frontend dan Backend secara Type-Safe.

## Data Transfer Objects (DTO) Rule

1. **Cocokkan DTO:** Lihat ke `src/api/feature/dto/[domain].dto.ts`.
2. Jika Frontend menerima tipe DTO komposit `UserSessionDto`, _interface_ internal Frontend (contoh `UserRecord`) **TIDAK BOLEH** berbeda drastis namanya.
3. Lakukan konversi (Normalisasi) ringan di _Service layer_ jika struktur _response payload_ backend bersarang terlalu dalam. Jangan menaruh fungsi mapping data (`.map(val => ...)`) secara mentah di komponen Vue. Pindahkan ke fungsi pemroses/formatter terpisah atau _Service Layer_.
