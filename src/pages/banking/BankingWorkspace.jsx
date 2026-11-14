import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { FiArrowDownLeft, FiArrowUpRight, FiPlus, FiRefreshCw, FiSearch, FiDownload, FiCheck, FiX, FiCalendar, FiCreditCard, FiFileText, FiArrowRight, FiAlertCircle } from "react-icons/fi";
import { useCompany } from "../../context/CompanyContext";
import { supabase } from "../../supabase/supabaseClient";
import { createVoucher, getAccountingData, postVoucher } from "../../services/accountingService";
import "../../css/banking/BankingWorkspace.css";

const money = n => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(Number(n||0));
const today = () => new Date().toISOString().slice(0,10);
const tabs = [
  ["overview","Overview"],["accounts","Bank Accounts"],["transactions","Transactions"],
  ["cashbook","Cash & Bank Book"],["receipts","Receipts"],["payments","Payments"],
  ["contra","Contra / Transfers"],["reconciliation","Reconciliation"]
];
const emptyForm = { voucher_date:today(), reference_number:"", narration:"", bank_ledger_id:"", other_ledger_id:"", amount:"", payment_method:"Bank Transfer" };

export default function BankingWorkspace(){
  const {currentCompany,currentCompanyId}=useCompany();
  const location=useLocation();
  const requested=new URLSearchParams(location.search).get("tab")||"overview";
  const [tab,setTab]=useState(requested);
  const [accounts,setAccounts]=useState([]);
  const [statements,setStatements]=useState([]);
  const [accounting,setAccounting]=useState({groups:[],ledgers:[],vouchers:[],lines:[]});
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
  const [error,setError]=useState(""),[notice,setNotice]=useState("");
  const [search,setSearch]=useState(""),[selectedAccount,setSelectedAccount]=useState("");
  const [form,setForm]=useState(emptyForm);
  const [accountForm,setAccountForm]=useState({ledger_id:"",bank_name:"",account_holder_name:"",account_number_masked:"",ifsc:"",branch_name:"",account_type:"Current"});
  const [showAccountForm,setShowAccountForm]=useState(false);
  const [csvFile,setCsvFile]=useState(null);
  const [matchVoucher,setMatchVoucher]=useState({});

  useEffect(()=>{setTab(requested);},[requested]);
  const load=useCallback(async()=>{
    if(!currentCompanyId){setAccounts([]);setStatements([]);setAccounting({groups:[],ledgers:[],vouchers:[],lines:[]});setLoading(false);return;}
    setLoading(true);setError("");
    try{
      const [a,s,acc]=await Promise.all([
        supabase.from("bank_account_profiles").select("*").eq("company_id",currentCompanyId).eq("is_active",true).order("bank_name"),
        supabase.from("bank_statement_lines").select("*").eq("company_id",currentCompanyId).order("statement_date",{ascending:false}).limit(500),
        getAccountingData(currentCompanyId)
      ]);
      if(a.error)throw a.error;if(s.error)throw s.error;
      setAccounts(a.data||[]);setStatements(s.data||[]);setAccounting(acc);
      if(!selectedAccount && a.data?.length)setSelectedAccount(a.data[0].id);
    }catch(e){setError(e.message||"Unable to load Banking data. Check company access and Supabase policies.");}
    finally{setLoading(false);}
  },[currentCompanyId]);
  useEffect(()=>{load();},[load]);

  const bankLedgers=useMemo(()=>accounts.map(a=>({...a,ledger:accounting.ledgers.find(l=>l.id===a.ledger_id)})),[accounts,accounting.ledgers]);
  const activeBankLedgerIds=new Set(accounts.map(a=>a.ledger_id));
  const posted=accounting.vouchers.filter(v=>v.status==="Posted");
  const bankLines=accounting.lines.filter(line=>activeBankLedgerIds.has(line.ledger_id)&&posted.some(v=>v.id===line.voucher_id));
  const totalBalance=bankLines.reduce((sum,line)=>sum+Number(line.debit||0)-Number(line.credit||0),0)+bankLedgers.reduce((sum,a)=>sum+Number(a.ledger?.opening_balance||0)*(a.ledger?.opening_balance_type==="Credit"?-1:1),0);
  const filteredStatements=statements.filter(x=>(!selectedAccount||x.bank_account_id===selectedAccount)&&(!search||[x.narration,x.reference_number,x.statement_date].join(" ").toLowerCase().includes(search.toLowerCase())));
  const voucherById=new Map(accounting.vouchers.map(v=>[v.id,v]));
  const currentBank=accounts.find(a=>a.id===selectedAccount);

  const saveBankAccount=async e=>{
    e.preventDefault();setBusy(true);setError("");setNotice("");
    try{
      if(!accountForm.ledger_id)throw new Error("Select an existing Bank ledger first.");
      const {error:e1}=await supabase.from("bank_account_profiles").insert([{...accountForm,company_id:currentCompanyId,is_active:true}]);
      if(e1)throw e1;
      setShowAccountForm(false);setAccountForm({ledger_id:"",bank_name:"",account_holder_name:"",account_number_masked:"",ifsc:"",branch_name:"",account_type:"Current"});
      setNotice("Bank account linked successfully.");await load();
    }catch(e2){setError(e2.message||"Unable to link bank account.");}finally{setBusy(false);}
  };

  const saveVoucher=async e=>{
    e.preventDefault();setBusy(true);setError("");setNotice("");
    try{
      const amount=Number(form.amount);
      if(!currentCompanyId)throw new Error("Select a company first.");
      if(!form.bank_ledger_id||!form.other_ledger_id||form.bank_ledger_id===form.other_ledger_id)throw new Error("Select two different ledgers.");
      if(!(amount>0))throw new Error("Enter an amount greater than zero.");
      const isReceipt=tab==="receipts",isPayment=tab==="payments";
      const lines=isReceipt?[
        {ledger_id:form.bank_ledger_id,debit:amount,credit:0,line_narration:form.narration},
        {ledger_id:form.other_ledger_id,debit:0,credit:amount,line_narration:form.narration}
      ]:isPayment?[
        {ledger_id:form.other_ledger_id,debit:amount,credit:0,line_narration:form.narration},
        {ledger_id:form.bank_ledger_id,debit:0,credit:amount,line_narration:form.narration}
      ]:[
        {ledger_id:form.bank_ledger_id,debit:amount,credit:0,line_narration:"Transfer received"},
        {ledger_id:form.other_ledger_id,debit:0,credit:amount,line_narration:"Transfer sent"}
      ];
      const prefix=isReceipt?"RCT":isPayment?"PAY":"CTR";
      const voucher=await createVoucher(currentCompanyId,{
        voucher_number:prefix+"-"+Date.now().toString().slice(-9),
        voucher_type:isReceipt?"Receipt":isPayment?"Payment":"Contra",
        voucher_date:form.voucher_date,
        reference_number:form.reference_number||null,
        narration:form.narration||null,
        source_module:"banking",
        source_record_id:null,
        status:"Draft"
      },lines);
      await postVoucher(currentCompanyId,voucher.id);
      setNotice((isReceipt?"Receipt":isPayment?"Payment":"Contra transfer")+" voucher posted successfully.");
      setForm(emptyForm);await load();
    }catch(e2){setError(e2.message||"Unable to save the voucher.");}finally{setBusy(false);}
  };

  const importCsv=async e=>{
    e.preventDefault();setBusy(true);setError("");setNotice("");
    try{
      if(!currentBank)throw new Error("Select a bank account before importing.");
      if(!csvFile)throw new Error("Choose a CSV statement file.");
      const raw=await csvFile.text();
      const rows=raw.split(/\r?\n/).filter(Boolean);
      if(rows.length<2)throw new Error("The CSV has no transaction rows.");
      const parseLine=line=>{const out=[];let value="",quoted=false;for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'){if(quoted&&line[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}else if(ch===","&&!quoted){out.push(value.trim());value="";}else value+=ch;}out.push(value.trim());return out;};
      const headers=parseLine(rows[0]).map(x=>x.toLowerCase().replace(/[^a-z0-9]/g,""));
      const index=names=>headers.findIndex(h=>names.includes(h));
      const dateI=index(["date","transactiondate","valuedate"]),descI=index(["narration","description","particulars","details"]),refI=index(["referencenumber","reference","refno","chequeno"]),amountI=index(["amount","transactionamount"]),debitI=index(["debit","withdrawal","withdrawals"]),creditI=index(["credit","deposit","deposits"]),balanceI=index(["balance","runningbalance"]);
      if(dateI<0||descI<0||(amountI<0&&debitI<0&&creditI<0))throw new Error("CSV needs Date, Narration and Amount (or Debit/Credit) columns.");
      const payload=rows.slice(1).map(line=>{const c=parseLine(line);const debit=debitI>=0?Number(c[debitI]||0):0;const credit=creditI>=0?Number(c[creditI]||0):0;const signed=amountI>=0?Number((c[amountI]||"0").replace(/,/g,"")):credit-debit;const amount=Math.abs(signed||credit-debit);return {company_id:currentCompanyId,bank_account_id:currentBank.id,statement_date:c[dateI],narration:c[descI]||"Bank transaction",reference_number:refI>=0?c[refI]||null:null,amount,direction:(signed>=0?"Credit":"Debit"),running_balance:balanceI>=0?Number((c[balanceI]||"").replace(/,/g,""))||null:null,match_status:"Unmatched",import_batch:csvFile.name};}).filter(x=>x.statement_date&&Number.isFinite(x.amount)&&x.amount>0);
      if(!payload.length)throw new Error("No valid statement rows were found.");
      const {error:insertError}=await supabase.from("bank_statement_lines").insert(payload);
      if(insertError)throw insertError;
      setCsvFile(null);setNotice(payload.length+" bank statement rows imported.");setTab("transactions");await load();
    }catch(e2){setError(e2.message||"Unable to import statement.");}finally{setBusy(false);}
  };

  const markMatched=async row=>{
    const voucherId=matchVoucher[row.id];
    if(!voucherId) {setError("Choose the accounting voucher to match.");return;}
    setBusy(true);setError("");setNotice("");
    try{
      const profile=accounts.find(a=>a.id===row.bank_account_id);
      const voucher=accounting.vouchers.find(v=>v.id===voucherId&&v.status==="Posted");
      if(!profile||!voucher)throw new Error("The selected bank account or posted voucher is unavailable.");
      const expectedSide=row.direction==="Credit"?"debit":"credit";
      const matchingLine=accounting.lines.find(line=>line.voucher_id===voucherId&&line.ledger_id===profile.ledger_id&&Math.abs(Number(line[expectedSide]||0)-Number(row.amount||0))<=0.01);
      if(!matchingLine)throw new Error("The selected voucher does not contain the same bank ledger and amount/direction. Choose the correct voucher.");
      const {error:e}=await supabase.from("bank_statement_lines").update({match_status:"Matched",matched_voucher_id:voucherId,matched_at:new Date().toISOString()}).eq("id",row.id).eq("company_id",currentCompanyId);
      if(e)throw e;setNotice("Statement line matched to the corresponding bank ledger voucher.");await load();
    }catch(e2){setError(e2.message||"Unable to match statement line.");}finally{setBusy(false);}
  };

  const title=tabs.find(x=>x[0]===tab)?.[1]||"Overview";
  const ledgerName=id=>accounting.ledgers.find(l=>l.id===id)?.ledger_name||"—";
  const vouchersForBank=posted.filter(v=>accounting.lines.some(l=>l.voucher_id===v.id&&activeBankLedgerIds.has(l.ledger_id)));
  const cashRows=bankLines.map(line=>({line,voucher:voucherById.get(line.voucher_id)})).filter(x=>x.voucher).sort((a,b)=>b.voucher.voucher_date.localeCompare(a.voucher.voucher_date));

  return <main className="banking-page">
    <div className="banking-breadcrumb">Accounting <span>/</span> Banking <span>/</span> {title}</div>
    <header className="banking-heading"><div><div className="banking-eyebrow">SYD · CASH & BANK MANAGEMENT</div><h1>{title}</h1><p>{currentCompany?.company_name||"Selected company"} · Company-linked banking records</p></div><div className="banking-heading-actions"><button className="bank-btn bank-btn-light" onClick={load} disabled={loading}><FiRefreshCw/> Refresh</button>{tab==="accounts"&&<button className="bank-btn bank-btn-primary" onClick={()=>setShowAccountForm(true)}><FiPlus/> Link Bank Account</button>}</div></header>
    <nav className="banking-tabs">{tabs.map(([key,label])=><button key={key} className={tab===key?"active":""} onClick={()=>setTab(key)}>{label}</button>)}</nav>
    {error&&<div className="banking-notice" role="alert"><FiAlertCircle/><span>{error}</span><button onClick={()=>setError("")}><FiX/></button></div>}
    {notice&&<div className="banking-notice"><FiCheck/><span>{notice}</span><button onClick={()=>setNotice("")}><FiX/></button></div>}
    {loading?<section className="bank-card" style={{padding:24}}>Loading company banking records…</section>:!currentCompanyId?<section className="bank-card" style={{padding:24}}>Please select a company to view Banking.</section>:<>
      {tab==="overview"&&<section className="banking-content">
        <div className="banking-metrics"><Metric icon={<FiCreditCard/>} label="Linked Bank Accounts" value={accounts.length} hint="Company accounts" tone="blue"/><Metric icon={<FiFileText/>} label="Statement Entries" value={statements.length} hint="Imported rows" tone="orange"/><Metric icon={<FiAlertCircle/>} label="Unmatched Entries" value={statements.filter(x=>x.match_status!=="Matched").length} hint="Needs reconciliation" tone="pink"/><Metric icon={<FiArrowUpRight/>} label="Book Bank Balance" value={money(totalBalance)} hint="Posted vouchers + opening" tone="green"/></div>
        <section className="bank-card"><div className="bank-card-heading"><div><h2>Bank Accounts</h2><p>Real bank ledgers linked to this company</p></div><button className="bank-text-button" onClick={()=>setTab("accounts")}>Manage accounts <FiArrowRight/></button></div><div className="bank-table-wrap"><table className="bank-table"><thead><tr><th>Bank</th><th>Account</th><th>Ledger</th><th>Type</th><th>Status</th></tr></thead><tbody>{bankLedgers.map(a=><tr key={a.id}><td><strong>{a.bank_name}</strong></td><td>{a.account_number_masked||"—"}</td><td>{a.ledger?.ledger_name||"Ledger unavailable"}</td><td>{a.account_type}</td><td>{a.is_active?"Active":"Inactive"}</td></tr>)}</tbody></table>{!accounts.length&&<div className="bank-empty">No bank accounts linked. Add an existing bank ledger to begin.</div>}</div></section>
        <section className="bank-card bank-recent-card"><div className="bank-card-heading"><div><h2>Recent Bank Book Entries</h2><p>Posted accounting voucher lines</p></div><button className="bank-text-button" onClick={()=>setTab("cashbook")}>Open Cash & Bank Book <FiArrowRight/></button></div><VoucherTable rows={cashRows.slice(0,8)} ledgerName={ledgerName}/></section>
      </section>}
      {tab==="accounts"&&<section className="banking-content"><div className="banking-section-title"><div><h2>Bank Accounts</h2><p>Link bank ledgers from the Chart of Accounts. No sample balances are displayed.</p></div><button className="bank-btn bank-btn-primary" onClick={()=>setShowAccountForm(true)}><FiPlus/> Link Account</button></div><section className="bank-card"><div className="bank-table-wrap"><table className="bank-table"><thead><tr><th>Bank</th><th>Holder</th><th>Masked A/c</th><th>IFSC</th><th>Linked Ledger</th><th>Type</th></tr></thead><tbody>{bankLedgers.map(a=><tr key={a.id}><td>{a.bank_name}</td><td>{a.account_holder_name||"—"}</td><td>{a.account_number_masked||"—"}</td><td>{a.ifsc||"—"}</td><td>{a.ledger?.ledger_name||"Missing ledger"}</td><td>{a.account_type}</td></tr>)}</tbody></table>{!accounts.length&&<div className="bank-empty">No accounts yet. Link a bank ledger to enable receipts, payments and transfers.</div>}</div></section></section>}
      {tab==="transactions"&&<section className="banking-content"><div className="bank-filter-bar"><select value={selectedAccount} onChange={e=>setSelectedAccount(e.target.value)}><option value="">All bank accounts</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.bank_name} · {a.account_number_masked||"Account"}</option>)}</select><label className="bank-search"><FiSearch/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search narration or reference"/></label></div><section className="bank-card"><StatementTable rows={filteredStatements} matchVoucher={matchVoucher} setMatchVoucher={setMatchVoucher} vouchers={vouchersForBank} onMatch={markMatched}/></section><section className="bank-card" style={{padding:18,marginTop:14}}><h3>Import CSV Bank Statement</h3><p>CSV columns: Date, Narration, Reference (optional), Amount or Debit/Credit, Balance (optional).</p><form onSubmit={importCsv} className="bank-filter-bar"><input type="file" accept=".csv,text/csv" onChange={e=>setCsvFile(e.target.files?.[0]||null)}/><button className="bank-btn bank-btn-primary" disabled={busy||!currentBank}><FiDownload/> Import CSV</button></form></section></section>}
      {tab==="cashbook"&&<section className="banking-content"><div className="bank-filter-bar"><select value={selectedAccount} onChange={e=>setSelectedAccount(e.target.value)}><option value="">All bank ledgers</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.bank_name}</option>)}</select></div><section className="bank-card"><VoucherTable rows={cashRows.filter(x=>!selectedAccount||accounts.find(a=>a.id===selectedAccount)?.ledger_id===x.line.ledger_id)} ledgerName={ledgerName}/></section></section>}
      {(tab==="receipts"||tab==="payments"||tab==="contra")&&<section className="banking-content"><section className="bank-card" style={{padding:18,maxWidth:760}}><h2>{tab==="receipts"?"Record Receipt":tab==="payments"?"Record Payment":"Record Contra / Bank Transfer"}</h2><p>{tab==="receipts"?"Debit the receiving bank ledger and credit the customer/other ledger.":tab==="payments"?"Debit the expense/supplier ledger and credit the paying bank ledger.":"Transfer funds between two bank ledgers."}</p><form onSubmit={saveVoucher} className="bank-entry-form">
        <label>Date<input type="date" value={form.voucher_date} onChange={e=>setForm({...form,voucher_date:e.target.value})} required/></label>
        <label>Bank Account<select value={form.bank_ledger_id} onChange={e=>setForm({...form,bank_ledger_id:e.target.value})} required><option value="">Select bank ledger</option>{bankLedgers.map(a=><option key={a.id} value={a.ledger_id}>{a.bank_name} · {a.ledger?.ledger_name||""}</option>)}</select></label>
        <label>{tab==="receipts"?"Received From Ledger":tab==="payments"?"Paid To Ledger":"Transfer To Bank Ledger"}<select value={form.other_ledger_id} onChange={e=>setForm({...form,other_ledger_id:e.target.value})} required><option value="">Select ledger</option>{accounting.ledgers.filter(l=>tab==="contra"?activeBankLedgerIds.has(l.id):!activeBankLedgerIds.has(l.id)).map(l=><option key={l.id} value={l.id}>{l.ledger_name}</option>)}</select></label>
        <label>Amount (₹)<input type="number" min="0.01" step="0.01" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} required/></label>
        <label>Payment Method<select value={form.payment_method} onChange={e=>setForm({...form,payment_method:e.target.value})}><option>Bank Transfer</option><option>UPI</option><option>NEFT</option><option>RTGS</option><option>IMPS</option><option>Cheque</option><option>Cash</option></select></label>
        <label>Reference Number<input value={form.reference_number} onChange={e=>setForm({...form,reference_number:e.target.value})} placeholder="UTR / Cheque / reference"/></label>
        <label className="wide">Narration<input value={form.narration} onChange={e=>setForm({...form,narration:e.target.value})} placeholder="Transaction description"/></label>
        <div className="wide bank-form-actions"><button type="submit" className="bank-btn bank-btn-primary" disabled={busy||!accounts.length||!accounting.ledgers.length}>{busy?"Saving…":"Save & Post Voucher"}</button></div>
      </form></section><section className="bank-card" style={{padding:16,marginTop:14}}><h3>{tab==="receipts"?"Receipts Register":tab==="payments"?"Payments Register":"Contra Register"}</h3><VoucherTable rows={cashRows.filter(x=>x.voucher.voucher_type===(tab==="receipts"?"Receipt":tab==="payments"?"Payment":"Contra"))} ledgerName={ledgerName}/></section>
      <p className="banking-footnote"><FiAlertCircle/> This posts a balanced accounting voucher. Invoice-wise receipt/payment allocation remains a separate action in the invoice settlement workflow.</p></section>}
      {tab==="reconciliation"&&<section className="banking-content"><div className="bank-filter-bar"><select value={selectedAccount} onChange={e=>setSelectedAccount(e.target.value)}><option value="">All bank accounts</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.bank_name}</option>)}</select><span className="bank-period">{statements.filter(x=>!selectedAccount||x.bank_account_id===selectedAccount).filter(x=>x.match_status==="Matched").length} matched / {statements.filter(x=>!selectedAccount||x.bank_account_id===selectedAccount).filter(x=>x.match_status!=="Matched").length} unmatched</span></div><section className="bank-card"><StatementTable rows={filteredStatements.filter(x=>x.match_status!=="Matched")} matchVoucher={matchVoucher} setMatchVoucher={setMatchVoucher} vouchers={vouchersForBank} onMatch={markMatched}/></section></section>}
    </>}
    {showAccountForm&&<div className="bank-modal-backdrop"><section className="bank-import-modal" role="dialog" aria-modal="true"><div className="bank-modal-heading"><div><h2>Link Bank Account</h2><p>Select an existing bank ledger.</p></div><button className="bank-icon-button" onClick={()=>setShowAccountForm(false)}><FiX/></button></div><form onSubmit={saveBankAccount} className="bank-entry-form"><label>Bank Name<input required value={accountForm.bank_name} onChange={e=>setAccountForm({...accountForm,bank_name:e.target.value})}/></label><label>Bank Ledger<select required value={accountForm.ledger_id} onChange={e=>setAccountForm({...accountForm,ledger_id:e.target.value})}><option value="">Select ledger</option>{accounting.ledgers.filter(l=>/bank|cash/i.test(l.ledger_name+" "+(accounting.groups.find(g=>g.id===l.group_id)?.group_name||""))).map(l=><option key={l.id} value={l.id}>{l.ledger_name}</option>)}</select></label><label>Account Holder<input value={accountForm.account_holder_name} onChange={e=>setAccountForm({...accountForm,account_holder_name:e.target.value})}/></label><label>Masked Account Number<input value={accountForm.account_number_masked} onChange={e=>setAccountForm({...accountForm,account_number_masked:e.target.value})} placeholder="•••• 1234"/></label><label>IFSC<input value={accountForm.ifsc} onChange={e=>setAccountForm({...accountForm,ifsc:e.target.value.toUpperCase()})}/></label><label>Branch<input value={accountForm.branch_name} onChange={e=>setAccountForm({...accountForm,branch_name:e.target.value})}/></label><label>Account Type<select value={accountForm.account_type} onChange={e=>setAccountForm({...accountForm,account_type:e.target.value})}><option>Current</option><option>Savings</option><option>OD</option><option>Cash Credit</option></select></label><div className="wide bank-form-actions"><button type="submit" className="bank-btn bank-btn-primary" disabled={busy}>{busy?"Saving…":"Save Bank Account"}</button></div></form></section></div>}
  </main>;
}

