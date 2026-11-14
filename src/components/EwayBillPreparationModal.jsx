import React, { useEffect, useState } from "react";
import { getSalesInvoiceItems } from "../services/salesInvoiceService";
import "./EwayBillPreparationModal.css";

export default function EwayBillPreparationModal({ invoice, company, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    supplyType: "Outward", subSupplyType: "Supply", documentType: "Tax Invoice",
    transactionType: "Regular", transportMode: "Road", distanceKm: "",
    vehicleNo: invoice.vehicle_no || "", transporterId: "", transporterName: "",
    transportDocumentNo: "", transportDocumentDate: ""
  });

  useEffect(() => {
    let active = true;
    getSalesInvoiceItems(invoice.id)
      .then(rows => { if (active) setItems(rows || []); })
      .catch(err => { if (active) setError(err.message || "Unable to load invoice items."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [invoice.id]);

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const prepare = () => {
    setError("");
    if (!form.distanceKm || Number(form.distanceKm) < 1 || Number(form.distanceKm) > 4000) {
      setError("Enter a valid approximate distance between 1 and 4,000 KM.");
      return;
    }
    if (form.transportMode === "Road" && !form.vehicleNo.trim() && !form.transporterId.trim()) {
      setError("For road transport, enter a vehicle number or transporter ID.");
      return;
    }
    const payload = {
      preparation_status: "PREPARED_NOT_GENERATED",
      note: "This is a preparation file only. It is not an issued government e-way bill.",
      company: { name: company?.company_name || "", gstin: company?.gstin || "", address: company?.address || "", state: company?.state || "" },
      document: {
        type: form.documentType, number: invoice.invoice_no, date: invoice.invoice_date,
        supply_type: form.supplyType, sub_supply_type: form.subSupplyType,
        transaction_type: form.transactionType, invoice_value: Number(invoice.total_amount || 0),
        place_of_supply: invoice.place_of_supply || ""
      },
      recipient: {
        name: invoice.shipping_name || invoice.customer_name || "",
        gstin: invoice.shipping_gstin || "", state: invoice.shipping_state || invoice.place_of_supply || "",
        address: invoice.shipping_address || invoice.billing_address || ""
      },
      transport: {
        mode: form.transportMode, approximate_distance_km: Number(form.distanceKm),
        vehicle_number: form.vehicleNo.trim(), transporter_id: form.transporterId.trim(),
        transporter_name: form.transporterName.trim(),
        document_number: form.transportDocumentNo.trim(), document_date: form.transportDocumentDate || ""
      },
      items: items.map(item => ({
        description: item.item_name || item.particulars || "", hsn: item.hsn_sac || "",
        quantity: Number(item.qty || 0), unit: item.unit || "",
        taxable_amount: Number(item.amount || 0), gst_rate: Number(item.gst_rate || 0)
      }))
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = (invoice.invoice_no || "sales-invoice") + "-ewaybill-preparation.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="eway-prep-backdrop">
      <section className="eway-prep-modal" role="dialog" aria-modal="true" aria-labelledby="eway-prep-title">
        <header className="eway-prep-header">
          <div><span>GST COMPLIANCE</span><h2 id="eway-prep-title">Prepare E-Way Bill</h2><p>Sales Invoice: {invoice.invoice_no}</p></div>
          <button type="button" onClick={onClose} aria-label="Close">×</button>
        </header>
        <div className="eway-prep-warning"><strong>Government API credentials not connected</strong><p>Complete the transport information and prepare the data. The JSON file is for integration/testing only; it does not create or issue an e-way bill on the GST portal.</p></div>
        {error && <div className="eway-prep-error" role="alert">{error}</div>}
        {loading ? <p>Loading invoice items…</p> : (
          <div className="eway-prep-grid">
            <label>Supply type<select value={form.supplyType} onChange={e=>set("supplyType",e.target.value)}><option>Outward</option><option>Inward</option></select></label>
            <label>Sub-supply type<select value={form.subSupplyType} onChange={e=>set("subSupplyType",e.target.value)}><option>Supply</option><option>Export</option><option>Job Work</option><option>For Own Use</option><option>Others</option><option>SKD/CKD</option><option>Line Sales</option><option>Recipient Not Known</option><option>Exhibition or Fairs</option></select></label>
            <label>Document type<select value={form.documentType} onChange={e=>set("documentType",e.target.value)}><option>Tax Invoice</option><option>Bill of Supply</option><option>Bill of Entry</option><option>Delivery Challan</option><option>Credit Note</option><option>Others</option></select></label>
            <label>Transaction type<select value={form.transactionType} onChange={e=>set("transactionType",e.target.value)}><option>Regular</option><option>Bill To - Ship To</option><option>Bill From - Dispatch From</option><option>Combination</option></select></label>
            <label>Transport mode<select value={form.transportMode} onChange={e=>set("transportMode",e.target.value)}><option>Road</option><option>Rail</option><option>Air</option><option>Ship</option></select></label>
            <label>Approx. distance (KM)<input type="number" min="1" max="4000" value={form.distanceKm} onChange={e=>set("distanceKm",e.target.value)} /></label>
            <label>Vehicle number<input value={form.vehicleNo} onChange={e=>set("vehicleNo",e.target.value.toUpperCase())} placeholder="Vehicle registration" /></label>
            <label>Transporter ID / GSTIN<input value={form.transporterId} onChange={e=>set("transporterId",e.target.value.toUpperCase())} /></label>
            <label>Transporter name<input value={form.transporterName} onChange={e=>set("transporterName",e.target.value)} /></label>
            <label>Transport document number<input value={form.transportDocumentNo} onChange={e=>set("transportDocumentNo",e.target.value)} /></label>
            <label>Transport document date<input type="date" value={form.transportDocumentDate} onChange={e=>set("transportDocumentDate",e.target.value)} /></label>
          </div>
        )}
        <footer className="eway-prep-actions"><button type="button" className="eway-prep-cancel" onClick={onClose}>Close</button><button type="button" className="eway-prep-download" onClick={prepare} disabled={loading || !items.length}>Validate &amp; Download Prepared Data</button></footer>
      </section>
    </div>
  );
}
