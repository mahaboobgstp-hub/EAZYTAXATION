import React, { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { supabase } from "../../supabase/supabaseClient";
import { useLocation, useNavigate } from "react-router-dom";
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

const isNativeAndroid = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";

function DeliveryChallan() {

    const location = useLocation();
    const navigate = useNavigate();
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
    const [salesOrders, setSalesOrders] = useState([]);
    const [deliveryType, setDeliveryType] = useState("WITHOUT_ORDER");
    const [selectedChallan, setSelectedChallan] = useState(null);
const [selectedChallanItems, setSelectedChallanItems] = useState([]);
const [companyDetails, setCompanyDetails] = useState(null);
const [customerDetails, setCustomerDetails] = useState(null);
const [challanSettings, setChallanSettings] = useState(null);
const [printMode, setPrintMode] = useState(false);

    const [editingChallanId, setEditingChallanId] = useState(null);
    const [mobileStep, setMobileStep] = useState(1);
    const [savingChallan, setSavingChallan] = useState(false);

    const [formData, setFormData] = useState({
        company_id: "",
        company_name: "",
        company_state: "",

        challan_no: "",
        challan_date: "",
        sales_order_id: "",
        sales_order_no: "",

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
        loadSalesOrders();

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

    const loadSalesOrders = async () => {
        if (!currentCompanyId) return;
        try {
            const { data, error } = await supabase
                .from("sales_orders")
                .select("id, order_no, order_date, expected_delivery_date, customer_id, customer_name, fulfillment_status, status")
                .eq("company_id", currentCompanyId)
                .eq("is_deleted", false)
                .order("order_date", { ascending: false });
            if (error) throw error;
            setSalesOrders((data || []).filter(order => String(order.status || "").toLowerCase() !== "cancelled"));
        } catch (error) {
            console.error("Error loading sales orders:", error);
            setSalesOrders([]);
        }
    };


    const refreshSalesOrderFulfillment = async (orderId) => {
        if (!orderId || !currentCompanyId) return;
        const { data: orderItems, error: orderItemsError } = await supabase
            .from("sales_order_items")
            .select("item_id, qty")
            .eq("order_id", orderId);
        if (orderItemsError) throw orderItemsError;

        const { data: challans, error: challanError } = await supabase
            .from("delivery_challans")
            .select("id, status")
            .eq("company_id", currentCompanyId)
            .eq("sales_order_id", orderId)
            .eq("is_deleted", false);
        if (challanError) throw challanError;

        const activeIds = (challans || [])
            .filter(row => String(row.status || "").toLowerCase() !== "cancelled")
            .map(row => row.id);
        let deliveredItems = [];
        if (activeIds.length) {
            const { data, error } = await supabase
                .from("delivery_challan_items")
                .select("item_id, qty")
                .in("challan_id", activeIds);
            if (error) throw error;
            deliveredItems = data || [];
        }

        const deliveredByItem = new Map();
        deliveredItems.forEach(row => deliveredByItem.set(row.item_id, (deliveredByItem.get(row.item_id) || 0) + (Number(row.qty) || 0)));
        const orderedByItem = new Map();
        (orderItems || []).forEach(row => orderedByItem.set(row.item_id, (orderedByItem.get(row.item_id) || 0) + (Number(row.qty) || 0)));
        const hasAnyDelivery = deliveredItems.some(row => Number(row.qty) > 0);
        const fullySupplied = orderedByItem.size > 0 && [...orderedByItem.entries()].every(([itemId, orderedQty]) => (deliveredByItem.get(itemId) || 0) >= orderedQty);
        const fulfillmentStatus = fullySupplied ? "Fulfilled" : hasAnyDelivery ? "Partially Fulfilled" : "Pending";

        const { error: updateError } = await supabase
            .from("sales_orders")
            .update({ fulfillment_status: fulfillmentStatus })
            .eq("id", orderId)
            .eq("company_id", currentCompanyId);
        if (updateError) throw updateError;
    };


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

    const handleSalesOrderChange = async (e) => {
        const orderId = e.target.value;
        if (!orderId) {
            setDeliveryType("WITHOUT_ORDER");
            setFormData(prev => ({ ...prev, sales_order_id: "", sales_order_no: "" }));
            setItems([{
                item_id: "", item_name: "", hsn_sac: "", unit: "",
                gst_rate: 18, qty: 1, rate: 0, amount: 0
            }]);
            calculateTotals([{
                item_id: "", item_name: "", hsn_sac: "", unit: "",
                gst_rate: 18, qty: 1, rate: 0, amount: 0
            }]);
            return;
        }
        try {
            const { data: order, error: orderError } = await supabase
                .from("sales_orders")
                .select("id, order_no, customer_id, customer_name, company_id")
                .eq("id", orderId)
                .eq("company_id", currentCompanyId)
                .eq("is_deleted", false)
                .single();
            if (orderError) throw orderError;

            const { data: orderItems, error: itemError } = await supabase
                .from("sales_order_items")
                .select("item_id, item_name, hsn_sac, unit, qty, rate, gst_rate")
                .eq("order_id", orderId)
                .order("line_no", { ascending: true });
            if (itemError) throw itemError;

            const { data: previousChallans, error: challanError } = await supabase
                .from("delivery_challans")
                .select("id, status")
                .eq("company_id", currentCompanyId)
                .eq("sales_order_id", orderId)
                .eq("is_deleted", false);
            if (challanError) throw challanError;

            const activeChallanIds = (previousChallans || [])
                .filter(challan => String(challan.status || "").toLowerCase() !== "cancelled")
                .map(challan => challan.id);
            let previousItems = [];
            if (activeChallanIds.length) {
                const { data, error } = await supabase
                    .from("delivery_challan_items")
                    .select("item_id, qty")
                    .in("challan_id", activeChallanIds);
                if (error) throw error;
                previousItems = data || [];
            }

            const deliveredRemaining = new Map();
            previousItems.forEach(item => deliveredRemaining.set(item.item_id, (deliveredRemaining.get(item.item_id) || 0) + (Number(item.qty) || 0)));
            const nextItems = (orderItems || []).map(orderItem => {
                const ordered = Number(orderItem.qty) || 0;
                const deliveredAvailable = deliveredRemaining.get(orderItem.item_id) || 0;
                const previouslyDelivered = Math.min(ordered, deliveredAvailable);
                deliveredRemaining.set(orderItem.item_id, Math.max(0, deliveredAvailable - previouslyDelivered));
                const pending = Math.max(0, ordered - previouslyDelivered);
                return {
                    item_id: orderItem.item_id || "",
                    item_name: orderItem.item_name || "",
                    hsn_sac: orderItem.hsn_sac || "",
                    unit: orderItem.unit || "",
                    gst_rate: Number(orderItem.gst_rate) || 0,
                    qty: pending,
                    rate: Number(orderItem.rate) || 0,
                    amount: pending * (Number(orderItem.rate) || 0),
                    ordered_qty: ordered,
                    delivered_qty: previouslyDelivered,
                    pending_qty: pending,
                    max_delivery_qty: pending
                };
            }).filter(item => item.item_id);

            let selectedCustomer = customers.find(customer => customer.id === order.customer_id);
            if (!selectedCustomer && order.customer_id) {
                const { data: customerData, error: customerError } = await supabase
                    .from("customers")
                    .select("id, customer_name, state, address")
                    .eq("id", order.customer_id)
                    .eq("company_id", currentCompanyId)
                    .single();
                if (customerError) throw customerError;
                selectedCustomer = customerData;
            }
            setDeliveryType("ORDER");
            setFormData(prev => ({
                ...prev,
                sales_order_id: order.id,
                sales_order_no: order.order_no,
                customer_id: order.customer_id || "",
                customer_name: order.customer_name || selectedCustomer?.customer_name || "",
                customer_state: selectedCustomer?.state || "",
                billing_address: selectedCustomer?.address || "",
                place_of_supply: selectedCustomer?.state || prev.place_of_supply || ""
            }));
            setItems(nextItems);
            calculateTotals(nextItems);
            if (!nextItems.length || nextItems.every(item => item.pending_qty <= 0)) {
                alert("This sales order has no pending quantities left to deliver.");
            }
        } catch (error) {
            console.error("Unable to load sales order items:", error);
            alert(error.message || "Unable to load the selected sales order.");
        }
    };


    const handleCustomerChange = (e) => {

        const customerId = e.target.value;

        const customer =
            customers.find(
                c => c.id === customerId
            );


        if (!customer) {

            setDeliveryType("WITHOUT_ORDER");
            setFormData(prev => ({
                ...prev,
                sales_order_id: "",
                sales_order_no: "",
                customer_id: "",
                customer_name: "",
                customer_state: "",
                billing_address: "",
                place_of_supply: ""
            }));

            return;
        }


        setDeliveryType("WITHOUT_ORDER");
        setFormData(prev => ({
            ...prev,
            sales_order_id: "",
            sales_order_no: "",

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

        if (field === "qty" && deliveryType === "ORDER" && Number(value) > Number(updatedItems[index].max_delivery_qty || 0)) {
            alert("Delivery quantity cannot exceed the pending quantity for this sales order item.");
            value = updatedItems[index].max_delivery_qty || 0;
        }
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

    const handleSubmit = async (e, generateEwayBill = false) => {

        e.preventDefault();
        if (savingChallan) return;
        setSavingChallan(true);

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


            if (deliveryType === "ORDER" && !formData.sales_order_id) {
                alert("Select the sales order for this delivery.");
                return;
            }

            if (deliveryType === "ORDER" && items.some(item => Number(item.qty) > Number(item.max_delivery_qty || 0))) {
                alert("One or more delivery quantities exceed the pending sales order quantity.");
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


            let savedChallanId = editingChallanId;
            if (editingChallanId) {

                await updateDeliveryChallan(
                    editingChallanId,
                    challanHeader,
                    items,
                    currentCompanyId
                );
                if (formData.sales_order_id) {
                    try { await refreshSalesOrderFulfillment(formData.sales_order_id); }
                    catch (statusError) { console.error("Challan saved, but order status refresh failed:", statusError); }
                }

                alert(
                    "Delivery Challan Updated Successfully"
                );

            } else {

                savedChallanId = await saveDeliveryChallan(
                    challanHeader,
                    items,
                    currentCompanyId
                );
                if (formData.sales_order_id) await refreshSalesOrderFulfillment(formData.sales_order_id);

                alert(
                    "Delivery Challan Saved Successfully"
                );

            }


            if (generateEwayBill) {
                alert("Delivery Challan saved successfully. Automatic E-Way Bill issuance is not connected yet. Please open the E-Way Bill portal from E-Way Bill Management, generate the bill using this Delivery Challan, then record the issued E-Way Bill number.");
                navigate("/app/eway-bills", { state: { sourceType: "Delivery Challan", sourceId: savedChallanId, documentNo: formData.challan_no } });
                return;
            }

            resetForm();
            loadChallans();

        } catch (error) {
            console.error(error);
            alert(error.message);
        } finally {
            setSavingChallan(false);
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
            setDeliveryType("WITHOUT_ORDER");
            setMobileStep(1);

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
                sales_order_id: challan.sales_order_id || "",
                sales_order_no: challan.sales_order_no || "",

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
        setDeliveryType("WITHOUT_ORDER");
        setMobileStep(1);


        setFormData({

            company_id:
                currentCompanyId || "",

            company_name:
                currentCompany?.company_name || "",

            company_state:
                currentCompany?.state || "",

            challan_no: "",

            challan_date: today,
            sales_order_id: "",
            sales_order_no: "",

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

    useEffect(() => {
        const challanId = location.state?.editChallanId;
        const salesOrderId = location.state?.salesOrderId;
        if (!currentCompanyId) return;
        if (challanId) {
            handleEdit(challanId).then(() => navigate("/app/delivery-challans/new", { replace: true, state: null }));
            return;
        }
        if (salesOrderId) {
            setMobileStep(1);
            handleSalesOrderChange({ target: { value: salesOrderId } })
                .then(() => navigate("/app/delivery-challans/new", { replace: true, state: null }));
        }
    }, [currentCompanyId, location.state]);

    return (

        <main className="delivery-challan-page">

            <div className="delivery-challan-page-heading"><h2>
                {editingChallanId ? "Edit Delivery Challan" : "New Delivery Challan"}
            </h2>{!isNativeAndroid && <a href="/app/delivery-challans">Back to Delivery Challans</a>}</div>


            {/* ============================================
                COMPANY
            ============================================ */}

{!isNativeAndroid && (
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
            )}


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

                isNativeAndroid ? (<form className="dc-mobile-wizard" onSubmit={handleSubmit}>
{mobileStep === 1 && <section className="dc-mobile-panel">
<div className="dc-mobile-stepper"><b className="is-current">1 Details</b><b>2 Items</b><b>3 Review</b></div>
<div className="dc-mobile-design-card">
<div className="dc-mobile-design-card-heading"><span className="dc-design-icon">▤</span><h3>Challan Details</h3></div>
<div className="dc-mobile-two-column">
<div className="dc-mobile-field"><label>Challan Number <em>*</em></label><input name="challan_no" value={formData.challan_no} onChange={handleChange} placeholder="DC00001" required /></div>
<div className="dc-mobile-field"><label>Challan Date <em>*</em></label><input type="date" name="challan_date" value={formData.challan_date} onChange={handleChange} required /></div>
</div></div>
<div className="dc-mobile-design-card">
<div className="dc-mobile-design-card-heading"><span className="dc-design-icon">♙</span><h3>Party & Delivery</h3></div>
<div className="dc-mobile-two-column">
<div className="dc-mobile-field"><label>Customer <em>*</em></label><select value={formData.customer_id} onChange={handleCustomerChange} disabled={deliveryType==="ORDER"} required><option value="">Select Customer</option>{customers.map(c=><option key={c.id} value={c.id}>{c.customer_name}</option>)}</select></div>
<div className="dc-mobile-field"><label>Delivery Type <em>*</em></label><select value={deliveryType} onChange={e=>{const v=e.target.value;setDeliveryType(v);if(v==="WITHOUT_ORDER"){setFormData(p=>({...p,sales_order_id:"",sales_order_no:""}));const empty=[{item_id:"",item_name:"",hsn_sac:"",unit:"",gst_rate:18,qty:1,rate:0,amount:0}];setItems(empty);calculateTotals(empty);}}}><option value="WITHOUT_ORDER">Without Sales Order</option><option value="ORDER">Against Sales Order</option></select></div>
</div>
{deliveryType==="ORDER" && <div className="dc-mobile-field"><label>Sales Order <em>*</em></label><select value={formData.sales_order_id} onChange={handleSalesOrderChange} required><option value="">Select Sales Order</option>{salesOrders.map(o=><option key={o.id} value={o.id}>{o.order_no} · {o.customer_name}</option>)}</select></div>}
<div className="dc-mobile-field"><label>Place of Supply <em>*</em></label><select name="place_of_supply" value={formData.place_of_supply} onChange={handleChange} required><option value="">Select State</option>{states.map(st=><option key={st.id||st.state_name||st.name} value={st.state_name||st.name}>{st.state_name||st.name}</option>)}</select></div>
</div>
<button type="button" className="dc-mobile-primary" onClick={()=>{if(!formData.challan_no||!formData.challan_date||!formData.customer_id||!formData.place_of_supply){alert("Complete the required challan details first.");return;}if(deliveryType==="ORDER"&&!formData.sales_order_id){alert("Select a sales order first.");return;}setMobileStep(2);window.scrollTo({top:0,behavior:"smooth"});}}>Continue to Items →</button>
</section>}
{mobileStep === 2 && <section className="dc-mobile-panel">
<header className="dc-panel-heading"><span>STEP 02 · ITEMS</span><h3>Items to deliver</h3><p>Add each item as a separate card</p></header>
<div className="dc-mobile-stepper"><b className="is-complete">1 Details</b><b className="is-current">2 Items</b><b>3 Review</b></div>
{deliveryType==="ORDER"&&<div className="dc-order-note">Sales Order: <strong>{formData.sales_order_no}</strong><br/>Delivery quantities are restricted to pending quantities.</div>}
<div className="dc-mobile-item-list">{items.map((item,i)=><article className="dc-mobile-item-card" key={i}>
<div className="dc-item-card-top"><strong>Item {i+1}</strong>{items.length>1&&<button type="button" onClick={()=>removeItem(i)}>Remove</button>}</div>
<div className="dc-mobile-field"><label>Item</label>{deliveryType==="ORDER"?<input value={item.item_name||""} readOnly/>:<select value={item.item_id} onChange={e=>handleItemChange(i,"item_id",e.target.value)}><option value="">Select Item</option>{itemsMaster.map(m=><option key={m.id} value={m.id}>{m.item_name}</option>)}</select>}</div>
<div className="dc-item-meta-grid">
<div className="dc-mobile-field"><label>HSN / SAC</label><input value={item.hsn_sac||""} readOnly/></div>
<div className="dc-mobile-field"><label>Unit</label><UomDropdown value={item.unit} onChange={v=>handleItemChange(i,"unit",v)}/></div>
<div className="dc-mobile-field"><label>GST Rate</label><GstRateDropdown value={item.gst_rate} onChange={v=>handleItemChange(i,"gst_rate",v)}/></div>
<div className="dc-mobile-field"><label>Quantity</label><input type="number" min="0" step="0.001" value={item.qty} onChange={e=>handleItemChange(i,"qty",e.target.value)}/></div>
<div className="dc-mobile-field"><label>Rate (₹)</label><input type="number" min="0" step="0.01" value={item.rate} onChange={e=>handleItemChange(i,"rate",e.target.value)}/></div></div>
{deliveryType==="ORDER"&&<div className="dc-order-qty-summary"><span>Ordered <b>{Number(item.ordered_qty||0).toFixed(3)}</b></span><span>Delivered <b>{Number(item.delivered_qty||0).toFixed(3)}</b></span><span>Pending <b>{Number(item.pending_qty||0).toFixed(3)}</b></span></div>}
<div className="dc-item-amount"><span>Item Amount</span><strong>₹{Number(item.amount||0).toFixed(2)}</strong></div></article>)}</div>
{deliveryType!=="ORDER"&&<button type="button" className="dc-add-item" onClick={addItem}>＋ Add Another Item</button>}
<div className="dc-mobile-action-row"><button type="button" className="dc-mobile-secondary" onClick={()=>{setMobileStep(1);window.scrollTo({top:0,behavior:"smooth"});}}>Back</button><button type="button" className="dc-mobile-primary" onClick={()=>{if(!items.some(i=>i.item_id&&Number(i.qty)>0)){alert("Add at least one item with a valid quantity.");return;}setMobileStep(3);window.scrollTo({top:0,behavior:"smooth"});}}>Review Challan →</button></div>
</section>}
{mobileStep === 3 && <section className="dc-mobile-panel">
<header className="dc-panel-heading"><span>STEP 03 · REVIEW</span><h3>Review Delivery Challan</h3><p>Verify the information before saving</p></header>
<div className="dc-mobile-stepper"><b className="is-complete">1 Details</b><b className="is-complete">2 Items</b><b className="is-current">3 Review</b></div>
<div className="dc-review-card"><div className="dc-review-card-heading"><h4>Challan Details</h4><button type="button" onClick={()=>setMobileStep(1)}>Edit</button></div><dl>
<div><dt>Challan Number</dt><dd>{formData.challan_no}</dd></div><div><dt>Date</dt><dd>{formData.challan_date}</dd></div><div><dt>Customer</dt><dd>{formData.customer_name||customers.find(c=>c.id===formData.customer_id)?.customer_name||"—"}</dd></div><div><dt>Place of Supply</dt><dd>{formData.place_of_supply||"—"}</dd></div>{formData.sales_order_no&&<div><dt>Sales Order</dt><dd>{formData.sales_order_no}</dd></div>}</dl></div>
<div className="dc-review-card"><div className="dc-review-card-heading"><h4>Items Summary</h4><button type="button" onClick={()=>setMobileStep(2)}>Edit</button></div>{items.filter(i=>i.item_id).map((i,n)=><div className="dc-review-item" key={n}><div><strong>{i.item_name||itemsMaster.find(m=>m.id===i.item_id)?.item_name||"Item"}</strong><small>{i.qty} {i.unit} × ₹{Number(i.rate||0).toFixed(2)} · GST {i.gst_rate}%</small></div><b>₹{Number(i.amount||0).toFixed(2)}</b></div>)}</div>
<div className="dc-review-card dc-review-remarks-card">
<h4>Additional Information</h4>
<div className="dc-mobile-field"><label>Remarks (Optional)</label><textarea name="remarks" value={formData.remarks} onChange={handleChange} rows={4} placeholder="Enter delivery remarks"/></div>
</div>
<div className="dc-tax-summary"><div><span>Taxable Value</span><strong>₹{Number(formData.taxable_value||0).toFixed(2)}</strong></div>{Number(formData.cgst)>0&&<div><span>CGST</span><strong>₹{Number(formData.cgst).toFixed(2)}</strong></div>}{Number(formData.sgst)>0&&<div><span>SGST</span><strong>₹{Number(formData.sgst).toFixed(2)}</strong></div>}{Number(formData.igst)>0&&<div><span>IGST</span><strong>₹{Number(formData.igst).toFixed(2)}</strong></div>}<div className="dc-tax-grand-total"><span>Total Amount</span><strong>₹{Number(formData.total_amount||0).toFixed(2)}</strong></div></div>
<div className="dc-mobile-action-row"><button type="button" className="dc-mobile-secondary" onClick={()=>{setMobileStep(2);window.scrollTo({top:0,behavior:"smooth"});}}>Back</button><button type="submit" className="dc-mobile-primary" disabled={savingChallan}>{savingChallan?"Saving...":editingChallanId?"Update Challan":"Save Challan"}</button></div>
<button type="button" className="dc-mobile-eway" disabled={savingChallan} onClick={e=>handleSubmit(e,true)}>{savingChallan?"Saving...":"Save & Generate E-Way Bill"}</button>
</section>}
</form>) : (<form onSubmit={handleSubmit}>
                    {isNativeAndroid && <nav className="dc-mobile-steps" aria-label="Delivery challan steps"><span className={mobileStep === 1 ? "active" : mobileStep > 1 ? "complete" : ""}>1. Details</span><span className={mobileStep === 2 ? "active" : mobileStep > 2 ? "complete" : ""}>2. Items</span><span className={mobileStep === 3 ? "active" : ""}>3. Review</span></nav>}



                    {(!isNativeAndroid || mobileStep === 1) && <>
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

                        {isNativeAndroid && <div>
                            <label>Delivery Type</label>
                            <select value={deliveryType} onChange={event => {
                                const nextType = event.target.value;
                                setDeliveryType(nextType);
                                if (nextType === "WITHOUT_ORDER") {
                                    setFormData(prev => ({ ...prev, sales_order_id: "", sales_order_no: "" }));
                                    const emptyItems = [{ item_id: "", item_name: "", hsn_sac: "", unit: "", gst_rate: 18, qty: 1, rate: 0, amount: 0 }];
                                    setItems(emptyItems);
                                    calculateTotals(emptyItems);
                                }
                            }}>
                                <option value="WITHOUT_ORDER">Without Sales Order</option>
                                <option value="ORDER">Against Sales Order</option>
                            </select>
                        </div>}

                        {isNativeAndroid && deliveryType === "ORDER" && <div>
                            <label>Sales Order</label>
                            <select value={formData.sales_order_id} onChange={handleSalesOrderChange} required>
                                <option value="">Select Sales Order</option>
                                {salesOrders.map(order => <option key={order.id} value={order.id}>{order.order_no} · {order.customer_name}</option>)}
                            </select>
                            <small>Ordered, previously delivered and pending quantities are calculated from this order.</small>
                        </div>}


                        <div>
                            <label>
                                Customer
                            </label>

                            <select
                                value={formData.customer_id}
                                onChange={handleCustomerChange}
                                disabled={isNativeAndroid && deliveryType === "ORDER"}
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


                    </>}

                    {(!isNativeAndroid || mobileStep === 2) && <>
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
                                {isNativeAndroid && deliveryType === "ORDER" && <>
                                    <th>Ordered</th>
                                    <th>Delivered</th>
                                    <th>Pending</th>
                                </>}
                                <th>{isNativeAndroid && deliveryType === "ORDER" ? "Deliver Now" : "Qty"}</th>
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

                                            {isNativeAndroid && deliveryType === "ORDER" ? (
                                                <input value={item.item_name || ""} readOnly />
                                            ) : (
                                                <select
                                                    value={item.item_id}
                                                    onChange={e => handleItemChange(index, "item_id", e.target.value)}
                                                >
                                                    <option value="">Select Item</option>
                                                    {itemsMaster.map(masterItem => <option key={masterItem.id} value={masterItem.id}>{masterItem.item_name}</option>)}
                                                </select>
                                            )}

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
                                                value={item.gst_rate}
                                                onChange={value => handleItemChange(index, "gst_rate", value)}
                                            />

                                        </td>

                                        {isNativeAndroid && deliveryType === "ORDER" && <>
                                            <td>{Number(item.ordered_qty || 0).toFixed(3)}</td>
                                            <td>{Number(item.delivered_qty || 0).toFixed(3)}</td>
                                            <td>{Number(item.pending_qty || 0).toFixed(3)}</td>
                                        </>}

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


                    </>}

                    {(!isNativeAndroid || mobileStep === 3) && <>
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


                    </>}

                    {/* ====================================
                        BUTTONS
                    ==================================== */}

                    <div className="delivery-challan-actions">
                        {isNativeAndroid ? <>
                            <button type="button" className="delivery-challan-secondary-btn" onClick={() => mobileStep === 1 ? navigate("/app/delivery-challans") : setMobileStep(step => step - 1)}>{mobileStep === 1 ? "Cancel" : "Back"}</button>
                            {mobileStep < 3
                                ? <button type="button" className="delivery-challan-primary-btn" onClick={() => {
                                    if (mobileStep === 1 && (!formData.challan_no || !formData.challan_date || !formData.customer_id)) { alert("Complete challan number, date and customer first."); return; }
                                    if (mobileStep === 2 && !items.some(item => item.item_id && Number(item.qty) > 0)) { alert("Add at least one item with a valid delivery quantity."); return; }
                                    setMobileStep(step => step + 1);
                                }}>Next: {mobileStep === 1 ? "Add Items" : "Review"} →</button>
                                : <div className="dc-save-options">
                                    <button type="submit" className="delivery-challan-primary-btn" disabled={savingChallan}>{savingChallan ? "Saving..." : editingChallanId ? "Update Challan" : "Save Challan"}</button>
                                    <button type="button" className="dc-save-eway-btn" disabled={savingChallan} onClick={e => handleSubmit(e, true)}>{savingChallan ? "Saving..." : "Save & Generate E-Way Bill"}</button>
                                </div>}
                        </> : <>
                            <button type="submit" className="delivery-challan-primary-btn" disabled={savingChallan}>{savingChallan ? "Saving..." : editingChallanId ? "Update Delivery Challan" : "Save Delivery Challan"}</button>
                            <button type="button" className="dc-save-eway-btn" disabled={savingChallan} onClick={e => handleSubmit(e, true)}>{savingChallan ? "Saving..." : "Save & Generate E-Way Bill"}</button>
                            {editingChallanId && <button type="button" className="delivery-challan-secondary-btn" onClick={resetForm}>Cancel Edit</button>}
                        </>}
                    </div>

                </form>))}

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
        </main>

    );
}

export default DeliveryChallan;
