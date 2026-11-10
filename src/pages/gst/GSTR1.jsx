import React, { useEffect, useMemo, useState } from "react";
import { useCompany } from "../../context/CompanyContext";
import {
  FiFileText, FiDownload, FiUploadCloud, FiInfo, FiClock,
  FiRefreshCw, FiCheckCircle, FiDollarSign, FiPercent,
  FiAlertCircle, FiExternalLink
} from "react-icons/fi";
import {
  getGSTR1Data, buildGSTR1, getGSTR1History,
  saveGSTR1History, markGSTR1Uploaded
} from "../../services/gstr1Service";
import "../../css/gst/GSTR1.css";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const now = new Date();
const currentFY = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
const YEARS = Array.from({ length: 7 }, (_, i) => {
  const y = currentFY - i;
  return { value: String(y), label: y + " – " + String(y + 1).slice(-2) };
});

const currency = value => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", minimumFractionDigits: 2
}).format(Number(value) || 0);

const dateTime = value => value
  ? new Date(value).toLocaleString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })
  : "—";

function GSTR1() {
  const { currentCompany, currentCompanyId, loading: companyLoading } = useCompany();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [financialYear, setFinancialYear] = useState(String(currentFY));
  const [invoices, setInvoices] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [warnings, setWarnings] = useState([]);

  const periodYear = Number(month) >= 4 ? Number(financialYear) : Number(financialYear) + 1;
  const selectedPeriod = MONTHS[Number(month) - 1] + " " + periodYear;

  const totals = useMemo(() => invoices.reduce((sum, invoice) => ({
    taxable: sum.taxable + Number(invoice.taxable_value || 0),
    gst: sum.gst + Number(invoice.cgst || 0) + Number(invoice.sgst || 0) + Number(invoice.igst || 0),
    invoiceValue: sum.invoiceValue + Number(invoice.total_amount || 0)
  }), { taxable: 0, gst: 0, invoiceValue: 0 }), [invoices]);

  const loadHistory = async () => {
    if (!currentCompanyId) { setHistory([]); return; }
    const rows = await getGSTR1History(currentCompanyId);
    setHistory(rows);
  };

  const loadData = async () => {
    if (!currentCompanyId) { setInvoices([]); setHistory([]); return; }
    setLoading(true);
    setError("");
    setWarnings([]);
    try {
      const [rows, historyRows] = await Promise.all([
        getGSTR1Data(currentCompanyId, month, financialYear),
        getGSTR1History(currentCompanyId)
      ]);
      setInvoices(rows);
      setHistory(historyRows);
    } catch (err) {
      setError(err.message || "Unable to load GSTR-1 data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!companyLoading) loadData();
  }, [currentCompanyId, companyLoading, month, financialYear]);

  const downloadJSON = async () => {
    if (!currentCompanyId || !currentCompany) {
      setError("Please select a company first.");
      return;
    }
    setGenerating(true);
    setError("");
    setWarnings([]);
    try {
      const result = buildGSTR1(currentCompany, invoices, month, financialYear);
      if (result.warnings.length) {
        setWarnings(result.warnings);
        throw new Error("Correct the invoice data warnings before generating the return file.");
      }

      const blob = new Blob([JSON.stringify(result.json, null, 2)], { type: "application/json" });
      if (blob.size > 5 * 1024 * 1024) {
        throw new Error("The file exceeds the GST portal's 5 MB upload limit. Split the return into smaller files.");
      }

      const fp = String(month).padStart(2, "0") + periodYear;
      const fileName = "GSTR1_" + currentCompany.gstin + "_" + fp + ".json";
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      await saveGSTR1History(currentCompanyId, {
        returnPeriod: selectedPeriod,
        financialYear: financialYear + "-" + String(Number(financialYear) + 1).slice(-2),
        fileName,
        invoiceCount: result.invoiceCount,
        taxableValue: result.taxableValue,
        totalGST: result.totalGST,
        invoiceValue: result.invoiceValue
      });
      await loadHistory();
    } catch (err) {
      setError(err.message || "Unable to generate JSON.");
    } finally {
      setGenerating(false);
    }
  };

  const openGSTPortal = () => {
    window.open("https://www.gst.gov.in/", "_blank", "noopener,noreferrer");
  };

  const handleMarkUploaded = async record => {
    if (!window.confirm("Confirm that this JSON file was successfully uploaded to the GST portal.")) return;
    try {
      await markGSTR1Uploaded(currentCompanyId, record.id);
      await loadHistory();
    } catch (err) {
      setError(err.message || "Unable to update filing history.");
    }
  };

  return (
    <main className="gstr1-page">
      <div className="gstr1-breadcrumb">
        <span>GST &amp; Taxes</span><span>›</span><strong>GSTR-1</strong>
      </div>

      <header className="gstr1-heading">
        <div>
          <h1>GSTR-1 (Details of Outward Supplies)</h1>
          <p>Prepare, download JSON and upload your GSTR-1 directly to the GST portal.</p>
        </div>
      </header>

      {error && (
        <div className="gstr1-alert">
          <FiAlertCircle /><span>{error}</span>
          <button type="button" onClick={() => setError("")}>×</button>
        </div>
      )}

      {!companyLoading && !currentCompanyId && (
        <div className="gstr1-alert"><FiAlertCircle />Select a company from the sidebar to continue.</div>
      )}

      <section className="gstr1-period-card">
        <div className="gstr1-period-left">
          <h3>Select Period</h3>
          <div className="gstr1-period-fields">
            <label>
              <span>Month <b>*</b></span>
              <select value={month} onChange={e => setMonth(e.target.value)}>
                {MONTHS.map((name, i) => <option key={name} value={String(i + 1)}>{name}</option>)}
              </select>
            </label>
            <label>
              <span>Financial Year <b>*</b></span>
              <select value={financialYear} onChange={e => setFinancialYear(e.target.value)}>
                {YEARS.map(year => <option key={year.value} value={year.value}>{year.label}</option>)}
              </select>
            </label>
          </div>
        </div>

        <div className="gstr1-how-card">
          <FiInfo />
          <div>
            <strong>How it works?</strong>
            <p>The JSON is prepared from your sales invoices (B2B, B2C and supported outward supplies) for the selected period. Review and validate the generated file before uploading it to the GST portal.</p>
          </div>
        </div>

        <div className="gstr1-period-actions">
          <button type="button" className="gstr1-btn gstr1-btn-outline" onClick={downloadJSON} disabled={loading || generating || !invoices.length}>
            <FiDownload />{generating ? "Generating..." : "Download JSON"}
          </button>
          <button type="button" className="gstr1-btn gstr1-btn-primary" onClick={openGSTPortal}>
            <FiUploadCloud />Upload to GST Portal <FiExternalLink />
          </button>
        </div>
      </section>

      <section className="gstr1-summary-grid">
        <div className="gstr1-summary-card">
          <div className="gstr1-summary-icon blue"><FiFileText /></div>
          <div><span>Total Invoices</span><strong>{loading ? "—" : invoices.length}</strong></div>
        </div>
        <div className="gstr1-summary-card">
          <div className="gstr1-summary-icon green"><FiDollarSign /></div>
          <div><span>Taxable Value</span><strong>{loading ? "—" : currency(totals.taxable)}</strong></div>
        </div>
        <div className="gstr1-summary-card">
          <div className="gstr1-summary-icon blue"><FiPercent /></div>
          <div><span>Total GST</span><strong>{loading ? "—" : currency(totals.gst)}</strong></div>
        </div>
        <div className="gstr1-summary-card">
          <div className="gstr1-summary-icon purple"><FiDollarSign /></div>
          <div><span>Invoice Value (Incl. GST)</span><strong>{loading ? "—" : currency(totals.invoiceValue)}</strong></div>
        </div>
      </section>

      {warnings.length > 0 && (
        <section className="gstr1-warning">
          <strong><FiAlertCircle />Invoice data needs attention</strong>
          {warnings.map((warning, i) => <p key={i}>{warning}</p>)}
        </section>
      )}

      <section className="gstr1-bottom-grid">
        <div className="gstr1-panel gstr1-generation-card">
          <div className="gstr1-section-title">
            <FiFileText /><h3>GSTR-1 – {selectedPeriod}</h3>
            <span className={invoices.length ? "gstr1-status-ready" : "gstr1-status-empty"}>{loading ? "Loading" : invoices.length ? "Data Ready" : "Not Prepared"}</span>
          </div>
          <div className="gstr1-empty-state">
            <div className="gstr1-empty-illustration"><FiFileText /><span>+</span></div>
            {loading ? <><h3>Loading sales data...</h3><p>Please wait while your invoices are retrieved.</p></>
              : invoices.length ? <><h3>{invoices.length} Sales Invoices Found</h3><p>Sales data is available for {selectedPeriod}. Generate your GSTR-1 JSON file.</p></>
              : <><h3>No data for the selected period</h3><p>No outward supply (sales) transactions found for {selectedPeriod}.</p></>}
            <button type="button" className="gstr1-btn gstr1-btn-primary" onClick={downloadJSON} disabled={loading || generating || !invoices.length}>
              <FiRefreshCw />{generating ? "Generating..." : "Generate GSTR-1 JSON"}
            </button>
          </div>
        </div>

        <div className="gstr1-panel gstr1-history-card">
          <div className="gstr1-history-heading">
            <div><FiClock /><h3>Filing History</h3></div>
            <button type="button" className="gstr1-refresh" onClick={() => loadHistory().catch(err => setError(err.message))} title="Refresh history"><FiRefreshCw /></button>
          </div>
          <div className="gstr1-table-wrap">
            <table className="gstr1-history-table">
              <thead><tr><th>Period</th><th>JSON Generated On</th><th>Uploaded On</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {history.length ? history.map(record => (
                  <tr key={record.id}>
                    <td>{record.return_period}</td>
                    <td>{dateTime(record.generated_at)}</td>
                    <td>{dateTime(record.uploaded_at)}</td>
                    <td><span className={record.status === "Uploaded" ? "gstr1-history-uploaded" : "gstr1-history-generated"}><FiCheckCircle />{record.status}</span></td>
                    <td><div className="gstr1-history-actions">
                      <button type="button" title="Open GST portal" onClick={openGSTPortal}><FiExternalLink /></button>
                      {record.status !== "Uploaded" && <button type="button" title="Mark as uploaded after portal confirmation" onClick={() => handleMarkUploaded(record)}><FiCheckCircle /></button>}
                    </div></td>
                  </tr>
                )) : <tr><td colSpan="5" className="gstr1-no-history">No filing history available.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      <p className="gstr1-disclaimer">The portal upload is completed manually on GST.gov.in. This screen records the upload status only after your confirmation.</p>
    </main>
  );
}

export default GSTR1;
