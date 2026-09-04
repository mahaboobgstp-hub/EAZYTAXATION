import { supabase } from "../../supabase/supabaseClient";

export async function getDesignations(companyId) {
    const { data, error } = await supabase
        .from("designations")
        .select("*")
        .eq("company_id", companyId)
        .order("display_order", { ascending: true })
        .order("designation_name", { ascending: true });

    if (error) throw error;

    return data || [];
}

export async function createDesignation(data, companyId) {
    const { data: result, error } = await supabase
        .from("designations")
        .insert([
            {
                company_id: companyId,
                designation_code: data.designation_code,
                designation_name: data.designation_name,
                description: data.description || null,
                display_order: data.display_order || 0,
                is_active: true
            }
        ])
        .select()
        .single();

    if (error) throw error;

    return result;
}

export async function updateDesignation(id, data, companyId) {
    const { data: result, error } = await supabase
        .from("designations")
        .update({
            designation_code: data.designation_code,
            designation_name: data.designation_name,
            description: data.description || null,
            display_order: data.display_order || 0
        })
        .eq("id", id)
        .eq("company_id", companyId)
        .select()
        .single();

    if (error) throw error;

    return result;
}

export async function deactivateDesignation(id, companyId) {
    const { data: result, error } = await supabase
        .from("designations")
        .update({
            is_active: false
        })
        .eq("id", id)
        .eq("company_id", companyId)
        .select()
        .single();

    if (error) throw error;

    return result;
}
