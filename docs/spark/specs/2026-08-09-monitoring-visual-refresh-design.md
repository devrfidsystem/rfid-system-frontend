# Monitoring Visual Refresh Design

- Last Updated: 2026-08-09
- Scope: `src/views/dashboard/MonitoringPage.vue` and monitoring widgets

## Goal

Make the existing monitoring page read more like an operational command center without changing API contracts or polling behavior.

## Design

1. Keep the top monitoring domain cards, but make each card more scannable with a health-accent border, consistent height, stronger exception emphasis, and a capped queue preview.
2. Move the lower monitoring content into a desktop two-column command layout: live transactions get the larger left column; exception feed gets a compact right column.
3. Make live transaction rows easier to scan by using a small status dot, subtle exception row background, and SLA colors that communicate threshold state.
4. Make exception empty state compact so it does not waste operational dashboard space.

## Constraints

- No backend/API changes.
- Preserve loading, empty, and error states.
- Preserve mobile stacking.
- Keep current component ownership boundaries.

## Testing

Use existing SSR component tests. Add assertions for layout classes and key visual state classes rather than browser pixel assertions.
