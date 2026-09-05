import { supabase } from "../../supabase/supabaseClient";


export async function getAttendanceSettings(companyId) {
    const { data, error } = await supabase
        .from("attendance_settings")
        .select("*")
        .eq("company_id", companyId)
        .maybeSingle();

    if (error) throw error;

    return data;
}


export async function saveAttendanceSettings(
    companyId,
    settings
) {
    const { data, error } = await supabase
        .from("attendance_settings")
        .upsert(
            {
                company_id: companyId,

                attendance_mode:
                    settings.attendance_mode,

                overtime_enabled:
                    settings.overtime_enabled,

                allow_manual_attendance:
                    settings.allow_manual_attendance,

                default_attendance_status:
                    settings.default_attendance_status,

                updated_at:
                    new Date().toISOString()
            },
            {
                onConflict: "company_id"
            }
        )
        .select()
        .single();

    if (error) throw error;

    return data;
}
