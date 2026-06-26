import React from "react";

function PrintSignature({
  show = true,
  signatureUrl = "",
  signatory = "Authorized Signatory",
}) {

  if (!show || !signatureUrl) {
    return null;
  }

  return (

    <div className="print-signature">

      <div className="signature-image-wrapper">

        <img
          src={signatureUrl}
          alt="Signature"
          className="signature-image"
        />

      </div>

      <div className="signature-line"></div>

      <div className="signature-title">

        {signatory}

      </div>

    </div>

  );

}

export default PrintSignature;
