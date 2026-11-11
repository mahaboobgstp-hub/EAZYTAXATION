import React, { useState } from "react";
import { useCompany } from "../context/CompanyContext";
import BulkTransactionImport from "../components/BulkTransactionImport";
import "../css/expenses/ExpenseWorkspace.css";

const today = () => {
  const date = new Date();
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

export default function ReceiptEntry() {
  const { currentCompany } = useCompany();
  const [form, setForm] = useState({ receiptDate: today(), receivedFrom: "", invoiceNumber: "", receiptMode: "Bank Transfer", depositAccount: "", reference: "", amount: "", narration: "" });
  const [message, setMessage] = useState("");
  const update = (key, value) => setForm(previous => ({ ...previous, [key]: value }));

  return (
    <main className="expense-page">
      <header className="ew-heading">
        <div><p className="ew-breadcrumb">Billing &amp; Accounting / Sales / Receipts</p><h1>Add Receipt</h1></div>
      </header>
      <BulkTransactionImport kind="receipts" />
      {!currentCompany ? (
        <section className="ew-card">Choose a current company from the sidebar to record receipts.</section>
      ) : (
        <section className="ew-card">
          <h2>Receipt Details</h2>
          <div className="ew-top-fields">
            <label className="ew-field">Company<input value={currentCompany.company_name || ""} readOnly /></label>
            <label className="ew-field">Receipt Number<input value="Generated when saved" readOnly /></label>
            <label className="ew-field">Receipt Date<input type="date" value={form.receiptDate} onChange={event => update("receiptDate", event.target.value)} /></label>
            <label className="ew-field">Received From<input value={form.receivedFrom} onChange={event => update("receivedFrom", event.target.value)} placeholder="Customer or party name" /></label>
            <label className="ew-field">Against Invoice Number<input value={form.invoiceNumber} onChange={event => update("invoiceNumber", event.target.value)} placeholder="Optional invoice number" /></label>
            <label className="ew-field">Receipt Mode<select value={form.receiptMode} onChange={event => update("receiptMode", event.target.value)}><option>Cash</option><option>Bank Transfer</option><option>NEFT</option><option>RTGS</option><option>IMPS</option><option>UPI</option><option>Cheque</option><option>Other</option></select></label>
            <label className="ew-field">Deposit Account<input value={form.depositAccount} onChange={event => update("depositAccount", event.target.value)} placeholder="Select bank or cash account" /></label>
            <label className="ew-field">Reference / UTR Number<input value={form.reference} onChange={event => update("reference", event.target.value)} placeholder="Transaction reference" /></label>
            <label className="ew-field">Amount Received (₹)<input type="number" min="0" step="0.01" value={form.amount} onChange={event => update("amount", event.target.value)} placeholder="0.00" /></label>
            <label className="ew-field ew-wide">Narration<textarea value={form.narration} onChange={event => update("narration", event.target.value)} placeholder="Enter receipt details" /></label>
          </div>
          {message && <div className="ew-alert" style={{ marginTop: 14 }}>{message}</div>}
          <div className="ew-actions"><button type="button" className="ew-primary" onClick={() => setMessage("Receipt saving will be connected after the screen design is approved.")}>Save Receipt</button></div>
        </section>
      )}
    </main>
  );
}
