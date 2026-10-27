import { supabase } from "../../supabase/supabaseClient";

function requireIds(companyId) {
  if (!companyId) {
    throw new Error("Please select a company.");
  }
}

function cleanPayload(data) {
  const payload = { ...data };

  delete payload.id;
  delete payload.company_id;
  delete payload.created_at;

  return payload;
}

export async function getEmployeeLoans(companyId) {
  requireIds(companyId);

  const { data, error } = await supabase
    .from("employee_loans")
    .select("*")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .order("loan_date", { ascending: false });

  if (error) throw error;

  return data || [];
}

export async function getEmployeeLoanById(loanId, companyId) {
  if (!loanId) throw new Error("Loan record is required.");
  requireIds(companyId);

  const { data, error } = await supabase
    .from("employee_loans")
    .select("*")
    .eq("id", loanId)
    .eq("company_id", companyId)
    .maybeSingle();

  if (error) throw error;

  return data;
}

export async function createEmployeeLoan(loanData, companyId) {
  requireIds(companyId);

  if (!loanData?.employee_id) {
    throw new Error("Select an employee.");
  }

  if (!loanData?.loan_code || !loanData?.loan_date || !loanData?.loan_type) {
    throw new Error("Loan code, date and type are required.");
  }

  if (Number(loanData.sanctioned_amount) <= 0) {
    throw new Error("Sanctioned amount must be greater than zero.");
  }

  if (!Number.isInteger(Number(loanData.repayment_months)) ||
      Number(loanData.repayment_months) < 1) {
    throw new Error("Repayment months must be at least one.");
  }

  // Confirm that the employee belongs to this company.
  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select("id")
    .eq("id", loanData.employee_id)
    .eq("company_id", companyId)
    .eq("is_active", true)
    .maybeSingle();

  if (employeeError) throw employeeError;

  if (!employee) {
    throw new Error("The selected employee does not belong to this company.");
  }

  const payload = {
    ...cleanPayload(loanData),
    company_id: companyId,
    employee_id: loanData.employee_id,
    recovered_amount: 0,
    outstanding_amount: Number(loanData.sanctioned_amount),
    loan_status: loanData.loan_status || "Pending",
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("employee_loans")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function updateEmployeeLoan(loanId, loanData, companyId) {
  if (!loanId) throw new Error("Loan record is required.");
  requireIds(companyId);

  const payload = cleanPayload(loanData);
  delete payload.loan_status;
  delete payload.recovered_amount;
  delete payload.outstanding_amount;
  delete payload.approved_by;
  delete payload.approved_date;

  if (payload.employee_id) {
    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("id")
      .eq("id", payload.employee_id)
      .eq("company_id", companyId)
      .eq("is_active", true)
      .maybeSingle();

    if (employeeError) throw employeeError;

    if (!employee) {
      throw new Error("The selected employee does not belong to this company.");
    }
  }

  payload.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("employee_loans")
    .update(payload)
    .eq("id", loanId)
    .eq("company_id", companyId)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function updateEmployeeLoanStatus(
  loanId,
  status,
  companyId
) {
  if (!loanId) throw new Error("Loan record is required.");
  requireIds(companyId);

  const allowedStatuses = [
    "Pending",
    "Approved",
    "Disbursed",
    "Rejected",
    "Closed",
  ];

  if (!allowedStatuses.includes(status)) {
    throw new Error("Invalid loan status.");
  }

  const payload = {
    loan_status: status,
    updated_at: new Date().toISOString(),
  };

  if (status === "Approved" || status === "Disbursed") {
    payload.approved_date = new Date().toISOString().slice(0, 10);
  }

  const { data, error } = await supabase
    .from("employee_loans")
    .update(payload)
    .eq("id", loanId)
    .eq("company_id", companyId)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function deactivateEmployeeLoan(loanId, companyId) {
  if (!loanId) throw new Error("Loan record is required.");
  requireIds(companyId);

  const { data, error } = await supabase
    .from("employee_loans")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", loanId)
    .eq("company_id", companyId)
    .select()
    .single();

  if (error) throw error;

  return data;
}
