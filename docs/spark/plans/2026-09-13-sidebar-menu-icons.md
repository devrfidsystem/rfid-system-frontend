# Sidebar Menu Icons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use spark:subagent-driven-development (recommended) or spark:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render an icon for every visible sidebar menu item, including nested items, while preserving hierarchy, navigation, and active-state styling.

**Architecture:** Keep `sidebarNavigation.ts` as the single source of menu icons and fallback resolution. Update only the presentational loop in `Sidebar.vue` so every flattened item renders its existing `item.icon`; use depth only to choose indentation and icon sizing. Strengthen the existing source-usage test to prevent nested items from regressing to bullet markers.

**Tech Stack:** Vue 3 `<script setup>`, TypeScript, Tailwind CSS, `lucide-vue-next`, Vitest, Vite.

## Global Constraints

- Menu labels remain visible text and are not replaced by icons.
- Existing button semantics, navigation events, active route styling, and search behavior remain unchanged.
- Unmapped menu codes continue using the existing `DEFAULT` icon fallback.
- Do not add dependencies or change backend menu data, route access rules, or rail behavior.
- Preserve the unrelated user change in `src/views/opname/composables/useOpnameCreate.test.ts`.

---

### Task 1: Render icons for all sidebar depths

**Files:**

- Modify: `src/components/organisms/Sidebar.vue:58-91`
- Test: `src/components/organisms/sidebarUsage.test.ts`

**Interfaces:**

- Consumes: `SidebarFlatItem.icon` from `flattenSidebarNavItems()`.
- Produces: A sidebar button that renders `<component :is="item.icon">` for every item, with depth-specific size/indentation and the existing active/hover color behavior.

- [ ] **Step 1: Write the failing regression guard**

Add this test to `src/components/organisms/sidebarUsage.test.ts`:

```ts
it("renders an icon for nested menu items instead of a bullet", () => {
    expect(sidebarSource).toContain(':is="item.icon"');
    expect(sidebarSource).not.toContain('v-if="item.depth === 0"');
    expect(sidebarSource).not.toContain("rounded-full bg-text-muted/60");
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
npx vitest run src/components/organisms/sidebarUsage.test.ts
```

Expected: FAIL because the current template limits the icon component to depth `0` and still contains the nested-item bullet marker.

- [ ] **Step 3: Implement the minimal template change**

In `src/components/organisms/Sidebar.vue`, replace the conditional icon/bullet block with one icon component for every item:

```vue
<component
    :is="item.icon"
    class="shrink-0"
    :class="[
        item.depth === 0 ? 'h-3.5 w-3.5' : 'h-3 w-3',
        isActive(item.path)
            ? 'text-primary-600'
            : 'text-text-muted group-hover:text-text',
    ]"
    :stroke-width="1.75"
/>
```

Keep the existing button class and existing `item.depth > 0 ? 'pl-6' : ''` indentation class unchanged. Do not modify `navigate`, filtering, route matching, or the icon map.

- [ ] **Step 4: Run the focused test and verify it passes**

Run:

```bash
npx vitest run src/components/organisms/sidebarUsage.test.ts
```

Expected: PASS, including the existing Input atom usage assertion and the new all-depth icon regression guard.

- [ ] **Step 5: Run type-check and the production build**

Run:

```bash
npm run type-check
npm run build
```

Expected: both commands exit with code `0`; the Vue template type-checks and Vite produces the production bundle.

- [ ] **Step 6: Review the final diff and commit the implementation**

Run:

```bash
git diff -- src/components/organisms/Sidebar.vue src/components/organisms/sidebarUsage.test.ts
git status --short
```

Confirm only the sidebar component and its focused test are part of the implementation commit; leave the pre-existing `useOpnameCreate.test.ts` modification untouched. Then run:

```bash
git add src/components/organisms/Sidebar.vue src/components/organisms/sidebarUsage.test.ts
git commit -m "feat: show icons for all sidebar menus"
```
