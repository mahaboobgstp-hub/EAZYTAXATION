import React, { useRef, useState } from "react";
import "./BulkTransactionImport.css";

const TEMPLATES = {
  sales: {
    title: "Sales",
    description: "Import multiple sales invoices using one row per invoice item.",
    headers: ["Invoice Number","Invoice Date","Customer Name","Customer GSTIN","Place of Supply","Sale Type","Item Name","HSN/SAC","Quantity","Unit","Rate","Discount %","GST Rate %","Cess Rate %","Other Charges","Round Off","Narration"],
    sample: ["INV-2026-001","2026-11-01","ABC Traders","37ABCDE1234F1Z5","Andhra Pradesh","CREDIT","Office Chair","9401","2","Nos","4500","0","18","0","0","0","November office furniture sale"]
  },
  purchases: {
    title: "Purchases",
    description: "Import supplier invoices with one row for each purchased item.",
    headers: ["Supplier Invoice Number","Supplier Invoice Date","Vendor Name","Vendor GSTIN","Place of Supply","GST Treatment","Item Name","HSN/SAC","Quantity","Unit","Rate","Discount %","GST Rate %","Other Charges","Round Off","Narration"],
    sample: ["SUP-INV-104","2026-11-02","Sri Lakshmi Suppliers","37ABCDE1234F1Z5","Andhra Pradesh","Regular Supplier (Registered)","Raw Material","7204","100","Kg","52","0","18","0","0","November raw material purchase"]
  },
  expenses: {
    title: "Expenses",
    description: "Import expense vouchers with supplier, expense category and tax details.",
    headers: ["Expense Number","Expense Date","Expense Category","Payee / Supplier Name","Supplier GSTIN","Supplier Invoice Number","Supplier Invoice Date","GST Treatment","Description","HSN/SAC","Quantity","Unit","Rate","Discount %","GST Rate %","Other Charges","Payment Status","Payment Mode","Payment Account","Reference Number","Narration"],
    sample: ["","2026-11-03","Office Expenses","ABC Office Supplies","","BILL-088","2026-11-03","No GST","Stationery and office supplies","","1","Lot","2500","0","0","0","Unpaid","","","","Monthly office stationery"]
  },
  receipts: {
    title: "Receipts",
    description: "Import customer receipts, advances and invoice-linked collections.",
    headers: ["Receipt Number","Receipt Date","Received From","Customer GSTIN","Against Invoice Number","Receipt Mode","Deposit Account","Reference / UTR Number","Amount Received","Narration"],
    sample: ["","2026-11-04","ABC Traders","37ABCDE1234F1Z5","INV-2026-001","Bank Transfer","HDFC Current Account","UTR123456789","5000","Part payment against invoice"]
  },
  payments: {
    title: "Payments",
    description: "Import supplier, expense and advance payments.",
    headers: ["Payment Number","Payment Date","Paid To","Against Document Type","Against Document Number","Payment Mode","Paid From Account","Reference / UTR Number","Amount Paid","Narration"],
    sample: ["","2026-11-05","Sri Lakshmi Suppliers","Purchase Invoice","SUP-INV-104","NEFT","HDFC Current Account","UTR987654321","25000","Part payment against supplier invoice"]
  }
};

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
}

function parseCsvPreview(text) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"' && quoted && text[i + 1] === '"') { cell += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(cell); cell = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(cell);
      if (row.some(value => value.trim())) rows.push(row);
      row = []; cell = "";
    } else cell += char;
  }
  row.push(cell);
  if (row.some(value => value.trim())) rows.push(row);
  return rows;
}

