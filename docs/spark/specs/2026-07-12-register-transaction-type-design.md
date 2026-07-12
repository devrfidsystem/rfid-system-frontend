# Register as a Transaction Document Type — Design

> Backend repo: `/Users/syillaeltaniadaffa/Documents/Warehouse-be`
> Frontend repo: `/Users/syillaeltaniadaffa/Documents/Warehouse`

## Context

"Register" (tag registration) currently lives as a bespoke RFID/EPC feature: a list page (`TagRegistrationPage.vue`) backed by an aggregated SQL query with no per-row identity, plus an unused create-form composable (`useTagRegistration.ts`). Earlier in this session it was relocated in the sidebar to live under the "Transactions" menu group (DB menu code `TRANSACTION_REGISTER_TAGS`, path `/rfid/tags`), but its UI and backend never matched the Transaction module's actual behavior (search, filter, export, per-record detail).

The user clarified the real intent: **Register should behave exactly like the other Transaction document types** (Inbound, Outbound, Relocation, Transfer, Return, Opname) — same List/Create/Detail pages, same status workflow, same backend shape — just with a smaller header-only field set and no line items. "Register → Inbound" describes business-process ordering in the sidebar only; there is no technical link between the two document types.

## Requirements

1. Register becomes a new Transaction document type (`transactionKey: "register"`), reusing `TransactionListPage.vue`, `TransactionCreatePage.vue`, `TransactionDetailPage.vue`, and the generic per-type module pattern already used by Inbound/Outbound/Relocation/Transfer/Return/Opname.
2. Register's document has exactly 4 fields, no line items:
   - **Document Number** (`docNumber`, required, unique per company)
   - **Date Issue** (`docDate`, required)
   - **User** (`registeredById`, required) — a dropdown of staff who performed the physical registration, distinct from `createdById` (the account that created the document record, tracked automatically like every other document type)
   - **Notes / Description** (`notes`, optional)
3. Register has the same status workflow as other types: `draft → posted`, cancellable while `draft`. Posting a Register document is a pure status transition — it has no stock/inventory side effect (no lines exist to move).
4. Register appears in the Transaction sidebar submenu **first**, before Inbound, reflecting that tag registration precedes goods receipt in the warehouse process. No data relationship exists between a Register document and any Inbound document.
5. The old RFID-specific Register UI is retired: `TagRegistrationPage.vue`, `TagRegistrationCreatePage.vue`, `useTagRegistration.ts`, and routes `/rfid/tags` and `/rfid/tags/new` are deleted.
6. The underlying RFID/EPC tag-scanning capability (`rfid.service.ts`, `POST /rfid/tags`, `GET /rfid/registration-activities`, etc.) is **not used by any frontend page after this change**, but is left in place on the backend (not deleted) since it isn't part of this feature's scope to remove.

## Architecture

### Backend (`Warehouse-be`)

Follows the existing per-type module pattern (mirrors `OpnameDoc`/`opname` module, the only other header-only-at-creation type):

- **Prisma model** `RegisterDoc` (new, header-only — no `RegisterLine` table):
  ```prisma
  model RegisterDoc {
    id             String    @id @default(uuid()) @db.Uuid
    companyId      String    @map("company_id") @db.Uuid
    docNumber      String    @map("doc_number") @db.VarChar
    docDate        DateTime  @map("doc_date") @db.Date
    registeredById String    @map("registered_by_id") @db.Uuid
    notes          String?   @db.VarChar
    status         String    @default("draft") @db.VarChar
    createdById    String    @map("created_by") @db.Uuid
    createdAt      DateTime? @default(now()) @map("created_at") @db.Timestamptz(6)
    updatedAt      DateTime? @updatedAt @map("updated_at") @db.Timestamptz(6)

    company      Company @relation(fields: [companyId], references: [id])
    registeredBy User    @relation("RegisterDocRegisteredBy", fields: [registeredById], references: [id])
    createdBy    User    @relation("RegisterDocCreatedBy", fields: [createdById], references: [id])

    @@unique([companyId, docNumber], map: "register_docs_company_id_doc_number_idx")
    @@map("register_docs")
  }
  ```
  A new Prisma migration adds this table. `User` gets two new back-relations (named, since there are two FKs to the same table — matching how other doc types with dual user/partner FKs are already modeled).

