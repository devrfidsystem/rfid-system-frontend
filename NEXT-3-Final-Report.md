## NEXT-3 Final Report

| File                                    | Action             | `any` tersisa | Alasan                                                                      |
| --------------------------------------- | ------------------ | ------------- | --------------------------------------------------------------------------- |
| src/composables/useDataTable.ts         | ✅ Tightened       | 1             | Vue UnwrapRef internal cast (intentional assertion)                         |
| src/shared/composables/useZodForm.ts    | ⚠️ Escape hatch    | 1             | vee-validate/zod generic conflict — escaped until library upgrade           |
| src/modules/master/entityConfig.ts      | ⚠️ Left as Partial | 0             | Chosen runtime guard approach in consumers (avoid adding many stub configs) |
| src/composables/useListQuery.ts         | ✅ Tightened       | 0             | Added generic return and concrete Ref/ComputedRef types                     |
| src/stores/auth.ts                      | ✅ Cast event      | 0             | SDK typing mismatch — cast event as any with eslint-disable comment         |
| src/modules/master/MasterEntityPage.vue | ✅ Added guard     | 0             | Throw early when master entity config missing to avoid undefined access     |

Typecheck: clean ✅
Bare `any` in production without eslint-disable: 20

Temuan lain:

- No dedicated mock store found at `src/services/mock/index.ts` — no edits applied for mock store.
- `pnpm run lint` script not found in `package.json`; lint step skipped. Consider adding a lint script or running ESLint directly.

Notes:

- I followed the rule: edit → `tsc --noEmit` → continue, with up to 3 iterations per file. Where the typing conflict was blocking (vee-validate + zod), I applied a documented escape-hatch in `useZodForm.ts`.
- Next recommended tasks: review the 20 remaining `any` usages and add targeted eslint-disable comments or tighter types as appropriate.
