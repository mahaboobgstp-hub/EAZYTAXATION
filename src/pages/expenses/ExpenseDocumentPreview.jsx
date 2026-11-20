import React,{useEffect,useState} from "react";
import {downloadExpensePdf} from "../../utils/expenseDocumentPdf";
import "../../css/expenses/ExpenseWorkspace.css";

export default function ExpenseDocumentPreview({kind="expense",record,items=[],company,onClose}){
 const [pdfUrl,setPdfUrl]=useState("");
 const [zoom,setZoom]=useState(100);
 useEffect(()=>{
  const result=downloadExpensePdf({kind,record,items,company,returnBlob:true});
  const url=URL.createObjectURL(result.blob);
  setPdfUrl(url);
  return()=>URL.revokeObjectURL(url);
 },[kind,record,items,company]);
 const title=kind==="payment"?"Payment Voucher":"Expense Voucher";
 return <div className="ew-overlay ew-print-overlay expense-pdf-overlay" onMouseDown={e=>e.target===e.currentTarget&&onClose?.()}>
  <section className="ew-preview expense-pdf-preview" role="dialog" aria-modal="true" aria-label={title+" PDF preview"}>
   <div className="ew-preview-toolbar expense-pdf-toolbar">
    <button type="button" className="ew-soft" onClick={onClose}>Close</button>
    <div className="expense-pdf-zoom"><button type="button" aria-label="Zoom out" disabled={zoom<=70} onClick={()=>setZoom(v=>Math.max(70,v-10))}>−</button><span>{zoom}%</span><button type="button" aria-label="Zoom in" disabled={zoom>=180} onClick={()=>setZoom(v=>Math.min(180,v+10))}>＋</button></div>
    <button type="button" className="ew-secondary" onClick={()=>downloadExpensePdf({kind,record,items,company})}>Download PDF</button>
   </div>
   {pdfUrl?<iframe key={zoom} className="expense-pdf-frame" title={title+" PDF"} src={pdfUrl+"#toolbar=1&navpanes=0&zoom="+zoom} />:<div className="ew-empty">Preparing PDF preview…</div>}
  </section>
 </div>;
}
