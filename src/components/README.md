# Warehouse Design System

This directory owns shared UI primitives for the Warehouse frontend. Feature pages should compose these components instead of redefining common buttons, badges, cards, table controls, empty states, and form layout patterns.

## Component Ownership

- `atoms/`: lowest-level primitives such as `Button`, `Input`, `Select`, `Badge`, `Icon`, and `IconButton`. Atoms may wrap native HTML controls and own base accessibility attributes.
- `molecules/`: small reusable UI structures such as `Card`, `PageHeader`, `Breadcrumb`, `FormField`, `FilterPopover`, `PanelHeader`, `StatusPanel`, and the canonical illustrated `EmptyState`.
- `organisms/`: feature-agnostic composed widgets such as `DataTable`, dialogs, drawers, toast, sidebar, and topbar. Organisms may coordinate multiple atoms/molecules, but must remain domain-agnostic.
- `templates/`: route shell layouts only. Templates own app chrome and slots, not feature-specific data fetching.
- `ui/`: focused facades for repeated feedback, form, and table patterns that sit on top of the atomic layers. New shared primitives should start in `atoms`, `molecules`, or `organisms`; add `ui/*` wrappers only when they simplify a repeated feature pattern such as skeletons, alerts, row actions, or form sections.

The default composition path is `atom -> molecule -> organism -> template -> view`. A higher layer may import lower layers, but lower layers must not import higher layers or feature views.

## Source-Of-Truth Rules

- API DTOs and backend route maps live in `src/api/feature/dto/*`. API and service modules must not import types or config from `src/views/*`.
- Feature pages own route composition and user workflows. Shared components must stay feature-agnostic and receive data through props/slots/events.
- Repeated visual behavior belongs in this design-system layer. For example, filter popovers use `molecules/FilterPopover.vue` instead of each page owning outside-click listeners and panel styling.
- `views/report/reportConfig.ts` may define report UI metadata such as titles, descriptions, columns, and icons, but report keys, request params, row shapes, and backend paths belong to report DTOs.
- Keep dependency direction one-way: `view -> composable -> service -> api -> dto`. Shared components may depend on atoms/molecules below them, but not on feature services or feature views.
- Use `src/domain/*` for stable cross-layer domain config that must be shared by API, service, router, or views. Do not import from `src/views/*` into `src/api/*` or `src/services/*`.

## Responsibility Rules

- A component should either render UI, coordinate a reusable interaction, or represent a route shell. If it also fetches domain data or normalizes backend payloads, split that logic into a composable/service.
- A composable may coordinate page state and services, but should not render UI classes or own reusable component behavior.
- A service should normalize API data and expose domain operations. It should not import route components, UI config, or view-only helpers.

## Styling Rules

- Shared components must prefer semantic Tailwind tokens from `tailwind.config.ts`: `surface`, `surface-secondary`, `border`, `text`, `text-secondary`, `text-muted`, `primary`, `success`, `warning`, `danger`, and `info`.
- Avoid raw neutral/status families such as `gray`, `slate`, `red`, `rose`, `emerald`, or `blue` inside shared components unless the semantic palette does not express the UI role.
- Use `Badge` for status labels. If a new business status needs a new visual category, add a tone to `Badge` instead of hard-coding classes in a page.
- Keep cards shallow. Do not place page sections inside nested `Card` components when a full-width section or `DataTable bare` mode is enough.
- Loading placeholders should use `ui/feedback/SkeletonBlock.vue` or a dedicated skeleton primitive, not repeated `animate-pulse` markup in feature pages.
- Native form controls should be wrapped by the design-system primitives unless the file itself is a primitive/internal control component.

## Testing

- Add focused Vitest coverage for shared component behavior that affects many pages.
- Keep Storybook stories for visual documentation, but use unit tests for reusable class contracts such as status tones, disabled states, loading states, and table overflow behavior.
- Tooling and architecture guard tests belong under `src/config` or near the component/domain they protect, so `npm run test:unit` can catch standards regressions without invoking Selenium suites.
