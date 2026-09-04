import React, { useEffect, useState } from "react";
import DeliveryChallanPrint from "./DeliveryChallanPrint";
import {
    getCompanyById
} from "../../services/companyService";

import {
    getCustomerById
} from "../../services/customerService";

import {
    getInvoiceSettingsByCompany
} from "../../services/invoiceSettingsService";
import { useCompany } from "../../context/CompanyContext";
import { getStates } from "../../services/stateService";
import "../../css/sales/DeliveryChallan.css";

import {
    getCustomersForDropdown,
    getItemsForDropdown
} from "../../services/salesInvoiceService";

import {
    getDeliveryChallans,
    saveDeliveryChallan,
    updateDeliveryChallan,
    deleteDeliveryChallan,
    getDeliveryChallanById,
    getDeliveryChallanItems
} from "../../services/deliveryChallanService";

import UomDropdown from "../../components/dropdowns/UomDropdown";
import GstRateDropdown from "../../components/dropdowns/GstRateDropdown";

function DeliveryChallan() {

    const {
        currentCompany,
        currentCompanyId,
        loading: companyLoading
    } = useCompany();


    // =====================================================
    // STATE
    // =====================================================

    const [customers, setCustomers] = useState([]);
    const [itemsMaster, setItemsMaster] = useState([]);
    const [states, setStates] = useState([]);
    const [challans, setChallans] = useState([]);
    const [selectedChallan, setSelectedChallan] = useState(null);
const [selectedChallanItems, setSelectedChallanItems] = useState([]);
const [companyDetails, setCompanyDetails] = useState(null);
const [customerDetails, setCustomerDetails] = useState(null);
const [challanSettings, setChallanSettings] = useState(null);
const [printMode, setPrintMode] = useState(false);

    const [editingChallanId, setEditingChallanId] = useState(null);

    const [formData, setFormData] = useState({
        company_id: "",
        company_name: "",
        company_state: "",

        challan_no: "",
        challan_date: "",

        customer_id: "",
        customer_name: "",
        customer_state: "",
        billing_address: "",

        shipping_name: "",
        shipping_gstin: "",
        shipping_state: "",
        shipping_address: "",

        place_of_supply: "",

        vehicle_no: "",
        eway_bill_no: "",

        remarks: "",

        taxable_value: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        total_amount: 0,

        status: "Draft"
    });


    const [items, setItems] = useState([
        {
            item_id: "",
            item_name: "",
            hsn_sac: "",
            unit: "",
            gst_rate: 18,
            qty: 1,
            rate: 0,
            amount: 0
        }
    ]);


    // =====================================================
    // INITIAL DATE
    // =====================================================

    useEffect(() => {

        const today = new Date()
            .toISOString()
            .split("T")[0];

        setFormData(prev => ({
            ...prev,
            challan_date: today
        }));

        loadStates();

    }, []);


    // =====================================================
    // LOAD COMPANY DATA
    // =====================================================

    useEffect(() => {

        if (!currentCompanyId) {

            setCustomers([]);
            setItemsMaster([]);
            setChallans([]);

            setFormData(prev => ({
                ...prev,
                company_id: "",
                company_name: "",
                company_state: ""
            }));

            return;
        }


        setFormData(prev => ({
            ...prev,

            company_id: currentCompanyId,

            company_name:
                currentCompany?.company_name || "",

            company_state:
                currentCompany?.state || ""
        }));


        loadCustomers();
        loadItemsMaster();
        loadChallans();

    }, [currentCompanyId]);


    // =====================================================
    // LOAD STATES
    // =====================================================

    const loadStates = async () => {

        try {

            const data = await getStates();

            setStates(data || []);

        } catch (error) {

            console.error("Error loading states:", error);

        }
    };


    // =====================================================
    // LOAD CUSTOMERS
    // =====================================================

    const loadCustomers = async () => {

        if (!currentCompanyId) return;

        try {

            const data =
                await getCustomersForDropdown(
                    currentCompanyId
                );

            setCustomers(data || []);

        } catch (error) {

            console.error(
                "Error loading customers:",
                error
            );

        }
    };


    // =====================================================
    // LOAD ITEMS
    // =====================================================

    const loadItemsMaster = async () => {

        if (!currentCompanyId) return;

        try {

            const data =
                await getItemsForDropdown(
                    currentCompanyId
                );

            setItemsMaster(data || []);

        } catch (error) {

            console.error(
                "Error loading items:",
                error
            );

        }
    };


    // =====================================================
    // LOAD CHALLANS
    // =====================================================

    const loadChallans = async () => {

        if (!currentCompanyId) return;

        try {

            const data =
                await getDeliveryChallans(
                    currentCompanyId
                );

            setChallans(data || []);

        } catch (error) {

            console.error(
                "Error loading Delivery Challans:",
                error
            );

        }
    };


    // =====================================================
    // FORM CHANGE
    // =====================================================

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


    // =====================================================
    // CUSTOMER CHANGE
    // =====================================================

    const handleCustomerChange = (e) => {

        const customerId = e.target.value;

        const customer =
            customers.find(
                c => c.id === customerId
            );


        if (!customer) {

            setFormData(prev => ({
                ...prev,
                customer_id: "",
                customer_name: "",
                customer_state: "",
                billing_address: "",
                place_of_supply: ""
            }));

            return;
        }


        setFormData(prev => ({
            ...prev,

            customer_id: customer.id,

            customer_name:
                customer.customer_name || "",

            customer_state:
                customer.state || "",

            billing_address:
                customer.address || "",

            place_of_supply:
                customer.state || ""
        }));

    };


    // =====================================================
    // ITEM CHANGE
    // =====================================================

    const handleItemChange = (
        index,
        field,
        value
    ) => {

        const updatedItems = [...items];

        updatedItems[index][field] = value;


        if (field === "item_id") {

            const selectedItem =
                itemsMaster.find(
                    item => item.id === value
                );


            if (selectedItem) {

                updatedItems[index].item_name =
                    selectedItem.item_name || "";

                updatedItems[index].hsn_sac =
                    selectedItem.hsn_sac || "";

                updatedItems[index].unit =
                    selectedItem.unit || "";

                updatedItems[index].gst_rate =
                    Number(selectedItem.gst_rate) || 0;

                updatedItems[index].rate =
                    Number(selectedItem.sales_rate) || 0;

            }

        }


        if (
            field === "qty" ||
            field === "rate"
        ) {

            updatedItems[index].amount =
                (Number(updatedItems[index].qty) || 0) *
                (Number(updatedItems[index].rate) || 0);

        }


        setItems(updatedItems);

        calculateTotals(updatedItems);

    };


    // =====================================================
    // ADD ITEM
    // =====================================================

    const addItem = () => {

        setItems(prev => [
            ...prev,

            {
                item_id: "",
                item_name: "",
                hsn_sac: "",
                unit: "",
                gst_rate: 18,
                qty: 1,
                rate: 0,
                amount: 0
            }
        ]);

    };


    // =====================================================
    // REMOVE ITEM
    // =====================================================

    const removeItem = (index) => {

        if (items.length === 1) return;

        const updatedItems =
            items.filter(
                (_, i) => i !== index
            );

        setItems(updatedItems);

        calculateTotals(updatedItems);

    };


    // =====================================================
    // CALCULATE TOTALS
    // =====================================================

    const calculateTotals = (itemList) => {

        let taxable = 0;
        let cgstTotal = 0;
        let sgstTotal = 0;
        let igstTotal = 0;


        const isIntraState =
            currentCompany?.state &&
            formData.place_of_supply &&
            currentCompany.state ===
                formData.place_of_supply;


        itemList.forEach(item => {

            const amount =
                Number(item.amount) || 0;

            const gstRate =
                Number(item.gst_rate) || 0;


            taxable += amount;


            const gstAmount =
                amount * gstRate / 100;


            if (isIntraState) {

                cgstTotal += gstAmount / 2;

                sgstTotal += gstAmount / 2;

            } else {

                igstTotal += gstAmount;

            }

        });


        const total =
            taxable +
            cgstTotal +
            sgstTotal +
            igstTotal;


        setFormData(prev => ({

            ...prev,

            taxable_value:
                Number(taxable.toFixed(2)),

            cgst:
                Number(cgstTotal.toFixed(2)),

            sgst:
                Number(sgstTotal.toFixed(2)),

            igst:
                Number(igstTotal.toFixed(2)),

            total_amount:
                Number(total.toFixed(2))

        }));

    };


    // =====================================================
    // SUBMIT
    // =====================================================

    const handleSubmit = async (e) => {

        e.preventDefault();


        try {

            if (!currentCompanyId) {

                alert(
                    "Please select a Current Company from the Sidebar."
                );

                return;
            }


            if (!formData.challan_no) {

                alert(
                    "Please enter Delivery Challan Number."
                );

                return;
            }


            if (!formData.customer_id) {

                alert(
                    "Please select a customer."
                );

                return;
            }


            const challanHeader = {

                ...formData,

                company_id:
                    currentCompanyId,

                company_name:
                    currentCompany?.company_name || "",

                company_state:
                    currentCompany?.state || ""

            };


            if (editingChallanId) {

                await updateDeliveryChallan(
                    editingChallanId,
                    challanHeader,
                    items,
                    currentCompanyId
                );

                alert(
                    "Delivery Challan Updated Successfully"
                );

            } else {

                await saveDeliveryChallan(
                    challanHeader,
                    items,
                    currentCompanyId
                );

                alert(
                    "Delivery Challan Saved Successfully"
                );

            }


            resetForm();

            loadChallans();

        } catch (error) {

            console.error(error);

            alert(error.message);

        }

    };

const viewChallan = async (challanId) => {

    try {

        if (!currentCompanyId) {
            alert("Please select a Current Company.");
            return;
        }

        const challan =
            await getDeliveryChallanById(
                challanId,
                currentCompanyId
            );

        const challanItems =
            await getDeliveryChallanItems(
                challanId,
                currentCompanyId
            );

        const company =
            await getCompanyById(
                challan.company_id
            );

        const settings =
            await getInvoiceSettingsByCompany(
                challan.company_id
            );

        let customer = null;

        if (challan.customer_id) {

            customer =
                await getCustomerById(
                    challan.customer_id
                );

        }

        setSelectedChallan(challan);
        setSelectedChallanItems(challanItems);
        setCompanyDetails(company);
        setCustomerDetails(customer);
        setChallanSettings(settings);
        setPrintMode(true);

    } catch (error) {

        console.error(error);

        alert(error.message);

    }
};
    // =====================================================
    // VIEW / EDIT
    // =====================================================

    const handleEdit = async (challanId) => {

        try {

            if (!currentCompanyId) return;


            const challan =
                await getDeliveryChallanById(
                    challanId,
                    currentCompanyId
                );


            const challanItems =
                await getDeliveryChallanItems(
                    challanId,
                    currentCompanyId
                );


            setEditingChallanId(challanId);

            setFormData({

                company_id:
                    challan.company_id || "",

                company_name:
                    currentCompany?.company_name || "",

                company_state:
                    currentCompany?.state || "",

                challan_no:
                    challan.challan_no || "",

                challan_date:
                    challan.challan_date || "",

                customer_id:
                    challan.customer_id || "",

                customer_name:
                    challan.customer_name || "",

                customer_state:
                    challan.customer_state || "",

                billing_address:
                    challan.billing_address || "",

                shipping_name:
                    challan.shipping_name || "",

                shipping_gstin:
                    challan.shipping_gstin || "",

                shipping_state:
                    challan.shipping_state || "",

                shipping_address:
                    challan.shipping_address || "",

                place_of_supply:
                    challan.place_of_supply || "",

                vehicle_no:
                    challan.vehicle_no || "",

                eway_bill_no:
                    challan.eway_bill_no || "",

                remarks:
                    challan.remarks || "",

                taxable_value:
                    challan.taxable_value || 0,

                cgst:
                    challan.cgst || 0,

                sgst:
                    challan.sgst || 0,

                igst:
                    challan.igst || 0,

                total_amount:
                    challan.total_amount || 0,

                status:
                    challan.status || "Draft"

            });


            setItems(
                challanItems.length > 0
                    ? challanItems
                    : [{
                        item_id: "",
                        item_name: "",
                        hsn_sac: "",
                        unit: "",
                        gst_rate: 18,
                        qty: 1,
                        rate: 0,
                        amount: 0
                    }]
            );


            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        } catch (error) {

            console.error(error);

            alert(error.message);

        }

    };


    // =====================================================
    // DELETE
    // =====================================================

    const handleDelete = async (challanId) => {

        const confirmed =
            window.confirm(
                "Are you sure you want to delete this Delivery Challan?"
            );


        if (!confirmed) return;


        try {

            await deleteDeliveryChallan(
                challanId,
                currentCompanyId
            );

            alert(
                "Delivery Challan deleted successfully."
            );

            loadChallans();

        } catch (error) {

            alert(error.message);

        }

    };


    // =====================================================
    // RESET
    // =====================================================

    const resetForm = () => {

        const today = new Date()
            .toISOString()
            .split("T")[0];


        setEditingChallanId(null);


        setFormData({

            company_id:
                currentCompanyId || "",

            company_name:
                currentCompany?.company_name || "",

            company_state:
                currentCompany?.state || "",

            challan_no: "",

            challan_date: today,

            customer_id: "",
            customer_name: "",
            customer_state: "",
            billing_address: "",

            shipping_name: "",
            shipping_gstin: "",
            shipping_state: "",
            shipping_address: "",

            place_of_supply: "",

            vehicle_no: "",
            eway_bill_no: "",

            remarks: "",

            taxable_value: 0,
            cgst: 0,
            sgst: 0,
            igst: 0,
            total_amount: 0,

            status: "Draft"

        });


        setItems([

            {
                item_id: "",
                item_name: "",
                hsn_sac: "",
                unit: "",
                gst_rate: 18,
                qty: 1,
                rate: 0,
                amount: 0
            }

        ]);

    };


    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div style={{
            padding: "20px"
        }}>

            <h2>
                {editingChallanId
                    ? "Edit Delivery Challan"
                    : "Delivery Challan"}
            </h2>


            {/* ============================================
                COMPANY
            ============================================ */}

            <div style={{
                marginBottom: "20px",
                fontWeight: "600"
            }}>

                Company:{" "}

                {companyLoading
                    ? "Loading..."
                    : currentCompany?.company_name ||
                      "Select Company from Sidebar"}

            </div>


            {!currentCompanyId ? (

                <div style={{
                    padding: "20px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    background: "#f8f8f8"
                }}>

                    Please select a Current Company
                    from the Sidebar to create a
                    Delivery Challan.

                </div>

            ) : (

                <form onSubmit={handleSubmit}>


                    {/* ====================================
                        BASIC DETAILS
                    ==================================== */}

                    <div style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(2, minmax(250px, 1fr))",
                        gap: "15px",
                        marginBottom: "20px"
                    }}>


                        <div>
                            <label>
                                Challan No.
                            </label>

                            <input
                                type="text"
                                name="challan_no"
                                value={
                                    formData.challan_no
                                }
                                onChange={
                                    handleChange
                                }
                                placeholder="DC00001"
                                required
                            />
                        </div>


                        <div>
                            <label>
                                Challan Date
                            </label>

                            <input
                                type="date"
                                name="challan_date"
                                value={
                                    formData.challan_date
                                }
                                onChange={
                                    handleChange
                                }
                                required
                            />
                        </div>


                        <div>
                            <label>
                                Customer
                            </label>

                            <select
                                value={
                                    formData.customer_id
                                }
                                onChange={
                                    handleCustomerChange
                                }
                                required
                            >

                                <option value="">
                                    Select Customer
                                </option>

                                {customers.map(
                                    customer => (

                                        <option
                                            key={
                                                customer.id
                                            }
                                            value={
                                                customer.id
                                            }
                                        >
                                            {
                                                customer.customer_name
                                            }
                                        </option>

                                    )
                                )}

                            </select>

                        </div>


                        <div>
                            <label>
                                Place of Supply
                            </label>

                            <select
                                name="place_of_supply"
                                value={
                                    formData.place_of_supply
                                }
                                onChange={
                                    handleChange
                                }
                            >

                                <option value="">
                                    Select State
                                </option>

                                {states.map(
                                    state => (

                                        <option
                                            key={
                                                state.id ||
                                                state.state_name
                                            }
                                            value={
                                                state.state_name ||
                                                state.name
                                            }
                                        >
                                            {
                                                state.state_name ||
                                                state.name
                                            }
                                        </option>

                                    )
                                )}

                            </select>

                        </div>


                    </div>


                    {/* ====================================
                        BILLING
                    ==================================== */}

                    <h3>Billing Details</h3>

                    <div style={{
                        marginBottom: "20px"
                    }}>

                        <textarea
                            value={
                                formData.billing_address
                            }
                            readOnly
                            rows="3"
                            style={{
                                width: "100%"
                            }}
                        />

                    </div>


                    {/* ====================================
                        SHIPPING
                    ==================================== */}

                    <h3>Shipping Details</h3>

                    <div style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(2, minmax(250px, 1fr))",
                        gap: "15px",
                        marginBottom: "20px"
                    }}>

                        <div>
                            <label>
                                Shipping Name
                            </label>

                            <input
                                type="text"
                                name="shipping_name"
                                value={
                                    formData.shipping_name
                                }
                                onChange={
                                    handleChange
                                }
                            />
                        </div>


                        <div>
                            <label>
                                Shipping GSTIN
                            </label>

                            <input
                                type="text"
                                name="shipping_gstin"
                                value={
                                    formData.shipping_gstin
                                }
                                onChange={
                                    handleChange
                                }
                            />
                        </div>


                        <div>
                            <label>
                                Shipping State
                            </label>

                            <input
                                type="text"
                                name="shipping_state"
                                value={
                                    formData.shipping_state
                                }
                                onChange={
                                    handleChange
                                }
                            />
                        </div>


                        <div>
                            <label>
                                Vehicle No.</label>

                            <input
                                type="text"
                                name="vehicle_no"
                                value={
                                    formData.vehicle_no
                                }
                                onChange={
                                    handleChange
                                }
                            />

                        </div>


                        <div>
                            <label>
                                E-Way Bill No.
                            </label>

                            <input
                                type="text"
                                name="eway_bill_no"
                                value={
                                    formData.eway_bill_no
                                }
                                onChange={
                                    handleChange
                                }
                            />
                        </div>


                        <div style={{
                            gridColumn: "1 / -1"
                        }}>

                            <label>
                                Shipping Address
                            </label>

                            <textarea
                                name="shipping_address"
                                value={
                                    formData.shipping_address
                                }
                                onChange={
                                    handleChange
                                }
                                rows="3"
                                style={{
                                    width: "100%"
                                }}
                            />

                        </div>

                    </div>


                    {/* ====================================
                        ITEMS
                    ==================================== */}

                    <h3>Items</h3>

                    <table
                        style={{
                            width: "100%",
                            borderCollapse:
                                "collapse",
                            marginBottom: "15px"
                        }}
                    >

                        <thead>

                            <tr>

                                <th>#</th>
                                <th>Item</th>
                                <th>HSN/SAC</th>
                                <th>Unit</th>
                                <th>GST %</th>
                                <th>Qty</th>
                                <th>Rate</th>
                                <th>Amount</th>
                                <th></th>

                            </tr>

                        </thead>


                        <tbody>

                            {items.map(
                                (item, index) => (

                                    <tr key={index}>

                                        <td>
                                            {index + 1}
                                        </td>


                                        <td>

                                            <select
                                                value={
                                                    item.item_id
                                                }
                                                onChange={e =>
                                                    handleItemChange(
                                                        index,
                                                        "item_id",
                                                        e.target.value
                                                    )
                                                }
                                            >

                                                <option value="">
                                                    Select Item
                                                </option>

                                                {itemsMaster.map(
                                                    masterItem => (

                                                        <option
                                                            key={
                                                                masterItem.id
                                                            }
                                                            value={
                                                                masterItem.id
                                                            }
                                                        >
                                                            {
                                                                masterItem.item_name
                                                            }
                                                        </option>

                                                    )
                                                )}

                                            </select>

                                        </td>


                                        <td>

                                            <input
                                                type="text"
                                                value={
                                                    item.hsn_sac
                                                }
                                                readOnly
                                            />

                                        </td>


                                        <td>

                                            <UomDropdown
                                                value={
                                                    item.unit
                                                }
                                                onChange={value =>
                                                    handleItemChange(
                                                        index,
                                                        "unit",
                                                        value
                                                    )
                                                }
                                            />

                                        </td>


                                        <td>

                                            <GstRateDropdown
                                                value={
                                                    item.gst_rate
                                                }
                                                onChange={value =>
                                                    handleItemChange(
                                                        index,
                                                        "gst_rate",
                                                        value
                                                    )
                                                }
                                            />

                                        </td>


                                        <td>

                                            <input
                                                type="number"
                                                step="0.001"
                                                value={
                                                    item.qty
                                                }
                                                onChange={e =>
                                                    handleItemChange(
                                                        index,
                                                        "qty",
                                                        e.target.value
                                                    )
                                                }
                                            />

                                        </td>


                                        <td>

                                            <input
                                                type="number"
                                                step="0.01"
                                                value={
                                                    item.rate
                                                }
                                                onChange={e =>
                                                    handleItemChange(
                                                        index,
                                                        "rate",
                                                        e.target.value
                                                    )
                                                }
                                            />

                                        </td>


                                        <td>

                                            <input
                                                type="number"
                                                value={
                                                    item.amount
                                                }
                                                readOnly
                                            />

                                        </td>


                                        <td>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeItem(
                                                        index
                                                    )
                                                }
                                            >
                                                ×
                                            </button>

                                        </td>

                                    </tr>

                                )
                            )}

                        </tbody>

                    </table>


                    <button
                        type="button"
                        onClick={addItem}
                    >
                        + Add Item
                    </button>


                    {/* ====================================
                        REMARKS
                    ==================================== */}

                    <div style={{
                        marginTop: "20px"
                    }}>

                        <label>
                            Remarks
                        </label>

                        <textarea
                            name="remarks"
                            value={
                                formData.remarks
                            }
                            onChange={
                                handleChange
                            }
                            rows="3"
                            style={{
                                width: "100%"
                            }}
                        />

                    </div>


                    {/* ====================================
                        TOTALS
                    ==================================== */}

                    <div style={{
                        marginTop: "20px",
                        marginLeft: "auto",
                        maxWidth: "350px"
                    }}>

                        <div>
                            Taxable Value:
                            {" "}
                            ₹
                            {Number(
                                formData.taxable_value
                            ).toFixed(2)}
                        </div>

                        <div>
                            CGST:
                            {" "}
                            ₹
                            {Number(
                                formData.cgst
                            ).toFixed(2)}
                        </div>

                        <div>
                            SGST:
                            {" "}
                            ₹
                            {Number(
                                formData.sgst
                            ).toFixed(2)}
                        </div>

                        <div>
                            IGST:
                            {" "}
                            ₹
                            {Number(
                                formData.igst
                            ).toFixed(2)}
                        </div>

                        <hr />

                        <strong>
                            Total:
                            {" "}
                            ₹
                            {Number(
                                formData.total_amount
                            ).toFixed(2)}
                        </strong>

                    </div>


                    {/* ====================================
                        BUTTONS
                    ==================================== */}

                    <div style={{
                        marginTop: "25px"
                    }}>

                        <button
                            type="submit"
                        >
                            {editingChallanId
                                ? "Update Delivery Challan"
                                : "Save Delivery Challan"}
                        </button>


                        {editingChallanId && (

                            <button
                                type="button"
                                onClick={resetForm}
                                style={{
                                    marginLeft: "10px"
                                }}
                            >
                                Cancel Edit
                            </button>

                        )}

                    </div>

                </form>

            )}


            {/* ============================================
                PREVIOUS CHALLANS
            ============================================ */}

            {currentCompanyId && (

                <div style={{
                    marginTop: "40px"
                }}>

                    <h3>
                        Previous Delivery Challans
                    </h3>


                    {challans.length === 0 ? (

                        <p>
                            No Delivery Challans found
                            for this company.
                        </p>

                    ) : (

                        <table style={{
                            width: "100%",
                            borderCollapse:
                                "collapse"
                        }}>

                            <thead>

                                <tr>

                                    <th>
                                        Challan No.
                                    </th>

                                    <th>
                                        Date
                                    </th>

                                    <th>
                                        Customer
                                    </th>

                                    <th>
                                        Total
                                    </th>

                                    <th>
                                        Actions
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {challans.map(
                                    challan => (

                                        <tr
                                            key={
                                                challan.id
                                            }
                                        >

                                            <td>
                                                {
                                                    challan.challan_no
                                                }
                                            </td>

                                            <td>
                                                {
                                                    challan.challan_date
                                                }
                                            </td>

                                            <td>
                                                {
                                                    challan.customer_name
                                                }
                                            </td>

                                            <td>
                                                ₹
                                                {Number(
                                                    challan.total_amount ||
                                                    0
                                                ).toFixed(2)}
                                            </td>

                                            <td>

                                               

    <button
        type="button"
        onClick={() =>
            viewChallan(challan.id)
        }
        className="delivery-challan-list-action"
    >
        View
    </button>


    <button
        type="button"
        onClick={() =>
            handleEdit(challan.id)
        }
        className="delivery-challan-list-action"
    >
        Edit
    </button>


    <button
        type="button"
        onClick={() =>
            handleDelete(challan.id)
        }
        className="delivery-challan-list-action"
    >
        Delete
    </button>

</td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    )}

                </div>

            )}
{printMode && selectedChallan && (

    <DeliveryChallanPrint
        challan={selectedChallan}
        items={selectedChallanItems}
        settings={challanSettings}
        company={companyDetails}
        customer={customerDetails}
        onClose={() => {
            setPrintMode(false);
            setSelectedChallan(null);
            setSelectedChallanItems([]);
        }}
    />

)}
        </div>

    );
}

export default DeliveryChallan;
