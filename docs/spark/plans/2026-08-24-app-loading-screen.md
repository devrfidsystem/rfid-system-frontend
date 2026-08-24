# App Loading Screen (Cold Start) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use spark:subagent-driven-development (recommended) or spark:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cover the blank-white-page gap on app cold start (while the router awaits the initial auth check) with a branded loading screen, driven by `router.isReady()`, shown exactly once per session.

**Architecture:** A small composable (`useAppReady`) wraps `router.isReady()` into a reactive boolean, fully decoupled from Vue Router types so it's testable with a plain fake object. `App.vue` uses that boolean to switch between a new presentational `AppLoadingScreen.vue` and `<router-view>`. No changes to `router/index.ts` or `auth.store.ts`.

**Tech Stack:** Vue 3 `<script setup>`, TypeScript, Vitest (`environment: "node"`, no jsdom/@vue/test-utils — component tests render via `createSSRApp` + `vue/server-renderer`'s `renderToString`, composable tests call the function directly).

## Global Constraints

- No minimum display duration / anti-flicker delay — the screen shows for exactly as long as `initializeAuth()` actually takes (per spec, "Out of Scope").
- Shown on cold start only — never reappears on later in-app navigation, including navigating to `/login` after logout (per spec, "Trigger").
- `AppLoadingScreen.vue` takes no props, no slots — static presentational component (per spec, "Components").
- Mark background: `linear-gradient(135deg, #1E40AF 0%, #2563EB 55%, #14B8A6 100%)`; screen background: solid white `#FFFFFF` (per spec, "Components").
- Animation is a subtle pulse/fade only — no spinner, no progress bar, no text (per spec, "Components").

---

### Task 1: `useAppReady` composable

**Files:**
- Create: `src/composable/useAppReady.ts`
- Test: `src/composable/useAppReady.test.ts`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: `useAppReady(router: ReadyRouter): Ref<boolean>` and the exported type `ReadyRouter = { isReady: () => Promise<void> }`. Task 3 imports both the function and calls it with the real `router` from `@/router` (which satisfies the `ReadyRouter` shape structurally — no cast needed).

- [ ] **Step 1: Write the failing test**

Create `src/composable/useAppReady.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { useAppReady } from "./useAppReady";

describe("useAppReady", () => {
    it("stays false until the router reports ready, then flips true", async () => {
        let resolveReady: () => void = () => {};
        const readyPromise = new Promise<void>((resolve) => {
            resolveReady = resolve;
        });
        const fakeRouter = { isReady: () => readyPromise };

        const appReady = useAppReady(fakeRouter);

        expect(appReady.value).toBe(false);

        resolveReady();
        await readyPromise;
        await Promise.resolve();

        expect(appReady.value).toBe(true);
    });

    it("never flips true if the router never resolves", async () => {
        const foreverPending = new Promise<void>(() => {});
        const fakeRouter = { isReady: () => foreverPending };

        const appReady = useAppReady(fakeRouter);
        await Promise.resolve();

        expect(appReady.value).toBe(false);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/composable/useAppReady.test.ts`
Expected: FAIL — `Cannot find module './useAppReady'` (file does not exist yet).

- [ ] **Step 3: Write minimal implementation**

Create `src/composable/useAppReady.ts`:

```ts
import { ref } from "vue";
import type { Ref } from "vue";

export type ReadyRouter = {
    isReady: () => Promise<void>;
};

export const useAppReady = (router: ReadyRouter): Ref<boolean> => {
    const appReady = ref(false);
    router.isReady().then(() => {
        appReady.value = true;
    });
    return appReady;
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/composable/useAppReady.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/composable/useAppReady.ts src/composable/useAppReady.test.ts
git commit -m "feat: add useAppReady composable for cold-start gating"
```

---

### Task 2: `AppLoadingScreen.vue` component

**Files:**
- Create: `src/components/ui/states/AppLoadingScreen.vue`
- Test: `src/components/ui/states/AppLoadingScreen.test.ts`

**Interfaces:**
- Consumes: nothing (no props).
- Produces: default-exported Vue component with root class `app-loading-screen` and mark class `app-loading-screen__mark`, imported by Task 3 as `@/components/ui/states/AppLoadingScreen.vue`.

- [ ] **Step 1: Write the failing test**

Create `src/components/ui/states/AppLoadingScreen.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import AppLoadingScreen from "./AppLoadingScreen.vue";

const renderLoadingScreen = async () => {
    const app = createSSRApp({
        render: () => h(AppLoadingScreen),
    });

    return renderToString(app);
};

describe("AppLoadingScreen", () => {
    it("renders the full-screen overlay with the brand mark", async () => {
        const html = await renderLoadingScreen();

        expect(html).toContain("app-loading-screen");
        expect(html).toContain("app-loading-screen__mark");
        expect(html).toContain("<svg");
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ui/states/AppLoadingScreen.test.ts`
Expected: FAIL — `Failed to resolve import "./AppLoadingScreen.vue"`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/ui/states/AppLoadingScreen.vue`:

```vue
<template>
    <div class="app-loading-screen">
        <div class="app-loading-screen__mark">
            <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FFFFFF"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <path d="M4 11a8 8 0 0 1 16 0"></path>
                <path d="M7.5 11a4.5 4.5 0 0 1 9 0"></path>
                <circle cx="12" cy="17" r="2" fill="#FFFFFF" stroke="none"></circle>
            </svg>
        </div>
    </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.app-loading-screen {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ffffff;
    z-index: 9999;
}

.app-loading-screen__mark {
    width: 64px;
    height: 64px;
    border-radius: var(--radius-lg, 16px);
    background: linear-gradient(135deg, #1e40af 0%, #2563eb 55%, #14b8a6 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: app-loading-pulse 1.4s ease-in-out infinite;
}

@keyframes app-loading-pulse {
    0%,
    100% {
        opacity: 1;
        transform: scale(1);
    }
    50% {
        opacity: 0.6;
        transform: scale(0.92);
    }
}
</style>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/ui/states/AppLoadingScreen.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/states/AppLoadingScreen.vue src/components/ui/states/AppLoadingScreen.test.ts
git commit -m "feat: add AppLoadingScreen presentational component"
```

---

### Task 3: Wire `useAppReady` + `AppLoadingScreen` into `App.vue`

No new automated test is added in this task: the branching logic is already covered by Task 1's `useAppReady.test.ts` (the exact condition `App.vue` guards on), and the visual output is already covered by Task 2's `AppLoadingScreen.test.ts`. Mounting `App.vue`'s SFC to assert its template branches would require jsdom/`@vue/test-utils`, neither of which is a dependency in this project (`vitest.config.ts` runs with `environment: "node"`) — adding that infra for one integration point is out of proportion to the change. Verification here is the manual browser check in Step 3.

**Files:**
- Modify: `src/App.vue` (currently 8 lines, shown in full below)

**Interfaces:**
- Consumes: `useAppReady` and `ReadyRouter` from `src/composable/useAppReady.ts` (Task 1); `AppLoadingScreen` from `src/components/ui/states/AppLoadingScreen.vue` (Task 2); default-exported `router` from `@/router`.
- Produces: nothing consumed by later tasks — this is the final integration point.

Current `src/App.vue`:

```vue
<template>
    <router-view />
</template>

<script setup lang="ts">
import { useTheme } from "@/composable/useTheme";

useTheme();
</script>
```

- [ ] **Step 1: Update `App.vue` to use the composable and component**

Replace `src/App.vue` with:

```vue
<template>
    <AppLoadingScreen v-if="!appReady" />
    <router-view v-else />
</template>

<script setup lang="ts">
import { useTheme } from "@/composable/useTheme";
import { useAppReady } from "@/composable/useAppReady";
import AppLoadingScreen from "@/components/ui/states/AppLoadingScreen.vue";
import router from "@/router";

useTheme();
const appReady = useAppReady(router);
</script>
```

- [ ] **Step 2: Run the full test suite to confirm nothing broke**

Run: `npx vitest run src/composable/useAppReady.test.ts src/components/ui/states/AppLoadingScreen.test.ts`
Expected: PASS (3 tests total across the two files).

- [ ] **Step 3: Manual verification in the browser**

Run: `npm run dev`, open the app fresh (hard reload, clear any cached session if testing the logged-out path). Confirm: the white screen with the pulsing ALIR mark appears briefly, then either the login page or the dashboard appears — no flash of blank white before the mark shows, and the loading screen does not reappear when navigating to `/login` after logging out.

- [ ] **Step 4: Commit**

```bash
git add src/App.vue
git commit -m "feat: gate app render on router.isReady with a cold-start loading screen"
```

---

## Post-Implementation

Run the full unit test suite once more to confirm no regressions: `npx vitest run`.
