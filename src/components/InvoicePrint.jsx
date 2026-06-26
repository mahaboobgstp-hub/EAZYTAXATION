import React from "react";
import "../css/sales/InvoicePrint.css";
import {
  numberToWords
} from "../utils/numberToWords";

function InvoicePrint({ invoice, items, settings, company, customer, onClose }) {

  if (!invoice) return null;
  
const amountInWords =
  numberToWords(
    Number(invoice.total_amount || 0)
  );
  console.log(
  "Invoice Settings:",
  settings
);

  const handleDownloadPDF = () => {
  const element = document.getElementById("invoice-content");

  if (!element) {
    alert("Invoice content not found.");
    return;
  }

  if (!window.html2pdf) {
    alert("PDF library not loaded.");
    return;
  }

  const fileName = `${invoice.invoice_no}.pdf`;

  const options = {
    margin: 5,
    filename: fileName,
    image: {
      type: "jpeg",
      quality: 1
    },
    html2canvas: {
      scale: 2,
      useCORS: true,
      scrollY: 0
    },
    jsPDF: {
      unit: "mm",
      format: "a4",
      orientation: "portrait"
    }
  };

  window.html2pdf()
    .set(options)
    .from(element)
    .save();
};
  return (

    <div className="invoice-overlay">

    <div className="invoice-print">

      <div className="invoice-header">

        <button
  onClick={onClose}
>
  Close
</button>
<button
  onClick={() =>
    window.print()
  }
>
  Print Invoice
</button>
        <button onClick={handleDownloadPDF}>
  Download PDF
</button>
        <h1>TAX INVOICE</h1>
        <div id="invoice-content">

       <div className="company-header">

  <div className="company-logo">

    {
      settings?.show_logo &&
      settings?.logo_url && (

        <img
          src={settings.logo_url}
          alt="Logo"
          style={{
            width: "120px"
          }}
        />

      )
    }

  </div>

  <div className="company-details">

    <h2>
      {company?.company_name}
    </h2>

    <p>
      {company?.address}
    </p>

    <p>
      GSTIN :
      {company?.gstin}
    </p>

    <p>
      Mobile :
      {company?.mobile}
    </p>

    <p>
      Email :
      {company?.email}
    </p>

  </div>

</div>
        

        <div>
          <strong>Invoice No :</strong>
          {invoice.invoice_no}
        </div>

        <div>
          <strong>Invoice Date :</strong>
          {invoice.invoice_date}
        </div>

        <div>
          <strong>Vehicle No :</strong>
          {invoice.vehicle_no}
        </div>

        <div>
          <strong>E-Way Bill :</strong>
          {invoice.eway_bill_no}
        </div>

      </div>

      <div className="address-section">

        <div>

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
    {customer?.gstin || "-"}
  </p>

  <p>
    State :
    {customer?.state}
  </p>

  <p>
  Place of Supply :
  {customer?.state}
</p>

</div>

        <div>

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
    {invoice.shipping_gstin || "-"}
  </p>

  <p>
    State :
    {invoice.shipping_state}
  </p>

</div>
        </div>
      <table className="invoice-table">

        <thead>

          <tr>
            <th>#</th>
            <th>Item</th>
            <th>HSN</th>
            <th>UOM</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>GST %</th>
            <th>Amount</th>
          </tr>

        </thead>

        <tbody>

          {items.map((item, index) => (

            <tr key={item.id}>

              <td>
                {index + 1}
              </td>

              <td>
                {item.item_name}
              </td>

              <td>
                {item.hsn_sac}
              </td>

              <td>
                {item.uom}
              </td>

              <td>
                {item.qty}
              </td>

              <td>
                {item.rate}
              </td>

              <td>
                {item.gst_rate}
              </td>

              <td>
                {item.amount}
              </td>

            </tr>

          ))}

        </tbody>

      </table>

      <div className="invoice-totals">

        <div>
          Taxable Value :
          ₹ {invoice.taxable_value}
        </div>

        <div>
          CGST :
          ₹ {invoice.cgst}
        </div>

        <div>
          SGST :
          ₹ {invoice.sgst}
        </div>

        <div>
          IGST :
          ₹ {invoice.igst}
        </div>

        <h2>
          Grand Total :
          ₹ {invoice.total_amount}
        </h2>
        <div
  style={{
    marginTop: "20px",
    padding: "10px",
    border: "1px solid #ccc",
    textAlign: "left",
    fontWeight: "bold"
  }}
>

  Amount in Words:

  <br />

  {amountInWords}

</div>
        {
  invoice?.remarks && (

    <div
      className="invoice-remarks"
    >

      <h3>
        Remarks
      </h3>

      <p>
        {invoice.remarks}
      </p>

    </div>

  )
}
               {
  settings?.show_terms_conditions &&
  settings?.terms_conditions && (

    <div
      className="invoice-terms"
    >

      <h3>
        Terms & Conditions
      </h3>

      <p>
        {settings.terms_conditions}
      </p>

    </div>

  )
}
        {
  settings?.show_footer &&
  settings?.invoice_footer && (

    <div
      className="invoice-footer"
    >

      {settings.invoice_footer}

    </div>

  )
}
       {
  settings?.show_bank_details && (

    <div
      style={{
        marginTop: "30px"
      }}
    >

      <h3>
        Bank Details
      </h3>

      <p>
        Bank :
        {settings.bank_name}
      </p>

      <p>
        A/C :
        {settings.account_number}
      </p>

      <p>
        IFSC :
        {settings.ifsc_code}
      </p>

      <p>
        UPI :
        {settings.upi_id}
      </p>

    </div>

  )
}

{
  settings?.show_signature &&
  settings?.signature_url && (

    <div
      style={{
        marginTop: "30px",
        textAlign: "right"
      }}
    >

      <img
        src={settings.signature_url}
        alt="Signature"
        style={{
          width: "180px"
        }}
      />

      <p>
        Authorized Signatory
      </p>

    </div>

  )
}
       
    </div>

        </div>

    </div>
      </div>
    
      
  );
}

export default InvoicePrint;
