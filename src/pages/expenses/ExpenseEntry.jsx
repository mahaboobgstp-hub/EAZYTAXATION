import React, { useEffect, useMemo, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { useLocation, useNavigate } from "react-router-dom";
import { useCompany } from "../../context/CompanyContext";
import { supabase } from "../../supabase/supabaseClient";
import {
  generateExpenseNumber, getExpenseMasters, getExpenseById, saveExpense, updateExpense,
  uploadExpenseAttachment, getExpenseAttachmentUrl, createExpensePayment
} from "../../services/expenseService";
import ExpenseDocumentPreview from "./ExpenseDocumentPreview";
import "../../css/expenses/ExpenseWorkspace.css";

const today = () => { const d = new Date(); return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10); };
const n = value => Number(value) || 0;
const money = value => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(n(value));
const blankLine = () => ({description:"",hsn_sac:"",qty:"1",uom:"",rate:"0",gst_percent:"18",discount_percent:"0"});
const initialForm = () => ({expense_no:"",expense_date:today(),category_id:"",vendor_id:"",payee_name:"",supplier_invoice_no:"",supplier_invoice_date:"",payment_mode:"Bank",payment_account:"",paid_by:"",due_date:"",reference_no:"",gst_treatment:"Registered (Regular)",discount_amount:"0",other_charges:"0",round_off:"0",remarks:"",payment_status:"Unpaid",status:"Posted",attachment_url:""});

