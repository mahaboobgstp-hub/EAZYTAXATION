import { supabase } from "../supabase/supabaseClient";

export async function createCustomer(data, companyId) {

  if (!companyId) {
    throw new Error("Please select a Current Company.");
  }

  const customerData = {
    ...data,
    company_id: companyId
  };

  const { error } = await supabase
    .from("customers")
    .insert([customerData]);

  if (error) throw error;

  return true;
}

export async function getCustomers(companyId) {

  if (!companyId) {
    return [];
  }

  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("company_id", companyId)
    .order("customer_name");

  if (error) throw error;

  return data;
}
export async function getCustomerById(
    customerId
) {

    const { data, error } =
        await supabase
            .from("customers")
            .select("*")
            .eq("id", customerId)
            .single();

    if (error) {
        throw error;
    }

    return data;
}
