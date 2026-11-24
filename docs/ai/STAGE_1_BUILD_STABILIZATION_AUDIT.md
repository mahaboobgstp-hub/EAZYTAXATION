# Stage 1 — Build Stabilization + Intelligence Foundation Audit

Date: 2026-11-24
Branch: `hybrid-accounting-integration`
Scope: Audit and stabilization only. No Android branch edits, no production merge, and no production deployment.

## Build stabilization findings

- A historical Vercel preview deployment at commit `1b67f590b7f0413e2342c824f980efb7724a296a` failed during `npm run build`.
- The reported syntax failure was in `src/pages/banking/BankingWorkspace.jsx` at line 167, column 1811: esbuild reported `Syntax error "n"`.
- Inspection of that deployed commit shows the long one-line `rememberTransactionRule` function contains an escaped newline sequence outside the code statement (`\\n  const toggleSelected...`), which explains the parse failure.
- The current `hybrid-accounting-integration` branch is 117 commits ahead of that failed deployment commit. The current version of `BankingWorkspace.jsx` is split across normal source lines and does not contain the same malformed sequence at the cited location.
- A build-only GitHub Actions workflow already exists at `.github/workflows/web-build-validation.yml`. It runs Node 22, installs dependencies, and executes `npm run build` on pushes to `hybrid-accounting-integration`, pull requests targeting `main`, and manual dispatch.
- The connector did not expose a successful current-branch build run, and this session did not run a local build. Therefore build status is **not yet verified**. No deployment was triggered to avoid creating a preview deployment without separate authorization.

## Shared SYD Intelligence foundation — verified inventory

The following files were fetched from both `android-sales-development` and `hybrid-accounting-integration`. Their blob SHA values match exactly, confirming these shared files are identical across both branches at the inspected refs.

| File | Purpose |
|---|---|
| `src/ai/registry/index.js` | Exports the shared registry contracts |
| `src/ai/registry/screenRegistry.js` | Verified screen definitions, routes, platform support, permissions and company requirements |
| `src/ai/registry/fieldRegistry.js` | Stable field IDs, types, required flags, validation and deterministic field checks |
| `src/ai/registry/commandRegistry.js` | Intent/command types and text normalization |
| `src/ai/registry/companyContext.js` | Allowlisted non-sensitive company context (billing-only vs billing-and-accounting, GST and FY settings) |
| `src/ai/registry/executionPolicy.js` | Phase 1 policy: interpretation allowed; navigation, form mutation, writes and posting disabled |
| `src/ai/registry/toolRegistry.js` | Planned tools for navigation, context, master lookup, form preparation, validation and save; disabled |
| `src/services/ai/sydIntelligenceService.js` | Shared web/Android/iOS client service calling the Edge Function |
| `supabase/functions/syd-ai-intelligence/index.ts` | Authenticated Edge Function; validates session and returns schema-constrained AI plan |

The shared service accepts command text, company context, current screen ID, platform, and optional minimal conversation context. The response is a proposal and is not executed.

## Confirmed Phase 1 safety boundaries

- AI output is not authorization.
- The OpenAI key remains server-side in Supabase secrets.
- Company context is an informational allowlist and excludes sensitive identifiers and transaction data.
- Unknown screens/fields are intended to be rejected or clarified.
- No navigation, form mutation, database writes or accounting posting are permitted in this phase.
- User review and server-side permission checks remain required before future execution features.

## Gaps / Stage 2 prerequisites

1. Registry files are present, but this audit did not find verified screen/field registrations or a confirmed desktop AI UI call site using `interpretSYDCommand`. The registry can therefore be empty until branch-specific registrations are added.
2. Add verified web screen registrations and field definitions in Stage 2/3, without inventing IDs or database mappings.
3. Connect the desktop/web AI UI to the shared service; do not fork a second AI service for desktop.
4. Test the Edge Function's authentication, schema, unknown-ID, billing-only and non-execution cases.
5. Verify the current branch build through CI or an authorized preview build before declaring build green.

