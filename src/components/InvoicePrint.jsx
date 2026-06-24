import React from "react";
import "../css/sales/InvoicePrint.css";

function InvoicePrint({ invoice, items, settings, onClose }) {

  if (!invoice) return null;
  console.log(
  "Invoice Settings:",
  settings
);

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
        <h1>TAX INVOICE</h1>

       
        {
  settings?.show_logo &&
  settings?.logo_url && (

    <img
      src={settings.logo_url}
      alt="Company Logo"
      style={{
        width: "150px",
        marginBottom: "10px"
      }}
    />

  )
}

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
            {invoice.customer_name}
          </p>

          <p>
            {invoice.billing_address}
          </p>

        </div>

        <div>

          <h3>Ship To</h3>

          <p>
            {invoice.shipping_address}
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

  )
}

      </div>

    </div>
    
      
  );
}

export default InvoicePrint;