function Metric({icon,label,value,hint,tone="blue"}){return <article className="bank-metric"><div className={"bank-metric-icon "+tone}>{icon}</div><div className="bank-metric-copy"><span>{label}</span><strong>{value}</strong><small className={tone}>{hint}</small></div></article>;}
function StatementTable({rows,matchVoucher,setMatchVoucher,vouchers,onMatch}){
 return <div className="bank-table-wrap"><table className="bank-table"><thead><tr><th>Date</th><th>Narration</th><th>Reference</th><th>Direction</th><th>Amount</th><th>Status</th><th>Match to Voucher</th></tr></thead><tbody>{rows.map(row=><tr key={row.id}><td>{row.statement_date}</td><td>{row.narration}</td><td>{row.reference_number||"—"}</td><td>{row.direction}</td><td>{money(row.amount)}</td><td><span className={"bank-status "+(row.match_status==="Matched"?"posted":"to-post")}>{row.match_status}</span></td><td>{row.match_status==="Matched"?"Matched":<div style={{display:"flex",gap:6}}><select value={matchVoucher[row.id]||""} onChange={e=>setMatchVoucher(old=>({...old,[row.id]:e.target.value}))}><option value="">Select posted voucher</option>{vouchers.map(v=><option key={v.id} value={v.id}>{v.voucher_number} · {v.voucher_type} · {v.voucher_date}</option>)}</select><button className="bank-btn bank-btn-primary bank-btn-small" onClick={()=>onMatch(row)}>Match</button></div>}</td></tr>)}</tbody></table>{!rows.length&&<div className="bank-empty">No statement entries found.</div>}</div>;
}
function VoucherTable({rows,ledgerName}){
 return <div className="bank-table-wrap"><table className="bank-table"><thead><tr><th>Date</th><th>Voucher</th><th>Type</th><th>Ledger</th><th>Narration</th><th>Debit</th><th>Credit</th></tr></thead><tbody>{rows.map(({line,voucher})=><tr key={line.id}><td>{voucher.voucher_date}</td><td>{voucher.voucher_number}</td><td>{voucher.voucher_type}</td><td>{ledgerName(line.ledger_id)}</td><td>{line.line_narration||voucher.narration||"—"}</td><td>{money(line.debit)}</td><td>{money(line.credit)}</td></tr>)}</tbody></table>{!rows.length&&<div className="bank-empty">No posted bank book entries yet.</div>}</div>;
}