## Stage 1 status

- **Audit:** Completed.
- **Historical build failure cause:** Identified.
- **Current source remediation:** Present in the current branch relative to the failed deployment commit; exact branch diff confirms `BankingWorkspace.jsx` and a build-validation workflow were added/updated after that commit.
- **Current build:** Pending verification; not claimed as passed.
- **Android branch:** Read-only inspection only; no edits made.
- **Production/main:** Untouched; no merge or deployment.



## Stage 2 — Shared Intelligence Core + Web Integration Foundation (2026-11-24)

### Changes committed on the hybrid branch
- Added `src/ai/registry/webScreenKnowledge.js`: web screen knowledge catalogue using route names verified against `src/App.jsx`. It registers 28 web screen definitions with stable IDs and platform support.
- Exported the web knowledge catalogue through `src/ai/registry/index.js`.
- Added `src/pages/ai/SYDIntelligenceWorkspace.jsx`: desktop/web AI prompt workspace using the existing shared `interpretSYDCommand` service, company context, current-route context, structured proposal display, error/loading states and explicit no-execution messaging.
- Added `src/css/ai/SYDIntelligenceWorkspace.css` responsive styling.
- Registered the route `/app/syd-intelligence` in `src/App.jsx`.
- Added SYD Intelligence navigation link in `src/components/Sidebar.jsx`.

### Registry accuracy safeguards
- Screen routes are sourced from the current route table; definitions are descriptive, not permissions.
- Field IDs and field definitions were deliberately **not invented**. The current shared service can transmit field definitions, but screen-specific form fields require a separate audit of the actual forms before registration.
- No navigation, form mutation, save, or posting behavior was enabled.
- Android branch was not edited.

### Stage 2 verification
- GitHub file writes were confirmed on `hybrid-accounting-integration` for each created/updated file.
- A Vercel deployment was observed as `READY` for the earlier registry commit `e912d6791f5f33ffb8050122faa851c51e222fb9`; this deployment does **not** contain all later Stage 2 UI/route/sidebar commits, so it is not treated as Stage 2 build verification.
- The connector does not expose a workflow-dispatch action, and no local checkout/build environment was available in this work. Full current-branch build verification remains pending.
- No production deployment or merge to `main` was performed.

### Stage 2 status
- Shared registry extension: **completed**
- Desktop AI workspace connected to shared service: **code completed**
- Web route and sidebar entry: **completed**
- Verified screen field definitions: **deferred intentionally until form audits**
- Current-branch build verification: **pending**


## Stage 3 — Verified Screens & Field Intelligence (2026-11-24)

### Screens audited against source
- Sales Invoice: `src/pages/sales/SalesInvoice.jsx` — verified invoice date/number, Customer Master lookup, Cash/Credit sale type, billing/shipping address controls, same-as-billing behavior, place of supply/state behavior, vehicle and e-way bill, item suggestion/master lookup and custom item text, HSN/SAC, quantity, unit, rate, GST rate, cess rate, tax-inclusive switch, invoice discount type/value, other charges, round off, remarks, save-time item-name validation and invoice header values.
- Purchase Invoice: `src/pages/PurchaseInvoice/PurchaseInvoice.jsx` — verified voucher date/number, supplier bill number/date, GST treatment options, supplier lookup, supplier GSTIN/state/place of supply, billing/shipping addresses, vehicle/e-way bill, remarks, purchase lines with item master/custom item, HSN/SAC, quantity/UOM/rate/discount/GST, tax summary and save-time supplier/bill-number/line validation.
- Expense Entry: `src/pages/expenses/ExpenseEntry.jsx` — verified expense voucher/date, payment method options, supplier/payee selection and text, category lookup, reference, GST treatment options, bill details, payment account/paid-by/due date, remarks, header discount/other charges/round-off, payment status, attachment upload, expense lines and save-time category/payee/line validation.

