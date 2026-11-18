import React, { useEffect, useMemo, useState } from "react";
import { useCompany } from "../../context/CompanyContext";
import { supabase } from "../../supabase/supabaseClient";
import "../../css/sales/SalesReturns.css";

const money = value => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value) || 0);
const today = () => new Date().toISOString().slice(0, 10);
const clean = value => Number(value) || 0;

const emptyForm = () => ({
  returnDate: today(), customerId: "", invoiceId: "", reason: "Quality issue",
  remarks: "", adjustment: "credit_note", lines: []
});

export default function SalesReturns() {
  const { currentCompanyId } = useCompany();
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [step, setStep] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [viewRow, setViewRow] = useState(null);

  const load = async () => {
    if (!currentCompanyId) { setRows([]); setLoading(false); return; }
    setLoading(true);
    const [returnsResult, customersResult, invoicesResult] = await Promise.all([
      supabase.from("sales_returns").select("*").eq("company_id", currentCompanyId).eq("is_deleted", false).order("return_date", { ascending: false }),
      supabase.from("customers").select("id,customer_name,state").eq("company_id", currentCompanyId).order("customer_name"),
      supabase.from("sales_invoices").select("id,invoice_no,invoice_date,customer_id,customer_name,total_amount").eq("company_id", currentCompanyId).eq("is_deleted", false).order("invoice_date", { ascending: false })
    ]);
    if (returnsResult.error) setError(returnsResult.error.message);
    setRows(returnsResult.data || []);
    setCustomers(customersResult.data || []);
    setInvoices(invoicesResult.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [currentCompanyId]);

  const filtered = useMemo(() => rows.filter(row => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || [row.return_no, row.customer_name, row.original_invoice_no, row.reason, row.status].join(" ").toLowerCase().includes(q);
    const status = String(row.status || "Draft").toLowerCase();
    return matchesSearch && (filter === "all" || status === filter);
  }), [rows, search, filter]);

  const totals = useMemo(() => {
    const taxable = form.lines.reduce((sum, line) => sum + clean(line.qty) * clean(line.rate), 0);
    const tax = form.lines.reduce((sum, line) => sum + clean(line.qty) * clean(line.rate) * clean(line.gstRate) / 100, 0);
    const intra = form.lines.length && form.lines.every(line => line.intraState);
    const cgst = intra ? tax / 2 : 0;
    const sgst = intra ? tax / 2 : 0;
    const igst = intra ? 0 : tax;
    return { taxable, cgst, sgst, igst, total: taxable + tax };
  }, [form.lines]);

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const chooseInvoice = async invoiceId => {
    const invoice = invoices.find(row => row.id === invoiceId);
    setForm(prev => ({ ...prev, invoiceId, customerId: invoice?.customer_id || prev.customerId, lines: [] }));
    if (!invoiceId) return;
    const { data, error: itemError } = await supabase.from("sales_invoice_items")
      .select("id,item_id,item_name,particulars,hsn_sac,unit,qty,rate,gst_rate,amount")
      .eq("invoice_id", invoiceId).order("line_no", { ascending: true });
    if (itemError) { setError(itemError.message); return; }
    const { data: previous, error: previousError } = await supabase.from("sales_return_items")
      .select("item_id,item_name,qty").eq("original_invoice_id", invoiceId);
    if (previousError) { setError(previousError.message); return; }
    const lines = (data || []).map(item => {
      const key = item.item_id || item.item_name || item.particulars;
      const returned = (previous || []).filter(p => (p.item_id || p.item_name) === key).reduce((sum, p) => sum + clean(p.qty), 0);
      const originalQty = clean(item.qty);
      return {
        originalInvoiceItemId: item.id, itemId: item.item_id || "", itemName: item.item_name || item.particulars || "",
        hsn: item.hsn_sac || "", unit: item.unit || "", originalQty, previouslyReturned: returned,
        maxQty: Math.max(0, originalQty - returned), qty: "0", acceptedQty: "0", rate: String(originalQty ? clean(item.amount) / originalQty : clean(item.rate)),
        gstRate: String(clean(item.gst_rate)), reason: "Quality issue", disposition: "usable"
      };
    });
    setForm(prev => ({ ...prev, invoiceId, customerId: invoice?.customer_id || prev.customerId, lines }));
  };

  const changeLine = (index, patch) => setForm(prev => ({
    ...prev, lines: prev.lines.map((line, i) => i === index ? { ...line, ...patch } : line)
  }));

  const openNew = () => { setError(""); setForm(emptyForm()); setStep(1); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setForm(emptyForm()); setStep(1); };

  const save = async () => {
    if (!currentCompanyId) { setError("Select a company before creating a sales return."); return; }
    const customer = customers.find(row => row.id === form.customerId);
    const invoice = invoices.find(row => row.id === form.invoiceId);
    const validLines = form.lines.filter(line => clean(line.qty) > 0);
    if (!customer || !invoice || !validLines.length) { setError("Select the original invoice and enter at least one return quantity."); return; }
    if (validLines.some(line => clean(line.qty) > line.maxQty || clean(line.acceptedQty) > clean(line.qty))) {
      setError("Return quantity cannot exceed the remaining invoiced quantity. Accepted quantity cannot exceed returned quantity."); return;
    }
    setSaving(true); setError("");
    try {
      const { count, error: countError } = await supabase.from("sales_returns").select("id", { count: "exact", head: true }).eq("company_id", currentCompanyId);
      if (countError) throw countError;
      const returnNo = `SR-${new Date(form.returnDate).getFullYear()}-${String((count || 0) + 1).padStart(5, "0")}`;
      const taxable = validLines.reduce((sum, line) => sum + clean(line.qty) * clean(line.rate), 0);
      const tax = validLines.reduce((sum, line) => sum + clean(line.qty) * clean(line.rate) * clean(line.gstRate) / 100, 0);
      const intra = Boolean(customer.state && validLines.length && validLines.every(line => line.intraState));
      const header = {
        company_id: currentCompanyId, return_no: returnNo, return_date: form.returnDate,
        customer_id: customer.id, customer_name: customer.customer_name,
        original_invoice_id: invoice.id, original_invoice_no: invoice.invoice_no,
        reason: form.reason, remarks: form.remarks || null, taxable_value: taxable,
        cgst: intra ? tax / 2 : 0, sgst: intra ? tax / 2 : 0, igst: intra ? 0 : tax,
        total_amount: taxable + tax, adjustment_type: form.adjustment,
        status: "Recorded"
      };
      const { data: headerRow, error: headerError } = await supabase.from("sales_returns").insert(header).select("id").single();
      if (headerError) throw headerError;
      const itemRows = validLines.map((line, index) => ({
        sales_return_id: headerRow.id, original_invoice_id: invoice.id,
        original_invoice_item_id: line.originalInvoiceItemId || null, line_no: index + 1,
        item_id: line.itemId || null, item_name: line.itemName, hsn_sac: line.hsn || null, unit: line.unit || null,
        original_qty: line.originalQty, previously_returned_qty: line.previouslyReturned,
        qty: clean(line.qty), accepted_qty: clean(line.acceptedQty),
        rejected_qty: Math.max(0, clean(line.qty) - clean(line.acceptedQty)),
        rate: clean(line.rate), gst_rate: clean(line.gstRate),
        taxable_amount: clean(line.qty) * clean(line.rate),
        tax_amount: clean(line.qty) * clean(line.rate) * clean(line.gstRate) / 100,
        reason: line.reason, disposition: line.disposition
      }));
      const { error: itemsError } = await supabase.from("sales_return_items").insert(itemRows);
      if (itemsError) {
        await supabase.from("sales_returns").delete().eq("id", headerRow.id).eq("company_id", currentCompanyId);
        throw itemsError;
      }
      closeForm();
      await load();
    } catch (e) { setError(e.message || "Unable to save sales return."); }
    finally { setSaving(false); }
  };

  const selectedInvoice = invoices.find(row => row.id === form.invoiceId);

  return <main className="sales-returns">
    <header className="sr-heading">
      <div><p className="sr-breadcrumb">Billing &amp; Accounting / Sales</p><h1>Sales Returns</h1><p>Record customer returns and review returned quantities.</p></div>
      <button className="sr-primary" onClick={openNew}>＋ New Sales Return</button>
    </header>
    {error && <div className="sr-alert" role="alert">{error}<button onClick={() => setError("")}>×</button></div>}
    <section className="sr-summary"><div><span>Total returns</span><strong>{rows.length}</strong></div><div><span>Return value</span><strong>{money(rows.reduce((s,r)=>s+clean(r.total_amount),0))}</strong></div><div><span>Recorded</span><strong>{rows.filter(r=>r.status==="Recorded").length}</strong></div></section>
    <section className="sr-toolbar">
      <label className="sr-search"><span>⌕</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search return no., customer or invoice"/></label>
      <select aria-label="Universal filter" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All records</option><option value="recorded">Recorded</option><option value="draft">Draft</option><option value="void">Void</option></select>
    </section>
    <section className="sr-list">
      <div className="sr-list-head"><h2>Sales Return Register</h2><span>{filtered.length} records</span></div>
      {loading ? <div className="sr-empty">Loading sales returns…</div> : !filtered.length ? <div className="sr-empty"><strong>No sales returns found</strong><span>Create a sales return to record goods received back from customers.</span></div> :
        <div className="sr-cards">{filtered.map(row=><article className="sr-card" key={row.id}>
          <div className="sr-card-top"><div><strong>{row.return_no}</strong><span>{row.customer_name || "—"}</span></div><b>{money(row.total_amount)}</b></div>
          <div className="sr-card-meta"><span>{row.original_invoice_no || "No invoice reference"}</span><span>{row.return_date}</span><span className="sr-status">{row.status || "Recorded"}</span></div>
          <button className="sr-view" onClick={()=>setViewRow(row)}>View details</button>
        </article>)}</div>}
    </section>

    {showForm && <div className="sr-backdrop"><section className="sr-modal" role="dialog" aria-modal="true" aria-labelledby="sr-modal-title">
      <header><div><p className="sr-breadcrumb">Sales / Customer Returns</p><h2 id="sr-modal-title">New Sales Return</h2></div><button className="sr-close" onClick={closeForm}>×</button></header>
      <nav className="sr-stepper">{["Basic details","Items & quantity","Tax & value","Review & save"].map((label,i)=><div key={label} className={step===i+1?"active":step>i+1?"complete":""}><b>{i+1}</b><span>{label}</span></div>)}</nav>
      {step===1 && <div className="sr-fields">
        <label>Return date<input type="date" value={form.returnDate} onChange={e=>update("returnDate",e.target.value)}/></label>
        <label>Customer<select value={form.customerId} onChange={e=>update("customerId",e.target.value)}><option value="">Select customer</option>{customers.map(c=><option key={c.id} value={c.id}>{c.customer_name}</option>)}</select></label>
        <label className="sr-wide">Original sales invoice<select value={form.invoiceId} onChange={e=>chooseInvoice(e.target.value)}><option value="">Select original invoice</option>{invoices.filter(i=>!form.customerId||i.customer_id===form.customerId).map(i=><option key={i.id} value={i.id}>{i.invoice_no} · {i.customer_name} · {money(i.total_amount)}</option>)}</select></label>
        <label>Return reason<select value={form.reason} onChange={e=>update("reason",e.target.value)}>{["Quality issue","Damaged goods","Wrong item supplied","Excess quantity","Other"].map(x=><option key={x}>{x}</option>)}</select></label>
        <label>Reference / remarks<input value={form.remarks} onChange={e=>update("remarks",e.target.value)} placeholder="Optional note"/></label>
      </div>}
      {step===2 && <div className="sr-items">
        <div className="sr-invoice-ref"><strong>{selectedInvoice?.invoice_no || "Original invoice not selected"}</strong><span>{selectedInvoice?.customer_name || ""} · {selectedInvoice?.invoice_date || ""}</span></div>
        {!form.lines.length ? <p className="sr-empty">Choose an original invoice to load its items.</p> : form.lines.map((line,index)=><article className="sr-item" key={line.originalInvoiceItemId || index}>
          <div className="sr-item-title"><strong>{line.itemName}</strong><span>{line.hsn ? "HSN "+line.hsn+" · " : ""}{line.unit}</span></div>
          <div className="sr-qty-grid"><label>Invoiced<input readOnly value={line.originalQty}/></label><label>Previously returned<input readOnly value={line.previouslyReturned}/></label><label>Return qty<input type="number" min="0" max={line.maxQty} step="0.001" value={line.qty} onChange={e=>changeLine(index,{qty:e.target.value,acceptedQty:String(Math.min(clean(e.target.value),clean(line.acceptedQty)))})}/></label></div>
          <div className="sr-qty-grid"><label>Accepted qty<input type="number" min="0" max={line.qty} step="0.001" value={line.acceptedQty} onChange={e=>changeLine(index,{acceptedQty:e.target.value})}/></label><label>Stock disposition<select value={line.disposition} onChange={e=>changeLine(index,{disposition:e.target.value})}><option value="usable">Usable stock</option><option value="inspection">Inspection</option><option value="damaged">Damaged / scrap</option></select></label><label>Reason<select value={line.reason} onChange={e=>changeLine(index,{reason:e.target.value})}>{["Quality issue","Damaged goods","Wrong item supplied","Excess quantity","Other"].map(x=><option key={x}>{x}</option>)}</select></label></div>
          <small>Returnable: {line.maxQty} {line.unit} · Rate: {money(line.rate)}</small>
        </article>)}
      </div>}
      {step===3 && <div className="sr-tax">
        <div className="sr-total"><span>Taxable value</span><strong>{money(totals.taxable)}</strong></div>
        <div className="sr-total"><span>CGST</span><strong>{money(totals.cgst)}</strong></div><div className="sr-total"><span>SGST</span><strong>{money(totals.sgst)}</strong></div><div className="sr-total"><span>IGST</span><strong>{money(totals.igst)}</strong></div>
        <div className="sr-grand"><span>Return total</span><strong>{money(totals.total)}</strong></div>
        <label>Financial adjustment<select value={form.adjustment} onChange={e=>update("adjustment",e.target.value)}><option value="credit_note">Credit note to be issued separately</option><option value="account_only">Customer account adjustment only</option><option value="inventory_only">Physical return record only</option></select></label>
        <p>Saving this record does not automatically issue a GST credit note or post ledger entries.</p>
      </div>}
      {step===4 && <div className="sr-review">
        <div><span>Return number</span><strong>Generated when saved</strong></div><div><span>Customer</span><strong>{customers.find(c=>c.id===form.customerId)?.customer_name || "—"}</strong></div>
        <div><span>Original invoice</span><strong>{selectedInvoice?.invoice_no || "—"}</strong></div><div><span>Return date</span><strong>{form.returnDate}</strong></div>
        <div><span>Items returned</span><strong>{form.lines.filter(l=>clean(l.qty)>0).length}</strong></div><div><span>Return total</span><strong>{money(totals.total)}</strong></div>
        <p>Inventory and accounting posting are not performed by this UI record. Returned quantities and stock disposition are saved for the subsequent posting workflow.</p>
      </div>}
      <footer className="sr-actions"><button className="sr-secondary" onClick={()=>step===1?closeForm():setStep(s=>s-1)}>{step===1?"Cancel":"Back"}</button>{step<4?<button className="sr-primary" onClick={()=>{if(step===1&&(!form.customerId||!form.invoiceId)){setError("Select a customer and original invoice.");return;}if(step===2&&!form.lines.some(l=>clean(l.qty)>0)){setError("Enter at least one return quantity.");return;}setError("");setStep(s=>s+1);}}>Next</button>:<button className="sr-primary" disabled={saving} onClick={save}>{saving?"Saving…":"Save Sales Return"}</button>}</footer>
    </section></div>}
    {viewRow && <div className="sr-backdrop"><section className="sr-modal sr-view-modal" role="dialog" aria-modal="true"><header><div><p className="sr-breadcrumb">Sales Return</p><h2>{viewRow.return_no}</h2></div><button className="sr-close" onClick={()=>setViewRow(null)}>×</button></header><div className="sr-review"><div><span>Customer</span><strong>{viewRow.customer_name}</strong></div><div><span>Original invoice</span><strong>{viewRow.original_invoice_no}</strong></div><div><span>Date</span><strong>{viewRow.return_date}</strong></div><div><span>Return total</span><strong>{money(viewRow.total_amount)}</strong></div><div><span>Reason</span><strong>{viewRow.reason}</strong></div><div><span>Adjustment</span><strong>{viewRow.adjustment_type}</strong></div></div><footer className="sr-actions"><button className="sr-secondary" onClick={()=>setViewRow(null)}>Close</button></footer></section></div>}
  </main>;
}
