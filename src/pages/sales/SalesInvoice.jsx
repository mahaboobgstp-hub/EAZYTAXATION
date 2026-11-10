import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCompany } from '../../context/CompanyContext';
import UomDropdown from "../../components/dropdowns/UomDropdown";
import GstRateDropdown from "../../components/dropdowns/GstRateDropdown";
import '../../css/sales/SalesInvoice.css';
import SalesInvoiceView
from '../../components/SalesInvoiceView';
import InvoicePrint
from '../../components/InvoicePrint';
import {
  getInvoiceSettingsByCompany
}
from
'../../services/invoiceSettingsService';
import { calculateSalesInvoiceTax } from "../../utils/salesInvoiceTaxCalculator";

import {
  getCustomersForDropdown,
  getItemsForDropdown,
  saveSalesInvoice,
  getSalesInvoices,
  getSalesInvoiceById,
  getSalesInvoiceItems,
  generateInvoiceNumber,
  updateSalesInvoice,
  deleteSalesInvoice
} from '../../services/salesInvoiceService';
import {
  getCompanyById
} from "../../services/companyService";
import {
  getCustomerById
} from "../../services/customerService";
import {
  getStates
} from "../../services/stateService";
import { formatAmount } from "../../utils/amountFormatter";

const numberBelowTwenty = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const tensWords = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function indianNumberWords(value) {
  const number = Math.floor(Number(value) || 0);
  if (number < 20) return numberBelowTwenty[number];
  if (number < 100) return `${tensWords[Math.floor(number / 10)]}${number % 10 ? ` ${numberBelowTwenty[number % 10]}` : ""}`;
  const groups = [[10000000, "crore"], [100000, "lakh"], [1000, "thousand"], [100, "hundred"]];
  for (const [unit, label] of groups) {
    if (number >= unit) {
      const quotient = Math.floor(number / unit);
      const remainder = number % unit;
      return `${indianNumberWords(quotient)} ${label}${remainder ? ` ${indianNumberWords(remainder)}` : ""}`;
    }
  }
  return "zero";
}

function formatAmountInWords(value) {
  const numeric = Number(value) || 0;
  const paiseTotal = Math.round(Math.abs(numeric) * 100);
  const rupees = Math.floor(paiseTotal / 100);
  const paise = paiseTotal % 100;
  const prefix = numeric < 0 ? "Minus " : "";
  const rupeeWords = `${prefix}Rupees ${indianNumberWords(rupees)}`;
  return paise
    ? `${rupeeWords} and ${indianNumberWords(paise)} paise only`
    : `${rupeeWords} only`;
}

function todayISODate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function SalesInvoice() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
  currentCompany,
  currentCompanyId,  
  loading: companyLoading
} = useCompany();

  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [itemsMaster, setItemsMaster] = useState([]);
  //const [companies, setCompanies] = useState([]);
  const [states, setStates] = useState([]);
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [printMode, setPrintMode] = useState(false);

  const [saleType, setSaleType] = useState("CASH");
const [paymentMode, setPaymentMode] = useState("CASH");
const [amountReceived, setAmountReceived] = useState("");
 const [invoiceSettings,
setInvoiceSettings] =
useState(null);
  const [
  companyDetails,
  setCompanyDetails
] = useState(null);
  const [
  customerDetails,
  setCustomerDetails
] = useState(null);
  const [taxInclusive, setTaxInclusive] = useState(false);

const [discountType, setDiscountType] = useState("AMOUNT");
const [discountValue, setDiscountValue] = useState(0);

