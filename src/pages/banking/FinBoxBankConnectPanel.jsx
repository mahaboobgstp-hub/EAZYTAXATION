import React, { useEffect, useState } from "react";
import { checkFinBoxReadiness, getBankFeedStatus } from "../../services/bankFeedService";
import "./FinBoxBankConnectPanel.css";

export default function FinBoxBankConnectPanel({ companyId }) {
  const [readiness, setReadiness] = useState(null);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = async () => {
    if (!companyId) return;
    setLoading(true);
    setError("");
    try {
      const [health, status] = await Promise.all([
        checkFinBoxReadiness(companyId),
        getBankFeedStatus(companyId)
      ]);
      setReadiness(health);
      setConnections(status.connections || []);
    } catch (e) {
      setError(e.message || "Unable to check bank-feed readiness.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, [companyId]);

  return (
    <section className="finbox-readiness-panel">
      <div className="finbox-readiness-head">
        <div>
          <span className="finbox-eyebrow">AUTOMATIC BANK FEEDS</span>
          <h3>FinBox BankConnect</h3>
          <p>Secure bank-feed integration for SYD web and Android.</p>
        </div>
        <button type="button" onClick={refresh} disabled={loading}>
          {loading ? "Checking…" : "Refresh status"}
        </button>
      </div>
      {error && <div className="finbox-inline-error">{error}</div>}
      <div className="finbox-readiness-status">
        <span className={readiness?.adapter_status === "ready" ? "finbox-status-dot ready" : "finbox-status-dot"} />
        <div>
          <b>{readiness?.adapter_status === "ready" ? "Provider adapter ready" : "Waiting for FinBox API contract"}</b>
          <small>{readiness?.message || "Checking secure backend configuration…"}</small>
        </div>
      </div>
      {readiness && (
        <div className="finbox-check-grid">
          <span>API key <b>{readiness.credentials_present ? "Present" : "Not added"}</b></span>
          <span>Configuration <b>{readiness.configuration_items_present}/{readiness.configuration_items_required}</b></span>
          <span>Mode <b>{readiness.mode}</b></span>
          <span>Saved connections <b>{connections.length}</b></span>
        </div>
      )}
      {readiness?.missing_configuration?.length > 0 && (
        <small className="finbox-muted">Backend secrets still required: {readiness.missing_configuration.join(", ")}</small>
      )}
      <div className="finbox-readiness-note">
        Bank consent and live transaction fetching remain disabled until FinBox supplies its current API documentation, sandbox credentials and callback requirements. No bank password, PIN or OTP is collected by SYD.
      </div>
      {connections.length > 0 && (
        <div className="finbox-connection-list">
          {connections.map((item) => (
            <div key={item.id}>
              <b>{item.provider.toUpperCase()} · {item.connection_status}</b>
              <small>Refresh: {item.refresh_frequency} · Last sync: {item.last_sync_at ? new Date(item.last_sync_at).toLocaleString("en-IN") : "Not synced yet"}</small>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
