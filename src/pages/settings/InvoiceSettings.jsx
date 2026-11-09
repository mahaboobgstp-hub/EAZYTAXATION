import React, {
  useEffect,
  useState
} from "react";

import "../../css/settings/InvoiceSettings.css";

import {
  getInvoiceSettings,
  saveInvoiceSettings
} from "../../services/invoiceSettingsService";

import { useCompany }
from "../../context/CompanyContext";

import { supabase }
from "../../supabase/supabaseClient";


const defaultFormData = {
  company_id: "",
  invoice_auto_numbering: true,
  invoice_number_prefix: "ET",
  invoice_number_year_format: "FY",
  invoice_number_separator: "-",
  invoice_number_padding: 5,
  invoice_next_number: 1,
  invoice_reset_each_year: true,
  invoice_number_counters: {},

  logo_url: "",

  signature_url: "",

  show_logo: true,

  show_signature: true,

  show_bank_details: true,

  show_terms_conditions: true,

  show_footer: true,

  show_transport_details: true,

  bank_name: "",

  account_number: "",

  ifsc_code: "",

  upi_id: "",
  delivery_document_title: "DELIVERY CHALLAN",

  invoice_footer: "",

  terms_conditions: ""
  
};


function InvoiceSettings() {

  const {
    currentCompany,
    currentCompanyId,
    loading: companyLoading
  } = useCompany();


  const [formData, setFormData] =
    useState(defaultFormData);


  useEffect(() => {

    if (!currentCompanyId) {

      setFormData(defaultFormData);

      return;

    }

    loadSettings(
      currentCompanyId
    );

  }, [currentCompanyId]);


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

         setFormData({

    ...defaultFormData,

    ...data,

    company_id:
        companyId,

    delivery_document_title:
        data?.delivery_document_title ||
        "DELIVERY CHALLAN"

});
        } else {

          setFormData({

            ...defaultFormData,

            company_id:
              companyId

          });

        }

      } catch (error) {

        console.error(error);

      }

    };


  const handleSave =
    async () => {

      try {

        if (!currentCompanyId) {

          alert(
            "Please select a Current Company from the Sidebar."
          );

          return;

        }


        const settingsToSave = {

          ...formData,

          company_id:
            currentCompanyId

        };


        await saveInvoiceSettings(
          settingsToSave
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


      {!companyLoading &&
        !currentCompanyId && (

        <div
          style={{
            padding: "12px",
            marginBottom: "15px",
            background: "#fff3cd",
            border: "1px solid #ffeeba",
            borderRadius: "4px"
          }}
        >
          Please select a Current Company
          from the Sidebar.
        </div>

      )}


      <div
        className="invoice-settings-form"
      >

        <div
          style={{
            marginBottom: "15px",
            fontWeight: "600"
          }}
        >
          Company:{" "}

          {companyLoading
            ? "Loading..."
            : currentCompany?.company_name ||
              "Select Company from Sidebar"
          }

        </div>


        <section className="invoice-numbering-card">
          <div>
            <p className="invoice-settings-eyebrow">SALES INVOICES</p>
            <h3>Automatic invoice numbering</h3>
            <p>Configure a separate, sequential number series for this company.</p>
          </div>
          <label className="invoice-numbering-toggle">
            <input
              type="checkbox"
              name="invoice_auto_numbering"
              checked={Boolean(formData.invoice_auto_numbering)}
              onChange={(e) => setFormData(prev => ({ ...prev, invoice_auto_numbering: e.target.checked }))}
            />
            Generate invoice numbers automatically
          </label>
          <div className="invoice-numbering-fields">
            <label>Prefix<input name="invoice_number_prefix" value={formData.invoice_number_prefix || ""} onChange={handleChange} placeholder="ET" /></label>
            <label>Year format
              <select name="invoice_number_year_format" value={formData.invoice_number_year_format || "FY"} onChange={handleChange}>
                <option value="FY">Financial year (26-27)</option>
                <option value="YYYY">Calendar year (2026)</option>
                <option value="NONE">No year</option>
              </select>
            </label>
            <label>Separator<input name="invoice_number_separator" value={formData.invoice_number_separator ?? "-"} onChange={handleChange} maxLength={3} /></label>
            <label>Digits<input type="number" min="1" max="12" name="invoice_number_padding" value={formData.invoice_number_padding ?? 5} onChange={handleChange} /></label>
            <label>Next number<input type="number" min="1" name="invoice_next_number" value={formData.invoice_next_number ?? 1} onChange={handleChange} /></label>
          </div>
          <label className="invoice-numbering-toggle">
            <input
              type="checkbox"
              name="invoice_reset_each_year"
              checked={Boolean(formData.invoice_reset_each_year)}
              onChange={(e) => setFormData(prev => ({ ...prev, invoice_reset_each_year: e.target.checked }))}
            />
            Reset sequence at the start of each financial year
          </label>
          <div className="invoice-number-preview">
            Example format: <strong>{[formData.invoice_number_prefix || "ET", "26-27", String(formData.invoice_next_number || 1).padStart(Math.min(Number(formData.invoice_number_padding) || 5, 12), "0")].filter(Boolean).join(formData.invoice_number_separator ?? "-")}</strong>
          </div>
        </section>

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

          Show Logo On Invoice

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

          Show Signature On Invoice

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


        <label>

          <input
            type="checkbox"
            checked={
              formData.show_transport_details
            }
            onChange={(e) =>
              setFormData({

                ...formData,

                show_transport_details:
                  e.target.checked

              })
            }
          />

          Show Vehicle No & E-Way Bill

        </label>

<label>
    Delivery Document Title
</label>

<select
    name="delivery_document_title"
    value={
        formData.delivery_document_title ||
        "DELIVERY CHALLAN"
    }
    onChange={handleChange}
>
    <option value="DELIVERY CHALLAN">
        DELIVERY CHALLAN
    </option>

    <option value="DELIVERY NOTE">
        DELIVERY NOTE
    </option>

    <option value="SUPPLY BILL">
        SUPPLY BILL
    </option>

    <option value="BILL">
        BILL
    </option>

    <option value="BILL OF SUPPLY">
        BILL OF SUPPLY
    </option>

    <option value="SUPPLY CHALLAN">
        SUPPLY CHALLAN
    </option>

    <option value="DELIVERY RECEIPT">
        DELIVERY RECEIPT
    </option>
</select>
        
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


        <label>

          <input
            type="checkbox"
            checked={
              formData.show_footer
            }
            onChange={(e) =>
              setFormData({

                ...formData,

                show_footer:
                  e.target.checked

              })
            }
          />

          Show Footer On Invoice

        </label>


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


        <label>

          <input
            type="checkbox"
            checked={
              formData.show_terms_conditions
            }
            onChange={(e) =>
              setFormData({

                ...formData,

                show_terms_conditions:
                  e.target.checked

              })
            }
          />

          Show Terms & Conditions On Invoice

        </label>


        <button
          type="button"
          onClick={
            handleSave
          }
          disabled={
            !currentCompanyId
          }
        >
          Save Settings
        </button>


      </div>

    </div>

  );

}


export default InvoiceSettings;
