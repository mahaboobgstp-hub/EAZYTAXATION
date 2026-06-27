import React from "react";

function VendorSection({

    vendors,

    formData,

    setFormData

}) {

    const handleVendorChange = (e) => {

        const vendorId = e.target.value;

        const selectedVendor =
            vendors.find(
                vendor => vendor.id === vendorId
            );

        if (!selectedVendor) {

            setFormData(prev => ({

                ...prev,

                vendor_id: "",

                vendor_name: "",

                vendor_state: "",

                billing_address: "",

                shipping_address: "",

                gstin: "",

                place_of_supply: ""

            }));

            return;

        }

        setFormData(prev => ({

            ...prev,

            vendor_id: selectedVendor.id,

            vendor_name:
                selectedVendor.vendor_name || "",

            vendor_state:
                selectedVendor.state || "",

            billing_address:
                selectedVendor.address || "",

            shipping_address:
                selectedVendor.address || "",

            gstin:
                selectedVendor.gstin || "",

            place_of_supply:
                selectedVendor.state || ""

        }));

    };

    const handleChange = (e) => {

        const {

            name,

            value

        } = e.target;

        setFormData(prev => ({

            ...prev,

            [name]: value

        }));

    };

    return (

        <div className="purchase-card">

            <h3 className="section-title">

                Vendor Details

            </h3>

            <div className="purchase-grid">

                {/* Vendor */}

                <div className="form-group">

                    <label>

                        Vendor

                    </label>

                    <select

                        name="vendor_id"

                        value={formData.vendor_id}

                        onChange={handleVendorChange}

                    >

                        <option value="">

                            Select Vendor

                        </option>

                        {

                            vendors.map(vendor => (

                                <option

                                    key={vendor.id}

                                    value={vendor.id}

                                >

                                    {vendor.vendor_name}

                                </option>

                            ))

                        }

                    </select>

                </div>

                {/* GSTIN */}

                <div className="form-group">

                    <label>

                        GSTIN

                    </label>

                    <input

                        type="text"

                        name="gstin"

                        value={formData.gstin}

                        onChange={handleChange}

                    />

                </div>

                {/* State */}

                <div className="form-group">

                    <label>

                        State

                    </label>

                    <input

                        type="text"

                        name="vendor_state"

                        value={formData.vendor_state}

                        onChange={handleChange}

                    />

                </div>

                {/* Place of Supply */}

                <div className="form-group">

                    <label>

                        Place of Supply

                    </label>

                    <input

                        type="text"

                        name="place_of_supply"

                        value={formData.place_of_supply}

                        onChange={handleChange}

                    />

                </div>

                {/* Billing Address */}

                <div className="form-group">

                    <label>

                        Billing Address

                    </label>

                    <textarea

                        rows="3"

                        name="billing_address"

                        value={formData.billing_address}

                        onChange={handleChange}

                    />

                </div>

                {/* Shipping Address */}

                <div className="form-group">

                    <label>

                        Shipping Address

                    </label>

                    <textarea

                        rows="3"

                        name="shipping_address"

                        value={formData.shipping_address}

                        onChange={handleChange}

                    />

                </div>

            </div>

        </div>

    );

}

export default VendorSection;
