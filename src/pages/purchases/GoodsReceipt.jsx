import React, { useEffect, useMemo, useState } from "react";
import { useCompany } from "../../context/CompanyContext";
import { supabase } from "../../supabase/supabaseClient";
import { Capacitor } from "@capacitor/core";
import "./GoodsReceipt.css";
import "../../css/AndroidWorkflow.css";

const today = () => new Date().toISOString().slice(0, 10);
const num = value => Number(value) || 0;
const money = value => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(num(value));
const blankLine = () => ({ item_id: "", item_name: "", hsn_sac: "", unit: "", ordered_qty: 0, received_qty: "1", accepted_qty: "1", damaged_qty: "0", remarks: "" });

export default function GoodsReceipt() {
  const { currentCompany, currentCompanyId } = useCompany();
  const isAndroid = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  const [rows, setRows] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [step, setStep] = useState(1);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [form, setForm] = useState({ receipt_no: "", receipt_date: today(), receipt_type: "purchase_order", vendor_id: "", purchase_order_id: "", supplier_challan_no: "", received_by: "", remarks: "" });
  const [lines, setLines] = useState([blankLine()]);

  const load = async () => {
    if (!currentCompanyId) { setRows([]); setLoading(false); return; }
    setLoading(true);
    const { data, error: loadError } = await supabase.from("goods_receipts").select("*").eq("company_id", currentCompanyId).eq("is_deleted", false).order("receipt_date", { ascending: false });
    if (loadError) setError(loadError.message); else setRows(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [currentCompanyId]);
  useEffect(() => {
    if (!currentCompanyId) return;
    Promise.all([
      supabase.from("vendors").select("id,vendor_name,gstin,state,address").eq("company_id", currentCompanyId).order("vendor_name"),
      supabase.from("items").select("id,item_name,item_code,hsn_sac,uom,unit,purchase_rate,gst_rate").eq("company_id", currentCompanyId).order("item_name"),
      supabase.from("purchase_orders").select("id,order_no,vendor_id,vendor_name,status").eq("company_id", currentCompanyId).eq("is_deleted", false).not("status", "eq", "Cancelled").order("order_date", { ascending: false })
    ]).then(([v, i, o]) => { setVendors(v.data || []); setItems(i.data || []); setOrders(o.data || []); });
  }, [currentCompanyId]);

  useEffect(() => {
    const order = orders.find(row => row.id === form.purchase_order_id);
    if (!order || form.receipt_type !== "purchase_order") { setOrderItems([]); return; }
    supabase.from("purchase_order_items").select("*").eq("order_id", order.id).order("line_no").then(({ data }) => {
      setOrderItems(data || []);
      if (data?.length) setLines(data.map(row => ({ item_id: row.item_id || "", item_name: row.item_name || "", hsn_sac: row.hsn_sac || "", unit: row.uom || "", ordered_qty: num(row.qty), received_qty: "0", accepted_qty: "0", damaged_qty: "0", remarks: "" })));
    });
  }, [form.purchase_order_id, form.receipt_type, orders]);

  const selectedVendor = vendors.find(v => v.id === form.vendor_id);
  const filteredOrders = orders.filter(o => o.vendor_id === form.vendor_id);
  const totals = useMemo(() => lines.reduce((sum, line) => ({
    received: sum.received + num(line.received_qty),
    accepted: sum.accepted + num(line.accepted_qty),
    damaged: sum.damaged + num(line.damaged_qty)
  }), { received: 0, accepted: 0, damaged: 0 }), [lines]);
  const visibleRows = rows.filter(row => [row.receipt_no, row.vendor_name, row.purchase_order_no, row.supplier_challan_no].join(" ").toLowerCase().includes(search.toLowerCase()) && (typeFilter === "all" || row.receipt_type === typeFilter));

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const updateLine = (index, key, value) => setLines(prev => prev.map((line, i) => i === index ? { ...line, [key]: value } : line));
  const chooseItem = (index, id) => {
    const item = items.find(row => row.id === id);
    setLines(prev => prev.map((line, i) => i === index ? { ...line, item_id: item?.id || "", item_name: item?.item_name || "", hsn_sac: item?.hsn_sac || "", unit: item?.uom || item?.unit || "" } : line));
  };

  const openCreate = async () => {
    setError("");
    setForm({ receipt_no: "", receipt_date: today(), receipt_type: "purchase_order", vendor_id: "", purchase_order_id: "", supplier_challan_no: "", received_by: "", remarks: "" });
    setLines([blankLine()]);
    setOrderItems([]);
    setStep(1);
    setCreating(true);
    if (!currentCompanyId) return;
    const { count, error: countError } = await supabase.from("goods_receipts").select("id", { count: "exact", head: true }).eq("company_id", currentCompanyId);
    if (countError) setError(countError.message);
    else setForm(prev => ({ ...prev, receipt_no: `GRN${String((count || 0) + 1).padStart(5, "0")}` }));
  };

  const validateStep = () => {
    if (step === 1) {
      if (!form.receipt_no.trim() || !form.receipt_date || !form.vendor_id) { setError("Enter the GRN number and date, then select a supplier."); return false; }
      if (form.receipt_type === "purchase_order" && !form.purchase_order_id) { setError("Select a purchase order, or choose Direct Receipt."); return false; }
    }
    if (step === 2) {
      if (!lines.length || lines.some(line => !line.item_name.trim())) { setError("Select or enter an item on every item card."); return false; }
      if (lines.some(line => num(line.received_qty) <= 0 || num(line.accepted_qty) < 0 || num(line.damaged_qty) < 0 || num(line.accepted_qty) + num(line.damaged_qty) !== num(line.received_qty))) {
        setError("For each item, Accepted Qty + Damaged / Rejected Qty must equal Received Qty."); return false;
      }
    }
    setError("");
    return true;
  };

  const save = async () => {
    if (!validateStep() || !currentCompanyId || !selectedVendor) return;
    setSaving(true);
    setError("");
    try {
      const order = orders.find(o => o.id === form.purchase_order_id);
      const header = {
        company_id: currentCompanyId, receipt_no: form.receipt_no.trim(), receipt_date: form.receipt_date,
        receipt_type: form.receipt_type, vendor_id: selectedVendor.id, vendor_name: selectedVendor.vendor_name,
        purchase_order_id: order?.id || null, purchase_order_no: order?.order_no || null,
        supplier_challan_no: form.supplier_challan_no.trim() || null, received_by: form.received_by.trim() || null,
        remarks: form.remarks.trim() || null, total_received_qty: totals.received,
        accepted_qty: totals.accepted, damaged_qty: totals.damaged, status: "Received"
      };
      const { data, error: headerError } = await supabase.from("goods_receipts").insert(header).select("id").single();
      if (headerError) throw headerError;
      const childRows = lines.map((line, index) => ({
        goods_receipt_id: data.id, line_no: index + 1, item_id: line.item_id || null,
        item_name: line.item_name.trim(), hsn_sac: line.hsn_sac || null, unit: line.unit || null,
        ordered_qty: num(line.ordered_qty), received_qty: num(line.received_qty),
        accepted_qty: num(line.accepted_qty), damaged_qty: num(line.damaged_qty), remarks: line.remarks.trim() || null
      }));
      const { error: itemError } = await supabase.from("goods_receipt_items").insert(childRows);
      if (itemError) {
        await supabase.from("goods_receipts").delete().eq("id", data.id).eq("company_id", currentCompanyId);
        throw itemError;
      }
      setCreating(false);
      await load();
    } catch (e) { setError(e.message || "Unable to save Goods Receipt Note."); }
    finally { setSaving(false); }
  };

  return <main className={`grn-page ${isAndroid ? "grn-android" : ""}`}>
    <header className="grn-heading">
      <div><h1>Goods Receipt Notes</h1></div>
      {!creating && <button className="grn-primary" onClick={openCreate}>＋ New Goods Receipt</button>}
    </header>
    {!currentCompanyId && <div className="grn-alert">Select a company to view Goods Receipt Notes.</div>}
    {error && <div className="grn-alert">{error}<button onClick={() => setError("")}>×</button></div>}
    {!creating ? <>
      <div className="grn-toolbar"><button type="button" className="grn-filter-trigger" onClick={() => setShowFilters(v => !v)}>☷ Filter</button><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search GRN, supplier or challan number"/></div>{showFilters && <div className="grn-filter-panel"><label>Receipt Type<select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}><option value="all">All receipts</option><option value="purchase_order">Against Purchase Order</option><option value="direct">Direct Receipt</option></select></label><button type="button" onClick={()=>setTypeFilter("all")}>Clear</button></div>}
      <section className="grn-table-card">
        {loading ? <div className="grn-empty">Loading Goods Receipt Notes…</div> : visibleRows.length ? <div className="grn-transaction-list">{visibleRows.map(row => <article className="grn-transaction-card" key={row.id}><div className="grn-card-top"><strong>{row.receipt_no}</strong><time>{row.receipt_date}</time></div><div className="grn-card-supplier">{row.vendor_name || "—"}</div><div className="grn-card-meta"><span>{row.purchase_order_no || "Direct Receipt"}</span><span className="grn-status">{row.status}</span></div><div className="grn-card-quantities"><span>Received <b>{num(row.total_received_qty)}</b></span><span>Accepted <b>{num(row.accepted_qty)}</b></span><span>Damaged <b>{num(row.damaged_qty)}</b></span></div></article>)}</div></div> : <div className="grn-empty"><strong>No Goods Receipt Notes yet</strong><span>Create a GRN when goods arrive from a supplier.</span></div>}
      </section>
    </> : <>
      <div className="grn-form-top"><button className="grn-back-link" onClick={() => setCreating(false)}>← Back to Goods Receipt Notes</button><div className="grn-stepper">{["Details","Items","Review"].map((label,i)=><button key={label} className={step===i+1?"active":step>i+1?"done":""} onClick={() => { if(i+1<step) setStep(i+1); }}><b>{step>i+1?"✓":i+1}</b>{label}</button>)}</div></div>
      {step===1 && <section className="grn-panel">
        <div className="grn-panel-title"><h2>GRN Details</h2></div>
        <div className="grn-grid">
          <label>GRN Number <em>*</em><input value={form.receipt_no} onChange={e=>updateForm("receipt_no",e.target.value)} placeholder="GRN00001"/></label>
          <label>Receipt Date <em>*</em><input type="date" value={form.receipt_date} onChange={e=>updateForm("receipt_date",e.target.value)}/></label>
          <label>Receipt Type <em>*</em><select value={form.receipt_type} onChange={e=>{updateForm("receipt_type",e.target.value);updateForm("purchase_order_id","");setLines([blankLine()]);}}><option value="purchase_order">Against Purchase Order</option><option value="direct">Direct Receipt</option></select></label>
          <label>Supplier <em>*</em><select value={form.vendor_id} onChange={e=>{updateForm("vendor_id",e.target.value);updateForm("purchase_order_id","");}}><option value="">Select Supplier</option>{vendors.map(v=><option key={v.id} value={v.id}>{v.vendor_name}</option>)}</select></label>
          {form.receipt_type==="purchase_order" && <label className="grn-span-2">Purchase Order <em>*</em><select value={form.purchase_order_id} onChange={e=>updateForm("purchase_order_id",e.target.value)}><option value="">Select Purchase Order</option>{filteredOrders.map(o=><option key={o.id} value={o.id}>{o.order_no} · {o.vendor_name}</option>)}</select></label>}
          <label>Supplier Delivery Challan No. <small>(Optional)</small><input value={form.supplier_challan_no} onChange={e=>updateForm("supplier_challan_no",e.target.value)} placeholder="Enter supplier challan number"/></label>
          <label>Received By <small>(Optional)</small><input value={form.received_by} onChange={e=>updateForm("received_by",e.target.value)} placeholder="Enter name"/></label>
        </div>
        <button className="grn-primary grn-full" onClick={()=>{if(validateStep())setStep(2);}}>Continue to Items →</button>
      </section>}
      {step===2 && <section className="grn-panel">
        <div className="grn-panel-title"><h2>Items Received</h2></div>
        <div className="grn-item-list">{lines.map((line,index)=><article className="grn-item-card" key={index}>
          <header><strong>Item {index+1}</strong>{lines.length>1&&<button className="grn-remove" onClick={()=>setLines(prev=>prev.filter((_,i)=>i!==index))}>×</button>}</header>
          <label>Item <em>*</em>{form.receipt_type==="purchase_order"&&orderItems.length>0?<input value={line.item_name} readOnly/>:<select value={line.item_id} onChange={e=>chooseItem(index,e.target.value)}><option value="">Select Item</option>{items.map(item=><option key={item.id} value={item.id}>{item.item_name}</option>)}</select>}</label>
          <div className="grn-grid grn-grid-2">
            <label>HSN / SAC<input value={line.hsn_sac} readOnly/></label><label>Unit<input value={line.unit} readOnly/></label>
            <label>Ordered Qty<input value={line.ordered_qty} readOnly/></label><label>Received Qty <em>*</em><input type="number" min="0" step="0.001" value={line.received_qty} onChange={e=>updateLine(index,"received_qty",e.target.value)}/></label>
            <label>Accepted Qty <em>*</em><input type="number" min="0" step="0.001" value={line.accepted_qty} onChange={e=>updateLine(index,"accepted_qty",e.target.value)}/></label><label>Damaged / Rejected Qty<input type="number" min="0" step="0.001" value={line.damaged_qty} onChange={e=>updateLine(index,"damaged_qty",e.target.value)}/></label>
          </div>
          <label>Item Remarks <small>(Optional)</small><textarea rows="2" value={line.remarks} onChange={e=>updateLine(index,"remarks",e.target.value)} placeholder="Enter item remarks"/></label>
          <footer><span>Received <b>{num(line.received_qty)}</b></span><span>Accepted <b className="good">{num(line.accepted_qty)}</b></span><span>Damaged <b className="bad">{num(line.damaged_qty)}</b></span></footer>
        </article>)}</div>
        {form.receipt_type==="direct" && <button className="grn-add" onClick={()=>setLines(prev=>[...prev,blankLine()])}>＋ Add Another Item</button>}
        <div className="grn-actions"><button className="grn-secondary" onClick={()=>setStep(1)}>Back</button><button className="grn-primary" onClick={()=>{if(validateStep())setStep(3);}}>Review GRN →</button></div>
      </section>}
      {step===3 && <section className="grn-panel">
        <div className="grn-panel-title"><h2>Review Goods Receipt</h2></div>
        <article className="grn-review-card"><header><h3>GRN Details</h3><button onClick={()=>setStep(1)}>Edit</button></header>
          {[["GRN Number",form.receipt_no],["Receipt Date",form.receipt_date],["Supplier",selectedVendor?.vendor_name],["Receipt Type",form.receipt_type==="purchase_order"?"Against Purchase Order":"Direct Receipt"],["Purchase Order",orders.find(o=>o.id===form.purchase_order_id)?.order_no||"—"],["Supplier Challan No.",form.supplier_challan_no||"—"]].map(([label,value])=><div className="grn-review-row" key={label}><span>{label}</span><strong>{value||"—"}</strong></div>)}
        </article>
        <article className="grn-review-card"><header><h3>Items Summary</h3><button onClick={()=>setStep(2)}>Edit</button></header>
          {lines.map((line,i)=><div className="grn-review-item" key={i}><strong>{line.item_name}</strong><div><span>Received {num(line.received_qty)}</span><span>Accepted {num(line.accepted_qty)}</span><span>Damaged {num(line.damaged_qty)}</span></div></div>)}
        </article>
        <div className="grn-summary"><div><span>Total Received</span><strong>{totals.received}</strong></div><div><span>Accepted</span><strong className="good">{totals.accepted}</strong></div><div><span>Damaged</span><strong className="bad">{totals.damaged}</strong></div></div>
        <label className="grn-remarks">Remarks <small>(Optional)</small><textarea rows="3" value={form.remarks} onChange={e=>updateForm("remarks",e.target.value)} placeholder="Add receipt remarks"/></label>
        <div className="grn-actions"><button className="grn-secondary" onClick={()=>setStep(2)}>Back</button><button className="grn-primary" disabled={saving} onClick={save}>{saving?"Saving…":"Save GRN"}</button></div>
      </section>}
    </>}
  </main>;
}
