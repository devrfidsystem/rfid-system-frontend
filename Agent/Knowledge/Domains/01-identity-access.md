# Domain: Identity & Access (IAM)

> **AGENT RULE:** Dilarang berasumsi terkait logika bisnis IAM. Cek referensi `src/store/auth.store.ts` dan `src/router/index.ts` jika informasi tidak terperinci di sini. Data JWT atau struktur Auth harus diperiksa via API Contract atau Swagger.

## Overview

Domain ini mengelola siklus hidup kredensial pengguna, profil, otentikasi sesi JWT, penetapan Role (RBAC), dan relasi akses ke Cabang/Perusahaan.

## Business Goal

Menjaga gerbang masuk aplikasi secara aman dan mengarahkan pengguna hanya ke modul yang mereka berhak akses.

## Actors

- **Super Admin**: Memiliki akses ke pengaturan role dan registrasi tenant.
- **Warehouse Manager**: Dapat melihat profil dan akses gudang terkait.
- **Staff/Operator**: Hanya bisa login dan memproses mutasi.

## Use Cases

1. **Login & Session Management**: Pengguna memasukkan kredensial dan menerima JWT. Token disimpan di `localStorage` & Pinia.
2. **Role Assignment**: Admin memberikan role spesifik (dengan daftar permissions) ke User.
3. **Route Guarding**: Membatasi halaman Frontend (menendang balik ke `/login` jika sesi kedaluwarsa).

## Entities

- `User` (UserRecord)
- `Role` (RoleRecord)

## Database Tables

- `users`: id, email, password_hash, role_id.
- `roles`: id, name, description.
- `role_permissions`: relasi many-to-many role dan permission_keys.

## API Endpoints

- `POST /api/v1/auth/login` - Menghasilkan JWT.
- `GET /api/v1/iam/roles` - Daftar Role.
- `GET /api/v1/iam/users` - Daftar User.

## Permissions

- Dikelola melalui array string `permissions` yang menempel pada objek User Profile dari backend.

## UI Pages

- `src/views/auth/LoginPage.vue` (`/login`)
- `src/views/iam/RolesPage.vue` (`/iam/roles`)
- `src/views/iam/UserAccessPage.vue` (`/iam/users`)

## Relationships

- **Master Data**: Menghubungkan User dengan daftar Gudang (Warehouse).
- **Semua Domain**: Membutuhkan JWT untuk _Authorization Header_.

## Common Bugs

- **UI tidak update setelah Logout**: Terjadi jika tidak membersihkan Pinia Store saat memanggil `localStorage.removeItem('token')`.
- **Infinite Redirect Loop**: Terjadi jika Guard `src/router/index.ts` salah melogikakan kondisi `isAuthenticated` pada rute publik.

## Known Constraints

- Pemeriksaan token _expiry_ sangat bergantung pada penolakan 401 dari backend, Frontend tidak melakukan decode JWT kadaluwarsa secara mandiri.
