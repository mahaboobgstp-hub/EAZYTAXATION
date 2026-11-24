import { supabase } from "../supabase/supabaseClient";

export async function createExpenseCategory(data,companyId) {
  const payload={...data,company_id:companyId||null};
  const { error } = await supabase.from("expense_categories").insert([payload]);
  if (error) throw error;
  return true;
}

export async function getExpenseCategories(companyId) {
  let query=supabase.from("expense_categories").select("*").order("category_name");
  query=companyId?query.or("company_id.eq."+companyId+",company_id.is.null"):query.is("company_id",null);
  const { data, error } = await query;
  if (error) throw error;
  return data||[];
}
