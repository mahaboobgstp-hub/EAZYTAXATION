import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCompany } from "../../context/CompanyContext";
import { supabase } from "../../supabase/supabaseClient";
import "../../css/sales/SalesWorkspace.css";

const CONFIG = {
  register: {
    title: "Sales Register", table: "sales_invoices", date: "invoice_date", number: "invoice_no",
    metrics: ["Invoices", "Total sales", "Paid", "Outstanding"],
    columns: ["Invoice No.", "Date", "Customer", "Type", "Payment status", "Total", "Paid", "Balance"],
  },
  quotations: {
    title: "Quotations", table: "quotations", date: "invoice_date", number: "invoice_no",
    metrics: ["Total quotations", "Awaiting response", "Accepted"],
    columns: ["Quotation No.", "Date", "Valid until", "Customer", "Total", "Status"],
  },
  orders: {
    title: "Sales Orders", table: "sales_orders", date: "order_date", number: "order_no",
    metrics: ["Open orders", "Order value", "Pending fulfillment"],
    columns: ["Order No.", "Date", "Customer", "Expected delivery", "Total", "Fulfillment", "Status"],
  },
  challans: {
    title: "Delivery Challans", table: "delivery_challans", date: "challan_date", number: "challan_no",
    metrics: ["Ready to dispatch", "In transit", "Delivered"],
    columns: ["Challan No.", "Date", "Customer", "Sales order", "Vehicle", "Dispatch status"],
  },
  credits: {
    title: "Credit Notes", table: "credit_notes", date: "credit_note_date", number: "credit_note_no",
    metrics: ["Credits issued", "Applied", "Pending"],
    columns: ["Credit Note No.", "Date", "Customer", "Original invoice", "Reason", "Amount", "Status"],
  },
};

