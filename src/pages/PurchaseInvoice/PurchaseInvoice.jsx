import React, { useEffect, useMemo, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { useLocation, useNavigate } from "react-router-dom";
import { useCompany } from "../../context/CompanyContext";
import { getStates } from "../../services/stateService";
import { supabase } from "../../supabase/supabaseClient";
import { getVendorsForDropdown, getItemsForDropdown, generatePurchaseInvoiceNumber, savePurchaseInvoice, updatePurchaseInvoice, getPurchaseInvoiceById, getPurchaseInvoiceItems } from "../../services/purchaseInvoiceService";
import PurchaseDocumentPreview from "../purchases/PurchaseDocumentPreview";
import AiDocumentCapture from "../../components/AiDocumentCapture";
import { uploadAndProcessAiInvoice } from "../../services/aiInvoiceRecognitionService";
import "./PurchaseInvoice.css";
import "../purchases/PurchaseWorkspace.css";
import "../../css/AndroidWorkflow.css";

const n = v => Number(v) || 0;
const money = v => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n(v));
const today = () => new Date().toISOString().slice(0,10);
const emptyLine = () => ({ item_id:"", item_name:"", hsn_sac:"", uom:"", qty:"1", rate:"0", discount_percent:"0", gst_rate:"18" });

export default function PurchaseInvoice() {
  const { currentCompany, currentCompanyId } = useCompany();
  const location = useLocation();
  const navigate = useNavigate();
  const isAndroid = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  const [step,setStep] = useState(1);
  const [applyRoundOff,setApplyRoundOff] = useState(true);
  const [transportDetailsOpen,setTransportDetailsOpen] = useState(false);
  const [vendors,setVendors] = useState([]);
  const [states,setStates] = useState([]);
  const [itemsMaster,setItemsMaster] = useState([]);
  const [editingInvoiceId,setEditingInvoiceId] = useState(null);
  const [preview,setPreview] = useState(null);
  const [message,setMessage] = useState("");
  const [saving,setSaving] = useState(false);
  const [aiDocument,setAiDocument] = useState(null);
  const [aiProcessing,setAiProcessing] = useState(false);
  const [aiValidation,setAiValidation] = useState(null);
  const [openAiPicker,setOpenAiPicker] = useState(Boolean(location.state?.openAiDocumentPicker));
  const [formData,setFormData] = useState({
    invoice_no:"", invoice_date:today(), supplier_invoice_no:"", supplier_invoice_date:today(),
    vendor_id:"", vendor_name:"", vendor_state:"", billing_address:"", shipping_address:"",
    gstin:"", place_of_supply:"", vehicle_no:"", eway_bill_no:"", transporter_name:"", transporter_id:"", transport_doc_no:"", transport_doc_date:"", remarks:"",
    gst_treatment:"Regular Supplier (Registered)", purchase_type:"Goods"
  });
  const [lines,setLines] = useState([emptyLine()]);

  useEffect(()=>{
    if(!currentCompanyId)return;
    getVendorsForDropdown(currentCompanyId).then(data=>setVendors(data||[])).catch(e=>setMessage(e.message));
    getStates().then(data=>setStates(data||[])).catch(e=>setMessage(e.message));
    getItemsForDropdown(currentCompanyId).then(data=>setItemsMaster(data||[])).catch(e=>setMessage(e.message));
  },[currentCompanyId]);

  useEffect(()=>{
    if(!currentCompanyId || editingInvoiceId || formData.invoice_no)return;
    let active=true;
    generatePurchaseInvoiceNumber(currentCompanyId)
      .then(no=>{if(active)setFormData(f=>({...f,invoice_no:no}));})
      .catch(async()=>{
        // Fallback uses the already imported Supabase client. The old dynamic
        // import incorrectly destructured a non-existent "data" export and
        // then attempted client.supabase, crashing the purchase entry screen.
        const {count,error}=await supabase.from("purchase_invoices")
          .select("id",{count:"exact",head:true})
          .eq("company_id",currentCompanyId)
          .eq("is_deleted",false);
        if(error)throw error;
        if(active)setFormData(f=>({...f,invoice_no:"PI-"+new Date().getFullYear()+"-"+String((count||0)+1).padStart(5,"0")}));
      })
      .catch(error=>{if(active)setMessage(error?.message||"Unable to generate purchase invoice number.");});
    return()=>{active=false;};
  },[currentCompanyId,formData.invoice_no,editingInvoiceId]);

  useEffect(()=>{
    const id=location.state?.editPurchaseInvoiceId;
    if(!id||!currentCompanyId)return;
    (async()=>{
      try{
        const [header,items]=await Promise.all([getPurchaseInvoiceById(id,currentCompanyId),getPurchaseInvoiceItems(id,currentCompanyId)]);
        setEditingInvoiceId(id);
        setApplyRoundOff(Math.abs(Number(header.round_off)||0)>0);
        setFormData({
          invoice_no:header.invoice_no||"",invoice_date:header.invoice_date||today(),
          supplier_invoice_no:header.supplier_invoice_no||"",supplier_invoice_date:header.supplier_invoice_date||"",
          vendor_id:header.vendor_id||"",vendor_name:header.vendor_name||"",vendor_state:header.vendor_state||"",
          billing_address:header.billing_address||"",shipping_address:header.shipping_address||"",
          gstin:header.gstin||"",place_of_supply:header.place_of_supply||"",vehicle_no:header.vehicle_no||"",
          eway_bill_no:header.eway_bill_no||"",transporter_name:header.transporter_name||"",transporter_id:header.transporter_id||"",transport_doc_no:header.transport_doc_no||"",transport_doc_date:header.transport_doc_date||"",remarks:header.remarks||"",
          gst_treatment:header.gst_treatment||"Regular Supplier (Registered)", purchase_type:header.purchase_type||"Goods"
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
    const raw=taxable+cgst+sgst+igst,roundOff=applyRoundOff?Math.round(raw)-raw:0,grandTotal=raw+roundOff;
    return {taxable,cgst,sgst,igst,gstTotal:cgst+sgst+igst,raw,roundOff,grandTotal};
  },[normalized,applyRoundOff]);

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
    setEditingInvoiceId(null);setLines([emptyLine()]);setMessage("");setApplyRoundOff(true);setTransportDetailsOpen(false);
    setFormData({invoice_no:"",invoice_date:today(),supplier_invoice_no:"",supplier_invoice_date:today(),vendor_id:"",vendor_name:"",vendor_state:"",billing_address:"",shipping_address:"",gstin:"",place_of_supply:"",vehicle_no:"",eway_bill_no:"",transporter_name:"",transporter_id:"",transport_doc_no:"",transport_doc_date:"",remarks:"",gst_treatment:"Regular Supplier (Registered)",purchase_type:"Goods"});
  };
  const save=async()=>{
    if(!currentCompanyId){setMessage("Select a current company before creating a purchase invoice.");return;}
    if(!formData.vendor_id){setMessage("Select a supplier.");return;}
    if(!formData.supplier_invoice_no.trim()){setMessage("Enter the supplier invoice number.");return;}
    if(!normalized.length){setMessage("Add at least one invoice item.");return;}
    setSaving(true);setMessage("");
    const header={
      company_id:currentCompanyId,vendor_id:formData.vendor_id,invoice_no:formData.invoice_no,invoice_date:formData.invoice_date,
      supplier_invoice_no:formData.supplier_invoice_no.trim(),supplier_invoice_date:formData.supplier_invoice_date||null,
      vehicle_no:formData.vehicle_no,eway_bill_no:formData.eway_bill_no,transporter_name:formData.transporter_name,transporter_id:formData.transporter_id,transport_doc_no:formData.transport_doc_no,transport_doc_date:formData.transport_doc_date||null,purchase_type:formData.purchase_type,billing_address:formData.billing_address,
      shipping_address:formData.shipping_address,gstin:formData.gstin,vendor_state:formData.vendor_state,
      place_of_supply:formData.place_of_supply,remarks:formData.remarks,gst_treatment:formData.gst_treatment,
      taxable:summary.taxable,cgst:summary.cgst,sgst:summary.sgst,igst:summary.igst,
      round_off:summary.roundOff,grand_total:summary.grandTotal,payment_status:"Unpaid",paid_amount:0
    };
    try{
      const id=editingInvoiceId?editingInvoiceId:await savePurchaseInvoice(header,normalized);
      if(editingInvoiceId)await updatePurchaseInvoice(editingInvoiceId,header,normalized,currentCompanyId);
      await reset();
      setApplyRoundOff(true);
      setTransportDetailsOpen(false);
      navigate("/app/purchase-register");
    }catch(e){setMessage(e.message||"Unable to save purchase invoice.");}
    finally{setSaving(false);}
  };
  const setField=(key,value)=>setFormData(f=>({...f,[key]:value}));
  const handleAiDocument = async file => {
    setAiDocument(file);
    setAiValidation(null);
    setAiProcessing(true);
    setMessage("Uploading and analysing purchase invoice…");
    try {
      const result = await uploadAndProcessAiInvoice(file,currentCompanyId,"purchase");
      const data = result.extractedData || {};
      const clean = value => String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g,"");
      const gstin = clean(data.supplier_gstin);
      const matchedVendor = vendors.find(v => gstin && clean(v.gstin) === gstin)
        || vendors.find(v => clean(v.vendor_name) && clean(v.vendor_name) === clean(data.supplier_name));
      setFormData(previous => ({
        ...previous,
        supplier_invoice_no: data.invoice_number || previous.supplier_invoice_no,
        supplier_invoice_date: data.invoice_date || previous.supplier_invoice_date,
        invoice_date: data.invoice_date || previous.invoice_date,
        vendor_id: matchedVendor?.id || previous.vendor_id,
        vendor_name: data.supplier_name || matchedVendor?.vendor_name || previous.vendor_name,
        vendor_state: data.supplier_state || matchedVendor?.state || previous.vendor_state,
        billing_address: data.supplier_address || matchedVendor?.address || previous.billing_address,
        shipping_address: data.supplier_address || matchedVendor?.address || previous.shipping_address,
        gstin: data.supplier_gstin || matchedVendor?.gstin || previous.gstin,
        place_of_supply: data.place_of_supply || data.supplier_state || matchedVendor?.state || previous.place_of_supply,
        vehicle_no: data.vehicle_number || previous.vehicle_no,
        eway_bill_no: data.eway_bill_number || previous.eway_bill_no,
        transporter_name: data.transporter_name || previous.transporter_name,
        transporter_id: data.transporter_id || previous.transporter_id,
        transport_doc_no: data.transport_doc_no || previous.transport_doc_no,
        transport_doc_date: data.transport_doc_date || previous.transport_doc_date,
      }));
      const extractedLines = (data.items || []).map(item => {
        const itemName = item.description || "";
        const itemHsn = clean(item.hsn_sac);
        const matchedItem = itemsMaster.find(master => itemHsn && clean(master.hsn_sac) === itemHsn)
          || itemsMaster.find(master => clean(master.item_name) === clean(itemName));
        const quantity = Number(item.quantity ?? 1) || 1;
        const rate = Number(item.rate ?? (item.gross_amount != null ? Number(item.gross_amount) / quantity : 0)) || 0;
        const gross = Number(item.gross_amount ?? quantity * rate) || 0;
        const discount = Number(item.discount_amount || 0);
        const gstRate = Number(item.gst_rate ?? ((Number(item.cgst_rate)||0)+(Number(item.sgst_rate)||0)+(Number(item.igst_rate)||0))) || 0;
        return {
          item_id: matchedItem?.id || "",
          item_name: matchedItem?.item_name || itemName,
          hsn_sac: item.hsn_sac || matchedItem?.hsn_sac || "",
          uom: item.unit || matchedItem?.uom || matchedItem?.unit || "",
          qty: String(quantity),
          rate: String(rate),
          discount_percent: String(gross > 0 ? discount / gross * 100 : 0),
          gst_rate: String(gstRate),
        };
      });
      if (extractedLines.length) setLines(extractedLines);
      setAiValidation(result.validationResults);
      setMessage("Invoice analysed. Review the extracted fields and correct any warnings before saving.");
      setStep(1);
    } catch (error) {
      setMessage(error.message || "Unable to analyse this purchase invoice.");
    } finally {
      setAiProcessing(false);
    }
  };
  

  const goNext = () => { if (step === 1 && !formData.invoice_date) { setMessage("Select the purchase date to continue."); return; } if (step === 1 && !formData.supplier_invoice_no.trim()) { setMessage("Enter the supplier invoice number to continue."); return; } if (step === 1 && !formData.supplier_invoice_date) { setMessage("Select the supplier invoice date to continue."); return; } if (step === 1 && !formData.vendor_id) { setMessage("Select a supplier to continue."); return; } if (step === 1 && !formData.place_of_supply) { setMessage("Select the place of supply to continue."); return; } if (step === 2 && !normalized.length) { setMessage("Add at least one invoice item to continue."); return; } setMessage(""); setStep(s=>Math.min(4,s+1)); };

  return <main className={isAndroid ? "purchase-page android-workflow" : "purchase-page"}>
    <header className="pw-heading"><div><h1>{editingInvoiceId?"Edit Purchase Invoice":"Add Purchase Invoice"}</h1></div><div className="ai-entry-header-actions"><AiDocumentCapture autoOpen={openAiPicker} disabled={aiProcessing} onFileSelected={file=>{setOpenAiPicker(false);navigate(location.pathname,{replace:true,state:null});handleAiDocument(file);}}/><button className="pw-secondary" type="button" onClick={()=>navigate("/app/purchase-register")}>Purchase Register</button></div></header>
    {aiDocument&&isAndroid&&<div className="ai-selected-document"><b>{aiProcessing?"Analysing invoice…":aiValidation?"Invoice analysed:":"Document selected:"}</b> {aiDocument.name}<small>{aiProcessing?"Reading supplier, invoice, item and GST details. Please keep this screen open.":`Supplier: ${formData.vendor_name||"Not identified"} · GSTIN: ${formData.gstin||"Not identified"} · Invoice No: ${formData.supplier_invoice_no||"Not identified"}`}</small>{aiValidation?.warnings?.length>0&&<ul>{aiValidation.warnings.map((warning,index)=><li key={index}>{warning}</li>)}</ul>}</div>}
    {message&&<div className="pi-error">{message}</div>}
    {isAndroid && <nav className="android-stepper">{["Details","Items","Charges & Tax","Review"].map((label,i)=><button type="button" key={label} className={step===i+1?"active":step>i+1?"complete":""} onClick={()=>{if(i+1<step)setStep(i+1);}}><b>{i+1}</b><span>{label}</span></button>)}</nav>}
    {!currentCompanyId?<div className="pi-card">Choose a current company from the sidebar to create a purchase invoice.</div>:<>
      <section className="pi-card pi-details-card" style={isAndroid&&step!==1?{display:"none"}:{}}>
        <h2>Invoice &amp; Supplier Details</h2>
        <div className="pi-grid">
          <Field label="Purchase Invoice No." value={formData.invoice_no} readOnly/>
          <Field label="Purchase Date" type="date" required value={formData.invoice_date} onChange={v=>setField("invoice_date",v)}/>
          <Field label="Supplier Invoice No." required value={formData.supplier_invoice_no} onChange={v=>setField("supplier_invoice_no",v)} placeholder="Enter supplier invoice number"/>
          <Field label="Supplier Invoice Date" type="date" required value={formData.supplier_invoice_date} onChange={v=>setField("supplier_invoice_date",v)}/>
          <label className="pi-field pi-wide">Supplier (Vendor Master) *<select required value={formData.vendor_id} onChange={e=>chooseVendor(e.target.value)}><option value="">Select supplier</option>{vendors.map(v=><option key={v.id} value={v.id}>{v.vendor_name}</option>)}</select></label>
          <div className="pi-auto-details pi-wide">
            <div><b>GSTIN</b><span>{formData.gstin||"Auto-filled from Vendor Master"}</span></div>
            <div><b>Supplier State</b><span>{formData.vendor_state||"Auto-filled from Vendor Master"}</span></div>
          </div>
          <label className="pi-field pi-wide">Supplier Type *<select value={formData.gst_treatment} onChange={e=>setField("gst_treatment",e.target.value)}>{["Regular Supplier (Registered)","Composition Supplier","Unregistered Supplier","SEZ / Import"].map(x=><option key={x}>{x}</option>)}</select></label>
          <label className="pi-field pi-wide">Purchase Type *<select value={formData.purchase_type} onChange={e=>setField("purchase_type",e.target.value)}><option value="Goods">Goods</option><option value="Services">Services</option></select></label>
          <label className="pi-field pi-wide">Place of Supply *<select required value={formData.place_of_supply} onChange={e=>setField("place_of_supply",e.target.value)}><option value="">Select place of supply</option>{states.map(state=><option key={state.id} value={state.state_name}>{state.state_name}</option>)}</select></label>
        </div>
        <p className="pi-tax-note">{formData.place_of_supply||"Place of Supply"} · {sameState?"Intra-State (CGST + SGST)":"Inter-State (IGST)"}</p>
      </section>
      <section className="pi-items-summary" style={isAndroid&&step!==2?{display:"none"}:{}}><div className="pi-card"><h2>Invoice Items</h2><div className="pi-items-scroll"><table className="pi-items-table"><thead><tr><th>#</th><th>Item / Product</th><th>HSN/SAC</th><th>Qty</th><th>Unit</th><th>Rate (₹)</th><th>Disc %</th><th>GST %</th><th>Taxable</th><th>Total</th><th></th></tr></thead><tbody>{lines.map((line,index)=>{
        const c=normalized[index]||{taxable_value:0,line_total:0};
        return <tr key={index}><td>{index+1}</td><td><select value={line.item_id} onChange={e=>chooseItem(index,e.target.value)}><option value="">Select item</option>{itemsMaster.map(item=><option key={item.id} value={item.id}>{item.item_name}</option>)}</select>{!line.item_id&&<input className="pi-custom-item" value={line.item_name} placeholder="Or type a custom item" onChange={e=>updateLine(index,"item_name",e.target.value)}/>}</td><td><input value={line.hsn_sac} onChange={e=>updateLine(index,"hsn_sac",e.target.value)} placeholder="HSN"/></td><td><input type="number" min="0" step="0.001" value={line.qty} onChange={e=>updateLine(index,"qty",e.target.value)}/></td><td><input value={line.uom} onChange={e=>updateLine(index,"uom",e.target.value)} placeholder="Unit"/></td><td><input type="number" min="0" step="0.01" value={line.rate} onChange={e=>updateLine(index,"rate",e.target.value)}/></td><td><input type="number" min="0" max="100" step="0.01" value={line.discount_percent} onChange={e=>updateLine(index,"discount_percent",e.target.value)}/></td><td><select value={line.gst_rate} onChange={e=>updateLine(index,"gst_rate",e.target.value)}>{["0","5","12","18","28"].map(x=><option key={x} value={x}>{x}%</option>)}</select></td><td>{money(c.taxable_value)}</td><td><strong>{money(c.line_total)}</strong></td><td><button className="pi-delete" type="button" onClick={()=>setLines(p=>p.length>1?p.filter((_,i)=>i!==index):p)} aria-label="Remove item">×</button></td></tr>;
      })}</tbody></table></div><button className="pi-add" type="button" onClick={()=>setLines(p=>[...p,emptyLine()])}>＋ Add Item</button></div>
        <aside className="pi-summary"><h2>GST &amp; Amount Summary</h2><SummaryRow label="Subtotal (Taxable Amount)" value={money(summary.taxable)}/><SummaryRow label="CGST" value={money(summary.cgst)}/><SummaryRow label="SGST" value={money(summary.sgst)}/><SummaryRow label="IGST" value={money(summary.igst)}/><SummaryRow label="Round-off" value={money(summary.roundOff)}/><div className="pi-summary-grand"><span>Grand Total</span><strong>{money(summary.grandTotal)}</strong></div></aside></section>
      <section className="pi-card pi-charges-card" style={isAndroid&&step!==3?{display:"none"}:{}}><h2>Charges &amp; Tax</h2><div className="pi-tax-breakdown"><SummaryRow label="Taxable Amount" value={money(summary.taxable)}/><SummaryRow label="CGST" value={money(summary.cgst)}/><SummaryRow label="SGST" value={money(summary.sgst)}/><SummaryRow label="IGST" value={money(summary.igst)}/><div className="pi-gst-total"><span>Total GST</span><strong>{money(summary.gstTotal)}</strong></div></div><label className="pi-roundoff-toggle"><input type="checkbox" checked={applyRoundOff} onChange={e=>setApplyRoundOff(e.target.checked)}/><span>Apply Round Off</span><strong>{money(summary.roundOff)}</strong></label><div className="pi-charges-total"><span>Grand Total</span><strong>{money(summary.grandTotal)}</strong></div><details className="pi-transport-details" open={transportDetailsOpen} onToggle={e=>setTransportDetailsOpen(e.currentTarget.open)}><summary><span>Transporter Details</span><small>Vehicle, e-way bill and transporter information</small></summary><div className="pi-grid two"><Field label="Vehicle Number" value={formData.vehicle_no} onChange={v=>setField("vehicle_no",v)} placeholder="Enter vehicle number"/><Field label="E-Way Bill Number" value={formData.eway_bill_no} onChange={v=>setField("eway_bill_no",v)} placeholder="Enter e-way bill number"/><Field label="Transporter Name" value={formData.transporter_name} onChange={v=>setField("transporter_name",v)} placeholder="Enter transporter name"/><Field label="Transporter ID (GSTIN / TRANSIN)" value={formData.transporter_id} onChange={v=>setField("transporter_id",v)} placeholder="Enter transporter GSTIN / TRANSIN"/><Field label="Transport Document / LR Number" value={formData.transport_doc_no} onChange={v=>setField("transport_doc_no",v)} placeholder="Enter LR / document number"/><Field label="Transport Document Date" type="date" value={formData.transport_doc_date} onChange={v=>setField("transport_doc_date",v)}/><label className="pi-field pi-wide">Remarks / Narration<textarea rows="2" value={formData.remarks} onChange={e=>setField("remarks",e.target.value)}/></label></div></details></section>      {isAndroid && step===4 && <section className="pi-card android-review"><h2>Review Purchase Invoice</h2><p><b>Supplier:</b> {selectedVendor?.vendor_name||"—"}</p><p><b>Supplier Invoice:</b> {formData.supplier_invoice_no||"—"}</p><p><b>Items:</b> {normalized.length}</p><SummaryRow label="Taxable Amount" value={money(summary.taxable)}/><SummaryRow label="CGST" value={money(summary.cgst)}/><SummaryRow label="SGST" value={money(summary.sgst)}/><SummaryRow label="IGST" value={money(summary.igst)}/><SummaryRow label="Total GST" value={money(summary.gstTotal)}/><SummaryRow label="Round-off" value={money(summary.roundOff)}/><SummaryRow label="Vehicle Number" value={formData.vehicle_no||"—"}/><SummaryRow label="E-Way Bill Number" value={formData.eway_bill_no||"—"}/><SummaryRow label="Transporter" value={formData.transporter_name||"—"}/><SummaryRow label="Transporter ID" value={formData.transporter_id||"—"}/><SummaryRow label="Transport Document" value={formData.transport_doc_no||"—"}/><SummaryRow label="Transport Document Date" value={formData.transport_doc_date||"—"}/><div className="pi-summary-grand"><span>Grand Total</span><strong>{money(summary.grandTotal)}</strong></div></section>}
      <section className={isAndroid?"pi-actions android-workflow-actions":"pi-actions"}>{isAndroid ? <><button className="pi-btn secondary" type="button" onClick={()=>step===1?navigate("/app/purchase-register"):setStep(s=>s-1)}>{step===1?"Cancel":"Back"}</button>{step<4?<button className="pi-btn primary" type="button" onClick={goNext}>Next →</button>:<button className="pi-btn primary" type="button" onClick={()=>save(false)} disabled={saving}>{saving?"Saving…":"Save"}</button>}</> : <><button className="pi-btn secondary" type="button" onClick={reset}>Clear Form</button><button className="pi-btn primary" type="button" onClick={()=>save(false)} disabled={saving}>{saving?"Saving…":"Save"}</button></>}</section>
    </>}
    {preview&&<PurchaseDocumentPreview {...preview} onClose={()=>setPreview(null)}/>}
  </main>;
}

function Field({label,value,onChange,type="text",readOnly=false,placeholder="",required=false}) {
  return <label className="pi-field">{label}{type==="textarea"?<textarea/>:<input type={type} value={value||""} onChange={e=>onChange?.(e.target.value)} readOnly={readOnly} placeholder={placeholder} required={required}/>}</label>;
}
function SummaryRow({label,value}){return <div className="pi-summary-row"><span>{label}</span><strong>{value}</strong></div>}