- **Module** `src/modules/warehouse/register/` (new): `register.controller.ts`, `register.service.ts`, `register.module.ts`, `dto/register-doc.dto.ts`, registered in the parent warehouse module alongside `opname`, `inbound`, etc.
  - `@Controller('register')`
  - `POST /register` — `CreateRegisterDocDto { companyId, docNumber, docDate, registeredById, notes? }`. Validates company exists and `docNumber` is unique within the company (same pattern as `OpnameMutationService.create()`), then `prisma.registerDoc.create(...)` with `status: "draft"` and `createdById` from the authenticated user.
  - `GET /register` — paginated list, filters: `search` (docNumber), `dateFrom`/`dateTo`, `registeredById`. Mirrors `OpnameService.list()`.
  - `GET /register/:id` — single record with `registeredBy`/`createdBy` relations included.
  - `PATCH /register/:id` — edit while `draft`.
  - `POST /register/:id/post` — sets `status: "posted"`. No stock-balance mutation (unlike Inbound/Outbound's post, which writes stock movements) — this is the one behavioral difference from other posted types, and is called out explicitly so an implementer doesn't copy Inbound's post logic wholesale.
  - `POST /register/:id/cancel` — sets `status: "cancelled"`, only while `draft`.

- **Users list for the "User" dropdown**: reuse the existing `GET /users` endpoint backing `src/services/users.service.ts`'s `usersService.list(...)` (already used by the IAM Users page) — no new backend endpoint needed for this lookup.

### Frontend (`Warehouse`)

- `src/services/transactions.service.ts`: add `"register"` to the `TransactionKey` union and `transactionKeys` array (positioned first, so it sorts first wherever the list is iterated for menu/route generation), add `transactionPaths.register = "/register"`.
- `src/router/index.ts`: `transactionPattern` (built from `transactionKeys.join("|")`) picks up `register` automatically — no separate route entries needed, since Register reuses the existing `transactions/:transactionKey(...)`, `.../new`, `.../:id` routes.
- `src/views/transactions/composables/useTransactionCreate.ts` and `useTransactionDetail.ts`: add an `isRegister = computed(() => transactionKey.value === "register")` flag (mirrors `isOpname`). When true: skip warehouse/partner/line-item fields entirely, require `docNumber`/`docDate`/`registeredById`, load the "User" dropdown options from the existing user-list source used elsewhere in the app.
- `TransactionCreatePage.vue`: add a branch (`v-if="isRegister"`) rendering exactly the 4 fields (Document Number, Date Issue, User select, Notes) inside the existing "Document Details" Card, with the same submit button footer as the Opname branch (Cancel / Create, no Line Items panel).
- `TransactionDetailPage.vue`: for `isRegister`, render Document Info only (no Line Items table), Post/Cancel buttons conditional on `status === "draft"` exactly as for other types.
- Delete: `src/views/tag-registration/pages/TagRegistrationPage.vue`, `src/views/tag-registration/pages/TagRegistrationCreatePage.vue`, `src/views/tag-registration/composables/useTagRegistration.ts`, and the `rfid/tags` / `rfid/tags/new` route entries in `src/router/index.ts`.
- Sidebar/menu: the DB menu row for `TRANSACTION_REGISTER_TAGS` (name "Register") gets its `path` updated to `/transactions/register` and `sort_order` set below every other `TRANSACTIONS` child so it renders first. This is a DB update (same mechanism used earlier this session to relocate the RFID menu), not a frontend code change.

### Explicitly out of scope

- No changes to `rfid.service.ts`, `rfid.api.ts`, the `/rfid/tags` or `/rfid/registration-activities` backend endpoints, or the underlying `EpcTag`/`EpcEvent` Prisma models — they stay as-is, simply unused by any page after this change.
- No Export-to-XLS for Register in this pass (not requested for this feature; can be added later the same way any other type's export was added, if needed).
- No data link between a Register document and an Inbound document.

## Testing

- Backend: unit/integration tests for `RegisterService.create/list/getDetail/post/cancel`, mirroring the existing `opname` module's test shape (docNumber uniqueness, status transitions, 404 on unknown id).
- Frontend: manual verification via the `run` skill once implemented — create a Register document, confirm it lists under Transaction > Register, confirm Post/Cancel work, confirm Inbound/Outbound pages are unaffected (regression check on `isOpname`/`isRegister` branching not breaking existing types).
