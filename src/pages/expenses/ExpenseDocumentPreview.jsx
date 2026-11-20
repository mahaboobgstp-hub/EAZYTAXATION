import React,{useEffect,useRef,useState} from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {downloadExpensePdf} from "../../utils/expenseDocumentPdf";
import "../../css/expenses/ExpenseWorkspace.css";

pdfjsLib.GlobalWorkerOptions.workerSrc=pdfWorker;

export default function ExpenseDocumentPreview({kind="expense",record,items=[],company,onClose}){
 const containerRef=useRef(null);
 const [zoom,setZoom]=useState(100);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 useEffect(()=>{
  let cancelled=false;
  async function renderPdf(){
   setLoading(true);setError("");
   if(containerRef.current)containerRef.current.replaceChildren();
   try{
    const result=downloadExpensePdf({kind,record,items,company,returnBlob:true});
    const bytes=new Uint8Array(await result.blob.arrayBuffer());
    const pdf=await pdfjsLib.getDocument({data:bytes}).promise;
    for(let pageNo=1;pageNo<=pdf.numPages;pageNo++){
     if(cancelled)break;
     const page=await pdf.getPage(pageNo);
     const base=page.getViewport({scale:1});
     const availableWidth=Math.max(260,(containerRef.current?.clientWidth||360)-20);
     const fitScale=availableWidth/base.width;
     const viewport=page.getViewport({scale:fitScale*(zoom/100)});
     const ratio=window.devicePixelRatio||1;
     const canvas=document.createElement("canvas");
     canvas.className="expense-pdf-page";
     canvas.width=Math.floor(viewport.width*ratio);
     canvas.height=Math.floor(viewport.height*ratio);
     canvas.style.width=viewport.width+"px";
     canvas.style.height=viewport.height+"px";
     const context=canvas.getContext("2d");
     await page.render({canvasContext:context,viewport,transform:ratio!==1?[ratio,0,0,ratio,0,0]:null}).promise;
     if(!cancelled)containerRef.current?.appendChild(canvas);
    }
   }catch(e){if(!cancelled)setError("The PDF preview could not be rendered. You can still download the PDF.");}
   finally{if(!cancelled)setLoading(false);}
  }
  renderPdf();
  return()=>{cancelled=true;};
 },[kind,record,items,company,zoom]);
 return <div className="ew-overlay ew-print-overlay expense-pdf-overlay" onMouseDown={e=>e.target===e.currentTarget&&onClose?.()}>
  <section className="ew-preview expense-pdf-preview" role="dialog" aria-modal="true" aria-label={(kind==="payment"?"Payment Voucher":"Expense Voucher")+" PDF preview"}>
   <div className="ew-preview-toolbar expense-pdf-toolbar">
    <button type="button" className="ew-soft" onClick={onClose}>Close</button>
    <div className="expense-pdf-zoom"><button type="button" aria-label="Zoom out" disabled={zoom<=70} onClick={()=>setZoom(v=>Math.max(70,v-10))}>−</button><span>{zoom}%</span><button type="button" aria-label="Zoom in" disabled={zoom>=180} onClick={()=>setZoom(v=>Math.min(180,v+10))}>＋</button></div>
    <button type="button" className="ew-secondary" onClick={()=>downloadExpensePdf({kind,record,items,company})}>Download PDF</button>
   </div>
   <div className="expense-pdf-scroll" ref={containerRef}>{loading&&<div className="ew-empty">Preparing PDF preview…</div>}{error&&<div className="ew-empty">{error}</div>}</div>
  </section>
 </div>;
}
