import React from "react";

const UOMS = [
  "NOS",
  "PCS",
  "BOX",
  "PACK",
  "PAIR",
  "SET",
  "DOZEN",
  "BUNDLE",
  "ROLL",
  "BAG",
  "BOTTLE",
  "CAN",
  "TIN",
  "JAR",
  "TUBE",
  "SHEET",
  "REAM",
  "BOOK",
  "METER",
  "CM",
  "MM",
  "KM",
  "FOOT",
  "INCH",
  "SQ FT",
  "SQ MTR",
  "CUBIC FT",
  "KG",
  "GRAM",
  "MG",
  "TON",
  "LITRE",
  "ML",
  "GALLON",
  "HOUR",
  "DAY",
  "MONTH",
  "YEAR",
  "SERVICE"
];

export default function UomDropdown({
    value,
    onChange,
    name="unit",
    className=""
}) {

    return (
        <select
            name={name}
            value={value}
            onChange={onChange}
            className={className}
        >
            <option value="">Select Unit</option>

            {UOMS.map(uom=>(
                <option key={uom} value={uom}>
                    {uom}
                </option>
            ))}

        </select>
    );
}
