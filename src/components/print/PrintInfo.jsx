import React from "react";

function PrintInfo({
  leftFields = [],
  rightFields = [],
}) {
  return (
    <div className="print-info">

      {/* LEFT SIDE */}

      <div className="print-info-left">

        {leftFields.map((field, index) => (

          <div
            className="print-info-row"
            key={index}
          >

            <div className="print-info-label">
              {field.label}
            </div>

            <div className="print-info-colon">
              :
            </div>

            <div className="print-info-value">
              {field.value || "-"}
            </div>

          </div>

        ))}

      </div>

      {/* RIGHT SIDE */}

      <div className="print-info-right">

        {rightFields.map((field, index) => (

          <div
            className="print-info-row"
            key={index}
          >

            <div className="print-info-label">
              {field.label}
            </div>

            <div className="print-info-colon">
              :
            </div>

            <div className="print-info-value">
              {field.value || "-"}
            </div>

          </div>

        ))}

      </div>

    </div>
  );
}

export default PrintInfo;
