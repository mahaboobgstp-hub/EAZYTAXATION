import { supabase } from "../../supabase/supabaseClient";

export async function getAttendance(companyId, attendanceDate) {
    const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("company_id", companyId)
        .eq("attendance_date", attendanceDate)
        .order("created_at", { ascending: true });

    if (error) throw error;

    return data || [];
}

export async function getAttendanceByEmployee(
    employeeId,
    companyId,
    attendanceDate
) {
    const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("employee_id", employeeId)
        .eq("company_id", companyId)
        .eq("attendance_date", attendanceDate)
        .maybeSingle();

    if (error) throw error;

    return data;
}

export async function saveAttendance(data, companyId) {
    const { data: result, error } = await supabase
        .from("attendance")
        .upsert(
            [
                {
                    company_id: companyId,

                    employee_id: data.employee_id,

                    attendance_date: data.attendance_date,

                    shift_id: data.shift_id || null,

                    // TIMINGS or DAY_SHIFT
                    attendance_mode:
                        data.attendance_mode || "TIMINGS",

                    attendance_status:
                        data.attendance_status,

                    // 1 = Full Day
                    // 0.5 = Half Day
                    // 0 = Absent / Holiday / Weekly Off
                    attendance_day_value:
                        data.attendance_day_value ?? 1,

                    // Number of additional overtime shifts
                    overtime_shift_count:
                        data.overtime_shift_count ?? 0,

                    // Regular working timings
                    check_in_time:
                        data.check_in_time || null,

                    check_out_time:
                        data.check_out_time || null,

                    // Working hours
                    working_hours:
                        data.working_hours ?? null,

                    // Overtime hours calculated from timings
                    overtime_hours:
                        data.overtime_hours ?? 0,

                    // Overtime timing period
                    overtime_start_time:
                        data.overtime_start_time || null,

                    overtime_end_time:
                        data.overtime_end_time || null,

                    late_minutes:
                        data.late_minutes ?? 0,

                    early_out_minutes:
                        data.early_out_minutes ?? 0,

                    is_late:
                        data.is_late ?? false,

                    is_overtime:
                        data.is_overtime ??
                        ((data.overtime_hours ?? 0) > 0 ||
                            (data.overtime_shift_count ?? 0) > 0),

                    is_manual_entry: true,

                    remarks:
                        data.remarks || null,

                    // Currently no logged-in employee marker
                    marked_by: null
                }
            ],
            {
                onConflict:
                    "company_id,employee_id,attendance_date"
            }
        )
        .select()
        .single();

    if (error) throw error;

    return result;
}

export async function deleteAttendance(
    attendanceId,
    companyId
) {
    const { data, error } = await supabase
        .from("attendance")
        .delete()
        .eq("id", attendanceId)
        .eq("company_id", companyId)
        .select()
        .single();

    if (error) throw error;

    return data;
}
export async function getWorkLocations(companyId) {
    const { data, error } = await supabase
        .from("work_locations")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("location_name", { ascending: true });

    if (error) throw error;

    return data || [];
}


export async function getEmployeeDeployments(companyId) {
    const { data, error } = await supabase
        .from("employee_deployments")
        .select(`
            id,
            employee_id,
            client_id,
            work_location_id,
            shift_id,
            effective_from,
            effective_to,
            deployment_status,
            is_active
        `)
        .eq("company_id", companyId)
        .eq("is_active", true);

    if (error) throw error;

    return data || [];
}


export async function bulkSaveAttendance(records, companyId) {

    const rows = records.map(record => ({
        company_id: companyId,

        employee_id: record.employee_id,
        attendance_date: record.attendance_date,

        deployment_id:
            record.deployment_id || null,

        client_id:
            record.client_id || null,

        work_location_id:
            record.work_location_id || null,

        shift_id:
            record.shift_id || null,

        attendance_mode:
            record.attendance_mode,

        attendance_status:
            record.attendance_status,

        attendance_day_value:
            record.attendance_day_value ?? 0,

        overtime_shift_count:
            record.overtime_shift_count ?? 0,

        check_in_time:
            record.check_in_time || null,

        check_out_time:
            record.check_out_time || null,

        working_hours:
            record.working_hours ?? null,

        overtime_hours:
            record.overtime_hours ?? 0,

        overtime_start_time:
            record.overtime_start_time || null,

        overtime_end_time:
            record.overtime_end_time || null,

        is_overtime:
            record.is_overtime ?? false,

        is_manual_entry: true,

        remarks:
            record.remarks || null,

        marked_by: null,

        updated_at:
            new Date().toISOString()
    }));


    const { data, error } = await supabase
        .from("attendance")
        .upsert(
            rows,
            {
                onConflict:
                    "company_id,employee_id,attendance_date"
            }
        )
        .select();

    if (error) throw error;

    return data || [];
}
export async function getAttendanceRegister(
    companyId,
    fromDate,
    toDate
) {

    const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("company_id", companyId)
        .gte(
            "attendance_date",
            fromDate
        )
        .lte(
            "attendance_date",
            toDate
        )
        .order(
            "attendance_date",
            {
                ascending: true
            }
        );

    if (error) throw error;

    return data || [];
}
