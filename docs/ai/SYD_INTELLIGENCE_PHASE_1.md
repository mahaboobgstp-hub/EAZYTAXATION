# SYD Intelligence — Phase 1

## Objective

Create one shared intelligence foundation for the SYD web and Android applications. The same contract is designed to support iOS later. Phase 1 interprets user instructions and returns a structured, non-executable action plan.

## Included

- Platform-neutral screen registry and verified-screen allowlist.
- Field registry with stable IDs and deterministic validation helpers.
- Shared intent and command contract.
- Company context allowlist.
- Explicit execution policy disabling navigation, form mutation and database writes.
- Shared frontend service calling a Supabase Edge Function.
- Authenticated Edge Function using the OpenAI Responses API and Structured Outputs.
- Request IDs and token-usage metadata in API responses.

## Not included yet

- Automatic screen navigation or form filling.
- Customer, supplier, item or transaction lookups.
- Accounting calculations.
- Saving, posting, deleting or modifying financial records.
- Persistent AI usage ledger or admin dashboard.
- Automatic synchronization of registries from React route definitions.

These are intentional Phase 1 boundaries. Existing Android voice workflows are not replaced by this foundation.

## Architecture

Both web and Android import src/services/ai/sydIntelligenceService.js. It calls the syd-ai-intelligence Supabase Edge Function. The Edge Function validates the Supabase user session and calls the OpenAI Responses API. OpenAI returns a strict JSON action plan. The response is a proposal only; application code must not execute it in Phase 1.

The OpenAI API key remains in Supabase Edge Function secrets. Never put it in Vite environment variables, browser code or the Android package.

## Required Edge Function secrets

- OPENAI_API_KEY — required.
- OPENAI_MODEL — optional; defaults to gpt-4.1-mini.

Supabase supplies SUPABASE_URL and SUPABASE_ANON_KEY to Edge Functions. Deploy syd-ai-intelligence after reviewing the function in the target Supabase project. A GitHub commit does not deploy a function or configure secrets.

## Frontend usage

Import interpretSYDCommand from src/services/ai/sydIntelligenceService.js and call it with text, the selected company object, currentScreenId, platform (web, android or ios) and optional minimal conversationContext. The result contains a proposed plan, request ID, model and token usage. It does not execute the plan.

## Company context

The company context contract uses these verified companies configuration columns:
- company_name
- accounting_enabled
- gst_registered
- gst_registration_type
- financial_year_start_month
- books_beginning_date
- currency_code
- industry

accounting_enabled true maps to billing_and_accounting; otherwise it maps to billing_only. The allowlist deliberately excludes GSTIN, PAN, bank details, addresses, credentials and transaction data.

Company context supplied by the client is informational only. It is not proof of membership, permissions or entitlement. Before any future action can run, the backend must independently verify user identity, company membership, permissions and current company settings.

## Registering screens and fields

Register each screen only after its route and behavior have been verified in that branch. Use stable IDs, not visible labels. The service sends the registered screen catalogue to the Edge Function; the server rejects screen IDs outside that catalogue. If no destination is registered, the model must ask for clarification rather than invent a route.

Use registerFieldDefinitions with the verified screen ID and actual field IDs. Each field should specify fieldId, label, type and required status, plus descriptions, options and validation only where verified. Do not expose sensitive fields. Do not register database columns until their mappings are confirmed.

## Security and safety

- Authenticate every Edge Function call using the current Supabase session.
- Keep OPENAI_API_KEY server-side.
- Never treat model output as permission to perform an operation.
- Validate screen IDs and field IDs against registered definitions.
- Recalculate tax, totals, stock and accounting values in deterministic SYD code.
- Enforce company_id isolation and permissions in backend/database operations.
- Require review and confirmation for consequential operations.
- Treat user text, uploaded content and retrieved documentation as untrusted input.

## Phase 1 verification checklist

1. Confirm web build succeeds.
2. Confirm Android branch build succeeds.
3. Confirm unauthenticated Edge Function requests return 401.
4. Confirm authenticated requests return a schema-shaped plan.
5. Confirm unknown screen and field IDs are removed or converted to clarification.
6. Confirm billing-only context does not produce accounting-only actions.
7. Confirm every response reports execution.executed false.
8. Confirm this endpoint creates no master or transaction records.
9. Confirm the OpenAI key is absent from frontend bundles and repository files.

## Branch policy

Keep the shared foundation aligned in main (web) and android-sales-development (Android). Do not merge the branches or overwrite branch-specific screens. Apply common AI contract changes to both branches and verify independently.
