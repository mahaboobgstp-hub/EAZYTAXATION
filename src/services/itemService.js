import { supabase } from "../supabase/supabaseClient";

const ITEM_FIELDS=["item_code","item_name","item_type","accounting_item_type","hsn_sac","unit","gst_rate","sales_rate","purchase_rate","inventory_ledger_id","purchase_ledger_id","sales_ledger_id","cogs_ledger_id","consumption_ledger_id"];
const cleanItem=data=>Object.fromEntries(ITEM_FIELDS.filter(key=>Object.prototype.hasOwnProperty.call(data,key)).map(key=>[key,data[key]]));

export async function createItem(data, companyId) {
  if (!companyId) throw new Error("Please select a Current Company.");
  const { error } = await supabase.from("items").insert([{ ...cleanItem(data), company_id: companyId }]);
  if (error) throw error;
  return true;
}

export async function updateItem(itemId, data, companyId) {
  if (!companyId || !itemId) throw new Error("Company and item are required.");
  const { error } = await supabase.from("items").update(cleanItem(data)).eq("id", itemId).eq("company_id", companyId);
  if (error) throw error;
  return true;
}

export async function getItems(companyId) {
  if (!companyId) return [];
  const { data, error } = await supabase.from("items").select("*").eq("company_id", companyId).order("item_name");
  if (error) throw error;
  return data || [];
}

export async function deleteItem(id, companyId) {
  if (!id || !companyId) throw new Error("Company and item are required.");
  const { error } = await supabase.from("items").delete().eq("id", id).eq("company_id", companyId);
  if (error) throw error;
}
