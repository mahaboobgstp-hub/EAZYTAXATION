/**
 * Stage 12 — release-readiness quality gate aggregator.
 * This is a deterministic checklist aggregator; it does not claim runtime test results.
 */
export const SYD_STAGE12_CHECKS = [
  { id:"company_context", label:"Company context is selected and stable", category:"security" },
  { id:"company_isolation", label:"Company-scoped master lookup isolation", category:"security" },
  { id:"command_interpretation", label:"Command interpretation and unsupported intent handling", category:"workflow" },
  { id:"master_lookup", label:"Read-only master lookup results and no-match handling", category:"workflow" },
  { id:"draft_validation", label:"Draft validation rejects missing/invalid required data", category:"validation" },
  { id:"line_corrections", label:"Line and header corrections invalidate previous validation", category:"validation" },
  { id:"authorization_scope", label:"Authorization is scoped to action/company/fingerprint", category:"security" },
  { id:"authorization_expiry", label:"Authorization expires and cannot be reused", category:"security" },
  { id:"handoff", label:"Approved handoff opens the correct supported form", category:"workflow" },
  { id:"no_write", label:"No save/post/payment side effect occurs during AI preparation", category:"safety" },
  { id:"session_memory", label:"Session memory is company-scoped and clearable", category:"privacy" },
  { id:"failure_states", label:"Network errors and failed actions are shown without false success", category:"resilience" },
  { id:"mobile_layout", label:"Responsive workspace usable on mobile viewport", category:"ui" },
  { id:"regression", label:"Existing invoice and expense forms remain unaffected", category:"regression" },
  { id:"ci_build", label:"GitHub Actions production build passes for current branch head", category:"build" },
];
export function summarizeSYDStage12Checks(results = {}) {
  const checks = SYD_STAGE12_CHECKS.map(check => ({ ...check, status: results[check.id] || "not_run" }));
  const passed = checks.filter(check => check.status === "passed").length;
  const failed = checks.filter(check => check.status === "failed").length;
  const blocked = checks.filter(check => check.status === "blocked").length;
  const notRun = checks.filter(check => check.status === "not_run").length;
  return { checks, total:checks.length, passed, failed, blocked, notRun, readiness:failed>0?"failed":blocked>0?"blocked":notRun>0?"incomplete":"ready", percentage:Math.round((passed/checks.length)*100) };
}
