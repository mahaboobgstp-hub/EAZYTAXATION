import React from "react";

function PrintCompany({
  company,
  settings,
}) {
  return (
    <div className="print-company">

      {/* ================= LEFT : LOGO ================= */}

      <div className="print-company-logo">

        {settings?.show_logo &&
          settings?.logo_url && (
            <img
              src={settings.logo_url}
              alt="Company Logo"
            />
          )}

      </div>

      {/* ================= RIGHT : DETAILS ================= */}

      <div className="print-company-details">

        <h2>
          {company?.company_name || ""}
        </h2>

        {company?.address && (
          <p>
            {company.address}
          </p>
        )}

        <div className="company-contact-row">

          {company?.mobile && (
            <span>
              <strong>Mobile :</strong> {company.mobile}
            </span>
          )}

          {company?.email && (
            <span>
              <strong>Email :</strong> {company.email}
            </span>
          )}

        </div>

        {company?.gstin && (
          <p>
            <strong>GSTIN :</strong> {company.gstin}
          </p>
        )}

      </div>

    </div>
  );
}

export default PrintCompany;
