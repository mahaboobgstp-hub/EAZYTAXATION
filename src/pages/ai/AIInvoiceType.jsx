import React from "react";
import {useNavigate} from "react-router-dom";
import {FiArrowLeft,FiShoppingCart,FiClipboard,FiChevronRight} from "react-icons/fi";
import "../../css/AIWorkflows.css";

export default function AIInvoiceType(){
 const navigate=useNavigate();
 const open=(type)=>navigate(type==="purchase"?"/app/purchases":"/app/expenses",{state:{openAiDocumentPicker:true,aiDocumentType:type}});
 return <main className="ai-screen">
  <header className="ai-screen-header"><button type="button" onClick={()=>navigate("/app/ai-assistant")} aria-label="Back"><FiArrowLeft/></button><h1>Upload Invoice</h1></header>
  <section className="ai-type-intro"><div className="ai-document-illustration"><FiClipboard/></div><h2>What type of document is this?</h2><p>Choose the entry screen first. You can then take a picture or select an image/PDF from your phone.</p></section>
  <button className="ai-type-card" type="button" onClick={()=>open("purchase")}><span className="purchase"><FiShoppingCart/></span><span><b>Purchase Invoice</b><small>Supplier bill, goods or services purchased</small></span><FiChevronRight/></button>
  <button className="ai-type-card" type="button" onClick={()=>open("expense")}><span className="expense"><FiClipboard/></span><span><b>Expense Entry</b><small>Rent, electricity, travel and other expenses</small></span><FiChevronRight/></button>
  <p className="ai-safe-note">The document will be attached to the selected entry for review. It will not be posted automatically.</p>
 </main>;
}
