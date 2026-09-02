import { supabase } from "../supabase/supabaseClient";

export async function createCompany(data) {

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError) throw userError;

  if (!user) {
    throw new Error("User is not logged in.");
  }

  const companyData = {
    ...data,
    owner_user_id: user.id
  };

  const { error } = await supabase
    .from("companies")
    .insert([companyData]);

  if (error) throw error;

  return true;
}

export async function getCompanies() {

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError) throw userError;

  if (!user) {
    throw new Error("User is not logged in.");
  }

  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("owner_user_id", user.id)
    .order("company_name");

  if (error) throw error;

  return data;
}
export async function getCompaniesForDropdown() {

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError) throw userError;

  if (!user) {
    throw new Error("User is not logged in.");
  }

  const { data, error } = await supabase
    .from("companies")
    .select("id, company_name, state")
    .eq("owner_user_id", user.id)
    .order("company_name");

  if (error) throw error;

  return data;
}
export async function getCompanyById(companyId) {

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError) throw userError;

  if (!user) {
    throw new Error("User is not logged in.");
  }

  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .eq("owner_user_id", user.id)
    .single();

  if (error) throw error;

  return data;
}
