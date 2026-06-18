import React, { useEffect, useState } from 'react';

import '../../css/masters/Customers.css';

import {
  createCustomer,
  getCustomers
} from '../../services/customerService';

function Customers() {

  const [customers, setCustomers] = useState([]);

  const [formData, setFormData] = useState({
    customer_name: '',
    gstin: '',
    pan: '',
    mobile: '',
    email: '',
    address: '',
    state: ''
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await getCustomers();
      setCustomers(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      await createCustomer(formData);

      alert('Customer Saved Successfully');

      setFormData({
        customer_name: '',
        gstin: '',
        pan: '',
        mobile: '',
        email: '',
        address: '',
        state: ''
      });

      loadCustomers();

    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="customers-page">

      <h2>Customers Master</h2>

      <form
        className="customer-form"
        onSubmit={handleSubmit}
      >

        <input
          name="customer_name"
          placeholder="Customer Name"
          value={formData.customer_name}
          onChange={handleChange}
          required
        />

        <input
          name="gstin"
          placeholder="GSTIN"
          value={formData.gstin}
          onChange={handleChange}
        />

        <input
          name="pan"
          placeholder="PAN"
          value={formData.pan}
          onChange={handleChange}
        />

        <input
          name="mobile"
          placeholder="Mobile"
          value={formData.mobile}
          onChange={handleChange}
        />

        <input
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
        />

        <input
          name="state"
          placeholder="State"
          value={formData.state}
          onChange={handleChange}
        />

        <textarea
          name="address"
          placeholder="Address"
          value={formData.address}
          onChange={handleChange}
        />

        <button type="submit">
          Save Customer
        </button>

      </form>

      <table className="customer-grid">

        <thead>
          <tr>
            <th>Customer Name</th>
            <th>GSTIN</th>
            <th>PAN</th>
            <th>Mobile</th>
            <th>Email</th>
          </tr>
        </thead>

        <tbody>

          {customers.length > 0 ? (

            customers.map((customer) => (

              <tr key={customer.id}>
                <td>{customer.customer_name}</td>
                <td>{customer.gstin}</td>
                <td>{customer.pan}</td>
                <td>{customer.mobile}</td>
                <td>{customer.email}</td>
              </tr>

            ))

          ) : (

            <tr>
              <td colSpan="5">
                No customers found
              </td>
            </tr>

          )}

        </tbody>

      </table>

    </div>
  );
}

export default Customers;
