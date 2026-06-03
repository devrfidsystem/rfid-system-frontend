# Error Handling Standard

> Manajemen kegagalan pemanggilan API secara elegan.

## Larangan Bisu (Silent Failures)

Setiap blok panggilan metode service (`await transactionService.create(...)`) yang rentan gagal harus berada di dalam blok `try...catch`. Jika terjadi Exception/Error, aplikasi WAJIB memberikan notifikasi visual _(toast, snackbar, atau inline alert box)_. Jangan sekadar membuang ke `console.error` atau me-reset state _loading_ diam-diam.

## Response Status 4xx dan 5xx

Interseptor di _Network Layer_ (`client.ts`) akan menangani masalah fatal seperti token kadaluwarsa (401 Unauthorized), lalu mendorong paksa sesi Vue Router keluar (`logout()`). Logic UI Vue Component hanya bertugas mengurus parsing pesan galat HTTP umum (Bad Request, Validas Gagal) ke dalam string yang dibaca manusia.
