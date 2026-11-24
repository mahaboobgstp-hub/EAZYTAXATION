/**
 * Stage 6 — strict draft normalizer/validator for SYD proposals.
 * Maps only allow-listed audited fields and requires verified master selections.
 */
const ALLOWED = {
  sales_invoice: new Set(["invoice_date","sale_type","billing_address","shipping_name","shipping_gstin","shipping_state","shipping_address","place_of_supply","vehicle_no","eway_bill_no","tax_inclusive","discount_type","discount_value","other_amount","round_off","remarks","items","item_name","hsn_sac","qty","unit","rate","gst_rate","cess_rate"]),
  purchase_invoice: new Set(["invoice_date","supplier_invoice_no","supplier_invoice_date","gst_treatment","vendor_name","gstin","vendor_state","place_of_supply","billing_address","shipping_address","vehicle_no","eway_bill_no","remarks","lines","item_name","hsn_sac","qty","uom","rate","discount_percent","gst_rate"]),
  expense_entry: new Set(["expense_date","payment_mode","payee_name","supplier_invoice_no","supplier_invoice_date","payment_account","paid_by","due_date","reference_no","gst_treatment","discount_amount","other_charges","round_off","remarks","payment_status","status","lines","description","hsn_sac","qty","uom","rate","gst_percent","discount_percent"]),
};
const MASTER_ID_FIELD = { sales_invoice:"customer_id", purchase_invoice:"vendor_id", expense_entry:"vendor_id" };
const MASTER_TYPES = { sales_invoice:"customers", purchase_invoice:"vendors", expense_entry:"vendors" };

export function prepareSYDValidatedDraft({ plan, companyId, selectedMasters = {} }) {
  const screenId = plan?.screen_id;
  if (!["sales_invoice","purchase_invoice","expense_entry"].includes(screenId)) {
    return { ok:false, screenId, errors:["Draft preparation is only enabled for audited invoice and expense screens."] };
  }
  if (!companyId) return { ok:false, screenId, errors:["A company must be selected."] };
  const allowed = ALLOWED[screenId];
  const fields = Array.isArray(plan?.fields) ? plan.fields : [];
  const values = {};
  const errors = [];
  for (const field of fields) {
    if (!field || typeof field.field_id !== "string" || !allowed.has(field.field_id)) continue;
    if (field.value === undefined || field.value === null || field.value === "") continue;
    values[field.field_id] = field.value;
  }
  const chosenMaster = selectedMasters[MASTER_TYPES[screenId]];
  const chosenCategory = selectedMasters.expense_categories;
  const masterField = MASTER_ID_FIELD[screenId];
  if (chosenMaster?.id) values[masterField] = chosenMaster.id;
  if ((screenId==="sales_invoice" || screenId==="purchase_invoice") && !chosenMaster?.id) errors.push("Choose and verify the customer/supplier master before preparing this draft.");
  if (screenId==="expense_entry" && chosenCategory?.id) values.category_id = chosenCategory.id;\n  if (screenId==="expense_entry") { delete values.status; delete values.payment_status; }
  if (screenId==="expense_entry" && !values.category_id) errors.push("Expense category is required and has not been verified.");
  const rawLines = values.items || values.lines;
  if (rawLines && !Array.isArray(rawLines)) errors.push("Line items must be an array to prepare safely.");
  const lineKey = screenId==="sales_invoice" ? "items" : "lines";
  if (Array.isArray(rawLines)) {
    values[lineKey] = rawLines.filter(row=>row && typeof row==="object").map((row,index)=>{
      const line={};
      for(const key of (screenId==="sales_invoice"?["item_id","item_name","hsn_sac","qty","unit","rate","gst_rate","cess_rate"]:screenId==="purchase_invoice"?["item_id","item_name","hsn_sac","qty","uom","rate","discount_percent","gst_rate"]:["description","hsn_sac","qty","uom","rate","gst_percent","discount_percent"])) {
        if(row[key]!==undefined && row[key]!==null && row[key]!=="") line[key]=row[key];
      }
      return line;
    });
  }
  if (screenId==="expense_entry" && !values.payee_name && !selectedMasters.vendors?.id) errors.push("Enter a payee or choose a verified vendor.");
  if (screenId==="expense_entry" && (!Array.isArray(values.lines)||!values.lines.length)) errors.push("Add at least one expense line.");
  if (screenId==="sales_invoice" && values.items && values.items.some(row=>!row.item_id && !row.item_name)) errors.push("Each sales line needs a verified item or a description.");
  return { ok:errors.length===0, screenId, companyId, values, selectedMasters, errors, preparedAt:new Date().toISOString(), source:"syd-ai-proposal" };
}
