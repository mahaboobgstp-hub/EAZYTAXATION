import { supabase } from "../supabase/supabaseClient";

export async function createItem(data, companyId, itemId = null) {

  if (!companyId) {
    throw new Error("Please select a Current Company.");
  }

  const itemData = {
    ...data,
    company_id: companyId
  };

  const query = itemId
    ? supabase.from("items").update(itemData).eq("id", itemId).eq("company_id", companyId)
    : supabase.from("items").insert([itemData]);

  const { error } = await query;
  if (error) throw error;
  return true;
}

export async function getItems(companyId) {

  if (!companyId) {
    return [];
  }

  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("company_id", companyId)
    .order("item_name");

  if (error) throw error;

  return data;
}
export async function deleteItem(id) {

    const { error } = await supabase
        .from("items")
        .delete()
        .eq("id", id);

    if (error) throw error;

}
