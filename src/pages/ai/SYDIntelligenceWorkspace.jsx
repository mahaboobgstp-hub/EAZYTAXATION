import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiZap, FiSend, FiCompass, FiClipboard, FiShield, FiRefreshCw, FiSearch, FiCheckCircle } from "react-icons/fi";
import { useCompany } from "../../context/CompanyContext";
import { interpretSYDCommand } from "../../services/ai/sydIntelligenceService";
import { searchSYDWorkflowMasters } from "../../services/ai/sydMasterLookupService";
import { prepareSYDValidatedDraft } from "../../services/ai/sydDraftPreparationService";
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
  const [draftReviewOpen, setDraftReviewOpen] = useState(false);
  const [preparedDraft, setPreparedDraft] = useState(null);
  const [draftErrors, setDraftErrors] = useState([]);

  useEffect(() => { registerSYDWebScreens(); }, []);
  const currentScreen = useMemo(() => getSYDWebScreenByRoute(location.pathname), [location.pathname]);

  const submit = async (event) => {
    event?.preventDefault();
    if (!command.trim() || loading) return;
    setLoading(true); setError(""); setResult(null); setMasterResults([]); setSelectedMasters({}); setDraftReviewOpen(false); setPreparedDraft(null); setDraftErrors([]);
    try {
      registerSYDWebScreens();
      const response = await interpretSYDCommand({ text: command, company: currentCompany, currentScreenId: currentScreen?.screenId || null, platform: "web" });
      setResult(response);
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
      setSelectedMasters({});
      if (!results.length) setLookupError("No identifiable master-name field was proposed. Add the name to your request and ask SYD again.");
    } catch (err) { setLookupError(err?.message || "Master lookup failed. Please try again."); }
    finally { setLookupLoading(false); }
  };

  const plan = result?.plan;
  const operationalKnowledge = getSYDOperationalKnowledge();
  const masterById = new Map(operationalKnowledge.masterConcepts.map(master => [master.id, master]));
  const screens = ["Navigate to Sales Invoice", "Help me understand accounting for this company", "How do I record an expense?"];
  const toggleCandidate = (type, candidate) => setSelectedMasters(prev => ({ ...prev, [type]: candidate }));
  const selectedCount = Object.keys(selectedMasters).length;
  const prepareDraft = () => {
    const prepared = prepareSYDValidatedDraft({ plan, companyId: currentCompany?.id, selectedMasters });
    setPreparedDraft(prepared); setDraftErrors(prepared.errors || []);
  };
  const openPreparedForm = () => {
    if (!preparedDraft?.ok) return;
    const target = preparedDraft.screenId === "sales_invoice" ? "/app/sales" : preparedDraft.screenId === "purchase_invoice" ? "/app/purchases" : "/app/expenses";
    navigate(target, { state: { sydDraft: preparedDraft } });
  };

  return (
    <main className="syd-ai-workspace">
      <header className="syd-ai-hero"><div className="syd-ai-brand-icon"><FiZap /></div><div><h1>SYD Intelligence</h1><p>Understand your business. Assist with your workflow. Keep you in control.</p></div></header>
      <section className="syd-ai-context">
        <div><span className="syd-ai-context-label">Company context</span><strong>{currentCompany?.company_name || "No company selected"}</strong></div>
        <div><span className="syd-ai-context-label">Operating mode</span><strong>{currentCompany?.accounting_enabled ? "Billing + Accounting" : "Billing only"}</strong></div>
        <div><span className="syd-ai-context-label">Current screen</span><strong>{currentScreen?.name || "General workspace"}</strong></div>
      </section>
      <section className="syd-ai-card">
        <h2>What can I help you with?</h2>
        <p className="syd-ai-muted">Describe a task in everyday language. SYD creates a plan and can check company masters read-only. It does not fill or save forms.</p>
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
        {plan?.workflow && <div className="syd-ai-workflow-panel">
          <h3>Workflow preparation</h3>{plan.workflow.workflow_id && <span className="syd-ai-workflow-chip">{plan.workflow.workflow_id.replaceAll("_"," ")}</span>}
          {Array.isArray(plan.workflow.steps)&&plan.workflow.steps.length>0&&<ol className="syd-ai-workflow-steps">{plan.workflow.steps.map((step,index)=><li key={index}>{step}</li>)}</ol>}
          {Array.isArray(plan.workflow.master_dependencies)&&plan.workflow.master_dependencies.length>0&&<div className="syd-ai-master-dependencies"><strong>Master dependencies</strong>{plan.workflow.master_dependencies.map((id,index)=>{const master=masterById.get(id);return <div className="syd-ai-master-row" key={id+index}><span>{master?.name||id}</span><small>Live lookup available for supported master types</small></div>})}</div>}
          <div className="syd-ai-confirmation-checkpoint"><strong>Confirmation checkpoint</strong><p>{plan.workflow.confirmation_checkpoint}</p><span>Draft/review only — no save or posting action.</span></div>
        </div>}
        <div className="syd-ai-live-lookup"><button type="button" onClick={runMasterLookup} disabled={lookupLoading}><FiSearch/>{lookupLoading?"Checking company masters…":"Live-check identified master names"}</button><small>Read-only lookup, scoped to the selected company. Expense categories also include global categories.</small></div>
        {lookupError && <div className="syd-ai-error" role="alert">{lookupError}</div>}
        {masterResults.length>0&&<section className="syd-ai-master-results"><h3>Live master matches</h3><p className="syd-ai-muted">Choose a verified match for review. This selection is local to this proposal and does not change a form or record.</p>
          {masterResults.map((resultItem,index)=><div className="syd-ai-master-result-group" key={resultItem.masterType+index}><div className="syd-ai-master-result-title">{masterLabel(resultItem.masterType)} · searched “{resultItem.query}”</div>
            {resultItem.candidates.length===0?<div className="syd-ai-no-match">No matching records found.</div>:resultItem.candidates.map(candidate=><button type="button" className={"syd-ai-candidate"+(selectedMasters[resultItem.masterType]?.id===candidate.id?" selected":"")} key={candidate.id} onClick={()=>toggleCandidate(resultItem.masterType,candidate)}><span>{candidateName(resultItem.masterType,candidate)}</span><small>{candidate.gstin||candidate.item_code||candidate.state||"Verified record"}</small>{selectedMasters[resultItem.masterType]?.id===candidate.id&&<FiCheckCircle/>}</button>)}
          </div>)}
          <button className="syd-ai-review-button" type="button" onClick={()=>setDraftReviewOpen(v=>!v)}>{draftReviewOpen?"Hide draft review":"Open draft review"} ({selectedCount} selected master{selectedCount===1?"":"s"})</button>
          {draftReviewOpen&&<div className="syd-ai-draft-review"><h3>Draft review — not saved</h3><p>Company: <strong>{currentCompany?.company_name||"Not selected"}</strong></p><p>Intent: <strong>{plan?.intent||"—"}</strong></p><p>Screen: <strong>{plan?.screen_id||"—"}</strong></p><div className="syd-ai-draft-fields"><h4>Proposed values</h4>{(plan?.fields||[]).map((field,i)=><div key={field.field_id+i}><span>{field.field_id}</span><strong>{field.value??"—"}</strong></div>)}</div><h4>Confirmed master choices (review only)</h4>{Object.entries(selectedMasters).map(([type,record])=><div className="syd-ai-selected-master" key={type}><span>{masterLabel(type)}</span><strong>{candidateName(type,record)}</strong></div>)}<div className="syd-ai-review-warning">Draft preparation validates only audited fields. No saving or posting occurs. Form handoff is limited to supported audited screens.</div><button type="button" className="syd-ai-prepare-button" onClick={prepareDraft}>Validate draft for form handoff</button>{preparedDraft&&<div className="syd-ai-prepared-result"><strong>{preparedDraft.ok?"Draft validation passed":"Draft validation needs attention"}</strong>{draftErrors.length>0&&<ul>{draftErrors.map((e,i)=><li key={i}>{e}</li>)}</ul>}{preparedDraft.ok&&<button type="button" className="syd-ai-open-form" onClick={openPreparedForm}>Open target form with draft</button>}</div>}</div>}
        </section>}
        <div className="syd-ai-safe-note"><FiShield/><span>Proposal only. Master search is read-only and company-scoped. No navigation, form changes, transaction writes, or accounting posting were executed.</span></div>
        {result.requestId&&<small className="syd-ai-request-id">Request ID: {result.requestId}</small>}
      </section>}
      <section className="syd-ai-safety"><FiShield/><div><strong>Controlled by you</strong><p>Live master lookup is read-only. Draft review is in-memory only. Any future write requires deterministic validation, server-side permissions and explicit confirmation.</p></div></section>
    </main>
  );
}
