import React,{useEffect,useMemo,useState} from "react";
import {useCompany} from "../../context/CompanyContext";
import {supabase} from "../../supabase/supabaseClient";
import "./OutstandingWorkspace.css";
const money=v=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(Number(v)||0);
const ageDays=d=>d?Math.max(0,Math.floor((Date.now()-new Date(d+"T00:00:00").getTime())/86400000)):0;
const bucket=days=>days<=30?"0–30":days<=60?"31–60":days<=90?"61–90":">90";
export default function OutstandingWorkspace({kind="customer"}){
 const {currentCompanyId}=useCompany();const isReceivable=kind==="customer";
 const [rows,setRows]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(""),[search,setSearch]=useState(""),[filter,setFilter]=useState("All");
 useEffect(()=>{let live=true;async function load(){if(!currentCompanyId){setRows([]);setLoading(false);return;}setLoading(true);setError("");try{
  if(isReceivable){
   const [inv,receipts]=await Promise.all([
    supabase.from("sales_invoices").select("id,invoice_no,invoice_date,customer_id,customer_name,total_amount,sale_type").eq("company_id",currentCompanyId).eq("is_deleted",false).order("invoice_date",{ascending:false}),
    supabase.from("sales_invoice_receipts").select("invoice_id,amount").eq("company_id",currentCompanyId)
   ]);if(inv.error)throw inv.error;if(receipts.error)throw receipts.error;
   const paidMap=new Map();(receipts.data||[]).forEach(x=>paidMap.set(x.invoice_id,(paidMap.get(x.invoice_id)||0)+Number(x.amount||0)));
   const result=(inv.data||[]).map(x=>{const total=Number(x.total_amount||0);const paid=String(x.sale_type||"").toLowerCase()==="cash"?total:Math.min(total,paidMap.get(x.id)||0);const balance=Math.max(0,total-paid);const days=ageDays(x.invoice_date);return {...x,party:x.customer_name||"Customer",total,paid,balance,days,age_bucket:bucket(days)};}).filter(x=>x.balance>0.01);
   if(live)setRows(result);
  }else{
   const [inv,payments,vendors]=await Promise.all([
    supabase.from("purchase_invoices").select("id,invoice_no,invoice_date,supplier_invoice_no,vendor_id,grand_total,paid_amount").eq("company_id",currentCompanyId).eq("is_deleted",false).order("invoice_date",{ascending:false}),
    supabase.from("purchase_invoice_payments").select("invoice_id,amount").eq("company_id",currentCompanyId),
    supabase.from("vendors").select("id,vendor_name").eq("company_id",currentCompanyId)
   ]);for(const r of [inv,payments,vendors])if(r.error)throw r.error;
   const paidMap=new Map();(payments.data||[]).forEach(x=>paidMap.set(x.invoice_id,(paidMap.get(x.invoice_id)||0)+Number(x.amount||0)));const vm=new Map((vendors.data||[]).map(x=>[x.id,x.vendor_name]));
   const result=(inv.data||[]).map(x=>{const total=Number(x.grand_total||0);const paid=Math.min(total,Math.max(Number(x.paid_amount||0),paidMap.get(x.id)||0));const balance=Math.max(0,total-paid);const days=ageDays(x.invoice_date);return {...x,party:vm.get(x.vendor_id)||"Supplier",total,paid,balance,days,age_bucket:bucket(days)};}).filter(x=>x.balance>0.01);
   if(live)setRows(result);
  }
 }catch(e){if(live)setError(e.message||"Unable to load outstanding invoices.");}finally{if(live)setLoading(false);}}
 load();return()=>{live=false;};},[currentCompanyId,isReceivable]);
 const filtered=useMemo(()=>rows.filter(x=>(!search||[x.invoice_no,x.supplier_invoice_no,x.party].join(" ").toLowerCase().includes(search.toLowerCase()))&&(filter==="All"||x.age_bucket===filter)),[rows,search,filter]);
 const total=filtered.reduce((s,x)=>s+x.balance,0);
 const buckets=["0–30","31–60","61–90",">90"].map(b=>({label:b,amount:rows.filter(x=>x.age_bucket===b).reduce((s,x)=>s+x.balance,0),count:rows.filter(x=>x.age_bucket===b).length}));
 const exportCsv=()=>{const head=["Invoice","Date","Party","Invoice Value","Paid","Outstanding","Age Days","Age Bucket"];const csv=[head,...filtered.map(x=>[x.invoice_no,x.invoice_date,x.party,x.total,x.paid,x.balance,x.days,x.age_bucket])].map(row=>row.map(v=>'"'+String(v??"").replaceAll('"','""')+'"').join(",")).join("\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download=isReceivable?"SYD_Receivables_Ageing.csv":"SYD_Payables_Ageing.csv";a.click();URL.revokeObjectURL(a.href);};
 return <main className="out-page"><div className="out-eyebrow">SYD / REPORTS</div><header className="out-heading"><div><h1>{isReceivable?"Receivables Ageing":"Payables Ageing"}</h1><p>{isReceivable?"Customer invoices awaiting collection":"Supplier invoices awaiting payment"}</p></div><button onClick={exportCsv}>↓ Export CSV</button></header>{error&&<div className="out-error">{error}</div>}<section className="out-buckets">{buckets.map(x=><article key={x.label}><span>{x.label} days</span><strong>{money(x.amount)}</strong><small>{x.count} invoices</small></article>)}</section><section className="out-panel"><div className="out-toolbar"><input placeholder="Search invoice or party…" value={search} onChange={e=>setSearch(e.target.value)}/><select value={filter} onChange={e=>setFilter(e.target.value)}><option>All</option>{["0–30","31–60","61–90",">90"].map(x=><option key={x}>{x}</option>)}</select><b>Total: {money(total)}</b></div><div className="out-table-wrap"><table><thead><tr><th>Invoice No.</th><th>Date</th><th>{isReceivable?"Customer":"Supplier"}</th><th>Invoice Value</th><th>Paid</th><th>Outstanding</th><th>Age</th></tr></thead><tbody>{filtered.map(x=><tr key={x.id}><td><b>{x.invoice_no}</b></td><td>{x.invoice_date}</td><td>{x.party}</td><td>{money(x.total)}</td><td>{money(x.paid)}</td><td><strong>{money(x.balance)}</strong></td><td><span className={"out-age age-"+x.age_bucket.replace(/[^0-9]/g,"")}>{x.days} days</span></td></tr>)}{!filtered.length&&<tr><td colSpan="7">{loading?"Loading…":"No outstanding invoices for this company."}</td></tr>}</tbody></table></div></section><p className="out-note">Ageing is calculated from invoice date because invoice-level due dates are not currently stored on these invoice records. Cash sales are treated as paid. Record receipts and payments through Banking &amp; Money to keep outstanding balances current.</p></main>;
}
