import { supabase } from "../../supabase/supabaseClient";

/**
 * Stage 5: company-scoped, read-only master search.
 * No master creation, transaction lookup, save, or posting.
 */
const MASTER_CONFIG = {
  customers: { table: "customers", nameColumn: "customer_name", select: "*", companyScoped: true },
  vendors: { table: "vendors", nameColumn: "vendor_name", select: "id,vendor_name,gstin,state,address,company_id", companyScoped: true },
  items: { table: "items", nameColumn: "item_name", select: "id,item_name,item_code,hsn_sac,unit,gst_rate,sales_rate,purchase_rate,company_id", companyScoped: true },
  expense_categories: { table: "expense_categories", nameColumn: "category_name", select: "id,category_name,company_id", companyScoped: false },
};

const cleanSearch = (value) => String(value || "").trim().replace(/[,%*]/g, " ").slice(0, 80);

export async function searchSYDMaster(masterType, searchText, companyId) {
  const config = MASTER_CONFIG[masterType];
  if (!config) throw new Error("Unsupported master lookup.");
  if (!companyId) throw new Error("Select a company before searching masters.");
  const term = cleanSearch(searchText);
  if (term.length < 2) return { masterType, query: term, candidates: [], reason: "Enter at least 2 characters." };
  let query = supabase.from(config.table).select(config.select).ilike(config.nameColumn, `%${term}%`).limit(8);
  if (config.companyScoped) query = query.eq("company_id", companyId);
  else query = query.or(`company_id.eq.${companyId},company_id.is.null`);
  const { data, error } = await query.order(config.nameColumn);
  if (error) throw error;
  return { masterType, query: term, candidates: data || [], checked: true, readOnly: true };
}

export async function searchSYDWorkflowMasters({ plan, companyId }) {
  const fields = Array.isArray(plan?.fields) ? plan.fields : [];
  const tasks = [];
  const singleTargets = [
    { masterType:"customers", ids:["customer_id"], textIds:["customer_name","customer"] },
    { masterType:"vendors", ids:["vendor_id"], textIds:["vendor_name","supplier_name","payee_name"] },
    { masterType:"expense_categories", ids:["category_id"], textIds:["category_name","expense_category"] },
  ];
  for(const target of singleTargets) {
    const field=fields.find(item=>target.ids.includes(item.field_id)||target.textIds.includes(item.field_id));
    const text=field?.value;
    if(typeof text==="string"&&text.trim().length>=2) tasks.push(searchSYDMaster(target.masterType,text,companyId));
  }
  const lineField=fields.find(item=>["items","lines"].includes(item.field_id)&&Array.isArray(item.value));
  if(lineField) {
    const lineArray=lineField.value;
    for(let lineIndex=0;lineIndex<lineArray.length;lineIndex++) {
      const line=lineArray[lineIndex]||{};
      const query=line.item_name||line.description||line.item||line.name;
      if(typeof query==="string"&&query.trim().length>=2) {
        tasks.push(searchSYDMaster("items",query,companyId).then(result=>({...result,lineIndex,lineDescription:query})));
      }
    }
  } else {
    const itemField=fields.find(item=>["item_name","item","description"].includes(item.field_id)&&typeof item.value==="string");
    if(itemField?.value?.trim().length>=2) tasks.push(searchSYDMaster("items",itemField.value,companyId));
  }
  return Promise.all(tasks);
}
