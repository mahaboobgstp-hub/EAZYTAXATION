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
import AiDocumentCapture from "../../components/AiDocumentCapture";
import { uploadAndProcessAiInvoice } from "../../services/aiInvoiceRecognitionService";
import "../../css/expenses/ExpenseWorkspace.css";
import "../../css/AndroidWorkflow.css";

const today = () => { const d = new Date(); return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10); };
const n = value => Number(value) || 0;
const money = value => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(n(value));
const blankLine = () => ({description:"",hsn_sac:"",qty:"1",uom:"",rate:"0",gst_percent:"18",discount_percent:"0"});
const initialForm = () => ({expense_no:"",expense_date:today(),category_id:"",expense_ledger_id:"",payment_ledger_id:"",vendor_id:"",payee_name:"",supplier_invoice_no:"",supplier_invoice_date:"",payment_mode:"Bank",payment_account:"",paid_by:"",due_date:"",reference_no:"",gst_treatment:"Registered (Regular)",is_gst_inclusive:false,discount_amount:"0",other_charges:"0",round_off:"0",remarks:"",payment_status:"Unpaid",status:"Posted",attachment_url:""});

export default function ExpenseEntry(){
  const {currentCompany,currentCompanyId}=useCompany();
  const isAndroid=Capacitor.isNativePlatform()&&Capacitor.getPlatform()==="android";
  const [step,setStep]=useState(1);
  const location=useLocation(),navigate=useNavigate();
  const [vendors,setVendors]=useState([]),[categories,setCategories]=useState([]),[expenseLedgers,setExpenseLedgers]=useState([]),[paymentLedgers,setPaymentLedgers]=useState([]);
  const [form,setForm]=useState(initialForm),[lines,setLines]=useState([blankLine()]);
  const [expenseId,setExpenseId]=useState(null),[file,setFile]=useState(null),[attachmentLink,setAttachmentLink]=useState("");
  const [loading,setLoading]=useState(false),[message,setMessage]=useState(""),[preview,setPreview]=useState(null);
  const [supplierState,setSupplierState]=useState("");
  const [includeGstInAmount,setIncludeGstInAmount]=useState(false);
  const accountingEnabled=Boolean(currentCompany?.accounting_enabled);
  const [openAiPicker,setOpenAiPicker]=useState(Boolean(location.state?.openAiDocumentPicker));
  const [aiProcessing,setAiProcessing]=useState(false),[aiValidation,setAiValidation]=useState(null);
  const companyName=currentCompany?.company_name||"";

  useEffect(()=>{if(!currentCompanyId){setVendors([]);setCategories([]);setExpenseLedgers([]);setPaymentLedgers([]);return;}getExpenseMasters(currentCompanyId,accountingEnabled).then(({vendors,categories,expenseLedgers,paymentLedgers})=>{setVendors(vendors);setCategories(categories);setExpenseLedgers(expenseLedgers||[]);setPaymentLedgers(paymentLedgers||[]);}).catch(e=>setMessage(e.message));},[currentCompanyId,accountingEnabled]);
  useEffect(()=>{
    if(!currentCompanyId)return;
    const editId=location.state?.editExpenseId;
    if(!editId){reset(false);generateExpenseNumber(currentCompanyId).then(no=>setForm(p=>({...p,expense_no:no}))).catch(err=>setMessage(err.message));return;}
    let active=true;
    getExpenseById(editId,currentCompanyId).then(data=>{if(!active)return;
      setExpenseId(data.id);setSupplierState(data.vendor_state||"");
      setForm({...initialForm(),...data,payee_name:data.payee_name||data.vendor_name||"",discount_amount:String(data.discount_amount||0),other_charges:String(data.other_charges||0),round_off:String(data.round_off||0)});
      setIncludeGstInAmount(Boolean(data.is_gst_inclusive));
      setLines(data.items?.length?data.items.map(x=>({description:x.description,hsn_sac:x.hsn_sac||"",qty:String(x.qty),uom:x.uom||"",rate:String(x.rate),gst_percent:String(x.gst_percent),discount_percent:String(x.discount_percent||0)})):[blankLine()]);
      if(data.attachment_url)getExpenseAttachmentUrl(data.attachment_url).then(url=>active&&setAttachmentLink(url)).catch(()=>{});
    }).catch(e=>setMessage(e.message));
    return()=>{active=false;};
  },[currentCompanyId,location.state]);
  const set=(key,value)=>setForm(p=>({...p,[key]:value}));
  const vendor=vendors.find(v=>v.id===form.vendor_id);
  const isSameState=Boolean(currentCompany?.state&&(supplierState||vendor?.state)&&currentCompany.state.trim().toLowerCase()===(supplierState||vendor?.state).trim().toLowerCase());
  const calc=useMemo(()=>{
    const gross=lines.reduce((s,l)=>s+Math.max(0,n(l.qty))*Math.max(0,n(l.rate)),0);
    const headerDiscount=Math.min(gross,Math.max(0,n(form.discount_amount)));
    let taxable=0,cgst=0,sgst=0,igst=0;
    const normalized=lines.filter(l=>l.description.trim()).map(l=>{
      const lineGross=Math.max(0,n(l.qty))*Math.max(0,n(l.rate));
      const lineDiscount=lineGross*n(l.discount_percent)/100;
      const share= gross?headerDiscount*((lineGross-lineDiscount)/Math.max(1,gross-lines.reduce((s,x)=>s+Math.max(0,n(x.qty))*Math.max(0,n(x.rate))*n(x.discount_percent)/100,0))):0;
      const discount=lineDiscount+share;
      const enteredBase=Math.max(0,lineGross-discount);
      const taxRate=form.gst_treatment==="No GST"?0:n(l.gst_percent);
      const inclusive=isAndroid&&includeGstInAmount&&taxRate>0;
      const base=inclusive?enteredBase/(1+taxRate/100):enteredBase;
      const tax=inclusive?enteredBase-base:Math.round(base*taxRate)/100;
      const c=isSameState?Math.round(tax/2*100)/100:0,s=isSameState?Math.round((tax-c)*100)/100:0,ig=isSameState?0:tax;
      taxable+=base;cgst+=c;sgst+=s;igst+=ig;
      return {...l,qty:n(l.qty),rate:n(l.rate),gst_percent:taxRate,discount_percent:n(l.discount_percent),discount_amount:discount,taxable_amount:base,cgst_amount:c,sgst_amount:s,igst_amount:ig,total_amount:base+c+s+ig};
    });
    const raw=taxable+cgst+sgst+igst+n(form.other_charges);
    const roundOff=n(form.round_off);
    return {normalized,gross,discount:headerDiscount+normalized.reduce((s,l)=>s+l.discount_amount,0)-headerDiscount,taxable,cgst,sgst,igst,other:n(form.other_charges),roundOff,total:Math.max(0,raw+roundOff)};
  },[lines,form.discount_amount,form.other_charges,form.round_off,isSameState,includeGstInAmount]);
  const updateLine=(index,key,value)=>setLines(p=>p.map((l,i)=>i===index?{...l,[key]:value}:l));

  function reset(clearMessage=true){
    setExpenseId(null);setFile(null);setAttachmentLink("");setSupplierState("");setIncludeGstInAmount(false);setForm(initialForm());setLines([blankLine()]);
    if(clearMessage)setMessage("");
    if(location.state?.editExpenseId)navigate("/app/expenses",{replace:true,state:null});
  }
  async function save(event,print=false){
    event?.preventDefault();setMessage("");
    if(!currentCompanyId){setMessage("Choose a company first.");return;}
    if(isAndroid&&accountingEnabled&&!form.expense_ledger_id){setMessage("Choose an expense ledger from your Chart of Accounts.");return;}
    if((!isAndroid||!accountingEnabled)&&!form.category_id){setMessage("Choose an expense category.");return;}
    if(!form.payee_name.trim()&&!form.vendor_id){setMessage("Enter the supplier or payee.");return;}
    if(!calc.normalized.length){setMessage("Add at least one expense line.");return;}
    setLoading(true);
    try{
      const number=form.expense_no||await generateExpenseNumber(currentCompanyId);
      const gst=n(calc.cgst+calc.sgst+calc.igst);
      const header={expense_no:number,expense_date:form.expense_date,company_id:currentCompanyId,category_id:form.category_id||null,expense_ledger_id:form.expense_ledger_id||null,payment_ledger_id:form.payment_ledger_id||null,is_gst_inclusive:isAndroid?includeGstInAmount:Boolean(form.is_gst_inclusive),vendor_id:form.vendor_id||null,payee_name:form.payee_name.trim(),supplier_invoice_no:form.supplier_invoice_no.trim(),supplier_invoice_date:form.supplier_invoice_date||null,payment_mode:form.payment_mode,payment_account:form.payment_account.trim(),paid_by:form.paid_by.trim(),due_date:form.due_date||null,reference_no:form.reference_no.trim(),gst_treatment:form.gst_treatment,is_gst_applicable:form.gst_treatment!=="No GST",taxable_amount:calc.taxable,gst_percent:calc.taxable?gst/calc.taxable*100:0,cgst:calc.cgst,sgst:calc.sgst,igst:calc.igst,discount_amount:calc.discount,other_charges:calc.other,round_off:calc.roundOff,total_amount:calc.total,paid_amount:expenseId?n(form.paid_amount):0,payment_status:expenseId?(n(form.paid_amount)>=calc.total&&calc.total>0?"Paid":n(form.paid_amount)>0?"Partially Paid":"Unpaid"):"Unpaid",status:form.status,remarks:form.remarks.trim(),attachment_url:form.attachment_url||null};
      let id=expenseId;
      if(id) await updateExpense(id,header,calc.normalized,currentCompanyId);
      else id=await saveExpense(header,calc.normalized,currentCompanyId);
      setExpenseId(id);
      let path=form.attachment_url||null;
      if(file){path=await uploadExpenseAttachment(currentCompanyId,number,file);const {error:attachError}=await supabase.from("expenses").update({attachment_url:path,updated_at:new Date().toISOString()}).eq("id",id).eq("company_id",currentCompanyId);if(attachError)throw attachError;header.attachment_url=path;}
      const saved={...header,id,vendor_name:form.payee_name.trim()||vendor?.vendor_name||"",vendor_gstin:vendor?.gstin||"",category_name:categories.find(c=>c.id===form.category_id)?.category_name||expenseLedgers.find(c=>c.id===form.expense_ledger_id)?.ledger_name||""};
      setMessage(expenseId?"Expense updated successfully.":"Expense saved successfully.");
      if(print){setPreview({kind:"expense",record:saved,items:calc.normalized,company:currentCompany,autoPrint:true});}
      else reset(false);
    }catch(error){setMessage(error.message||"Unable to save expense.");}
    finally{setLoading(false);}
  }
  function selectVendor(id){const v=vendors.find(x=>x.id===id);set("vendor_id",id);set("payee_name",v?.vendor_name||"");setSupplierState(v?.state||"");}
  async function handleAiDocument(selectedFile){
    setFile(selectedFile);
    setAiValidation(null);
    setAiProcessing(true);
    setMessage("Uploading and analysing expense invoice…");
    try{
      const result=await uploadAndProcessAiInvoice(selectedFile,currentCompanyId,"expense");
      const data=result.extractedData||{};
      const clean=value=>String(value||"").trim().toLowerCase().replace(/[^a-z0-9]/g,"");
      const gstin=clean(data.supplier_gstin);
      const matchedVendor=vendors.find(v=>gstin&&clean(v.gstin)===gstin)
        ||vendors.find(v=>clean(v.vendor_name)&&clean(v.vendor_name)===clean(data.supplier_name));
      const supplierName=data.supplier_name||matchedVendor?.vendor_name||"";
      const supplierPlace=data.supplier_state||data.place_of_supply||matchedVendor?.state||"";
      setSupplierState(supplierPlace);
      setForm(previous=>({
        ...previous,
        expense_date:data.invoice_date||previous.expense_date,
        payee_name:supplierName||previous.payee_name,
        vendor_id:matchedVendor?.id||previous.vendor_id,
        supplier_invoice_no:data.invoice_number||previous.supplier_invoice_no,
        supplier_invoice_date:data.invoice_date||previous.supplier_invoice_date,
        due_date:data.due_date||previous.due_date,
        gst_treatment:data.supplier_gstin?"Registered (Regular)":previous.gst_treatment,
        remarks:previous.remarks||"AI extracted from uploaded invoice",
      }));
      const extractedLines=(data.items||[]).map(item=>{
        const qty=Number(item.quantity??1)||1;
        const rate=Number(item.rate??(item.gross_amount!=null?Number(item.gross_amount)/qty:0))||0;
        const gross=Number(item.gross_amount??qty*rate)||0;
        const discount=Number(item.discount_amount||0);
        const gstRate=Number(item.gst_rate??((Number(item.cgst_rate)||0)+(Number(item.sgst_rate)||0)+(Number(item.igst_rate)||0)))||0;
        return {
          description:item.description||"Invoice item",
          hsn_sac:item.hsn_sac||"",
          qty:String(qty),
          uom:item.unit||"",
          rate:String(rate),
          gst_percent:String(gstRate),
          discount_percent:String(gross>0?discount/gross*100:0),
        };
      });
      if(!extractedLines.length&&data.taxable_value!=null){
        const gstTotal=Number(data.cgst_total||0)+Number(data.sgst_total||0)+Number(data.igst_total||0);
        extractedLines.push({
          description:supplierName?("Invoice charge - "+supplierName):"Invoice charge",
          hsn_sac:"",
          qty:"1",
          uom:"Nos",
          rate:String(Number(data.taxable_value)||0),
          gst_percent:String(Number(data.taxable_value)?gstTotal/Number(data.taxable_value)*100:0),
          discount_percent:"0",
        });
      }
      if(extractedLines.length)setLines(extractedLines);
      if(matchedVendor)set("vendor_id",matchedVendor.id);
      setAiValidation(result.validationResults);
      setMessage("Invoice analysed. Review the extracted details, select an expense category and correct any warnings before saving.");
      setStep(1);
    }catch(error){
      setMessage(error.message||"Unable to analyse this expense invoice.");
    }finally{
      setAiProcessing(false);
    }
  }

  const nextStep=()=>{if(step===1&&accountingEnabled&&!form.expense_ledger_id){setMessage("Choose an expense ledger to continue.");return;}if(step===1&&!accountingEnabled&&!form.category_id){setMessage("Choose an expense category to continue.");return;}if(step===2&&!form.payee_name.trim()&&!form.vendor_id){setMessage("Enter or select the supplier/payee.");return;}if(step===2&&accountingEnabled&&!form.payment_ledger_id){setMessage("Choose the payment account.");return;}if(step===3&&!calc.normalized.length){setMessage("Enter the taxable amount to continue.");return;}setMessage("");setStep(s=>Math.min(4,s+1));};

  if(isAndroid) return <AndroidExpenseFlow
    step={step} setStep={setStep} form={form} set={set} lines={lines} updateLine={updateLine}
    calc={calc} vendors={vendors} categories={categories} expenseLedgers={expenseLedgers}
    paymentLedgers={paymentLedgers} accountingEnabled={accountingEnabled} currentCompany={currentCompany}
    vendor={vendor} selectVendor={selectVendor} includeGstInAmount={includeGstInAmount}
    setIncludeGstInAmount={setIncludeGstInAmount} file={file} setFile={setFile}
    attachmentLink={attachmentLink} message={message} setMessage={setMessage}
    loading={loading} expenseId={expenseId} nextStep={nextStep} save={save}
    navigate={navigate} />;

  return <main className={isAndroid?"expense-page android-workflow":"expense-page"}>
    <header className="ew-heading"><div><h1>{expenseId?"Edit Expense":"Create Expense"}</h1></div><div className="ai-entry-header-actions"><AiDocumentCapture autoOpen={openAiPicker} disabled={aiProcessing} onFileSelected={selectedFile=>{setOpenAiPicker(false);navigate(location.pathname,{replace:true,state:null});handleAiDocument(selectedFile);}}/><button className="ew-soft" type="button" onClick={()=>navigate("/app/expense-register")}>Expense Register</button></div></header>
    {file&&isAndroid&&<div className="ai-selected-document"><b>{aiProcessing?"Analysing invoice…":"Invoice analysed:"}</b> {file.name}<small>{aiProcessing?"Reading supplier, bill, expense and GST details. Please keep this screen open.":`Supplier: ${form.payee_name||"Not identified"} · GSTIN: ${vendor?.gstin||"See supplier details"} · Bill No: ${form.supplier_invoice_no||"Not identified"}`}</small>{aiValidation?.warnings?.length>0&&<ul>{aiValidation.warnings.map((warning,index)=><li key={index}>{warning}</li>)}</ul>}</div>}
    {message&&<div className="ew-alert">{message}<button type="button" onClick={()=>setMessage("")}>×</button></div>}
    {isAndroid&&currentCompanyId&&<nav className="android-stepper" aria-label="Expense entry steps">{["Expense","Bill & Payment","Items","Review"].map((label,i)=><button type="button" key={label} className={step===i+1?"active":step>i+1?"complete":""} onClick={()=>{if(i+1<step){setMessage("");setStep(i+1);}}}><b>{i+1}</b><span>{label}</span></button>)}</nav>}
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
        <div className={isAndroid?"ew-actions android-workflow-actions":"ew-actions"}>{isAndroid?<><button className="ew-soft" type="button" onClick={()=>step===1?navigate("/app/expense-register"):setStep(s=>s-1)}>{step===1?"Cancel":"Back"}</button>{step<4?<button className="ew-primary" type="button" onClick={nextStep}>Next →</button>:<><button className="ew-secondary" type="button" disabled={loading} onClick={()=>save(null,true)}>{loading?"Saving…":"Save & Print"}</button><button className="ew-primary" type="button" disabled={loading} onClick={()=>save(null,false)}>{loading?"Saving…":expenseId?"Update Expense":"Save Expense"}</button></>}</>:<><button className="ew-soft" type="button" onClick={()=>reset()}>Clear Form</button><button className="ew-secondary" type="button" disabled={loading} onClick={()=>save(null,true)}>{loading?"Saving…":"Save & Print"}</button><button className="ew-primary" type="submit" disabled={loading}>{loading?"Saving…":expenseId?"Update Expense":"Save Expense"}</button></>}</div>
      </form>
    </>}
    {preview&&<ExpenseDocumentPreview {...preview} onClose={()=>{setPreview(null);reset(false);}}/>}
  </main>;
}