### Code changes
- Added `src/ai/registry/webFieldKnowledge.js` with screen-scoped field definitions for the three audited forms. The definitions use existing state/form keys and include descriptions, types, verified select options, required markers and simple numeric constraints.
- `webScreenKnowledge.js` now registers the screen catalogue and audited field catalogue together on initialization.
- `sydIntelligenceService.js` now attaches each registered screen's own field catalogue to the screen metadata sent to the Edge Function. This makes field context available even when the user asks from the SYD Intelligence workspace rather than being on the target transaction screen.
- `syd-ai-intelligence/index.ts` prompt and response filtering now use the selected screen's attached field catalogue, preventing cross-screen field IDs from being accepted as proposals.

### Safety and scope
- This remains proposal-only. No auto-fill, navigation, save, posting, transaction retrieval or field mutation is enabled.
- Field mappings are descriptive and sourced from audited form/state names. No database schema mappings were added or assumed.
- No Android branch edits, main merge, production deployment or database migrations.

### Stage 3 status
- Form-source audits: **completed for Sales Invoice, Purchase Invoice and Expense Entry**
- Field catalogue registration: **code implemented**
- Screen-scoped AI field context: **code implemented**
- AI proposal field filtering: **code implemented**
- Build/test verification: **pending**


### Stage 3 static checks (performed)
- Re-fetched the committed field catalogue and checked every audited field ID against the registry's lowercase snake-case identifier rule: **passed** (79 IDs across the three screens; no invalid IDs or duplicate IDs within a screen).
- Checked every field type against the field registry's allowed types: **passed**.
- Confirmed the web service attaches per-screen field definitions and the Edge Function filters proposals against the selected screen's field IDs: **passed by source inspection**.
- The Edge Function screen-metadata size guard was raised from 16 KB to 26 KB to accommodate the screen catalogue plus the newly attached audited fields while retaining a bounded payload.
- These are source/static checks only. No full Vite build, CI run, or live Edge Function request was executed; runtime verification is still pending.

- Follow-up source correction: normalized all field IDs to the registry-safe snake_case format (e.g., state keys `saleType`, `taxInclusive`, `discountType`, `discountValue`, `otherAmount`, and `roundOff` are represented by AI field IDs `sale_type`, `tax_inclusive`, `discount_type`, `discount_value`, `other_amount`, and `round_off`; their descriptions retain the source-state references). Fixed the field-catalogue clone syntax after source inspection.


## Stage 4 — Operational Intelligence (2026-11-24)

### Verified operational catalogue
- Added `src/ai/registry/operationalKnowledge.js` describing dependencies for Customer Master, Supplier/Vendor Master, Items Master, Expense Category Master, Company Settings, Cash/Bank Accounts, and Chart of Accounts/Ledger Mapping.
- Registered three reviewed workflow guides: Sales Invoice, Purchase Invoice and Expense Entry. Each has an ordered preparation sequence, master dependency IDs and explicit confirmation checkpoint.
- All master lookup flags are set to false. The catalogue explicitly discloses that master availability is not live-checked and does not invent existing records.

### AI request and response integration
- The shared service includes operational knowledge in the request payload.
- The Edge Function instructions require it to use the catalogue for workflow mapping, dependency explanation and ordered preparation steps.
- Structured response schema now includes a workflow object with workflow ID, ordered steps, master dependencies and confirmation checkpoint.
- Post-model validation deterministically resolves the workflow against the catalogue and the selected screen. The Edge Function derives steps and master dependencies from catalogue values (not model-generated values); unknown workflow IDs or screen mismatches are nulled. Master IDs are allowlisted.
- Web Intelligence workspace now displays the workflow sequence, master prerequisites (explicitly labelled **not live-checked**) and confirmation checkpoint. It remains proposal-only.