export default function BulkTransactionImport({ kind }) {
  const config = TEMPLATES[kind];
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [notice, setNotice] = useState("");

  if (!config) return null;

  function downloadTemplate() {
    const content = [config.headers, config.sample].map(row => row.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `eazytaxation-${kind}-import-template.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function handleFileChange(event) {
    const selected = event.target.files?.[0] || null;
    setFile(selected);
    setRows([]);
    setNotice("");
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith(".csv")) {
      setNotice("Please select a .csv file.");
      setFile(null);
      return;
    }
    const content = await selected.text();
    const parsed = parseCsvPreview(content);
    setRows(parsed);
    if (parsed.length < 2) setNotice("The file should contain a header row and at least one transaction row.");
    else if (parsed[0].length !== config.headers.length) setNotice(`Template has ${config.headers.length} columns. Your file has ${parsed[0].length} columns. Please use the downloaded template.`);
  }

  function closeDialog() {
    setOpen(false);
    setFile(null);
    setRows([]);
    setNotice("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleSubmit() {
    if (!file || rows.length < 2 || rows[0].length !== config.headers.length) {
      setNotice("Select a CSV file that follows the downloaded template before continuing.");
      return;
    }
    setNotice("Screen preview only: database verification and transaction posting will be connected after the UI is approved.");
  }

  return (
    <>
      <section className="bulk-import-card">
        <div className="bulk-import-copy">
          <span className="bulk-import-eyebrow">BULK TRANSACTION IMPORT</span>
          <h3>Import {config.title}</h3>
          <p>{config.description}</p>
        </div>
        <div className="bulk-import-actions">
          <button type="button" className="bulk-import-primary" onClick={() => { setOpen(true); setNotice(""); }}>
            <span aria-hidden="true">↑</span> Import {config.title}
          </button>
          <button type="button" className="bulk-import-secondary" onClick={downloadTemplate}>
            <span aria-hidden="true">↓</span> Download CSV Template
          </button>
        </div>
      </section>

      {open && (
        <div className="bulk-import-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) closeDialog(); }}>
          <section className="bulk-import-dialog" role="dialog" aria-modal="true" aria-labelledby={`bulk-import-title-${kind}`}>
            <header className="bulk-import-dialog-header">
              <div>
                <span className="bulk-import-eyebrow">CSV UPLOAD</span>
                <h2 id={`bulk-import-title-${kind}`}>Import {config.title}</h2>
                <p>Upload the completed {config.title.toLowerCase()} template to review the file.</p>
              </div>
              <button type="button" className="bulk-import-close" onClick={closeDialog} aria-label="Close">×</button>
            </header>

            <button type="button" className="bulk-import-dropzone" onClick={() => inputRef.current?.click()}>
              <span className="bulk-import-file-icon" aria-hidden="true">CSV</span>
              <strong>{file ? file.name : "Choose a CSV file to upload"}</strong>
              <span>{file ? `${(file.size / 1024).toFixed(1)} KB · ${Math.max(rows.length - 1, 0)} data rows detected` : "Browse your device · .csv files only"}</span>
              <span className="bulk-import-browse">Browse files</span>
            </button>
            <input ref={inputRef} className="bulk-import-hidden-input" type="file" accept=".csv,text/csv" onChange={handleFileChange} />

            <div className="bulk-import-template-note">
              <span>Don't have a template?</span>
              <button type="button" onClick={downloadTemplate}>Download {config.title} CSV template</button>
            </div>

            {notice && <div className="bulk-import-notice" role="status">{notice}</div>}

            {rows.length > 0 && (
              <div className="bulk-import-preview">
                <div className="bulk-import-preview-heading">
                  <strong>File preview</strong>
                  <span>{Math.max(rows.length - 1, 0)} transaction rows</span>
                </div>
                <div className="bulk-import-table-wrap">
                  <table>
                    <thead><tr>{rows[0].slice(0, 5).map((heading, index) => <th key={index}>{heading || `Column ${index + 1}`}</th>)}{rows[0].length > 5 && <th>…</th>}</tr></thead>
                    <tbody>{rows.slice(1, 4).map((row, rowIndex) => <tr key={rowIndex}>{row.slice(0, 5).map((value, index) => <td key={index}>{value || "—"}</td>)}{row.length > 5 && <td>…</td>}</tr>)}</tbody>
                  </table>
                </div>
                {rows.length > 4 && <span className="bulk-import-more">Showing first 3 data rows.</span>}
              </div>
            )}

            <footer className="bulk-import-dialog-footer">
              <button type="button" className="bulk-import-secondary" onClick={closeDialog}>Cancel</button>
              <button type="button" className="bulk-import-primary" onClick={handleSubmit} disabled={!file}>Submit Import</button>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
