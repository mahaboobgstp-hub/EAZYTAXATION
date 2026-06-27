import React from "react";

function PurchaseHeader({

    formData,

    setFormData

}) {

    const handleChange = (e) => {

        const { name, value } = e.target;

        setFormData((prev) => ({

            ...prev,

            [name]: value

        }));

    };

    return (

        <div className="purchase-card">

            <h3 className="section-title">
                Purchase Invoice Details
            </h3>

            <div className="purchase-grid">

                {/* Purchase Invoice No */}

                <div className="form-group">

                    <label>

                        Purchase Invoice No

                    </label>

                    <input

                        type="text"

                        name="invoice_no"

                        value={formData.invoice_no}

                        readOnly

                    />

                </div>

                {/* Purchase Date */}

                <div className="form-group">

                    <label>

                        Purchase Date

                    </label>

                    <input

                        type="date"

                        name="invoice_date"

                        value={formData.invoice_date}

                        onChange={handleChange}

                    />

                </div>

                {/* Supplier Invoice No */}

                <div className="form-group">

                    <label>

                        Supplier Invoice No

                    </label>

                    <input

                        type="text"

                        name="supplier_invoice_no"

                        value={formData.supplier_invoice_no}

                        onChange={handleChange}

                    />

                </div>

                {/* Supplier Invoice Date */}

                <div className="form-group">

                    <label>

                        Supplier Invoice Date

                    </label>

                    <input

                        type="date"

                        name="supplier_invoice_date"

                        value={formData.supplier_invoice_date}

                        onChange={handleChange}

                    />

                </div>

                {/* Vehicle Number */}

                <div className="form-group">

                    <label>

                        Vehicle Number

                    </label>

                    <input

                        type="text"

                        name="vehicle_no"

                        placeholder="Vehicle Number"

                        value={formData.vehicle_no}

                        onChange={handleChange}

                    />

                </div>

                {/* E-Way Bill */}

                <div className="form-group">

                    <label>

                        E-Way Bill No

                    </label>

                    <input

                        type="text"

                        name="eway_bill_no"

                        placeholder="E-Way Bill Number"

                        value={formData.eway_bill_no}

                        onChange={handleChange}

                    />

                </div>

            </div>

        </div>

    );

}

export default PurchaseHeader;
