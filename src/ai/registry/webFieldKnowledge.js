/**
 * SYD Intelligence — audited field catalogue (Stage 3).
 * IDs below are existing React form/state keys or existing calculated concepts
 * inspected in the corresponding entry screen. This catalogue is descriptive;
 * it does not grant permission to mutate or save any form.
 */
import { registerFieldDefinitions } from "./fieldRegistry";

const AUDITED_FIELDS = {
  sales_invoice: [
    { fieldId:"invoice_no", label:"Invoice number", type:"text", description:"Invoice number; auto-numbering may make it read-only." },
    { fieldId:"invoice_date", label:"Invoice date", type:"date", required:true, description:"Sales invoice date; changing date may refresh auto-numbering." },
    { fieldId:"customer_id", label:"Customer", type:"lookup", required:true, description:"Select a customer from Customer Master; selection populates customer and address details." },
    { fieldId:"saleType", label:"Sale type", type:"select", options:["CASH","CREDIT"], description:"Cash Sale or Credit Sale." },
    { fieldId:"billing_address", label:"Billing address", type:"address", description:"Customer billing address." },
    { fieldId:"shipping_name", label:"Shipping recipient name", type:"text", description:"Shipping recipient; shown when shipping differs from billing." },
    { fieldId:"shipping_gstin", label:"Shipping GSTIN", type:"text", description:"Shipping GSTIN; shown when shipping differs from billing." },
    { fieldId:"shipping_state", label:"Shipping state / place of supply", type:"text", description:"State selection updates place of supply." },
    { fieldId:"shipping_address", label:"Shipping address", type:"address", description:"Shipping address; can be same as billing address." },
    { fieldId:"place_of_supply", label:"Place of supply", type:"text", description:"Used with company state to determine intra-state vs inter-state GST." },
    { fieldId:"vehicle_no", label:"Vehicle number", type:"text", description:"Transport details, optional." },
    { fieldId:"eway_bill_no", label:"E-Way bill number", type:"text", description:"E-way bill number, optional." },
    { fieldId:"taxInclusive", label:"Tax-inclusive pricing", type:"boolean", description:"Whether entered item rates include tax." },
    { fieldId:"discountType", label:"Discount type", type:"select", options:["AMOUNT","PERCENT"], description:"Invoice-level discount can be amount or percent." },
    { fieldId:"discountValue", label:"Discount value", type:"currency", description:"Invoice-level discount input." },
    { fieldId:"otherAmount", label:"Other charges", type:"currency", description:"Additional invoice charges." },
    { fieldId:"roundOff", label:"Round off", type:"currency", description:"Invoice rounding adjustment." },
    { fieldId:"remarks", label:"Remarks", type:"textarea", description:"Invoice narration." },
    { fieldId:"items", label:"Invoice items", type:"item_list", required:true, description:"At least one item row with a non-empty item name is required before save." },
    { fieldId:"item_id", label:"Item master selection", type:"lookup", description:"Invoice line item selection; choosing an item fills item name, HSN/SAC, unit, GST, cess and sales rate." },
    { fieldId:"item_name", label:"Item / description", type:"text", description:"Sales line item name; can be typed or selected from item suggestions." },
    { fieldId:"hsn_sac", label:"HSN/SAC", type:"text", description:"Line item HSN/SAC code." },
    { fieldId:"qty", label:"Quantity", type:"number", validation:{min:0}, description:"Line item quantity." },
    { fieldId:"unit", label:"Unit", type:"text", description:"Line item unit of measure." },
    { fieldId:"rate", label:"Rate", type:"currency", validation:{min:0}, description:"Line item sales rate." },
    { fieldId:"gst_rate", label:"GST rate", type:"number", description:"Line item GST rate selected through GST rate dropdown." },
    { fieldId:"cess_rate", label:"Cess rate", type:"number", validation:{min:0}, description:"Optional line item cess rate." }
  ],
  purchase_invoice: [
    { fieldId:"invoice_no", label:"Purchase invoice number", type:"text", description:"System purchase voucher number." },
    { fieldId:"invoice_date", label:"Purchase date", type:"date", required:true, description:"Purchase voucher date." },
    { fieldId:"supplier_invoice_no", label:"Supplier invoice number", type:"text", required:true, description:"Supplier bill number; required before save." },
    { fieldId:"supplier_invoice_date", label:"Supplier invoice date", type:"date", description:"Date on supplier invoice." },
    { fieldId:"gst_treatment", label:"GST treatment", type:"select", options:["Regular Supplier (Registered)","Composition Supplier","Unregistered Supplier","SEZ / Import"], description:"Supplier GST treatment." },
    { fieldId:"vendor_id", label:"Supplier", type:"lookup", required:true, description:"Select supplier from Vendor Master; selection populates GSTIN, state, addresses and place of supply." },
    { fieldId:"vendor_name", label:"Supplier name", type:"text", description:"Supplier name associated with selected vendor." },
    { fieldId:"gstin", label:"GSTIN", type:"text", description:"Supplier GSTIN." },
    { fieldId:"vendor_state", label:"Supplier state", type:"text", description:"Supplier state." },
    { fieldId:"place_of_supply", label:"Place of supply", type:"text", description:"Used to determine intra-state vs inter-state GST treatment." },
    { fieldId:"billing_address", label:"Billing address", type:"address", description:"Supplier billing address." },
    { fieldId:"shipping_address", label:"Shipping address", type:"address", description:"Purchase shipping address." },
    { fieldId:"vehicle_no", label:"Vehicle number", type:"text", description:"Transport vehicle details, optional." },
    { fieldId:"eway_bill_no", label:"E-Way bill number", type:"text", description:"E-way bill number, optional." },
    { fieldId:"remarks", label:"Remarks / narration", type:"textarea", description:"Purchase invoice narration." },
    { fieldId:"lines", label:"Purchase invoice items", type:"item_list", required:true, description:"At least one line with a non-empty item name is required." },
    { fieldId:"item_id", label:"Item master selection", type:"lookup", description:"Selecting item fills name, HSN/SAC, UOM, purchase rate and GST rate." },
    { fieldId:"item_name", label:"Item name", type:"text", description:"Purchase line item name; custom item text is also supported." },
    { fieldId:"hsn_sac", label:"HSN/SAC", type:"text", description:"Line item HSN/SAC." },
    { fieldId:"qty", label:"Quantity", type:"number", validation:{min:0}, description:"Line item quantity." },
    { fieldId:"uom", label:"Unit", type:"text", description:"Line item unit of measure." },
    { fieldId:"rate", label:"Rate", type:"currency", validation:{min:0}, description:"Purchase rate." },
    { fieldId:"discount_percent", label:"Line discount percent", type:"number", validation:{min:0,max:100}, description:"Line discount percentage." },
    { fieldId:"gst_rate", label:"GST rate", type:"number", description:"Line GST percentage." }
  ],
  expense_entry: [
    { fieldId:"expense_no", label:"Expense voucher number", type:"text", description:"Expense voucher number generated by service." },
    { fieldId:"expense_date", label:"Expense date", type:"date", required:true, description:"Expense voucher date." },
    { fieldId:"payment_mode", label:"Payment method", type:"select", options:["Bank","Cash","Card","UPI","Cheque"], description:"Payment method." },
    { fieldId:"vendor_id", label:"Supplier / payee master", type:"lookup", description:"Optional vendor selection; selecting vendor populates payee name and supplier state." },
    { fieldId:"payee_name", label:"Supplier / payee", type:"text", description:"Supplier or payee text; required if no vendor selected." },
    { fieldId:"category_id", label:"Expense category", type:"lookup", required:true, description:"Expense category from Expense Category master; required before save." },
    { fieldId:"reference_no", label:"Reference number", type:"text", description:"Bank/card/payment reference, optional." },
    { fieldId:"gst_treatment", label:"GST treatment", type:"select", options:["Registered (Regular)","Composition","Unregistered","No GST"], description:"GST treatment; No GST sets tax rate to zero." },
    { fieldId:"supplier_invoice_no", label:"Supplier bill number", type:"text", description:"Supplier invoice/bill number, optional." },
    { fieldId:"supplier_invoice_date", label:"Supplier bill date", type:"date", description:"Supplier bill date, optional." },
    { fieldId:"payment_account", label:"Payment account", type:"text", description:"Payment account name or details." },
    { fieldId:"paid_by", label:"Paid by / transaction type", type:"text", description:"NEFT, UPI, cheque number, etc." },
    { fieldId:"due_date", label:"Due date", type:"date", description:"Expense due date, optional." },
    { fieldId:"remarks", label:"Notes / remarks", type:"textarea", description:"Expense narration." },
    { fieldId:"discount_amount", label:"Header discount", type:"currency", validation:{min:0}, description:"Expense-level discount amount." },
    { fieldId:"other_charges", label:"Other charges", type:"currency", validation:{min:0}, description:"Additional expense charges." },
    { fieldId:"round_off", label:"Round off", type:"currency", description:"Round-off adjustment." },
    { fieldId:"payment_status", label:"Payment status", type:"select", options:["Unpaid","Partially Paid","Paid"], description:"Status recalculated on save when editing based on paid amount and total." },
    { fieldId:"status", label:"Voucher status", type:"text", description:"Current expense status value." },
    { fieldId:"attachment_url", label:"Attachment reference", type:"text", description:"Stored bill/supporting-document attachment reference; user can upload a PDF/JPG/PNG." },
    { fieldId:"lines", label:"Expense items", type:"item_list", required:true, description:"At least one expense line with a description is required." },
    { fieldId:"description", label:"Expense line description", type:"text", required:true, description:"Each expense line requires a description." },
    { fieldId:"hsn_sac", label:"HSN/SAC", type:"text", description:"Expense line HSN/SAC." },
    { fieldId:"qty", label:"Quantity", type:"number", validation:{min:0}, description:"Expense line quantity." },
    { fieldId:"uom", label:"Unit", type:"text", description:"Expense line unit of measure." },
    { fieldId:"rate", label:"Rate", type:"currency", validation:{min:0}, description:"Expense line rate." },
    { fieldId:"gst_percent", label:"GST percentage", type:"number", description:"Expense line GST rate; ignored when GST treatment is No GST." },
    { fieldId:"discount_percent", label:"Line discount percentage", type:"number", validation:{min:0,max:100}, description:"Expense line discount percent." }
  ]
};

export function registerSYDWebFieldKnowledge() {
  for (const [screenId, fields] of Object.entries(AUDITED_FIELDS)) {
    registerFieldDefinitions(screenId, fields, { replace:true });
  }
  return Object.fromEntries(Object.entries(AUDITED_FIELDS).map(([screenId, fields]) => [screenId, fields.map(field => ({...field}))]));
}
export function getSYDWebFieldKnowledge(screenId) {
  const fields = AUDITED_FIELDS[screenId];
  return fields ? fields.map(field => ({...field, validation:{...(field.validation||{})}, options:[...(field.options||[])})) : [];
}
