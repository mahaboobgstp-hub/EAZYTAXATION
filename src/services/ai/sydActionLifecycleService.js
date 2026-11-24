/**
 * Stage 11 — local action lifecycle helpers. No server persistence or execution.
 */
const ALLOWED = {
  proposed:["awaiting_approval","blocked","cancelled"],
  awaiting_approval:["authorized","rejected","cancelled","expired","blocked"],
  authorized:["executing","cancelled","expired","blocked"],
  executing:["completed","failed","partially_completed"],
};
export function createSYDActionLifecycle(action, safety) {
  return { actionId:action?.actionId||null, actionType:action?.actionType||"unknown", status:safety?.safe?"awaiting_approval":"blocked", createdAt:new Date().toISOString(), updatedAt:new Date().toISOString(), reasons:safety?.issues||[], advisoryOnly:true };
}
export function transitionSYDActionLifecycle(state, nextStatus, details = {}) {
  if (!state || !ALLOWED[state.status]?.includes(nextStatus)) return { ok:false, state, error:`Invalid action lifecycle transition: ${state?.status||"unknown"} → ${nextStatus}.` };
  const updated={...state,...details,status:nextStatus,updatedAt:new Date().toISOString()};
  return { ok:true,state:updated };
}
