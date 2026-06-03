# Authentication Standard

> Tata krama otentikasi (JWT Token Auth).

## Sumber Token

Kredensial disimpan pada Pinia (Global Vue State) di bawah modul `useAuthStore` serta disalin (Mirroring) ke objek Web Browser `localStorage`.

## Agent Constraints

- Jangan membuat sistem _check authentication_ secara paralel menggunakan HTTP `Bearer Token` raw secara manual (Contoh dilarang: memasukkan _Header Auth_ mandiri ke dalam `axios.post`).
- Segala proteksi akses UI harus dicek via kapabilitas komputasi `authStore.isAuthenticated` dan diatur secara mutlak di dalam navigasi `router/index.ts` guard.
- Data Profile, id cabang, serta ID perusahaan aktif diambil dari Store yang sama (`authStore.profile`), jangan menarik id perusahaan secara hardcode (kecuali mode Test Admin terisolasi).
