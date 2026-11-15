import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCompany } from "../../context/CompanyContext";
import { supabase } from "../../supabase/supabaseClient";
import { createAccountGroup, createLedger, createVoucher, getAccountingData } from "../../services/accountingService";
import "./BankingWorkspace.css";

const money = value => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(Number(value)||0);
const today = () => { const d=new Date(); return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10); };
const emptyAccount = () => ({bank_name:"",account_holder_name:"",account_number_masked:"",ifsc:"",branch_name:"",account_type:"Current",opening_balance:"0"});
const emptyTxn = () => ({voucher_date:today(),bank_ledger_id:"",counter_ledger_id:"",to_ledger_id:"",amount:"",reference_number:"",narration:"",link_type:"",link_id:""});
const DEFAULT_GROUPS = [
  ["Assets","AST","Asset","Debit","Balance Sheet"],
  ["Liabilities","LIA","Liability","Credit","Balance Sheet"],
  ["Equity","EQT","Equity","Credit","Balance Sheet"],
  ["Income","INC","Income","Credit","Profit & Loss"],
  ["Expenses","EXP","Expense","Debit","Profit & Loss"]
];
const VIEWS = {
  "/app/banking/overview":"overview",
  "/app/banking/accounts":"accounts",
  "/app/banking/transactions":"transactions",
  "/app/banking/cash-book":"cash-book",
  "/app/receipts":"receipts",
  "/app/payments":"payments",
  "/app/contra":"contra",
  "/app/bank-reconciliation":"reconciliation"
};
const TITLES = {
  overview:"Banking Overview",accounts:"Bank Accounts",transactions:"Bank Transactions",
  "cash-book":"Cash & Bank Book",receipts:"Receipts",payments:"Payments",
  contra:"Contra / Bank Transfers",reconciliation:"Bank Reconciliation"
};

