# SYD E-Way Bill — PeriOne Sandbox

## Scope (Sandbox Release 1)
Only the following actions are planned for end users:
- Generate an e-Way Bill from an already-saved sales invoice using the invoice's saved data.
- Cancel an e-Way Bill generated for that invoice.

Other provider/GST portal operations (multi-vehicle, multi-entry, transporter workflows, consolidated bills, validity extension, etc.) remain out of scope. Users will complete those uncommon activities on the official portal.

## Current implementation status
- Isolated feature branch: `feature/ewaybill-sandbox`
- Edge Function scaffold: `supabase/functions/ewaybill-sandbox/index.ts`
- Authenticated user check implemented.
- Company access check is performed through the user's Supabase JWT/RLS context.
- `sandbox_health` readiness action implemented.
- Generation and cancellation intentionally fail closed with `PERIONE_SANDBOX_ADAPTER_NOT_READY` until official API contract and credentials are available.
- No production base URL or live credentials are supported in this branch scaffold.

## Planned secrets
Set only after PeriOne confirms the sandbox credential format and API contract:
- `PERIONE_SANDBOX_BASE_URL`
- `PERIONE_SANDBOX_CREDENTIALS` (temporary generic placeholder for provider-specific secret bundle; do not deploy until the contract is confirmed)

Do not put secrets in frontend variables, source code, or logs.

## Frontend request contract (scaffold)
POST to the Supabase Edge Function with authenticated bearer token:
```json
{ "action": "sandbox_health", "company_id": "<active-company-uuid>" }
```

Generation and cancellation request shapes are not finalized. They will accept a sales invoice ID, company ID, and user-entered cancellation reason/remarks as required only after schema/API verification. The backend must fetch invoice header and line items itself; the client must not send invoice totals or item data as trusted authority.

## Planned implementation stages
1. Confirm sandbox credentials, auth endpoint, payloads, generation/cancellation paths, response schemas, and test cases.
2. Implement provider adapter and sandbox auth/token lifecycle.
3. Add company-scoped persistence and transaction/audit log with verified invoice foreign-key schema and RLS.
4. Map saved sales invoice and items into the provider payload.
5. Add Generate action and confirmation/validation UI.
6. Add Cancel action with provider-approved reason codes and confirmation.
7. Test success, provider rejection, timeout/unknown outcome, retries, duplicate protection, and company isolation.
8. Certify sandbox only when successful generation and cancellation are verified in provider sandbox responses.

## Safety requirements
- Sandbox-only in this release.
- No production credentials, endpoints, or live generation.
- No blind retries after timeout; reconcile uncertain outcomes before retry.
- Preserve the source sales invoice and never modify/delete it as a side effect of E-Way Bill generation/cancellation.
- Every E-Way Bill transaction must be company-scoped.
