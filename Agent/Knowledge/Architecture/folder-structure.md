# Folder Structure

> Struktur penyimpanan yang mewajibkan isolasi fitur (Vertical Slicing) untuk mengurangi technical debt.

## Struktur Frontend

```text
src/
├── api/             # DTO & Enum Models yang sama persis dengan backend
├── components/      # Folder global untuk komponen re-usable (Atomic)
├── composable/      # Folder global untuk composable (hooks) umum
├── lib/             # Helper fungsi utilitas, formatters, HTTP Client setup
├── model/           # Definisi entitas murni Frontend
├── router/          # Konfigurasi Vue Router dan Guards
├── services/        # Kumpulan wrapper API client
├── store/           # Pinia stores
└── views/           # Modul fitur (Vertical Slicing)
    ├── [feature]/
    │   ├── components/  # Komponen UI spesifik untuk fitur ini
    │   ├── composables/ # Hook logika spesifik untuk fitur ini
    │   └── [X]Page.vue  # Entry point untuk router halaman
```

## Folder Placement Rules

- Jika komponen hanya dipakai di satu halaman, simpan di `src/views/[feature]/components/`.
- Jika komponen dipakai lebih dari 1 modul fitur, tarik ke atas menuju `src/components/organisms/` (atau molekul/atoms).
