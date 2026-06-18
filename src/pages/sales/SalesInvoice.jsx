import React, { useEffect, useState } from 'react';

import '../../css/sales/SalesInvoice.css';

import {
  getCustomersForDropdown,
  saveSalesInvoice,
  getSalesInvoices
} from '../../services/salesInvoiceService';

function SalesInvoice() {

  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);

  const [formData, setFormData] = useState({
    invoice_no: '',
    invoice_date: '',
    customer_id: '',
    customer_name: '',
    remarks: ''
  });

  useEffect(() => {
    loadCustomers();
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

  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      await saveSalesInvoice({
        ...formData,
        taxable_value: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        total_amount: 0
      });

      alert('Sales Invoice Saved');

      setFormData({
        invoice_no: '',
        invoice_date: '',
        customer_id: '',
        customer_name: '',
        remarks: ''
      });

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
