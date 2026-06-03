# Decision: API Request via Service Layer

## Decision

Semua panggilan API HTTP dari aplikasi klien harus digabungkan di dalam class/objek _Service_ di `src/services/`. Komponen `.vue` hanya boleh memanggil _method service_ melalui blok composable.

## Reason

Menjamin keberlakuan interceptor keamanan jaringan (JWT token) secara global, menyeragamkan penanganan `ApiResponse` wrapper, dan mencegah duplikasi URL string secara _hardcode_ di dalam puluhan file UI.

## Impact

Arsitektur sedikit berbelit namun memberikan skalabilitas ketika Base URL berubah atau saat DTO _mapping_ perlu dimutasi.

## Examples

**Salah (Ditolak):**
Di dalam `MyPage.vue`:

```typescript
import axios from "axios";
const res = await axios.get("http://api/users");
```

**Benar:**
Di dalam `MyPage.vue`:

```typescript
import { userService } from "@/services/user.service";
const users = await userService.getUsers();
```
