import { supabase } from "../../supabase/supabaseClient";

export async function getShifts(companyId) {
    const { data, error } = await supabase
        .from("shift_master")
        .select("*")
        .eq("company_id", companyId)
        .order("shift_name", { ascending: true });

    if (error) throw error;

    return data || [];
}

export async function createShift(data, companyId) {
    const { data: result, error } = await supabase
        .from("shift_master")
        .insert([
            {
                company_id: companyId,
                shift_code: data.shift_code,
                shift_name: data.shift_name,
                shift_start: data.shift_start,
                shift_end: data.shift_end,
                break_minutes: data.break_minutes || 0,
                grace_in_minutes: data.grace_in_minutes || 10,
                grace_out_minutes: data.grace_out_minutes || 10,
                minimum_working_hours: data.minimum_working_hours || 8,
                half_day_hours: data.half_day_hours || 4,
                overtime_after_hours: data.overtime_after_hours || 8,
                is_night_shift: data.is_night_shift || false,
                weekly_off_day: data.weekly_off_day || null,
                description: data.description || null,
                is_active: true
            }
        ])
        .select()
        .single();

    if (error) throw error;

    return result;
}

export async function updateShift(id, data, companyId) {
    const { data: result, error } = await supabase
        .from("shift_master")
        .update({
            shift_code: data.shift_code,
            shift_name: data.shift_name,
            shift_start: data.shift_start,
            shift_end: data.shift_end,
            break_minutes: data.break_minutes || 0,
            grace_in_minutes: data.grace_in_minutes || 10,
            grace_out_minutes: data.grace_out_minutes || 10,
            minimum_working_hours: data.minimum_working_hours || 8,
            half_day_hours: data.half_day_hours || 4,
            overtime_after_hours: data.overtime_after_hours || 8,
            is_night_shift: data.is_night_shift || false,
            weekly_off_day: data.weekly_off_day || null,
            description: data.description || null
        })
        .eq("id", id)
        .eq("company_id", companyId)
        .select()
        .single();

    if (error) throw error;

    return result;
}

export async function deactivateShift(id, companyId) {
    const { data: result, error } = await supabase
        .from("shift_master")
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
