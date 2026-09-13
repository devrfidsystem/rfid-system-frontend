# Sidebar Menu Icons Design

## Goal

Make every visible sidebar menu item use an icon, including nested menu items, so the navigation remains visually consistent and easier to scan.

## Current context

- `src/components/organisms/Sidebar.vue` renders the mapped icon only for depth-0 items and renders a bullet for nested items.
- `src/components/organisms/sidebarNavigation.ts` already owns the menu-code-to-Lucide-icon mapping and provides a default icon.
- `src/components/organisms/Rail.vue` already renders `menu.icon` for flyout items.
- `AppLayout.vue` provides the rail sections and sidebar scopes.

## Design

`Sidebar.vue` will render `item.icon` for every flattened navigation item. The nested-item bullet will be removed. Existing menu indentation will remain, with a smaller icon size for nested items so hierarchy is still clear. Active, inactive, and hover icon colors will continue to follow the existing navigation state classes.

The icon source remains `buildSidebarNavItems()` and `getIcon()` in `sidebarNavigation.ts`; no backend payload or menu-tree contract changes are needed. Unmapped menu codes will continue to use the existing `DEFAULT` icon fallback. `Rail.vue` and its flyout behavior will remain unchanged because it already consumes the shared icon field.

## Accessibility and behavior

- Menu labels remain visible text and are not replaced by icons.
- Existing button semantics, navigation events, active route styling, and search behavior remain unchanged.
- Icons are decorative companions to the label and do not require separate accessible names.

## Testing

- Update the sidebar usage test to guard that nested items render their mapped icon instead of a bullet.
- Add or update navigation mapping coverage only if needed to prove the default icon fallback remains intact.
- Run `npm run type-check` and the relevant Vitest tests; run the production build as final verification.

## Scope

Included: shared sidebar rendering and focused tests.

Excluded: redesigning rail icons, changing menu labels, changing backend menu data, changing route access rules, or adding new icon-library dependencies.