export default function ExpenseEntry(){
  const {currentCompany,currentCompanyId}=useCompany();
  const isAndroid=Capacitor.isNativePlatform()&&Capacitor.getPlatform()==="android";
  const [step,setStep]=useState(1);
  const location=useLocation(),navigate=useNavigate();
  const [vendors,setVendors]=useState([]),[categories,setCategories]=useState([]);
  const [form,setForm]=useState(initialForm),[lines,setLines]=useState([blankLine()]);
  const [expenseId,setExpenseId]=useState(null),[file,setFile]=useState(null),[attachmentLink,setAttachmentLink]=useState("");
  const [loading,setLoading]=useState(false),[message,setMessage]=useState(""),[preview,setPreview]=useState(null);
  const [supplierState,setSupplierState]=useState("");
  const companyName=currentCompany?.company_name||"";

  useEffect(()=>{if(!currentCompanyId){setVendors([]);setCategories([]);return;}getExpenseMasters(currentCompanyId).then(({vendors,categories})=>{setVendors(vendors);setCategories(categories);}).catch(e=>setMessage(e.message));},[currentCompanyId]);
  useEffect(()=>{
    if(!currentCompanyId)return;
    const editId=location.state?.editExpenseId;
    if(!editId){reset(false);generateExpenseNumber(currentCompanyId).then(no=>setForm(p=>({...p,expense_no:no}))).catch(err=>setMessage(err.message));return;}
    let active=true;
    getExpenseById(editId,currentCompanyId).then(data=>{if(!active)return;
      setExpenseId(data.id);setSupplierState(data.vendor_state||"");
      setForm({...initialForm(),...data,payee_name:data.payee_name||data.vendor_name||"",discount_amount:String(data.discount_amount||0),other_charges:String(data.other_charges||0),round_off:String(data.round_off||0)});
      setLines(data.items?.length?data.items.map(x=>({description:x.description,hsn_sac:x.hsn_sac||"",qty:String(x.qty),uom:x.uom||"",rate:String(x.rate),gst_percent:String(x.gst_percent),discount_percent:String(x.discount_percent||0)})):[blankLine()]);
      if(data.attachment_url)getExpenseAttachmentUrl(data.attachment_url).then(url=>active&&setAttachmentLink(url)).catch(()=>{});
    }).catch(e=>setMessage(e.message));
    return()=>{active=false;};
  },[currentCompanyId,location.state]);
  const set=(key,value)=>setForm(p=>({...p,[key]:value}));
  const vendor=vendors.find(v=>v.id===form.vendor_id);
  const isSameState=Boolean(currentCompany?.state&&vendor?.state&&currentCompany.state.trim().toLowerCase()===vendor.state.trim().toLowerCase());
  const calc=useMemo(()=>{
    const gross=lines.reduce((s,l)=>s+Math.max(0,n(l.qty))*Math.max(0,n(l.rate)),0);
    const headerDiscount=Math.min(gross,Math.max(0,n(form.discount_amount)));
    let taxable=0,cgst=0,sgst=0,igst=0;
    const normalized=lines.filter(l=>l.description.trim()).map(l=>{
      const lineGross=Math.max(0,n(l.qty))*Math.max(0,n(l.rate));
      const lineDiscount=lineGross*n(l.discount_percent)/100;
      const share= gross?headerDiscount*((lineGross-lineDiscount)/Math.max(1,gross-lines.reduce((s,x)=>s+Math.max(0,n(x.qty))*Math.max(0,n(x.rate))*n(x.discount_percent)/100,0))):0;
      const discount=lineDiscount+share;
      const base=Math.max(0,lineGross-discount);
      const taxRate=form.gst_treatment==="No GST"?0:n(l.gst_percent);
      const tax=Math.round(base*taxRate)/100;
      const c=isSameState?Math.round(tax/2*100)/100:0,s=isSameState?Math.round((tax-c)*100)/100:0,ig=isSameState?0:tax;
      taxable+=base;cgst+=c;sgst+=s;igst+=ig;
      return {...l,qty:n(l.qty),rate:n(l.rate),gst_percent:taxRate,discount_percent:n(l.discount_percent),discount_amount:discount,taxable_amount:base,cgst_amount:c,sgst_amount:s,igst_amount:ig,total_amount:base+c+s+ig};
    });
    const raw=taxable+cgst+sgst+igst+n(form.other_charges);
    const roundOff=n(form.round_off);
    return {normalized,gross,discount:headerDiscount+normalized.reduce((s,l)=>s+l.discount_amount,0)-headerDiscount,taxable,cgst,sgst,igst,other:n(form.other_charges),roundOff,total:Math.max(0,raw+roundOff)};
  },[lines,form.discount_amount,form.other_charges,form.round_off,isSameState]);
  const updateLine=(index,key,value)=>setLines(p=>p.map((l,i)=>i===index?{...l,[key]:value}:l));

  function reset(clearMessage=true){
    setExpenseId(null);setFile(null);setAttachmentLink("");setSupplierState("");setForm(initialForm());setLines([blankLine()]);
    if(clearMessage)setMessage("");
    if(location.state?.editExpenseId)navigate("/app/expenses",{replace:true,state:null});
  }
  async function save(event,print=false){
    event?.preventDefault();setMessage("");
    if(!currentCompanyId){setMessage("Choose a company first.");return;}
    if(!form.category_id){setMessage("Choose an expense category.");return;}
    if(!form.payee_name.trim()&&!form.vendor_id){setMessage("Enter the supplier or payee.");return;}
    if(!calc.normalized.length){setMessage("Add at least one expense line.");return;}
    setLoading(true);
    try{
      const number=form.expense_no||await generateExpenseNumber(currentCompanyId);
      const gst=n(calc.cgst+calc.sgst+calc.igst);
      const header={expense_no:number,expense_date:form.expense_date,company_id:currentCompanyId,category_id:form.category_id||null,vendor_id:form.vendor_id||null,payee_name:form.payee_name.trim(),supplier_invoice_no:form.supplier_invoice_no.trim(),supplier_invoice_date:form.supplier_invoice_date||null,payment_mode:form.payment_mode,payment_account:form.payment_account.trim(),paid_by:form.paid_by.trim(),due_date:form.due_date||null,reference_no:form.reference_no.trim(),gst_treatment:form.gst_treatment,is_gst_applicable:form.gst_treatment!=="No GST",taxable_amount:calc.taxable,gst_percent:calc.taxable?gst/calc.taxable*100:0,cgst:calc.cgst,sgst:calc.sgst,igst:calc.igst,discount_amount:calc.discount,other_charges:calc.other,round_off:calc.roundOff,total_amount:calc.total,paid_amount:expenseId?n(form.paid_amount):0,payment_status:expenseId?(n(form.paid_amount)>=calc.total&&calc.total>0?"Paid":n(form.paid_amount)>0?"Partially Paid":"Unpaid"):"Unpaid",status:form.status,remarks:form.remarks.trim(),attachment_url:form.attachment_url||null};
      let id=expenseId;
      if(id) await updateExpense(id,header,calc.normalized,currentCompanyId);
      else id=await saveExpense(header,calc.normalized,currentCompanyId);
      setExpenseId(id);
      let path=form.attachment_url||null;
      if(file){path=await uploadExpenseAttachment(currentCompanyId,number,file);const {error:attachError}=await supabase.from("expenses").update({attachment_url:path,updated_at:new Date().toISOString()}).eq("id",id).eq("company_id",currentCompanyId);if(attachError)throw attachError;header.attachment_url=path;}
      const saved={...header,id,vendor_name:form.payee_name.trim()||vendor?.vendor_name||"",vendor_gstin:vendor?.gstin||"",category_name:categories.find(c=>c.id===form.category_id)?.category_name||""};
      setMessage(expenseId?"Expense updated successfully.":"Expense saved successfully.");
      if(print){setPreview({kind:"expense",record:saved,items:calc.normalized,company:currentCompany,autoPrint:true});}
      else reset(false);
    }catch(error){setMessage(error.message||"Unable to save expense.");}
    finally{setLoading(false);}
  }
  function selectVendor(id){const v=vendors.find(x=>x.id===id);set("vendor_id",id);set("payee_name",v?.vendor_name||"");setSupplierState(v?.state||"");}

  const nextStep=()=>{if(step===1&&!form.category_id){setMessage("Choose an expense category to continue.");return;}if(step===1&&!form.payee_name.trim()&&!form.vendor_id){setMessage("Enter or select the supplier/payee.");return;}if(step===2&&!calc.normalized.length){setMessage("Add at least one expense item to continue.");return;}setMessage("");setStep(s=>Math.min(4,s+1));};

  return <main className={isAndroid?"expense-page android-workflow":"expense-page"}>
    <header className="ew-heading"><div><p className="ew-breadcrumb">Billing &amp; Accounting / Expenses / Add Expense</p><h1>{expenseId?"Edit Expense":"Create Expense"}</h1></div><button className="ew-soft" type="button" onClick={()=>navigate("/app/expense-register")}>Expense Register</button></header>
    {message&&<div className="ew-alert">{message}<button type="button" onClick={()=>setMessage("")}>×</button></div>}
    {!currentCompanyId?<section className="ew-card">Choose a current company from the sidebar to record expenses.</section>:<>
      <form noValidate={isAndroid} onSubmit={e=>save(e,false)}>
        <section className="ew-card ew-top-fields" style={isAndroid&&step!==1?{display:"none"}:{}}>
          <Field label="Company" value={companyName} readOnly/>
          <Field label="Expense Voucher No." value={form.expense_no} readOnly placeholder="Generated when saved"/>
          <Field label="Expense Date" type="date" value={form.expense_date} onChange={v=>set("expense_date",v)} required/>
          <label className="ew-field">Payment Method<select value={form.payment_mode} onChange={e=>set("payment_mode",e.target.value)}>{["Bank","Cash","Card","UPI","Cheque"].map(x=><option key={x}>{x}</option>)}</select></label>
          <label className="ew-field">Supplier / Payee *<select value={form.vendor_id} onChange={e=>selectVendor(e.target.value)}><option value="">Other payee / select supplier</option>{vendors.map(v=><option key={v.id} value={v.id}>{v.vendor_name}</option>)}</select></label>
          <label className="ew-field">Expense Category *<select required value={form.category_id} onChange={e=>set("category_id",e.target.value)}><option value="">Select category</option>{categories.map(c=><option key={c.id} value={c.id}>{c.category_name}</option>)}</select></label>
          <Field label="Reference Number" value={form.reference_no} onChange={v=>set("reference_no",v)} placeholder="Bank / card reference"/>
          <label className="ew-field">GST Treatment<select value={form.gst_treatment} onChange={e=>set("gst_treatment",e.target.value)}>{["Registered (Regular)","Composition","Unregistered","No GST"].map(x=><option key={x}>{x}</option>)}</select></label>
        </section>
        <section className="ew-two-cards" style={isAndroid&&step!==2?{display:"none"}:{}}>
          <article className="ew-card"><h2>Supplier / Bill Details</h2><div className="ew-grid"><Field label="Supplier / Payee" value={form.payee_name} onChange={v=>set("payee_name",v)} placeholder="Enter supplier or payee"/><Field label="Bill Number" value={form.supplier_invoice_no} onChange={v=>set("supplier_invoice_no",v)}/><Field label="Bill Date" type="date" value={form.supplier_invoice_date} onChange={v=>set("supplier_invoice_date",v)}/><div className="ew-tax-strip"><span>Taxable Value <b>{money(calc.taxable)}</b></span><span>GST <b>{money(calc.cgst+calc.sgst+calc.igst)}</b></span><span>Total <b>{money(calc.total)}</b></span></div>{vendor?.gstin&&<small className="ew-muted">GSTIN {vendor.gstin} · {supplierState||"Supplier state"}</small>}</div></article>
          <article className="ew-card"><h2>Payment Information</h2><div className="ew-grid"><Field label="Payment Account" value={form.payment_account} onChange={v=>set("payment_account",v)} placeholder="e.g. HDFC Current Account"/><Field label="Paid By / Transaction Type" value={form.paid_by} onChange={v=>set("paid_by",v)} placeholder="NEFT / UPI / Cheque No."/><Field label="Due Date" type="date" value={form.due_date} onChange={v=>set("due_date",v)}/><label className="ew-field ew-wide">Notes / Remarks<textarea rows="2" value={form.remarks} onChange={e=>set("remarks",e.target.value)}/></label></div></article>
        </section>
        <section className="ew-card ew-items-card" style={isAndroid&&step!==3?{display:"none"}:{}}><div className="ew-card-heading"><h2>Expense Items</h2><span>{calc.normalized.length} item{calc.normalized.length===1?"":"s"}</span></div><div className="ew-item-scroll"><table className="ew-item-table"><thead><tr><th>#</th><th>Description</th><th>HSN/SAC</th><th>Qty</th><th>Unit</th><th>Rate (₹)</th><th>GST %</th><th>Taxable (₹)</th><th>Amount (₹)</th><th></th></tr></thead><tbody>{lines.map((line,i)=><tr key={i}><td>{i+1}</td><td><input value={line.description} onChange={e=>updateLine(i,"description",e.target.value)} placeholder="Expense description" required/></td><td><input value={line.hsn_sac} onChange={e=>updateLine(i,"hsn_sac",e.target.value)} placeholder="HSN/SAC"/></td><td><input type="number" min="0" step="0.001" value={line.qty} onChange={e=>updateLine(i,"qty",e.target.value)}/></td><td><input value={line.uom} onChange={e=>updateLine(i,"uom",e.target.value)} placeholder="Unit"/></td><td><input type="number" min="0" step="0.01" value={line.rate} onChange={e=>updateLine(i,"rate",e.target.value)}/></td><td><select value={line.gst_percent} onChange={e=>updateLine(i,"gst_percent",e.target.value)}>{["0","5","12","18","28"].map(x=><option key={x}>{x}</option>)}</select></td><td>{money(calc.normalized[i]?.taxable_amount||0)}</td><td><b>{money(calc.normalized[i]?.total_amount||0)}</b></td><td><button type="button" className="ew-remove" onClick={()=>setLines(p=>p.length>1?p.filter((_,j)=>j!==i):p)} aria-label="Remove item">×</button></td></tr>)}</tbody></table></div><button type="button" className="ew-add-item" onClick={()=>setLines(p=>[...p,blankLine()])}>＋ Add Item Row</button></section>
        <section className="ew-bottom-grid" style={isAndroid&&step!==4?{display:"none"}:{}}>
          <div className="ew-card ew-attachments"><div><h2>Attachments</h2><p>Upload supplier bill or supporting documents</p><label className="ew-upload">＋ Choose PDF, JPG or PNG<input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={e=>setFile(e.target.files?.[0]||null)}/></label>{file&&<div className="ew-file">{file.name}<button type="button" onClick={()=>setFile(null)}>Remove</button></div>}{!file&&attachmentLink&&<a href={attachmentLink} target="_blank" rel="noreferrer">View current attachment</a>}</div></div>
          <aside className="ew-card ew-summary"><h2>Expense Summary</h2><Summary label="Subtotal" value={money(calc.gross)}/><label className="ew-summary-input">Discount<input type="number" min="0" step="0.01" value={form.discount_amount} onChange={e=>set("discount_amount",e.target.value)}/><b>{money(calc.discount)}</b></label><Summary label={isSameState?"CGST":"IGST"} value={money(isSameState?calc.cgst:calc.igst)}/>{isSameState&&<Summary label="SGST" value={money(calc.sgst)}/>}<label className="ew-summary-input">Other Charges<input type="number" min="0" step="0.01" value={form.other_charges} onChange={e=>set("other_charges",e.target.value)}/></label><label className="ew-summary-input">Round Off<input type="number" step="0.01" value={form.round_off} onChange={e=>set("round_off",e.target.value)}/></label><div className="ew-grand"><span>Grand Total</span><b>{money(calc.total)}</b></div></aside>
        </section>
        <div className={isAndroid?"ew-actions android-workflow-actions":"ew-actions"}>{isAndroid?<><button className="ew-soft" type="button" onClick={()=>step===1?navigate("/app/expense-register"):setStep(s=>s-1)}>{step===1?"Cancel":"Back"}</button>{step<4?<button className="ew-primary" type="button" onClick={nextStep}>Continue →</button>:<><button className="ew-secondary" type="button" disabled={loading} onClick={()=>save(null,true)}>{loading?"Saving…":"Save & Print"}</button><button className="ew-primary" type="button" disabled={loading} onClick={()=>save(null,false)}>{loading?"Saving…":expenseId?"Update Expense":"Save Expense"}</button></>}</>:<><button className="ew-soft" type="button" onClick={()=>reset()}>Clear Form</button><button className="ew-secondary" type="button" disabled={loading} onClick={()=>save(null,true)}>{loading?"Saving…":"Save & Print"}</button><button className="ew-primary" type="submit" disabled={loading}>{loading?"Saving…":expenseId?"Update Expense":"Save Expense"}</button></>}</div>
      </form>
    </>}
    {preview&&<ExpenseDocumentPreview {...preview} onClose={()=>{setPreview(null);reset(false);}}/>}
  </main>;
}
function Field({label,value,onChange,type="text",readOnly=false,placeholder="",required=false}){return <label className="ew-field">{label}<input type={type} value={value??""} onChange={e=>onChange?.(e.target.value)} readOnly={readOnly} placeholder={placeholder} required={required}/></label>}
function Summary({label,value}){return <div className="ew-summary-row"><span>{label}</span><b>{value}</b></div>}
