import { supabase } from "../../supabase/supabaseClient";

function requireCompany(companyId) {
  if (!companyId) throw new Error("Please select a company.");
}

function calculateLeaveDays(fromDate, toDate, sessionType) {
  if (!fromDate || !toDate || toDate < fromDate) {
    throw new Error("Enter a valid leave date range.");
  }

  if (sessionType !== "Full Day" && fromDate !== toDate) {
    throw new Error("Half-day leave must be for one date only.");
  }

  if (sessionType === "First Half" || sessionType === "Second Half") {
    return 0.5;
  }

  const start = new Date(`${fromDate}T00:00:00`);
  const end = new Date(`${toDate}T00:00:00`);

  return Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
}

export { calculateLeaveDays };

export async function getCompanyEmployeesForLeave(companyId) {
  requireCompany(companyId);

  const { data, error } = await supabase
    .from("employees")
    .select("id, employee_code, employee_name, employee_status")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .order("employee_name", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getLeaveApplications(companyId, { status = null } = {}) {
  requireCompany(companyId);

  let query = supabase
    .from("leave_master")
    .select("*")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .order("applied_on", { ascending: false });

  if (status) query = query.eq("approval_status", status);

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function submitLeaveApplication(input, companyId) {
  requireCompany(companyId);

  if (!input?.employee_id || !input?.leave_type) {
    throw new Error("Employee and leave type are required.");
  }

  const totalDays = calculateLeaveDays(
    input.from_date,
    input.to_date,
    input.session_type || "Full Day"
  );

  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select("id")
    .eq("id", input.employee_id)
    .eq("company_id", companyId)
    .eq("is_active", true)
    .maybeSingle();

  if (employeeError) throw employeeError;

  if (!employee) {
    throw new Error("Employee does not belong to the selected company.");
  }

  const payload = {
    company_id: companyId,
    employee_id: input.employee_id,
    leave_type: input.leave_type.trim(),
    from_date: input.from_date,
    to_date: input.to_date,
    total_days: totalDays,
    session_type: input.session_type || "Full Day",
    reason: input.reason?.trim() || null,
    remarks: input.remarks?.trim() || null,
    applied_on: new Date().toISOString(),
    approval_status: "Pending",
    approved_by: null,
    approved_on: null,
    rejection_reason: null,
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("leave_master")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePendingLeaveApplication(
  leaveId,
  input,
  companyId
) {
  requireCompany(companyId);

  if (!leaveId) {
    throw new Error("Leave application is required.");
  }

  const totalDays = calculateLeaveDays(
    input.from_date,
    input.to_date,
    input.session_type || "Full Day"
  );

  const { data, error } = await supabase
    .from("leave_master")
    .update({
      leave_type: input.leave_type.trim(),
      from_date: input.from_date,
      to_date: input.to_date,
      total_days: totalDays,
      session_type: input.session_type || "Full Day",
      reason: input.reason?.trim() || null,
      remarks: input.remarks?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", leaveId)
    .eq("company_id", companyId)
    .eq("approval_status", "Pending")
    .eq("is_active", true)
    .select()
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    throw new Error(
      "Application was not found, is inactive, or is no longer pending."
    );
  }

  return data;
}

export async function decideLeaveApplication(
  leaveId,
  companyId,
  decision,
  reason = ""
) {
  requireCompany(companyId);

  if (!leaveId) {
    throw new Error("Leave application is required.");
  }

  if (!["Approved", "Rejected"].includes(decision)) {
    throw new Error("Decision must be Approved or Rejected.");
  }

  if (decision === "Rejected" && !reason.trim()) {
    throw new Error("A rejection reason is required.");
  }

  // approved_by references employees.id in the current database.
  // Do not store the authenticated user's ID here without a valid mapping.
  const { data, error } = await supabase
    .from("leave_master")
    .update({
      approval_status: decision,
      approved_by: null,
      approved_on: new Date().toISOString(),
      rejection_reason: decision === "Rejected" ? reason.trim() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", leaveId)
    .eq("company_id", companyId)
    .eq("approval_status", "Pending")
    .eq("is_active", true)
    .select()
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    throw new Error(
      "Application was already processed or does not belong to this company."
    );
  }

  return data;
}

// Returns approved leave overlapping the payroll period.
// This function does not mutate payroll or loan balances.
export async function getApprovedLeaveForPeriod(
  companyId,
  periodFrom,
  periodTo
) {
  requireCompany(companyId);

  if (!periodFrom || !periodTo || periodFrom > periodTo) {
    throw new Error("A valid payroll period is required.");
  }

  const { data, error } = await supabase
    .from("leave_master")
    .select(
      "id, company_id, employee_id, leave_type, from_date, to_date, total_days, session_type, approval_status"
    )
    .eq("company_id", companyId)
    .eq("is_active", true)
    .eq("approval_status", "Approved")
    .lte("from_date", periodTo)
    .gte("to_date", periodFrom);

  if (error) throw error;
  return data || [];
}
