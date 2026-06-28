import React, { useEffect, useState } from 'react';
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

import {
  getCompaniesForDropdown,
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

function SalesInvoice() {

  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [itemsMaster, setItemsMaster] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [states, setStates] = useState([]);
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [printMode, setPrintMode] = useState(false);
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
  const [formData, setFormData] = useState({

  company_id: '',
  company_name: '',
  company_state: '',

  invoice_no: '',
  invoice_date: '',

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
    amount: 0
  }
]);

  useEffect(() => {
    loadCompanies();
    loadCustomers();
    loadItemsMaster();
    loadInvoices();
    loadInvoiceNumber();
    loadStates();
    
  }, []);
  const loadInvoiceNumber = async () => {

  try {

    const invoiceNumber =
      await generateInvoiceNumber();

    setFormData(prev => ({
      ...prev,
      invoice_no: invoiceNumber
    }));

  } catch (error) {

    console.error(error);

  }
};

  const loadCustomers = async () => {

    try {
      const data = await getCustomersForDropdown();
      setCustomers(data || []);
    } catch (error) {
      console.error(error);
    }
  };

 const loadCompanies = async () => {

  try {

    const data =
      await getCompaniesForDropdown();

    setCompanies(data || []);

  } catch (error) {

    console.error(error);

  }
};
  const loadStates = async () => {

  try {

    const data =
      await getStates();

    setStates(data || []);

  } catch (error) {

    console.error(error);

  }

};
const loadItemsMaster = async () => {

  try {

    const data =
      await getItemsForDropdown();

    setItemsMaster(data || []);

  } catch (error) {

    console.error(error);

  }
};
  const loadInvoices = async () => {

    try {
      const data = await getSalesInvoices();
      setInvoices(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (e) => {

    const { name, value } = e.target;

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

        rate:
          selectedItem.sales_rate,

        qty: 1,

        amount:
          Number(
            selectedItem.sales_rate
          )
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
  
  const taxableValue = items.reduce(
    (sum, item) =>
      sum + Number(item.amount || 0),
    0
  );

  const totalGST = items.reduce(
    (sum, item) =>
      sum +
      (
        Number(item.amount || 0) *
        Number(item.gst_rate || 0)
      ) / 100,
    0
  );

 let cgst = 0;

let sgst = 0;

let igst = 0;
  
console.log(
  "Company State:",
  formData.company_state
);

console.log(
  "Customer State:",
  formData.customer_state
);

  console.log("Company State:", formData.company_state);
console.log("Place of Supply:", formData.place_of_supply);
if (

  formData.company_state &&
  formData.place_of_supply &&
  formData.company_state ===
  formData.place_of_supply

) {

  cgst = totalGST / 2;

  sgst = totalGST / 2;

} else {

  igst = totalGST;

}
const grandTotal =
  taxableValue +
  cgst +
  sgst +
  igst;

  const handleSubmit = async (e) => {

  e.preventDefault();

  try {

    const invoiceHeader = {

      ...formData,
      gst_type:

formData.company_state ===
formData.place_of_supply

? 'INTRA_STATE'

: 'INTER_STATE',

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
    items
  );

  alert(
    'Invoice Updated'
  );

} else {

 const savedInvoiceId =
  await saveSalesInvoice(
    invoiceHeader,
    items
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
  invoice_date: '',

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
        unit:'',
        gst_rate: 18,
        qty: 1,
        rate: 0,
        amount: 0
      }
    ]);
setEditingInvoiceId(
  null
);

loadInvoiceNumber();
    loadInvoices();
   }
  }
   catch (error) {

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
  
  return (
    <div className="sales-page">

      <h2>Sales Invoice</h2>

      <form
        className="sales-form"
        onSubmit={handleSubmit}
      >
      <select
  name="company_id"
  value={formData.company_id}
  onChange={handleChange}
  required
>

  <option value="">
    Select Company
  </option>

  {companies.map(company => (

    <option
      key={company.id}
      value={company.id}
    >
      {company.company_name}
    </option>

  ))}

</select>
        <input
  name="invoice_no"
  value={formData.invoice_no}
  readOnly
/>

        <input
          type="date"
          name="invoice_date"
          value={formData.invoice_date}
          onChange={handleChange}
          required
        />

        <select
          name="customer_id"
          value={formData.customer_id}
          onChange={handleChange}
          required
        >

          <option value="">
            Select Customer
          </option>

          {customers.map(customer => (

            <option
              key={customer.id}
              value={customer.id}
            >
              {customer.customer_name}
            </option>

          ))}

        </select>
        <textarea
  name="billing_address"
  placeholder="Billing Address"
  value={formData.billing_address}
  onChange={handleChange}
/>
<label>

<input
type="checkbox"
checked={sameAsBilling}

onChange={(e)=>{

const checked =
e.target.checked;

setSameAsBilling(checked);

if(checked){

setFormData(prev=>({

...prev,

shipping_name:
prev.customer_name,

shipping_gstin:
customers.find(
c=>c.id===prev.customer_id
)?.gstin || "",

shipping_state:
prev.customer_state,

shipping_address:
prev.billing_address,

place_of_supply:
prev.customer_state

}));

}

}}
/>

Same as Billing Details

</label>
        {
!sameAsBilling && (

<>

<input
name="shipping_name"
placeholder="Shipping Name"
value={formData.shipping_name}
onChange={handleChange}
/>

<input
name="shipping_gstin"
placeholder="Shipping GSTIN"
value={formData.shipping_gstin}
onChange={handleChange}
/>

<select
name="shipping_state"
value={formData.shipping_state}
onChange={handleChange}
>

<option value="">
Select Shipping State
</option>

{states.map(state=>(

<option
key={state.id}
value={state.state_name}
>

{state.state_name}

</option>

))}

</select>

<textarea
name="shipping_address"
placeholder="Shipping Address"
value={formData.shipping_address}
onChange={handleChange}
/>

</>

)
}
        

<input
  name="vehicle_no"
  placeholder="Vehicle Number"
  value={formData.vehicle_no}
  onChange={handleChange}
/>

<input
  name="eway_bill_no"
  placeholder="E-Way Bill Number"
  value={formData.eway_bill_no}
  onChange={handleChange}
/>

        <textarea
          name="remarks"
          placeholder="Remarks"
          value={formData.remarks}
          onChange={handleChange}
        />

       <button type="submit">

  {editingInvoiceId
    ? 'Update Invoice'
    : 'Save Invoice'}

</button>

      </form>

      <h3>Invoice Items</h3>

      <table className="sales-grid">

        <thead>

          <tr>
            <th>Particulars</th>
            <th>Qty</th>
            <th>UOM</th>
            <th>HSN/SAC</th>
            <th>Rate</th>
            <th>GST %</th>
            <th>Amount</th>
            <th>Action</th>
          </tr>

        </thead>

        <tbody>

          {items.map((item, index) => (

            <tr key={index}>

              <td>

  <select
    value={item.item_id}
    onChange={(e) =>
      handleItemChange(
        index,
        'item_id',
        e.target.value
      )
    }
  >

    <option value="">
      Select Item
    </option>

    {itemsMaster.map(masterItem => (

      <option
        key={masterItem.id}
        value={masterItem.id}
      >
        {masterItem.item_name}
      </option>

    ))}

  </select>

</td>

              <td>

                <input
                  type="number"
                  value={item.qty}
                  onChange={(e) =>
                    handleItemChange(
                      index,
                      'qty',
                      e.target.value
                    )
                  }
                />

              </td>
<td>

<UomDropdown
    name="unit"
    value={item.unit}
    onChange={(e) =>
        handleItemChange(index, "unit", e.target.value)
    }
/>

</td>
              
             <td>
  {item.hsn_sac}
</td>
              
    
              <td>

                <input
                  type="number"
                  value={item.rate}
                  onChange={(e) =>
                    handleItemChange(
                      index,
                      'rate',
                      e.target.value
                    )
                  }
                />

              </td>
              

              <td>

               <GstRateDropdown
    name="gst_rate"
    value={item.gst_rate}
    onChange={(e) =>
        handleItemChange(
            index,
            "gst_rate",
            e.target.value
        )
    }
/>

              </td>

              <td>
                {formatAmount(item.amount)}
              </td>

              <td>

                <button
                  type="button"
                  onClick={() =>
                    removeRow(index)
                  }
                >
                  Delete
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

      <button
        type="button"
        onClick={addRow}
      >
        Add Row
      </button>

      <div className="sales-totals">

        <h3>
          Taxable Value :
          ₹ {formatAmount(taxableValue)}
        </h3>

       <h3>
  CGST :
  ₹ {formatAmount(cgst)}
</h3>

<h3>
  SGST :
  ₹ {formatAmount(sgst)}
</h3>

<h3>
  IGST :
  ₹ {formatAmount(igst)}
</h3>

        <h2>
          Grand Total :
          ₹ {formatAmount(grandTotal)}
        </h2>

      </div>

      <h3>Previous Invoices</h3>

      <table className="sales-grid">

        <thead>
          <tr>
            <th>Invoice No</th>
            <th>Date</th>
            <th>Customer</th>
           <th>Total Amount</th>
           <th>Action</th>
          </tr>
        </thead>

        <tbody>

          {invoices.map(invoice => (

            <tr key={invoice.id}>
              <td>{invoice.invoice_no}</td>
              <td>{invoice.invoice_date}</td>
              <td>{invoice.customer_name}</td>
              <td>{invoice.total_amount}</td>

<td>

  <button
    type="button"
    onClick={() =>
      viewInvoice(
        invoice.id
      )
    }
  >
    View
  </button>

  <button
    type="button"
    onClick={() =>
      editInvoice(
        invoice.id
      )
    }
  >
    Edit
  </button>

  <button
    type="button"
    onClick={() =>
      handleDeleteInvoice(
        invoice.id
      )
    }
  >
    Delete
  </button>
 <button
  type="button"
  onClick={() =>
    printInvoice(
      invoice.id
    )
  }
>
  Print
</button>

</td>
            </tr>

          ))}

        </tbody>

      </table>
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
