import React from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "../css/sales/InvoicePrint.css";
import { numberToWords } from "../utils/numberToWords";

function InvoicePrint({
  invoice,
  items,
  settings,
  company,
  customer,
  onClose,
}) {
  if (!invoice) return null;

  const amountInWords = numberToWords(
    Number(invoice.total_amount || 0)
  );

  console.log("Invoice Settings:", settings);

  const handleDownloadPDF = async () => {

  const input = document.getElementById("invoice-content");

  if (!input) {
    alert("Invoice content not found.");
    return;
  }

  const canvas = await html2canvas(input, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    scrollY: 0,
    logging: false,
  });

  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
const pageHeight = pdf.internal.pageSize.getHeight();

const pdfMargin = 2;

pdf.addImage(
    imgData,
    "PNG",
    pdfMargin,
    pdfMargin,
    pageWidth - pdfMargin * 2,
    pageHeight - pdfMargin * 2
);

  pdf.save(`${invoice.invoice_no}.pdf`);

};
  return (
    <div className="invoice-overlay">
      <div className="invoice-print">

        <div className="invoice-actions">
          <button onClick={onClose}>
            Close
          </button>

          <button onClick={() => window.print()}>
            Print Invoice
          </button>

          <button onClick={handleDownloadPDF}>
            Download PDF
          </button>
        </div>

        <div id="invoice-content">

          {/* ================= HEADER ================= */}

          <div className="invoice-title-row">

            <div className="title-line"></div>

            <h1>TAX INVOICE</h1>

            <div className="title-line"></div>

          </div>

          <div className="invoice-top-section">

            {/* LEFT LOGO */}

            <div className="invoice-logo">

              {settings?.show_logo &&
                settings?.logo_url && (
                  <img
                    src={settings.logo_url}
                    alt="Logo"
                  />
                )}

            </div>

            {/* RIGHT COMPANY */}

            <div className="invoice-company">

              <h2>
                {company?.company_name}
              </h2>

              <p>
                {company?.address}
              </p>

              <p>

                Phone :
                {" "}
                {company?.mobile}

                &nbsp;&nbsp; | &nbsp;&nbsp;

                Email :
                {" "}
                {company?.email}

              </p>

              <h4>

                GSTIN :
                {" "}
                {company?.gstin}

              </h4>

            </div>

          </div>

          <hr className="header-divider" />

          {/* ================= INFO ROW ================= */}

          <div className="invoice-info-wrapper">

            {/* LEFT */}

            <div className="invoice-info-left">

              <div className="info-row">
                <span>Invoice No.</span>
                <span>:</span>
                <strong>
                  {invoice.invoice_no}
                </strong>
              </div>

              <div className="info-row">
                <span>Invoice Date</span>
                <span>:</span>
                <strong>
                  {invoice.invoice_date}
                </strong>
              </div>

              <div className="info-row">
                <span>Vehicle No.</span>
                <span>:</span>
                <strong>
                  {invoice.vehicle_no}
                </strong>
              </div>

              <div className="info-row">
                <span>E-Way Bill No.</span>
                <span>:</span>
                <strong>
                  {invoice.eway_bill_no}
                </strong>
              </div>

            </div>

            {/* RIGHT */}

            {settings?.show_bank_details && (

              <div className="bank-card">

                <div className="bank-title">

                  Bank Details

                </div>

                <div className="bank-row">

                  <span>Bank Name</span>

                  <span>:</span>

                  <span>
                    {settings.bank_name}
                  </span>

                </div>

                <div className="bank-row">

                  <span>A/C Number</span>

                  <span>:</span>

                  <span>
                    {settings.account_number}
                  </span>

                </div>

                <div className="bank-row">

                  <span>IFSC Code</span>

                  <span>:</span>

                  <span>
                    {settings.ifsc_code}
                  </span>

                </div>

                <div className="bank-row">

                  <span>UPI ID</span>

                  <span>:</span>

                  <span>
                    {settings.upi_id}
                  </span>

                </div>

              </div>

            )}

          </div>

          {/* ================= ADDRESS ================= */}

          <div className="party-box">

            <div className="party-left">

              <h3>Bill To</h3>

              <p>
                <strong>
                  {invoice.customer_name}
                </strong>
              </p>

              <p>
                {invoice.billing_address}
              </p>

              <p>

                GSTIN :
                {" "}
                {customer?.gstin || "-"}

              </p>

              <p>

                State :
                {" "}
                {customer?.state}

              </p>

              <p>

                Place of Supply :
                {" "}
                {customer?.state}

              </p>

            </div>

            <div className="party-divider"></div>

            <div className="party-right">

              <h3>Ship To</h3>

              <p>

                <strong>
                  {invoice.shipping_name}
                </strong>

              </p>

              <p>

                {invoice.shipping_address}

              </p>

              <p>

                GSTIN :
                {" "}
                {invoice.shipping_gstin || "-"}

              </p>

              <p>

                State :
                {" "}
                {invoice.shipping_state}

              </p>

            </div>

          </div>

          {/* ================= ITEMS TABLE ================= */}

          <table className="invoice-table">

            <thead>

              <tr>

                <th>#</th>

                <th>Item</th>

                <th>HSN</th>

                <th>UOM</th>

                <th>Qty</th>

                <th>Rate (₹)</th>

                <th>GST %</th>

                <th>Amount (₹)</th>

              </tr>

            </thead>

            <tbody>

              {items.map((item, index) => (

                <tr key={item.id}>

                  <td>{index + 1}</td>

                  <td className="left-align">
                    {item.item_name}
                  </td>

                  <td>
                    {item.hsn_sac}
                  </td>

                  <td>
                    {item.unit}
                  </td>

                  <td>
                    {item.qty}
                  </td>

                  <td>
                    {item.rate}
                  </td>

                  <td>
                    {item.gst_rate}%
                  </td>

                  <td>
                    {item.amount}
                  </td>

                </tr>

              ))}

                          </tbody>

          </table>

          {/* ================= TOTALS ================= */}

          <div className="summary-section">

            <div className="summary-left">
             <div className="amount-box">

            <div className="amount-label">

              Amount in Words

            </div>

            <div className="amount-value">

              {amountInWords}

            </div>

          </div>


            </div>

            <div className="summary-right">

              <div className="summary-row">

                <span>Taxable Value</span>

                <span>:</span>

                <strong>
                  ₹ {invoice.taxable_value}
                </strong>

              </div>

              <div className="summary-row">

                <span>CGST</span>

                <span>:</span>

                <strong>
                  ₹ {invoice.cgst}
                </strong>

              </div>

              <div className="summary-row">

                <span>SGST</span>

                <span>:</span>

                <strong>
                  ₹ {invoice.sgst}
                </strong>

              </div>

              <div className="summary-row">

                <span>IGST</span>

                <span>:</span>

                <strong>
                  ₹ {invoice.igst}
                </strong>

              </div>

              <div className="grand-total">

                <span>Grand Total</span>

                <span>:</span>

                <strong>
                  ₹ {invoice.total_amount}
                </strong>

              </div>

            </div>

          </div>

          {/* ================= AMOUNT IN WORDS ================= */}

                   {/* ================= BOTTOM ================= */}

          <div className="invoice-bottom">

            <div className="invoice-bottom-left">

              {invoice?.remarks && (

                <div className="remarks-box">

                  <div className="box-title">

                    Remarks

                  </div>

                  <div className="box-body">

                    {invoice.remarks}

                  </div>

                </div>

              )}

              {settings?.show_terms_conditions &&
                settings?.terms_conditions && (

                  <div className="terms-box">

                    <div className="box-title">

                      Terms & Conditions

                    </div>

                    <div className="box-body">

                      {settings.terms_conditions}

                    </div>

                  </div>

                )}

            </div>

            <div className="invoice-bottom-right">

              {settings?.show_signature &&
                settings?.signature_url && (

                  <div className="signature-area">

                    <img
                      src={settings.signature_url}
                      alt="Signature"
                      className="signature-image"
                    />

                    <div className="signature-line"></div>

                    <p>

                      Authorized Signatory

                    </p>

                  </div>

                )}

            </div>

          </div>

          {/* ================= FOOTER ================= */}

          {settings?.show_footer &&
            settings?.invoice_footer && (

              <div className="invoice-footer-strip">

                {settings.invoice_footer}

              </div>

            )}

        </div>

      </div>

    </div>

  );

}

export default InvoicePrint;
