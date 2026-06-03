# Decision: Pencegahan Efek Samping Berantai (No Watch Effect)

## Decision

Menghindari penggunaan Vue `watchEffect` secara bebas atau rantai `watch` bersarang yang tidak dianalisis batas rekursifnya.

## Reason

`watchEffect` bereaksi pada semua depedensi yang terbaca secara implisit, menyebabkan pemanggilan fungsi (atau lebih buruk, pemanggilan jaringan API) terjadi secara impulsif dan berulang-ulang ketika satu bagian state tak sengaja di-mutasi secara simultan.

## Impact

Menekankan kedisiplinan penggunaan `computed` untuk turunan variabel reaktif murni, dan `watch` biasa (secara eksplisit menyebutkan target state) ketika harus memicu pemanggilan _API async_.

## Examples

**Berbahaya:**

```typescript
watchEffect(() => {
    // Jika fetchData mengupdate state lain, bisa looping
    fetchData(localState.page);
});
```

**Direkomendasikan:**

```typescript
watch(
    () => localState.page,
    (newPage) => {
        fetchData(newPage);
    },
);
```
