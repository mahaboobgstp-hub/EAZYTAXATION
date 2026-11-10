import { supabase } from "../supabase/supabaseClient";

export const ACCESS_MODULES = [
  { key: "dashboard", label: "Dashboard" },
  { key: "masters", label: "Masters" },
  { key: "sales", label: "Sales" },
  { key: "purchase", label: "Purchase" },
  { key: "inventory", label: "Inventory" },
  { key: "accounting", label: "Accounting" },
  { key: "banking", label: "Banking" },
  { key: "gst", label: "GST & Compliance" },
  { key: "reports", label: "Reports" },
  { key: "hr_payroll", label: "HR & Payroll" },
  { key: "expenses", label: "Expenses" },
];

export const defaultPermissions = Object.fromEntries(
  ACCESS_MODULES.map(({ key }) => [key, { read: false, write: false }])
);

export async function getCompanyUsers(companyId) {
  if (!companyId) return [];
  const { data, error } = await supabase
    .from("company_user_access")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function inviteCompanyUser(payload) {
  const { data, error } = await supabase.functions.invoke("invite-company-user", {
    body: { ...payload, kind: "user" },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function updateCompanyUser(userAccessId, companyId, changes) {
  const { data, error } = await supabase
    .from("company_user_access")
    .update({ ...changes, updated_at: new Date().toISOString() })
    .eq("id", userAccessId)
    .eq("company_id", companyId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getCompanyCaAssignments(companyId) {
  if (!companyId) return [];
  const { data, error } = await supabase
    .from("ca_company_assignments")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function assignCaToCompany(payload) {
  const { data, error } = await supabase.functions.invoke("invite-company-user", {
    body: { ...payload, kind: "ca" },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function updateCaAccess(assignmentId, companyId, accessLevel) {
  const { data, error } = await supabase
    .from("ca_company_assignments")
    .update({ access_level: accessLevel, updated_at: new Date().toISOString() })
    .eq("id", assignmentId)
    .eq("company_id", companyId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function revokeCaAssignment(assignmentId, companyId) {
  const { error } = await supabase
    .from("ca_company_assignments")
    .update({ status: "Revoked", updated_at: new Date().toISOString() })
    .eq("id", assignmentId)
    .eq("company_id", companyId);
  if (error) throw error;
}
