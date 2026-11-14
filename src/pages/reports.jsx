import React, { useEffect, useMemo, useState } from "react";
import { FiBarChart2, FiCalendar, FiDownload, FiFileText, FiFilter, FiSearch, FiTrendingUp } from "react-icons/fi";
import { useCompany } from "../context/CompanyContext";
import { supabase } from "../supabase/supabaseClient";
import "../css/BillingReports.css";
import { jsPDF } from "jspdf";

const titles={sales:"Sales Reports",purchases:"Purchase Reports",expenses:"Expense Reports",customer:"Customer Ledger",vendor:"Vendor Ledger",item:"Item Ledger",gst:"GST Reports","receivables-ageing":"Receivables Ageing","payables-ageing":"Payables Ageing"};
const today=new Date();
const iso=d=>new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10);
const money=v=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(v)||0);
const n=v=>Number(v)||0;
const inRange=(d,a,b)=>(!a||d>=a)&&(!b||d<=b);
const csvCell=v=>`"${String(v??"").replaceAll('"','""')}"`;
const cols=items=>items.map(([key,label,numeric=false])=>({key,label,numeric}));
async function fetchCompany(table,companyId,order){let q=supabase.from(table).select("*").eq("company_id",companyId);if(order)q=q.order(order,{ascending:false});const {data,error}=await q;if(error)throw error;return data||[]}
async function fetchLines(table,ids){if(!ids.length)return[];const{data,error}=await supabase.from(table).select("*").in("invoice_id",ids);if(error)throw error;return data||[]}
const gst=row=>n(row.cgst)+n(row.sgst)+n(row.igst);
const dateLabel=d=>d?new Date(d+"T00:00:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):"—";
const sum=(rows,fn)=>rows.reduce((a,r)=>a+fn(r),0);
const chartFor=(rows,dateKey,amountKey)=>{const labels=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];const current=today.getMonth();const ix=Array.from({length:6},(_,i)=>(current-5+i+12)%12);const values=ix.map(m=>sum(rows.filter(r=>new Date((r[dateKey]||"")+"T00:00:00").getMonth()===m),r=>n(r[amountKey])));return{labels:ix.map(i=>labels[i]),values}};

