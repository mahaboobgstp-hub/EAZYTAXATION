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
