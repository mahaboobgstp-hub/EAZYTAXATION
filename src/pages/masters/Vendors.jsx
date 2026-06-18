import React, { useEffect, useState } from 'react';

import '../../css/masters/Vendors.css';

import {
  createVendor,
  getVendors
} from '../../services/vendorService';

function Vendors() {

  const [vendors, setVendors] = useState([]);

  const [formData, setFormData] = useState({
    vendor_name: '',
    gstin: '',
    pan: '',
    mobile: '',
    email: '',
    address: '',
    state: ''
  });

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      const data = await getVendors();
      setVendors(data || []);
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

      await createVendor(formData);

      alert('Vendor Saved Successfully');

      setFormData({
        vendor_name: '',
        gstin: '',
        pan: '',
        mobile: '',
        email: '',
        address: '',
        state: ''
      });

      loadVendors();

    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="vendors-page">

      <h2>Vendors Master</h2>

      <form
        className="vendor-form"
        onSubmit={handleSubmit}
      >

        <input
          name="vendor_name"
          placeholder="Vendor Name"
          value={formData.vendor_name}
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
          Save Vendor
        </button>

      </form>

      <table className="vendor-grid">

        <thead>
          <tr>
            <th>Vendor Name</th>
            <th>GSTIN</th>
            <th>PAN</th>
            <th>Mobile</th>
            <th>Email</th>
          </tr>
        </thead>

        <tbody>

          {vendors.length > 0 ? (

            vendors.map((vendor) => (

              <tr key={vendor.id}>
                <td>{vendor.vendor_name}</td>
                <td>{vendor.gstin}</td>
                <td>{vendor.pan}</td>
                <td>{vendor.mobile}</td>
                <td>{vendor.email}</td>
              </tr>

            ))

          ) : (

            <tr>
              <td colSpan="5">
                No vendors found
              </td>
            </tr>

          )}

        </tbody>

      </table>

    </div>
  );
}

export default Vendors;
