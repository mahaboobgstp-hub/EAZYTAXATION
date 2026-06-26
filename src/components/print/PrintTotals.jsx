import React from "react";

function PrintTotals({
  rows = [],
  grandTotal = "",
}) {

  return (

    <div className="print-totals">

      <div className="print-totals-table">

        {rows.map((row, index) => (

          <div
            className="print-total-row"
            key={index}
          >

            <div className="print-total-label">

              {row.label}

            </div>

            <div className="print-total-colon">

              :

            </div>

            <div className="print-total-value">

              {row.value}

            </div>

          </div>

        ))}

        <div className="print-grand-total">

          <div>

            Grand Total

          </div>

          <div>

            :

          </div>

          <div>

            {grandTotal}

          </div>

        </div>

      </div>

    </div>

  );

}

export default PrintTotals;
