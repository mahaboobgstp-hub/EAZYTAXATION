import React from 'react';

function SalesInvoiceView({
  invoice,
  items,
  onClose
}) {

  if (!invoice) return null;

  return (

    <div className="invoice-modal">

      <div className="invoice-modal-content">

        <h2>Invoice Details</h2>

        <p>
          <strong>Invoice No:</strong>
          {invoice.invoice_no}
        </p>

        <p>
          <strong>Date:</strong>
          {invoice.invoice_date}
        </p>

        <p>
          <strong>Customer:</strong>
          {invoice.customer_name}
        </p>

        <table className="sales-grid">

          <thead>

            <tr>
              <th>Item</th>
              <th>HSN</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>GST %</th>
              <th>Amount</th>
            </tr>

          </thead>

          <tbody>

            {items.map(item => (

              <tr key={item.id}>

                <td>{item.item_name}</td>
                <td>{item.hsn_sac}</td>
                <td>{item.qty}</td>
                <td>{item.rate}</td>
                <td>{item.gst_rate}</td>
                <td>{item.amount}</td>

              </tr>

            ))}

          </tbody>

        </table>

        <h3>
          Taxable Value:
          ₹ {invoice.taxable_value}
        </h3>

        <h3>
          GST:
          ₹ {invoice.igst}
        </h3>

        <h2>
          Grand Total:
          ₹ {invoice.total_amount}
        </h2>

        <button
          onClick={onClose}
        >
          Close
        </button>

      </div>

    </div>

  );
}

export default SalesInvoiceView;
