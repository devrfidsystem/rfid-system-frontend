# Filter & Search Standard

> Pola UX pencarian untuk list / datatable.

## Aturan Sinkronisasi

Filter dan Search String yang aktif pada suatu layar harus mematuhi hal berikut:

1. State _Filter_ harus merefleksikan URL _(Query parameters)_. Jika terjadi refresh browser, kondisi filter tidak boleh hilang (Kecuali jika tidak relevan lagi).
2. Implementasikan teknik `watch` pada Composable untuk menyinkronkan Filter State dengan parameter `router.replace({ query: ... })`.
3. Pengiriman parameter API ke backend _Service layer_ diekstrak dari _state object_ filter yang sedang aktif, BUKAN dibaca manual via tag input secara DOM.

## Debounce Search

Pastikan pencarian teks _(Search Bar)_ tidak menembak panggilan API (HTTP) pada setiap detak tuts _keyboard_. Terapkan jeda (Debounce) minimal 300ms.