### Safety boundaries
- No master database query, transaction query, auto-create master, navigation, form mutation, save, accounting post, or payment was implemented.
- Confirmation is displayed as a checkpoint only; it does not trigger or authorize execution.
- A future execution phase must add live company-scoped master lookup, deterministic validation, permission checks, a draft/review surface and server-side confirmation tokens before any write.

### Stage 4 status
- Operational dependency catalogue: implemented.
- Workflow proposal schema and deterministic workflow/dependency derivation: implemented.
- UI workflow/dependency/checkpoint panel: implemented.
- Static source inspection: completed; runtime verification pending.


## Stage 3 build verification results

- GitHub Actions run **#123** (Web Build Validation), commit `dde118f88e1f69eda3c6a2ad413847614cc5d411`: **completed successfully**.
- Verified steps: Checkout repository ✓; Set up Node.js 22 ✓; Install dependencies ✓; Production build (`npm run build`) ✓.
- This build included the Stage 3 frontend field catalogue, registry initialization, shared service changes, and the Stage 4 web review panel/styles present at that commit.
- This proves the Vite production build for the checked commit passed. It does not verify Supabase Edge Function runtime/deployment or later Edge Function-only schema hardening commits. Vercel deployment statuses on the latest commit report build-rate-limit failures; these are deployment platform quota/status failures and not a successful preview.

## Stage 4 follow-up hardening

- Updated the strict structured-output schema to require the workflow object as well as its required members. This latest Edge Function-only schema correction was committed after the successful frontend build and is not included in that CI run.
- Operational workflow steps and master dependency IDs are derived from the deterministic catalogue after model response, and only accepted when workflow ID matches the selected registered screen. This prevents the model from fabricating steps or cross-screen master dependencies.
- **Latest Edge Function code remains un-deployed and runtime-unverified** in this session. A live authenticated request is required for runtime verification.


## Stage 5 — Live Master Intelligence + Draft Workflow Review (2026-11-24)

### Implementation committed on `hybrid-accounting-integration`
- Added `src/services/ai/sydMasterLookupService.js`: company-scoped, read-only searches for Customers, Vendors, Items and Expense Categories. Customer/vendor/item queries are constrained to `company_id`; expense categories include the selected company and global (`company_id IS NULL`) categories, matching the existing expense master service pattern.
- Master searches use name partial matching, result limit (8), and return candidate records only. The service rejects unsupported master types and requires a company context. It performs no inserts, updates or deletes.
- Updated `src/pages/ai/SYDIntelligenceWorkspace.jsx`: added live lookup action after an AI proposal, candidate matching, user-selected candidate state, and an in-memory draft review panel showing proposed fields, selected company, intent, screen, and chosen master candidates.
- Updated `src/css/ai/SYDIntelligenceWorkspace.css` with responsive lookup and review styles.
- Updated the operational catalogue to indicate live read-only lookup for the supported master types.
- No cash/bank account or ledger lookup was enabled because table/column schemas were not sufficiently verified in this Stage 5 audit.

### Stage 5 safety and limits
- Live lookup is read-only and only returns candidate masters; it does not automatically pick a record or populate a form.
- Candidate selection is held only in component memory. No transaction draft is persisted, no form mutation, navigation, save, posting or payment action is available.
- Searchable master types: Customers, Vendors, Items, Expense Categories.
- Unavailable/unverified master types: Cash/Bank Accounts and Chart of Accounts/Ledger Mapping.
- No production company data was changed by these code changes.

### Stage 5 validation status
- Code changes have been committed to the hybrid branch via GitHub contents commits.
- CI/build verification is pending for the latest Stage 5 commits. No local checkout or runtime environment was available to run the Vite build or authenticated company-scoped Supabase lookup tests.
- Edge Function runtime and database RLS behavior for the new lookup client still require an authenticated test against a test company.
- Draft PR #9 remains unmerged; no production merge/deployment was performed.
- Android branch remains untouched.
