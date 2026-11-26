import React, { useEffect, useMemo, useState } from "react";
import BulkTransactionImport from "../../components/BulkTransactionImport";
import { useLocation } from "react-router-dom";
import {
  FiArrowDownLeft, FiArrowUpRight, FiUploadCloud,
  FiPlus, FiRefreshCw, FiSearch, FiDownload, FiCheck, FiX, FiLink,
  FiMoreVertical, FiCalendar, FiChevronDown, FiSliders, FiCheckCircle,
  FiAlertCircle, FiClock, FiCreditCard, FiFileText, FiSettings,
  FiArrowRight, FiZap, FiEye
} from "react-icons/fi";
import { useCompany } from "../../context/CompanyContext";
import { supabase } from "../../supabase/supabaseClient";
import { loadTransactionIntelligence, classifySYDTransaction, saveSYDClassificationRule } from "../../services/ai/transactionIntelligenceService";
import "../../css/banking/BankingWorkspace.css";
import { postBankStatementLine } from "../../services/sourceVoucherPostingService";

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
const categories = ["Unclassified", "Purchase / Supplier Payment", "Receipt from Customer", "Expenses", "Bank Charges", "Contra / Transfer", "Loan / EMI", "Salary Payment", "Tax Payment", "Capital / Investment", "Other"];

