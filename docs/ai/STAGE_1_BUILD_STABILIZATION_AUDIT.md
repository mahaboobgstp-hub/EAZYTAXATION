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
