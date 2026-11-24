/**
 * Stage 7 — line-by-line master matching, dynamic validation and draft corrections.
 * All correction values are local to the proposal and never persisted.
 */
const ALLOWED = {
  sales_invoice: new Set(["invoice_date","sale_type","billing_address","shipping_name","shipping_gstin","shipping_state","shipping_address","place_of_supply","vehicle_no","eway_bill_no","tax_inclusive","discount_type","discount_value","other_amount","round_off","remarks","items","item_name","hsn_sac","qty","unit","rate","gst_rate","cess_rate"]),
  purchase_invoice: new Set(["invoice_date","supplier_invoice_no","supplier_invoice_date","gst_treatment","vendor_name","gstin","vendor_state","place_of_supply","billing_address","shipping_address","vehicle_no","eway_bill_no","remarks","lines","item_name","hsn_sac","qty","uom","rate","discount_percent","gst_rate"]),
  expense_entry: new Set(["expense_date","payment_mode","payee_name","supplier_invoice_no","supplier_invoice_date","payment_account","paid_by","due_date","reference_no","gst_treatment","discount_amount","other_charges","round_off","remarks","payment_status","status","lines","description","hsn_sac","qty","uom","rate","gst_percent","discount_percent"]),
};
const LINE_FIELDS = {
  sales_invoice:["item_id","item_name","hsn_sac","qty","unit","rate","gst_rate","cess_rate"],
  purchase_invoice:["item_id","item_name","hsn_sac","qty","uom","rate","discount_percent","gst_rate"],
  expense_entry:["description","hsn_sac","qty","uom","rate","gst_percent","discount_percent"],
};
const MASTER_ID_FIELD = { sales_invoice:"customer_id", purchase_invoice:"vendor_id", expense_entry:"vendor_id" };
const MASTER_TYPES = { sales_invoice:"customers", purchase_invoice:"vendors", expense_entry:"vendors" };
const numericLineFields = new Set(["qty","rate","gst_rate","cess_rate","discount_percent","gst_percent"]);
const validDate = value => /^\\d{4}-\\d{2}-\\d{2}$/.test(String(value||"")) && !Number.isNaN(Date.parse(String(value)+"T00:00:00"));

export function prepareSYDValidatedDraft({ plan, companyId, selectedMasters = {}, selectedLineItems = {}, corrections = {} }) {
  const screenId = plan?.screen_id;
  if (!ALLOWED[screenId]) return { ok:false, screenId, errors:["Draft preparation is only enabled for audited invoice and expense screens."] };
  if (!companyId) return { ok:false, screenId, errors:["A company must be selected."] };
  const fields=Array.isArray(plan?.fields)?plan.fields:[];
  const values={};
  const errors=[];
  for(const field of fields) {
    if(!field || typeof field.field_id!=="string" || !ALLOWED[screenId].has(field.field_id)) continue;
    if(field.value===undefined || field.value===null || field.value==="") continue;
    values[field.field_id]=field.value;
  }
  Object.entries(corrections.headers||{}).forEach(([key,value])=>{if(ALLOWED[screenId].has(key) && !["items","lines","status","payment_status"].includes(key)) values[key]=value;});
  const chosenMaster=selectedMasters[MASTER_TYPES[screenId]];
  const category=selectedMasters.expense_categories;
  if(chosenMaster?.id) values[MASTER_ID_FIELD[screenId]]=chosenMaster.id;
  if(["sales_invoice","purchase_invoice"].includes(screenId)&&!chosenMaster?.id) errors.push("Choose and verify the customer/supplier master before preparing this draft.");
  if(screenId==="expense_entry"&&category?.id) values.category_id=category.id;
  if(screenId==="expense_entry") {delete values.status; delete values.payment_status;}
  if(screenId==="expense_entry"&&!values.category_id) errors.push("Expense category is required and has not been verified.");
  const rawLines=values.items||values.lines;
  if(rawLines!==undefined && !Array.isArray(rawLines)) errors.push("Line items must be an array to prepare safely.");
  const lineKey=screenId==="sales_invoice"?"items":"lines";
  const lines=Array.isArray(rawLines)?rawLines.map((row,index)=>{
    const corrected={...(row||{}),...(corrections.lines?.[index]||{})};
    const line={};
    for(const key of LINE_FIELDS[screenId]) if(corrected[key]!==undefined&&corrected[key]!==null&&corrected[key]!=="") line[key]=corrected[key];
    const selected=selectedLineItems[index];
    if(selected?.id && ["sales_invoice","purchase_invoice"].includes(screenId)) {
      line.item_id=selected.id;
      line.item_name=selected.item_name||line.item_name;
      line.hsn_sac=line.hsn_sac||selected.hsn_sac;
      line.unit=line.unit||selected.unit;
      line.uom=line.uom||selected.unit;
      line.gst_rate=line.gst_rate??selected.gst_rate;
      const masterRate=screenId==="sales_invoice"?selected.sales_rate:selected.purchase_rate;
      line.rate=line.rate??masterRate;
    }
    return line;
  }):[];
  if(Array.isArray(rawLines)) values[lineKey]=lines;
  const headerNumeric=screenId==="sales_invoice"?["discount_value","other_amount","round_off"]:screenId==="purchase_invoice"?[]:["discount_amount","other_charges","round_off"];
  headerNumeric.forEach(key=>{if(values[key]!==undefined&&values[key]!==""&&!Number.isFinite(Number(values[key]))) errors.push(`Invalid numeric value for ${key}.`);});
  const dateFields=screenId==="expense_entry"?["expense_date","supplier_invoice_date","due_date"]:["invoice_date","supplier_invoice_date"];
  dateFields.forEach(key=>{if(values[key]&&!validDate(values[key])) errors.push(`Invalid date for ${key}; use YYYY-MM-DD.`);});
  if(screenId==="expense_entry"&&!values.payee_name&&!selectedMasters.vendors?.id) errors.push("Enter a payee or choose a verified vendor.");
  if(screenId==="expense_entry"&&!lines.length) errors.push("Add at least one expense line.");
  if(screenId==="purchase_invoice"&&!lines.length) errors.push("Add at least one purchase line.");
  if(screenId==="sales_invoice"&&!lines.length) errors.push("Add at least one sales item line.");
  lines.forEach((row,index)=>{
    const label=`Line ${index+1}`;
    if(["sales_invoice","purchase_invoice"].includes(screenId)&&!row.item_id&&!row.item_name) errors.push(`${label}: choose a matched item master or provide an item description.`);
    if(screenId==="expense_entry"&&!row.description) errors.push(`${label}: description is required.`);
    for(const key of numericLineFields) if(row[key]!==undefined&&row[key]!==""&&!Number.isFinite(Number(row[key]))) errors.push(`${label}: ${key} must be numeric.`);
    if(row.qty!==undefined&&Number(row.qty)<=0) errors.push(`${label}: quantity must be greater than zero.`);
    if(row.rate!==undefined&&Number(row.rate)<0) errors.push(`${label}: rate cannot be negative.`);
    if(row.discount_percent!==undefined&&(Number(row.discount_percent)<0||Number(row.discount_percent)>100)) errors.push(`${label}: discount must be between 0 and 100%.`);
    for(const key of ["gst_rate","cess_rate","gst_percent"]) if(row[key]!==undefined&&(Number(row[key])<0||Number(row[key])>100)) errors.push(`${label}: ${key} must be between 0 and 100%.`);
  });
  return {ok:errors.length===0,screenId,companyId,values,selectedMasters,selectedLineItems,corrections,errors,preparedAt:new Date().toISOString(),source:"syd-ai-proposal-stage-7"};
}
