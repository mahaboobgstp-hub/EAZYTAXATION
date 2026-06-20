import React from "react";
import "../css/sales/InvoicePrint.css";

function InvoicePrint({ invoice, items }) {

  if (!invoice) return null;

  return (

    
    <div className="invoice-print">

      <div className="invoice-header">
<button
  onClick={() =>
    window.print()
  }
>
  Print Invoice
</button>
        <h1>TAX INVOICE</h1>

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

      </div>

    </div>
  );
}

export default InvoicePrint;
