import React, { useEffect, useMemo, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { useNavigate } from "react-router-dom";
import { useCompany } from "../../context/CompanyContext";
import { supabase } from "../../supabase/supabaseClient";
import PurchaseDocumentPreview from "./PurchaseDocumentPreview";
import { downloadPurchasePdf } from "../../utils/purchaseDocumentPdf";
import "./PurchaseWorkspace.css";

const CONFIG = {
  register: { title: "Purchase Register", table: "purchase_invoices", date: "invoice_date", number: "invoice_no", prefix: "PI", child: "purchase_invoice_items", parent: "invoice_id", metrics: ["Purchase Invoices", "Total Purchases", "Input Tax Credit (ITC)", "Outstanding"] },
  orders: { title: "Purchase Orders", table: "purchase_orders", date: "order_date", number: "order_no", prefix: "PO", child: "purchase_order_items", parent: "order_id", metrics: ["Open Orders", "Order Value", "Pending Receipt"] },
  returns: { title: "Purchase Returns", table: "purchase_returns", date: "return_date", number: "return_no", prefix: "PRN", child: "purchase_return_items", parent: "return_id", metrics: ["Returns Value", "Awaiting Supplier Credit", "Completed Returns"] },
  debits: { title: "Debit Notes", table: "debit_notes", date: "debit_note_date", number: "debit_note_no", prefix: "DN", child: "debit_note_items", parent: "debit_note_id", metrics: ["Debit Notes Issued", "Supplier Credits Received", "Pending Settlement"] },
};
const STATUS_OPTIONS = {
  orders: ["Draft", "Sent", "Partially Received", "Completed", "Cancelled"],
  returns: ["Draft", "Submitted", "Supplier Credit Received", "Rejected"],
  debits: ["Draft", "Issued", "Settled", "Void"],
};
const num = v => Number(v) || 0;
const money = v => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(num(v));
const dateText = v => v ? new Date(v + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const today = () => new Date().toISOString().slice(0, 10);
const blankLine = () => ({ item_id: "", item_name: "", hsn_sac: "", uom: "", qty: "1", rate: "0", gst_rate: "18" });

export default function PurchaseWorkspace({ kind }) {
  const config = CONFIG[kind];
  const isAndroid=Capacitor.isNativePlatform()&&Capacitor.getPlatform()==="android";
  const { currentCompany, currentCompanyId } = useCompany();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [itemsMaster, setItemsMaster] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [vendorFilter, setVendorFilter] = useState("All Suppliers");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [menuId, setMenuId] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dialog, setDialog] = useState(false);
  const [dialogStep,setDialogStep]=useState(1);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ date: today(), dueDate: "", vendorId: "", originalInvoiceId: "", reason: "", status: "Draft", remarks: "" });
  const [lines, setLines] = useState([blankLine()]);

  const load = async () => {
    if (!currentCompanyId) { setRows([]); setLoading(false); return; }
    setLoading(true); setMessage("");
    let q = supabase.from(config.table).select("*").eq("company_id", currentCompanyId).eq("is_deleted", false).order(config.date, { ascending: false });
    const { data, error } = await q;
    if (error) setMessage(error.message); else {
      let records = data || [];
      if (kind === "orders" && records.length) {
        const { data: childRows } = await supabase.from(config.child).select("order_id").in("order_id", records.map(r => r.id));
        const counts = (childRows || []).reduce((out, item) => ({ ...out, [item.order_id]: (out[item.order_id] || 0) + 1 }), {});
        records = records.map(record => ({ ...record, item_count: counts[record.id] || 0 }));
      }
      setRows(records);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [kind, currentCompanyId]);
  useEffect(() => {
    if (!currentCompanyId) return;
    Promise.all([
      supabase.from("vendors").select("id,vendor_name,gstin,state,address,company_id").eq("company_id", currentCompanyId).order("vendor_name"),
      supabase.from("items").select("id,item_name,item_code,hsn_sac,uom,unit,gst_rate,purchase_rate,company_id").eq("company_id", currentCompanyId).order("item_name"),
    ]).then(([v, i]) => { setVendors(v.data || []); setItemsMaster(i.data || []); });
    if (kind === "returns" || kind === "debits") {
      supabase.from("purchase_invoices").select("id,invoice_no,supplier_invoice_no,vendor_id,grand_total").eq("company_id", currentCompanyId).eq("is_deleted", false).order("invoice_date", { ascending: false }).then(({ data }) => setInvoices(data || []));
    }
  }, [kind, currentCompanyId]);

  useEffect(() => {
    if (!preview?.autoPrint) return;
    const t = setTimeout(() => window.print(), 450);
    return () => clearTimeout(t);
  }, [preview]);

  const filtered = useMemo(() => rows.filter(row => {
    const vendor = vendors.find(v => v.id === row.vendor_id);
    const vendorName = row.vendor_name || vendor?.vendor_name || "";
    const status = kind === "register" ? row.payment_status || "Unpaid" : row.status || "Draft";
    const searchable = [row[config.number], row.supplier_invoice_no, row.original_purchase_invoice_no, vendorName, row.reason].join(" ").toLowerCase();
    return (!search || searchable.includes(search.toLowerCase()))
      && (vendorFilter === "All Suppliers" || row.vendor_id === vendorFilter)
      && (statusFilter === "All Statuses" || status.toLowerCase() === statusFilter.toLowerCase())
      && (!dateFrom || row[config.date] >= dateFrom) && (!dateTo || row[config.date] <= dateTo);
  }), [rows, vendors, search, vendorFilter, statusFilter, dateFrom, dateTo, config, kind]);

  const metrics = useMemo(() => {
    if (kind === "register") {
      return [
        rows.length,
        money(rows.reduce((s, r) => s + num(r.grand_total), 0)),
        money(rows.reduce((s, r) => s + num(r.cgst) + num(r.sgst) + num(r.igst), 0)),
        money(rows.reduce((s, r) => s + Math.max(0, num(r.grand_total) - num(r.paid_amount)), 0)),
      ];
    }
    if (kind === "orders") return [
      rows.filter(r => !["completed", "cancelled"].includes((r.status || "").toLowerCase())).length,
      money(rows.reduce((s, r) => s + num(r.total_amount), 0)),
      rows.reduce((s, r) => s + Math.max(0, num(r.ordered_qty) - num(r.received_qty)), 0).toLocaleString("en-IN") + " Units",
    ];
    if (kind === "returns") return [
      money(rows.reduce((s, r) => s + num(r.total_credit), 0)),
      money(rows.filter(r => !["supplier credit received", "rejected"].includes((r.status || "").toLowerCase())).reduce((s, r) => s + num(r.total_credit), 0)),
      money(rows.filter(r => (r.status || "").toLowerCase() === "supplier credit received").reduce((s, r) => s + num(r.total_credit), 0)),
    ];
    return [
      rows.length,
      money(rows.filter(r => r.status === "Settled").reduce((s, r) => s + num(r.total_amount), 0)),
      money(rows.filter(r => !["Settled", "Void"].includes(r.status)).reduce((s, r) => s + num(r.total_amount), 0)),
    ];
  }, [rows, kind]);

  const getItems = async row => {
    const { data, error } = await supabase.from(config.child).select("*").eq(config.parent, row.id).order("line_no");
    if (error) throw error;
    return data || [];
  };

  const openCreate = () => {
    setEditing(null); setMessage("");
    setForm({ date: today(), dueDate: "", vendorId: "", originalInvoiceId: "", reason: "", status: kind === "debits" ? "Issued" : "Draft", remarks: "" });
    setLines([blankLine()]); setDialogStep(1); setDialog(true);
  };

  const openEdit = async row => {
    if (kind === "register") {
      navigate("/app/purchases", { state: { editPurchaseInvoiceId: row.id } });
      return;
    }
    try {
      const detailLines = await getItems(row);
      setEditing(row);
      setForm({
        date: row[config.date] || today(),
        dueDate: row.expected_delivery_date || "",
        vendorId: row.vendor_id || "",
        originalInvoiceId: row.original_purchase_invoice_id || "",
        reason: row.reason || "",
        status: row.status || "Draft",
        remarks: row.remarks || "",
      });
      setLines(detailLines.length ? detailLines.map(item => ({
        item_id: item.item_id || "", item_name: item.item_name || "", hsn_sac: item.hsn_sac || "", uom: item.uom || "",
        qty: String(item.qty ?? 1), rate: String(item.rate ?? 0), gst_rate: String(item.gst_rate ?? 0),
      })) : [blankLine()]);
      setDialogStep(1); setDialog(true); setMenuId(null);
    } catch (error) { setMessage(error.message); }
  };

  const openPreview = async (row, autoPrint = false) => {
    try {
      const lineItems = await getItems(row);
      const vendor = vendors.find(v => v.id === row.vendor_id) || {};
      setPreview({ kind, document: { ...row, vendor_name: row.vendor_name || vendor.vendor_name, gstin: row.gstin || vendor.gstin, vendor_state: row.vendor_state || vendor.state }, items: lineItems, company: currentCompany, autoPrint });
      setMenuId(null);
    } catch (error) { setMessage(error.message); }
  };

  const onAction = async (row, action) => {
    setMenuId(null);
    if (action === "Edit") return openEdit(row);
    if (action === "View") return openPreview(row);
    if (action === "Print") return openPreview(row, true);
    if (action === "Download") {
      try {
        const lineItems = await getItems(row);
        const vendor = vendors.find(v => v.id === row.vendor_id) || {};
        downloadPurchasePdf({ kind, document: { ...row, vendor_name: row.vendor_name || vendor.vendor_name, gstin: row.gstin || vendor.gstin, vendor_state: row.vendor_state || vendor.state }, items: lineItems, company: currentCompany });
      } catch (error) { setMessage(error.message); }
    }
  };

  const calculate = () => {
    let taxable = 0, cgst = 0, sgst = 0, igst = 0, orderedQty = 0;
    const sameState = Boolean(currentCompany?.state && vendors.find(v => v.id === form.vendorId)?.state
      && currentCompany.state.toLowerCase() === vendors.find(v => v.id === form.vendorId).state.toLowerCase());
    const normalized = lines.filter(line => line.item_name.trim()).map(line => {
      const qty = Math.max(0, num(line.qty)), rate = Math.max(0, num(line.rate)), gst = Math.max(0, num(line.gst_rate));
      const base = Math.round(qty * rate * 100) / 100;
      const tax = Math.round(base * gst) / 100;
      const c = sameState ? Math.round(tax / 2 * 100) / 100 : 0;
      const s = sameState ? Math.round((tax - c) * 100) / 100 : 0;
      const ig = sameState ? 0 : tax;
      taxable += base; cgst += c; sgst += s; igst += ig; orderedQty += qty;
      return { ...line, qty, rate, gst_rate: gst, taxable_value: base, cgst_amount: c, sgst_amount: s, igst_amount: ig, line_total: base + c + s + ig };
    });
    const raw = taxable + cgst + sgst + igst;
    const roundOff = Math.round(raw) - raw;
    return { normalized, taxable, cgst, sgst, igst, roundOff, total: Math.round(raw), orderedQty };
  };

  const save = async event => {
    event.preventDefault();
    if (!currentCompanyId) { setMessage("Select a current company first."); return; }
    const vendor = vendors.find(v => v.id === form.vendorId);
    if (!vendor) { setMessage("Select a supplier."); return; }
    if ((kind === "returns" || kind === "debits") && !form.originalInvoiceId) { setMessage("Select the original purchase invoice."); return; }
    if ((kind === "returns" || kind === "debits") && !form.reason.trim()) { setMessage("Enter a reason for this document."); return; }
    const totals = calculate();
    if (!totals.normalized.length) { setMessage("Add at least one item."); return; }
    setSaving(true); setMessage("");
    try {
      const prefix = config.prefix;
      let number;
      if (editing) number = editing[config.number];
      else {
        const { count, error: countError } = await supabase.from(config.table).select("id", { count: "exact", head: true }).eq("company_id", currentCompanyId);
        if (countError) throw countError;
        number = `${prefix}-${new Date(form.date).getFullYear()}-${String((count || 0) + 1).padStart(5, "0")}`;
      }
      const original = invoices.find(i => i.id === form.originalInvoiceId);
      const base = {
        company_id: currentCompanyId, vendor_id: vendor.id, vendor_name: vendor.vendor_name,
        taxable_value: totals.taxable, cgst: totals.cgst, sgst: totals.sgst, igst: totals.igst,
        remarks: form.remarks,
        status: form.status,
        updated_at: new Date().toISOString(),
      };
      let header, parentId;
      if (kind === "orders") {
        header = { ...base, order_no: number, order_date: form.date, expected_delivery_date: form.dueDate || null, total_amount: totals.total, ordered_qty: totals.orderedQty, item_count: totals.normalized.length };
      } else if (kind === "returns") {
        header = { ...base, return_no: number, return_date: form.date, original_purchase_invoice_id: original.id, original_purchase_invoice_no: original.supplier_invoice_no || original.invoice_no, reason: form.reason.trim(), total_credit: totals.total };
      } else {
        header = { ...base, debit_note_no: number, debit_note_date: form.date, original_purchase_invoice_id: original.id, original_purchase_invoice_no: original.supplier_invoice_no || original.invoice_no, reason: form.reason.trim(), total_amount: totals.total };
      }
      if (editing) {
        const { error } = await supabase.from(config.table).update(header).eq("id", editing.id).eq("company_id", currentCompanyId);
        if (error) throw error;
        parentId = editing.id;
        const { error: delError } = await supabase.from(config.child).delete().eq(config.parent, parentId);
        if (delError) throw delError;
      } else {
        const { data, error } = await supabase.from(config.table).insert(header).select("id").single();
        if (error) throw error;
        parentId = data.id;
      }
      const childRows = totals.normalized.map((line, index) => ({
        [config.parent]: parentId, line_no: index + 1, item_id: line.item_id || null, item_name: line.item_name,
        hsn_sac: line.hsn_sac || "", uom: line.uom || "", qty: line.qty, rate: line.rate, taxable_value: line.taxable_value,
        gst_rate: line.gst_rate, cgst_amount: line.cgst_amount, sgst_amount: line.sgst_amount, igst_amount: line.igst_amount, line_total: line.line_total
      }));
      const { error: itemError } = await supabase.from(config.child).insert(childRows);
      if (itemError) throw itemError;
      setDialog(false); setEditing(null); await load();
    } catch (error) { setMessage(error.message || "Unable to save document."); }
    finally { setSaving(false); }
  };

  const chooseItem = (index, itemId) => {
    const master = itemsMaster.find(item => item.id === itemId);
    setLines(prev => prev.map((line, i) => i === index ? {
      ...line, item_id: master?.id || "", item_name: master?.item_name || "",
      hsn_sac: master?.hsn_sac || "", uom: master?.uom || master?.unit || "",
      rate: String(master?.purchase_rate || 0), gst_rate: String(master?.gst_rate ?? 18),
    } : line));
  };

  const createAction = () => kind === "register" ? navigate("/app/purchases") : openCreate();
  const nextDialogStep=()=>{if(dialogStep===1&&!form.vendorId){setMessage("Select a supplier to continue.");return;}if(dialogStep===2&&(kind!=="orders"&&(!form.originalInvoiceId||!form.reason.trim()))){setMessage("Select the original invoice and enter a reason.");return;}if(dialogStep===3&&!calculate().normalized.length){setMessage("Add at least one item to continue.");return;}setMessage("");setDialogStep(s=>Math.min(4,s+1));};
  const actionLabel = kind === "register" ? "Add Purchase Invoice" : kind === "orders" ? "Create Purchase Order" : kind === "returns" ? "Create Purchase Return" : "Create Debit Note";
  const invoiceStatuses = ["Paid", "Partially Paid", "Unpaid"];
  const statuses = kind === "register" ? invoiceStatuses : STATUS_OPTIONS[kind];
  const totals = calculate();
  const vendorName = row => row.vendor_name || vendors.find(v => v.id === row.vendor_id)?.vendor_name || "—";
  const gstTotal = row => num(row.cgst) + num(row.sgst) + num(row.igst);
  const invoiceStatus = row => {
    const balance = Math.max(0, num(row.grand_total) - num(row.paid_amount));
    return balance === 0 && num(row.grand_total) > 0 ? "Paid" : num(row.paid_amount) > 0 ? "Partially Paid" : row.payment_status || "Unpaid";
  };

  return <main className="purchase-workspace">
    <header className="pw-heading"><div><p className="pw-breadcrumb">Billing &amp; Accounting / Purchases / {config.title}</p><h1>{config.title}</h1>{kind === "orders" && <p className="pw-subtitle">Create, track and manage purchase orders with suppliers.</p>}</div><button className="pw-primary" onClick={createAction}>＋ {actionLabel}</button></header>
    {message && <div className="pw-alert" role="alert">{message}<button onClick={() => setMessage("")}>×</button></div>}
    {!currentCompanyId ? <div className="pw-empty">Choose a current company from the sidebar to view purchase records.</div> : <>
    <section className={`pw-metrics pw-metrics-${metrics.length}`}>{config.metrics.map((title, i) => <article className={`pw-metric pw-tone-${i}`} key={title}><span>{title}</span><strong>{metrics[i]}</strong></article>)}</section>
    <section className="pw-filters">
      <label className="pw-search"><span>⌕</span><input placeholder={kind === "register" ? "Search by Purchase No. / Supplier Inv. No." : `Search by ${config.title.toLowerCase()} or supplier...`} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></label>
      <label>Supplier<select value={vendorFilter} onChange={e => setVendorFilter(e.target.value)}><option>All Suppliers</option>{vendors.map(v => <option key={v.id} value={v.id}>{v.vendor_name}</option>)}</select></label>
      <label>Status<select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option>All Statuses</option>{statuses.map(s => <option key={s}>{s}</option>)}</select></label>
      <label>Date from<input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></label><label>Date to<input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} /></label>
      <button className="pw-apply" onClick={() => setPage(1)}>Apply</button><button className="pw-reset" onClick={() => { setSearch(""); setVendorFilter("All Suppliers"); setStatusFilter("All Statuses"); setDateFrom(""); setDateTo(""); setPage(1); }}>Reset</button>
    </section>
    <section className="pw-table-card"><div className="pw-table-heading"><h2>{config.title}</h2><span>{filtered.length} records</span></div>
      {loading ? <div className="pw-empty">Loading records…</div> : !filtered.length ? <div className="pw-empty"><strong>No records yet</strong><span>Create a purchase document to see it here.</span><button className="pw-primary" onClick={createAction}>＋ {actionLabel}</button></div> :
      <div className="pw-table-scroll"><table><thead><tr>
        {kind === "register" && ["Purchase No.", "Supplier Invoice No.", "Date", "Supplier", "GSTIN", "Taxable Value", "GST", "Total Amount", "Status", "Actions"].map(x => <th key={x}>{x}</th>)}
        {kind === "orders" && ["PO No.", "Order Date", "Supplier", "Expected Delivery", "Items", "Order Total", "Received", "Status", "Actions"].map(x => <th key={x}>{x}</th>)}
        {kind === "returns" && ["Return No.", "Date", "Supplier", "Original Purchase Invoice", "Return Reason", "Taxable Value", "GST", "Total Credit", "Status", "Actions"].map(x => <th key={x}>{x}</th>)}
        {kind === "debits" && ["Debit Note No.", "Date", "Supplier", "Original Purchase Invoice", "Reason", "Taxable Value", "GST", "Debit Amount", "Status", "Actions"].map(x => <th key={x}>{x}</th>)}
      </tr></thead><tbody>{filtered.slice((page-1)*8,page*8).map(row => {
        const rowStatus = kind === "register" ? invoiceStatus(row) : row.status || "Draft";
        const balance = Math.max(0, num(row.grand_total) - num(row.paid_amount));
        const itemCount = num(row.item_count);
        const receipt = num(row.ordered_qty) ? Math.min(100, Math.round(num(row.received_qty) / num(row.ordered_qty) * 100)) : 0;
        return <tr key={row.id}>
          {kind === "register" && <><td className="pw-docno">{row.invoice_no}</td><td>{row.supplier_invoice_no || "—"}</td><td>{dateText(row.invoice_date)}</td><td>{vendorName(row)}</td><td>{row.gstin || "—"}</td><td className="pw-money">{money(row.taxable)}</td><td className="pw-money">{money(gstTotal(row))}</td><td className="pw-money"><strong>{money(row.grand_total)}</strong></td><td><span className={`pw-status ${rowStatus.toLowerCase().replaceAll(" ","-")}`}>{rowStatus}</span></td></>}
          {kind === "orders" && <><td className="pw-docno">{row.order_no}</td><td>{dateText(row.order_date)}</td><td>{vendorName(row)}</td><td>{dateText(row.expected_delivery_date)}</td><td>{row.item_count || "—"}</td><td className="pw-money">{money(row.total_amount)}</td><td><div className="pw-progress"><span>{num(row.received_qty)} / {num(row.ordered_qty)} Units</span><i><b style={{ width: `${receipt}%` }} /></i></div></td><td><span className={`pw-status ${(row.status||"Draft").toLowerCase().replaceAll(" ","-")}`}>{row.status || "Draft"}</span></td></>}
          {kind === "returns" && <><td className="pw-docno">{row.return_no}</td><td>{dateText(row.return_date)}</td><td>{vendorName(row)}</td><td>{row.original_purchase_invoice_no || "—"}</td><td>{row.reason || "—"}</td><td className="pw-money">{money(row.taxable_value)}</td><td className="pw-money">{money(gstTotal(row))}</td><td className="pw-money"><strong>{money(row.total_credit)}</strong></td><td><span className={`pw-status ${(row.status||"Draft").toLowerCase().replaceAll(" ","-")}`}>{row.status || "Draft"}</span></td></>}
          {kind === "debits" && <><td className="pw-docno">{row.debit_note_no}</td><td>{dateText(row.debit_note_date)}</td><td>{vendorName(row)}</td><td>{row.original_purchase_invoice_no || "—"}</td><td>{row.reason || "—"}</td><td className="pw-money">{money(row.taxable_value)}</td><td className="pw-money">{money(gstTotal(row))}</td><td className="pw-money"><strong>{money(row.total_amount)}</strong></td><td><span className={`pw-status ${(row.status||"Draft").toLowerCase().replaceAll(" ","-")}`}>{row.status || "Draft"}</span></td></>}
          <td><div className="pw-menu-wrap"><button className="pw-kebab" aria-label={`Actions for ${row[config.number]}`} aria-expanded={menuId === row.id} onClick={() => setMenuId(menuId === row.id ? null : row.id)}>⋮</button>{menuId === row.id && <div className="pw-menu">{["View","Edit","Print","Download"].map(action => <button key={action} onClick={() => onAction(row, action)}>{action}</button>)}</div>}</div></td>
        </tr>;
      })}</tbody></table></div>}
      {!!filtered.length && <footer className="pw-table-footer"><span>Showing {Math.min(filtered.length,(page-1)*8+1)}–{Math.min(page*8,filtered.length)} of {filtered.length} records</span><div><button disabled={page===1} onClick={()=>setPage(p=>p-1)}>‹</button><span>{page}</span><button disabled={page*8>=filtered.length} onClick={()=>setPage(p=>p+1)}>›</button></div></footer>}
    </section></>}
    {dialog && <div className="pw-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setDialog(false);}}><section className="pw-modal" role="dialog" aria-modal="true"><header><div><p className="pw-breadcrumb">Billing &amp; Accounting / Purchases</p><h2>{editing ? `Edit ${config.title.slice(0,-1)}` : actionLabel}</h2></div><button className="pw-close" onClick={()=>setDialog(false)}>×</button></header><form onSubmit={save}>
      <label>Company<input readOnly value={currentCompany?.company_name||""}/></label>
      {kind !== "orders" && <label>Original Purchase Invoice<select required value={form.originalInvoiceId} onChange={e=>{const inv=invoices.find(i=>i.id===e.target.value);setForm(f=>({...f,originalInvoiceId:e.target.value,vendorId:inv?.vendor_id||f.vendorId}));}}><option value="">Select invoice</option>{invoices.map(i=><option key={i.id} value={i.id}>{i.supplier_invoice_no||i.invoice_no} · {i.vendor_name||vendorName(i)} · {money(i.grand_total)}</option>)}</select></label>}
      <div className="pw-form-grid"><label>Supplier<select required value={form.vendorId} onChange={e=>setForm(f=>({...f,vendorId:e.target.value}))}><option value="">Select supplier</option>{vendors.map(v=><option key={v.id} value={v.id}>{v.vendor_name}</option>)}</select></label><label>{kind==="orders"?"Order Date":kind==="returns"?"Return Date":"Debit Note Date"}<input type="date" required value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></label>{kind==="orders"&&<label>Expected Delivery Date<input type="date" value={form.dueDate} onChange={e=>setForm(f=>({...f,dueDate:e.target.value}))}/></label>}</div>
      {kind!=="orders"&&<label>Reason<input required value={form.reason} onChange={e=>setForm(f=>({...f,reason:e.target.value}))} placeholder={kind==="returns"?"e.g. Damaged goods or excess quantity":"e.g. Short supply or rate difference"}/></label>}
      </div><div style={isAndroid&&dialogStep!==2?{display:"none"}:{}}><div className="pw-form-grid"><label>Status<select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>{STATUS_OPTIONS[kind].map(s=><option key={s}>{s}</option>)}</select></label><label>Remarks<input value={form.remarks} onChange={e=>setForm(f=>({...f,remarks:e.target.value}))}/></label></div>
      </div><div style={isAndroid&&dialogStep!==3?{display:"none"}:{}}><div className="pw-lines-heading"><strong>Line items</strong><button type="button" onClick={()=>setLines(p=>[...p,blankLine()])}>＋ Add item</button></div>
      <div className="pw-line-table"><div className="pw-line-head"><span>Item / Description</span><span>HSN/SAC</span><span>Qty</span><span>Unit</span><span>Rate</span><span>GST %</span><span>Amount</span><span></span></div>{lines.map((line,index)=><div className="pw-line" key={index}><input list={`purchase-items-${index}`} value={line.item_name} onChange={e=>{const match=itemsMaster.find(item=>item.item_name.toLowerCase()===e.target.value.toLowerCase());if(match)chooseItem(index,match.id);else setLines(p=>p.map((l,i)=>i===index?{...l,item_id:"",item_name:e.target.value}:l));}} placeholder="Select or enter item"/><datalist id={`purchase-items-${index}`}>{itemsMaster.map(item=><option key={item.id} value={item.item_name}/>)}</datalist><input value={line.hsn_sac} onChange={e=>setLines(p=>p.map((l,i)=>i===index?{...l,hsn_sac:e.target.value}:l))} placeholder="HSN"/><input type="number" min="0" step="0.001" value={line.qty} onChange={e=>setLines(p=>p.map((l,i)=>i===index?{...l,qty:e.target.value}:l))}/><input value={line.uom} onChange={e=>setLines(p=>p.map((l,i)=>i===index?{...l,uom:e.target.value}:l))} placeholder="Unit"/><input type="number" min="0" step="0.01" value={line.rate} onChange={e=>setLines(p=>p.map((l,i)=>i===index?{...l,rate:e.target.value}:l))}/><select value={line.gst_rate} onChange={e=>setLines(p=>p.map((l,i)=>i===index?{...l,gst_rate:e.target.value}:l))}>{["0","5","12","18","28"].map(n=><option key={n} value={n}>{n}%</option>)}</select><strong>{money(num(line.qty)*num(line.rate)*(1+num(line.gst_rate)/100))}</strong><button type="button" className="pw-remove-line" onClick={()=>setLines(p=>p.length>1?p.filter((_,i)=>i!==index):p)} aria-label="Remove item">×</button></div>)}</div>
      <div className="pw-total-strip"><span>Taxable: <b>{money(totals.taxable)}</b></span><span>CGST: <b>{money(totals.cgst)}</b></span><span>SGST: <b>{money(totals.sgst)}</b></span><span>IGST: <b>{money(totals.igst)}</b></span><strong>Total: {money(totals.total)}</strong></div>
      <footer><button type="button" className="pw-reset" onClick={()=>setDialog(false)}>Cancel</button><button className="pw-primary" disabled={saving}>{saving?"Saving…":editing?"Update Document":"Save Document"}</button></footer>
    </form></section></div>}
    {preview && <PurchaseDocumentPreview {...preview} onClose={()=>setPreview(null)} />}
  </main>;
}

