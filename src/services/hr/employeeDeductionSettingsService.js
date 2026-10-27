
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
    throw new Error("Valid deduction settings are required.");
  }

  // Verify that the employee belongs to this company.
  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select("id")
    .eq("id", employeeId)
    .eq("company_id", companyId)
    .maybeSingle();

  if (employeeError) throw employeeError;

  if (!employee) {
    throw new Error(
      "The selected employee does not belong to this company."
    );
  }

  const policyFields = [
    ["leave_policy_id", "leave_policies"],
    ["late_deduction_policy_id", "late_deduction_policies"],
    ["absence_deduction_policy_id", "absence_deduction_policies"],
  ];

  const allowedFields = [
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

  // Empty dropdown values must be stored as SQL NULL, not "".
  for (const [field, table] of policyFields) {
    const value = settings[field];

    if (value === "" || value === undefined || value === null) {
      payload[field] = null;
      continue;
    }

    // Verify that each selected policy belongs to this company.
    const { data: policy, error: policyError } = await supabase
      .from(table)
      .select("id")
      .eq("id", value)
      .eq("company_id", companyId)
      .maybeSingle();

    if (policyError) throw policyError;

    if (!policy) {
      throw new Error(
        `The selected ${field.replaceAll("_", " ")} does not belong to this company.`
      );
    }

    payload[field] = value;
  }

  // Preserve false values for switches.
  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(settings, field)) {
      payload[field] = settings[field];
    }
  }

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

