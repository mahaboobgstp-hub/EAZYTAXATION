
import { supabase } from "../../supabase/supabaseClient";

function requireCompanyId(companyId) {
  if (!companyId) {
    throw new Error("Select a company before managing TDS policies.");
  }
}

export async function getSalaryTdsPolicies(companyId) {
  requireCompanyId(companyId);

  const { data, error } = await supabase
    .from("salary_tds_policies")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getSalaryTdsPolicy(policyId, companyId) {
  requireCompanyId(companyId);

  const { data: policy, error: policyError } = await supabase
    .from("salary_tds_policies")
    .select("*")
    .eq("id", policyId)
    .eq("company_id", companyId)
    .single();

  if (policyError) throw policyError;

  const { data: slabs, error: slabsError } = await supabase
    .from("salary_tds_slabs")
    .select("*")
    .eq("policy_id", policyId)
    .eq("company_id", companyId)
    .order("display_order", { ascending: true });

  if (slabsError) throw slabsError;

  return { ...policy, slabs: slabs ?? [] };
}

export async function createSalaryTdsPolicy(policy, companyId) {
  requireCompanyId(companyId);

  const payload = {
    ...policy,
    company_id: companyId,
    policy_code: String(policy.policy_code ?? "").trim(),
    policy_name: String(policy.policy_name ?? "").trim(),
    policy_status: "DRAFT",
  };

  if (!payload.policy_code || !payload.policy_name) {
    throw new Error("Policy code and policy name are required.");
  }

  if (!payload.effective_from || !payload.tax_year || !payload.tax_regime) {
    throw new Error("Tax year, regime and effective-from date are required.");
  }

  const { data, error } = await supabase
    .from("salary_tds_policies")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function saveSalaryTdsSlabs(policyId, slabs, companyId) {
  requireCompanyId(companyId);

  if (!policyId) throw new Error("Select a TDS policy.");
  if (!Array.isArray(slabs) || slabs.length === 0) {
    throw new Error("Add at least one tax slab.");
  }

  // Verify the policy belongs to the active company.
  const { data: policy, error: policyError } = await supabase
    .from("salary_tds_policies")
    .select("id, policy_status")
    .eq("id", policyId)
    .eq("company_id", companyId)
    .single();

  if (policyError) throw policyError;

  if (policy.policy_status === "ACTIVE") {
    throw new Error(
      "An active policy cannot be edited directly. Create a new version instead."
    );
  }

  const normalized = slabs.map((slab, index) => ({
    company_id: companyId,
    policy_id: policyId,
    income_from: Number(slab.income_from),
    income_to:
      slab.income_to === "" || slab.income_to == null
        ? null
        : Number(slab.income_to),
    tax_rate_percent: Number(slab.tax_rate_percent),
    display_order: index + 1,
  }));

  for (const slab of normalized) {
    if (
      !Number.isFinite(slab.income_from) ||
      !Number.isFinite(slab.tax_rate_percent) ||
      slab.income_from < 0 ||
      slab.tax_rate_percent < 0 ||
      slab.tax_rate_percent > 100 ||
      (slab.income_to !== null &&
        (!Number.isFinite(slab.income_to) ||
          slab.income_to <= slab.income_from))
    ) {
      throw new Error("One or more tax slabs contain invalid values.");
    }
  }

  const ordered = [...normalized].sort(
    (a, b) => a.income_from - b.income_from
  );

  for (let i = 1; i < ordered.length; i += 1) {
    const previous = ordered[i - 1];
    const current = ordered[i];

    if (
      previous.income_to === null ||
      current.income_from < previous.income_to
    ) {
      throw new Error("Tax slab ranges overlap.");
    }
  }

  // Replace draft slabs. This is safe only for DRAFT policies.
  const { error: deleteError } = await supabase
    .from("salary_tds_slabs")
    .delete()
    .eq("policy_id", policyId)
    .eq("company_id", companyId);

  if (deleteError) throw deleteError;

  const { data, error } = await supabase
    .from("salary_tds_slabs")
    .insert(normalized)
    .select();

  if (error) throw error;
  return data ?? [];
}

export async function assignSalaryTdsPolicy({
  companyId,
  employeeId,
  policyId,
  taxRegime,
  effectiveFrom,
}) {
  requireCompanyId(companyId);

  if (!employeeId || !policyId || !effectiveFrom || !taxRegime) {
    throw new Error(
      "Employee, policy, tax regime and effective-from date are required."
    );
  }

  const { data: policy, error: policyError } = await supabase
    .from("salary_tds_policies")
    .select("id, tax_regime, policy_status, effective_from, effective_to")
    .eq("id", policyId)
    .eq("company_id", companyId)
    .single();

  if (policyError) throw policyError;

  if (policy.policy_status !== "ACTIVE") {
    throw new Error("Only an active TDS policy can be assigned.");
  }

  if (policy.tax_regime !== taxRegime) {
    throw new Error(
      "The employee's selected regime does not match this policy."
    );
  }

  if (
    effectiveFrom < policy.effective_from ||
    (policy.effective_to && effectiveFrom > policy.effective_to)
  ) {
    throw new Error("Assignment date falls outside the policy's effective dates.");
  }

  // IMPORTANT:
  // Before enabling this function in Employee Master, validate employeeId
  // against the actual employee table and company_id. Do not rely on a
  // client-supplied employee UUID alone.

  const { data, error } = await supabase
    .from("employee_tds_assignments")
    .insert({
      company_id: companyId,
      employee_id: employeeId,
      policy_id: policyId,
      tax_regime: taxRegime,
      effective_from: effectiveFrom,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
export async function updateSalaryTdsPolicy(policyId, policy, companyId) {
  requireCompanyId(companyId);

  if (!policyId) throw new Error("Select a policy to update.");

  const { data: existing, error: readError } = await supabase
    .from("salary_tds_policies")
    .select("id, policy_status")
    .eq("id", policyId)
    .eq("company_id", companyId)
    .single();

  if (readError) throw readError;

  if (existing.policy_status !== "DRAFT") {
    throw new Error("Only draft policies can be edited. Create a new policy version.");
  }

  const allowedFields = [
    "policy_code",
    "policy_name",
    "tax_year",
    "applicable_act",
    "tax_regime",
    "effective_from",
    "effective_to",
    "standard_deduction",
    "rebate_income_limit",
    "maximum_rebate",
    "cess_percent",
    "surcharge_rules",
    "deduction_rules",
    "calculation_settings"
  ];

  const payload = Object.fromEntries(
    allowedFields
      .filter(key => policy[key] !== undefined)
      .map(key => [key, policy[key]])
  );

  if (payload.policy_code !== undefined) {
    payload.policy_code = String(payload.policy_code).trim();
  }

  if (payload.policy_name !== undefined) {
    payload.policy_name = String(payload.policy_name).trim();
  }

  const { data, error } = await supabase
    .from("salary_tds_policies")
    .update(payload)
    .eq("id", policyId)
    .eq("company_id", companyId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function activateSalaryTdsPolicy(policyId, companyId) {
  requireCompanyId(companyId);

  const policy = await getSalaryTdsPolicy(policyId, companyId);

  if (policy.policy_status !== "DRAFT") {
    throw new Error("Only draft policies can be activated.");
  }

  if (!policy.policy_code || !policy.policy_name || !policy.tax_year) {
    throw new Error("Policy code, name and tax year are required.");
  }

  if (!policy.effective_from || !policy.tax_regime) {
    throw new Error("Effective date and tax regime are required.");
  }

  const slabs = [...(policy.slabs || [])].sort(
    (a, b) => Number(a.income_from) - Number(b.income_from)
  );

  if (!slabs.length) {
    throw new Error("Add tax slabs before activating the policy.");
  }

  if (Number(slabs[0].income_from) !== 0) {
    throw new Error("The first tax slab must start at ₹0.");
  }

  for (let i = 0; i < slabs.length; i += 1) {
    const slab = slabs[i];

    if (
      slab.income_to === null ||
      slab.income_to === undefined
    ) {
      if (i !== slabs.length - 1) {
        throw new Error("Only the final tax slab can have an open-ended upper limit.");
      }
    } else {
      if (Number(slab.income_to) <= Number(slab.income_from)) {
        throw new Error("Invalid tax slab range.");
      }

      if (
        i < slabs.length - 1 &&
        Number(slabs[i + 1].income_from) !== Number(slab.income_to)
      ) {
        throw new Error("Tax slabs must be contiguous, without gaps or overlaps.");
      }
    }
  }

  if (slabs[slabs.length - 1].income_to != null) {
    throw new Error("The final tax slab must have an open-ended upper limit.");
  }

  // This validates structure, not the legal accuracy of the rates.
  // Verify the tax-year policy against official rules before activation.
  const { data, error } = await supabase
    .from("salary_tds_policies")
    .update({ policy_status: "ACTIVE" })
    .eq("id", policyId)
    .eq("company_id", companyId)
    .eq("policy_status", "DRAFT")
    .select()
    .single();

  if (error) throw error;
  return data;
}