function AndroidExpenseFlow({step,setStep,form,set,lines,updateLine,calc,vendors,categories,expenseLedgers,paymentLedgers,accountingEnabled,currentCompany,vendor,selectVendor,includeGstInAmount,setIncludeGstInAmount,file,setFile,attachmentLink,message,setMessage,loading,expenseId,nextStep,save,navigate}){
  const [customPayee,setCustomPayee]=useState(false);
  const moneyValue=value=>money(value);
  const expenseLedger=expenseLedgers.find(item=>item.id===form.expense_ledger_id);
  const category=categories.find(item=>item.id===form.category_id);
  const selectedExpenseName=expenseLedger?.ledger_name||category?.category_name||"";
  const setAmount=value=>updateLine(0,"rate",value);
  const setGst=value=>updateLine(0,"gst_percent",value);
  const paymentModeOptions=[["Cash","▣"],["Bank","▤"],["UPI","UPI"],["Others","•••"]];
  const visiblePaymentLedgers=paymentLedgers.filter(item=>{
    const groupName=(item.group_name||"").toLowerCase();
    const ledgerName=(item.ledger_name||"").toLowerCase();
    if(form.payment_mode==="Cash")return groupName.includes("cash")||ledgerName.includes("cash");
    if(form.payment_mode==="Bank"||form.payment_mode==="UPI"||form.payment_mode==="Cheque")return item.party_type==="Bank"||groupName.includes("bank")||ledgerName.includes("bank");
    return true;
  });
  const paymentOptions=visiblePaymentLedgers.length?visiblePaymentLedgers:paymentLedgers;
  const paymentName=paymentLedgers.find(item=>item.id===form.payment_ledger_id)?.ledger_name||form.payment_account;
  const gstTotal=calc.cgst+calc.sgst+calc.igst;
  const row=(label,value)=><div className="aex-review-row"><span>{label}</span><b>{value||"—"}</b></div>;
  return <main className="expense-page android-workflow aex-page">
    <header className="ew-heading aex-heading"><div><h1>{expenseId?"Edit Expense":"Create Expense"}</h1></div></header>
    {message&&<div className="ew-alert">{message}<button type="button" onClick={()=>setMessage("")}>×</button></div>}
    <nav className="android-stepper aex-stepper" aria-label="Expense entry steps">{["Details","Bill & Payment","Tax & Other","Review"].map((label,index)=><button type="button" key={label} className={step===index+1?"active":step>index+1?"complete":""} onClick={()=>{if(index+1<step){setMessage("");setStep(index+1);}}}><b>{step>index+1?"✓":index+1}</b><span>{label}</span></button>)}</nav>
    <form className="aex-form" onSubmit={event=>event.preventDefault()}>
      {step===1&&<section className="ew-card aex-card">
        <h2>▤ &nbsp;Expense Details</h2>
        <Field label="Expense Voucher No." value={form.expense_no} readOnly/>
        <Field label="Expense Date *" type="date" value={form.expense_date} onChange={value=>set("expense_date",value)} required/>
        {accountingEnabled?<label className="ew-field">Expense Ledger *<select value={form.expense_ledger_id||""} onChange={event=>{const id=event.target.value;set("expense_ledger_id",id);const selected=expenseLedgers.find(item=>item.id===id);updateLine(0,"description",selected?.ledger_name||"");}}><option value="">Select expense ledger</option>{expenseLedgers.map(item=><option key={item.id} value={item.id}>{item.ledger_name}</option>)}</select>{!expenseLedgers.length&&<small className="aex-hint">No active Expense ledgers were found in this company's Chart of Accounts. Add an Expense ledger before recording this entry.</small>}</label>:<label className="ew-field">Expense Category *<select value={form.category_id||""} onChange={event=>{const id=event.target.value;set("category_id",id);const selected=categories.find(item=>item.id===id);updateLine(0,"description",selected?.category_name||"");}}><option value="">Select expense category</option>{categories.map(item=><option key={item.id} value={item.id}>{item.category_name}</option>)}</select></label>}
        <p className="aex-info">ⓘ {accountingEnabled?"Showing active Expense ledgers from your Chart of Accounts.":"Choose from the general expense categories."}</p>
        <label className="ew-field">Narration / Remarks<textarea rows="3" value={form.remarks} onChange={event=>set("remarks",event.target.value)} placeholder="Enter note (optional)"/></label>
      </section>}
      {step===2&&<section className="ew-card aex-card">
        <h2>♙ &nbsp;Bill & Supplier Details</h2>
        <label className="ew-field">Supplier / Payee<select value={customPayee?"":form.vendor_id||""} onChange={event=>{setCustomPayee(false);selectVendor(event.target.value);}}><option value="">Select supplier / payee</option>{vendors.map(item=><option key={item.id} value={item.id}>{item.vendor_name}</option>)}</select></label>
        <button className="aex-add-supplier" type="button" onClick={()=>{setCustomPayee(true);set("vendor_id","");set("payee_name","");}}>＋ Add New Supplier / Other Payee</button>
        {(customPayee||(!form.vendor_id&&form.payee_name))&&<Field label="Supplier / Payee Name *" value={form.payee_name} onChange={value=>set("payee_name",value)} placeholder="Enter supplier or payee name" required/>}
        <Field label="Bill / Invoice No." value={form.supplier_invoice_no} onChange={value=>set("supplier_invoice_no",value)} placeholder="Enter bill number"/>
        <Field label="Bill Date" type="date" value={form.supplier_invoice_date} onChange={value=>set("supplier_invoice_date",value)}/>
        <div className="aex-section-label">Payment Method *</div>
        <div className="aex-payment-methods">{paymentModeOptions.map(([name,icon])=><button type="button" key={name} className={form.payment_mode===name?"selected":""} onClick={()=>{set("payment_mode",name);set("payment_ledger_id","");set("payment_account","");}}><b>{icon}</b><span>{name}</span></button>)}</div>
        {accountingEnabled?<label className="ew-field">Payment Account *<select value={form.payment_ledger_id||""} onChange={event=>{const id=event.target.value;set("payment_ledger_id",id);set("payment_account",paymentLedgers.find(item=>item.id===id)?.ledger_name||"");}}><option value="">Select payment account</option>{paymentOptions.map(item=><option key={item.id} value={item.id}>{item.ledger_name}</option>)}</select>{!paymentLedgers.length&&<small className="aex-hint">No active Asset ledgers are available. Create a bank or cash ledger in the Chart of Accounts.</small>}</label>:<Field label="Payment Account" value={form.payment_account} onChange={value=>set("payment_account",value)} placeholder="e.g. HDFC Current Account"/>}
      </section>}
      {step===3&&<section className="ew-card aex-card">
        <h2>▱ &nbsp;Amount & Tax</h2>
        <Field label="Amount (Taxable) *" type="number" value={lines[0]?.rate||"0"} onChange={setAmount} placeholder="Enter amount"/>
        <div className="aex-two-fields"><label className="ew-field">GST Rate<select value={lines[0]?.gst_percent||"0"} onChange={event=>setGst(event.target.value)}>{["0","5","12","18","28"].map(rate=><option key={rate} value={rate}>{rate}%</option>)}</select></label><label className="ew-field">GST Amount<input value={moneyValue(gstTotal)} readOnly/></label></div>
        <label className="aex-toggle"><span><b>Include GST in Amount</b><small>Switch on when the entered amount already includes GST</small></span><input type="checkbox" checked={includeGstInAmount} onChange={event=>setIncludeGstInAmount(event.target.checked)}/></label>
        <Field label="Other Charges" type="number" value={form.other_charges} onChange={value=>set("other_charges",value)}/>
        <Field label="Discount" type="number" value={form.discount_amount} onChange={value=>set("discount_amount",value)}/>
        <Field label="Round Off" type="number" value={form.round_off} onChange={value=>set("round_off",value)}/>
        <div className="aex-total"><span>Total Expense</span><b>{moneyValue(calc.total)}</b></div>
      </section>}
      {step===4&&<>
        <section className="ew-card aex-card"><h2>▤ &nbsp;Review & Confirm</h2>
          {row("Voucher No.",form.expense_no)}{row("Expense Date",form.expense_date)}{row(accountingEnabled?"Expense Ledger":"Expense Category",selectedExpenseName)}
          {row("Supplier / Payee",form.payee_name||vendor?.vendor_name)}{row("Bill No.",form.supplier_invoice_no)}{row("Bill Date",form.supplier_invoice_date)}
          {row("Payment Method",form.payment_mode)}{row("Payment Account",paymentName)}
          {row("Taxable Amount",moneyValue(calc.taxable))}{row("GST ("+(lines[0]?.gst_percent||0)+"%)",moneyValue(gstTotal))}
          {row("Other Charges",moneyValue(calc.other))}{row("Discount",moneyValue(calc.discount))}
          <div className="aex-review-total"><span>Total Expense</span><b>{moneyValue(calc.total)}</b></div>
        </section>
        <section className="ew-card aex-card aex-attachments"><h2>♧ &nbsp;Attachments</h2><p>Upload supplier bill or supporting documents</p><label className="ew-upload">＋ Choose PDF, JPG or PNG<input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={event=>setFile(event.target.files?.[0]||null)}/></label>{file&&<div className="ew-file">{file.name}<button type="button" onClick={()=>setFile(null)}>Remove</button></div>}{!file&&attachmentLink&&<a href={attachmentLink} target="_blank" rel="noreferrer">View current attachment</a>}</section>
      </>}
      <div className="ew-actions android-workflow-actions aex-actions">
        <button className="ew-soft" type="button" onClick={()=>step===1?navigate("/app/expense-register"):setStep(current=>current-1)}>{step===1?"Cancel":"← Back"}</button>
        {step<4?<button className="ew-primary" type="button" onClick={nextStep}>Next →</button>:<><button className="ew-secondary" type="button" disabled={loading} onClick={()=>save(null,true)}>{loading?"Saving…":"Save & Print"}</button><button className="ew-primary" type="button" disabled={loading} onClick={()=>save(null,false)}>{loading?"Saving…":expenseId?"Update Expense":"Save Expense"}</button></>}
      </div>
    </form>
  </main>;
}

function Field({label,value,onChange,type="text",readOnly=false,placeholder="",required=false}){return <label className="ew-field">{label}<input type={type} value={value??""} onChange={e=>onChange?.(e.target.value)} readOnly={readOnly} placeholder={placeholder} required={required}/></label>}
function Summary({label,value}){return <div className="ew-summary-row"><span>{label}</span><b>{value}</b></div>}
