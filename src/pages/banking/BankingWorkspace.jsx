import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  FiArrowDownLeft, FiArrowUpRight, FiUploadCloud,
  FiPlus, FiRefreshCw, FiSearch, FiDownload, FiCheck, FiX, FiLink,
  FiMoreVertical, FiCalendar, FiChevronDown, FiSliders, FiCheckCircle,
  FiAlertCircle, FiClock, FiCreditCard, FiFileText, FiSettings,
  FiArrowRight, FiZap, FiEye
} from "react-icons/fi";
import { useCompany } from "../../context/CompanyContext";
import "../../css/banking/BankingWorkspace.css";

const initialTransactions = [
  { id: 1, date: "11 Jul 2026", narration: "NEFT - ABC Suppliers Pvt Ltd", ref: "NEFT452316", amount: -250000, type: "Purchase / Supplier Payment", ledger: "Purchase - ABC Suppliers", status: "To Post" },
  { id: 2, date: "10 Jul 2026", narration: "RTGS - Customer Payment", ref: "RTGS993210", amount: 380000, type: "Receipt from Customer", ledger: "Debtors - M/s XYZ", status: "Posted" },
  { id: 3, date: "09 Jul 2026", narration: "IMPS - Electricity Bill", ref: "IMPS776221", amount: -42560, type: "Expenses", ledger: "Electricity Expenses", status: "Unclassified" },
  { id: 4, date: "09 Jul 2026", narration: "UPI - Office Expenses", ref: "UPI554990", amount: -6850, type: "Expenses", ledger: "Office Expenses", status: "Unclassified" },
  { id: 5, date: "08 Jul 2026", narration: "Charges - NEFT", ref: "CHG77231", amount: -35.4, type: "Bank Charges", ledger: "Bank Charges", status: "To Post" },
  { id: 6, date: "07 Jul 2026", narration: "Own Account Transfer", ref: "TRF118820", amount: 150000, type: "Contra / Transfer", ledger: "ICICI Current Account", status: "Posted" }
];
const money = value => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Math.abs(Number(value) || 0));
const bankAccounts = [
  { name: "HDFC Current Account", bank: "HDFC Bank", number: "•••• 5678", balance: 4876230, date: "11 Jul 2026", color: "hdfc" },
  { name: "SBI Current Account", bank: "State Bank of India", number: "•••• 9012", balance: 1240560.75, date: "10 Jul 2026", color: "sbi" },
  { name: "ICICI Current Account", bank: "ICICI Bank", number: "•••• 4567", balance: 892130, date: "09 Jul 2026", color: "icici" }
];
const categories = ["Purchase / Supplier Payment", "Receipt from Customer", "Expenses", "Bank Charges", "Contra / Transfer", "Loan / EMI", "Salary Payment", "Tax Payment", "Capital / Investment", "Other"];