const [otherAmount, setOtherAmount] = useState(0);
const [roundOff, setRoundOff] = useState(0);
  
  const [formData, setFormData] = useState({

  company_id: '',
  company_name: '',
  company_state: '',

  invoice_no: '',
  invoice_date: todayISODate(),

  customer_id: '',
  customer_name: '',
  customer_state: '',

  billing_address: '',
  shipping_name: '',
shipping_gstin: '',
shipping_state: '',
shipping_address: '',
place_of_supply: '',
vehicle_no: '',
eway_bill_no: '',

  gst_type: '',

  remarks: ''

});

  const [items, setItems] = useState([
  {
    item_id: '',
    item_name: '',
    hsn_sac: '',
    unit:'',  
    gst_rate: 18,
    qty: 1,
    rate: 0,
    amount: 0,
    cess_rate: 0,
cess_amount: 0,
tax_inclusive: false
  }
]);

  useEffect(() => {
  loadStates();
}, []);

  useEffect(() => {
  if (!currentCompanyId) {
    setCustomers([]);
    setItemsMaster([]);
    setInvoices([]);

    setFormData(prev => ({
      ...prev,
      company_id: '',
      company_name: '',
      company_state: ''
    }));

    return;
  }

  setFormData(prev => ({
    ...prev,
    company_id: currentCompanyId,
    company_name: currentCompany?.company_name || '',
    company_state: currentCompany?.state || ''
  }));

  loadCustomers();
  loadItemsMaster();
  loadInvoices();
  loadInvoiceNumber(currentCompanyId);
  loadInvoiceNumberSettings(currentCompanyId);
}, [currentCompanyId]);
  const loadInvoiceNumberSettings = async (companyId) => {
    try {
      const settings = await getInvoiceSettingsByCompany(companyId);
      setInvoiceSettings(settings || { invoice_auto_numbering: true });
    } catch (error) {
      console.error("Unable to load invoice numbering settings:", error);
    }
  };

  const loadInvoiceNumber = async (companyId = currentCompanyId, invoiceDate = formData.invoice_date) => {

  try {

    const invoiceNumber =
      await generateInvoiceNumber(companyId, invoiceDate, false);

    setFormData(prev => ({
      ...prev,
      invoice_no: invoiceNumber || ''
    }));

  } catch (error) {

    console.error(error);

  }
};

 /* const loadCustomers = async () => {

    try {
      const data = await getCustomersForDropdown();
      setCustomers(data || []);
    } catch (error) {
      console.error(error);
    }
  };*/
  const loadCustomers = async () => {
  if (!currentCompanyId) return;

  try {
    const data = await getCustomersForDropdown(currentCompanyId);
    setCustomers(data || []);
  } catch (error) {
    console.error("Error loading customers:", error);
  }
};

 /*const loadCompanies = async () => {

  try {

    const data =
      await getCompaniesForDropdown();

    setCompanies(data || []);

  } catch (error) {

    console.error(error);

  }
};*/
  const loadStates = async () => {

  try {

    const data =
      await getStates();

    setStates(data || []);

  } catch (error) {

    console.error(error);

  }

};
/*const loadItemsMaster = async () => {

  try {

    const data =
      await getItemsForDropdown();

    setItemsMaster(data || []);

  } catch (error) {

    console.error(error);

  }
};*/
  const loadItemsMaster = async () => {
  if (!currentCompanyId) return;

  try {
    const data = await getItemsForDropdown(currentCompanyId);
    setItemsMaster(data || []);
  } catch (error) {
    console.error("Error loading items:", error);
  }
};
 /* const loadInvoices = async () => {

    try {
      const data = await getSalesInvoices();
      setInvoices(data || []);
    } catch (error) {
      console.error(error);
    }
  };*/
  const loadInvoices = async () => {
  if (!currentCompanyId) return;

  try {
    const data = await getSalesInvoices(currentCompanyId);
    setInvoices(data || []);
  } catch (error) {
    console.error("Error loading invoices:", error);
  }
};

  const handleChange = (e) => {

    const { name, value } = e.target;

    if (name === 'shipping_state') {
      setFormData(prev => ({ ...prev, shipping_state: value, place_of_supply: value }));
      return;
    }

    if (name === 'invoice_date' && !editingInvoiceId) {
      setFormData(prev => ({ ...prev, invoice_date: value }));
      if (invoiceSettings?.invoice_auto_numbering !== false) {
        loadInvoiceNumber(currentCompanyId, value);
      }
      return;
    }

    if (name === 'company_id') {

  const selectedCompany =
    companies.find(
      company => company.id === value
    );

  setFormData({
    ...formData,
    company_id: value,
    company_name:
      selectedCompany?.company_name || '',
    company_state:
      selectedCompany?.state || ''
  });

  return;
}

    
    if (name === 'customer_id') {

  const selectedCustomer =
    customers.find(
      customer => customer.id === value
    );

  setFormData({
    ...formData,
    customer_id: value,
    customer_name:
      selectedCustomer?.customer_name || '',
    customer_state:
      selectedCustomer?.state || '',
     billing_address:
    selectedCustomer?.address || '',

  shipping_name:
selectedCustomer?.customer_name || '',

shipping_gstin:
selectedCustomer?.gstin || '',

shipping_state:
selectedCustomer?.state || '',

shipping_address:
selectedCustomer?.address || '',

place_of_supply:
selectedCustomer?.state || '',
  });

  return;
}

    setFormData({
      ...formData,
      [name]: value
    });
  };

  const addRow = () => {

  setItems([
    ...items,
    {
      item_id: '',
      item_name: '',
      hsn_sac: '',
      unit:'',
      gst_rate: '',
      cess_rate: 0,
      qty: 0,
      rate: 0,
      amount: 0
    }
  ]);
};
  const removeRow = (index) => {

    const updated = [...items];

    updated.splice(index, 1);

    setItems(updated);
  };

  const handleItemChange = (
  index,
  field,
  value
) => {

  const updated = [...items];

  if (field === 'item_id') {

    const selectedItem =
      itemsMaster.find(
        item => item.id === value
      );

    if (selectedItem) {

      updated[index] = {

        ...updated[index],

        item_id: selectedItem.id,

        item_name:
          selectedItem.item_name,

        hsn_sac:
          selectedItem.hsn_sac,
        unit:
          selectedItem.unit,

        gst_rate:
          selectedItem.gst_rate,
        cess_rate:
          selectedItem.cess_rate || 0,

        rate:
          selectedItem.sales_rate,

        qty: 1,

        amount:
          Number(
            selectedItem.sales_rate
          )
      };
    } else {
      updated[index] = {
        ...updated[index],
        item_id: '',
        item_name: value,
        hsn_sac: '',
        unit: '',
        gst_rate: 18,
        cess_rate: 0,
        rate: 0,
        amount: 0
      };
    }

  } else {

    updated[index][field] = value;

    const qty =
      Number(updated[index].qty) || 0;

    const rate =
      Number(updated[index].rate) || 0;

    updated[index].amount =
      qty * rate;
  }

  setItems(updated);
};
const [selectedInvoice,
setSelectedInvoice] =
useState(null);

