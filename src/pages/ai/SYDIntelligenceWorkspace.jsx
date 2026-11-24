import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiZap, FiSend, FiCompass, FiClipboard, FiShield, FiRefreshCw, FiSearch, FiCheckCircle } from "react-icons/fi";
import { useCompany } from "../../context/CompanyContext";
import { interpretSYDCommand } from "../../services/ai/sydIntelligenceService";
import { searchSYDWorkflowMasters } from "../../services/ai/sydMasterLookupService";
import { prepareSYDValidatedDraft } from "../../services/ai/sydDraftPreparationService";
import { analyzeSYDTransactionContext } from "../../services/ai/sydTransactionContextService";
import { deriveSYDTransactionOrchestration } from "../../services/ai/sydTransactionOrchestrationService";
import { classifySYDAction } from "../../services/ai/sydActionPermissionService";
import { evaluateSYDActionSafety } from "../../services/ai/sydActionSafetyService";
import { fingerprintSYDAction, createSYDActionAuthorization, verifySYDActionAuthorization } from "../../services/ai/sydActionAuthorizationService";
import { createSYDActionLifecycle, transitionSYDActionLifecycle } from "../../services/ai/sydActionLifecycleService";
import { readSYDSessionMemory, buildSYDConversationContext, recordSYDSessionTurn, recordSYDSessionCorrection, clearSYDSessionMemory } from "../../services/ai/sydSessionMemoryService";
import { registerSYDWebScreens, getSYDWebScreenByRoute } from "../../ai/registry/webScreenKnowledge";
import { getSYDOperationalKnowledge } from "../../ai/registry/operationalKnowledge";
import "../../css/ai/SYDIntelligenceWorkspace.css";

const masterLabel = (type) => ({customers:"Customers",vendors:"Suppliers",items:"Items",expense_categories:"Expense categories"}[type] || type);
const candidateName = (type, row) => row?.customer_name || row?.vendor_name || row?.item_name || row?.category_name || "Unnamed record";

