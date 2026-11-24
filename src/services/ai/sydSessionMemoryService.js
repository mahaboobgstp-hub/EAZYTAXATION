/**
 * Stage 9 — session-scoped conversational continuity and correction notes.
 * Memory is kept in sessionStorage only (tab/session lifetime), company-scoped,
 * time-bounded and allowlisted. It is advisory context, never execution authority.
 */
const STORAGE_PREFIX = "syd_ai_session_v1:";
const MAX_ENTRIES = 6;
const MAX_AGE_MS = 2 * 60 * 60 * 1000;
const SAFE_HEADER_KEYS = new Set(["invoice_date","expense_date","supplier_invoice_no","customer_name","vendor_name","supplier_name","payee_name","sale_type","payment_mode","place_of_supply","vendor_state","shipping_state","discount_type","remarks"]);
const SAFE_LINE_KEYS = new Set(["item_name","description","hsn_sac","unit","uom"]);
const asText = (v,max=120) => typeof v === "string" ? v.trim().slice(0,max) : (typeof v === "number" ? String(v) : "");
const storageKey = companyId => STORAGE_PREFIX + String(companyId || "no-company");
export function readSYDSessionMemory(companyId) {
  if (!companyId || typeof sessionStorage === "undefined") return { version:1, companyId:null, updatedAt:null, entries:[], correctionNotes:[] };
  try {
    const raw = sessionStorage.getItem(storageKey(companyId));
    if (!raw) return { version:1, companyId, updatedAt:null, entries:[], correctionNotes:[] };
    const data = JSON.parse(raw);
    if (data.companyId !== companyId) return { version:1, companyId, updatedAt:null, entries:[], correctionNotes:[] };
    const now = Date.now();
    const entries = (Array.isArray(data.entries)?data.entries:[]).filter(e => e?.at && now-Date.parse(e.at) < MAX_AGE_MS).slice(-MAX_ENTRIES);
    const correctionNotes = (Array.isArray(data.correctionNotes)?data.correctionNotes:[]).filter(e => e?.at && now-Date.parse(e.at) < MAX_AGE_MS).slice(-MAX_ENTRIES);
    return { version:1, companyId, updatedAt:data.updatedAt||null, entries, correctionNotes };
  } catch { return { version:1, companyId, updatedAt:null, entries:[], correctionNotes:[] }; }
}
function persist(companyId, memory) {
  if (!companyId || typeof sessionStorage === "undefined") return false;
  try { sessionStorage.setItem(storageKey(companyId), JSON.stringify({ ...memory, companyId, updatedAt:new Date().toISOString() })); return true; } catch { return false; }
}
export function recordSYDSessionTurn(companyId, {command, plan, selectedMasters={}, selectedLineItems={}, corrections={}}={}) {
  const memory = readSYDSessionMemory(companyId);
  const headers = {};
  (plan?.fields||[]).forEach(f => { if (f?.field_id && SAFE_HEADER_KEYS.has(f.field_id)) headers[f.field_id] = asText(corrections.headers?.[f.field_id] ?? f.value); });
  const lines = [];
  const lineField = (plan?.fields||[]).find(f => ["items","lines"].includes(f.field_id) && Array.isArray(f.value));
  (lineField?.value||[]).slice(0,12).forEach((line,index) => {
    const safeLine = {};
    SAFE_LINE_KEYS.forEach(key => { const val = corrections.lines?.[index]?.[key] ?? line?.[key]; if (val !== undefined) safeLine[key] = asText(val); });
    if (selectedLineItems[index]?.item_name) safeLine.matched_item = asText(selectedLineItems[index].item_name);
    lines.push(safeLine);
  });
  const masters = {};
  Object.entries(selectedMasters).forEach(([type,row]) => { const name = row?.customer_name||row?.vendor_name||row?.item_name||row?.category_name; if(name) masters[type]=asText(name); });
  const entry = { at:new Date().toISOString(), command:asText(command,300), screenId:plan?.screen_id||null, intent:plan?.intent||null, response:asText(plan?.response,400), headers, lines, masters };
  memory.entries = [...memory.entries,entry].slice(-MAX_ENTRIES);
  return persist(companyId,memory) ? memory.entries[memory.entries.length-1] : null;
}
export function recordSYDSessionCorrection(companyId, {field, before, after, scope="header"}={}) {
  if (!companyId || !field || !SAFE_HEADER_KEYS.has(field) && !SAFE_LINE_KEYS.has(field)) return null;
  const oldValue=asText(before), newValue=asText(after);
  if (!newValue || oldValue===newValue) return null;
  const memory=readSYDSessionMemory(companyId);
  const note={at:new Date().toISOString(),field,scope,from:oldValue,to:newValue};
  memory.correctionNotes=[...memory.correctionNotes.filter(item=>!(item.field===field&&item.scope===scope)),note].slice(-MAX_ENTRIES);
  return persist(companyId,memory) ? note : null;
}
export function clearSYDSessionMemory(companyId) {
  if (!companyId || typeof sessionStorage === "undefined") return;
  try { sessionStorage.removeItem(storageKey(companyId)); } catch {}
}
export function buildSYDConversationContext(companyId, memory=readSYDSessionMemory(companyId)) {
  return { memoryMode:"tab-session", companyId, recentTransactions:memory.entries.slice(-3), correctionNotes:memory.correctionNotes.slice(-4), instruction:"Use as continuity hints only. Never assume a prior transaction is the current one; confirm when context could be ambiguous. Do not reuse sensitive or financial values as defaults without explicit user confirmation." };
}
