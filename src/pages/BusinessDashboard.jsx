import React,{useEffect,useMemo,useState} from "react";
import {useNavigate} from "react-router-dom";
import {useCompany} from "../context/CompanyContext";
import {supabase} from "../supabase/supabaseClient";
import "./BusinessDashboard.css";
const money=v=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(Number(v)||0);
const monthKey=d=>String(d||"").slice(0,7);
export default function BusinessDashboard(){
 const {currentCompany,currentCompanyId}=useCompany();const navigate=useNavigate();
 const [rows,setRows]=useState({sales:[],purchases:[],expenses:[],vouchers:[],ledgers:[],groups:[],lines:[]});
 const [loading,setLoading]=useState(true),[error,setError]=useState("");
 useEffect(()=>{let live=true;async function load(){if(!currentCompanyId){setRows({sales:[],purchases:[],expenses:[],vouchers:[],ledgers:[],groups:[],lines:[]});setLoading(false);return;}setLoading(true);setError("");try{
  const [s,p,e,v,l,g,lines]=await Promise.all([
   supabase.from("sales_invoices").select("id,invoice_date,total_amount,taxable_value,cgst,sgst,igst,paid_amount").eq("company_id",currentCompanyId).eq("is_deleted",false),
   supabase.from("purchase_invoices").select("id,invoice_date,grand_total,taxable,cgst,sgst,igst,paid_amount").eq("company_id",currentCompanyId).eq("is_deleted",false),
   supabase.from("expenses").select("id,expense_date,total_amount,cgst,sgst,igst,paid_amount").eq("company_id",currentCompanyId),
   supabase.from("accounting_vouchers").select("*").eq("company_id",currentCompanyId).eq("status","Posted"),
   supabase.from("chart_of_accounts").select("*").eq("company_id",currentCompanyId),
   supabase.from("account_groups").select("*").eq("company_id",currentCompanyId),
   supabase.from("accounting_voucher_lines").select("*").eq("company_id",currentCompanyId)
  ]);
  for(const r of [s,p,e,v,l,g,lines])if(r.error)throw r.error;
  if(live)setRows({sales:s.data||[],purchases:p.data||[],expenses:e.data||[],vouchers:v.data||[],ledgers:l.data||[],groups:g.data||[],lines:lines.data||[]});
 }catch(err){if(live)setError(err.message||"Unable to load business dashboard.");}finally{if(live)setLoading(false);}}
 load();return()=>{live=false;};},[currentCompanyId]);
 const totals=useMemo(()=>{
  const sum=(a,k)=>a.reduce((s,x)=>s+Number(x[k]||0),0);
  const output=rows.sales.reduce((s,x)=>s+Number(x.cgst||0)+Number(x.sgst||0)+Number(x.igst||0),0);
  const input=rows.purchases.reduce((s,x)=>s+Number(x.cgst||0)+Number(x.sgst||0)+Number(x.igst||0),0)+rows.expenses.reduce((s,x)=>s+Number(x.cgst||0)+Number(x.sgst||0)+Number(x.igst||0),0);
  const posted=new Set(rows.vouchers.map(v=>v.id));
  const balances=rows.ledgers.map(l=>{const opening=Number(l.opening_balance||0)*(l.opening_balance_type==="Credit"?-1:1);const movement=rows.lines.filter(x=>x.ledger_id===l.id&&posted.has(x.voucher_id)).reduce((s,x)=>s+Number(x.debit||0)-Number(x.credit||0),0);return {...l,balance:opening+movement};});
  const receivables=rows.sales.reduce((s,x)=>s+Math.max(0,Number(x.total_amount||0)-Number(x.paid_amount||0)),0);
  const payables=rows.purchases.reduce((s,x)=>s+Math.max(0,Number(x.grand_total||0)-Number(x.paid_amount||0)),0);
  const income=rows.ledgers.filter(l=>rows.groups.find(g=>g.id===l.group_id)?.account_nature==="Income").reduce((s,l)=>s+Math.max(0,-(balances.find(x=>x.id===l.id)?.balance||0)),0);
  const expense=rows.ledgers.filter(l=>rows.groups.find(g=>g.id===l.group_id)?.account_nature==="Expense").reduce((s,l)=>s+Math.max(0,balances.find(x=>x.id===l.id)?.balance||0),0);
  return {sales:sum(rows.sales,"total_amount"),purchases:sum(rows.purchases,"grand_total"),expenses:sum(rows.expenses,"total_amount"),output,input,receivables,payables,profit:income-expense};
 },[rows]);
 const chart=useMemo(()=>{const now=new Date();return Array.from({length:6},(_,i)=>{const d=new Date(now.getFullYear(),now.getMonth()-5+i,1),key=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");return {label:d.toLocaleDateString("en-IN",{month:"short"}),sales:rows.sales.filter(x=>monthKey(x.invoice_date)===key).reduce((s,x)=>s+Number(x.total_amount||0),0),purchases:rows.purchases.filter(x=>monthKey(x.invoice_date)===key).reduce((s,x)=>s+Number(x.grand_total||0),0)};});},[rows]);
 const max=Math.max(1,...chart.flatMap(x=>[x.sales,x.purchases]));
 return <main className="bd-page"><header className="bd-heading"><div><span>SYD BUSINESS OVERVIEW</span><h1>Dashboard</h1><p>{currentCompany?.company_name||"Select or create your company"} · Your business at a glance</p></div><button onClick={()=>navigate("/app/companies")}>＋ Company Setup</button></header>
 {error&&<div className="bd-error">{error}</div>}
 {!currentCompanyId?<section className="bd-empty"><h2>Welcome to SYD</h2><p>Create your company to start billing and accounting.</p><button onClick={()=>navigate("/app/companies")}>Create Company</button></section>:<>
 <section className="bd-kpis">{[["Sales",totals.sales,"/app/sales-register"],["Purchases",totals.purchases,"/app/purchase-register"],["Expenses",totals.expenses,"/app/expense-register"],["Receivables",totals.receivables,"/app/reports/receivables"],["Payables",totals.payables,"/app/reports/payables"],["Output GST",totals.output,"/app/gst-dashboard"],["Input GST",totals.input,"/app/gst-dashboard"],["Accounting Profit",totals.profit,"/app/accounting"]].map(([label,value,path])=><button className="bd-kpi" key={label} onClick={()=>navigate(path)}><span>{label}</span><strong>{loading?"—":money(value)}</strong><small>View details →</small></button>)}</section>
 <section className="bd-grid"><article className="bd-panel"><div className="bd-panel-heading"><div><h2>Sales vs Purchases</h2><p>Last six months · Based on saved invoices</p></div></div><div className="bd-chart">{chart.map(x=><div className="bd-month" key={x.label}><div className="bd-bars"><i style={{height:(x.sales/max*100)+"%"}}/><b style={{height:(x.purchases/max*100)+"%"}}/></div><small>{x.label}</small></div>)}</div><div className="bd-legend"><span>● Sales</span><span>● Purchases</span></div></article><article className="bd-panel"><h2>Quick Actions</h2><div className="bd-actions"><button onClick={()=>navigate("/app/sales")}>＋ Sales Invoice</button><button onClick={()=>navigate("/app/purchases")}>＋ Purchase Invoice</button><button onClick={()=>navigate("/app/expenses")}>＋ Add Expense</button><button onClick={()=>navigate("/app/receipts")}>↓ Record Receipt</button><button onClick={()=>navigate("/app/payments")}>↑ Record Payment</button><button onClick={()=>navigate("/app/banking/overview")}>▣ Banking Overview</button></div></article></section>
 <section className="bd-panel"><div className="bd-panel-heading"><div><h2>Recent Accounting Activity</h2><p>Posted vouchers for the selected company</p></div><button onClick={()=>navigate("/app/accounting")}>Open Accounting →</button></div><div className="bd-table-wrap"><table><thead><tr><th>Date</th><th>Voucher</th><th>Type</th><th>Narration</th><th>Amount</th></tr></thead><tbody>{rows.vouchers.slice(0,8).map(v=><tr key={v.id}><td>{v.voucher_date}</td><td>{v.voucher_number}</td><td>{v.voucher_type}</td><td>{v.narration||"—"}</td><td>{money(v.total_debit)}</td></tr>)}{!rows.vouchers.length&&<tr><td colSpan="5">No posted accounting vouchers yet.</td></tr>}</tbody></table></div></section>
 </>}
 </main>;
}
