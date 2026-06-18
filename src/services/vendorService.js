import { supabase } from "../supabase/supabaseClient";

export async function createVendor(data) {

    const { error } = await supabase
        .from("vendors")
        .insert([data]);

    if (error) throw error;

    return true;
}

export async function getVendors() {

    const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .order("vendor_name");

    if (error) throw error;

    return data;
}
