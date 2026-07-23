# Master Form Drawer Wrapper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use spark:subagent-driven-development (recommended) or spark:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every Master Data create/update flow render through the shared `Drawer.vue` wrapper while keeping the existing page-level API unchanged.

**Architecture:** `MasterFormModal.vue` becomes a thin wrapper around `Drawer.vue`, so all master entity pages continue to open the same component and submit the same payloads. The only UI change is the presentation surface: form content moves from centered modal chrome into a right-side drawer shell with the existing form controls, validation, and footer actions preserved.

**Tech Stack:** Vue 3 Composition API, `<script setup lang="ts">`, Tailwind CSS tokens, shared `Drawer.vue`, existing atom inputs/selects/buttons.

## Global Constraints

- Keep the `MasterFormModal` public props and emits unchanged so `MasterEntityPage.vue` and every master entity page keep working without contract changes.
- Use the shared `Drawer.vue` wrapper for create/update form presentation.
- Preserve existing form state reset, file handling, field disabling, and option resolution behavior.
- Do not introduce new master-page-specific modals or duplicate drawer implementations.

---

### Task 1: Replace modal chrome with the shared drawer wrapper

**Files:**

- Modify: `src/views/master/components/MasterFormModal.vue`

**Interfaces:**

- Consumes: `Drawer.vue` props `modelValue`, `title`, `description`, `side`, `width`, `closeOnBackdrop`, `closeOnEsc`
- Produces: same `MasterFormModal` props/emits as today (`isOpen`, `title`, `formFields`, `initialState`, `isSubmitting`, `isEdit`, option arrays, `close`, `submit`)

- [ ] **Step 1: Rewrite the failing surface expectation**

```vue
<template>
    <Drawer
        :model-value="isOpen"
        :title="title"
        :description="
            isEdit
                ? 'Update master data entry.'
                : 'Create a new master data entry.'
        "
        side="right"
        width="md"
        @update:model-value="emit('close')"
        @close="emit('close')"
    >
        <form class="space-y-6" @submit.prevent="submitForm">
            <!-- existing fields and footer actions stay here -->
        </form>
    </Drawer>
</template>
```

- [ ] **Step 2: Run the app-level type check expectation**

Run: `npm run -s type-check`

Expected: pass after the wrapper swap and import changes.

- [ ] **Step 3: Implement the minimal drawer-based wrapper**

```ts
import Drawer from "@/components/organisms/Drawer.vue";
```

Keep the existing local form state, option lookup, file upload handling, and submit/close emits unchanged. Move the button row into the form footer area inside the drawer.

- [ ] **Step 4: Run type check again**

Run: `npm run -s type-check`

Expected: pass.

- [ ] **Step 5: Commit the focused wrapper change**

```bash
git add src/views/master/components/MasterFormModal.vue docs/spark/plans/2026-07-05-master-form-drawer-wrapper.md
git commit -m "feat: render master forms in drawer wrapper"
```

### Task 2: Verify master pages still open the same form component

**Files:**

- Inspect: `src/views/master/MasterEntityPage.vue`
- Inspect: `src/views/master/composables/useMasterEntity.ts`
- Inspect: `src/views/master/components/MasterDeleteModal.vue`

**Interfaces:**

- Consumes: existing `showAddModal`, `showEditModal`, `handleCreate`, `handleUpdate`
- Produces: no API changes; only confirms that every master entity page still reaches `MasterFormModal`

- [ ] **Step 1: Confirm no page-level code changes are needed**

```vue
<MasterFormModal
    :is-open="showAddModal"
    :title="`Add ${config.title}`"
    :form-fields="formFields"
    :initial-state="formState"
    :is-submitting="isSubmitting"
    :is-edit="false"
    @close="closeAdd"
    @submit="handleCreate"
/>
```

- [ ] **Step 2: Run the type check one more time after inspection**

Run: `npm run -s type-check`

Expected: pass.

- [ ] **Step 3: Stop without further refactors**

Do not split master forms into per-page drawers. The wrapper component is the only intended change surface.
