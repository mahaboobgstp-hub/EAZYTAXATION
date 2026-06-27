import React, { useState } from "react";
import "./PurchaseInvoice.css";

import PurchaseHeader from "./components/PurchaseHeader";
import VendorSection from "./components/VendorSection";
import PurchaseItemsTable from "./components/PurchaseItemsTable";
import PurchaseTotals from "./components/PurchaseTotals";
import PurchaseActions from "./components/PurchaseActions";
import {

    getVendorsForDropdown

} from "../../services/purchaseInvoiceService";

function PurchaseInvoice() {

    const [formData, setFormData] = useState({

        company_id: "",
        company_name: "",
        company_state: "",

        invoice_no: "",
        invoice_date: "",

        supplier_invoice_no: "",
        supplier_invoice_date: "",

        vendor_id: "",
        vendor_name: "",
        vendor_state: "",

        billing_address: "",
        shipping_address: "",

        gstin: "",
        place_of_supply: "",

        vehicle_no: "",
        eway_bill_no: "",

        remarks: ""

    });

    const [items, setItems] = useState([]);

    const [summary, setSummary] = useState({

        taxable: 0,

        cgst: 0,

        sgst: 0,

        igst: 0,

        roundOff: 0,

        grandTotal: 0

    });
    const [vendors, setVendors] = useState([]);
    const loadVendors = async () => {

    try {

        const data = await getVendorsForDropdown();

        setVendors(data || []);

    } catch (error) {

        console.error(error);

    }

};

    return (

        <div className="purchase-page">

            <h2>Purchase Invoice</h2>

            <PurchaseHeader

                formData={formData}
                setFormData={setFormData}

            />

            <VendorSection
                vendors={vendors}
                formData={formData}
                setFormData={setFormData}

            />

            <PurchaseItemsTable

                formData={formData}

                items={items}

                setItems={setItems}

                summary={summary}

                setSummary={setSummary}

            />

            <PurchaseTotals

                summary={summary}

            />

            <PurchaseActions

                formData={formData}

                items={items}

                summary={summary}

            />

        </div>

    );

}

export default PurchaseInvoice;
