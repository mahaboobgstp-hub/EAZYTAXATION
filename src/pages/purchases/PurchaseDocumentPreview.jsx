import React, { useEffect } from "react";
import { downloadPurchasePdf } from "../../utils/purchaseDocumentPdf";
import "./PurchaseWorkspace.css";

const n = value => Number(value) || 0;
const money = value => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n(value));
const dateText = value => value ? new Date(value + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function PurchaseDocumentPreview({ kind, document, items = [], company, onClose, autoPrint = false }) {
  useEffect(() => {
    if (!autoPrint) return;
    const timer = setTimeout(() => window.print(), 450);
    return () => clearTimeout(timer);
  }, [autoPrint]);

  const title = kind === "register" ? "Purchase Invoice" : kind === "orders" ? "Purchase Order" : kind === "returns" ? "Purchase Return" : "Debit Note";
  const number = document.invoice_no || document.order_no || document.return_no || document.debit_note_no;
  const date = document.invoice_date || document.order_date || document.return_date || document.debit_note_date;
  const grand = document.grand_total ?? document.total_amount ?? document.total_credit;
  return <div className="pw-backdrop pw-preview-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><section className="pw-preview" role="dialog" aria-modal="true" aria-label={`${title} preview`}><div className="pw-preview-toolbar"><button className="pw-reset" onClick={onClose}>Close</button><button className="pw-secondary" onClick={()=>downloadPurchasePdf({kind,document,items,company})}>Download PDF</button><button className="pw-primary" onClick={()=>window.print()}>Print</button></div><article className="pw-paper"><header className="pw-paper-header"><div><h2>{company?.company_name||"Company"}</h2><p>{company?.address||""}</p><p>GSTIN: {company?.gstin||"—"}</p></div><strong>{kind==="register"?"TAX INVOICE":title.toUpperCase()}</strong></header><div className="pw-paper-meta"><div><span>Document No.</span><b>{number||"—"}</b><span>Date</span><b>{dateText(date)}</b>{document.supplier_invoice_no&&<><span>Supplier Invoice</span><b>{document.supplier_invoice_no}</b></>}</div><div><span>Supplier</span><b>{document.vendor_name||"—"}</b><span>Supplier GSTIN</span><b>{document.gstin||"—"}</b><span>Original Invoice</span><b>{document.original_purchase_invoice_no||"—"}</b></div></div>{document.reason&&<p className="pw-paper-reason"><b>Reason:</b> {document.reason}</p>}<table><thead><tr><th>#</th><th>Item / Description</th><th>HSN</th><th>Qty</th><th>Unit</th><th>Rate</th><th>GST</th><th>Amount</th></tr></thead><tbody>{items.map((item,i)=><tr key={item.id||i}><td>{i+1}</td><td>{item.item_name||"—"}</td><td>{item.hsn_sac||"—"}</td><td>{n(item.qty)}</td><td>{item.uom||"—"}</td><td>{money(item.rate)}</td><td>{n(item.gst_rate)}%</td><td>{money(item.line_total||item.amount)}</td></tr>)}</tbody></table><div className="pw-paper-totals"><div>Taxable Value <b>{money(document.taxable??document.taxable_value)}</b></div><div>CGST <b>{money(document.cgst)}</b></div><div>SGST <b>{money(document.sgst)}</b></div><div>IGST <b>{money(document.igst)}</b></div><div>Round Off <b>{money(document.round_off)}</b></div><div className="pw-paper-grand">Grand Total <b>{money(grand)}</b></div></div><footer>{document.remarks&&<p>Remarks: {document.remarks}</p>}<div className="pw-signature">Authorized Signatory</div></footer></article></section></div>;
}