export default function SYDIntelligenceWorkspace() {
  const { currentCompany } = useCompany();
  const navigate = useNavigate();
  const location = useLocation();
  const [command, setCommand] = useState("");
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [error, setError] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [result, setResult] = useState(null);
  const [masterResults, setMasterResults] = useState([]);
  const [selectedMasters, setSelectedMasters] = useState({});
  const [selectedLineItems, setSelectedLineItems] = useState({});
  const [draftCorrections, setDraftCorrections] = useState({ headers: {}, lines: {} });
  const [draftReviewOpen, setDraftReviewOpen] = useState(false);
  const [preparedDraft, setPreparedDraft] = useState(null);
  const [draftErrors, setDraftErrors] = useState([]);
  const [sessionMemory, setSessionMemory] = useState(() => readSYDSessionMemory(currentCompany?.id));
  const [memoryPanelOpen, setMemoryPanelOpen] = useState(false);
  const [handoffAuthorization, setHandoffAuthorization] = useState(null);
  const [handoffLifecycle, setHandoffLifecycle] = useState(null);
  const [handoffGrant, setHandoffGrant] = useState(null);

  useEffect(() => { registerSYDWebScreens(); }, []);
  useEffect(() => { setSessionMemory(readSYDSessionMemory(currentCompany?.id)); }, [currentCompany?.id]);
  const currentScreen = useMemo(() => getSYDWebScreenByRoute(location.pathname), [location.pathname]);

  const submit = async (event) => {
    event?.preventDefault();
    if (!command.trim() || loading) return;
    setLoading(true); setError(""); setResult(null); setMasterResults([]); setSelectedMasters({}); setSelectedLineItems({}); setDraftCorrections({ headers: {}, lines: {} }); setDraftReviewOpen(false); setPreparedDraft(null); setDraftErrors([]);
    try {
      registerSYDWebScreens();
      const response = await interpretSYDCommand({ text: command, company: currentCompany, currentScreenId: currentScreen?.screenId || null, platform: "web", conversationContext: buildSYDConversationContext(currentCompany?.id, sessionMemory) });
      setResult(response);
      if (response?.plan && currentCompany?.id) { recordSYDSessionTurn(currentCompany.id, { command, plan: response.plan, selectedMasters, selectedLineItems, corrections: draftCorrections }); setSessionMemory(readSYDSessionMemory(currentCompany.id)); }
    } catch (err) { setError(err?.message || "SYD Intelligence is unavailable. Please try again."); }
    finally { setLoading(false); }
  };

  const runMasterLookup = async () => {
    if (!result?.plan || lookupLoading) return;
    if (!currentCompany?.id) { setLookupError("Select a company before live master lookup."); return; }
    setLookupLoading(true); setLookupError("");
    try {
      const results = await searchSYDWorkflowMasters({ plan: result.plan, companyId: currentCompany.id });
      setMasterResults(results);
      setSelectedMasters({}); setSelectedLineItems({});
      if (!results.length) setLookupError("No identifiable master-name field was proposed. Add the name to your request and ask SYD again.");
    } catch (err) { setLookupError(err?.message || "Master lookup failed. Please try again."); }
    finally { setLookupLoading(false); }
  };

  const plan = result?.plan;
  const operationalKnowledge = getSYDOperationalKnowledge();
  const masterById = new Map(operationalKnowledge.masterConcepts.map(master => [master.id, master]));
  const screens = ["Navigate to Sales Invoice", "Help me understand accounting for this company", "How do I record an expense?"];
  const toggleCandidate = (type, candidate) => { setPreparedDraft(null); setDraftErrors([]); setSelectedMasters(prev => ({ ...prev, [type]: candidate })); };
  const selectedCount = Object.keys(selectedMasters).length + Object.keys(selectedLineItems).length;
  const lineField = (plan?.fields || []).find(field => ["items","lines"].includes(field.field_id) && Array.isArray(field.value));
  const proposedLines = lineField?.value || [];
  const updateLineCorrection = (index, key, value) => { const original = proposedLines[index]?.[key]; recordSYDSessionCorrection(currentCompany?.id, { field:key, scope:"line_"+index, before:original, after:value }); setPreparedDraft(null); setDraftErrors([]); setDraftCorrections(prev => ({ ...prev, lines: { ...prev.lines, [index]: { ...(prev.lines?.[index] || {}), [key]: value } } })); setSessionMemory(readSYDSessionMemory(currentCompany?.id)); };
  const updateHeaderCorrection = (key, value) => { const original = plan?.fields?.find(field=>field.field_id===key)?.value; recordSYDSessionCorrection(currentCompany?.id, { field:key, scope:"header", before:original, after:value }); setPreparedDraft(null); setDraftErrors([]); setDraftCorrections(prev => ({ ...prev, headers: { ...prev.headers, [key]: value } })); setSessionMemory(readSYDSessionMemory(currentCompany?.id)); };
  const clearSessionMemory = () => { clearSYDSessionMemory(currentCompany?.id); setSessionMemory(readSYDSessionMemory(currentCompany?.id)); setMemoryPanelOpen(false); };
  const contextAnalysis = plan ? analyzeSYDTransactionContext({ plan, companyId: currentCompany?.id, selectedMasters, selectedLineItems, corrections: draftCorrections }) : null;
  const orchestration = deriveSYDTransactionOrchestration({ plan, companyId:currentCompany?.id, masterResults, selectedMasters, selectedLineItems, draftReviewOpen, preparedDraft, contextAnalysis });
  const runOrchestrationAction = () => { switch(orchestration.actionId){ case "interpret": submit(); break; case "company": break; case "masters": runMasterLookup(); break; case "review": setDraftReviewOpen(true); break; case "validate": setDraftReviewOpen(true); prepareDraft(); break; case "handoff": openPreparedForm(); break; default: break; } };
  const prepareDraft = () => {
    const prepared = prepareSYDValidatedDraft({ plan, companyId: currentCompany?.id, selectedMasters, selectedLineItems, corrections: draftCorrections });
    setPreparedDraft(prepared); setDraftErrors(prepared.errors || []);
  };
  const buildHandoffAction = () => {
    if (!preparedDraft?.ok || !currentCompany?.id) return null;
    const action = { actionType:"form_handoff", companyId:currentCompany.id, screenId:preparedDraft.screenId, draftSource:preparedDraft.source, preparedAt:preparedDraft.preparedAt, fieldCount:Object.keys(preparedDraft.values||{}).length };
    action.fingerprint = fingerprintSYDAction(action);
    action.permission = classifySYDAction("form_handoff");
    return action;
  };
  const requestFormHandoff = () => {
    const action = buildHandoffAction();
    if (!action) return;
    const safety = evaluateSYDActionSafety({ action, companyId:currentCompany?.id, currentCompanyId:currentCompany?.id, preparedDraft });
    const lifecycle = createSYDActionLifecycle(action, safety);
    setHandoffAuthorization({ action, safety });
    setHandoffLifecycle(lifecycle);
    setHandoffGrant(null);
  };
  const cancelHandoffAuthorization = () => {
    if (handoffLifecycle) {
      const transitioned = transitionSYDActionLifecycle(handoffLifecycle, "cancelled");
      if (transitioned.ok) setHandoffLifecycle(transitioned.state);
    }
    setHandoffAuthorization(null);
    setHandoffGrant(null);
  };
  const approveAndOpenForm = () => {
    const action = buildHandoffAction();
    if (!action || !handoffAuthorization?.safety?.safe) return;
    const authorization = createSYDActionAuthorization({ action, safety:handoffAuthorization.safety, approved:true });
    if (!authorization.ok) return;
    const verification = verifySYDActionAuthorization({ grant:authorization.grant, action, companyId:currentCompany?.id, consume:true });
    if (!verification.ok) return;
    const authorizedState = transitionSYDActionLifecycle(handoffLifecycle, "authorized", { approvedAt:new Date().toISOString() });
    if (!authorizedState.ok) return;
    const executingState = transitionSYDActionLifecycle(authorizedState.state, "executing", { executionStartedAt:new Date().toISOString() });
    if (!executingState.ok) return;
    setHandoffGrant(verification.grant);
    const target = preparedDraft.screenId === "sales_invoice" ? "/app/sales" : preparedDraft.screenId === "purchase_invoice" ? "/app/purchases" : "/app/expenses";
    // This action is a navigation handoff only. No record is saved or posted.
    setHandoffLifecycle(transitionSYDActionLifecycle(executingState.state, "completed", { completedAt:new Date().toISOString(), result:"Form navigation authorized; no transaction write performed." }).state);
    navigate(target, { state: { sydDraft: preparedDraft } });
  };
  const openPreparedForm = () => requestFormHandoff();

  return (
    <main className="syd-ai-workspace">
      <header className="syd-ai-hero"><div className="syd-ai-brand-icon"><FiZap /></div><div><h1>SYD Intelligence</h1><p>Understand your business. Assist with your workflow. Keep you in control.</p></div></header>
      <section className="syd-ai-context">
        <div><span className="syd-ai-context-label">Company context</span><strong>{currentCompany?.company_name || "No company selected"}</strong></div>
        <div><span className="syd-ai-context-label">Operating mode</span><strong>{currentCompany?.accounting_enabled ? "Billing + Accounting" : "Billing only"}</strong></div>
        <div><span className="syd-ai-context-label">Current screen</span><strong>{currentScreen?.name || "General workspace"}</strong></div>
      </section>
      <section className="syd-ai-session-memory"><div className="syd-ai-memory-heading"><div><strong>Conversational session memory</strong><small>Company-scoped · tab session · expires after 2 hours of inactivity</small></div><button type="button" onClick={()=>setMemoryPanelOpen(v=>!v)}>{memoryPanelOpen?"Hide memory":"Review memory"} ({sessionMemory.entries.length} turns · {sessionMemory.correctionNotes.length} corrections)</button></div>{memoryPanelOpen&&<div className="syd-ai-memory-content"><p>Limited continuity hints are stored for this company in this browser tab session only. No database persistence or model training. Sensitive identifiers are excluded from stored fields.</p>{sessionMemory.entries.length===0?<small>No session turns stored yet.</small>:<ol>{sessionMemory.entries.slice(-4).reverse().map((entry,index)=><li key={entry.at+index}><strong>{entry.screenId||"General"} · {new Date(entry.at).toLocaleString()}</strong><span>{entry.command}</span>{Object.keys(entry.masters||{}).length>0&&<small>Selected master names: {Object.values(entry.masters).join(", ")}</small>}</li>)}</ol>}{sessionMemory.correctionNotes.length>0&&<div><strong>Session correction notes</strong><ul>{sessionMemory.correctionNotes.slice(-4).reverse().map((note,index)=><li key={note.at+index}>{note.field}: “{note.from||"—"}” → “{note.to}”</li>)}</ul></div>}<button type="button" className="syd-ai-memory-clear" onClick={clearSessionMemory}>Clear session memory</button></div>}</section>
      <section className="syd-ai-card">
        <h2>What can I help you with?</h2>
        <p className="syd-ai-muted">Describe a task in everyday language. SYD can verify company masters, validate audited draft fields, and hand a draft to a supported form. It will never save or post automatically.</p>
        <form onSubmit={submit} className="syd-ai-form">
          <textarea value={command} onChange={e => setCommand(e.target.value)} placeholder="Example: Create a sales invoice for ABC Traders for 10 units of…" rows={4} maxLength={3000}/>
          <div className="syd-ai-form-footer"><span>{command.length}/3000</span><button type="submit" disabled={loading || !command.trim()}>{loading ? <><FiRefreshCw className="syd-ai-spin"/> Thinking…</> : <><FiSend/> Ask SYD</>}</button></div>
        </form>
        <div className="syd-ai-suggestions">{screens.map(s=><button key={s} type="button" onClick={()=>setCommand(s)}>{s}</button>)}</div>
      </section>
      {error && <div className="syd-ai-error" role="alert">{error}</div>}
      {result && <section className="syd-ai-result syd-ai-card">
        <div className="syd-ai-result-heading"><div className="syd-ai-result-icon"><FiClipboard/></div><div><h2>Proposed response</h2><span className="syd-ai-intent-chip">{plan?.intent?.replaceAll("_"," ") || "Plan"}</span></div></div>
        <p className="syd-ai-response">{plan?.response || "No response was returned."}</p>
        {plan?.screen_id && <div className="syd-ai-result-line"><FiCompass/><span>Suggested screen: <strong>{plan.screen_id}</strong></span></div>}
        {Array.isArray(plan?.fields) && plan.fields.length>0 && <div className="syd-ai-proposed-fields"><h3>Suggested field values</h3>{plan.fields.map((field,index)=><div className="syd-ai-field-row" key={field.field_id+index}><span>{field.field_id}</span><strong>{field.value ?? "—"}</strong></div>)}</div>}
        {Array.isArray(plan?.missing_information) && plan.missing_information.length>0 && <div className="syd-ai-missing"><h3>Information needed</h3><ul>{plan.missing_information.map((item,index)=><li key={index}>{item}</li>)}</ul></div>}
        {contextAnalysis?.supported && <section className="syd-ai-context-intelligence"><div className="syd-ai-context-score-header"><div><h3>Transaction context intelligence</h3><small>Deterministic readiness estimate — not an AI probability</small></div><div className={"syd-ai-confidence-score "+(contextAnalysis.level==="High"?"high":contextAnalysis.level==="Moderate"?"moderate":"low")}><strong>{contextAnalysis.score}%</strong><span>{contextAnalysis.level} confidence</span></div></div><div className="syd-ai-context-meter"><span style={{width:contextAnalysis.score+"%"}}/></div><div className="syd-ai-context-reasons">{contextAnalysis.reasons.map((reason,index)=><span key={index}>{reason}</span>)}</div>{contextAnalysis.questions.length>0?<div className="syd-ai-clarification-panel"><strong>SYD needs clarification</strong><p>Resolve these questions before preparing a reliable draft:</p><ol>{contextAnalysis.questions.map((question,index)=><li key={index}>{question}</li>)}</ol><small>You can answer by editing the header and line fields below, then re-check validation.</small></div>:<div className="syd-ai-clarification-clear">No outstanding context questions detected by the readiness analyzer.</div>}</section>}{plan?.workflow && <div className="syd-ai-workflow-panel">
          <h3>Workflow preparation</h3>{plan.workflow.workflow_id && <span className="syd-ai-workflow-chip">{plan.workflow.workflow_id.replaceAll("_"," ")}</span>}
          {Array.isArray(plan.workflow.steps)&&plan.workflow.steps.length>0&&<ol className="syd-ai-workflow-steps">{plan.workflow.steps.map((step,index)=><li key={index}>{step}</li>)}</ol>}
          {Array.isArray(plan.workflow.master_dependencies)&&plan.workflow.master_dependencies.length>0&&<div className="syd-ai-master-dependencies"><strong>Master dependencies</strong>{plan.workflow.master_dependencies.map((id,index)=>{const master=masterById.get(id);return <div className="syd-ai-master-row" key={id+index}><span>{master?.name||id}</span><small>Live lookup available for supported master types</small></div>})}</div>}
          <div className="syd-ai-confirmation-checkpoint"><strong>Confirmation checkpoint</strong><p>{plan.workflow.confirmation_checkpoint}</p><span>Draft/review only — no save or posting action.</span></div>
        </div>}
        {plan && <section className="syd-ai-orchestration"><div className="syd-ai-orchestration-top"><div><h3>Guided transaction orchestration</h3><small>One step at a time · you approve every transition</small></div><span className="syd-ai-orchestration-progress">{orchestration.progress}/{orchestration.total} completed</span></div><div className="syd-ai-orchestration-track"><span style={{width:((orchestration.progress/orchestration.total)*100)+"%"}}/></div><ol className="syd-ai-orchestration-steps">{orchestration.stages.map((stage,index)=><li className={"syd-ai-orchestration-step "+stage.status} key={stage.id}><span className="syd-ai-orchestration-number">{stage.status==="complete"?"✓":index+1}</span><div><strong>{stage.label}</strong><small>{stage.detail}</small></div><span className="syd-ai-orchestration-status">{stage.status.replaceAll("_"," ")}</span></li>)}</ol><div className="syd-ai-orchestration-footer"><span>{orchestration.blockedReason||"Workflow is advisory and user-controlled. No save or posting occurs."}</span><button type="button" onClick={runOrchestrationAction} disabled={loading||lookupLoading||!orchestration.supported||["company","chooseParty","chooseLineItem"].includes(orchestration.actionId)}>{orchestration.nextAction}</button></div></section>}
        <div className="syd-ai-live-lookup"><button type="button" onClick={runMasterLookup} disabled={lookupLoading}><FiSearch/>{lookupLoading?"Checking company masters…":"Live-check identified master names"}</button><small>Read-only lookup, scoped to the selected company. Expense categories also include global categories.</small></div>
        {lookupError && <div className="syd-ai-error" role="alert">{lookupError}</div>}
        {masterResults.length>0&&<section className="syd-ai-master-results"><h3>Live master matches</h3><p className="syd-ai-muted">Choose a verified match for review. This selection is local to this proposal and does not change a form or record.</p>
          {masterResults.map((resultItem,index)=><div className="syd-ai-master-result-group" key={resultItem.masterType+(resultItem.lineIndex===undefined?"header":resultItem.lineIndex)+index}><div className="syd-ai-master-result-title">{masterLabel(resultItem.masterType)}{resultItem.lineIndex!==undefined?" · Line "+(resultItem.lineIndex+1):""} · searched “{resultItem.query}”</div>
            {resultItem.candidates.length===0?<div className="syd-ai-no-match">No matching records found.</div>:resultItem.candidates.map(candidate=><button type="button" className={"syd-ai-candidate"+((resultItem.lineIndex!==undefined?selectedLineItems[resultItem.lineIndex]?.id:selectedMasters[resultItem.masterType]?.id)===candidate.id?" selected":"")} key={candidate.id} onClick={()=>{setPreparedDraft(null);setDraftErrors([]);resultItem.lineIndex!==undefined?setSelectedLineItems(prev=>({...prev,[resultItem.lineIndex]:candidate})):toggleCandidate(resultItem.masterType,candidate)}}><span>{candidateName(resultItem.masterType,candidate)}</span><small>{candidate.gstin||candidate.item_code||candidate.state||"Verified record"}</small>{((resultItem.lineIndex!==undefined?selectedLineItems[resultItem.lineIndex]?.id:selectedMasters[resultItem.masterType]?.id)===candidate.id)&&<FiCheckCircle/>}</button>)}
          </div>)}
          <button className="syd-ai-review-button" type="button" onClick={()=>setDraftReviewOpen(v=>!v)}>{draftReviewOpen?"Hide draft review":"Open draft review"} ({selectedCount} selected master{selectedCount===1?"":"s"})</button>
          {draftReviewOpen&&<div className="syd-ai-draft-review"><h3>Draft review — not saved</h3><p>Company: <strong>{currentCompany?.company_name||"Not selected"}</strong></p><p>Intent: <strong>{plan?.intent||"—"}</strong></p><p>Screen: <strong>{plan?.screen_id||"—"}</strong></p><div className="syd-ai-draft-fields"><h4>Header corrections (local draft only)</h4>{(plan?.fields||[]).filter(field=>!["items","lines"].includes(field.field_id)&&typeof field.value!=="object").map((field,i)=><label className="syd-ai-correction-row" key={field.field_id+i}><span>{field.field_id}</span><input value={draftCorrections.headers?.[field.field_id]??String(field.value??"")} onChange={e=>updateHeaderCorrection(field.field_id,e.target.value)} /></label>)}</div>
          {proposedLines.length>0&&<div className="syd-ai-line-corrections"><h4>Line-by-line corrections</h4>{proposedLines.map((line,index)=><div className="syd-ai-line-correction-card" key={index}><strong>Line {index+1} · {line.item_name||line.description||line.item||"Transaction line"}</strong>{["item_name","description","qty","rate","gst_rate","gst_percent","discount_percent","hsn_sac","unit","uom"].filter(key=>line[key]!==undefined||["qty","rate","item_name","description"].includes(key)).map(key=><label key={key}><span>{key}</span><input value={draftCorrections.lines?.[index]?.[key]??String(line[key]??"")} onChange={e=>updateLineCorrection(index,key,e.target.value)} /></label>)}</div>)}</div>}<h4>Confirmed master choices (review only)</h4>{Object.entries(selectedMasters).map(([type,record])=><div className="syd-ai-selected-master" key={type}><span>{masterLabel(type)}</span><strong>{candidateName(type,record)}</strong></div>)}<div className="syd-ai-review-warning">Draft preparation validates only audited fields. No saving or posting occurs. Form handoff is limited to supported audited screens.</div><button type="button" className="syd-ai-prepare-button" onClick={prepareDraft}>Validate draft for form handoff</button>{preparedDraft&&<div className="syd-ai-prepared-result"><strong>{preparedDraft.ok?"Draft validation passed":"Draft validation needs attention"}</strong>{draftErrors.length>0&&<ul>{draftErrors.map((e,i)=><li key={i}>{e}</li>)}</ul>}{preparedDraft.ok&&<button type="button" className="syd-ai-open-form" onClick={requestFormHandoff}>Review authorization to open form</button>}{handoffAuthorization&&<div className="syd-ai-authorization-panel"><strong>Stage 11 · Action safety review</strong><div><span>Requested action</span><b>{handoffAuthorization.action.permission.label}</b></div><div><span>Company</span><b>{currentCompany?.company_name||"—"}</b></div><div><span>Destination</span><b>{preparedDraft.screenId.replaceAll("_"," ")}</b></div><div><span>Permission level</span><b>L{handoffAuthorization.action.permission.level} · Explicit confirmation</b></div><p>This approval is limited to opening this validated draft form. It does not authorize saving, posting, payment, or another action.</p><div className="syd-ai-authorization-actions"><button type="button" onClick={cancelHandoffAuthorization}>Cancel</button><button type="button" onClick={approveAndOpenForm} disabled={!handoffAuthorization.safety.safe}>Approve & Open Form</button></div></div>}{handoffLifecycle&&<div className="syd-ai-lifecycle-status"><strong>Action lifecycle: {handoffLifecycle.status.replaceAll("_"," ")}</strong>{handoffLifecycle.reasons?.length>0&&<ul>{handoffLifecycle.reasons.map((reason,i)=><li key={i}>{reason}</li>)}</ul>}</div>}</div>}</div>}
        </section>}
        <div className="syd-ai-safe-note"><FiShield/><span>Master search is read-only. Validated drafts can be handed to supported forms for your review. No transaction save or accounting posting is executed by SYD.</span></div>
        {result.requestId&&<small className="syd-ai-request-id">Request ID: {result.requestId}</small>}
      </section>}
      <section className="syd-ai-safety"><FiShield/><div><strong>Controlled by you</strong><p>Live master lookup is read-only. Draft review is in-memory only. Any future write requires deterministic validation, server-side permissions and explicit confirmation.</p></div></section>
    </main>
  );
}
