/*import React from "react";

const UOMS = [
  "NOS",
  "PCS",
  "BOX",
  "PACK",
  "PAIR",
  "SET",
  "DOZEN",
  "DUTIES",
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
}*/


import React, { useEffect, useState } from "react";
import { getUnits } from "../../services/uomService";

const UomDropdown = ({
  value,
  onChange,
  name = "unit",
  className = ""
}) => {

  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUnits();
  }, []);

  const loadUnits = async () => {
    try {
      const data = await getUnits();
      setUnits(data || []);
    } catch (error) {
      console.error("Error loading units:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <select
      name={name}
      value={value}
      onChange={onChange}
      className={className}
      disabled={loading}
    >
      <option value="">
        {loading ? "Loading Units..." : "Select Unit"}
      </option>

      {units.map((unit) => (
        <option key={unit.id} value={unit.unit_code}>
          {unit.unit_code} - {unit.unit_name}
        </option>
      ))}
    </select>
  );
};

export default UomDropdown;
