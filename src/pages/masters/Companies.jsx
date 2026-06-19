import React, { useEffect, useState } from 'react';
import '../../css/masters/Companies.css';
import { getStates }
from '../../services/stateService';

import {
  createCompany,
  getCompanies
} from '../../services/companyService';

function Companies() {

  const [companies, setCompanies] = useState([]);
  const [states, setStates] =
  useState([]);
  const [formData, setFormData] = useState({
    company_name: '',
    gstin: '',
    pan: '',
    address: '',
    state: '',
    contact_person: '',
    mobile: '',
    email: '',
    financial_year: ''
  });

  useEffect(() => {
    loadStates();
    loadCompanies();
  }, []);
const loadStates = async () => {

  try {

    const data =
      await getStates();

    setStates(data || []);

  } catch (error) {

    console.error(error);

  }
};
  const loadCompanies = async () => {
    try {
      const data = await getCompanies();
      setCompanies(data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {

      await createCompany(formData);

      alert('Company saved successfully');

      setFormData({
        company_name: '',
        gstin: '',
        pan: '',
        address: '',
        state: '',
        contact_person: '',
        mobile: '',
        email: '',
        financial_year: ''
      });

      await loadCompanies();

    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  return (
    <div className="companies-page">

      <h2>Companies Master</h2>

      <form
        className="company-form"
        onSubmit={handleSubmit}
      >

        <input
          type="text"
          name="company_name"
          placeholder="Company Name"
          value={formData.company_name}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="gstin"
          placeholder="GSTIN"
          value={formData.gstin}
          onChange={handleChange}
        />

        <input
          type="text"
          name="pan"
          placeholder="PAN"
          value={formData.pan}
          onChange={handleChange}
        />

        <input
          type="text"
          name="contact_person"
          placeholder="Contact Person"
          value={formData.contact_person}
          onChange={handleChange}
        />

        <input
          type="text"
          name="mobile"
          placeholder="Mobile"
          value={formData.mobile}
          onChange={handleChange}
        />

        <input
          type="email"
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

        <input
          type="text"
          name="financial_year"
          placeholder="Financial Year"
          value={formData.financial_year}
          onChange={handleChange}
        />

        <textarea
          name="address"
          placeholder="Address"
          value={formData.address}
          onChange={handleChange}
        />

        <button type="submit">
          Save Company
        </button>

      </form>

      <table className="company-grid">

        <thead>
          <tr>
            <th>Company Name</th>
            <th>GSTIN</th>
            <th>PAN</th>
            <th>Contact Person</th>
            <th>Mobile</th>
            <th>Email</th>
          </tr>
        </thead>

        <tbody>

          {companies.length > 0 ? (
            companies.map((company) => (
              <tr key={company.id}>
                <td>{company.company_name}</td>
                <td>{company.gstin}</td>
                <td>{company.pan}</td>
                <td>{company.contact_person}</td>
                <td>{company.mobile}</td>
                <td>{company.email}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6">
                No companies found
              </td>
            </tr>
          )}

        </tbody>

      </table>

    </div>
  );
}

export default Companies;
