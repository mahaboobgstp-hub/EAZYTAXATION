import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCompany } from "../../context/CompanyContext";
import { supabase } from "../../supabase/supabaseClient";
import { getVendorsForDropdown, getItemsForDropdown, generatePurchaseInvoiceNumber, savePurchaseInvoice, updatePurchaseInvoice, getPurchaseInvoiceById, getPurchaseInvoiceItems } from "../../services/purchaseInvoiceService";
import PurchaseDocumentPreview from "../purchases/PurchaseDocumentPreview";
import "./PurchaseInvoice.css";
import "../purchases/PurchaseWorkspace.css";

const n = v => Number(v) || 0;
const money = v => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n(v));
const today = () => new Date().toISOString().slice(0,10);
const emptyLine = () => ({ item_id:"", item_name:"", hsn_sac:"", uom:"", qty:"1", rate:"0", discount_percent:"0", gst_rate:"18" });

export default function PurchaseInvoice() {
  const { currentCompany, currentCompanyId } = useCompany();
  const location = useLocation();
  const navigate = useNavigate();
  const [vendors,setVendors] = useState([]);
  const [itemsMaster,setItemsMaster] = useState([]);
  const [editingInvoiceId,setEditingInvoiceId] = useState(null);
  const [preview,setPreview] = useState(null);
  const [message,setMessage] = useState("");
  const [saving,setSaving] = useState(false);
  const [formData,setFormData] = useState({
    invoice_no:"", invoice_date:today(), supplier_invoice_no:"", supplier_invoice_date:today(),
    vendor_id:"", vendor_name:"", vendor_state:"", billing_address:"", shipping_address:"",
    gstin:"", place_of_supply:"", vehicle_no:"", eway_bill_no:"", remarks:"",
    gst_treatment:"Regular Supplier (Registered)"
  });
  const [lines,setLines] = useState([emptyLine()]);

  useEffect(()=>{
    if(!currentCompanyId)return;
    getVendorsForDropdown(currentCompanyId).then(data=>setVendors(data||[])).catch(e=>setMessage(e.message));
    getItemsForDropdown(currentCompanyId).then(data=>setItemsMaster(data||[])).catch(e=>setMessage(e.message));
  },[currentCompanyId]);

  useEffect(()=>{
    if(!currentCompanyId || editingInvoiceId || formData.invoice_no)return;
    generatePurchaseInvoiceNumber(currentCompanyId).then(no=>setFormData(f=>({...f,invoice_no:no}))).catch(async()=>{
      const {data:client}=await import("../../supabase/supabaseClient");
      const {count}=await client.supabase.from("purchase_invoices").select("id",{count:"exact",head:true}).eq("company_id",currentCompanyId);
      setFormData(f=>({...f,invoice_no:"PI-"+new Date().getFullYear()+"-"+String((count||0)+1).padStart(5,"0")}));
    });
  },[currentCompanyId,formData.invoice_no,editingInvoiceId]);

  useEffect(()=>{
    const id=location.state?.editPurchaseInvoiceId;
    if(!id||!currentCompanyId)return;
    (async()=>{
      try{
        const [header,items]=await Promise.all([getPurchaseInvoiceById(id,currentCompanyId),getPurchaseInvoiceItems(id,currentCompanyId)]);
        setEditingInvoiceId(id);
        setFormData({
          invoice_no:header.invoice_no||"",invoice_date:header.invoice_date||today(),
          supplier_invoice_no:header.supplier_invoice_no||"",supplier_invoice_date:header.supplier_invoice_date||"",
          vendor_id:header.vendor_id||"",vendor_name:header.vendor_name||"",vendor_state:header.vendor_state||"",
          billing_address:header.billing_address||"",shipping_address:header.shipping_address||"",
          gstin:header.gstin||"",place_of_supply:header.place_of_supply||"",vehicle_no:header.vehicle_no||"",
          eway_bill_no:header.eway_bill_no||"",remarks:header.remarks||"",
          gst_treatment:header.gst_treatment||"Regular Supplier (Registered)"
        });
        setLines(items.map(i=>({item_id:i.item_id||"",item_name:i.item_name||"",hsn_sac:i.hsn_sac||"",uom:i.uom||"",qty:String(i.qty??1),rate:String(i.rate??0),discount_percent:String(i.discount_percent??0),gst_rate:String(i.gst_rate??0)})));
        navigate("/app/purchases",{replace:true,state:null});
      }catch(e){setMessage(e.message||"Unable to load this purchase invoice.");}
    })();
  },[currentCompanyId,location.state]);

  const selectedVendor=vendors.find(v=>v.id===formData.vendor_id);
  const sameState=Boolean(currentCompany?.state&&formData.place_of_supply&&currentCompany.state.toLowerCase()===formData.place_of_supply.toLowerCase());
  const normalized=useMemo(()=>lines.filter(l=>l.item_name.trim()).map(line=>{
    const qty=Math.max(0,n(line.qty)),rate=Math.max(0,n(line.rate)),disc=Math.max(0,n(line.discount_percent)),gst=Math.max(0,n(line.gst_rate));
    const gross=qty*rate,discount=gross*disc/100,taxable=gross-discount,tax=taxable*gst/100;
    const cgst=sameState?tax/2:0,sgst=sameState?tax/2:0,igst=sameState?0:tax;
    return {...line,qty,rate,discount_percent:disc,discount_amount:discount,gross_amount:gross,taxable_value:taxable,gst_rate:gst,cgst_amount:cgst,sgst_amount:sgst,igst_amount:igst,line_total:taxable+cgst+sgst+igst};
  }),[lines,sameState]);
  const summary=useMemo(()=>{
    const taxable=normalized.reduce((s,l)=>s+l.taxable_value,0),cgst=normalized.reduce((s,l)=>s+l.cgst_amount,0),sgst=normalized.reduce((s,l)=>s+l.sgst_amount,0),igst=normalized.reduce((s,l)=>s+l.igst_amount,0);
    const raw=taxable+cgst+sgst+igst,grandTotal=Math.round(raw);
    return {taxable,cgst,sgst,igst,roundOff:grandTotal-raw,grandTotal};
  },[normalized]);

  const updateLine=(index,key,value)=>setLines(prev=>prev.map((line,i)=>i===index?{...line,[key]:value}:line));
  const chooseItem=(index,itemId)=>{
    const item=itemsMaster.find(i=>i.id===itemId);
    setLines(prev=>prev.map((line,i)=>i===index?item?{...line,item_id:item.id,item_name:item.item_name,hsn_sac:item.hsn_sac||"",uom:item.uom||item.unit||"",rate:String(item.purchase_rate||0),gst_rate:String(item.gst_rate??18)}:{...line,item_id:""}:line));
  };
  const chooseVendor=id=>{
    const vendor=vendors.find(v=>v.id===id);
    setFormData(f=>({...f,vendor_id:id,vendor_name:vendor?.vendor_name||"",vendor_state:vendor?.state||"",billing_address:vendor?.address||"",shipping_address:vendor?.address||"",gstin:vendor?.gstin||"",place_of_supply:vendor?.state||""}));
  };
  const reset=async()=>{
    setEditingInvoiceId(null);setLines([emptyLine()]);setMessage("");
    setFormData({invoice_no:"",invoice_date:today(),supplier_invoice_no:"",supplier_invoice_date:today(),vendor_id:"",vendor_name:"",vendor_state:"",billing_address:"",shipping_address:"",gstin:"",place_of_supply:"",vehicle_no:"",eway_bill_no:"",remarks:"",gst_treatment:"Regular Supplier (Registered)"});
  };
  const save=async(printAfterSave=false)=>{
    if(!currentCompanyId){setMessage("Select a current company before creating a purchase invoice.");return;}
    if(!formData.vendor_id){setMessage("Select a supplier.");return;}
    if(!formData.supplier_invoice_no.trim()){setMessage("Enter the supplier invoice number.");return;}
    if(!normalized.length){setMessage("Add at least one invoice item.");return;}
    setSaving(true);setMessage("");
    const header={
      company_id:currentCompanyId,vendor_id:formData.vendor_id,invoice_no:formData.invoice_no,invoice_date:formData.invoice_date,
      supplier_invoice_no:formData.supplier_invoice_no.trim(),supplier_invoice_date:formData.supplier_invoice_date||null,
      vehicle_no:formData.vehicle_no,eway_bill_no:formData.eway_bill_no,billing_address:formData.billing_address,
      shipping_address:formData.shipping_address,gstin:formData.gstin,vendor_state:formData.vendor_state,
      place_of_supply:formData.place_of_supply,remarks:formData.remarks,gst_treatment:formData.gst_treatment,
      taxable:summary.taxable,cgst:summary.cgst,sgst:summary.sgst,igst:summary.igst,
      round_off:summary.roundOff,grand_total:summary.grandTotal,payment_status:"Unpaid",paid_amount:0
    };
    try{
      const id=editingInvoiceId?editingInvoiceId:await savePurchaseInvoice(header,normalized);
      if(editingInvoiceId)await updatePurchaseInvoice(editingInvoiceId,header,normalized,currentCompanyId);
      const vendor=vendors.find(v=>v.id===formData.vendor_id)||{};
      if(printAfterSave)setPreview({kind:"register",document:{...header,id,vendor_name:vendor.vendor_name,gstin:formData.gstin,vendor_state:formData.vendor_state},items:normalized,company:currentCompany});
      else{await reset();navigate("/app/purchase-register");}
    }catch(e){setMessage(e.message||"Unable to save purchase invoice.");}
    finally{setSaving(false);}
  };
  const setField=(key,value)=>setFormData(f=>({...f,[key]:value}));
  const companyName=currentCompany?.company_name||"";

  return <main className="purchase-page">
    <header className="pw-heading"><div><p className="pw-breadcrumb">Billing &amp; Accounting / Purchases / Add Purchase Invoice</p><h1>{editingInvoiceId?"Edit Purchase Invoice":"Add Purchase Invoice"}</h1></div><button className="pw-secondary" onClick={()=>navigate("/app/purchase-register")}>Purchase Register</button></header>
    {message&&<div className="pi-error">{message}</div>}
    {!currentCompanyId?<div className="pi-card">Choose a current company from the sidebar to create a purchase invoice.</div>:<>
      <section className="pi-card"><h2>Purchase Invoice Details</h2><div className="pi-grid">
        <Field label="Company" value={companyName} readOnly/>
        <Field label="Purchase Invoice No." value={formData.invoice_no} readOnly/>
        <Field label="Purchase Date" type="date" value={formData.invoice_date} onChange={v=>setField("invoice_date",v)}/>
        <Field label="Supplier Invoice No." required value={formData.supplier_invoice_no} onChange={v=>setField("supplier_invoice_no",v)} placeholder="Enter supplier invoice number"/>
        <Field label="Supplier Invoice Date" type="date" value={formData.supplier_invoice_date} onChange={v=>setField("supplier_invoice_date",v)}/>
        <label className="pi-field">GST Treatment<select value={formData.gst_treatment} onChange={e=>setField("gst_treatment",e.target.value)}>{["Regular Supplier (Registered)","Composition Supplier","Unregistered Supplier","SEZ / Import"].map(x=><option key={x}>{x}</option>)}</select></label>
      </div></section>
      <section className="pi-card"><h2>Supplier Details</h2><div className="pi-grid">
        <label className="pi-field">Vendor (Supplier) *<select required value={formData.vendor_id} onChange={e=>chooseVendor(e.target.value)}><option value="">Select supplier from Vendor Master</option>{vendors.map(v=><option key={v.id} value={v.id}>{v.vendor_name}{v.gstin?" · "+v.gstin:""}</option>)}</select></label>
        <Field label="GSTIN" value={formData.gstin} onChange={v=>setField("gstin",v)}/>
        <Field label="Supplier State" value={formData.vendor_state} onChange={v=>setField("vendor_state",v)}/>
        <Field label="Place of Supply" value={formData.place_of_supply} onChange={v=>setField("place_of_supply",v)}/>
        <label className="pi-field pi-wide">Billing Address<textarea rows="2" value={formData.billing_address} onChange={e=>setField("billing_address",e.target.value)}/></label>
        <label className="pi-field pi-wide">Shipping Address<textarea rows="2" value={formData.shipping_address} onChange={e=>setField("shipping_address",e.target.value)}/></label>
      </div><p className="pi-tax-note">{selectedVendor?.state||formData.place_of_supply||"Supplier state"} · {sameState?"Intra-State (CGST + SGST)":"Inter-State (IGST)"}</p></section>
      <section className="pi-items-summary"><div className="pi-card"><h2>Invoice Items</h2><div className="pi-items-scroll"><table className="pi-items-table"><thead><tr><th>#</th><th>Item / Product</th><th>HSN/SAC</th><th>Qty</th><th>Unit</th><th>Rate (₹)</th><th>Disc %</th><th>GST %</th><th>Taxable</th><th>Total</th><th></th></tr></thead><tbody>{lines.map((line,index)=>{
        const c=normalized[index]||{taxable_value:0,line_total:0};
        return <tr key={index}><td>{index+1}</td><td><select value={line.item_id} onChange={e=>chooseItem(index,e.target.value)}><option value="">Select item</option>{itemsMaster.map(item=><option key={item.id} value={item.id}>{item.item_name}</option>)}</select>{!line.item_id&&<input className="pi-custom-item" value={line.item_name} placeholder="Or type a custom item" onChange={e=>updateLine(index,"item_name",e.target.value)}/>}</td><td><input value={line.hsn_sac} onChange={e=>updateLine(index,"hsn_sac",e.target.value)} placeholder="HSN"/></td><td><input type="number" min="0" step="0.001" value={line.qty} onChange={e=>updateLine(index,"qty",e.target.value)}/></td><td><input value={line.uom} onChange={e=>updateLine(index,"uom",e.target.value)} placeholder="Unit"/></td><td><input type="number" min="0" step="0.01" value={line.rate} onChange={e=>updateLine(index,"rate",e.target.value)}/></td><td><input type="number" min="0" max="100" step="0.01" value={line.discount_percent} onChange={e=>updateLine(index,"discount_percent",e.target.value)}/></td><td><select value={line.gst_rate} onChange={e=>updateLine(index,"gst_rate",e.target.value)}>{["0","5","12","18","28"].map(x=><option key={x} value={x}>{x}%</option>)}</select></td><td>{money(c.taxable_value)}</td><td><strong>{money(c.line_total)}</strong></td><td><button className="pi-delete" type="button" onClick={()=>setLines(p=>p.length>1?p.filter((_,i)=>i!==index):p)} aria-label="Remove item">×</button></td></tr>;
      })}</tbody></table></div><button className="pi-add" type="button" onClick={()=>setLines(p=>[...p,emptyLine()])}>＋ Add Another Item</button></div>
        <aside className="pi-summary"><h2>GST &amp; Amount Summary</h2><SummaryRow label="Subtotal (Taxable Amount)" value={money(summary.taxable)}/><SummaryRow label="CGST" value={money(summary.cgst)}/><SummaryRow label="SGST" value={money(summary.sgst)}/><SummaryRow label="IGST" value={money(summary.igst)}/><SummaryRow label="Round-off" value={money(summary.roundOff)}/><div className="pi-summary-grand"><span>Grand Total</span><strong>{money(summary.grandTotal)}</strong></div></aside></section>
      <section className="pi-card"><h2>Transport &amp; Remarks</h2><div className="pi-grid two"><Field label="Vehicle Number" value={formData.vehicle_no} onChange={v=>setField("vehicle_no",v)}/><Field label="E-Way Bill Number" value={formData.eway_bill_no} onChange={v=>setField("eway_bill_no",v)}/><label className="pi-field pi-wide">Remarks / Narration<textarea rows="2" value={formData.remarks} onChange={e=>setField("remarks",e.target.value)}/></label></div></section>
      <section className="pi-actions"><button className="pi-btn secondary" type="button" onClick={reset}>Clear Form</button><button className="pi-btn outline" type="button" onClick={()=>save(true)} disabled={saving}>{saving?"Saving…":"Save & Print"}</button><button className="pi-btn primary" type="button" onClick={()=>save(false)} disabled={saving}>{saving?"Saving…":editingInvoiceId?"Update Purchase Invoice":"Save Purchase Invoice"}</button></section>
    </>}
    {preview&&<PurchaseDocumentPreview {...preview} onClose={()=>setPreview(null)}/>}
  </main>;
}

function Field({label,value,onChange,type="text",readOnly=false,placeholder="",required=false}) {
  return <label className="pi-field">{label}{type==="textarea"?<textarea/>:<input type={type} value={value||""} onChange={e=>onChange?.(e.target.value)} readOnly={readOnly} placeholder={placeholder} required={required}/>}</label>;
}
function SummaryRow({label,value}){return <div className="pi-summary-row"><span>{label}</span><strong>{value}</strong></div>}
