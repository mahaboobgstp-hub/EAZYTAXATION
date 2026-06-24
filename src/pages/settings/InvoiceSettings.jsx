import React, {
  useEffect,
  useState
} from "react";

import "../../css/settings/InvoiceSettings.css";

import {
  getCompanies
} from "../../services/companyService";

import {
  getInvoiceSettings,
  saveInvoiceSettings
} from "../../services/invoiceSettingsService";

function InvoiceSettings() {

  const [companies, setCompanies] =
    useState([]);

  const [formData, setFormData] =
    useState({

      company_id: "",

      logo_url: "",

      signature_url: "",

      bank_name: "",

      account_number: "",

      ifsc_code: "",

      upi_id: "",

      invoice_footer: "",

      terms_conditions: ""

    });

  useEffect(() => {

    loadCompanies();

  }, []);

  const loadCompanies = async () => {

    try {

      const data =
        await getCompanies();

      setCompanies(data || []);

    } catch (error) {

      console.error(error);

    }
  };

  const handleChange = (e) => {

    setFormData({

      ...formData,

      [e.target.name]:
        e.target.value

    });
  };

  const loadSettings =
    async (companyId) => {

      try {

        const data =
          await getInvoiceSettings(
            companyId
          );

        if (data) {

          setFormData(data);

        }

      } catch (error) {

        console.error(error);

      }
    };

  const handleCompanyChange =
    async (e) => {

      const companyId =
        e.target.value;

      setFormData({

        ...formData,

        company_id:
          companyId

      });

      await loadSettings(
        companyId
      );
    };

  const handleSave =
    async () => {

      try {

        await saveInvoiceSettings(
          formData
        );

        alert(
          "Settings Saved Successfully"
        );

      } catch (error) {

        alert(
          error.message
        );

      }
    };

  return (

    <div className="invoice-settings-page">

      <h2>
        Invoice Settings
      </h2>

      <div
        className="invoice-settings-form"
      >

        <select
          value={
            formData.company_id
          }
          onChange={
            handleCompanyChange
          }
        >

          <option value="">
            Select Company
          </option>

          {companies.map(
            company => (

            <option
              key={company.id}
              value={company.id}
            >
              {company.company_name}
            </option>

          ))}

        </select>

        <label>
          Company Logo
        </label>

        <input
          type="file"
        />

        <label>
          Signature
        </label>

        <input
          type="file"
        />

        <input
          name="bank_name"
          placeholder="Bank Name"
          value={
            formData.bank_name
          }
          onChange={
            handleChange
          }
        />

        <input
          name="account_number"
          placeholder="Account Number"
          value={
            formData.account_number
          }
          onChange={
            handleChange
          }
        />

        <input
          name="ifsc_code"
          placeholder="IFSC Code"
          value={
            formData.ifsc_code
          }
          onChange={
            handleChange
          }
        />

        <input
          name="upi_id"
          placeholder="UPI ID"
          value={
            formData.upi_id
          }
          onChange={
            handleChange
          }
        />

        <textarea
          name="invoice_footer"
          placeholder="Invoice Footer"
          value={
            formData.invoice_footer
          }
          onChange={
            handleChange
          }
        />

        <textarea
          name="terms_conditions"
          placeholder="Terms & Conditions"
          value={
            formData.terms_conditions
          }
          onChange={
            handleChange
          }
        />

        <button
          type="button"
          onClick={
            handleSave
          }
        >
          Save Settings
        </button>

      </div>

    </div>

  );
}

export default InvoiceSettings;
