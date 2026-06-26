import React from "react";

function PrintParty({
  leftTitle = "Bill To",
  rightTitle = "Ship To",
  leftParty = {},
  rightParty = {},
}) {
  return (
    <div className="print-party">

      {/* ================= LEFT PARTY ================= */}

      <div className="print-party-card">

        <div className="print-party-title">
          {leftTitle}
        </div>

        <div className="print-party-body">

          <h4>
            {leftParty?.name || "-"}
          </h4>

          {leftParty?.address && (
            <p>
              {leftParty.address}
            </p>
          )}

          <div className="print-party-row">
            <span>GSTIN</span>
            <span>:</span>
            <span>{leftParty?.gstin || "-"}</span>
          </div>

          <div className="print-party-row">
            <span>State</span>
            <span>:</span>
            <span>{leftParty?.state || "-"}</span>
          </div>

          {leftParty?.placeOfSupply !== undefined && (
            <div className="print-party-row">
              <span>Place of Supply</span>
              <span>:</span>
              <span>
                {leftParty?.placeOfSupply || "-"}
              </span>
            </div>
          )}

        </div>

      </div>

      {/* ================= RIGHT PARTY ================= */}

      <div className="print-party-card">

        <div className="print-party-title">
          {rightTitle}
        </div>

        <div className="print-party-body">

          <h4>
            {rightParty?.name || "-"}
          </h4>

          {rightParty?.address && (
            <p>
              {rightParty.address}
            </p>
          )}

          <div className="print-party-row">
            <span>GSTIN</span>
            <span>:</span>
            <span>{rightParty?.gstin || "-"}</span>
          </div>

          <div className="print-party-row">
            <span>State</span>
            <span>:</span>
            <span>{rightParty?.state || "-"}</span>
          </div>

          {rightParty?.placeOfSupply !== undefined && (
            <div className="print-party-row">
              <span>Place of Supply</span>
              <span>:</span>
              <span>
                {rightParty?.placeOfSupply || "-"}
              </span>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

export default PrintParty;
