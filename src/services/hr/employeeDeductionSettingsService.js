
import { supabase } from "../../supabase/supabaseClient";

function validateIds(employeeId, companyId) {
    if (!employeeId || !companyId) {
        throw new Error(
            "Employee and company are required."
        );
    }
}

// Fetch one employee's deduction settings.
export async function getEmployeeDeductionSettings(
    employeeId,
    companyId
) {
    validateIds(employeeId, companyId);

    const { data, error } = await supabase
        .from("employee_deduction_settings")
        .select("*")
        .eq("employee_id", employeeId)
        .eq("company_id", companyId)
        .maybeSingle();

    if (error) throw error;

    return data;
}

// Fetch settings for all employees in one company.
export async function getCompanyEmployeeDeductionSettings(
    companyId
) {
    if (!companyId) {
        throw new Error("Please select a company.");
    }

    const { data, error } = await supabase
        .from("employee_deduction_settings")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: true });

    if (error) throw error;

    return data || [];
}

// Insert settings or update the existing employee settings.
export async function saveEmployeeDeductionSettings(
    employeeId,
    companyId,
    settings
) {
    validateIds(employeeId, companyId);

    if (
        !settings ||
        typeof settings !== "object" ||
        Array.isArray(settings)
    ) {
        throw new Error(
            "Valid deduction settings are required."
        );
    }

    const allowedFields = [
        "leave_policy_id",
        "late_deduction_policy_id",
        "absence_deduction_policy_id",
        "salary_advance_enabled",
        "loan_recovery_enabled",
        "other_deductions_enabled",
        "deduction_override_enabled",
        "remarks",
    ];

    const payload = {
        company_id: companyId,
        employee_id: employeeId,
        updated_at: new Date().toISOString(),
    };

    for (const field of allowedFields) {
        if (
            Object.prototype.hasOwnProperty.call(
                settings,
                field
            )
        ) {
            payload[field] = settings[field];
        }
    }

    // The existing database has a unique constraint on
    // (company_id, employee_id).
    const { data, error } = await supabase
        .from("employee_deduction_settings")
        .upsert(payload, {
            onConflict: "company_id,employee_id",
        })
        .select()
        .single();

    if (error) throw error;

    return data;
}
