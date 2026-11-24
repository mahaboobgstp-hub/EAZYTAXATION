# Stage 12 — Testing, Edge Cases & Release Readiness

## Purpose
Stage 12 adds automated deterministic service tests and a manual browser/runtime release checklist. Test outcomes must be reported only when actually run. A checklist entry is not evidence of a completed test.

## Automated tests
Run:
```bash
npm run test:ai
```
Coverage includes:
- Stage 11 action permission levels, unknown-action conservative classification, safety checks, company mismatch, approval scope/fingerprint/expiry, and lifecycle transition rules.
- Stage 7 draft validator supported screens, required company/party/category/lines, invalid date, quantity, numeric values and discount limits.
- Stage 10 orchestration unsupported-screen behavior, company gate and validated-draft handoff readiness.
- Stage 12 quality-gate summary counting and readiness aggregation.

## Manual browser/runtime checklist
For each test, record Passed / Failed / Blocked and evidence before release.

### Core flow
- [ ] Interpret request for Sales Invoice, Purchase Invoice and Expense Entry.
- [ ] Verify suggested fields and missing information.
- [ ] Read-only master lookup: matching, multiple candidates and no-match.
- [ ] Select verified customer/vendor and item; confirm selections are proposal-local.
- [ ] Header correction and line correction.
- [ ] Revalidate after corrections; ensure old draft validation is not reused.
- [ ] Confirm correct target route and draft handoff for each supported screen.
- [ ] Cancel authorization review; ensure no handoff.
- [ ] Approve authorization review; verify only form navigation occurs.

### Security and safety
- [ ] Company switch before lookup; ensure results and selections are company-scoped.
- [ ] Company switch after draft preparation; stale proposal/authorization must not proceed.
- [ ] Mismatched company action is blocked.
- [ ] Changed action fingerprint is rejected.
- [ ] Expired grant is rejected.
- [ ] Grant reuse is rejected.
- [ ] Unknown action classification defaults to high-impact.
- [ ] Confirm AI preparation causes no save/post/payment/write side effect.

### Session memory and resilience
- [ ] Session memory remains company-scoped.
- [ ] Clear memory control works.
- [ ] Expiry after inactivity is verified.
- [ ] Edge Function/network error displays a truthful error state.
- [ ] Empty response/unsupported screen does not crash.
- [ ] Refresh/reopen behavior documented.
- [ ] Narrow/mobile viewport layout and keyboard behavior checked.

### Regression checks
- [ ] Sales Invoice form receives draft correctly and is usable.
- [ ] Purchase Invoice form receives draft correctly and is usable.
- [ ] Expense Entry form receives draft correctly and is usable.
- [ ] No unintended changes to existing invoice, expense, master, accounting or report screens.
- [ ] Main branch remains unchanged; Android branch remains unchanged.

## Release gates
- [ ] CI production build passes on current Stage 12 head.
- [ ] Automated AI service tests pass.
- [ ] Manual browser checklist complete, with no critical failures.
- [ ] Security/company isolation reviewed.
- [ ] Release candidate commit and PR reviewed.
- [ ] Explicit release approval before merge/deployment.

## Stage 12 status at creation
- Automated tests: authored; execution pending.
- Manual test checklist: authored; execution pending.
- Browser/runtime testing: pending.
- Production merge/deployment: not performed.
- Android branch: untouched.
