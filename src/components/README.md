# Warehouse Design System

This directory owns shared UI primitives for the Warehouse frontend. Feature pages should compose these components instead of redefining common buttons, badges, cards, table controls, empty states, and form layout patterns.

## Component Ownership

- `atoms/`: lowest-level primitives such as `Button`, `Input`, `Select`, `Badge`, `Icon`, and `IconButton`.
- `molecules/`: small reusable UI structures such as `Card`, `PageHeader`, `Breadcrumb`, `FormField`, and the canonical illustrated `EmptyState`.
- `organisms/`: feature-agnostic composed widgets such as `DataTable`, dialogs, drawers, toast, sidebar, and topbar.
- `templates/`: route shell layouts.
- `ui/`: compatibility and feature-focused facades that compose the foundation components. New shared primitives should start in `atoms`, `molecules`, or `organisms`; add `ui/*` wrappers only when they simplify a repeated feature pattern.

## Styling Rules

- Shared components must prefer semantic Tailwind tokens from `tailwind.config.ts`: `surface`, `surface-secondary`, `border`, `text`, `text-secondary`, `text-muted`, `primary`, `success`, `warning`, `danger`, and `info`.
- Avoid raw neutral/status families such as `gray`, `slate`, `red`, `rose`, `emerald`, or `blue` inside shared components unless the semantic palette does not express the UI role.
- Use `Badge` for status labels. If a new business status needs a new visual category, add a tone to `Badge` instead of hard-coding classes in a page.
- Keep cards shallow. Do not place page sections inside nested `Card` components when a full-width section or `DataTable bare` mode is enough.

## Testing

- Add focused Vitest coverage for shared component behavior that affects many pages.
- Keep Storybook stories for visual documentation, but use unit tests for reusable class contracts such as status tones, disabled states, loading states, and table overflow behavior.
