import React from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiCpu, FiMic, FiFileText, FiChevronRight, FiCheckCircle } from "react-icons/fi";
import "../../css/AIWorkflows.css";

export default function AIAssistant(){
  const navigate=useNavigate();
  return <main className="ai-screen">
    <header className="ai-screen-header"><button type="button" onClick={()=>navigate("/app")} aria-label="Back"><FiArrowLeft/></button><h1>AI Assistant</h1></header>
    <section className="ai-hero">
      <div className="ai-robot"><FiCpu/></div>
      <h2>Your Accounting AI Assistant</h2>
      <p>Create invoices, record expenses, create masters or add from invoice documents.</p>
    </section>
    <button type="button" className="ai-action-card voice" onClick={()=>navigate("/app/ai-assistant/voice")}>
      <span className="ai-action-icon"><FiMic/></span><span className="ai-action-copy"><b>Voice Command</b><small>Speak to create invoices, entries and masters</small></span><FiChevronRight className="ai-chevron"/>
    </button>
    <button type="button" className="ai-action-card scan" onClick={()=>navigate("/app/ai-assistant/document-type")}>
      <span className="ai-action-icon"><FiFileText/></span><span className="ai-action-copy"><b>Upload Invoice</b><small>Choose Purchase or Expense, then take a photo or upload PDF/image</small></span><FiChevronRight className="ai-chevron"/>
    </button>
    <section className="ai-examples"><h3>Try saying...</h3>
      <p><FiMic/> “Create a sales invoice for ABC Traders”</p>
      <p><FiMic/> “Record a purchase from XYZ Suppliers”</p>
      <p><FiMic/> “Enter an expense of ₹10,000 for office rent”</p>
      <p><FiCheckCircle/> AI-created entries always wait for your review before posting.</p>
    </section>
  </main>;
}
