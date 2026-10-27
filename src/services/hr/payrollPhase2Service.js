import { supabase } from "../../supabase/supabaseClient";
import { getApprovedLeaveForPeriod } from "./leaveWorkflowService";
import { getEmployeeDeductionSettings } from "./employeeDeductionSettingsService";

// Check whether a policy is active and effective at the end of the payroll period.
function policyCoversPeriod(policy, periodEnd) {
  return (
    policy.is_active === true &&
    (!policy.effective_from || policy.effective_from <= periodEnd) &&
    (!policy.effective_to || policy.effective_to >= periodEnd)
  );
}

export async function getEmployeePayrollWorkflowInputs({
  companyId,
  employeeId,
  periodFrom,
  periodTo,
}) {
  if (!companyId || !employeeId || !periodFrom || !periodTo) {
    throw new Error(
      "Company, employee and payroll period are required."
    );
  }

  const [
    settings,
    approvedLeave,
    attendanceResult,
    loansResult,
    lateResult,
    absenceResult,
  ] = await Promise.all([
    getEmployeeDeductionSettings(employeeId, companyId),

    getApprovedLeaveForPeriod(
      companyId,
      periodFrom,
      periodTo
    ),

    // IMPORTANT:
    // Verify this table and its column names against Supabase
    // before using this helper in payroll processing.
    supabase
      .from("attendance")
      .select(
        "id,employee_id,attendance_date,attendance_status,attendance_day_value,late_minutes,early_out_minutes,is_late"
      )
      .eq("company_id", companyId)
      .eq("employee_id", employeeId)
      .gte("attendance_date", periodFrom)
      .lte("attendance_date", periodTo),

    supabase
      .from("employee_loans")
      .select("*")
      .eq("company_id", companyId)
      .eq("employee_id", employeeId)
      .eq("is_active", true)
      .eq("loan_status", "Active"),

    supabase
      .from("late_deduction_policies")
      .select("*")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("effective_from", { ascending: false }),

    supabase
      .from("absence_deduction_policies")
      .select("*")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("effective_from", { ascending: false }),
  ]);

  for (const result of [
    attendanceResult,
    loansResult,
    lateResult,
    absenceResult,
  ]) {
    if (result.error) throw result.error;
  }

  const employeeLeave = approvedLeave.filter(
    (leave) => leave.employee_id === employeeId
  );

  const attendance = attendanceResult.data || [];

  const activeLatePolicies = (lateResult.data || []).filter(
    (policy) => policyCoversPeriod(policy, periodTo)
  );

  const activeAbsencePolicies = (absenceResult.data || []).filter(
    (policy) => policyCoversPeriod(policy, periodTo)
  );

  const assignedLatePolicy = settings?.late_deduction_policy_id
    ? activeLatePolicies.find(
        (policy) => policy.id === settings.late_deduction_policy_id
      ) || null
    : null;

  const assignedAbsencePolicy = settings?.absence_deduction_policy_id
    ? activeAbsencePolicies.find(
        (policy) => policy.id === settings.absence_deduction_policy_id
      ) || null
    : null;

  return {
    settings,
    approvedLeave: employeeLeave,
    attendance,
    activeLoans: loansResult.data || [],
    latePolicy: assignedLatePolicy,
    absencePolicy: assignedAbsencePolicy,

    policyWarnings: [
      settings?.late_deduction_policy_id && !assignedLatePolicy
        ? "The assigned late policy is not active/effective for this payroll period."
        : null,

      settings?.absence_deduction_policy_id && !assignedAbsencePolicy
        ? "The assigned absence policy is not active/effective for this payroll period."
        : null,
    ].filter(Boolean),
  };
}

// Preview only. This function never updates recovered_amount or
// outstanding_amount. Loan balances must only be updated during
// a properly controlled, idempotent payroll-finalization process.
export function calculateLoanRecoveryPreview(loans, year, month) {
  const periodKey = Number(year) * 100 + Number(month);

  return (loans || []).reduce((total, loan) => {
    if (Number(loan.outstanding_amount) <= 0) {
      return total;
    }

    const startKey =
      loan.recovery_start_year && loan.recovery_start_month
        ? Number(loan.recovery_start_year) * 100 +
          Number(loan.recovery_start_month)
        : null;

    const endKey =
      loan.recovery_end_year && loan.recovery_end_month
        ? Number(loan.recovery_end_year) * 100 +
          Number(loan.recovery_end_month)
        : null;

    if (startKey !== null && periodKey < startKey) {
      return total;
    }

    if (endKey !== null && periodKey > endKey) {
      return total;
    }

    const emi = Math.max(0, Number(loan.emi_amount) || 0);
    const outstanding = Math.max(
      0,
      Number(loan.outstanding_amount) || 0
    );

    return total + Math.min(emi, outstanding);
  }, 0);
}
