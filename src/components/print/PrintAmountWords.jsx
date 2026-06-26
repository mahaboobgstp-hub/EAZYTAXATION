import React from "react";

function PrintAmountWords({
  amountInWords = "",
  title = "Amount in Words",
}) {
  if (!amountInWords) return null;

  return (
    <div className="print-amount-words">

      <div className="print-amount-title">
        {title}
      </div>

      <div className="print-amount-text">
        {amountInWords}
      </div>

    </div>
  );
}

export default PrintAmountWords;
