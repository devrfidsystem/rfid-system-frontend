# Fix Broken IAM Sidebar Links + Build Role Menus Page

> **For agentic workers:** REQUIRED SUB-SKILL: Use spark:executing-plans to implement this plan task-by-task.

**Bug:** the "Access Control" (IAM) sidebar group has 6 `Menu` DB rows; only "Roles" (`/iam/roles`) matches a real frontend route. The other 5 point to nonexistent routes, so the Vue Router catch-all (`/:pathMatch(.*)*`) silently redirects them to `/dashboard/overview` — from the user's perspective, clicking them "does nothing" / bounces away.

| Menu code             | Current path            | Real page                                                                          | Fix                                                          |
| --------------------- | ----------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `IAM_ROLES`           | `/iam/roles`            | `RolesPage.vue`                                                                    | none needed                                                  |
| `IAM_MENUS`           | `/iam/menus`            | none — real one is `/settings/menus`                                               | repoint path                                                 |
| `IAM_USER_ROLES`      | `/iam/users/roles`      | none — lives in `UserAccessPage.vue` at `/iam/users`                               | repoint path                                                 |
| `IAM_USER_COMPANIES`  | `/iam/users/companies`  | same as above                                                                      | repoint path                                                 |
| `IAM_USER_WAREHOUSES` | `/iam/users/warehouses` | same as above                                                                      | repoint path                                                 |
| `IAM_ROLE_MENUS`      | `/iam/roles/menus`      | **none at all** — only unused `assignMenuToRole`/`removeMenuFromRole` API plumbing | build the page (user's explicit choice over hiding the link) |

**Root cause:** `prisma/seed.ts` created these Menu rows with a more granular structure than what was ever built on the frontend — the frontend consolidated user-role/company/warehouse assignment into one page (`UserAccessPage.vue`) and reused the existing Settings menu CRUD page, but the seed data was never updated to match, and "Role Menus" was never built at all.

**Fix scope:**

1. Repoint the 4 dead-but-has-a-real-destination paths (data fix: seed.ts + direct UPDATE on the live DB Menu rows).
2. Build the missing Role Menus permission-editor page (new feature, backend read endpoint + frontend page), reusing existing `assignMenuToRole`/`removeMenuFromRole`/menu-tree endpoints — no new mutation endpoints needed.

---

### Task 1 — Data fix: repoint the 4 dead Menu paths

**Files:**

- Modify: `prisma/seed.ts` (source of truth for fresh environments)
- One-off: direct Prisma `update` against the live DB for the 4 existing rows (not a migration — this is data, not schema)

- [x] `prisma/seed.ts`: change `IAM_MENUS` path to `/settings/menus`; change `IAM_USER_ROLES`, `IAM_USER_COMPANIES`, `IAM_USER_WAREHOUSES` paths to `/iam/users`.
- [x] Run a one-off script against the live DB updating those same 4 rows by id (ids already captured this session) to match.

**Verification:** re-query `menu.findMany` for the IAM group and confirm every path now resolves to a route that exists in `router/index.ts`.

---

### Task 2 — Backend: expose a role's current menu grants

**Files:**

- Modify: `src/modules/iam/iam.service.ts` (add `getRoleMenus`)
- Modify: `src/modules/iam/iam.controller.ts` (add `GET /iam/roles/:roleId/menus`)

- [x] `IamService.getRoleMenus(roleId: string)` — `this.prisma.roleMenu.findMany({ where: { roleId } })`, returns raw rows (`menuId`, `canView`, `canCreate`, `canUpdate`, `canDelete`).
- [x] Controller endpoint, protected, `@ApiParam roleId`. Reuses existing `assignMenuToRole`/`removeMenuFromRole` for mutations — no new write endpoints.

**Verification:** `npx tsc --noEmit -p .`; extend `iam.service.spec.ts` with a case for `getRoleMenus`.

---

### Task 3 — Frontend: API + service layer

**Files:**

- Modify: `src/api/feature/iam.api.ts` (add `getRoleMenus`)
- Modify: `src/services/iam.service.ts` (add wrapper)

- [x] `iamApi.getRoleMenus(roleId)` → `GET /iam/roles/:roleId/menus`.
- [x] `iamService.getRoleMenus` thin wrapper.

**Verification:** `npx vue-tsc --noEmit`

---

### Task 4 — Frontend: RoleMenusPage + composable

**Files:**

- Add: `src/views/iam/RoleMenusPage.vue`
- Add: `src/views/iam/composables/useRoleMenus.ts`

- [x] Composable: role selector (reuse `iamService.getRoles()`, same pattern as `useUserAccess.ts`), app selector defaulting to the first app (reuse `settingsService.fetchList("apps")` + `settingsService.getAppMenuTree(appId)`, same pattern as `useMenus.ts`), and a `Map<menuId, RoleMenuGrant>` loaded via `iamService.getRoleMenus(roleId)` whenever the selected role changes.
- [x] Per-menu-node "Access" checkbox: checked → `iamService.assignMenuToRole(roleId, menuId)` (grants view, leaves create/update/delete false); unchecked → `iamService.removeMenuFromRole(roleId, menuId)` (fully revokes — matches the DTO's existing all-or-nothing `canView` semantics, there is no separate view-only toggle in the backend).
- [x] Per-menu-node Create/Update/Delete checkboxes, enabled only when Access is granted, each calling `assignMenuToRole` with the full updated flag set (the endpoint upserts `canCreate`/`canUpdate`/`canDelete` together, so send all three current values every time, not just the one that changed).
- [x] Page: recursive tree rendering (menus have parent/child nesting), reusing existing `Select`/`Card`/`CheckboxField` atoms — no new base components needed.

**Verification:** `npx vue-tsc --noEmit`; manual browser check via the `run` skill.

---

### Task 5 — Frontend: route + tab wiring

**Files:**

- Modify: `src/router/index.ts` (add `roles/menus` child under `iam`)
- Modify: `src/components/templates/IamLayout.vue` (add third tab; fix tab-active-highlight prefix collision)

- [x] Add `{ path: "roles/menus", component: () => import("@/views/iam/RoleMenusPage.vue") }` under the `iam` route's `children`.
- [x] Add a third tab `{ name: "Role Menus", href: "/iam/roles/menus" }`.
- [x] Fix the tab active-check: `$route.path.startsWith(tab.href)` currently means `/iam/roles/menus` would match BOTH the "Roles" tab (`/iam/roles`) and the "Role Menus" tab (`/iam/roles/menus`) as prefixes, highlighting two tabs at once. Change to pick the single longest matching `href` among all tabs, not "any prefix match".

**Verification:** `npx vue-tsc --noEmit`; full `npx vitest run`; manual browser check — visit `/iam/roles/menus`, confirm only that tab highlights, confirm the "Roles" and "User Access" tabs still highlight correctly on their own routes.

---

### Task 6 — Verification pass

- [x] Backend: `npx tsc --noEmit -p .`, `npx jest src/modules/iam`.
- [x] Frontend: `npx vue-tsc --noEmit`, `npx vitest run`.
- [x] Manual: click through all 6 sidebar IAM entries, confirm every one lands on a real page (no bounce to `/dashboard/overview`). Exercise the Role Menus page end-to-end: grant a menu to a role, toggle a permission checkbox, revoke it, confirm each round-trips against the live backend.
