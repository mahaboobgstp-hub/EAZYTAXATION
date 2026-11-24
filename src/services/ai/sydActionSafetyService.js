/**
 * Stage 11 — safety checks for a proposed action.
 * This client-side result must never replace Supabase/server-side policy checks.
 */
export function evaluateSYDActionSafety({ action, companyId, preparedDraft, currentCompanyId } = {}) {
  const issues = [];
  const actionType = action?.actionType || "unknown";
  const permission = action?.permission;
  const isWrite = permission?.level >= 4;
  if (!companyId) issues.push("No active company context is available.");
  if (currentCompanyId && companyId !== currentCompanyId) issues.push("Company context changed; rebuild the action proposal.");
  if (isWrite && !preparedDraft?.ok) issues.push("Write actions require a validated draft.");
  if (action?.companyId && action.companyId !== companyId) issues.push("The proposed action company does not match the active company.");
  if (!action?.fingerprint) issues.push("The action fingerprint is missing.");
  if (!actionType || actionType === "unknown") issues.push("Action type is not recognized.");
  if (permission?.confirmation === "strong" && !action?.detailsReviewed) issues.push("High-impact actions require an additional review checkpoint.");
  return { safe: issues.length === 0, issues, checkedAt: new Date().toISOString(), advisoryOnly: true };
}
