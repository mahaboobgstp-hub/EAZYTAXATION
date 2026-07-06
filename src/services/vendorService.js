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
export async function updateVendor(
    id,
    vendorData
) {

    const { error } = await supabase
        .from("vendors")
        .update(vendorData)
        .eq("id", id);

    if (error) {
        throw error;
    }

}
export async function deleteVendor(id) {

    const { error } = await supabase
        .from("vendors")
        .delete()
        .eq("id", id);

    if (error) {
        throw error;
    }

}
export async function getVendorsForDropdown() {

    const { data, error } = await supabase
        .from("vendors")
        .select("id, vendor_name")
        .order("vendor_name");

    if (error) throw error;

    return data;
}


