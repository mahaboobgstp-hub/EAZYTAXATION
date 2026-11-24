/**
 * Stage 11 — short-lived, action-specific approval grants.
 * These in-memory grants are a UI gate only; they are not cryptographic or server authority.
 */
const DEFAULT_TTL_MS = 60 * 1000;
const stableValue = (value) => {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") return Object.keys(value).sort().reduce((out,key)=>{out[key]=stableValue(value[key]);return out;},{});
  return value;
};
export function fingerprintSYDAction(action) {
  return JSON.stringify(stableValue(action || {}));
}
export function createSYDActionAuthorization({ action, safety, approved = false, now = Date.now(), ttlMs = DEFAULT_TTL_MS } = {}) {
  if (!approved || !action?.fingerprint || !safety?.safe) return { ok:false, reason:"Approval requires a safe, reviewed action and an explicit user approval." };
  return { ok:true, grant:{ actionType:action.actionType, companyId:action.companyId, fingerprint:action.fingerprint, approvedAt:now, expiresAt:now+ttlMs, scope:"single-action", consumed:false } };
}
export function verifySYDActionAuthorization({ grant, action, companyId, now = Date.now(), consume = false } = {}) {
  const errors = [];
  if (!grant) errors.push("No authorization grant exists.");
  if (grant?.consumed) errors.push("Authorization has already been used.");
  if (grant?.expiresAt && now > grant.expiresAt) errors.push("Authorization has expired.");
  if (grant?.companyId !== companyId) errors.push("Authorization belongs to a different company.");
  if (grant?.actionType !== action?.actionType) errors.push("Authorization is for a different action type.");
  if (grant?.fingerprint !== action?.fingerprint) errors.push("Action details changed after approval.");
  return { ok:errors.length===0, errors, grant:errors.length===0&&consume?{...grant,consumed:true}:grant };
}