export default function BankingWorkspace(){
  const {currentCompany,currentCompanyId}=useCompany();
  const location=useLocation(),navigate=useNavigate();
  const view=VIEWS[location.pathname]||"overview";
  const [data,setData]=useState({groups:[],ledgers:[],vouchers:[],lines:[]});
  const [accounts,setAccounts]=useState([]);
  const [statementLines,setStatementLines]=useState([]);
  const [salesInvoices,setSalesInvoices]=useState([]),[purchaseInvoices,setPurchaseInvoices]=useState([]),[expenses,setExpenses]=useState([]),[receiptTotals,setReceiptTotals]=useState([]),[purchasePaymentTotals,setPurchasePaymentTotals]=useState([]);
  const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false);
  const [error,setError]=useState(""),[notice,setNotice]=useState("");
  const [accountForm,setAccountForm]=useState(emptyAccount());
  const [showAccountForm,setShowAccountForm]=useState(false);
  const [txn,setTxn]=useState(emptyTxn());
  const [search,setSearch]=useState("");
  const [selectedAccount,setSelectedAccount]=useState("");
  const [statementFile,setStatementFile]=useState("");
  const [dateFrom,setDateFrom]=useState("");
  const [dateTo,setDateTo]=useState("");

  const load=async()=>{
    if(!currentCompanyId){setData({groups:[],ledgers:[],vouchers:[],lines:[]});setAccounts([]);setStatementLines([]);setLoading(false);return;}
    setLoading(true);setError("");
    try{
      const [accounting,bankResult,salesResult,purchaseResult,expenseResult,receiptResult,paymentResult]=await Promise.all([
        getAccountingData(currentCompanyId),
        supabase.from("bank_account_profiles").select("*").eq("company_id",currentCompanyId).order("bank_name"),
        supabase.from("sales_invoices").select("id,invoice_no,invoice_date,customer_id,customer_name,total_amount,sale_type").eq("company_id",currentCompanyId).eq("is_deleted",false).order("invoice_date",{ascending:false}),
        supabase.from("purchase_invoices").select("id,invoice_no,supplier_invoice_no,invoice_date,vendor_id,grand_total,paid_amount,payment_status").eq("company_id",currentCompanyId).eq("is_deleted",false).order("invoice_date",{ascending:false}),
        supabase.from("expenses").select("id,expense_no,expense_date,vendor_id,payee_name,total_amount,paid_amount,payment_status").eq("company_id",currentCompanyId).order("expense_date",{ascending:false}),
        supabase.from("sales_invoice_receipts").select("invoice_id,amount").eq("company_id",currentCompanyId),
        supabase.from("purchase_invoice_payments").select("invoice_id,amount").eq("company_id",currentCompanyId)
      ]);
      for(const result of [bankResult,salesResult,purchaseResult,expenseResult,receiptResult,paymentResult])if(result.error)throw result.error;
      setData(accounting);setAccounts(bankResult.data||[]);setSalesInvoices(salesResult.data||[]);setPurchaseInvoices(purchaseResult.data||[]);setExpenses(expenseResult.data||[]);setReceiptTotals(receiptResult.data||[]);setPurchasePaymentTotals(paymentResult.data||[]);
      const active=bankResult.data||[];
      const current=active.find(x=>x.id===selectedAccount)||active[0];
      if(current){setSelectedAccount(current.id);const stmt=await supabase.from("bank_statement_lines").select("*").eq("company_id",currentCompanyId).eq("bank_account_id",current.id).order("statement_date",{ascending:false}).limit(300);if(stmt.error)throw stmt.error;setStatementLines(stmt.data||[]);}
      else setStatementLines([]);
    }catch(e){setError(e.message||"Unable to load banking data.");}
    finally{setLoading(false);}
  };
  useEffect(()=>{load();},[currentCompanyId,selectedAccount]);

  const assetGroup=()=>data.groups.find(g=>g.account_nature==="Asset");
  const bankLedgers=useMemo(()=>data.ledgers.filter(l=>l.party_type==="Bank"&&l.is_active!==false),[data.ledgers]);
  const cashLedgers=useMemo(()=>data.ledgers.filter(l=>/cash in hand|cash account/i.test(l.ledger_name)&&l.is_active!==false),[data.ledgers]);
  const moneyLedgers=useMemo(()=>data.ledgers.filter(l=>l.is_active!==false),[data.ledgers]);
  const bankIds=new Set(bankLedgers.map(l=>l.id).concat(cashLedgers.map(l=>l.id)));
  const postedVouchers=useMemo(()=>data.vouchers.filter(v=>v.status==="Posted"),[data.vouchers]);
  const bankActivity=useMemo(()=>{
    const voucherMap=new Map(postedVouchers.map(v=>[v.id,v]));
    return data.lines.filter(line=>bankIds.has(line.ledger_id)&&voucherMap.has(line.voucher_id)).map(line=>{
      const v=voucherMap.get(line.voucher_id),ledger=data.ledgers.find(l=>l.id===line.ledger_id);
      return {...line,voucher:v,ledger,amount:Number(line.debit||0)||Number(line.credit||0),direction:Number(line.debit||0)>0?"Credit":"Debit"};
    }).filter(row=>(!dateFrom||row.voucher.voucher_date>=dateFrom)&&(!dateTo||row.voucher.voucher_date<=dateTo))
      .filter(row=>!search||[row.voucher.voucher_number,row.voucher.narration,row.voucher.reference_number,row.ledger?.ledger_name].join(" ").toLowerCase().includes(search.toLowerCase()))
      .sort((a,b)=>String(b.voucher.voucher_date).localeCompare(String(a.voucher.voucher_date)));
  },[data.lines,postedVouchers,data.ledgers,dateFrom,dateTo,search]);
  const accountBalance=(ledgerId)=>{
    const ledger=data.ledgers.find(x=>x.id===ledgerId);if(!ledger)return 0;
    const opening=Number(ledger.opening_balance||0)*(ledger.opening_balance_type==="Credit"?-1:1);
    const lines=data.lines.filter(x=>x.ledger_id===ledgerId&&postedVouchers.some(v=>v.id===x.voucher_id));
    return opening+lines.reduce((s,x)=>s+Number(x.debit||0)-Number(x.credit||0),0);
  };
  const totalBank=bankLedgers.reduce((s,l)=>s+accountBalance(l.id),0);
  const totalCash=cashLedgers.reduce((s,l)=>s+accountBalance(l.id),0);
  const receipts=postedVouchers.filter(v=>v.voucher_type==="Receipt");
  const payments=postedVouchers.filter(v=>v.voucher_type==="Payment");

  const ensureDefaultGroups=async()=>{
    if(!currentCompanyId)throw new Error("Select a company first.");
    const current=await getAccountingData(currentCompanyId);
    const existing=new Set(current.groups.map(g=>g.group_code));
    for(const row of DEFAULT_GROUPS){if(!existing.has(row[1]))await createAccountGroup(currentCompanyId,{group_name:row[0],group_code:row[1],parent_group_id:null,account_nature:row[2],normal_balance:row[3],statement_classification:row[4],description:"System account group",is_system:true,is_active:true});}
    return await getAccountingData(currentCompanyId);
  };

  const saveAccount=async(e)=>{
    e.preventDefault();setSaving(true);setError("");setNotice("");
    try{
      let currentData=data;
      if(!assetGroup())currentData=await ensureDefaultGroups();
      const group=currentData.groups.find(g=>g.account_nature==="Asset");
      if(!group)throw new Error("Create the standard Assets account group first.");
      const ledger=await createLedger(currentCompanyId,{
        ledger_name:accountForm.bank_name+" - "+accountForm.account_type,
        ledger_code:"BANK-"+Date.now().toString().slice(-10),
        group_id:group.id,opening_balance:Number(accountForm.opening_balance||0),
        opening_balance_type:"Debit",opening_date:today(),party_type:"Bank",
        description:"Bank account: "+(accountForm.account_number_masked||"")+" | IFSC: "+(accountForm.ifsc||"")
      });
      const {error:profileError}=await supabase.from("bank_account_profiles").insert([{
        ...accountForm,company_id:currentCompanyId,ledger_id:ledger.id,
        opening_balance:undefined
      }]);
      if(profileError){await supabase.from("chart_of_accounts").delete().eq("id",ledger.id).eq("company_id",currentCompanyId);throw profileError;}
      setShowAccountForm(false);setAccountForm(emptyAccount());setNotice("Bank account added successfully.");await load();
    }catch(e){setError(e.message||"Unable to add bank account.");}
    finally{setSaving(false);}
  };

  const addCashLedger=async()=>{
    setSaving(true);setError("");try{
      let currentData=data;if(!assetGroup())currentData=await ensureDefaultGroups();
      const group=currentData.groups.find(g=>g.account_nature==="Asset");
      await createLedger(currentCompanyId,{ledger_name:"Cash in Hand",ledger_code:"CASH-"+Date.now().toString().slice(-6),group_id:group.id,opening_balance:0,opening_balance_type:"Debit",opening_date:today(),party_type:"Other",description:"Cash account"});
      setNotice("Cash in Hand ledger created.");await load();
    }catch(e){setError(e.message||"Unable to create cash ledger.");}finally{setSaving(false);}
  };

  const saveVoucher=async(type,e)=>{
    e.preventDefault();setSaving(true);setError("");setNotice("");
    try{
      const amount=Number(txn.amount);
      if(!Number.isFinite(amount)||amount<=0)throw new Error("Enter an amount greater than zero.");
      if(type==="Receipt"&&txn.link_type==="sales"&&txn.link_id){
        const invoice=salesInvoices.find(x=>x.id===txn.link_id);
        if(!invoice)throw new Error("Selected sales invoice was not found.");
        const already=String(invoice.sale_type||"").toLowerCase()==="cash"?Number(invoice.total_amount||0):receiptTotals.filter(x=>x.invoice_id===invoice.id).reduce((a,x)=>a+Number(x.amount||0),0);
        if(amount>Math.max(0,Number(invoice.total_amount||0)-already)+0.01)throw new Error("Receipt exceeds this invoice's outstanding balance.");
      }
      if(type==="Payment"&&txn.link_type==="purchase"&&txn.link_id){
        const invoice=purchaseInvoices.find(x=>x.id===txn.link_id);
        if(!invoice)throw new Error("Selected purchase invoice was not found.");
        const already=Math.max(Number(invoice.paid_amount||0),purchasePaymentTotals.filter(x=>x.invoice_id===invoice.id).reduce((a,x)=>a+Number(x.amount||0),0));
        if(amount>Math.max(0,Number(invoice.grand_total||0)-already)+0.01)throw new Error("Payment exceeds this purchase invoice's outstanding balance.");
      }
      if(type==="Payment"&&txn.link_type==="expense"&&txn.link_id){
        const expense=expenses.find(x=>x.id===txn.link_id);
        if(!expense)throw new Error("Selected expense was not found.");
        if(amount>Math.max(0,Number(expense.total_amount||0)-Number(expense.paid_amount||0))+0.01)throw new Error("Payment exceeds this expense's outstanding balance.");
      }
      let lines=[];
      if(type==="Receipt"){
        if(!txn.bank_ledger_id||!txn.counter_ledger_id)throw new Error("Select the receiving bank/cash account and customer or income ledger.");
        lines=[{ledger_id:txn.bank_ledger_id,debit:amount,credit:0,line_narration:txn.narration},{ledger_id:txn.counter_ledger_id,debit:0,credit:amount,line_narration:txn.narration}];
      }else if(type==="Payment"){
        if(!txn.bank_ledger_id||!txn.counter_ledger_id)throw new Error("Select the paying bank/cash account and supplier or expense ledger.");
        lines=[{ledger_id:txn.counter_ledger_id,debit:amount,credit:0,line_narration:txn.narration},{ledger_id:txn.bank_ledger_id,debit:0,credit:amount,line_narration:txn.narration}];
      }else{
        if(!txn.bank_ledger_id||!txn.to_ledger_id||txn.bank_ledger_id===txn.to_ledger_id)throw new Error("Select two different cash/bank accounts.");
        lines=[{ledger_id:txn.to_ledger_id,debit:amount,credit:0,line_narration:txn.narration},{ledger_id:txn.bank_ledger_id,debit:0,credit:amount,line_narration:txn.narration}];
      }
      const prefix=type==="Receipt"?"RCT":type==="Payment"?"PAY":"CTR";
      const voucher=await createVoucher(currentCompanyId,{
        voucher_number:prefix+"-"+Date.now().toString(),
        voucher_type:type,voucher_date:txn.voucher_date,reference_number:txn.reference_number||null,
        narration:txn.narration||type+" entry",source_module:"Banking",status:"Draft"
      },lines);
      const allocationType=type==="Receipt"&&txn.link_type==="sales"?"sales":type==="Payment"&&txn.link_type==="purchase"?"purchase":type==="Payment"&&txn.link_type==="expense"?"expense":"none";
      const bankProfile=accounts.find(a=>a.ledger_id===txn.bank_ledger_id);
      const bankLedger=data.ledgers.find(a=>a.id===txn.bank_ledger_id);
      const {error:postingError}=await supabase.rpc("post_banking_voucher",{
        p_company_id:currentCompanyId,p_voucher_id:voucher.id,p_allocation_type:allocationType,
        p_invoice_id:allocationType==="sales"||allocationType==="purchase"?txn.link_id:null,
        p_expense_id:allocationType==="expense"?txn.link_id:null,
        p_payment_date:txn.voucher_date,p_amount:amount,p_payment_method:"Bank Transfer",
        p_bank_ledger_id:txn.bank_ledger_id,p_reference_number:txn.reference_number||null,
        p_account_name:bankProfile?.bank_name||bankLedger?.ledger_name||"Bank",p_remarks:txn.narration||null
      });
      if(postingError)throw postingError;
      setTxn(emptyTxn());setNotice(type+" recorded and posted successfully.");await load();
    }catch(e){setError(e.message||"Unable to save transaction.");}
    finally{setSaving(false);}
  };

  const importStatement=async(e)=>{
    const file=e.target.files?.[0];if(!file)return;
    if(!selectedAccount){setError("Select a bank account first.");return;}
    setSaving(true);setError("");setNotice("");
    try{
      const text=await file.text();
      const rows=text.split(/\r?\n/).filter(Boolean);
      if(rows.length<2)throw new Error("The CSV file has no transaction rows.");
      const parseLine=line=>{const out=[];let value="",quoted=false;for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'&&line[i+1]==='"'){value+='"';i++;}else if(ch==='"'){quoted=!quoted;}else if(ch===","&&!quoted){out.push(value.trim());value="";}else value+=ch;}out.push(value.trim());return out;};
      const headers=parseLine(rows[0]).map(x=>x.toLowerCase().replace(/[^a-z0-9]/g,""));
      const col=(names)=>headers.findIndex(h=>names.includes(h));
      const dateIx=col(["date","transactiondate","valuedate"]),descIx=col(["description","narration","particulars","details"]),refIx=col(["reference","referenceno","ref","utr"]),amtIx=col(["amount","transactionamount"]),typeIx=col(["type","direction","drcr","transactiontype"]),balIx=col(["balance","runningbalance","closingbalance"]);
      if(dateIx<0||descIx<0||amtIx<0)throw new Error("CSV needs Date, Description and Amount columns. Optional: Reference, Type (Credit/Debit), Balance.");
      const batch="IMP-"+Date.now();
      const payload=rows.slice(1).map(parseLine).filter(r=>r[dateIx]&&r[amtIx]).map(r=>{
        const rawDate=r[dateIx];let date=rawDate;
        if(/^\d{2}\/\d{2}\/\d{4}$/.test(rawDate)){const [d,m,y]=rawDate.split("/");date=y+"-"+m+"-"+d;}
        const rawAmount=String(r[amtIx]).replace(/[₹,\s]/g,"");
        const amount=Math.abs(Number(rawAmount));
        const rawType=typeIx>=0?String(r[typeIx]||"").toLowerCase():"";
        const direction=/debit|withdraw|dr|paid/.test(rawType)||Number(rawAmount)<0?"Debit":"Credit";
        return {company_id:currentCompanyId,bank_account_id:selectedAccount,statement_date:date,narration:r[descIx]||"Bank transaction",reference_number:refIx>=0?r[refIx]||null:null,amount,direction,running_balance:balIx>=0&&r[balIx]?Number(String(r[balIx]).replace(/[₹,\s]/g,"")):null,import_batch:batch};
      }).filter(x=>Number.isFinite(x.amount)&&x.amount>0&&/^\d{4}-\d{2}-\d{2}$/.test(x.statement_date));
      if(!payload.length)throw new Error("No valid statement rows were found.");
      const {error:insertError}=await supabase.from("bank_statement_lines").insert(payload);
      if(insertError)throw insertError;
      setStatementFile(file.name);setNotice(payload.length+" bank statement rows imported.");await load();
    }catch(e){setError(e.message||"Unable to import bank statement.");}
    finally{setSaving(false);e.target.value="";}
  };

  const matchLine=async(line)=>{
    setSaving(true);setError("");try{
      const bankProfile=accounts.find(a=>a.id===line.bank_account_id);
      if(!bankProfile)throw new Error("Bank account profile not found.");
      const candidates=postedVouchers.filter(v=>Math.abs(new Date(v.voucher_date+"T00:00:00").getTime()-new Date(line.statement_date+"T00:00:00").getTime())<=3*86400000);
      let matched=null;
      for(const v of candidates){
        const row=data.lines.find(x=>x.voucher_id===v.id&&x.ledger_id===bankProfile.ledger_id);
        if(!row)continue;
        const bookDirection=Number(row.debit||0)>0?"Credit":"Debit";
        const bookAmount=Number(row.debit||0)||Number(row.credit||0);
        if(bookDirection===line.direction&&Math.abs(bookAmount-Number(line.amount))<0.01){matched=v;break;}
      }
      if(!matched)throw new Error("No exact bank ledger match found within three days. Check the statement and accounting entry.");
      const {error:matchError}=await supabase.from("bank_statement_lines").update({match_status:"Matched",matched_voucher_id:matched.id,matched_at:new Date().toISOString()}).eq("id",line.id).eq("company_id",currentCompanyId);
      if(matchError)throw matchError;setNotice("Statement line matched to "+matched.voucher_number+".");await load();
    }catch(e){setError(e.message||"Unable to match statement line.");}finally{setSaving(false);}
  };

  const heading=<header className="fin-heading"><div><span className="fin-eyebrow">SYD / BANKING & MONEY</span><h1>{TITLES[view]}</h1><p>{currentCompany?.company_name||"Select a company"} · Manage cash, bank movements and reconciliation.</p></div><div className="fin-actions">{view==="accounts"&&<button className="fin-primary" onClick={()=>setShowAccountForm(true)}>＋ Add Account</button>}{["receipts","payments","contra"].includes(view)&&<button className="fin-secondary" onClick={()=>navigate("/app/banking/accounts")}>Manage Accounts</button>}</div></header>;
  const accountOptions=<><option value="">Select account</option>{accounts.filter(a=>a.is_active).map(a=><option key={a.id} value={a.ledger_id}>{a.bank_name} · {a.account_number_masked||"Bank account"}</option>)}{cashLedgers.map(l=><option key={l.id} value={l.id}>{l.ledger_name}</option>)}</>;
  const counterOptions=<><option value="">Select ledger</option>{moneyLedgers.filter(l=>!bankIds.has(l.id)).map(l=><option key={l.id} value={l.id}>{l.ledger_name}</option>)}</>;

  return <main className="fin-page">
    <nav className="fin-subnav">{Object.entries(TITLES).map(([key,label])=><button key={key} className={view===key?"active":""} onClick={()=>navigate(Object.keys(VIEWS).find(path=>VIEWS[path]===key))}>{label}</button>)}</nav>
    {heading}
    {error&&<div className="fin-alert error">{error}<button onClick={()=>setError("")}>×</button></div>}
    {notice&&<div className="fin-alert success">{notice}<button onClick={()=>setNotice("")}>×</button></div>}
    {!currentCompanyId?<div className="fin-empty">Create or select a company to use Banking & Money.</div>:loading?<div className="fin-empty">Loading company banking records…</div>:<>
      {view==="overview"&&<><section className="fin-kpis"><article><span>Total Bank Balance</span><strong>{money(totalBank)}</strong></article><article><span>Cash in Hand</span><strong>{money(totalCash)}</strong></article><article><span>Total Receipts</span><strong>{money(receipts.reduce((s,v)=>s+Number(v.total_debit||0),0))}</strong></article><article><span>Total Payments</span><strong>{money(payments.reduce((s,v)=>s+Number(v.total_credit||0),0))}</strong></article></section><section className="fin-grid"><article className="fin-panel"><div className="fin-panel-title"><h2>Bank Accounts</h2><button onClick={()=>navigate("/app/banking/accounts")}>View all →</button></div>{accounts.map(a=>{const ledger=data.ledgers.find(l=>l.id===a.ledger_id);return <div className="fin-account-row" key={a.id}><span className="fin-bank-icon">▣</span><div><b>{a.bank_name} – {a.account_type}</b><small>{a.account_number_masked||"Account details not provided"}</small></div><strong>{money(accountBalance(a.ledger_id))}</strong></div>})}{!accounts.length&&<p className="fin-muted">No bank accounts yet. Add a bank account to begin.</p>}</article><article className="fin-panel"><div className="fin-panel-title"><h2>Quick Actions</h2></div><div className="fin-quick"><button onClick={()=>navigate("/app/receipts")}>＋ Record Receipt</button><button onClick={()=>navigate("/app/payments")}>＋ Record Payment</button><button onClick={()=>navigate("/app/contra")}>⇄ Bank Transfer</button><button onClick={()=>navigate("/app/bank-reconciliation")}>✓ Reconcile Statement</button></div></article></section></>}
      {view==="accounts"&&<section className="fin-panel"><div className="fin-panel-title"><h2>Business bank accounts</h2><button onClick={addCashLedger} disabled={saving}>＋ Add Cash Ledger</button></div>{accounts.map(a=><div className="fin-account-card" key={a.id}><div><b>{a.bank_name} – {a.account_type}</b><small>{a.account_holder_name||currentCompany?.company_name} · {a.account_number_masked||"—"} · IFSC {a.ifsc||"—"}</small><small>{a.branch_name||"Branch not specified"}</small></div><strong>{money(accountBalance(a.ledger_id))}</strong><span className={a.is_active?"fin-pill":"fin-pill muted"}>{a.is_active?"Active":"Inactive"}</span></div>)}{!accounts.length&&<div className="fin-empty">No bank accounts configured.</div>}{cashLedgers.map(l=><div className="fin-account-card" key={l.id}><div><b>{l.ledger_name}</b><small>Cash account</small></div><strong>{money(accountBalance(l.id))}</strong><span className="fin-pill">Active</span></div>)}</section>}
      {["transactions","cash-book"].includes(view)&&<><section className="fin-panel"><div className="fin-filters"><input placeholder="Search voucher, reference or account…" value={search} onChange={e=>setSearch(e.target.value)}/><label>From<input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}/></label><label>To<input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}/></label><button onClick={()=>{setSearch("");setDateFrom("");setDateTo("");}}>Reset</button></div><div className="fin-table-wrap"><table className="fin-table"><thead><tr><th>Date</th><th>Voucher</th><th>Account</th><th>Particulars</th><th>Type</th><th>Debit</th><th>Credit</th></tr></thead><tbody>{bankActivity.map(r=><tr key={r.id}><td>{r.voucher.voucher_date}</td><td>{r.voucher.voucher_number}</td><td>{r.ledger?.ledger_name}</td><td>{r.voucher.narration||r.voucher.reference_number||"—"}</td><td>{r.voucher.voucher_type}</td><td>{Number(r.debit)>0?money(r.debit):"—"}</td><td>{Number(r.credit)>0?money(r.credit):"—"}</td></tr>)}{!bankActivity.length&&<tr><td colSpan="7" className="fin-empty-cell">No posted bank/cash transactions found for these filters.</td></tr>}</tbody></table></div></section></>}
      {["receipts","payments","contra"].includes(view)&&<><section className="fin-panel"><h2>{view==="receipts"?"Record Money Received":view==="payments"?"Record Money Paid":"Transfer Between Accounts"}</h2><p className="fin-muted">Entries are saved as balanced accounting vouchers and posted to the selected company ledger.</p><form className="fin-form" onSubmit={e=>saveVoucher(view==="receipts"?"Receipt":view==="payments"?"Payment":"Contra",e)}><label>Date<input type="date" value={txn.voucher_date} onChange={e=>setTxn(p=>({...p,voucher_date:e.target.value}))} required/></label><label>{view==="contra"?"Transfer From":"Cash / Bank Account"}<select value={txn.bank_ledger_id} onChange={e=>setTxn(p=>({...p,bank_ledger_id:e.target.value}))} required>{accountOptions}</select></label>{view==="contra"?<label>Transfer To<select value={txn.to_ledger_id} onChange={e=>setTxn(p=>({...p,to_ledger_id:e.target.value}))} required>{accountOptions}</select></label>:<label>{view==="receipts"?"Received From / Credit Ledger":"Paid To / Debit Ledger"}<select value={txn.counter_ledger_id} onChange={e=>setTxn(p=>({...p,counter_ledger_id:e.target.value}))} required>{counterOptions}</select></label>}<label>{view==="receipts"?"Allocate to Sales Invoice (optional)":"Link to Bill (optional)"}<select value={txn.link_type+"|"+txn.link_id} onChange={e=>{const [link_type,link_id]=e.target.value.split("|");setTxn(p=>({...p,link_type:link_type||"",link_id:link_id||""}));}}><option value="|">No invoice allocation</option>{view==="receipts"?salesInvoices.map(x=><option key={x.id} value={"sales|"+x.id}>{x.invoice_no} · {x.customer_name} · {money(x.total_amount)}</option>):<>{purchaseInvoices.map(x=><option key={x.id} value={"purchase|"+x.id}>{x.invoice_no} · Purchase · {money(x.grand_total)}</option>)}{expenses.map(x=><option key={x.id} value={"expense|"+x.id}>{x.expense_no} · Expense · {money(x.total_amount)}</option>)}</>}</select></label><label>Amount (₹)<input type="number" min="0.01" step="0.01" value={txn.amount} onChange={e=>setTxn(p=>({...p,amount:e.target.value}))} required/></label><label>Reference / UTR<input value={txn.reference_number} onChange={e=>setTxn(p=>({...p,reference_number:e.target.value}))}/></label><label className="fin-wide">Narration<input value={txn.narration} onChange={e=>setTxn(p=>({...p,narration:e.target.value}))} placeholder="Enter transaction details"/></label><div className="fin-wide fin-form-actions"><button className="fin-primary" disabled={saving}>{saving?"Saving…":view==="receipts"?"Save & Post Receipt":view==="payments"?"Save & Post Payment":"Save & Post Transfer"}</button><button type="button" className="fin-secondary" onClick={()=>setTxn(emptyTxn())}>Clear</button></div></form></section><section className="fin-panel"><h2>Recent {view==="receipts"?"Receipts":view==="payments"?"Payments":"Transfers"}</h2><div className="fin-table-wrap"><table className="fin-table"><thead><tr><th>Date</th><th>Voucher No.</th><th>Reference</th><th>Narration</th><th>Amount</th><th>Status</th></tr></thead><tbody>{postedVouchers.filter(v=>v.voucher_type===(view==="receipts"?"Receipt":view==="payments"?"Payment":"Contra")).slice(0,20).map(v=><tr key={v.id}><td>{v.voucher_date}</td><td>{v.voucher_number}</td><td>{v.reference_number||"—"}</td><td>{v.narration||"—"}</td><td>{money(v.total_debit)}</td><td><span className="fin-pill">Posted</span></td></tr>)}{!postedVouchers.some(v=>v.voucher_type===(view==="receipts"?"Receipt":view==="payments"?"Payment":"Contra"))&&<tr><td colSpan="6" className="fin-empty-cell">No records yet.</td></tr>}</tbody></table></div></section></>}
      {view==="reconciliation"&&<><section className="fin-panel"><div className="fin-panel-title"><div><h2>Import bank statement</h2><p className="fin-muted">CSV columns: Date, Description, Amount. Optional: Reference, Type, Balance.</p></div><a className="fin-secondary" href="data:text/csv;charset=utf-8,Date%2CDescription%2CReference%2CAmount%2CType%2CBalance%0A2026-11-14%2CSample%20NEFT%2CREF001%2C1250%2CCredit%2C101250" download="syd-bank-statement-template.csv">Download CSV Template</a></div><label className="fin-upload">Choose bank account<select value={selectedAccount} onChange={e=>setSelectedAccount(e.target.value)}><option value="">Select bank account</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.bank_name} · {a.account_number_masked}</option>)}</select><input type="file" accept=".csv,text/csv" onChange={importStatement} disabled={!selectedAccount||saving}/></label>{statementFile&&<p className="fin-muted">Last imported: {statementFile}</p>}</section><section className="fin-panel"><div className="fin-panel-title"><h2>Statement reconciliation</h2><button onClick={load}>Refresh</button></div><div className="fin-kpis compact"><article><span>Statement Lines</span><strong>{statementLines.length}</strong></article><article><span>Matched</span><strong>{statementLines.filter(x=>x.match_status==="Matched").length}</strong></article><article><span>Unmatched</span><strong>{statementLines.filter(x=>x.match_status==="Unmatched").length}</strong></article><article><span>Book Balance</span><strong>{money(accounts.find(a=>a.id===selectedAccount)?accountBalance(accounts.find(a=>a.id===selectedAccount).ledger_id):0)}</strong></article></div><div className="fin-table-wrap"><table className="fin-table"><thead><tr><th>Date</th><th>Description</th><th>Reference</th><th>Direction</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead><tbody>{statementLines.map(line=><tr key={line.id}><td>{line.statement_date}</td><td>{line.narration}</td><td>{line.reference_number||"—"}</td><td>{line.direction}</td><td>{money(line.amount)}</td><td><span className={line.match_status==="Matched"?"fin-pill":"fin-pill warning"}>{line.match_status}</span></td><td>{line.match_status==="Unmatched"&&<button className="fin-link" disabled={saving} onClick={()=>matchLine(line)}>Auto-match</button>}</td></tr>)}{!statementLines.length&&<tr><td colSpan="7" className="fin-empty-cell">Import a bank statement to start reconciliation.</td></tr>}</tbody></table></div></section></>}
    </>}
    {showAccountForm&&<div className="fin-modal-backdrop"><form className="fin-modal" onSubmit={saveAccount}><div className="fin-panel-title"><h2>Add Bank Account</h2><button type="button" onClick={()=>setShowAccountForm(false)}>×</button></div><div className="fin-form"><label>Bank Name<input value={accountForm.bank_name} onChange={e=>setAccountForm(p=>({...p,bank_name:e.target.value}))} required/></label><label>Account Type<select value={accountForm.account_type} onChange={e=>setAccountForm(p=>({...p,account_type:e.target.value}))}><option>Current</option><option>Savings</option><option>Cash Credit</option><option>Overdraft</option></select></label><label>Account Holder<input value={accountForm.account_holder_name} onChange={e=>setAccountForm(p=>({...p,account_holder_name:e.target.value}))}/></label><label>Account Number (masked)<input value={accountForm.account_number_masked} onChange={e=>setAccountForm(p=>({...p,account_number_masked:e.target.value}))} placeholder="XXXX XXXX 1234"/></label><label>IFSC<input value={accountForm.ifsc} onChange={e=>setAccountForm(p=>({...p,ifsc:e.target.value.toUpperCase()}))}/></label><label>Branch<input value={accountForm.branch_name} onChange={e=>setAccountForm(p=>({...p,branch_name:e.target.value}))}/></label><label>Opening Balance<input type="number" min="0" step="0.01" value={accountForm.opening_balance} onChange={e=>setAccountForm(p=>({...p,opening_balance:e.target.value}))}/></label></div><div className="fin-form-actions"><button className="fin-primary" disabled={saving}>{saving?"Saving…":"Save Bank Account"}</button><button type="button" className="fin-secondary" onClick={()=>setShowAccountForm(false)}>Cancel</button></div></form></div>}
  </main>;
}
