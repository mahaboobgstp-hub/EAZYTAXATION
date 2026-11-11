import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../supabase/supabaseClient";
import { useCompany } from "../../context/CompanyContext";
import { calculateSalesInvoiceTax } from "../../utils/salesInvoiceTaxCalculator";
import {
  getCustomersForDropdown,
  getItemsForDropdown,
  generateInvoiceNumber,
  saveSalesInvoice,
} from "../../services/salesInvoiceService";
import { getInvoiceSettingsByCompany } from "../../services/invoiceSettingsService";
import { getCompanyById } from "../../services/companyService";
import { getCustomerById } from "../../services/customerService";
import { getSalesInvoiceById, getSalesInvoiceItems } from "../../services/salesInvoiceService";
import InvoicePrint from "../../components/InvoicePrint";
import { numberToWords } from "../../utils/numberToWords";
import "../../css/sales/MobileSalesInvoice.css";

const todayISO = () => {
  const now = new Date();
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
};
const money = value => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value) || 0);

const blankLine = () => ({ item_id: "", item_name: "", hsn_sac: "", unit: "", gst_rate: 18, cess_rate: 0, qty: 1, rate: 0, amount: 0 });

export default function MobileSalesInvoice() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentCompany, currentCompanyId, loading: companyLoading } = useCompany();
  const [step, setStep] = useState(1);
  const [customers, setCustomers] = useState([]);
  const [itemsMaster, setItemsMaster] = useState([]);
  const [invoiceSettings, setInvoiceSettings] = useState(null);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(todayISO());
  const [customerId, setCustomerId] = useState("");
  const [saleType, setSaleType] = useState("CASH");
  const [placeOfSupply, setPlaceOfSupply] = useState("");
  const [remarks, setRemarks] = useState("");
  const [searchItem, setSearchItem] = useState("");
  const [lines, setLines] = useState([blankLine()]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedInvoice, setSavedInvoice] = useState(null);
  const [printData, setPrintData] = useState(null);
  const [sourceLoadedId, setSourceLoadedId] = useState("");

  const customer = customers.find(item => item.id === customerId) || null;
  const intraState = Boolean(currentCompany?.state && placeOfSupply && currentCompany.state.toLowerCase() === placeOfSupply.toLowerCase());
  const calculated = useMemo(() => calculateSalesInvoiceTax({
    items: lines,
    taxInclusive: false,
    discountType: "AMOUNT",
    discountValue: 0,
    intraState,
    otherAmount: 0,
    roundOff: 0,
  }), [lines, intraState]);
  const totals = calculated.totals;
  const grandTotal = totals.grandTotal;
  const visibleItems = itemsMaster.filter(item => !searchItem || (item.item_name || "").toLowerCase().includes(searchItem.toLowerCase()) || (item.hsn_sac || "").toLowerCase().includes(searchItem.toLowerCase()));

  useEffect(() => {
    if (!currentCompanyId) return;
    let active = true;
    setLoading(true);
    Promise.all([
      getCustomersForDropdown(currentCompanyId),
      getItemsForDropdown(currentCompanyId),
      getInvoiceSettingsByCompany(currentCompanyId),
      generateInvoiceNumber(currentCompanyId, invoiceDate, false),
    ]).then(([customerRows, itemRows, settings, number]) => {
      if (!active) return;
      setCustomers(customerRows || []);
      setItemsMaster(itemRows || []);
      setInvoiceSettings(settings || { invoice_auto_numbering: true });
      setInvoiceNo(number || "");
    }).catch(err => {
      if (active) setError(err?.message || "Unable to load invoice data.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [currentCompanyId]);

  useEffect(() => {
    const sourceId = location.state?.sourceId;
    const sourceType = location.state?.sourceType;
    if (!sourceId || !sourceType || !currentCompanyId || !customers.length || sourceLoadedId === sourceId) return;
    let active = true;
    const loadSourceDocument = async () => {
      try {
        const isOrder = sourceType === "orders";
        const headerTable = isOrder ? "sales_orders" : "quotations";
        const itemTable = isOrder ? "sales_order_items" : "quotation_items";
        const parentField = isOrder ? "order_id" : "invoice_id";
        const { data: source, error: sourceError } = await supabase
          .from(headerTable)
          .select("*")
          .eq("id", sourceId)
          .eq("company_id", currentCompanyId)
          .single();
        if (sourceError) throw sourceError;
        const { data: sourceItems, error: itemsError } = await supabase
          .from(itemTable)
          .select("*")
          .eq(parentField, sourceId)
          .order("line_no", { ascending: true });
        if (itemsError) throw itemsError;
        if (!active) return;
        const sourceCustomer = customers.find(row => row.id === source.customer_id);
        setCustomerId(source.customer_id || "");
        setPlaceOfSupply(sourceCustomer?.state || "");
        setSaleType("CREDIT");
        setRemarks(`Converted from ${isOrder ? "Sales Order " + (source.order_no || "") : "Quotation " + (source.invoice_no || "")}`);
        setLines((sourceItems || []).map(item => ({
          item_id: item.item_id || "",
          item_name: item.item_name || item.particulars || item.description || "",
          hsn_sac: item.hsn_sac || "",
          unit: item.unit || "",
          gst_rate: Number(item.gst_rate) || 0,
          cess_rate: Number(item.cess_rate) || 0,
          qty: Number(item.qty) || 0,
          rate: Number(item.rate) || 0,
          amount: Number(item.amount) || 0,
        })));
        setStep(1);
        setSourceLoadedId(sourceId);
        setError("");
      } catch (err) {
        if (active) setError(err?.message || "Unable to load the source document.");
      }
    };
    loadSourceDocument();
    return () => { active = false; };
  }, [location.state, currentCompanyId, customers, sourceLoadedId]);

  const changeDate = async value => {
    setInvoiceDate(value);
    if (invoiceSettings?.invoice_auto_numbering === false || !currentCompanyId) return;
    try {
      const number = await generateInvoiceNumber(currentCompanyId, value, false);
      setInvoiceNo(number || "");
    } catch (err) {
      setError(err?.message || "Unable to refresh invoice number.");
    }
  };

  const updateLine = (index, field, value) => {
    setLines(prev => prev.map((line, i) => {
      if (i !== index) return line;
      if (field === "item_id") {
        const item = itemsMaster.find(row => row.id === value);
        return item ? {
          ...line,
          item_id: item.id,
          item_name: item.item_name || "",
          hsn_sac: item.hsn_sac || "",
          unit: item.unit || "",
          gst_rate: Number(item.gst_rate) || 0,
          cess_rate: Number(item.cess_rate) || 0,
          rate: Number(item.sales_rate) || 0,
          qty: 1,
        } : { ...line, item_id: "", item_name: "", rate: 0 };
      }
      return { ...line, [field]: value };
    }));
  };

  const save = async () => {
    if (!currentCompanyId) { setError("Please select a company first."); return; }
    if (!customer) { setError("Please select a customer."); setStep(1); return; }
    if (!lines.length || lines.some(line => !line.item_name || Number(line.qty) <= 0)) {
      setError("Select an item and enter a quantity greater than zero for every row.");
      setStep(2);
      return;
    }
    setSaving(true);
    setError("");
    try {
      let finalNumber = invoiceNo;
      if (invoiceSettings?.invoice_auto_numbering !== false) {
        finalNumber = await generateInvoiceNumber(currentCompanyId, invoiceDate, true);
      }
      if (!finalNumber) throw new Error("Invoice number is unavailable. Check Invoice Settings.");
      const header = {
        company_id: currentCompanyId,
        company_name: currentCompany?.company_name || "",
        company_state: currentCompany?.state || "",
        invoice_no: finalNumber,
        invoice_date: invoiceDate,
        customer_id: customer.id,
        customer_name: customer.customer_name,
        customer_state: customer.state || "",
        billing_address: customer.address || "",
        shipping_name: customer.customer_name || "",
        shipping_gstin: customer.gstin || "",
        shipping_state: customer.state || "",
        shipping_address: customer.address || "",
        place_of_supply: placeOfSupply || customer.state || "",
        gst_type: intraState ? "INTRA_STATE" : "INTER_STATE",
        sale_type: saleType,
        tax_inclusive: false,
        discount_type: "AMOUNT",
        discount_value: 0,
        discount_amount: 0,
        cess_amount: totals.cess,
        additional_cess_amount: 0,
        other_amount: 0,
        round_off: 0,
        taxable_value: totals.taxable,
        cgst: totals.cgst,
        sgst: totals.sgst,
        igst: totals.igst,
        total_amount: grandTotal,
        remarks,
      };
      const invoiceId = await saveSalesInvoice(header, calculated.items);
      setSavedInvoice({ id: invoiceId, invoice_no: finalNumber, total_amount: grandTotal, customer_name: customer.customer_name, invoice_date: invoiceDate });
      setInvoiceNo(finalNumber);
      const [invoice, invoiceItems, settings, companyDetails, customerDetails] = await Promise.all([
        getSalesInvoiceById(invoiceId),
        getSalesInvoiceItems(invoiceId),
        getInvoiceSettingsByCompany(currentCompanyId),
        getCompanyById(currentCompanyId),
        getCustomerById(customer.id),
      ]);
      setPrintData({ invoice, items: invoiceItems || [], settings, company: companyDetails, customer: customerDetails });
    } catch (err) {
      setError(err?.message || "Unable to save invoice.");
    } finally {
      setSaving(false);
    }
  };

  if (companyLoading || loading) return <main className="mobile-sales-page"><div className="mobile-sales-loading">Loading your sales workspace…</div></main>;
  if (!currentCompanyId) return <main className="mobile-sales-page"><div className="mobile-sales-empty"><h2>Select a company</h2><p>Select or create a company before creating a sales invoice.</p><button onClick={() => navigate("/app/companies")}>Company Management</button></div></main>;

  if (savedInvoice) return (
    <main className="mobile-sales-page">
      {printData && <InvoicePrint invoice={printData.invoice} items={printData.items} settings={printData.settings} company={printData.company} customer={printData.customer} onClose={() => setPrintData(null)} />}
      <section className="mobile-sales-success">
        <div className="mobile-sales-success-icon">✓</div>
        <h1>Invoice saved successfully</h1>
        <p>{savedInvoice.invoice_no}</p>
        <strong>{money(savedInvoice.total_amount)}</strong>
        <span>{savedInvoice.customer_name}</span>
        <button className="mobile-sales-primary" onClick={() => navigate("/app/sales-register")}>View Sales Register</button>
        <button className="mobile-sales-secondary" onClick={() => { setSavedInvoice(null); setStep(1); setInvoiceDate(todayISO()); setCustomerId(""); setSaleType("CASH"); setPlaceOfSupply(""); setRemarks(""); setLines([blankLine()]); }}>Create Another Invoice</button>
      </section>
    </main>
  );

  return (
    <main className="mobile-sales-page">
      <header className="mobile-sales-heading">
        <button className="mobile-sales-back" onClick={() => step === 1 ? navigate("/app/dashboard") : setStep(step - 1)} aria-label="Go back">‹</button>
        <div><small>{currentCompany?.company_name || "EAZYTAXATION"}</small><h1>Add Sales Invoice</h1></div>
      </header>
      <nav className="mobile-sales-steps" aria-label="Invoice steps">
        {["Details", "Items", "Review"].map((label, index) => <div className={step === index + 1 ? "active" : step > index + 1 ? "complete" : ""} key={label}><b>{step > index + 1 ? "✓" : index + 1}</b><span>{label}</span></div>)}
      </nav>
      {error && <div className="mobile-sales-error" role="alert">{error}<button onClick={() => setError("")}>×</button></div>}

      {step === 1 && <section className="mobile-sales-card">
        <label>Invoice Number<input value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} readOnly={invoiceSettings?.invoice_auto_numbering !== false} placeholder="Generated automatically" /></label>
        <label>Invoice Date<input type="date" value={invoiceDate} onChange={e => changeDate(e.target.value)} required /></label>
        <label>Customer<select value={customerId} onChange={e => { const selected = customers.find(row => row.id === e.target.value); setCustomerId(e.target.value); setPlaceOfSupply(selected?.state || ""); }} required><option value="">Select customer</option>{customers.map(row => <option key={row.id} value={row.id}>{row.customer_name}</option>)}</select></label>
        {customer && <div className="mobile-sales-customer-info"><strong>{customer.customer_name}</strong><span>{customer.address || "Address not available"}</span><span>{customer.state || ""}{customer.gstin ? " · GSTIN " + customer.gstin : ""}</span></div>}
        <fieldset className="mobile-sales-choice"><legend>Billing Type</legend><button type="button" className={saleType === "CASH" ? "selected" : ""} onClick={() => setSaleType("CASH")}>Cash</button><button type="button" className={saleType === "CREDIT" ? "selected" : ""} onClick={() => setSaleType("CREDIT")}>Credit</button></fieldset>
        <label>Place of Supply<select value={placeOfSupply} onChange={e => setPlaceOfSupply(e.target.value)}><option value="">Use customer state</option>{[...new Set([...(customers.map(row => row.state).filter(Boolean)), currentCompany?.state].filter(Boolean))].map(state => <option key={state} value={state}>{state}</option>)}</select></label>
        <button className="mobile-sales-primary" onClick={() => { if (!customerId) { setError("Select a customer to continue."); return; } setError(""); setStep(2); }}>Next: Add Items →</button>
      </section>}

      {step === 2 && <section className="mobile-sales-card">
        <label>Search Items<input value={searchItem} onChange={e => setSearchItem(e.target.value)} placeholder="Search item name or HSN" /></label>
        {lines.map((line, index) => <article className="mobile-sales-item-card" key={index}>
          <div className="mobile-sales-item-top"><strong>Item {index + 1}</strong>{lines.length > 1 && <button type="button" onClick={() => setLines(prev => prev.filter((_, i) => i !== index))}>Remove</button>}</div>
          <label>Item<select value={line.item_id} onChange={e => updateLine(index, "item_id", e.target.value)}><option value="">Select item</option>{visibleItems.map(item => <option key={item.id} value={item.id}>{item.item_name}</option>)}</select></label>
          {line.item_name && <p className="mobile-sales-item-meta">HSN: {line.hsn_sac || "—"} · GST: {line.gst_rate}% · Unit: {line.unit || "—"}</p>}
          <div className="mobile-sales-two-fields"><label>Quantity<input type="number" min="0.01" step="0.01" value={line.qty} onChange={e => updateLine(index, "qty", e.target.value)} /></label><label>Rate (₹)<input type="number" min="0" step="0.01" value={line.rate} onChange={e => updateLine(index, "rate", e.target.value)} /></label></div>
          <div className="mobile-sales-line-total">Line amount <strong>{money(Number(line.qty) * Number(line.rate))}</strong></div>
        </article>)}
        <button className="mobile-sales-add" type="button" onClick={() => setLines(prev => [...prev, blankLine()])}>＋ Add Another Item</button>
        <div className="mobile-sales-actions"><button className="mobile-sales-secondary" onClick={() => setStep(1)}>Back</button><button className="mobile-sales-primary" onClick={() => { if (lines.some(line => !line.item_id || Number(line.qty) <= 0)) { setError("Select an item and enter a valid quantity in every row."); return; } setError(""); setStep(3); }}>Next: Review →</button></div>
      </section>}

      {step === 3 && <section className="mobile-sales-card">
        <h2>Invoice Summary</h2>
        <div className="mobile-sales-summary-row"><span>Invoice No.</span><strong>{invoiceNo || "—"}</strong></div>
        <div className="mobile-sales-summary-row"><span>Invoice Date</span><strong>{invoiceDate}</strong></div>
        <div className="mobile-sales-summary-row"><span>Customer</span><strong>{customer?.customer_name || "—"}</strong></div>
        <div className="mobile-sales-summary-row"><span>Billing Type</span><strong>{saleType === "CASH" ? "Cash" : "Credit"}</strong></div>
        <h3>Items ({lines.length})</h3>
        {calculated.items.map((line, index) => <div className="mobile-sales-summary-item" key={index}><span>{line.item_name} · {line.qty} × {money(line.rate)}</span><strong>{money(line.taxable_amount + line.cgst_amount + line.sgst_amount + line.igst_amount + line.cess_amount)}</strong></div>)}
        <div className="mobile-sales-summary-row"><span>Taxable Amount</span><strong>{money(totals.taxable)}</strong></div>
        {intraState ? <><div className="mobile-sales-summary-row"><span>CGST</span><strong>{money(totals.cgst)}</strong></div><div className="mobile-sales-summary-row"><span>SGST</span><strong>{money(totals.sgst)}</strong></div></> : <div className="mobile-sales-summary-row"><span>IGST</span><strong>{money(totals.igst)}</strong></div>}
        {totals.cess > 0 && <div className="mobile-sales-summary-row"><span>Cess</span><strong>{money(totals.cess)}</strong></div>}
        <label>Remarks (optional)<textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={2} /></label>
        <div className="mobile-sales-grand-total"><span>Grand Total</span><strong>{money(grandTotal)}</strong></div>
        <div className="mobile-sales-amount-words"><span>Amount in Words</span><strong>{numberToWords(Number(grandTotal) || 0)}</strong></div>
        <div className="mobile-sales-actions"><button className="mobile-sales-secondary" onClick={() => setStep(2)}>Back</button><button className="mobile-sales-primary" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save Invoice"}</button></div>
      </section>}
    </main>
  );
}