const [selectedItems,
setSelectedItems] =
useState([]);
 

  const [editingInvoiceId,
setEditingInvoiceId] =
useState(null);
  
  const intraState =
  Boolean(formData.company_state) &&
  Boolean(formData.place_of_supply) &&
  formData.company_state === formData.place_of_supply;

const { items: calculatedItems, totals } =
  calculateSalesInvoiceTax({
    items,
    taxInclusive: taxInclusive,
    discountType,
    discountValue,
    intraState,
    otherAmount,
    roundOff
  });

const taxableValue = totals.taxable;
const cgst = totals.cgst;
const sgst = totals.sgst;
const igst = totals.igst;
const grandTotal = totals.grandTotal;

  const handleSubmit = async (e) => {

  e.preventDefault();

  try {

    // Make sure a Current Company is selected
    if (!currentCompanyId) {
      alert('Please select a Current Company from the Sidebar.');
      return;
    }

    if (!editingInvoiceId && !items.some(item => item.item_name?.trim())) {
      alert('Add at least one item before saving.');
      return;
    }

    let invoiceNumber = formData.invoice_no;
    if (!editingInvoiceId && invoiceSettings?.invoice_auto_numbering !== false) {
      invoiceNumber = await generateInvoiceNumber(currentCompanyId, formData.invoice_date, true);
      setFormData(prev => ({ ...prev, invoice_no: invoiceNumber }));
    }

    const invoiceHeader = {

      ...formData,
      invoice_no: invoiceNumber,

      // Always use the company selected in CompanyContext
      company_id: currentCompanyId,
      company_name: currentCompany?.company_name || '',
      company_state: currentCompany?.state || '',

      gst_type:
        currentCompany?.state === formData.place_of_supply
          ? 'INTRA_STATE'
          : 'INTER_STATE',

      sale_type: saleType,
      tax_inclusive: taxInclusive,
      discount_type: discountType,
      discount_value: Number(discountValue) || 0,
      discount_amount: totals.discount,
      cess_amount: totals.cess,
      additional_cess_amount: 0,
      other_amount: totals.otherAmount,
      round_off: totals.roundOff,

      taxable_value: taxableValue,

      cgst: cgst,

      sgst: sgst,

      igst: igst,

      total_amount: grandTotal

    };


    if (editingInvoiceId) {

      await updateSalesInvoice(
        editingInvoiceId,
        invoiceHeader,
        calculatedItems
      );

      alert(
        'Invoice Updated'
      );

    } else {

      const savedInvoiceId =
        await saveSalesInvoice(
          invoiceHeader,
          calculatedItems
        );

      alert(
        'Sales Invoice Saved'
      );

      await printInvoice(
        savedInvoiceId
      );


      setFormData({

        company_id: '',
        company_name: '',
        company_state: '',

        invoice_no: '',
        invoice_date: todayISODate(),

        customer_id: '',
        customer_name: '',
        customer_state: '',

        billing_address: '',

        shipping_name: '',
        shipping_gstin: '',
        shipping_state: '',
        shipping_address: '',

        place_of_supply: '',

        vehicle_no: '',
        eway_bill_no: '',

        gst_type: '',

        remarks: ''

      });


      setItems([
        {
          item_id: '',
          item_name: '',
          hsn_sac: '',
          unit: '',
          gst_rate: 18,
          qty: 1,
          rate: 0,
          amount: 0
        }
      ]);


      setEditingInvoiceId(
        null
      );
      setSaleType("CASH");
      setSameAsBilling(true);
      setTaxInclusive(false);
      setDiscountType("AMOUNT");
      setDiscountValue(0);
      setOtherAmount(0);
      setRoundOff(0);

      loadInvoiceNumber(currentCompanyId, todayISODate());

      loadInvoices();

    }

  } catch (error) {

    alert(error.message);

  }

};
  const viewInvoice = async (
  invoiceId
) => {

  try {

    const invoice =
      await getSalesInvoiceById(
        invoiceId
      );
    const company =
await getCompanyById(
  invoice.company_id
);
console.log(
  "Company Details:",
  company
);
setCompanyDetails(
  company
);
const settings =
await getInvoiceSettingsByCompany(
  invoice.company_id
);
console.log(
  "Settings Loaded:",
  settings
);
setInvoiceSettings(
  settings
);
    const items =
      await getSalesInvoiceItems(
        invoiceId
      );

    setSelectedInvoice(
      invoice
    );

    setSelectedItems(
      items
    );

  } catch (error) {

    console.error(error);

  }
};

