import { supabase } from "../supabase/supabaseClient";

const requireCompany = companyId => {
  if (!companyId) throw new Error("Select a company before managing expense categories.");
  return companyId;
};

export async function getExpenseCategories(companyId, includeInactive = true) {
  const id = requireCompany(companyId);
  let query = supabase.from("expense_categories").select("*")
    .or(`company_id.eq.${id},company_id.is.null`)
    .order("category_name");
  if (!includeInactive) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getExpenseCategorySetup(companyId) {
  const id = requireCompany(companyId);
  const [categories, groups, ledgers] = await Promise.all([
    getExpenseCategories(id, true),
    supabase.from("account_groups")
      .select("id,company_id,group_name,group_code,parent_group_id,account_nature,is_active")
      .eq("company_id", id).eq("is_active", true).order("group_name"),
    supabase.from("chart_of_accounts")
      .select("id,company_id,ledger_name,ledger_code,group_id,is_active")
      .eq("company_id", id).eq("is_active", true).order("ledger_name")
  ]);
  if (groups.error) throw groups.error;
  if (ledgers.error) throw ledgers.error;
  return { categories, groups: groups.data || [], ledgers: ledgers.data || [] };
}

export async function createExpenseCategory(companyId, values) {
  const id = requireCompany(companyId);
  const categoryName = String(values.category_name || "").trim();
  if (!categoryName) throw new Error("Enter an expense category name.");
  const payload = {
    company_id: id,
    category_name: categoryName,
    description: String(values.description || "").trim() || null,
    is_active: true
  };
  if (values.expenditure_type) {
    if (!values.group_id) throw new Error("Select the main account group.");
    if (!values.ledger_id) throw new Error("Select the ledger linked to this category.");
    payload.expenditure_type = values.expenditure_type;
    payload.group_id = values.group_id;
    payload.subgroup_id = values.subgroup_id || null;
    payload.ledger_id = values.ledger_id;
  }
  const { data, error } = await supabase.from("expense_categories")
    .insert([payload]).select("*").single();
  if (error) throw error;
  return data;
}

export async function updateExpenseCategory(companyId, categoryId, values) {
  const id = requireCompany(companyId);
  if (!categoryId) throw new Error("Select an expense category to update.");
  const categoryName = String(values.category_name || "").trim();
  if (!categoryName) throw new Error("Enter an expense category name.");
  const payload = {
    category_name: categoryName,
    description: String(values.description || "").trim() || null,
    is_active: values.is_active !== false,
    updated_at: new Date().toISOString()
  };
  if (values.expenditure_type) {
    if (!values.group_id) throw new Error("Select the main account group.");
    if (!values.ledger_id) throw new Error("Select the ledger linked to this category.");
    Object.assign(payload, {
      expenditure_type: values.expenditure_type,
      group_id: values.group_id,
      subgroup_id: values.subgroup_id || null,
      ledger_id: values.ledger_id
    });
  }
  const { data, error } = await supabase.from("expense_categories")
    .update(payload).eq("id", categoryId).eq("company_id", id).select("*").single();
  if (error) throw error;
  return data;
}
