import React, { useEffect, useState } from "react";
import "./PurchaseInvoice.css";

import PurchaseHeader from "./components/PurchaseHeader";
import VendorSection from "./components/VendorSection";
import PurchaseItemsTable from "./components/PurchaseItemsTable";
import PurchaseTotals from "./components/PurchaseTotals";
import PurchaseActions from "./components/PurchaseActions";
import {

    getCompaniesForDropdown,
    getVendorsForDropdown,
    getItemsForDropdown,
    savePurchaseInvoice

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
    const [companies, setCompanies] = useState([]);

const [itemsMaster, setItemsMaster] = useState([]);
    const loadVendors = async () => {

    try {

        const data = await getVendorsForDropdown();

        setVendors(data || []);

    } catch (error) {

        console.error(error);

    }

};
const loadCompanies = async () => {

    try {

        const data = await getCompaniesForDropdown();

        setCompanies(data || []);

    } catch (error) {

        console.error(error);

    }

};
    const loadItems = async () => {

    try {

        const data = await getItemsForDropdown();

        setItemsMaster(data || []);

    } catch (error) {

        console.error(error);

    }

};
    useEffect(() => {

    loadCompanies();

    loadVendors();

    loadItems();

}, []);

    const handleSave = async () => {

    try {

        if (!formData.vendor_id) {

            alert("Please select a vendor.");

            return;

        }

        if (items.length === 0) {

            alert("Please add at least one item.");

            return;

        }

        const invoiceHeader = {

            company_id: formData.company_id,

            vendor_id: formData.vendor_id,

            invoice_no: formData.invoice_no,

            invoice_date: formData.invoice_date,

            supplier_invoice_no: formData.supplier_invoice_no,

            supplier_invoice_date: formData.supplier_invoice_date,

            vehicle_no: formData.vehicle_no,

            eway_bill_no: formData.eway_bill_no,

            billing_address: formData.billing_address,

            shipping_address: formData.shipping_address,

            gstin: formData.gstin,

            vendor_state: formData.vendor_state,

            place_of_supply: formData.place_of_supply,

            remarks: formData.remarks,

            taxable: summary.taxable,

            cgst: summary.cgst,

            sgst: summary.sgst,

            igst: summary.igst,

            round_off: summary.roundOff,

            grand_total: summary.grandTotal,

            amount_in_words: summary.amountInWords || ""

        };

        await savePurchaseInvoice(

            invoiceHeader,

            items

        );

        alert(

            "Purchase Invoice Saved Successfully."

        );

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

};
    return (

        <div className="purchase-page">

            <h2>Purchase Invoice</h2>

            <PurchaseHeader
                companies={companies}
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
                itemsMaster={itemsMaster}

    companyState={formData.company_state}

    placeOfSupply={formData.place_of_supply}

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
                onSave={handleSave}

            />

        </div>

    );

}

export default PurchaseInvoice;
