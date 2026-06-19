import { supabase } from "../supabase/supabaseClient";

export async function createCompany(data) {

    const { error } = await supabase
        .from("companies")
        .insert([data]);

    if (error) {
        throw error;
    }

    return true;
}

export async function getCompanies() {

    const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("company_name");

    if (error) {
        throw error;
    }

    return data;
}
export async function getCompaniesForDropdown() {

    const { data, error } =
        await supabase
            .from("companies")
            .select("id, company_name, state")
            .order("company_name");

    if (error) throw error;

    return data;
}