export default function BankingWorkspace() {
  const { currentCompany } = useCompany();
  const location = useLocation();
  const [tab, setTab] = useState(() =>
    new URLSearchParams(location.search).get("tab") === "reconciliation"
      ? "Reconciliation"
      : "Overview"
  );

  useEffect(() => {
    const requestedTab = new URLSearchParams(location.search).get("tab");
    if (requestedTab === "reconciliation") setTab("Reconciliation");
    else if (!requestedTab) setTab("Overview");
  }, [location.search]);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [selected, setSelected] = useState([1, 3]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All Transactions");
  const [account, setAccount] = useState("HDFC Current Account");
  const [showImport, setShowImport] = useState(false);
  const [importStep, setImportStep] = useState(1);
  const [importMethod, setImportMethod] = useState("aggregator");
  const [selectedBanks, setSelectedBanks] = useState(["HDFC Bank", "SBI"]);
  const [fileName, setFileName] = useState("");
  const [notice, setNotice] = useState("");
  const [reconMatched, setReconMatched] = useState(false);
  const [period, setPeriod] = useState("Apr 2025");
  const [settingsTab, setSettingsTab] = useState("Account Aggregator");

  const visibleTransactions = useMemo(() => transactions.filter(row => {
    const matchesSearch = !search || [row.narration, row.ref, row.ledger].join(" ").toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "All Transactions" || row.status === filter;
    return matchesSearch && matchesFilter;
  }), [transactions, search, filter]);

  const updateTransaction = (id, key, value) => setTransactions(rows => rows.map(row => row.id === id ? { ...row, [key]: value } : row));
  const postSelected = () => {
    setTransactions(rows => rows.map(row => selected.includes(row.id) ? { ...row, status: "Posted" } : row));
    setSelected([]);
    setNotice("Selected transactions have been marked as posted in this UI preview. Live voucher posting will be connected in the accounting integration phase.");
  };
  const toggleSelected = id => setSelected(rows => rows.includes(id) ? rows.filter(x => x !== id) : [...rows, id]);

  return <main className="banking-page">
    <div className="banking-breadcrumb">Accounting <span>/</span> Banking <span>/</span> {tab}</div>
    <header className="banking-heading">
      <div><div className="banking-eyebrow">CASH & BANK MANAGEMENT</div><h1>Banking</h1><p>Connect accounts, classify transactions and reconcile your books.</p></div>
      <div className="banking-heading-actions">
        <button className="bank-btn bank-btn-light" onClick={() => setTab("Bank Accounts")}><FiPlus/> Add Bank Account</button>
        <button className="bank-btn bank-btn-primary" onClick={() => { setShowImport(true); setImportStep(1); }}><FiUploadCloud/> Import Statement</button>
      </div>
    </header>

    <nav className="banking-tabs">
      {["Overview", "Transactions", "Reconciliation", "Bank Accounts", "Settings"].map(item => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}
    </nav>

    {notice && <div className="banking-notice"><FiCheckCircle/><span>{notice}</span><button onClick={() => setNotice("")}><FiX/></button></div>}

    {tab === "Overview" && <section className="banking-content">
      <div className="banking-metrics">
        <Metric icon={<FiCreditCard/>} label="Connected Bank Accounts" value="3" hint="Active" tone="blue"/>
        <Metric icon={<FiFileText/>} label="Unclassified Transactions" value={transactions.filter(x => x.status === "Unclassified").length + 40} hint="Needs Action" tone="orange"/>
        <Metric icon={<FiClock/>} label="Pending Reconciliation" value="1" hint="Apr 2025" tone="pink"/>
        <Metric icon={<FiCheckCircle/>} label="Last Import" value="11 Jul 2026" hint="Up to date" tone="green"/>
      </div>
      <div className="banking-overview-grid">
        <section className="bank-card bank-accounts-card"><div className="bank-card-heading"><div><h2>Bank Accounts (3)</h2><p>Your connected business accounts</p></div><button className="bank-text-button" onClick={() => setTab("Bank Accounts")}>View all <FiArrowRight/></button></div>
          <div className="bank-table-wrap"><table className="bank-table"><thead><tr><th>Bank Account</th><th>Account No.</th><th>Bank</th><th>Closing Balance</th><th>Last Statement</th><th></th></tr></thead><tbody>{bankAccounts.map(row => <tr key={row.name}><td><strong>{row.name}</strong></td><td>{row.number}</td><td>{row.bank}</td><td className="bank-amount">{money(row.balance)}</td><td>{row.date}</td><td><button className="bank-icon-button"><FiMoreVertical/></button></td></tr>)}</tbody></table></div>
        </section>
        <section className="bank-card bank-trend-card"><div className="bank-card-heading"><div><h2>Bank Balance Trend</h2><p>Consolidated closing balance</p></div><span className="bank-period">Apr – Jul</span></div><div className="bank-chart"><div className="bank-chart-y"><span>60L</span><span>45L</span><span>30L</span><span>15L</span><span>0</span></div><svg viewBox="0 0 420 190" role="img" aria-label="Bank balance trend chart"><defs><linearGradient id="bankFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#7550e8" stopOpacity=".22"/><stop offset="100%" stopColor="#7550e8" stopOpacity="0"/></linearGradient></defs><path d="M0 145 C45 138 55 112 92 119 S150 126 184 94 S245 111 280 70 S340 82 420 22 L420 180 L0 180Z" fill="url(#bankFill)"/><path d="M0 145 C45 138 55 112 92 119 S150 126 184 94 S245 111 280 70 S340 82 420 22" fill="none" stroke="#7047e8" strokeWidth="3" strokeLinecap="round"/><circle cx="420" cy="22" r="5" fill="#7047e8"/></svg></div><div className="bank-chart-x"><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span></div></section>
      </div>
      <section className="bank-card bank-recent-card"><div className="bank-card-heading"><div><h2>Recent Bank Transactions</h2><p>Latest activity across connected accounts</p></div><button className="bank-text-button" onClick={() => setTab("Transactions")}>View transactions <FiArrowRight/></button></div><TransactionTable rows={transactions.slice(0,4)} compact/></section>
    </section>}

    {tab === "Transactions" && <section className="banking-content">
      <div className="banking-section-title"><div><h2>Bank Transactions – Classify & Post</h2><p>Review imported statement lines and map each transaction to the correct accounting entry.</p></div><div className="banking-heading-actions"><button className="bank-btn bank-btn-light" onClick={() => setNotice("Auto-classification preview completed. Review the suggested categories before posting.")}><FiZap/> Auto-Classify</button><button className="bank-btn bank-btn-primary" disabled={!selected.length} onClick={postSelected}><FiCheck/> Post Selected ({selected.length})</button></div></div>
      <div className="bank-filter-bar"><select value={account} onChange={e => setAccount(e.target.value)}>{bankAccounts.map(x => <option key={x.name}>{x.name}</option>)}</select><label className="bank-date-filter"><FiCalendar/><span>01 Apr 2025 – 11 Jul 2026</span><FiChevronDown/></label><select value={filter} onChange={e => setFilter(e.target.value)}><option>All Transactions</option><option>Unclassified</option><option>To Post</option><option>Posted</option></select><label className="bank-search"><FiSearch/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search narration, amount..."/></label></div>
      <div className="banking-status-tabs"><button className="active">All ({transactions.length})</button><button onClick={() => setFilter("Unclassified")}>Unclassified ({transactions.filter(x=>x.status==="Unclassified").length})</button><button onClick={() => setFilter("To Post")}>To Post ({transactions.filter(x=>x.status==="To Post").length})</button><button onClick={() => setFilter("Posted")}>Posted ({transactions.filter(x=>x.status==="Posted").length})</button></div>
      <section className="bank-card"><TransactionTable rows={visibleTransactions} selected={selected} onToggle={toggleSelected} onChange={updateTransaction}/></section>
      <p className="banking-footnote"><FiAlertCircle/> Posting is a preview action only. Actual journal, payment, receipt and purchase vouchers will be created after the accounting ledger integration is implemented.</p>
    </section>}

    {tab === "Reconciliation" && <section className="banking-content">
      <div className="banking-section-title"><div><h2>Bank Reconciliation</h2><p>Match statement transactions with accounting book entries.</p></div><button className="bank-btn bank-btn-primary" onClick={() => setReconMatched(true)}><FiRefreshCw/> Reconcile Now</button></div>
      <div className="bank-recon-controls"><label><span>Bank Account</span><select><option>HDFC Current Account (•••• 5678)</option><option>SBI Current Account (•••• 9012)</option><option>ICICI Current Account (•••• 4567)</option></select></label><label><span>Reconciliation Period</span><select value={period} onChange={e=>setPeriod(e.target.value)}><option>Apr 2025</option><option>May 2025</option><option>Jun 2025</option><option>Jul 2026</option></select></label><button className="bank-btn bank-btn-light"><FiDownload/> Download Report</button></div>
      <div className="banking-metrics recon-metrics"><Metric icon={<FiCreditCard/>} label="Bank Statement Balance" value="₹48,76,230.00" tone="blue"/><Metric icon={<FiBookOpenIcon/>} label="Book Balance" value="₹48,51,230.00" tone="purple"/><Metric icon={<FiCheckCircle/>} label="Matched" value={reconMatched ? "₹48,76,230.00" : "₹48,51,230.00"} tone="green"/><Metric icon={<FiAlertCircle/>} label="Unmatched (Statement)" value={reconMatched ? "₹0.00" : "₹25,000.00"} tone="orange"/><Metric icon={<FiX/>} label="Unmatched (Book)" value="₹0.00" tone="pink"/></div>
      <div className="banking-status-tabs"><button className="active">Unmatched in Bank (1)</button><button>Unmatched in Books (0)</button><button>Matched (312)</button></div>
      <section className="bank-card"><div className="bank-table-wrap"><table className="bank-table"><thead><tr><th></th><th>Date</th><th>Narration</th><th>Amount</th><th>Action</th></tr></thead><tbody>{reconMatched ? <tr><td colSpan="5" className="bank-empty"><FiCheckCircle/> All statement entries in this period are matched.</td></tr> : <tr><td><input type="checkbox"/></td><td>11 Jul 2025</td><td><strong>NEFT – ABC Transport</strong></td><td className="bank-negative">−₹25,000.00</td><td><button className="bank-btn bank-btn-primary bank-btn-small" onClick={() => setNotice("Match transaction panel is ready for the selected bank line.")}>Match</button></td></tr>}</tbody></table></div></section>
    </section>}

    {tab === "Bank Accounts" && <section className="banking-content">
      <div className="banking-section-title"><div><h2>Bank Accounts</h2><p>Manage the bank accounts linked to {currentCompany?.company_name || "your company"}.</p></div><button className="bank-btn bank-btn-primary" onClick={() => setShowImport(true)}><FiPlus/> Add Bank Account</button></div>
      <div className="bank-account-grid">{bankAccounts.map(row=><article className="bank-card bank-account-tile" key={row.name}><div className={"bank-logo "+row.color}>{row.bank.split(" ").map(x=>x[0]).join("").slice(0,3)}</div><div className="bank-account-status"><span className="bank-dot"/> Connected</div><h3>{row.name}</h3><p>{row.bank} · {row.number}</p><div className="bank-account-balance"><span>Available balance</span><strong>{money(row.balance)}</strong></div><div className="bank-account-actions"><button onClick={()=>{setAccount(row.name);setTab("Transactions")}}>View transactions</button><button aria-label="More options"><FiMoreVertical/></button></div></article>)}</div>
    </section>}

    {tab === "Settings" && <section className="banking-content">
      <div className="banking-section-title"><div><h2>Banking Settings</h2><p>Manage bank connections, categorisation and reconciliation preferences.</p></div></div>
      <div className="banking-settings-tabs">{["Bank Accounts","Account Aggregator","Transaction Rules","Reconciliation Rules"].map(x=><button key={x} className={settingsTab===x?"active":""} onClick={()=>setSettingsTab(x)}>{x}</button>)}</div>
      {settingsTab==="Account Aggregator" ? <section className="bank-card bank-aggregator-settings"><div className="bank-aggregator-intro"><div className="bank-aggregator-icon"><FiLink/></div><div><h3>Account Aggregator Connections</h3><p>Securely connect and manage bank accounts through an RBI-regulated Account Aggregator partner.</p></div></div>{bankAccounts.map(x=><div className="bank-connection-row" key={x.name}><div className={"bank-logo "+x.color}>{x.bank.split(" ").map(y=>y[0]).join("").slice(0,3)}</div><div><strong>{x.bank}</strong><small>Last sync: 11 Jul 2026 · 10:24 AM</small></div><span className="bank-connected">Connected</span><button className="bank-icon-button"><FiRefreshCw/></button></div>)}<button className="bank-btn bank-btn-primary" onClick={()=>setShowImport(true)}><FiPlus/> Connect Another Bank</button></section> : <section className="bank-card bank-settings-placeholder"><FiSettings/><h3>{settingsTab}</h3><p>Configure company-specific {settingsTab.toLowerCase()} for automatic bank processing.</p><button className="bank-btn bank-btn-light" onClick={()=>setNotice("Settings editor will be enabled with the banking database configuration.")}>Configure Rules</button></section>}
    </section>}

    {showImport && <div className="bank-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setShowImport(false);}}><section className="bank-import-modal" role="dialog" aria-modal="true" aria-labelledby="bank-import-title">
      <div className="bank-modal-heading"><div><div className="banking-eyebrow">BANKING</div><h2 id="bank-import-title">Import Bank Statements</h2><p>Connect your bank or upload a statement file.</p></div><button className="bank-icon-button" onClick={()=>setShowImport(false)}><FiX/></button></div>
      <div className="bank-import-steps"><span className={importStep>=1?"current":""}>1 <b>Select Bank</b></span><i/><span className={importStep>=2?"current":""}>2 <b>Import Data</b></span><i/><span className={importStep>=3?"current":""}>3 <b>Review & Confirm</b></span></div>
      {importStep===1 && <div className="bank-import-layout"><div><h3>Choose Import Method</h3><button className={"bank-method "+(importMethod==="aggregator"?"selected":"")} onClick={()=>setImportMethod("aggregator")}><FiLink/><span><b>Account Aggregator (Recommended)</b><small>Securely fetch statements from multiple banks via an RBI-regulated Account Aggregator.</small></span></button><button className={"bank-method "+(importMethod==="upload"?"selected":"")} onClick={()=>setImportMethod("upload")}><FiUploadCloud/><span><b>Upload Statement File</b><small>Upload PDF / CSV / Excel bank statement.</small></span></button></div><div><h3>{importMethod==="aggregator"?"Select Bank(s) to Connect":"Upload Statement"}</h3>{importMethod==="aggregator" ? <div className="bank-picker">{["HDFC Bank","ICICI Bank","SBI","Axis Bank","Kotak Mahindra","IndusInd Bank","Canara Bank","Other Bank"].map(x=><button key={x} className={selectedBanks.includes(x)?"selected":""} onClick={()=>setSelectedBanks(old=>old.includes(x)?old.filter(y=>y!==x):[...old,x])}><span className="bank-picker-mark">{x==="HDFC Bank"?"H":x==="ICICI Bank"?"i":x==="SBI"?"S":x==="Axis Bank"?"A":x[0]}</span>{x}{selectedBanks.includes(x)&&<FiCheck/>}</button>)}</div> : <label className="bank-file-drop"><FiUploadCloud/><b>{fileName||"Choose a bank statement file"}</b><small>PDF, CSV or XLSX · Maximum 10 MB</small><input type="file" accept=".pdf,.csv,.xlsx,.xls" onChange={e=>setFileName(e.target.files?.[0]?.name||"")}/></label>}</div></div>}
      {importStep===2 && <div className="bank-import-review"><div className="bank-import-success"><FiCheckCircle/><div><b>{importMethod==="aggregator"?"Bank connection consent required":"Statement file selected"}</b><p>{importMethod==="aggregator"?"The next live integration step will redirect to the partner consent journey. No bank credentials are collected in this ERP screen.":fileName||"No file selected"}</p></div></div><p className="banking-footnote">This screen is currently a UI preview. Account Aggregator consent, secure data retrieval and file parsing will be connected through a backend integration.</p></div>}
      {importStep===3 && <div className="bank-import-review"><FiCheckCircle className="bank-review-check"/><h3>Import request prepared</h3><p>Your selected bank and import method are ready for integration.</p></div>}
      <div className="bank-modal-actions"><button className="bank-btn bank-btn-light" onClick={()=>importStep===1?setShowImport(false):setImportStep(importStep-1)}>{importStep===1?"Cancel":"Back"}</button><button className="bank-btn bank-btn-primary" disabled={importStep===1 && importMethod==="aggregator" && selectedBanks.length===0 || importStep===1 && importMethod==="upload" && !fileName} onClick={()=>importStep<3?setImportStep(importStep+1):(setShowImport(false),setNotice("Import flow preview completed. Live bank import will be enabled after integration."))}>{importStep===3?"Finish":"Continue"} <FiArrowRight/></button></div>
    </section></div>}
  </main>;
}

function Metric({icon,label,value,hint,tone="blue"}) { return <article className="bank-metric"><div className={"bank-metric-icon "+tone}>{icon}</div><div className="bank-metric-copy"><span>{label}</span><strong>{value}</strong><small className={tone}>{hint}</small></div></article>; }
function TransactionTable({rows,selected=[],onToggle,onChange,compact=false}) {
  return <div className="bank-table-wrap"><table className="bank-table bank-transactions-table"><thead><tr>{!compact&&<th><input type="checkbox" aria-label="Select all"/></th>}<th>Date</th><th>Narration / Description</th><th>Bank Ref.</th><th>Amount (₹)</th><th>Type / Purpose</th><th>Accounting Mapping</th><th>Status</th></tr></thead><tbody>{rows.map(row=><tr key={row.id}>{!compact&&<td><input type="checkbox" checked={selected.includes(row.id)} onChange={()=>onToggle?.(row.id)} aria-label={"Select "+row.narration}/></td>}<td>{row.date}</td><td><strong>{row.narration}</strong></td><td>{row.ref}</td><td className={row.amount<0?"bank-negative":"bank-positive"}>{row.amount<0?"−":"+"}{money(row.amount)}</td><td>{compact?row.type:<select value={row.type} onChange={e=>onChange?.(row.id,"type",e.target.value)}>{categories.map(x=><option key={x}>{x}</option>)}</select>}</td><td>{compact?row.ledger:<input className="bank-ledger-input" value={row.ledger} onChange={e=>onChange?.(row.id,"ledger",e.target.value)}/>}</td><td><span className={"bank-status "+row.status.toLowerCase().replaceAll(" ","-")}>{row.status}</span></td></tr>)}</tbody></table>{!rows.length&&<div className="bank-empty">No transactions match your filters.</div>}</div>;
}
function FiBookOpenIcon(){return <FiFileText/>;}
