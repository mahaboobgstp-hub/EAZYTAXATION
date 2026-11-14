import React,{useCallback,useEffect,useState} from "react";
import {FiDownload,FiRefreshCw,FiAlertCircle,FiFileText} from "react-icons/fi";
import {useCompany} from "../../context/CompanyContext";
import {supabase} from "../../supabase/supabaseClient";

const money=n=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR"}).format(Number(n||0));
export default function EInvoiceWorkspace(){
 const {currentCompanyId,currentCompany}=useCompany();
 const [rows,setRows]=useState([]),[items,setItems]=useState({}),[loading,setLoading]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState(""),[preview,setPreview]=useState(null);
 const load=useCallback(async()=>{
  if(!currentCompanyId){setRows([]);return;}
  setLoading(true);setError("");
  try{
   const {data,error:e}=await supabase.from("sales_invoices").select("*").eq("company_id",currentCompanyId).eq("is_deleted",false).order("invoice_date",{ascending:false}).limit(200);
   if(e)throw e;
   setRows(data||[]);
  }catch(e){setError(e.message||"Unable to load sales invoices.");}
  finally{setLoading(false);}
 },[currentCompanyId]);
 useEffect(()=>{load();},[load]);
 const openPreview=async invoice=>{
  setError("");setNotice("");
  try{
   const {data,error:e}=await supabase.from("sales_invoice_items").select("*").eq("invoice_id",invoice.id).order("line_no");
   if(e)throw e;
   const payload={
    documentType:"INV",documentNumber:invoice.invoice_no,documentDate:invoice.invoice_date,
    seller:{gstin:currentCompany?.gstin||"",legalName:currentCompany?.company_name||"",address:currentCompany?.address||"",state:currentCompany?.state||""},
    buyer:{name:invoice.customer_name||"",gstin:invoice.shipping_gstin||"",address:invoice.billing_address||"",state:invoice.customer_state||""},
    placeOfSupply:invoice.place_of_supply||"",taxType:invoice.gst_type||"",
    items:(data||[]).map((item,index)=>({serialNumber:index+1,description:item.item_name||item.particulars,hsnCode:item.hsn_sac,quantity:Number(item.qty||0),unit:item.unit||"NOS",unitPrice:Number(item.rate||0),taxableValue:Number(item.amount||0),gstRate:Number(item.gst_rate||0),cessRate:Number(item.cess_rate||0)})),
    totals:{taxableValue:Number(invoice.taxable_value||0),cgst:Number(invoice.cgst||0),sgst:Number(invoice.sgst||0),igst:Number(invoice.igst||0),total:Number(invoice.total_amount||0)}
   };
   setPreview({invoice,payload});
  }catch(e){setError(e.message||"Unable to prepare invoice data.");}
 };
 const download=()=>{
  if(!preview)return;
  const blob=new Blob([JSON.stringify(preview.payload,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=(preview.invoice.invoice_no||"invoice")+"-einvoice-payload.json";a.click();URL.revokeObjectURL(url);
  setNotice("Invoice payload downloaded. It has not been submitted to the Invoice Registration Portal.");
 };
 return <main className="banking-page">
  <div className="banking-breadcrumb">GST & Tax <span>/</span> E-Invoice</div>
  <header className="banking-heading"><div><div className="banking-eyebrow">GST COMPLIANCE</div><h1>E-Invoice</h1><p>Review eligible sales invoices and prepare structured IRP payloads.</p></div><button className="bank-btn bank-btn-light" onClick={load} disabled={loading}><FiRefreshCw/> Refresh</button></header>
  {error&&<div className="banking-notice" role="alert"><FiAlertCircle/>{error}</div>}
  {notice&&<div className="banking-notice">{notice}</div>}
  <div className="banking-footnote"><FiAlertCircle/> Live IRN generation, cancellation and QR-code retrieval require an authorized GST Suvidha Provider / IRP API connection and credentials. This screen prepares and exports invoice data only; it does not claim to generate an IRN.</div>
  <section className="bank-card"><div className="bank-card-heading"><div><h2>Sales Invoices</h2><p>{rows.length} recent records for {currentCompany?.company_name||"selected company"}</p></div></div><div className="bank-table-wrap"><table className="bank-table"><thead><tr><th>Invoice No.</th><th>Date</th><th>Customer</th><th>GST Type</th><th>Taxable Value</th><th>Total</th><th>Action</th></tr></thead><tbody>{rows.map(row=><tr key={row.id}><td><strong>{row.invoice_no}</strong></td><td>{row.invoice_date}</td><td>{row.customer_name||"—"}</td><td>{row.gst_type||"—"}</td><td>{money(row.taxable_value)}</td><td>{money(row.total_amount)}</td><td><button className="bank-btn bank-btn-light bank-btn-small" onClick={()=>openPreview(row)}><FiFileText/> Prepare Payload</button></td></tr>)}</tbody></table>{!loading&&!rows.length&&<div className="bank-empty">No sales invoices found for this company.</div>}</div></section>
  {preview&&<section className="bank-card" style={{padding:16,marginTop:16}}><div className="bank-card-heading"><div><h2>Invoice Payload Preview · {preview.invoice.invoice_no}</h2><p>Review the source data before exporting.</p></div><button className="bank-btn bank-btn-primary" onClick={download}><FiDownload/> Download JSON</button></div><pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere",maxHeight:420,overflow:"auto",padding:14,background:"#f7f8fc",borderRadius:8,fontSize:11}}>{JSON.stringify(preview.payload,null,2)}</pre></section>}
 </main>;
}