const currency = value => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value) || 0);
const dateText = value => value ? new Date(value + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const num = value => Number(value) || 0;
const errorText = error => error?.message || "Something went wrong. Please try again.";

export default function SalesWorkspace({ kind }) {
  const config = CONFIG[kind];
  const { currentCompanyId, currentCompany } = useCompany();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dialog, setDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), dueDate: "", customerId: "", originalInvoiceId: "", reason: "", description: "", qty: "1", rate: "0" });

  const load = async () => {
    if (!currentCompanyId) { setRows([]); setLoading(false); return; }
    setLoading(true); setMessage("");
    let query = supabase.from(config.table).select("*").eq("company_id", currentCompanyId);
    if (kind === "register" || kind === "quotations" || kind === "credits" || kind === "orders") query = query.eq("is_deleted", false);
    query = query.order(config.date, { ascending: false });
    const { data, error } = await query;
    if (error) setMessage(errorText(error)); else setRows(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [currentCompanyId, kind]);
  useEffect(() => {
    if (!currentCompanyId) return;
    supabase.from("customers").select("id, customer_name").eq("company_id", currentCompanyId).order("customer_name").then(({ data }) => setCustomers(data || []));
    if (kind === "credits") supabase.from("sales_invoices").select("id, invoice_no, customer_id, customer_name, total_amount").eq("company_id", currentCompanyId).eq("is_deleted", false).order("invoice_date", { ascending: false }).then(({ data }) => setInvoices(data || []));
  }, [currentCompanyId, kind]);

  const filtered = useMemo(() => rows.filter(row => {
    const text = [row[config.number], row.customer_name, row.reason, row.vehicle_no, row.status].join(" ").toLowerCase();
    const status = kind === "register" ? (row.sale_type === "CASH" ? "Paid" : "Outstanding") : row.status || "Draft";
    return (!search || text.includes(search.toLowerCase())) &&
      (statusFilter === "All statuses" || status.toLowerCase() === statusFilter.toLowerCase()) &&
      (!dateFrom || row[config.date] >= dateFrom) && (!dateTo || row[config.date] <= dateTo);
  }), [rows, search, statusFilter, dateFrom, dateTo, config, kind]);

  const metrics = useMemo(() => {
    if (kind === "register") {
      const paid = rows.filter(r => r.sale_type === "CASH").reduce((s, r) => s + num(r.total_amount), 0);
      const outstanding = rows.filter(r => r.sale_type !== "CASH").reduce((s, r) => s + num(r.total_amount), 0);
      return [rows.length, currency(rows.reduce((s, r) => s + num(r.total_amount), 0)), currency(paid), currency(outstanding)];
    }
    if (kind === "quotations") return [rows.length, rows.filter(r => !["accepted", "rejected", "expired"].includes((r.status || "draft").toLowerCase())).length, rows.filter(r => (r.status || "").toLowerCase() === "accepted").length];
    if (kind === "orders") return [rows.filter(r => !["fulfilled", "cancelled"].includes((r.status || "draft").toLowerCase())).length, currency(rows.reduce((s, r) => s + num(r.total_amount), 0)), rows.filter(r => !["fulfilled", "cancelled"].includes((r.status || "draft").toLowerCase())).length];
    if (kind === "challans") return [
      rows.filter(r => (r.status || "").toLowerCase().includes("ready")).length,
      rows.filter(r => (r.status || "").toLowerCase().includes("transit")).length,
      rows.filter(r => (r.status || "").toLowerCase() === "delivered").length,
    ];
    return [currency(rows.filter(r => r.status !== "Void").reduce((s, r) => s + num(r.total_amount), 0)), currency(rows.filter(r => r.status === "Applied").reduce((s, r) => s + num(r.total_amount), 0)), currency(rows.filter(r => !["Applied", "Void"].includes(r.status)).reduce((s, r) => s + num(r.total_amount), 0))];
  }, [rows, kind]);

  const openCreate = () => {
    setForm({ date: new Date().toISOString().slice(0, 10), dueDate: "", customerId: "", originalInvoiceId: "", reason: "", description: "", qty: "1", rate: "0" });
    setMessage(""); setDialog(true);
  };

  const save = async event => {
    event.preventDefault();
    if (!currentCompanyId) { setMessage("Select a company before creating a document."); return; }
    setSaving(true); setMessage("");
    try {
      const customer = customers.find(c => c.id === form.customerId);
      if (!customer) throw new Error("Select a customer.");
      const prefix = kind === "quotations" ? "QT" : kind === "orders" ? "SO" : "CN";
      const existing = await supabase.from(config.table).select("id", { count: "exact", head: true }).eq("company_id", currentCompanyId);
      if (existing.error) throw existing.error;
      const documentNo = `${prefix}-${new Date(form.date).getFullYear()}-${String((existing.count || 0) + 1).padStart(5, "0")}`;
      const qty = Math.max(0, num(form.qty));
      const rate = Math.max(0, num(form.rate));
      const amount = Math.round(qty * rate * 100) / 100;
      const common = { company_id: currentCompanyId, customer_id: customer.id, customer_name: customer.customer_name, total_amount: amount, taxable_value: amount, created_at: new Date().toISOString() };
      let table, header, itemTable, parentField, id;
      if (kind === "quotations") {
        table = "quotations"; itemTable = "quotation_items"; parentField = "invoice_id";
        header = { ...common, invoice_no: documentNo, invoice_date: form.date, valid_until: form.dueDate || null, status: "Draft" };
      } else if (kind === "orders") {
        table = "sales_orders"; itemTable = "sales_order_items"; parentField = "order_id";
        header = { ...common, order_no: documentNo, order_date: form.date, expected_delivery_date: form.dueDate || null, status: "Open", fulfillment_status: "Pending" };
      } else {
        table = "credit_notes"; itemTable = "credit_note_items"; parentField = "credit_note_id";
        header = { ...common, credit_note_no: documentNo, credit_note_date: form.date, original_invoice_id: form.originalInvoiceId || null, original_invoice_no: invoices.find(i => i.id === form.originalInvoiceId)?.invoice_no || null, reason: form.reason.trim(), status: "Issued" };
        if (!header.reason) throw new Error("Enter a reason for this credit note.");
      }
      const { data, error } = await supabase.from(table).insert(header).select("id").single();
      if (error) throw error;
      id = data.id;
      if (form.description.trim()) {
        const item = kind === "quotations" ? { [parentField]: id, line_no: 1, item_name: form.description.trim(), particulars: form.description.trim(), qty, rate, amount } :
          kind === "orders" ? { [parentField]: id, line_no: 1, item_name: form.description.trim(), description: form.description.trim(), qty, rate, amount } :
          { [parentField]: id, line_no: 1, item_name: form.description.trim(), description: form.description.trim(), qty, rate, amount };
        const { error: itemError } = await supabase.from(itemTable).insert(item);
        if (itemError) { await supabase.from(table).delete().eq("id", id); throw itemError; }
      }
      setDialog(false); await load();
    } catch (error) { setMessage(errorText(error)); }
    finally { setSaving(false); }
  };

  const updateStatus = async (row, value, field = "status") => {
    const table = config.table;
    const { error } = await supabase.from(table).update({ [field]: value }).eq("id", row.id).eq("company_id", currentCompanyId);
    if (error) setMessage(errorText(error)); else setRows(prev => prev.map(item => item.id === row.id ? { ...item, [field]: value } : item));
  };

  const view = async row => {
    const itemConfig = {
      register: ["sales_invoice_items", "invoice_id", "line_no"],
      quotations: ["quotation_items", "invoice_id", "line_no"],
      orders: ["sales_order_items", "order_id", "line_no"],
      challans: ["delivery_challan_items", "challan_id", "created_at"],
      credits: ["credit_note_items", "credit_note_id", "line_no"],
    }[kind];
    const [table, parent, orderBy] = itemConfig;
    const { data: items, error } = await supabase.from(table).select("*").eq(parent, row.id).order(orderBy);
    if (error) setMessage(errorText(error));
    setSelected({ ...row, items: items || [] });
  };

  const printInvoice = async row => {
    const { data: items } = await supabase.from("sales_invoice_items").select("*").eq("invoice_id", row.id).order("line_no");
    const rowsHtml = (items || []).map((i, n) => `<tr><td>${n + 1}</td><td>${i.item_name || i.particulars || ""}</td><td>${num(i.qty)}</td><td>${currency(i.rate)}</td><td>${currency(i.amount)}</td></tr>`).join("");
    const popup = window.open("", "_blank", "width=900,height=700");
    if (!popup) return;
    popup.document.write(`<!doctype html><html><head><title>${row.invoice_no}</title><style>body{font:14px Arial;padding:32px;color:#15243b}h1{margin:0 0 6px}table{width:100%;border-collapse:collapse;margin-top:20px}td,th{border:1px solid #dbe2ea;padding:9px;text-align:left}th{background:#eff4fa}.total{text-align:right;font-weight:bold;margin-top:18px}</style></head><body><h1>Tax Invoice</h1><p>${currentCompany?.company_name || ""}</p><hr><p>Invoice: ${row.invoice_no} &nbsp; Date: ${dateText(row.invoice_date)}</p><p>Bill To: ${row.customer_name || ""}</p><table><thead><tr><th>#</th><th>Item / Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>${rowsHtml}</tbody></table><p class="total">Grand Total: ${currency(row.total_amount)}</p></body></html>`);
    popup.document.close(); popup.focus(); popup.print();
  };

  const deleteRow = async row => {
    if (!window.confirm(`Delete ${row[config.number]}? This will remove it from this register.`)) return;
    const { error } = await supabase.from(config.table).update({ is_deleted: true }).eq("id", row.id).eq("company_id", currentCompanyId);
    if (error) setMessage(errorText(error)); else setRows(prev => prev.filter(item => item.id !== row.id));
  };

  const createAction = kind === "register" ? () => navigate("/app/sales") : kind === "challans" ? () => navigate("/app/delivery-challans/new") : openCreate;
  const actionLabel = kind === "register" ? "New Sales Invoice" : kind === "quotations" ? "New Quotation" : kind === "orders" ? "New Sales Order" : kind === "challans" ? "New Delivery Challan" : "Create Credit Note";
  const statuses = kind === "register" ? [] : kind === "quotations" ? ["Draft", "Sent", "Accepted", "Rejected", "Expired"] : kind === "orders" ? ["Open", "Confirmed", "Partially Fulfilled", "Fulfilled", "Cancelled"] : kind === "challans" ? ["Draft", "Ready to Dispatch", "In Transit", "Delivered", "Cancelled"] : ["Draft", "Issued", "Applied", "Void"];

  return <main className="sales-workspace">
    <header className="sw-heading"><div><p className="sw-breadcrumb">Billing &amp; Accounting / Sales / {config.title}</p><h1>{config.title}</h1><p className="sw-subtitle">Manage {config.title.toLowerCase()} for {currentCompany?.company_name || "your selected company"}.</p></div><button className="sw-primary" onClick={createAction}>＋ {actionLabel}</button></header>
    {message && <div className="sw-alert" role="alert">{message}<button onClick={() => setMessage("")}>×</button></div>}
    {!currentCompanyId ? <div className="sw-empty">Choose a current company from the sidebar to view its sales records.</div> : <>
    <section className={`sw-metrics sw-metrics-${metrics.length}`}>{config.metrics.map((label, i) => <article className="sw-metric" key={label}><span>{label}</span><strong>{metrics[i]}</strong></article>)}</section>
    <section className="sw-filters"><label className="sw-search"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by number or customer" /></label>
      <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option>All statuses</option>{statuses.map(s => <option key={s}>{s}</option>)}{kind === "register" && <><option>Paid</option><option>Outstanding</option></>}</select>
      <label>From <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></label><label>To <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} /></label>
      <button className="sw-reset" onClick={() => { setSearch(""); setStatusFilter("All statuses"); setDateFrom(""); setDateTo(""); }}>Reset</button>
    </section>
    <section className="sw-table-card"><div className="sw-table-top"><div><h2>{config.title}</h2><span>{filtered.length} records</span></div><button className="sw-export" onClick={() => window.print()}>Print list</button></div>
      {loading ? <div className="sw-empty">Loading records…</div> : filtered.length === 0 ? <div className="sw-empty"><strong>No records found</strong><span>Create your first {config.title.toLowerCase()} to see it here.</span><button className="sw-primary" onClick={createAction}>＋ {actionLabel}</button></div> :
      <div className="sw-table-scroll"><table><thead><tr>{config.columns.map(c => <th key={c}>{c}</th>)}<th>Actions</th></tr></thead><tbody>{filtered.map(row => {
        const status = kind === "register" ? (row.sale_type === "CASH" ? "Paid" : "Outstanding") : row.status || "Draft";
        const balance = kind === "register" ? (row.sale_type === "CASH" ? 0 : num(row.total_amount)) : null;
        return <tr key={row.id}>
          <td className="sw-docno">{row[config.number] || "—"}</td><td>{dateText(row[config.date])}</td><td>{row.customer_name || "—"}</td>
          {kind === "register" && <><td><span className="sw-type">{row.sale_type === "CASH" ? "Cash sale" : "Credit sale"}</span></td><td><span className={`sw-status ${status.toLowerCase()}`}>{status}</span></td><td className="sw-money">{currency(row.total_amount)}</td><td className="sw-money">{currency(balance === 0 ? row.total_amount : 0)}</td><td className="sw-money">{currency(balance)}</td></>}
          {kind === "quotations" && <><td>{dateText(row.valid_until)}</td><td className="sw-money">{currency(row.total_amount)}</td><td><select className="sw-status-select" value={status} onChange={e => updateStatus(row, e.target.value)}>{statuses.map(s => <option key={s}>{s}</option>)}</select></td></>}
          {kind === "orders" && <><td>{dateText(row.expected_delivery_date)}</td><td className="sw-money">{currency(row.total_amount)}</td><td><select className="sw-status-select" value={row.fulfillment_status || "Pending"} onChange={e => updateStatus(row, e.target.value, "fulfillment_status")}>{["Pending", "Partially Fulfilled", "Fulfilled", "Cancelled"].map(s => <option key={s}>{s}</option>)}</select></td><td><select className="sw-status-select" value={status} onChange={e => updateStatus(row, e.target.value)}>{statuses.map(s => <option key={s}>{s}</option>)}</select></td></>}
          {kind === "challans" && <><td>{row.sales_order_no || "—"}</td><td>{row.vehicle_no || "—"}</td><td><select className="sw-status-select" value={status} onChange={e => updateStatus(row, e.target.value)}>{statuses.map(s => <option key={s}>{s}</option>)}</select></td></>}
          {kind === "credits" && <><td>{row.original_invoice_no || "—"}</td><td>{row.reason || "—"}</td><td className="sw-money">{currency(row.total_amount)}</td><td><select className="sw-status-select" value={status} onChange={e => updateStatus(row, e.target.value)}>{statuses.map(s => <option key={s}>{s}</option>)}</select></td></>}
          <td><div className="sw-actions"><button onClick={() => view(row)}>View</button>{kind === "register" && <button onClick={() => printInvoice(row)}>Print</button>}{kind !== "register" && <button className="sw-delete" onClick={() => deleteRow(row)}>Delete</button>}</div></td>
        </tr>;
      })}</tbody></table></div>}
    </section></>}
    {dialog && <div className="sw-modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setDialog(false); }}><section className="sw-modal" role="dialog" aria-modal="true" aria-labelledby="sw-modal-title"><header><div><p className="sw-breadcrumb">Billing &amp; Accounting / Sales</p><h2 id="sw-modal-title">{actionLabel}</h2></div><button className="sw-close" onClick={() => setDialog(false)} aria-label="Close">×</button></header><form onSubmit={save}>
      <label>Company<input value={currentCompany?.company_name || ""} readOnly /></label>
      {kind === "credits" && <label>Original sales invoice<select required value={form.originalInvoiceId} onChange={e => { const invoice = invoices.find(i => i.id === e.target.value); setForm({ ...form, originalInvoiceId: e.target.value, customerId: invoice?.customer_id || form.customerId }); }}><option value="">Select invoice</option>{invoices.map(i => <option key={i.id} value={i.id}>{i.invoice_no} · {i.customer_name} · {currency(i.total_amount)}</option>)}</select></label>}
      <div className="sw-form-grid"><label>Customer<select required value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })}><option value="">Select customer</option>{customers.map(c => <option key={c.id} value={c.id}>{c.customer_name}</option>)}</select></label><label>{kind === "orders" ? "Order date" : kind === "credits" ? "Credit note date" : "Quotation date"}<input required type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></label>{kind !== "credits" && <label>{kind === "orders" ? "Expected delivery" : "Valid until"}<input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></label>}</div>
      {kind === "credits" && <label>Reason<input required value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Reason for issuing credit" /></label>}
      <div className="sw-form-grid"><label>Item / description<input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional line description" /></label><label>Quantity<input type="number" min="0" step="0.01" value={form.qty} onChange={e => setForm({ ...form, qty: e.target.value })} /></label><label>Rate (₹)<input type="number" min="0" step="0.01" value={form.rate} onChange={e => setForm({ ...form, rate: e.target.value })} /></label></div>
      <div className="sw-modal-total"><span>Document total</span><strong>{currency(num(form.qty) * num(form.rate))}</strong></div>
      <footer><button type="button" className="sw-secondary" onClick={() => setDialog(false)}>Cancel</button><button disabled={saving} className="sw-primary">{saving ? "Saving…" : `Save ${kind === "orders" ? "Sales Order" : kind === "credits" ? "Credit Note" : "Quotation"}`}</button></footer>
      <p className="sw-note">This creates a draft commercial record. It does not post accounting entries, adjust invoice balances, or change stock.</p>
    </form></section></div>}
    {selected && <div className="sw-modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setSelected(null); }}><section className="sw-modal sw-view-modal" role="dialog" aria-modal="true"><header><div><p className="sw-breadcrumb">{config.title}</p><h2>{selected[config.number] || "Record details"}</h2></div><button className="sw-close" onClick={() => setSelected(null)} aria-label="Close">×</button></header><dl className="sw-detail-grid"><div><dt>Date</dt><dd>{dateText(selected[config.date])}</dd></div><div><dt>Customer</dt><dd>{selected.customer_name || "—"}</dd></div><div><dt>Status</dt><dd>{selected.status || (selected.sale_type === "CASH" ? "Paid" : "Outstanding")}</dd></div><div><dt>Total</dt><dd>{currency(selected.total_amount)}</dd></div>{selected.reason && <div><dt>Reason</dt><dd>{selected.reason}</dd></div>}</dl>{selected.items?.length > 0 && <div className="sw-table-scroll"><table><thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>{selected.items.map((i,n)=><tr key={i.id || n}><td>{i.item_name || i.particulars}</td><td>{num(i.qty)}</td><td>{currency(i.rate)}</td><td>{currency(i.amount)}</td></tr>)}</tbody></table></div>}<footer>{kind === "register" && <button className="sw-primary" onClick={() => { const id = selected.id; setSelected(null); navigate("/app/sales", { state: { editInvoiceId: id } }); }}>Edit invoice</button>}{kind === "challans" && <button className="sw-primary" onClick={() => { const id = selected.id; setSelected(null); navigate("/app/delivery-challans/new", { state: { editChallanId: id } }); }}>Edit challan</button>}<button className="sw-secondary" onClick={() => setSelected(null)}>Close</button></footer></section></div>}
  </main>;
}
