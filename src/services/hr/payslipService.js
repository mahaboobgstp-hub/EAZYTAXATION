import { supabase } from "../../supabase/supabaseClient";

export async function getPayrollRuns(companyId) {
    if (!companyId) return [];

    const { data, error } = await supabase
        .from("payroll_runs")
        .select("*")
        .eq("company_id", companyId)
        .order("payroll_year", { ascending: false })
        .order("payroll_month", { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function getPayrollRunEmployees(
    payrollRunId,
    companyId
) {
    if (!payrollRunId || !companyId) return [];

    const { data, error } = await supabase
        .from("payroll_employee_details")
        .select("*")
        .eq("payroll_run_id", payrollRunId)
        .eq("company_id", companyId)
        .order("employee_name", { ascending: true });

    if (error) throw error;
    return data || [];
}
