import React from "react";

function PrintFooter({
  company = {},
  settings = {},
}) {

  const showFooter =
    settings?.show_footer ||
    settings?.invoice_footer;

  if (!showFooter) {
    return null;
  }

  return (

    <div className="print-footer">

      {settings?.invoice_footer && (

        <div className="print-footer-message">

          {settings.invoice_footer}

        </div>

      )}

      <div className="print-footer-contact">

        {company?.mobile && (
          <span>
            📞 {company.mobile}
          </span>
        )}

        {company?.email && (
          <span>
            ✉ {company.email}
          </span>
        )}

        {company?.website && (
          <span>
            🌐 {company.website}
          </span>
        )}

      </div>

    </div>

  );

}

export default PrintFooter;
