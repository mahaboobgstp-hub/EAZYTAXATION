import { supabase } from "../supabase/supabaseClient";

export async function createItem(data, companyId) {
  if (!companyId) throw new Error("Please select a Current Company.");
  const { error } = await supabase.from("items").insert([{ ...data, company_id: companyId }]);
  if (error) throw error;
  return true;
}

export async function updateItem(itemId, data, companyId) {
  if (!companyId || !itemId) throw new Error("Company and item are required.");
  const { error } = await supabase.from("items").update(data).eq("id", itemId).eq("company_id", companyId);
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
  let query = supabase.from("items").delete().eq("id", id);
  if (companyId) query = query.eq("company_id", companyId);
  const { error } = await query;
  if (error) throw error;
}
