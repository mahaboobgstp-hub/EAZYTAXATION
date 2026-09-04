import { supabase } from "../../supabase/supabaseClient";

export async function getDepartments(companyId) {
    const { data, error } = await supabase
        .from("departments")
        .select("*")
        .eq("company_id", companyId)
        .order("department_name", { ascending: true });

    if (error) throw error;

    return data || [];
}

export async function createDepartment(data, companyId) {
    const { data: result, error } = await supabase
        .from("departments")
        .insert([
            {
                company_id: companyId,
                department_code: data.department_code,
                department_name: data.department_name,
                description: data.description || null,
                is_active: true
            }
        ])
        .select()
        .single();

    if (error) throw error;

    return result;
}

export async function updateDepartment(id, data, companyId) {
    const { data: result, error } = await supabase
        .from("departments")
        .update({
            department_code: data.department_code,
            department_name: data.department_name,
            description: data.description || null
        })
        .eq("id", id)
        .eq("company_id", companyId)
        .select()
        .single();

    if (error) throw error;

    return result;
}

export async function deactivateDepartment(id, companyId) {
    const { data: result, error } = await supabase
        .from("departments")
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