const editInvoice = async (
  invoiceId
) => {

  try {

    const invoice =
      await getSalesInvoiceById(
        invoiceId
      );

    const invoiceItems =
      await getSalesInvoiceItems(
        invoiceId
      );

    setEditingInvoiceId(
      invoiceId
    );
    setSaleType(invoice.sale_type || "CASH");
    setSameAsBilling((invoice.billing_address || "") === (invoice.shipping_address || ""));
    setTaxInclusive(Boolean(invoice.tax_inclusive));
    setDiscountType(invoice.discount_type || "AMOUNT");
    setDiscountValue(Number(invoice.discount_value) || 0);
    setOtherAmount(Number(invoice.other_amount) || 0);
    setRoundOff(Number(invoice.round_off) || 0);

    setFormData({

  company_id: invoice.company_id || "",
  company_name: invoice.company_name || "",
  company_state: invoice.company_state || "",

  invoice_no: invoice.invoice_no,
  invoice_date: invoice.invoice_date,

  customer_id: invoice.customer_id,
  customer_name: invoice.customer_name,
  customer_state: invoice.customer_state || "",

  billing_address: invoice.billing_address || "",

  shipping_name: invoice.shipping_name || "",
  shipping_gstin: invoice.shipping_gstin || "",
  shipping_state: invoice.shipping_state || "",
  shipping_address: invoice.shipping_address || "",

  place_of_supply: invoice.place_of_supply || "",

  vehicle_no: invoice.vehicle_no || "",
  eway_bill_no: invoice.eway_bill_no || "",

  gst_type: invoice.gst_type || "",

  remarks: invoice.remarks || ""

});
    const loadedItems =
      invoiceItems.map(item => ({

        item_id: item.item_id,
        item_name: item.item_name,
        hsn_sac: item.hsn_sac,
        unit: item.unit,
        gst_rate: item.gst_rate,
        cess_rate: item.cess_rate || 0,
        qty: item.qty,
        rate: item.rate,
        amount: item.amount

      }));

    setItems(
      loadedItems
    );

  } catch (error) {

    console.error(error);

  }
};

