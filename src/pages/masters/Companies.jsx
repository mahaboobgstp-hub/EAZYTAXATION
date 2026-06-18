import { useState } from "react";
import { createCompany } from "../../services/companyService";
import "./../../css/masters/Companies.css";

export default function Companies() {
  const [formData, setFormData] = useState({
    company_name: "",
    gstin: "",
    pan: "",
    address: "",
    state: "",
    contact_person: "",
    mobile: "",
    email: "",
    financial_year: "2025-26"
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const saveCompany = async () => {
    console.log(formData);
  };
const saveCompany = async () => {

  try {

    await createCompany(formData);

    alert("Company Saved");

  } catch (err) {

    console.error(err);

    alert("Error Saving Company");

  }

};
  return (
    <div className="company-page">

      <div className="page-header">
        <h2>Company Master</h2>
      </div>

      <div className="company-form">

        <input
          name="company_name"
          placeholder="Company Name"
          value={formData.company_name}
          onChange={handleChange}
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

        <textarea
          name="address"
          placeholder="Address"
          value={formData.address}
          onChange={handleChange}
        />

        <input
          name="state"
          placeholder="State"
          value={formData.state}
          onChange={handleChange}
        />

        <input
          name="contact_person"
          placeholder="Contact Person"
          value={formData.contact_person}
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

        <button onClick={saveCompany}>
          Save Company
        </button>

      </div>

    </div>
  );
}
