import React, { useEffect, useState } from 'react';
import '../../css/Companies.css';

import {
  saveCompany,
  getCompanies
} from '../../services/companyService';

function Companies() {

  const [companies, setCompanies] = useState([]);

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
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const data = await getCompanies();
      setCompanies(data);
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
      await saveCompany(formData);

      alert('Company Saved Successfully');

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

      loadCompanies();

    } catch (error) {
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
          name="company_name"
          placeholder="Company Name"
          value={formData.company_name}
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
            <th>Mobile</th>
            <th>Email</th>
          </tr>
        </thead>

        <tbody>

          {companies.map((company) => (
            <tr key={company.id}>
              <td>{company.company_name}</td>
              <td>{company.gstin}</td>
              <td>{company.pan}</td>
              <td>{company.mobile}</td>
              <td>{company.email}</td>
            </tr>
          ))}

        </tbody>

      </table>

    </div>
  );
}

export default Companies;
