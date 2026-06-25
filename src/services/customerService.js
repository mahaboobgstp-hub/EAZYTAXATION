import { supabase } from "../supabase/supabaseClient";

export async function createCustomer(data) {

    const { error } = await supabase
        .from("customers")
        .insert([data]);

    if (error) throw error;

    return true;
}

export async function getCustomers() {

    const { data, error } = await supabase
        .from("customers")
        .select("*")
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
