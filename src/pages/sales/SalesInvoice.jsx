import React, { useEffect, useState } from 'react';

import '../../css/sales/SalesInvoice.css';

import {
  getCustomersForDropdown,
  getItemsForDropdown,
  saveSalesInvoice,
  getSalesInvoices
} from '../../services/salesInvoiceService';

function SalesInvoice() {

  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [itemsMaster, setItemsMaster] = useState([]);

  const [formData, setFormData] = useState({
    invoice_no: '',
    invoice_date: '',
    customer_id: '',
    customer_name: '',
    remarks: ''
  });

  const [items, setItems] = useState([
  {
    item_id: '',
    item_name: '',
    hsn_sac: '',
    gst_rate: 18,
    qty: 1,
    rate: 0,
    amount: 0
  }
]);

  useEffect(() => {
    loadCustomers();
    loadItemsMaster();
    loadInvoices();
  }, []);

  const loadCustomers = async () => {

    try {
      const data = await getCustomersForDropdown();
      setCustomers(data || []);
    } catch (error) {
      console.error(error);
    }
  };
const loadItemsMaster = async () => {

  try {

    const data =
      await getItemsForDropdown();

    setItemsMaster(data || []);

  } catch (error) {

    console.error(error);

  }
};
  const loadInvoices = async () => {

    try {
      const data = await getSalesInvoices();
      setInvoices(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (e) => {

    const { name, value } = e.target;

    if (name === 'customer_id') {

      const selectedCustomer =
        customers.find(
          customer => customer.id === value
        );

      setFormData({
        ...formData,
        customer_id: value,
        customer_name:
          selectedCustomer?.customer_name || ''
      });

      return;
    }

    setFormData({
      ...formData,
      [name]: value
    });
  };

  const addRow = () => {

  setItems([
    ...items,
    {
      item_id: '',
      item_name: '',
      hsn_sac: '',
      gst_rate: 18,
      qty: 1,
      rate: 0,
      amount: 0
    }
  ]);
};
  const removeRow = (index) => {

    const updated = [...items];

    updated.splice(index, 1);

    setItems(updated);
  };

  const handleItemChange = (
  index,
  field,
  value
) => {

  const updated = [...items];

  if (field === 'item_id') {

    const selectedItem =
      itemsMaster.find(
        item => item.id === value
      );

    if (selectedItem) {

      updated[index] = {

        ...updated[index],

        item_id: selectedItem.id,

        item_name:
          selectedItem.item_name,

        hsn_sac:
          selectedItem.hsn_sac,

        gst_rate:
          selectedItem.gst_rate,

        rate:
          selectedItem.sales_rate,

        qty: 1,

        amount:
          Number(
            selectedItem.sales_rate
          )
      };
    }

  } else {

    updated[index][field] = value;

    const qty =
      Number(updated[index].qty) || 0;

    const rate =
      Number(updated[index].rate) || 0;

    updated[index].amount =
      qty * rate;
  }

  setItems(updated);
};

  const taxableValue = items.reduce(
    (sum, item) =>
      sum + Number(item.amount || 0),
    0
  );

  const totalGST = items.reduce(
    (sum, item) =>
      sum +
      (
        Number(item.amount || 0) *
        Number(item.gst_rate || 0)
      ) / 100,
    0
  );

  const grandTotal =
    taxableValue + totalGST;

  const handleSubmit = async (e) => {

  e.preventDefault();

  try {

    const invoiceHeader = {

      ...formData,

      taxable_value: taxableValue,

      cgst: 0,

      sgst: 0,

      igst: totalGST,

      total_amount: grandTotal

    };

    await saveSalesInvoice(
      invoiceHeader,
      items
    );

    alert('Sales Invoice Saved');

    setFormData({
      invoice_no: '',
      invoice_date: '',
      customer_id: '',
      customer_name: '',
      remarks: ''
    });

    setItems([
      {
        item_id: '',
        item_name: '',
        hsn_sac: '',
        gst_rate: 18,
        qty: 1,
        rate: 0,
        amount: 0
      }
    ]);

    loadInvoices();

  } catch (error) {

    alert(error.message);

  }
};
  return (
    <div className="sales-page">

      <h2>Sales Invoice</h2>

      <form
        className="sales-form"
        onSubmit={handleSubmit}
      >

        <input
          name="invoice_no"
          placeholder="Invoice Number"
          value={formData.invoice_no}
          onChange={handleChange}
          required
        />

        <input
          type="date"
          name="invoice_date"
          value={formData.invoice_date}
          onChange={handleChange}
          required
        />

        <select
          name="customer_id"
          value={formData.customer_id}
          onChange={handleChange}
          required
        >

          <option value="">
            Select Customer
          </option>

          {customers.map(customer => (

            <option
              key={customer.id}
              value={customer.id}
            >
              {customer.customer_name}
            </option>

          ))}

        </select>

        <textarea
          name="remarks"
          placeholder="Remarks"
          value={formData.remarks}
          onChange={handleChange}
        />

        <button type="submit">
          Save Invoice
        </button>

      </form>

      <h3>Invoice Items</h3>

      <table className="sales-grid">

        <thead>

          <tr>
            <th>Particulars</th>
            <th>Qty</th>
            <th>HSN/SAC</th>
            <th>Rate</th>
            <th>GST %</th>
            <th>Amount</th>
            <th>Action</th>
          </tr>

        </thead>

        <tbody>

          {items.map((item, index) => (

            <tr key={index}>

              <td>

  <select
    value={item.item_id}
    onChange={(e) =>
      handleItemChange(
        index,
        'item_id',
        e.target.value
      )
    }
  >

    <option value="">
      Select Item
    </option>

    {itemsMaster.map(masterItem => (

      <option
        key={masterItem.id}
        value={masterItem.id}
      >
        {masterItem.item_name}
      </option>

    ))}

  </select>

</td>

              <td>

                <input
                  type="number"
                  value={item.qty}
                  onChange={(e) =>
                    handleItemChange(
                      index,
                      'qty',
                      e.target.value
                    )
                  }
                />

              </td>
             <td>
  {item.hsn_sac}
</td>
              <td>

                <input
                  type="number"
                  value={item.rate}
                  onChange={(e) =>
                    handleItemChange(
                      index,
                      'rate',
                      e.target.value
                    )
                  }
                />

              </td>
              

              <td>

                <input
                  type="number"
                  value={item.gst_rate}
                  onChange={(e) =>
                    handleItemChange(
                      index,
                      'gst_rate',
                      e.target.value
                    )
                  }
                />

              </td>

              <td>
                {item.amount}
              </td>

              <td>

                <button
                  type="button"
                  onClick={() =>
                    removeRow(index)
                  }
                >
                  Delete
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

      <button
        type="button"
        onClick={addRow}
      >
        Add Row
      </button>

      <div className="sales-totals">

        <h3>
          Taxable Value :
          ₹ {taxableValue.toFixed(2)}
        </h3>

        <h3>
          GST :
          ₹ {totalGST.toFixed(2)}
        </h3>

        <h2>
          Grand Total :
          ₹ {grandTotal.toFixed(2)}
        </h2>

      </div>

      <h3>Previous Invoices</h3>

      <table className="sales-grid">

        <thead>
          <tr>
            <th>Invoice No</th>
            <th>Date</th>
            <th>Customer</th>
            <th>Total Amount</th>
          </tr>
        </thead>

        <tbody>

          {invoices.map(invoice => (

            <tr key={invoice.id}>
              <td>{invoice.invoice_no}</td>
              <td>{invoice.invoice_date}</td>
              <td>{invoice.customer_name}</td>
              <td>{invoice.total_amount}</td>
            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}

export default SalesInvoice;
