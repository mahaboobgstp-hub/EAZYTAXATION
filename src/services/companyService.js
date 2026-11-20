import { supabase } from "../supabase/supabaseClient";

async function requireUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error("You are not logged in.");
  return user;
}

export async function createCompany(data) {
  const user = await requireUser();
  const { data: created, error } = await supabase
    .from("companies")
    .insert([{ ...data, owner_user_id: user.id }])
    .select("id")
    .single();
  if (error) throw error;
  return created;
}

export async function updateCompany(companyId, data) {
  const user = await requireUser();
  if (!companyId) throw new Error("Select a company to update.");
  const { data: updated, error } = await supabase
    .from("companies")
    .update({ ...data })
    .eq("id", companyId)
    .eq("owner_user_id", user.id)
    .select("id")
    .single();
  if (error) throw error;
  return updated;
}

export async function getCompanies() {
  const user = await requireUser();
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("owner_user_id", user.id)
    .order("company_name");
  if (error) throw error;
  return data || [];
}

export async function getCompaniesForDropdown() {
  const user = await requireUser();
  const { data, error } = await supabase
    .from("companies")
    .select("id, company_name, state")
    .eq("owner_user_id", user.id)
    .order("company_name");
  if (error) throw error;
  return data || [];
}

export async function getCompanyById(companyId) {
  const user = await requireUser();
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .eq("owner_user_id", user.id)
    .single();
  if (error) throw error;
  return data;
}
