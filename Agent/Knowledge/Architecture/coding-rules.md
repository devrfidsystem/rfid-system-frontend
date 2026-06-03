# Coding Rules

> Panduan bersih dalam penulisan sintaks di project Warehouse.

## No `any`

Penggunaan `any` di TypeScript dilarang keras karena merusak _safety net_ dari linter dan kompiler. Jika bentuk balikan API tidak diketahui secara penuh, gunakan `unknown` atau buat parsial Interface (`Partial<T>`). **Agent diwajibkan untuk mentracing DTO jika tergoda memakai `any`.**

## No Unnecessary `watch`/`watchEffect`

Hati-hati dengan _reactive trap_ di Vue 3.

- Hindari _chaining watch_ (sebuah `watch` memicu state yang diamati `watch` lain).
- Gunakan `computed` jika state turunan murni bergantung dari turunan state di atasnya tanpa efek samping _async_.

## No Direct API Calls from UI

Dilarang menaruh blok `<script setup>` yang memanggil `axios.post()` atau `fetch()`. Semua panggila HTTP harus dialihkan melalui _Services layer_ (`src/services/`). UI hanya memanggil `await myService.fetchData()`.

## Separation of Concern

Jika logic di suatu `.vue` melampaui 150 baris di area `<script setup>`, itu tanda bahwa logika state dan validasi harus di-ekstrak menjadi `use[FeatureName].ts` di folder `composables/`.
