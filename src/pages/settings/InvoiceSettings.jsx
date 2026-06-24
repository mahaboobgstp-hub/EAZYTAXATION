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
import { supabase }
from "../../supabase/supabaseClient";

function InvoiceSettings() {

  const [companies, setCompanies] =
    useState([]);

  const [formData, setFormData] =
    useState({

      company_id: "",

      logo_url: "",

      signature_url: "",
      show_logo: true,
      show_signature: true,
      show_bank_details: true,

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
const uploadFile = async (
  file,
  bucketName,
  fieldName
) => {

  try {

    if (!file) return;

    console.log(
      "Uploading File:",
      file
    );

    const fileName =
      `${Date.now()}-${file.name}`;

    const {
      data: uploadData,
      error
    } = await supabase.storage
      .from(bucketName)
      .upload(
        fileName,
        file,
        {
          upsert: true
        }
      );

    console.log(
      "Upload Result:",
      uploadData
    );

    console.log(
      "Upload Error:",
      error
    );

    if (error) {
      throw error;
    }

    const {
      data
    } = supabase.storage
      .from(bucketName)
      .getPublicUrl(
        fileName
      );

    setFormData(prev => ({

      ...prev,

      [fieldName]:
        data.publicUrl

    }));

  } catch (error) {

    console.error(error);

    alert(
      error.message
    );

  }
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
  accept="image/*"
  onChange={(e) =>

    uploadFile(
      e.target.files[0],
      "company-logos",
      "logo_url"
    )

  }
/>
        {
  formData.logo_url && (

    <img
      src={
        formData.logo_url
      }
      alt="Logo"
      width="150"
    />

  )
}
<label>

  <input
    type="checkbox"
    checked={
      formData.show_logo
    }
    onChange={(e) =>
      setFormData({

        ...formData,

        show_logo:
          e.target.checked

      })
    }
  />

  Show On Invoice

</label>
        <label>
          Signature
        </label>

       <input
  type="file"
  accept="image/*"
  onChange={(e) =>

    uploadFile(
      e.target.files[0],
      "company-signatures",
      "signature_url"
    )

  }
/>
{
  formData.signature_url && (

    <img
      src={
        formData.signature_url
      }
      alt="Signature"
      width="200"
    />

  )
}
        <label>

  <input
    type="checkbox"
    checked={
      formData.show_signature
    }
    onChange={(e) =>
      setFormData({

        ...formData,

        show_signature:
          e.target.checked

      })
    }
  />

  Show On Invoice

</label>
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
        <label>

  <input
    type="checkbox"
    checked={
      formData.show_bank_details
    }
    onChange={(e) =>
      setFormData({

        ...formData,

        show_bank_details:
          e.target.checked

      })
    }
  />

  Show Bank Details On Invoice

</label>

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