const handleDeleteInvoice =
async (invoiceId) => {

  const confirmed =
    window.confirm(
      'Delete this invoice?'
    );

  if (!confirmed) {
    return;
  }

  try {

    await deleteSalesInvoice(
      invoiceId
    );

    alert(
      'Invoice Deleted'
    );

    loadInvoices();

  } catch (error) {

    alert(error.message);

  }
};
  const printInvoice = async (
  invoiceId
) => {

  try {

    const invoice =
      await getSalesInvoiceById(
        invoiceId
      );

    const settings =
      await getInvoiceSettingsByCompany(
        invoice.company_id
      );

    console.log(
      "Print Settings:",
      settings
    );

    setInvoiceSettings(
      settings
    );
const company =
  await getCompanyById(
    invoice.company_id
  );

console.log(
  "Company Details:",
  company
);

setCompanyDetails(
  company
);
const customer =
await getCustomerById(
  invoice.customer_id
);

setCustomerDetails(
  customer
);
    const invoiceItems =
      await getSalesInvoiceItems(
        invoiceId
      );

    setSelectedInvoice(
      invoice
    );

    setSelectedItems(
      invoiceItems
    );

    setPrintMode(true);

  } catch (error) {

    console.error(error);

  }
};
  
  useEffect(() => {
    const invoiceId = location.state?.editInvoiceId;
    if (!invoiceId || !currentCompanyId) return;
    editInvoice(invoiceId).then(() => navigate("/app/sales", { replace: true, state: null }));
  }, [currentCompanyId, location.state]);

  return (
    <div className="sales-page invoice-page">
      <div className="invoice-page-title">
        <div>
          <p className="invoice-breadcrumb">Billing &amp; Accounting / Sales / Add Sales Invoice</p>
          <h2>{editingInvoiceId ? "Edit Sales Invoice" : "Create Sales Invoice"}</h2>
          <a href="/app/sales-register" className="invoice-breadcrumb">View Sales Register</a>
        </div>
      </div>

      <form id="sales-invoice-form" className="invoice-header-form" onSubmit={handleSubmit}>
        <section className="invoice-details-card">
          <h3>Invoice details</h3>
          <div className="invoice-details-grid">
            <label className="invoice-field company-field">
              <span>Company</span>
              <input type="text" value={companyLoading ? "Loading..." : currentCompany?.company_name || "Select Company from Sidebar"} readOnly />
            </label>
            <label className="invoice-field invoice-number-field">
              <span>Invoice number</span>
              <span className="invoice-number-control">
                <input
                  type="text"
                  name="invoice_no"
                  value={formData.invoice_no}
                  onChange={handleChange}
                  readOnly={invoiceSettings?.invoice_auto_numbering !== false}
                  required
                />
                {invoiceSettings?.invoice_auto_numbering !== false && <span className="invoice-number-badge">AUTO</span>}
              </span>
            </label>
            <label className="invoice-field invoice-date-field">
              <span>Invoice date</span>
              <input
                type="date"
                name="invoice_date"
                value={formData.invoice_date || todayISODate()}
                onChange={handleChange}
                required
              />
            </label>
          </div>

          <label className="invoice-field invoice-customer-field">
            <span>Customer <b aria-hidden="true">*</b></span>
            <select name="customer_id" value={formData.customer_id} onChange={handleChange} required>
              <option value="">Select from Customer Master</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.customer_name}{customer.gstin ? ` · GSTIN ${customer.gstin}` : ""}
                </option>
              ))}
            </select>
          </label>

          <div className="invoice-type-toggle sales-cash-credit" role="group" aria-label="Invoice type">
            <button type="button" className={saleType === "CASH" ? "active" : ""} aria-pressed={saleType === "CASH"} onClick={() => setSaleType("CASH")}>Cash Sale</button>
            <button type="button" className={saleType === "CREDIT" ? "active" : ""} aria-pressed={saleType === "CREDIT"} onClick={() => setSaleType("CREDIT")}>Credit Sale</button>
          </div>
        </section>

        <section className="invoice-address-grid">
          <div className="invoice-address-card">
            <h3>Billing Address</h3>
            <textarea
              name="billing_address"
              placeholder="Billing address"
              value={formData.billing_address}
              onChange={handleChange}
            />
          </div>

          <div className="invoice-address-card">
            <div className="invoice-address-heading">
              <h3>Shipping Address</h3>
              <label className="same-address-toggle">
                <input
                  type="checkbox"
                  checked={sameAsBilling}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    setSameAsBilling(checked);
                    if (checked) {
                      setFormData(prev => ({
                        ...prev,
                        shipping_name: prev.customer_name,
                        shipping_gstin: customers.find(customer => customer.id === prev.customer_id)?.gstin || "",
                        shipping_state: prev.customer_state,
                        shipping_address: prev.billing_address,
                        place_of_supply: prev.customer_state
                      }));
                    }
                  }}
                />
                Same as billing
              </label>
            </div>
            {!sameAsBilling ? (
              <div className="shipping-fields">
                <input name="shipping_name" placeholder="Recipient name" value={formData.shipping_name} onChange={handleChange} />
                <input name="shipping_gstin" placeholder="Shipping GSTIN" value={formData.shipping_gstin} onChange={handleChange} />
                <select name="shipping_state" value={formData.shipping_state} onChange={handleChange}>
                  <option value="">Select shipping state / place of supply</option>
                  {states.map(state => <option key={state.id} value={state.state_name}>{state.state_name}</option>)}
                </select>
                <textarea name="shipping_address" placeholder="Shipping address" value={formData.shipping_address} onChange={handleChange} />
              </div>
            ) : (
              <p className="same-address-note">{formData.shipping_address || "Shipping details will use the billing address."}</p>
            )}
          </div>
        </section>
      </form>

      <div className="invoice-workspace-grid">
        <section className="invoice-items-panel">
          <div className="invoice-section-heading">
            <h3>Invoice items</h3>
            <span>{items.length} {items.length === 1 ? "item" : "items"}</span>
          </div>

          <div className="invoice-items-table-wrap">
            <table className="sales-grid invoice-items-grid">
              <thead>
                <tr>
                  <th>Item / Description</th>
                  <th>HSN/SAC</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Rate (₹)</th>
                  <th>GST</th>
                  <th>Amount (₹)</th>
                  <th aria-label="Actions"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        className="item-picker-input"
                        list={`items-master-${index}`}
                        value={item.item_name || ""}
                        placeholder="Search or type an item"
                        autoComplete="off"
                        onChange={(event) => {
                          const typed = event.target.value;
                          const match = itemsMaster.find(masterItem => masterItem.item_name?.toLowerCase() === typed.trim().toLowerCase());
                          handleItemChange(index, "item_id", match?.id || typed);
                        }}
                      />
                      <datalist id={`items-master-${index}`}>
                        {itemsMaster.map(masterItem => <option key={masterItem.id} value={masterItem.item_name} />)}
                      </datalist>
                    </td>
                    <td><input aria-label="HSN or SAC code" value={item.hsn_sac || ""} onChange={(event) => handleItemChange(index, "hsn_sac", event.target.value)} placeholder="HSN/SAC" /></td>
                    <td><input aria-label="Quantity" type="number" min="0" step="0.01" value={item.qty} onChange={(event) => handleItemChange(index, "qty", event.target.value)} /></td>
                    <td><UomDropdown name="unit" value={item.unit} onChange={(event) => handleItemChange(index, "unit", event.target.value)} /></td>
                    <td><input aria-label="Rate" type="number" min="0" step="0.01" value={item.rate} onChange={(event) => handleItemChange(index, "rate", event.target.value)} /></td>
                    <td><GstRateDropdown name="gst_rate" value={item.gst_rate} onChange={(event) => handleItemChange(index, "gst_rate", event.target.value)} /></td>
                    <td className="invoice-line-amount">₹ {formatAmount(item.amount)}</td>
                    <td><button type="button" className="invoice-remove-item" aria-label={`Remove ${item.item_name || "item"}`} onClick={() => removeRow(index)}>×</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button type="button" className="invoice-add-item" onClick={addRow}>＋ Add item</button>

          <details className="invoice-accordion">
            <summary>More item tax details</summary>
            <div className="invoice-accordion-content">
              <table className="invoice-tax-details-table">
                <thead><tr><th>Item</th><th>Cess %</th><th>Cess amount</th></tr></thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.item_name || `Item ${index + 1}`}</td>
                      <td><input aria-label={`Cess percentage for ${item.item_name || `item ${index + 1}`}`} type="number" min="0" step="0.01" value={item.cess_rate || 0} onChange={(event) => handleItemChange(index, "cess_rate", event.target.value)} /></td>
                      <td>₹ {formatAmount(calculatedItems[index]?.cess_amount || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>

          <details className="invoice-accordion">
            <summary>Transport / E-Way Bill / Remarks</summary>
            <div className="invoice-accordion-content invoice-transport-fields">
              <input name="vehicle_no" placeholder="Vehicle number" value={formData.vehicle_no} onChange={handleChange} />
              <input name="eway_bill_no" placeholder="E-Way bill number" value={formData.eway_bill_no} onChange={handleChange} />
              <label className="invoice-field">
                <span>Other charges (₹)</span>
                <input type="number" min="0" step="0.01" value={otherAmount} onChange={(event) => setOtherAmount(event.target.value)} />
              </label>
              <textarea className="invoice-remarks-field" name="remarks" placeholder="Remarks" value={formData.remarks} onChange={handleChange} />
            </div>
          </details>

          <section className="amount-in-words">
            <label>Amount in words</label>
            <p>{formatAmountInWords(grandTotal)}</p>
          </section>
        </section>

        <aside className="invoice-summary-panel" aria-label="Invoice totals">
          <h3>Invoice summary</h3>
          <div className="invoice-summary-line">
            <span>Subtotal</span><strong>₹ {formatAmount(totals.subtotal)}</strong>
          </div>
          <div className="invoice-summary-line invoice-discount-line">
            <span>Discount</span>
            <div>
              <select aria-label="Discount type" value={discountType} onChange={(event) => setDiscountType(event.target.value)}>
                <option value="AMOUNT">₹</option>
                <option value="PERCENT">%</option>
              </select>
              <input aria-label="Discount" type="number" min="0" step="0.01" value={discountValue} onChange={(event) => setDiscountValue(event.target.value)} />
              <strong>− ₹ {formatAmount(totals.discount)}</strong>
            </div>
          </div>
          {intraState ? (
            <>
              <div className="invoice-summary-line"><span>CGST</span><strong>₹ {formatAmount(cgst)}</strong></div>
              <div className="invoice-summary-line"><span>SGST</span><strong>₹ {formatAmount(sgst)}</strong></div>
            </>
          ) : (
            <div className="invoice-summary-line"><span>IGST</span><strong>₹ {formatAmount(igst)}</strong></div>
          )}
          {totals.cess > 0 && <div className="invoice-summary-line"><span>Cess</span><strong>₹ {formatAmount(totals.cess)}</strong></div>}
          <div className="invoice-summary-line"><span>Other charges</span><strong>₹ {formatAmount(totals.otherAmount)}</strong></div>
          <label className="invoice-summary-line invoice-roundoff-line">
            <span>Round off</span>
            <input aria-label="Round off" type="number" step="0.01" value={roundOff} onChange={(event) => setRoundOff(event.target.value)} />
          </label>
          <div className="invoice-summary-grand-total"><span>Grand Total</span><strong>₹ {formatAmount(grandTotal)}</strong></div>
          <button type="submit" form="sales-invoice-form" className="invoice-save-button">
            {editingInvoiceId ? "Update Invoice" : "Save & Print Invoice"}
          </button>
        </aside>
      </div>


{
  selectedInvoice &&
  !printMode && (

    <SalesInvoiceView

      invoice={selectedInvoice}

      items={selectedItems}

      onClose={() =>
        setSelectedInvoice(null)
      }

    />

  )
}
      {
  printMode &&
  selectedInvoice && (

    <InvoicePrint
  invoice={selectedInvoice}
  items={selectedItems}
  settings={invoiceSettings}
  company={companyDetails}
  customer={customerDetails}   
  onClose={() => {

    setPrintMode(false);

    setSelectedInvoice(null);

    setSelectedItems([]);
    
   
  

  }}
/>

  )
}
    </div>
  );
}

export default SalesInvoice;
