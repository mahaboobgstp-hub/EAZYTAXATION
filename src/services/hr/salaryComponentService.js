
import { supabase } from "../../supabase/supabaseClient";

const TABLE = "salary_component_master";

function handleError(error, action) {
  if (error) {
    console.error(`Salary component ${action} failed:`, error);
    throw error;
  }
}

export async function getSalaryComponents(companyId, includeInactive = true) {
  if (!companyId) {
    throw new Error("Please select a company first.");
  }

  let query = supabase
    .from(TABLE)
    .select("*")
    .eq("company_id", companyId)
    .order("display_order", { ascending: true })
    .order("component_name", { ascending: true });

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  handleError(error, "fetch");

  return data || [];
}

export async function createSalaryComponent(companyId, component) {
  if (!companyId) {
    throw new Error("Please select a company first.");
  }

  if (!component.component_code?.trim()) {
    throw new Error("Component code is required.");
  }

  if (!component.component_name?.trim()) {
    throw new Error("Component name is required.");
  }

  const payload = {
    ...component,
    company_id: companyId,
    component_code: component.component_code.trim().toUpperCase(),
    component_name: component.component_name.trim(),
  };

  delete payload.id;
  delete payload.created_at;
  delete payload.updated_at;

  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select("*")
    .single();

  handleError(error, "create");

  return data;
}

export async function updateSalaryComponent(
  componentId,
  companyId,
  changes
) {
  if (!componentId || !companyId) {
    throw new Error("Component and company are required.");
  }

  const payload = { ...changes, updated_at: new Date().toISOString() };

  delete payload.id;
  delete payload.company_id;
  delete payload.created_at;

  if (payload.component_code) {
    payload.component_code = payload.component_code.trim().toUpperCase();
  }

  if (payload.component_name) {
    payload.component_name = payload.component_name.trim();
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq("id", componentId)
    .eq("company_id", companyId)
    .select("*")
    .single();

  handleError(error, "update");

  return data;
}

export async function deactivateSalaryComponent(componentId, companyId) {
  return updateSalaryComponent(componentId, companyId, {
    is_active: false,
  });
}

export async function activateSalaryComponent(componentId, companyId) {
  return updateSalaryComponent(componentId, companyId, {
    is_active: true,
  });
}