export default function ReportsWorkspace({kind}){
 const{currentCompany,currentCompanyId}=useCompany();
 const[db,setDb]=useState({}),[loading,setLoading]=useState(false),[error,setError]=useState(""),[search,setSearch]=useState("");
 const fyStart=today.getMonth()>=3?today.getFullYear():today.getFullYear()-1;const fyLabel=`${fyStart}-${String((fyStart+1)%100).padStart(2,"0")}`;
 const[filters,setFilters]=useState({from:`${today.getFullYear()}-01-01`,to:iso(today),party:"",category:"",tab:"GSTR-3B"});
 const[range,setRange]=useState({from:`${today.getFullYear()}-01-01`,to:iso(today)});
 const set=(key,value)=>setFilters(p=>({...p,[key]:value}));
 useEffect(()=>{let active=true;if(!currentCompanyId){setDb({});return()=>{active=false}}setLoading(true);setError("");
  (async()=>{try{let d={};
   if(kind==="sales"){[d.sales,d.customers]=await Promise.all([fetchCompany("sales_invoices",currentCompanyId,"invoice_date"),fetchCompany("customers",currentCompanyId,"customer_name")]);}
   if(kind==="receivables-ageing"){[d.sales,d.customers]=await Promise.all([fetchCompany("sales_invoices",currentCompanyId,"invoice_date"),fetchCompany("customers",currentCompanyId,"customer_name")]);}
   if(kind==="payables-ageing"){[d.purchases,d.vendors]=await Promise.all([fetchCompany("purchase_invoices",currentCompanyId,"invoice_date"),fetchCompany("vendors",currentCompanyId,"vendor_name")]);}
   if(kind==="purchases"){[d.purchases,d.vendors]=await Promise.all([fetchCompany("purchase_invoices",currentCompanyId,"invoice_date"),fetchCompany("vendors",currentCompanyId,"vendor_name")]);}
   if(kind==="expenses"){[d.expenses,d.vendors]=await Promise.all([fetchCompany("expenses",currentCompanyId,"expense_date"),fetchCompany("vendors",currentCompanyId,"vendor_name")]);const r=await supabase.from("expense_categories").select("*").order("category_name");if(r.error)throw r.error;d.categories=r.data||[];}
   if(kind==="customer"){[d.customers,d.sales,d.credits]=await Promise.all([fetchCompany("customers",currentCompanyId,"customer_name"),fetchCompany("sales_invoices",currentCompanyId,"invoice_date"),fetchCompany("credit_notes",currentCompanyId,"credit_note_date")]);}
   if(kind==="vendor"){[d.vendors,d.purchases,d.debits,d.payments]=await Promise.all([fetchCompany("vendors",currentCompanyId,"vendor_name"),fetchCompany("purchase_invoices",currentCompanyId,"invoice_date"),fetchCompany("debit_notes",currentCompanyId,"debit_note_date"),fetchCompany("expense_payments",currentCompanyId,"payment_date")]);}
   if(kind==="item"||kind==="gst"){[d.items,d.sales,d.purchases]=await Promise.all([kind==="item"?fetchCompany("items",currentCompanyId,"item_name"):Promise.resolve([]),fetchCompany("sales_invoices",currentCompanyId,"invoice_date"),fetchCompany("purchase_invoices",currentCompanyId,"invoice_date")]);d.sales=(d.sales||[]).filter(r=>!r.is_deleted);d.purchases=(d.purchases||[]).filter(r=>!r.is_deleted);[d.saleLines,d.purchaseLines]=await Promise.all([fetchLines("sales_invoice_items",d.sales.map(r=>r.id)),fetchLines("purchase_invoice_items",d.purchases.map(r=>r.id))]);}
   if(kind==="gst")d.expenses=await fetchCompany("expenses",currentCompanyId,"expense_date");
   Object.keys(d).forEach(k=>{if(Array.isArray(d[k])&&["sales","purchases","credits","debits"].includes(k))d[k]=d[k].filter(r=>!r.is_deleted)});
   if(active)setDb(d);
  }catch(e){if(active)setError(e.message||"Could not load report data.");}finally{if(active)setLoading(false)}})();
  return()=>{active=false};
 },[kind,currentCompanyId]);
 const report=useMemo(()=>build(kind,db,range,filters),[kind,db,range,filters]);
 const apply=()=>setRange({from:filters.from,to:filters.to});
 const exportCsv=()=>{const content=[report.columns.map(c=>c.label),...report.rows.map(r=>report.columns.map(c=>r[c.key]??""))].map(row=>row.map(csvCell).join(",")).join("\r\n");const url=URL.createObjectURL(new Blob(["\uFEFF"+content],{type:"text/csv;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download=`${kind}-report-${range.from}-to-${range.to}.csv`;a.click();URL.revokeObjectURL(url)};
 const exportPdf=()=>{
  const doc=new jsPDF({orientation:"landscape",unit:"mm",format:"a4"});
  const margin=12,pageWidth=doc.internal.pageSize.getWidth(),pageHeight=doc.internal.pageSize.getHeight(),usable=pageWidth-margin*2;
  const pdfCols=report.taxRows?[["rate","Rate"],["taxable","Taxable Value"],["cgst","CGST"],["sgst","SGST"],["igst","IGST"],["cess","Cess"],["tax","Total Tax"]]:report.columns.map(c=>[c.key,c.label]);
  const pdfRows=report.taxRows?report.taxRows.map(r=>({rate:r.rate+"%",taxable:money(r.taxable),cgst:money(r.cgst),sgst:money(r.sgst),igst:money(r.igst),cess:money(r.cess),tax:money(r.tax)})):report.rows;
  const colWidth=usable/Math.max(pdfCols.length,1);
  const drawHeader=(continued=false)=>{
   doc.setFont("helvetica","bold");doc.setFontSize(17);doc.setTextColor(20,37,68);doc.text(titles[kind]+(continued?" (Continued)":""),margin,14);
   doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(70,88,114);doc.text(currentCompany?.company_name||"",margin,21);
   doc.text(`Period: ${range.from} to ${range.to}`,pageWidth-margin,21,{align:"right"});
   let y=29;
   if(!continued&&report.cards?.length){const cardWidth=usable/report.cards.length;report.cards.forEach((card,index)=>{const x=margin+index*cardWidth;doc.setFont("helvetica","normal");doc.setFontSize(8);doc.text(card.label,x,y);doc.setFont("helvetica","bold");doc.setFontSize(10);doc.text(String(card.value),x,y+5)});y+=13;}
   doc.setFillColor(7,88,234);doc.rect(margin,y,usable,9,"F");doc.setTextColor(255,255,255);doc.setFont("helvetica","bold");doc.setFontSize(7.5);
   pdfCols.forEach(([key,label],index)=>doc.text(doc.splitTextToSize(label,colWidth-2)[0],margin+index*colWidth+1,y+5.8,{maxWidth:colWidth-2}));
   doc.setTextColor(30,45,65);return y+9;
  };
  let y=drawHeader(false);
  if(!pdfRows.length){doc.setFont("helvetica","normal");doc.setFontSize(10);doc.text("No records for the selected date range.",margin,y+8);}
  pdfRows.forEach(row=>{
   const cells=pdfCols.map(([key])=>String(row[key]??"—"));
   const wrapped=cells.map(value=>doc.splitTextToSize(value,colWidth-2));
   const height=Math.max(7,...wrapped.map(lines=>Math.min(lines.length,3)*3.2+2));
   if(y+height>pageHeight-15){doc.addPage();y=drawHeader(true);}
   if(Math.floor((y-38)/7)%2===0){doc.setFillColor(246,249,253);doc.rect(margin,y,usable,height,"F");}
   doc.setFont("helvetica","normal");doc.setFontSize(7.5);doc.setTextColor(30,45,65);
   wrapped.forEach((lines,index)=>doc.text(lines.slice(0,3),margin+index*colWidth+1,y+4,{maxWidth:colWidth-2}));
   y+=height;doc.setDrawColor(225,232,241);doc.line(margin,y,margin+usable,y);
  });
  for(let page=1;page<=doc.getNumberOfPages();page++){doc.setPage(page);doc.setFontSize(8);doc.setTextColor(100,116,139);doc.text(`Page ${page} of ${doc.getNumberOfPages()}`,pageWidth-margin,pageHeight-7,{align:"right"});}
  doc.save(`${kind}-report-${range.from}-to-${range.to}.pdf`);
 };
 return <main className="billing-reports">
  <header className="br-heading"><div><p>Billing &amp; Accounting <i>/</i> Reports <i>/</i> {titles[kind]}</p><h1>{titles[kind]}</h1></div><span className="br-company">{currentCompany?.company_name||"Select company"}</span></header>
  {error&&<div className="br-error" role="alert">{error}</div>}
  {!currentCompanyId?<section className="br-card br-empty">Select a current company from the sidebar to view its reports.</section>:<>
   <section className="br-card br-filters">
    {(kind==="customer"||kind==="vendor"||kind==="item")&&<FilterSelect label={kind==="customer"?"Customer":kind==="vendor"?"Vendor":"Item"} value={filters.party} set={v=>set("party",v)} options={(db[kind==="customer"?"customers":kind==="vendor"?"vendors":"items"]||[]).map(r=>[r.id,r.customer_name||r.vendor_name||r.item_name])}/>}
    <DateInput label="From Date" value={filters.from} set={v=>set("from",v)}/>
    <DateInput label="To Date" value={filters.to} set={v=>set("to",v)}/>
    {kind==="sales"&&<FilterSelect label="Customer" value={filters.party} set={v=>set("party",v)} options={(db.customers||[]).map(r=>[r.id,r.customer_name])}/>}
    {kind==="purchases"&&<FilterSelect label="Supplier" value={filters.party} set={v=>set("party",v)} options={(db.vendors||[]).map(r=>[r.id,r.vendor_name])}/>}
    {kind==="expenses"&&<><FilterSelect label="Category" value={filters.category} set={v=>set("category",v)} options={(db.categories||[]).map(r=>[r.id,r.category_name])}/><FilterSelect label="Payment Status" value={filters.party} set={v=>set("party",v)} options={["Paid","Partially Paid","Unpaid"].map(v=>[v,v])}/></>}
    {kind==="gst"&&<label className="br-control"><span>Financial Year</span><select value={fyStart} onChange={e=>{const year=Number(e.target.value);const next={from:`${year}-04-01`,to:`${year+1}-03-31`};setFilters(p=>({...p,...next}));setRange(next)}}><option value={fyStart}>{fyLabel}</option><option value={fyStart-1}>{fyStart-1}-${String(fyStart%100).padStart(2,"0")}</option></select></label>}
    <button className="br-btn br-primary" onClick={apply}><FiFilter/> Apply Filters</button><button className="br-btn" onClick={exportCsv}><FiDownload/> Export Excel</button><button className="br-btn" onClick={exportPdf}><FiFileText/> Download PDF</button>
   </section>
   {report.tabs&&<nav className="br-tabs">{report.tabs.map(t=><button className={filters.tab===t?"active":""} onClick={()=>set("tab",t)} key={t}>{t}</button>)}</nav>}
   {report.identity&&<section className="br-card br-identity"><span>{kind==="customer"?"C":kind==="vendor"?"V":"▦"}</span><div><h2>{report.identity.name}</h2><p>{report.identity.meta}</p></div></section>}
   <section className="br-kpis">{report.cards.map((c,i)=><article className={`br-card br-kpi k${i%4}`} key={c.label}><i>{i===0?<FiBarChart2/>:i===1?<FiTrendingUp/>:i===2?<FiFileText/>:<FiDownload/>}</i><div><small>{c.label}</small><b>{c.value}</b></div></article>)}</section>
   {report.chart&&<section className="br-card br-chart"><div className="br-section-title"><div><h2>{report.chart.title}</h2><p>Based on records in the selected date range</p></div><span>● {report.chart.legend}</span></div><div className="br-bars">{report.chart.values.map((v,i)=><div className="br-bar-group" key={report.chart.labels[i]}><small>{money(v)}</small><div className="br-bar-area"><i style={{height:`${Math.max(3,Math.round(v/Math.max(...report.chart.values,1)*100))}%`}}/></div><span>{report.chart.labels[i]}</span></div>)}</div></section>}
   {report.taxRows&&<section className="br-card br-tabs-summary"><h2>GST Summary by Tax Rate</h2><div className="br-table-wrap"><table className="br-table"><thead><tr>{["Rate","Taxable Value (₹)","CGST (₹)","SGST (₹)","IGST (₹)","Cess (₹)","Total Tax (₹)"].map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{report.taxRows.map(r=><tr key={r.rate}>{[r.rate,money(r.taxable),money(r.cgst),money(r.sgst),money(r.igst),money(r.cess),money(r.tax)].map((v,i)=><td className={i?"num":""} key={i}>{v}</td>)}</tr>)}<tr className="br-total"><td>Total</td>{report.taxTotals.map((x,i)=><td className="num" key={i}>{money(x)}</td>)}</tr></tbody></table></div></section>}
   {!report.taxRows&&<section className="br-card br-table-card"><div className="br-section-title"><div><h2>{report.tableTitle}</h2><p>{report.rows.length} records · {range.from} to {range.to}</p></div><label className="br-search"><FiSearch/><input placeholder="Search report rows" value={search} onChange={e=>setSearch(e.target.value)}/></label></div>
    {loading?<div className="br-empty">Loading company report data…</div>:report.rows.filter(r=>JSON.stringify(r).toLowerCase().includes(search.toLowerCase())).length===0?<div className="br-empty">No records match this report and date range.</div>:<div className="br-table-wrap"><table className="br-table"><thead><tr>{report.columns.map(c=><th key={c.key} className={c.numeric?"num":""}>{c.label}</th>)}</tr></thead><tbody>{report.rows.filter(r=>JSON.stringify(r).toLowerCase().includes(search.toLowerCase())).map((r,i)=><tr key={r.id||i}>{report.columns.map(c=><td key={c.key} className={c.numeric?"num":""}>{c.render?c.render(r[c.key],r):r[c.key]??"—"}</td>)}</tr>)}</tbody></table></div>}
   </section>}
   {report.note&&<p className="br-note">{report.note}</p>}
  </>}
 </main>
}
function DateInput({label,value,set}){return <label className="br-control"><span>{label}</span><div><FiCalendar/><input type="date" value={value} onChange={e=>set(e.target.value)}/></div></label>}
function FilterSelect({label,value,set,options}){return <label className="br-control"><span>{label}</span><select value={value} onChange={e=>set(e.target.value)}><option value="">All {label.replace(/s$/,"")}</option>{options.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>}
function build(kind,d,range,f){
 const rowsFor=(arr,date)=>((arr||[]).filter(r=>!r.is_deleted&&inRange(r[date]||"",range.from,range.to)));
 const formatRow=(r,party,date,number,base,total,tax,status="Posted",extra={})=>({id:r.id,rawDate:r[date],date:dateLabel(r[date]),number:r[number]||"—",party:party||"—",base:money(base),tax:money(tax),total:money(total),amount:n(total),status,...extra});
 if(kind==="sales"){
  const rows=rowsFor(d.sales,"invoice_date").filter(r=>!f.party||r.customer_id===f.party).map(r=>formatRow(r,r.customer_name,"invoice_date","invoice_no",r.taxable_value,r.total_amount,gst(r),r.payment_status||r.sale_type||"Posted",{type:r.sale_type||r.gst_type||"Sale"}));
  const orig=d.sales||[];
  return{cards:[["Gross Sales",money(sum(rows,r=>r.amount))],["Taxable Value",money(sum(orig.filter(r=>!r.is_deleted&&inRange(r.invoice_date,range.from,range.to)&&(!f.party||r.customer_id===f.party)),r=>n(r.taxable_value)))],["GST Collected",money(sum(orig.filter(r=>!r.is_deleted&&inRange(r.invoice_date,range.from,range.to)&&(!f.party||r.customer_id===f.party)),gst))],["Invoices",String(rows.length)]].map(([label,value])=>({label,value})),chart:{title:"Monthly Sales",legend:"Sales",...chartFor(rows,"rawDate","amount")},tableTitle:"Sales Register",columns:cols([["number","Invoice No."],["date","Date"],["party","Customer"],["type","Invoice Type"],["base","Taxable Value",true],["tax","GST",true],["total","Total",true],["status","Status"]]),rows};
 }
 if(kind==="purchases"){
  const vm=new Map((d.vendors||[]).map(v=>[v.id,v.vendor_name]));
  const base=rowsFor(d.purchases,"invoice_date").filter(r=>!f.party||r.vendor_id===f.party);
  const rows=base.map(r=>formatRow(r,vm.get(r.vendor_id)||r.vendor_name,"invoice_date","invoice_no",r.taxable,r.grand_total,gst(r),r.payment_status||"Unpaid",{supplierInvoice:r.supplier_invoice_no||"—"}));
  return{cards:[["Total Purchases",money(sum(base,r=>r.grand_total))],["Input Tax Credit",money(sum(base,gst))],["Paid",money(sum(base,r=>r.paid_amount))],["Outstanding",money(sum(base,r=>Math.max(0,n(r.grand_total)-n(r.paid_amount))))]].map(([label,value])=>({label,value})),chart:{title:"Monthly Purchases",legend:"Purchases",...chartFor(rows,"rawDate","amount")},tableTitle:"Purchase Register",columns:cols([["number","Purchase No."],["date","Date"],["party","Supplier"],["supplierInvoice","Supplier Invoice"],["base","Taxable Value",true],["tax","GST",true],["total","Total",true],["status","Payment Status"]]),rows};
 }
 if(kind==="expenses"){
  const cm=new Map((d.categories||[]).map(c=>[c.id,c.category_name])),vm=new Map((d.vendors||[]).map(v=>[v.id,v.vendor_name]));
  const base=rowsFor(d.expenses,"expense_date").filter(r=>(!f.category||r.category_id===f.category)&&(!f.party||r.payment_status===f.party));
  const rows=base.map(r=>formatRow(r,r.payee_name||vm.get(r.vendor_id),"expense_date","expense_no",r.taxable_amount,r.total_amount,gst(r),r.payment_status||"Unpaid",{category:cm.get(r.category_id)||"Uncategorized",mode:r.payment_mode||"—"}));
  return{cards:[["Total Expenses",money(sum(base,r=>r.total_amount))],["This Month",money(sum(base.filter(r=>r.expense_date?.slice(0,7)===iso(today).slice(0,7)),r=>r.total_amount))],["GST Input Credit",money(sum(base,gst))],["Pending Payments",money(sum(base.filter(r=>r.payment_status!=="Paid"),r=>Math.max(0,n(r.total_amount)-n(r.paid_amount))))]].map(([label,value])=>({label,value})),chart:{title:"Monthly Expenses",legend:"Expenses",...chartFor(rows,"rawDate","amount")},tableTitle:"Expense Register",columns:cols([["date","Date"],["number","Expense No."],["party","Payee"],["category","Category"],["mode","Payment Mode"],["base","Taxable",true],["tax","GST",true],["total","Total",true],["status","Status"]]),rows};
 }
 if(kind==="receivables-ageing"||kind==="payables-ageing"){
  const receivable=kind==="receivables-ageing",invoices=receivable?(d.sales||[]):(d.purchases||[]),parties=receivable?(d.customers||[]):(d.vendors||[]),partyMap=new Map(parties.map(p=>[p.id,receivable?p.customer_name:p.vendor_name]));
  const todayDate=new Date();const ageing=invoices.filter(r=>!r.is_deleted).map(r=>{const gross=n(receivable?r.total_amount:r.grand_total),paid=n(r.paid_amount),balance=Math.max(0,gross-paid),date=r.due_date||r.invoice_date,days=date?Math.max(0,Math.floor((todayDate-new Date(date+"T00:00:00"))/86400000)):0;return{party:partyMap.get(receivable?r.customer_id:r.vendor_id)||"Unknown Party",number:r.invoice_no||"—",date:dateLabel(date),days,balance,b0:days<=30?balance:0,b1:days>30&&days<=60?balance:0,b2:days>60&&days<=90?balance:0,b3:days>90?balance:0};}).filter(r=>r.balance>0).sort((a,b)=>b.days-a.days);
  const rows=ageing.map((r,i)=>({id:i,party:r.party,number:r.number,date:r.date,days:r.days+" days","0-30":money(r.b0),"31-60":money(r.b1),"61-90":money(r.b2),"90+":money(r.b3),outstanding:money(r.balance)}));
  const total=key=>money(sum(ageing,r=>r[key]));
  return{cards:[["Total Outstanding",money(sum(ageing,r=>r.balance))],["0–30 Days",total("b0")],["31–60 Days",total("b1")],["61–90 Days",total("b2")],["Over 90 Days",total("b3")]].map(([label,value])=>({label,value})),tableTitle:receivable?"Receivables Ageing":"Payables Ageing",columns:cols([["party",receivable?"Customer":"Supplier"],["number","Invoice No."],["date","Invoice / Due Date"],["days","Age"],["0-30","0–30 Days"],["31-60","31–60 Days"],["61-90","61–90 Days"],["90+","Over 90 Days"],["outstanding","Outstanding"]]),rows,note:"Age is calculated from due_date when available, otherwise invoice_date. The current invoice schema may not contain due dates; confirm payment terms before using this for collections or payment decisions."};
 }
 if(kind==="customer"||kind==="vendor"){
  const isC=kind==="customer",list=isC?d.customers||[]:d.vendors||[],selected=list.find(r=>r.id===f.party),sid=selected?.id;
  let entries=[];
  if(sid&&isC) entries=[...(d.sales||[]).filter(r=>r.customer_id===sid).map(r=>({date:r.invoice_date,particulars:"Sales Invoice",type:"Sales Invoice",number:r.invoice_no,debit:n(r.total_amount),credit:0,id:r.id})),...(d.credits||[]).filter(r=>r.customer_id===sid).map(r=>({date:r.credit_note_date,particulars:"Credit Note",type:"Credit Note",number:r.credit_note_no,debit:0,credit:n(r.total_amount),id:r.id}))];
  if(sid&&!isC) entries=[...(d.purchases||[]).filter(r=>r.vendor_id===sid).map(r=>({date:r.invoice_date,particulars:"Purchase Invoice",type:"Purchase Invoice",number:r.invoice_no,debit:0,credit:n(r.grand_total),id:r.id})),...(d.purchases||[]).filter(r=>r.vendor_id===sid&&n(r.paid_amount)>0).map(r=>({date:r.invoice_date,particulars:"Payment recorded",type:"Payment",number:r.invoice_no+" · payment",debit:n(r.paid_amount),credit:0,id:r.id+"p"})),...(d.debits||[]).filter(r=>r.vendor_id===sid).map(r=>({date:r.debit_note_date,particulars:"Debit Note",type:"Debit Note",number:r.debit_note_no,debit:n(r.total_amount),credit:0,id:r.id})),...(d.payments||[]).filter(r=>r.vendor_id===sid&&!r.expense_id&&r.status==="Completed").map(r=>({date:r.payment_date,particulars:"Vendor Payment",type:"Payment",number:r.payment_no,debit:n(r.amount),credit:0,id:r.id}))];
  entries=entries.filter(r=>inRange(r.date,range.from,range.to)).sort((a,b)=>(a.date||"").localeCompare(b.date||""));
  let balance=0;const rows=entries.map(r=>{balance+=isC?r.debit-r.credit:r.credit-r.debit;return{id:r.id,date:dateLabel(r.date),particulars:r.particulars,type:r.type,number:r.number,debit:money(r.debit),credit:money(r.credit),balance:money(Math.abs(balance))+(isC?(balance<0?" Cr":" Dr"):(balance<0?" Dr":" Cr"))}});
  const debit=sum(entries,r=>r.debit),credit=sum(entries,r=>r.credit),payments=sum(entries.filter(r=>r.type==="Payment"),r=>r.debit);
  return{identity:selected?{name:isC?selected.customer_name:selected.vendor_name,meta:[selected.gstin&&"GSTIN: "+selected.gstin,selected.address,selected.state].filter(Boolean).join(" · ")}:null,cards:[["Opening Balance","Not configured"],[isC?"Sales":"Purchases",money(isC?debit:credit)],[isC?"Credit Notes":"Payments",money(isC?credit:payments)],[isC?"Closing Receivable":"Closing Payable",money(Math.abs(balance))+(balance<0?" Cr":" Dr")]].map(([label,value])=>({label,value})),tableTitle:"Ledger Statement",columns:cols([["date","Date"],["particulars","Particulars"],["type","Voucher Type"],["number","Voucher No."],["debit","Debit (₹)",true],["credit","Credit (₹)",true],["balance","Balance (₹)",true]]),rows,note:"Opening balances and customer receipts are not stored in the current records. This ledger reflects available transactions in the selected period."};
 }
 if(kind==="item"){
  const selected=(d.items||[]).find(r=>r.id===f.party),parents=new Map([...(d.sales||[]),...(d.purchases||[])].map(r=>[r.id,r]));
  const moves=[...(d.purchaseLines||[]).filter(l=>selected&&l.item_id===selected.id).map(l=>({l,p:parents.get(l.invoice_id),incoming:true})),...(d.saleLines||[]).filter(l=>selected&&l.item_id===selected.id).map(l=>({l,p:parents.get(l.invoice_id),incoming:false}))].filter(x=>x.p&&inRange(x.p.invoice_date,range.from,range.to)).sort((a,b)=>a.p.invoice_date.localeCompare(b.p.invoice_date));
  let balance=0;const unit=selected?.uom||selected?.unit||"";const rows=moves.map(({l,p,incoming})=>{const qty=n(l.qty);balance+=incoming?qty:-qty;return{id:l.id,date:dateLabel(p.invoice_date),type:incoming?"Purchase Invoice":"Sales Invoice",number:p.invoice_no,party:incoming?p.vendor_name||"Supplier":p.customer_name||"Customer",inward:incoming?qty+" "+unit:"—",outward:incoming?"—":qty+" "+unit,rate:money(l.rate),balance:balance+" "+unit}});
  return{identity:selected?{name:selected.item_name,meta:[selected.item_code&&"Item Code: "+selected.item_code,selected.hsn_sac&&"HSN: "+selected.hsn_sac,"Unit: "+unit].filter(Boolean).join(" · ")}:null,cards:[["Opening Stock","Not tracked"],["Stock In",sum(moves.filter(x=>x.incoming),x=>x.l.qty)+" "+unit],["Stock Out",sum(moves.filter(x=>!x.incoming),x=>x.l.qty)+" "+unit],["Net Movement",balance+" "+unit]].map(([label,value])=>({label,value})),tableTitle:"Stock Movement",columns:cols([["date","Date"],["type","Voucher Type"],["number","Reference No."],["party","Party"],["inward","Inward Qty",true],["outward","Outward Qty",true],["rate","Rate (₹)",true],["balance","Balance Qty",true]]),rows,note:"Movement is derived from purchase and sales invoice lines. Opening stock and valued stock balances are not stored in the current records."};
 }
 const sales=rowsFor(d.sales,"invoice_date"),purchases=rowsFor(d.purchases,"invoice_date"),expenses=rowsFor(d.expenses,"expense_date");
 const taxable=sum(sales,r=>r.taxable_value),output=sum(sales,gst),input=sum(purchases,gst)+sum(expenses,gst);
 const tab=f.tab||"GSTR-3B";
 const parentMap=new Map([...(d.sales||[]),...(d.purchases||[])].map(r=>[r.id,r]));
 const lineRows=[
  ...(tab==="Input Tax Credit"?[]:(d.saleLines||[]).map(l=>({line:l,parent:parentMap.get(l.invoice_id),source:"sales"}))),
  ...(tab==="GSTR-1"||tab==="Output GST"?[]:(d.purchaseLines||[]).map(l=>({line:l,parent:parentMap.get(l.invoice_id),source:"purchase"})))
 ].filter(x=>x.parent&&inRange(x.parent.invoice_date,range.from,range.to));
 const groups=new Map();
 lineRows.forEach(({line,parent,source})=>{
  const rate=n(line.gst_rate),base=n(source==="sales"?line.amount:line.taxable_value);
  const tax=source==="sales"?base*rate/100:n(line.cgst_amount)+n(line.sgst_amount)+n(line.igst_amount);
  const g=groups.get(rate)||{rate,taxable:0,cgst:0,sgst:0,igst:0,cess:0,tax:0};
  g.taxable+=base;
  if(source==="purchase"){g.cgst+=n(line.cgst_amount);g.sgst+=n(line.sgst_amount);g.igst+=n(line.igst_amount);}
  else if(n(parent.igst)>0)g.igst+=tax;else{g.cgst+=tax/2;g.sgst+=tax/2;}
  g.cess+=n(line.cess_amount);g.tax+=tax;groups.set(rate,g);
 });
 const taxRows=Array.from(groups.values()).sort((a,b)=>a.rate-b.rate),taxTotals=[sum(taxRows,r=>r.taxable),sum(taxRows,r=>r.cgst),sum(taxRows,r=>r.sgst),sum(taxRows,r=>r.igst),sum(taxRows,r=>r.cess),sum(taxRows,r=>r.tax)];
 return{tabs:["GSTR-1","GSTR-3B","Input Tax Credit","Output GST"],cards:[["Taxable Turnover",money(taxable)],["Output Tax",money(output)],["Input Tax Credit",money(input)],["Net GST Payable",money(output-input)]].map(([label,value])=>({label,value})),tableTitle:tab==="Input Tax Credit"?"Input Tax Credit Summary":tab==="Output GST"||tab==="GSTR-1"?"Output GST Summary":"GST Summary by Tax Rate",columns:cols([["rate","Rate"],["taxable","Taxable Value (₹)",true],["cgst","CGST (₹)",true],["sgst","SGST (₹)",true],["igst","IGST (₹)",true],["cess","Cess (₹)",true],["tax","Total Tax (₹)",true]]),rows:[],taxRows,taxTotals,note:"Saved invoice and expense tax totals drive the headline figures. Rate-wise rows use invoice item tax fields; expense item details are not currently stored in the reporting source. Review figures against source vouchers before filing."};
}
