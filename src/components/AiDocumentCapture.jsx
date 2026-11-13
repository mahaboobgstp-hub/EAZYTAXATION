import React,{useEffect,useRef,useState} from "react";
import {FiCamera,FiImage,FiX,FiFileText} from "react-icons/fi";

export default function AiDocumentCapture({onFileSelected,disabled=false,autoOpen=false}){
 const [open,setOpen]=useState(Boolean(autoOpen)),cameraRef=useRef(null),fileRef=useRef(null);
 useEffect(()=>{if(autoOpen)setOpen(true);},[autoOpen]);
 const choose=(event)=>{const file=event.target.files?.[0];event.target.value="";if(!file)return;
  const allowed=["application/pdf","image/jpeg","image/png"];
  if(!allowed.includes(file.type)){window.alert("Please choose a PDF, JPG or PNG image.");return;}
  if(file.size>10*1024*1024){window.alert("The document must be 10 MB or smaller.");return;}
  onFileSelected?.(file);setOpen(false);
 };
 return <>
  <div className="ai-document-header-actions">
   <button type="button" className="ai-document-header-button" onClick={()=>setOpen(true)} disabled={disabled} aria-label="Take photo or upload invoice"><FiCamera/></button>
   <button type="button" className="ai-document-header-button" onClick={()=>setOpen(true)} disabled={disabled} aria-label="Upload invoice file"><FiFileText/></button>
  </div>
  <input ref={cameraRef} className="ai-hidden-input" type="file" accept="image/*" capture="environment" onChange={choose}/>
  <input ref={fileRef} className="ai-hidden-input" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={choose}/>
  {open&&<div className="ai-capture-backdrop" role="presentation" onClick={()=>setOpen(false)}>
   <section className="ai-capture-sheet" role="dialog" aria-modal="true" aria-label="Add invoice document" onClick={e=>e.stopPropagation()}>
    <div className="ai-capture-sheet-heading"><div><b>Add invoice document</b><small>Take a picture or choose an existing file</small></div><button type="button" onClick={()=>setOpen(false)} aria-label="Close"><FiX/></button></div>
    <button type="button" className="ai-capture-option camera" onClick={()=>cameraRef.current?.click()}><FiCamera/><span><b>Take Photo</b><small>Open phone camera</small></span></button>
    <button type="button" className="ai-capture-option upload" onClick={()=>fileRef.current?.click()}><FiImage/><span><b>Upload File</b><small>Gallery image or PDF</small></span></button>
    <p>Supported: PDF, JPG and PNG · Maximum 10 MB</p>
   </section>
  </div>}
 </>;
}
