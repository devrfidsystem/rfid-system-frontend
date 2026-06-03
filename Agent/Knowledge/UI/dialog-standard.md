# Dialog Standard

> Modal popup untuk aksi interaktif kritis di tengah layar.

## Penggunaan

1. **Confirmation Dialog**: Konfirmasi untuk destructive action (Delete, Void, Cancel Transaction).
2. **Action Dialog**: Form kecil yang memiliki kurang dari 3 field.

## Aturan Komponen

- Selalu pisahkan implementasi komponen Dialog jika cukup padat logika (contoh `<CreateRoleDialog>`).
- Jika aksi klik pada tombol memicu Dialog, kelola `isOpen` boolean state di dalam komponen induk, lalu ikat via `v-model:isOpen` pada prop komponen Dialog.
- Wajib memiliki handling untuk menutup _(Close)_ dialog via tombol [X] atau menekan di luar kanvas (Escape/Click away).
