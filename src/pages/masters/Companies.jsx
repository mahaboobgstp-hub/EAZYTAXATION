import React, { useEffect, useState } from 'react';
import '../../css/masters/Companies.css';
import { getStates } from '../../services/stateService';
import { createCompany, getCompanies } from '../../services/companyService';

const initialForm = {
  company_name: '',
  constitution_type: '',
  pan: '',
  industry: '',
  state: '',
  address: '',
  contact_person: '',
  mobile: '',
  email: '',
  gst_registered: false,
  gstin: '',
  gst_registration_type: '',
  accounting_enabled: false,
  financial_year: 'April-March',
  financial_year_start_month: '4',
  books_beginning_date: '',
  currency_code: 'INR',
  multi_location_enabled: false
};

function Companies() {
  const [companies, setCompanies] = useState([]);
  const [states, setStates] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadStates();
    loadCompanies();
  }, []);

  const loadStates = async () => {
    try {
      const data = await getStates();
      setStates(data || []);
    } catch (error) {
      console.error('Error loading states:', error);
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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => {
      const next = { ...previous, [name]: value };
      if (name === 'gst_registered' && value === 'false') {
        next.gstin = '';
        next.gst_registration_type = '';
      }
      if (name === 'accounting_enabled' && value === 'false') {
        next.books_beginning_date = '';
      }
      if (name === 'financial_year') {
        if (value === 'April-March') next.financial_year_start_month = '4';
        if (value === 'January-December') next.financial_year_start_month = '1';
        if (value !== 'Custom') next.custom_financial_year_month = '';
      }
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        gst_registered: formData.gst_registered === true,
        accounting_enabled: formData.accounting_enabled === true,
        multi_location_enabled: formData.multi_location_enabled === true,
        financial_year_start_month: Number(formData.financial_year_start_month),
        gstin: formData.gst_registered ? formData.gstin.trim().toUpperCase() : null,
        gst_registration_type: formData.gst_registered ? formData.gst_registration_type : null,
        books_beginning_date: formData.accounting_enabled ? formData.books_beginning_date : null,
        pan: formData.pan.trim().toUpperCase() || null,
        financial_year: formData.financial_year === 'Custom'
          ? `Custom (starts month ${formData.financial_year_start_month})`
          : formData.financial_year
      };
      delete payload.custom_financial_year_month;
      await createCompany(payload);
      alert('Company created successfully.');
      setFormData(initialForm);
      await loadCompanies();
    } catch (error) {
      console.error('Error creating company:', error);
      alert(error.message || 'Unable to create company. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="companies-page">
      <div className="companies-heading">
        <div>
          <h2>Company Creation</h2>
          <p>Enter your business details to set up your company in SYD.</p>
        </div>
      </div>

      <form className="company-onboarding-form" onSubmit={handleSubmit}>
        <section className="company-form-section">
          <div className="company-section-heading">
            <span className="company-step">1</span>
            <div><h3>Business Details</h3><p>Basic identity and contact information</p></div>
          </div>
          <div className="company-fields">
            <label className="company-field company-field-wide">
              <span>Business / Company Name *</span>
              <input name="company_name" value={formData.company_name} onChange={handleChange} required maxLength="150" placeholder="Enter registered business name" />
            </label>
            <label className="company-field">
              <span>Business Constitution</span>
              <select name="constitution_type" value={formData.constitution_type} onChange={handleChange}>
                <option value="">Select constitution</option>
                {['Proprietorship', 'Partnership', 'LLP', 'Private Limited', 'Public Limited', 'Other'].map(item => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="company-field">
              <span>PAN</span>
              <input name="pan" value={formData.pan} onChange={handleChange} maxLength="10" placeholder="PAN (if available)" />
            </label>
            <label className="company-field">
              <span>Industry</span>
              <select name="industry" value={formData.industry} onChange={handleChange}>
                <option value="">Select industry</option>
                {['Manufacturing', 'Trading', 'Services', 'Construction', 'Retail', 'Professional Services', 'Other'].map(item => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="company-field">
              <span>State *</span>
              <select name="state" value={formData.state} onChange={handleChange} required>
                <option value="">Select state</option>
                {states.map(state => <option key={state.id} value={state.state_name}>{state.state_name}</option>)}
              </select>
            </label>
            <label className="company-field company-field-wide">
              <span>Business Address</span>
              <textarea name="address" value={formData.address} onChange={handleChange} rows="2" placeholder="Registered / principal place of business" />
            </label>
            <label className="company-field">
              <span>Contact Person</span>
              <input name="contact_person" value={formData.contact_person} onChange={handleChange} placeholder="Contact person name" />
            </label>
            <label className="company-field">
              <span>Business Mobile</span>
              <input name="mobile" type="tel" value={formData.mobile} onChange={handleChange} maxLength="15" placeholder="Mobile number" />
            </label>
            <label className="company-field">
              <span>Business Email</span>
              <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="name@business.com" />
            </label>
          </div>
        </section>

        <section className="company-form-section">
          <div className="company-section-heading">
            <span className="company-step">2</span>
            <div><h3>Tax Registration</h3><p>Configure GST applicability for this business</p></div>
          </div>
          <div className="company-fields">
            <div className="company-field company-field-wide">
              <span>Is this business registered under GST? *</span>
              <div className="company-choice-row">
                <label><input type="radio" name="gst_registered" value="true" checked={formData.gst_registered === true} onChange={() => setFormData(p => ({ ...p, gst_registered: true }))} /> Yes</label>
                <label><input type="radio" name="gst_registered" value="false" checked={formData.gst_registered === false} onChange={() => setFormData(p => ({ ...p, gst_registered: false, gstin: '', gst_registration_type: '' }))} /> No</label>
              </div>
            </div>
            {formData.gst_registered && <>
              <label className="company-field">
                <span>GSTIN *</span>
                <input name="gstin" value={formData.gstin} onChange={handleChange} required maxLength="15" placeholder="15-character GSTIN" />
              </label>
              <label className="company-field">
                <span>GST Registration Type *</span>
                <select name="gst_registration_type" value={formData.gst_registration_type} onChange={handleChange} required>
                  <option value="">Select registration type</option>
                  <option value="Regular">Regular</option>
                  <option value="Composition">Composition</option>
                  <option value="Other">Other</option>
                </select>
              </label>
            </>}
          </div>
        </section>

        <section className="company-form-section">
          <div className="company-section-heading">
            <span className="company-step">3</span>
            <div><h3>Accounting & Financial Year</h3><p>Choose how you want to use SYD for this company</p></div>
          </div>
          <div className="company-fields">
            <div className="company-field company-field-wide">
              <span>Would you like to maintain books of accounts in SYD? *</span>
              <div className="company-choice-row">
                <label><input type="radio" name="accounting_enabled" value="true" checked={formData.accounting_enabled === true} onChange={() => setFormData(p => ({ ...p, accounting_enabled: true }))} /> Yes – Enable Accounting</label>
                <label><input type="radio" name="accounting_enabled" value="false" checked={formData.accounting_enabled === false} onChange={() => setFormData(p => ({ ...p, accounting_enabled: false, books_beginning_date: '' }))} /> No – Billing Only</label>
              </div>
              <small>Billing-only companies can enable accounting later without recreating their company or invoices.</small>
            </div>
            <label className="company-field">
              <span>Financial Year *</span>
              <select name="financial_year" value={formData.financial_year} onChange={handleChange} required>
                <option value="April-March">April – March (India default)</option>
                <option value="January-December">January – December</option>
                <option value="Custom">Custom start month</option>
              </select>
            </label>
            {formData.financial_year === 'Custom' && <label className="company-field">
              <span>Financial Year Start Month *</span>
              <select name="financial_year_start_month" value={formData.financial_year_start_month} onChange={handleChange} required>
                {['January','February','March','April','May','June','July','August','September','October','November','December'].map((month, index) => <option key={month} value={index + 1}>{month}</option>)}
              </select>
            </label>}
            {formData.accounting_enabled && <label className="company-field">
              <span>Books Beginning Date *</span>
              <input type="date" name="books_beginning_date" value={formData.books_beginning_date} onChange={handleChange} required />
              <small>Date from which you want to maintain accounting entries. This is separate from the financial-year start.</small>
            </label>}
            <div className="company-field">
              <span>Base Currency</span>
              <input value="INR – Indian Rupee" disabled />
              <small>Default currency for this company.</small>
            </div>
          </div>
        </section>

        <section className="company-form-section">
          <div className="company-section-heading">
            <span className="company-step">4</span>
            <div><h3>Business Locations</h3><p>Additional branches can be configured after company creation</p></div>
          </div>
          <div className="company-field company-field-wide">
            <span>Does your business operate from multiple locations?</span>
            <div className="company-choice-row">
              <label><input type="radio" name="multi_location_enabled" value="true" checked={formData.multi_location_enabled === true} onChange={() => setFormData(p => ({ ...p, multi_location_enabled: true }))} /> Yes</label>
              <label><input type="radio" name="multi_location_enabled" value="false" checked={formData.multi_location_enabled === false} onChange={() => setFormData(p => ({ ...p, multi_location_enabled: false }))} /> No</label>
            </div>
          </div>
        </section>

        <div className="company-form-actions">
          <button type="submit" disabled={saving}>{saving ? 'Saving Company…' : 'Create Company'}</button>
        </div>
      </form>

      <section className="company-list-section">
        <h3>Existing Companies</h3>
        <div className="company-table-wrap">
          <table className="company-grid">
            <thead><tr><th>Company Name</th><th>GSTIN</th><th>PAN</th><th>Accounting</th><th>State</th><th>Contact Person</th><th>Mobile</th><th>Email</th></tr></thead>
            <tbody>
              {companies.length ? companies.map(company => <tr key={company.id}>
                <td>{company.company_name}</td><td>{company.gstin || '—'}</td><td>{company.pan || '—'}</td>
                <td>{company.accounting_enabled ? 'Enabled' : 'Billing Only'}</td><td>{company.state || '—'}</td>
                <td>{company.contact_person || '—'}</td><td>{company.mobile || '—'}</td><td>{company.email || '—'}</td>
              </tr>) : <tr><td colSpan="8">No companies found</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Companies;
