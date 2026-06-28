import React, { useEffect, useState } from 'react';
import { getStates }
from '../../services/stateService';

import '../../css/masters/Vendors.css';

import {
  createVendor,
  getVendors,
  updateVendor,
  deleteVendor
} from '../../services/vendorService';

function Vendors() {

  const [vendors, setVendors] = useState([]);
  const [states, setStates] = useState([]);
  const [editingId, setEditingId] = useState(null);

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
    loadStates()
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
const loadStates = async () => {

  try {

    const data =
      await getStates();

    setStates(data || []);

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
const handleEdit = (vendor) => {

    setEditingId(vendor.id);

    setFormData({

        vendor_name: vendor.vendor_name,
        gstin: vendor.gstin,
        phone: vendor.phone,
        email: vendor.email,
        address: vendor.address,
        state: vendor.state

    });

};
  const handleDelete = async (id) => {

    const confirmDelete = window.confirm(
        "Are you sure you want to delete this vendor?"
    );

    if (!confirmDelete) return;

    try {

        await deleteVendor(id);

        alert("Vendor deleted successfully.");

        loadVendors();

    } catch (error) {

        alert(error.message);

    }

};
  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      if (editingId) {

    await updateVendor(
        editingId,
        formData
    );

    alert("Vendor Updated Successfully");

} else {

    await createVendor(formData);

    alert("Vendor Saved Successfully");

}

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

        <select
  name="state"
  value={formData.state}
  onChange={handleChange}
>

  <option value="">
    Select State
  </option>

  {states.map(state => (

    <option
      key={state.id}
      value={state.state_name}
    >
      {state.state_name}
    </option>

  ))}

</select>

        <textarea
          name="address"
          placeholder="Address"
          value={formData.address}
          onChange={handleChange}
        />

        <button type="submit">
    {editingId ? "Update Vendor" : "Save Vendor"}
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
            <th>Action</th>
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
              <td>

    <button
        type="button"
        onClick={() => handleEdit(vendor)}
    >
        Edit
    </button>

    <button
        type="button"
        onClick={() => handleDelete(vendor.id)}
    >
        Delete
    </button>

</td>
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
