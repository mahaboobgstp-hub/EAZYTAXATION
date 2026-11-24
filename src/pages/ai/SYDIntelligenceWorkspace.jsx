import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { FiZap, FiSend, FiCompass, FiClipboard, FiShield, FiRefreshCw } from "react-icons/fi";
import { useCompany } from "../../context/CompanyContext";
import { interpretSYDCommand } from "../../services/ai/sydIntelligenceService";
import { registerSYDWebScreens, getSYDWebScreenByRoute } from "../../ai/registry/webScreenKnowledge";
import "../../css/ai/SYDIntelligenceWorkspace.css";

export default function SYDIntelligenceWorkspace() {
  const { currentCompany } = useCompany();
  const location = useLocation();
  const [command, setCommand] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => { registerSYDWebScreens(); }, []);
  const currentScreen = useMemo(() => getSYDWebScreenByRoute(location.pathname), [location.pathname]);

  const submit = async (event) => {
    event?.preventDefault();
    if (!command.trim() || loading) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const response = await interpretSYDCommand({
        text: command, company: currentCompany, currentScreenId: currentScreen?.screenId || null,
        platform: "web",
      });
      setResult(response);
    } catch (err) {
      setError(err?.message || "SYD Intelligence is unavailable. Please try again.");
    } finally { setLoading(false); }
  };

  const plan = result?.plan;
  const screens = ["Navigate to Sales Invoice", "Help me understand accounting for this company", "How do I record an expense?"];

  return (
    <main className="syd-ai-workspace">
      <header className="syd-ai-hero">
        <div className="syd-ai-brand-icon"><FiZap /></div>
        <div>
          <h1>SYD Intelligence</h1>
          <p>Understand your business. Assist with your workflow. Keep you in control.</p>
        </div>
      </header>

      <section className="syd-ai-context">
        <div><span className="syd-ai-context-label">Company context</span><strong>{currentCompany?.company_name || "No company selected"}</strong></div>
        <div><span className="syd-ai-context-label">Operating mode</span><strong>{currentCompany?.accounting_enabled ? "Billing + Accounting" : "Billing only"}</strong></div>
        <div><span className="syd-ai-context-label">Current screen</span><strong>{currentScreen?.name || "General workspace"}</strong></div>
      </section>

      <section className="syd-ai-card">
        <h2>What can I help you with?</h2>
        <p className="syd-ai-muted">Ask a question or describe a task in everyday language. SYD will return a proposed plan; it will not navigate, fill, save, or post anything.</p>
        <form onSubmit={submit} className="syd-ai-form">
          <textarea value={command} onChange={e => setCommand(e.target.value)} placeholder="Example: I want to create a sales invoice for a customer…" rows={4} maxLength={3000} />
          <div className="syd-ai-form-footer"><span>{command.length}/3000</span><button type="submit" disabled={loading || !command.trim()}>{loading ? <><FiRefreshCw className="syd-ai-spin"/> Thinking…</> : <><FiSend/> Ask SYD</>}</button></div>
        </form>
        <div className="syd-ai-suggestions">
          {screens.map(s => <button key={s} type="button" onClick={() => setCommand(s)}>{s}</button>)}
        </div>
      </section>

      {error && <div className="syd-ai-error" role="alert">{error}</div>}
      {result && (
        <section className="syd-ai-result syd-ai-card">
          <div className="syd-ai-result-heading"><div className="syd-ai-result-icon"><FiClipboard/></div><div><h2>Proposed response</h2><span className="syd-ai-intent-chip">{plan?.intent?.replaceAll("_"," ") || "Plan"}</span></div></div>
          <p className="syd-ai-response">{plan?.response || "No response was returned."}</p>
          {plan?.screen_id && <div className="syd-ai-result-line"><FiCompass/><span>Suggested screen: <strong>{plan.screen_id}</strong></span></div>}
          {Array.isArray(plan?.fields) && plan.fields.length > 0 && <div className="syd-ai-proposed-fields"><h3>Suggested field values</h3>{plan.fields.map((field,index)=><div className="syd-ai-field-row" key={field.field_id+index}><span>{field.field_id}</span><strong>{field.value ?? "—"}</strong></div>)}</div>}
          {Array.isArray(plan?.missing_information) && plan.missing_information.length > 0 && <div className="syd-ai-missing"><h3>Information needed</h3><ul>{plan.missing_information.map((item,index)=><li key={index}>{item}</li>)}</ul></div>}
          <div className="syd-ai-safe-note"><FiShield/><span>Proposal only. No navigation, form changes, database writes, or accounting posting were executed.</span></div>
          {result.requestId && <small className="syd-ai-request-id">Request ID: {result.requestId}</small>}
        </section>
      )}
      <section className="syd-ai-safety"><FiShield/><div><strong>Controlled by you</strong><p>SYD Intelligence is in proposal mode for this stage. Every future form-preparation or financial action will require deterministic validation, permission checks and your confirmation.</p></div></section>
    </main>
  );
}
