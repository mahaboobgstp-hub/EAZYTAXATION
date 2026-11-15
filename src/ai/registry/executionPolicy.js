/**
 * SYD Intelligence — Phase 1 execution policy.
 * Phase 1 interprets commands only; it cannot operate the live application.
 */
export const SYD_AI_PHASE = 1;
export const SYD_AI_EXECUTION_POLICY = Object.freeze({
  allowInterpretation: true,
  allowNavigation: false,
  allowFormMutation: false,
  allowDatabaseWrites: false,
  allowPosting: false,
  requireUserReview: true,
  requireServerPermissionChecks: true,
});
export function isAIExecutionAllowed(action) {
  if (action === "interpret") return SYD_AI_EXECUTION_POLICY.allowInterpretation;
  if (action === "navigate") return SYD_AI_EXECUTION_POLICY.allowNavigation;
  if (action === "fill_form") return SYD_AI_EXECUTION_POLICY.allowFormMutation;
  return false;
}