export default function BankingWorkspace() {
  const { currentCompany } = useCompany();
  const location = useLocation();
  const [tab, setTab] = useState(() =>
    new URLSearchParams(location.search).get("tab") === "reconciliation"
      ? "Reconciliation"
      : "Overview"
  );

  const [transactions, setTransactions] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All Transactions");
  const [account, setAccount] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [importStep, setImportStep] = useState(1);
  const [importMethod, setImportMethod] = useState("aggregator");
  const [selectedBanks, setSelectedBanks] = useState(["HDFC Bank", "SBI"]);
  const [fileName, setFileName] = useState("");
  const [notice, setNotice] = useState("");
  const [reconMatched, setReconMatched] = useState(false);
  const [period, setPeriod] = useState("Apr 2025");
  const [settingsTab, setSettingsTab] = useState("Account Aggregator");
  const [realAccounts, setRealAccounts] = useState([]);
  const [accountLedgers, setAccountLedgers] = useState([]);
  const [accountModal, setAccountModal] = useState(false);
  const [accountForm, setAccountForm] = useState({bank_name:"",account_holder_name:"",account_number:"",ifsc:"",branch_name:"",account_type:"Current"});
  const [accountSaving, setAccountSaving] = useState(false);
  const [manualFile, setManualFile] = useState(null);
  const [manualAccountId, setManualAccountId] = useState("");
  const [parsedLines, setParsedLines] = useState([]);
  const [manualError, setManualError] = useState("");
  const [manualSaving, setManualSaving] = useState(false);
  const companyId = currentCompany?.id || currentCompany?.company_id;
  const loadBankingData = async () => {
    if (!companyId) return;
    const [{data: accounts, error: accountError}, {data: lines, error: linesError}] = await Promise.all([
      supabase.from("bank_account_profiles").select("*").eq("company_id",companyId).eq("is_active",true).order("created_at",{ascending:true}),
      supabase.from("bank_statement_lines").select("*").eq("company_id",companyId).order("statement_date",{ascending:false})
    ]);
    if(accountError) setNotice("Bank accounts could not be loaded: "+accountError.message); else setRealAccounts(accounts||[]);
    if(linesError) setNotice("Transactions could not be loaded: "+linesError.message);
    else { let intelligenceContext=null; try { intelligenceContext=await loadTransactionIntelligence(companyId); } catch(intelligenceError) { console.warn("SYD transaction intelligence unavailable:",intelligenceError.message); } setTransactions((lines||[]).map(line=>{ const tx={id:line.id,accountId:line.bank_account_id,date:line.statement_date,narration:line.narration||"",description:line.narration||"",reference:line.reference_number||"",ref:line.reference_number||"",amount:(line.direction==="Debit"?-1:1)*Number(line.amount||0),direction:line.direction==="Debit"?"debit":"credit",partyName:line.party_name||"",gstin:line.gstin||"",type:line.category||"Unclassified",ledger:line.ledger_name||"",ledgerId:line.ledger_id||"",status:line.classification_status||"Unclassified",raw:line}; const intelligence=intelligenceContext?classifySYDTransaction(tx,intelligenceContext):null; return {...tx,intelligence,...(intelligence?.autoApply&&intelligence.ledger?{ledgerId:intelligence.ledger.id,ledger:intelligence.ledger.ledger_name,type:intelligence.type,status:"To Post"}:{})}; })); }
  };
  useEffect(()=>{loadBankingData();},[companyId]);
  useEffect(()=>{if(!companyId)return;supabase.from("chart_of_accounts").select("id,ledger_name,ledger_code").eq("company_id",companyId).eq("is_active",true).order("ledger_name").then(({data,error})=>{if(error)setNotice(error.message);else setAccountLedgers(data||[]);});},[companyId]);
  const saveBankAccount = async (e) => { e.preventDefault(); if(!companyId || !accountForm.bank_name.trim()) return; setAccountSaving(true); try {
    const {data:gr,error:ge}=await supabase.from("account_groups").select("id").eq("company_id",companyId).eq("group_name","Bank Accounts").limit(1); if(ge)throw ge; let groupId=gr?.[0]?.id;
    if(!groupId){const {data:ng,error:ne}=await supabase.from("account_groups").insert({company_id:companyId,group_name:"Bank Accounts",group_code:"BANK_ACCOUNTS",account_nature:"Asset",normal_balance:"Debit",statement_classification:"Balance Sheet"}).select("id").single();if(ne)throw ne;groupId=ng.id;}
    const ledgerName=accountForm.bank_name.trim()+" - "+(accountForm.account_number.slice(-4)||"Account");
    const {data:led,error:le}=await supabase.from("chart_of_accounts").insert({company_id:companyId,ledger_name:ledgerName,ledger_code:"BANK"+Date.now().toString().slice(-7),group_id:groupId,opening_balance:0,opening_balance_type:"Debit",gst_applicable:false,is_system:false,is_active:true}).select("id").single();if(le)throw le;
    const {error:pe}=await supabase.from("bank_account_profiles").insert({company_id:companyId,ledger_id:led.id,bank_name:accountForm.bank_name.trim(),account_holder_name:accountForm.account_holder_name||null,account_number_masked:accountForm.account_number?"****"+accountForm.account_number.slice(-4):null,ifsc:accountForm.ifsc.toUpperCase()||null,branch_name:accountForm.branch_name||null,account_type:accountForm.account_type,is_active:true});if(pe)throw pe;
    setNotice("Bank account saved successfully.");setAccountModal(false);setAccountForm({bank_name:"",account_holder_name:"",account_number:"",ifsc:"",branch_name:"",account_type:"Current"});const {data:reload,error:re}=await supabase.from("bank_account_profiles").select("*").eq("company_id",companyId).eq("is_active",true);if(re)throw re;setRealAccounts(reload||[]);
  }catch(err){setNotice("Could not save bank account: "+err.message);}finally{setAccountSaving(false);}};
  const downloadBankStatementTemplate = () => {
    const headers = ["Transaction Date (YYYY-MM-DD)", "Description / Narration", "Reference Number", "Debit", "Credit", "Amount"];
    const csv = headers.join(",") + "\r\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "SYD_Bank_Statement_Import_Template.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const parseManualCsv = async (file) => {
    setManualError(""); setParsedLines([]); if (!file) return;
    try {
      const raw = await file.text();
      const rows = raw.split(/\r?\n/).filter(line => line.trim());
      const csvLine = (s) => { const a=[]; let v="",q=false; for(let i=0;i<s.length;i++){const ch=s[i];if(ch==='"'&&s[i+1]==='"'&&q){v+='"';i++;}else if(ch==='"')q=!q;else if(ch===','&&!q){a.push(v.trim());v="";}else v+=ch;}a.push(v.trim());return a; };
      const norm = s => String(s||"").toLowerCase().replace(/[\s._()/-]+/g,"");
      let headerIndex=-1,hdr=[];
      for(let i=0;i<Math.min(rows.length,30);i++){const candidate=csvLine(rows[i]).map(norm);const hasDate=candidate.some(h=>h.includes("date"));const hasNarration=candidate.some(h=>["narration","description","particulars","details","transactionremarks"].some(t=>h.includes(t)));const hasMoney=candidate.some(h=>h.includes("amount")||h.includes("debit")||h.includes("credit"));if(hasDate&&hasNarration&&hasMoney){headerIndex=i;hdr=candidate;break;}}
      if(headerIndex<0){setManualError("Could not locate transaction header. Expected Date, Narration/Description and Amount or Debit/Credit columns.");return;}
      const ix=terms=>hdr.findIndex(h=>terms.some(t=>h.includes(t)));
      const dateI=ix(["transactiondate","valuedate","date"]),descI=ix(["narration","description","particulars","details","transactionremarks"]),refI=ix(["referencenumber","reference","refno","chequeno","cheque"]),debitI=ix(["debitamount","debit","withdrawal"]),creditI=ix(["creditamount","credit","deposit"]),amountI=ix(["amount"]);
      const toDate=s=>{const v=String(s||"").trim();if(/^\d{4}-\d{2}-\d{2}$/.test(v))return v;const p=v.split(/[\/-]/);if(p.length!==3)return "";let [day,month,year]=p;if(year.length===2)year="20"+year;return year+"-"+month.padStart(2,"0")+"-"+day.padStart(2,"0");};
      const money=s=>{const v=String(s||"").replace(/[\s,₹]/g,"").replace(/[()]/g,"");if(!v)return 0;const n=Number(v);return Number.isFinite(n)?n:NaN;};
      const data=rows.slice(headerIndex+1).map(line=>{const v=csvLine(line),date=toDate(v[dateI]),narration=String(v[descI]||"").trim();const debit=debitI>=0?money(v[debitI]):0,credit=creditI>=0?money(v[creditI]):0,amt=amountI>=0?money(v[amountI]):0;const signed=(debitI>=0||creditI>=0)?credit-debit:amt;return {statement_date:date,narration,reference_number:refI>=0?(v[refI]||null):null,amount:Math.abs(signed),direction:signed>=0?"Credit":"Debit",match_status:"Unmatched",import_batch:file.name,source_provider:"manual_csv"};}).filter(x=>x.statement_date&&x.narration&&Number.isFinite(x.amount)&&x.amount>0);
      if(!data.length){setManualError("Transaction header found, but no valid transaction rows were parsed. Check the date and debit/credit columns.");return;}
      setParsedLines(data);
    } catch(err) { setManualError("CSV reading failed: "+(err?.message||"Unknown error")); }
  };
  const importManualCsv = async () => {if(!companyId||!manualAccountId||!parsedLines.length)return;setManualSaving(true);try{const {error}=await supabase.from("bank_statement_lines").insert(parsedLines.map(r=>({...r,company_id:companyId,bank_account_id:manualAccountId})));if(error)throw error;setNotice(parsedLines.length+" statement transactions imported.");setShowImport(false);setImportStep(1);setParsedLines([]);setManualFile(null);}catch(e){setManualError("Import failed: "+e.message);}finally { setManualSaving(false); }
  };

  // Sidebar submenu links use query parameters to open the matching Banking workspace.
  useEffect(() => {
    const requestedTab = new URLSearchParams(location.search).get("tab");
    const tabMap = {
      overview: "Overview",
      transactions: "Transactions",
      reconciliation: "Reconciliation",
      accounts: "Bank Accounts",
      settings: "Settings",
    };

    if (requestedTab === "import") {
      setTab("Overview");
      setShowImport(true);
      setImportStep(1);
      return;
    }

    setShowImport(false);
    setTab(tabMap[requestedTab] || "Overview");
  }, [location.search]);

  const visibleTransactions = useMemo(() => transactions.filter(row => {
    const matchesSearch = !search || [row.narration, row.ref, row.ledger].join(" ").toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "All Transactions" || row.status === filter;
    return matchesSearch && matchesFilter;
  }), [transactions, search, filter]);

  const updateTransaction = async (id,key,value) => {
    setTransactions(rows=>rows.map(row=>row.id===id?{...row,[key]:value}:row));
    if(key==="type"){
      const {error}=await supabase.from("bank_statement_lines").update({category:value,classification_status:value==="Unclassified"?"Unclassified":"To Post"}).eq("id",id).eq("company_id",companyId);
      if(error)setNotice("Category save failed: "+error.message);
    }
    if(key==="ledgerId"){
      const ledger=accountLedgers.find(x=>x.id===value);
      const {error}=await supabase.from("bank_statement_lines").update({ledger_id:value||null,ledger_name:ledger?.ledger_name||null,classification_status:value?"To Post":"Unclassified"}).eq("id",id).eq("company_id",companyId);
      if(error)setNotice("Ledger mapping save failed: "+error.message);
    }
  };
  const postSelected = async () => {
    if (!companyId || !selected.length) return;
    setNotice("Posting selected bank transactions...");
    const selectedRows = transactions.filter(row => selected.includes(row.id));
    let posted = 0, failures = [];
    for (const row of selectedRows) {
      try {
        await postBankStatementLine(companyId, { id: row.id, bank_account_id: row.bank_account_id, statement_date: row.statement_date, reference_number: row.reference_number || row.ref, narration: row.narration || row.description, amount: row.amount, direction: row.direction, ledger_id: row.ledgerId || row.ledger_id, matched_voucher_id: row.matched_voucher_id });
        posted++;
      } catch (error) { failures.push((row.narration || row.description || row.id) + ": " + error.message); }
    }
    await loadBankingData();
    setSelected([]);
    setNotice(posted + " transaction(s) posted to accounting vouchers." + (failures.length ? " Failed: " + failures.slice(0,3).join(" | ") : ""));
  };
  const rememberTransactionRule = async (row) => { if(!companyId||!row.ledgerId||!row.narration?.trim())return; const keyword=window.prompt("Enter a keyword from this transaction description. Matching transactions will use this classification.",row.narration.trim()); if(!keyword||!keyword.trim())return; const cleanKeyword=keyword.trim(); try { const {data:userData,error:userError}=await supabase.auth.getUser(); if(userError)throw userError; await saveSYDClassificationRule(companyId,{rule_name:"Keyword: "+cleanKeyword,match_type:"contains_narration",match_value:cleanKeyword,transaction_direction:"any",transaction_type:row.type,ledger_id:row.ledgerId,priority:200,auto_apply:true},userData.user?.id); const targetLedger=accountLedgers.find(x=>x.id===row.ledgerId); const matches=transactions.filter(tx=>String(tx.narration||tx.description||"").toLowerCase().includes(cleanKeyword.toLowerCase())); let applied=0; for(const tx of matches){const {error}=await supabase.from("bank_statement_lines").update({category:row.type,ledger_id:row.ledgerId,ledger_name:targetLedger?.ledger_name||row.ledger,classification_status:"To Post"}).eq("id",tx.id).eq("company_id",companyId);if(error)throw error;applied++;} setTransactions(list=>list.map(tx=>String(tx.narration||tx.description||"").toLowerCase().includes(cleanKeyword.toLowerCase())?{...tx,type:row.type,ledger:targetLedger?.ledger_name||row.ledger,ledgerId:row.ledgerId,status:"To Post",intelligence:{ledger:targetLedger,confidence:0.99,source:"Learned keyword rule",autoApply:true,explanation:"Matched company keyword rule"}}:tx)); setNotice("Learned keyword '"+cleanKeyword+"' and applied it to "+applied+" matching bank transactions. Future matches will be recognized."); } catch(err) { setNotice("Could not save/apply keyword rule: "+err.message); } };
  const toggleSelected = id => setSelected(rows => rows.includes(id) ? rows.filter(x => x !== id) : [...rows, id]);

  return <main className="banking-page">
    <div className="banking-breadcrumb">Accounting <span>/</span> Banking <span>/</span> {tab}</div>
    <header className="banking-heading">
      <div><div className="banking-eyebrow">CASH & BANK MANAGEMENT</div><h1>Banking</h1><p>Connect accounts, classify transactions and reconcile your books.</p></div>
      <div className="banking-heading-actions">
        <button className="bank-btn bank-btn-light" onClick={() => {setTab("Bank Accounts");setAccountModal(true);}}><FiPlus/> Add Bank Account</button>
        <button className="bank-btn bank-btn-primary" onClick={() => { setShowImport(true); setImportStep(1); }}><FiUploadCloud/> Import Statement</button>
      </div>
    </header>

    <nav className="banking-tabs">
      {["Overview", "Transactions", "Reconciliation", "Bank Accounts", "Settings"].map(item => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}
    </nav>

    {notice && <div className="banking-notice"><FiCheckCircle/><span>{notice}</span><button onClick={() => setNotice("")}><FiX/></button></div>}

    {tab === "Overview" && <section className="banking-content">
      <div className="banking-metrics">
        <Metric icon={<FiCreditCard/>} label="Connected Bank Accounts" value={realAccounts.length} hint="Saved" tone="blue"/>
        <Metric icon={<FiFileText/>} label="Unclassified Transactions" value={transactions.filter(x => x.status === "Unclassified").length} hint="Needs Action" tone="orange"/>
        <Metric icon={<FiClock/>} label="Pending Reconciliation" value={transactions.filter(x=>x.status!=="Posted").length} hint="Imported" tone="pink"/>
        <Metric icon={<FiCheckCircle/>} label="Last Import" value={transactions.length} hint="Loaded" tone="green"/>
      </div>
      <div className="banking-overview-grid">
        <section className="bank-card bank-accounts-card"><div className="bank-card-heading"><div><h2>Bank Accounts ({realAccounts.length})</h2><p>Your saved business accounts</p></div><button className="bank-text-button" onClick={() => setTab("Bank Accounts")}>View all <FiArrowRight/></button></div>
          <div className="bank-table-wrap"><table className="bank-table"><thead><tr><th>Bank Account</th><th>Account No.</th><th>Bank Type</th><th>Transactions</th><th>Action</th></tr></thead><tbody>{realAccounts.map(row=><tr key={row.id}><td><strong>{row.bank_name}</strong></td><td>{row.account_number_masked||"—"}</td><td>{row.account_type||"Bank Account"}</td><td>{transactions.filter(t=>t.accountId===row.id).length}</td><td><button className="bank-text-button" onClick={()=>{setAccount(row.id);setTab("Transactions");}}>View transactions</button></td></tr>)}</tbody></table>{!realAccounts.length&&<div className="bank-empty">No saved bank accounts yet. Add a bank account to get started.</div>}</div>
        </section>
        <section className="bank-card bank-trend-card"><div className="bank-card-heading"><div><h2>Bank Balance Trend</h2><p>Consolidated closing balance</p></div><span className="bank-period">Apr – Jul</span></div><div className="bank-chart"><div className="bank-chart-y"><span>60L</span><span>45L</span><span>30L</span><span>15L</span><span>0</span></div><svg viewBox="0 0 420 190" role="img" aria-label="Bank balance trend chart"><defs><linearGradient id="bankFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#7550e8" stopOpacity=".22"/><stop offset="100%" stopColor="#7550e8" stopOpacity="0"/></linearGradient></defs><path d="M0 145 C45 138 55 112 92 119 S150 126 184 94 S245 111 280 70 S340 82 420 22 L420 180 L0 180Z" fill="url(#bankFill)"/><path d="M0 145 C45 138 55 112 92 119 S150 126 184 94 S245 111 280 70 S340 82 420 22" fill="none" stroke="#7047e8" strokeWidth="3" strokeLinecap="round"/><circle cx="420" cy="22" r="5" fill="#7047e8"/></svg></div><div className="bank-chart-x"><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span></div></section>
      </div>
      <section className="bank-card bank-recent-card"><div className="bank-card-heading"><div><h2>Recent Bank Transactions</h2><p>Latest activity across connected accounts</p></div><button className="bank-text-button" onClick={() => setTab("Transactions")}>View transactions <FiArrowRight/></button></div><TransactionTable rows={transactions.slice(0,4)} compact/></section>
    </section>}

    {tab === "Transactions" && <section className="banking-content">
      <div className="banking-section-title"><div><h2>Bank Transactions – Classify & Post</h2><p>Review imported statement lines and map each transaction to the correct accounting entry.</p></div><div className="banking-heading-actions"><button className="bank-btn bank-btn-light" onClick={() => setNotice("Auto-classification preview completed. Review the suggested categories before posting.")}><FiZap/> Auto-Classify</button><button className="bank-btn bank-btn-primary" disabled={!selected.length} onClick={postSelected}><FiCheck/> Post Selected ({selected.length})</button></div></div>
      <div className="bank-filter-bar"><select value={account} onChange={e=>setAccount(e.target.value)}><option value="">All Bank Accounts</option>{realAccounts.map(a=><option key={a.id} value={a.id}>{a.bank_name} {a.account_number_masked||""}</option>)}</select><label className="bank-date-filter"><FiCalendar/><span>01 Apr 2025 – 11 Jul 2026</span><FiChevronDown/></label><select value={filter} onChange={e => setFilter(e.target.value)}><option>All Transactions</option><option>Unclassified</option><option>To Post</option><option>Posted</option></select><label className="bank-search"><FiSearch/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search narration, amount..."/></label></div>
      <div className="banking-status-tabs"><button className="active">All ({transactions.length})</button><button onClick={() => setFilter("Unclassified")}>Unclassified ({transactions.filter(x=>x.status==="Unclassified").length})</button><button onClick={() => setFilter("To Post")}>To Post ({transactions.filter(x=>x.status==="To Post").length})</button><button onClick={() => setFilter("Posted")}>Posted ({transactions.filter(x=>x.status==="Posted").length})</button></div>
      <section className="bank-card"><TransactionTable rows={visibleTransactions} selected={selected} onToggle={toggleSelected} onChange={updateTransaction} rememberRule={rememberTransactionRule} ledgers={accountLedgers}/></section>
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
      <div className="banking-section-title"><div><h2>Bank Accounts</h2><p>Manage the bank accounts linked to {currentCompany?.company_name || "your company"}.</p></div><button className="bank-btn bank-btn-primary" onClick={() => setAccountModal(true)}><FiPlus/> Add Bank Account</button></div>
      <BulkTransactionImport kind="bank-accounts" />
      {accountModal && <div className="bank-modal-backdrop"><section className="bank-import-modal" role="dialog" aria-modal="true"><div className="bank-modal-heading"><div><h2>Add Bank Account</h2><p>Creates a bank ledger and stores account details.</p></div><button className="bank-icon-button" onClick={()=>setAccountModal(false)}><FiX/></button></div><form className="bank-account-form" onSubmit={saveBankAccount}><label>Bank Name<input required value={accountForm.bank_name} onChange={e=>setAccountForm({...accountForm,bank_name:e.target.value})}/></label><label>Account Holder<input value={accountForm.account_holder_name} onChange={e=>setAccountForm({...accountForm,account_holder_name:e.target.value})}/></label><label>Account Number<input value={accountForm.account_number} onChange={e=>setAccountForm({...accountForm,account_number:e.target.value})}/></label><label>IFSC<input value={accountForm.ifsc} onChange={e=>setAccountForm({...accountForm,ifsc:e.target.value})}/></label><label>Branch<input value={accountForm.branch_name} onChange={e=>setAccountForm({...accountForm,branch_name:e.target.value})}/></label><label>Account Type<select value={accountForm.account_type} onChange={e=>setAccountForm({...accountForm,account_type:e.target.value})}><option>Current</option><option>Savings</option><option>OD</option><option>CC</option></select></label><div className="bank-modal-actions"><button type="button" className="bank-btn bank-btn-light" onClick={()=>setAccountModal(false)}>Cancel</button><button className="bank-btn bank-btn-primary" disabled={accountSaving}>{accountSaving?"Saving...":"Save Account"}</button></div></form></section></div>}
      {realAccounts.length>0 && <div className="bank-card" style={{marginBottom:16,padding:12}}><strong>Saved bank accounts ({realAccounts.length})</strong><ul>{realAccounts.map(a=><li key={a.id}>{a.bank_name} — {a.account_number_masked||"No account number"} ({a.account_type})</li>)}</ul></div>}
      <div className="bank-account-grid">{realAccounts.map(row=><article className="bank-card bank-account-tile real-bank-account" key={row.id}><div className="bank-logo real-bank-logo">{(row.bank_name||"Bank").split(" ").map(x=>x[0]).join("").slice(0,3).toUpperCase()}</div><div className="bank-account-status"><span className="bank-dot"/> Saved</div><h3>{row.bank_name}</h3><p>{row.account_number_masked||"Account details hidden"} · {row.account_type||"Bank"}</p><div className="bank-account-balance"><span>Imported transactions</span><strong>{transactions.filter(t=>t.accountId===row.id).length}</strong></div><div className="bank-account-actions"><button onClick={()=>{setAccount(row.id);setTab("Transactions")}}>View transactions</button><button onClick={()=>{setManualAccountId(row.id);setShowImport(true);}}>Import statement</button></div></article>)}</div>
    </section>}

    {tab === "Settings" && <section className="banking-content">
      <div className="banking-section-title"><div><h2>Banking Settings</h2><p>Manage bank connections, categorisation and reconciliation preferences.</p></div></div>
      <div className="banking-settings-tabs">{["Bank Accounts","Account Aggregator","Transaction Rules","Reconciliation Rules"].map(x=><button key={x} className={settingsTab===x?"active":""} onClick={()=>setSettingsTab(x)}>{x}</button>)}</div>
      {settingsTab==="Account Aggregator" ? <section className="bank-card bank-aggregator-settings"><div className="bank-aggregator-intro"><div className="bank-aggregator-icon"><FiLink/></div><div><h3>Account Aggregator Connections</h3><p>Securely connect and manage bank accounts through an RBI-regulated Account Aggregator partner.</p></div></div>{bankAccounts.map(x=><div className="bank-connection-row" key={x.name}><div className={"bank-logo "+x.color}>{x.bank.split(" ").map(y=>y[0]).join("").slice(0,3)}</div><div><strong>{x.bank}</strong><small>Last sync: 11 Jul 2026 · 10:24 AM</small></div><span className="bank-connected">Connected</span><button className="bank-icon-button"><FiRefreshCw/></button></div>)}<button className="bank-btn bank-btn-primary" onClick={()=>setShowImport(true)}><FiPlus/> Connect Another Bank</button></section> : <section className="bank-card bank-settings-placeholder"><FiSettings/><h3>{settingsTab}</h3><p>Configure company-specific {settingsTab.toLowerCase()} for automatic bank processing.</p><button className="bank-btn bank-btn-light" onClick={()=>setNotice("Settings editor will be enabled with the banking database configuration.")}>Configure Rules</button></section>}
    </section>}

    {showImport && <div className="bank-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setShowImport(false);}}><section className="bank-import-modal" role="dialog" aria-modal="true" aria-labelledby="bank-import-title">
      <div className="bank-modal-heading"><div><div className="banking-eyebrow">BANKING</div><h2 id="bank-import-title">Manual CSV Statement Import</h2><p>Choose a saved bank account and upload a CSV statement.</p></div><button className="bank-icon-button" onClick={()=>setShowImport(false)}><FiX/></button></div>
      <label className="bank-recon-controls"><span>Bank Account</span><select value={manualAccountId} onChange={e=>setManualAccountId(e.target.value)}><option value="">Select account...</option>{realAccounts.map(a=><option key={a.id} value={a.id}>{a.bank_name} {a.account_number_masked||""}</option>)}</select></label>
      <div className="bank-template-actions"><button type="button" className="bank-btn bank-btn-light" onClick={downloadBankStatementTemplate}><FiDownload/> Download Excel-compatible Template</button><small>Open in Excel, arrange/paste bank data into matching columns, save as CSV, then upload.</small></div><label className="bank-file-drop"><FiUploadCloud/><b>{manualFile?.name||"Choose CSV statement"}</b><small>CSV template · Date, Description, Reference, Debit, Credit, Amount</small><input type="file" accept=".csv,text/csv" onChange={async e=>{const file=e.target.files?.[0];setManualFile(file||null);await parseManualCsv(file);}}/></label>
      {manualError&&<p className="banking-footnote">{manualError}</p>}
      {parsedLines.length>0&&<div><strong>{parsedLines.length} rows parsed and ready</strong><div className="bank-table-wrap"><table className="bank-table"><thead><tr><th>Date</th><th>Description</th><th>Reference</th><th>Dr/Cr</th><th>Amount</th></tr></thead><tbody>{parsedLines.slice(0,10).map((r,i)=><tr key={i}><td>{r.statement_date}</td><td>{r.narration}</td><td>{r.reference_number||"-"}</td><td>{r.direction}</td><td>{money(r.amount)}</td></tr>)}</tbody></table></div>{parsedLines.length>10&&<small>Preview limited to first 10 rows.</small>}</div>}
      <div className="bank-modal-actions"><button className="bank-btn bank-btn-light" onClick={()=>setShowImport(false)}>Cancel</button><button className="bank-btn bank-btn-primary" disabled={!manualAccountId||!parsedLines.length||manualSaving} onClick={importManualCsv}>{manualSaving?"Importing...":"Import Transactions"} <FiArrowRight/></button></div>
    </section></div>}  </main>;
}

function Metric({icon,label,value,hint,tone="blue"}) { return <article className="bank-metric"><div className={"bank-metric-icon "+tone}>{icon}</div><div className="bank-metric-copy"><span>{label}</span><strong>{value}</strong><small className={tone}>{hint}</small></div></article>; }
function TransactionTable({rows,selected=[],onToggle,onChange,rememberRule,compact=false,ledgers=[]}) {
  return <div className="bank-table-wrap"><table className="bank-table bank-transactions-table"><thead><tr>{!compact&&<th><input type="checkbox" aria-label="Select all"/></th>}<th>Date</th><th>Narration / Description</th><th>Bank Ref.</th><th>Amount (₹)</th><th>Type / Purpose</th><th>Accounting Mapping</th><th>Intelligence Suggestion</th><th>Status</th></tr></thead><tbody>{rows.map(row=><tr key={row.id}>{!compact&&<td><input type="checkbox" checked={selected.includes(row.id)} onChange={()=>onToggle?.(row.id)} aria-label={"Select "+row.narration}/></td>}<td>{row.date}</td><td><strong>{row.narration}</strong></td><td>{row.ref}</td><td className={row.amount<0?"bank-negative":"bank-positive"}>{row.amount<0?"−":"+"}{money(row.amount)}</td><td>{compact?row.type:<select value={row.type} onChange={e=>onChange?.(row.id,"type",e.target.value)}>{categories.map(x=><option key={x}>{x}</option>)}</select>}</td><td>{compact?row.ledger:<select className="bank-ledger-input" value={row.ledgerId||""} onChange={e=>onChange?.(row.id,"ledgerId",e.target.value)}><option value="">Select ledger...</option>{ledgers.map(l=><option key={l.id} value={l.id}>{l.ledger_name}{l.ledger_code? " ("+l.ledger_code+")":""}</option>)}</select>}</td><td>{!compact&&row.intelligence?.ledger&&!row.ledgerId?<div className="bank-intelligence-suggestion"><small>Suggest: {row.intelligence.ledger.ledger_name} · {Math.round(row.intelligence.confidence*100)}%<br/>{row.intelligence.source}</small><button type="button" className="bank-btn bank-btn-small bank-btn-light" onClick={()=>onChange?.(row.id,"ledgerId",row.intelligence.ledger.id)}>Use Suggestion</button></div>:!compact&&row.ledgerId?<button type="button" className="bank-btn bank-btn-small bank-btn-light" onClick={()=>rememberRule?.(row)}>Remember Rule</button>:null}</td><td><span className={"bank-status "+row.status.toLowerCase().replaceAll(" ","-")}>{row.status}</span></td></tr>)}</tbody></table>{!rows.length&&<div className="bank-empty">No transactions match your filters.</div>}</div>;
}
function FiBookOpenIcon(){return <FiFileText/>;}
