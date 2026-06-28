import React from "react";

const GST_RATES = [
    0,
    0.1,
    0.25,
    1,
    1.5,
    3,
    5,
    6,
    7.5,
    12,
    18,
    28
];

export default function GstRateDropdown({
    value,
    onChange,
    name="gst_rate",
    className=""
}) {

    return (

        <select
            value={value}
            onChange={onChange}
            name={name}
            className={className}
        >

            <option value="">GST %</option>

            {GST_RATES.map(rate=>(
                <option
                    key={rate}
                    value={rate}
                >
                    {rate} %
                </option>
            ))}

        </select>

    );

}
