/**
 * Stage 11 — deterministic SYD action permission classification.
 * Client-side classification is UX guidance, not an authorization boundary.
 */
const LEVELS = {
  read: { level: 0, label: "Read-only", confirmation: "none", risk: "low" },
  analysis: { level: 1, label: "Analysis", confirmation: "none", risk: "low" },
  draft: { level: 2, label: "Draft preparation", confirmation: "review", risk: "low" },
  form_handoff: { level: 3, label: "Form handoff", confirmation: "explicit", risk: "low" },
  write: { level: 4, label: "Record creation/update", confirmation: "explicit", risk: "high" },
  financial: { level: 5, label: "Financial execution", confirmation: "strong", risk: "critical" },
  destructive: { level: 6, label: "High-impact/destructive", confirmation: "strong", risk: "critical" },
};
const ACTION_MAP = {
  show: "read", lookup: "read", report: "read", analyze: "analysis",
  prepare_draft: "draft", form_handoff: "form_handoff",
  save: "write", create: "write", update: "write",
  payment: "financial", posting: "financial",
  delete: "destructive", bulk_delete: "destructive", bulk_update: "destructive", reverse: "destructive",
};
export function classifySYDAction(actionType = "analysis") {
  const category = ACTION_MAP[String(actionType).toLowerCase()] || "destructive";
  return { actionType, category, ...LEVELS[category] };
}
export function listSYDActionPermissionLevels() {
  return Object.entries(LEVELS).map(([category, definition]) => ({ category, ...definition }));
}
