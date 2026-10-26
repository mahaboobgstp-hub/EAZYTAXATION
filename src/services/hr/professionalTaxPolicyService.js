
import { supabase } from "../../supabase/supabaseClient";

/*
 * EAZYTAXATION HR MODULE
 * Professional Tax Policy Service
 *
 * Tables:
 *   professional_tax_policies
 *   professional_tax_policy_versions
 *   professional_tax_policy_slabs
 *
 * Rules:
 *   1. Every company-owned query is filtered by company_id.
 *   2. Updates and deletes filter by both record ID and company_id.
 *   3. Only DRAFT versions can be edited.
 *   4. Policy activation must happen through a database RPC.
 *   5. PT policy configuration remains separate from PT registrations
 *      and TDS configuration.
 */

const POLICY_TABLE = "professional_tax_policies";
const VERSION_TABLE = "professional_tax_policy_versions";
const SLAB_TABLE = "professional_tax_policy_slabs";

const ACTIVATION_RPC = "activate_professional_tax_policy_version";

// ---------------------------------------------------------
// SHARED VALIDATION HELPERS
// ---------------------------------------------------------

function requireCompanyId(companyId) {
  if (!companyId || typeof companyId !== "string") {
    throw new Error("A valid company ID is required.");
  }
}

function requireId(id, fieldName = "ID") {
  if (!id || typeof id !== "string") {
    throw new Error(`${fieldName} is required.`);
  }
}

function throwIfError(error) {
  if (error) {
    throw new Error(error.message || "A database operation failed.");
  }
}

function cleanOptionalText(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const cleaned = String(value).trim();
  return cleaned === "" ? null : cleaned;
}

function requireNonEmptyText(value, fieldName) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${fieldName} is required.`);
  }

  return value.trim();
}

function validateDateRange(effectiveFrom, effectiveTo) {
  if (!effectiveFrom) {
    throw new Error("Effective From date is required.");
  }

  if (
    effectiveTo &&
    new Date(effectiveTo).getTime() <
      new Date(effectiveFrom).getTime()
  ) {
    throw new Error(
      "Effective To date cannot be earlier than Effective From date."
    );
  }
}

// ---------------------------------------------------------
// POLICY MASTER
// ---------------------------------------------------------

/**
 * Fetch PT policy masters belonging to the selected company.
 *
 * Optional filters:
 *   stateId
 *   search
 *
 * Includes versions and slabs through separate company-filtered queries.
 */
export async function getProfessionalTaxPolicies(
  companyId,
  filters = {}
) {
  requireCompanyId(companyId);

  let query = supabase
    .from(POLICY_TABLE)
    .select(
      "id, company_id, state_id, policy_code, policy_name, created_at, updated_at"
    )
    .eq("company_id", companyId)
    .order("policy_name", { ascending: true });

  if (filters.stateId) {
    query = query.eq("state_id", filters.stateId);
  }

  if (filters.search?.trim()) {
    const search = filters.search.trim();

    // Escape PostgREST filter punctuation to avoid treating user input
    // as filter syntax.
    const escapedSearch = search.replace(/[,%()]/g, "");

    if (escapedSearch) {
      query = query.ilike("policy_name", `%${escapedSearch}%`);
    }
  }

  const { data: policies, error } = await query;
  throwIfError(error);

  if (!policies?.length) {
    return [];
  }

  const policyIds = policies.map((policy) => policy.id);

  const { data: versions, error: versionsError } = await supabase
    .from(VERSION_TABLE)
    .select("*")
    .eq("company_id", companyId)
    .in("policy_id", policyIds)
    .order("version_number", { ascending: false });

  throwIfError(versionsError);

  const versionIds = (versions || []).map((version) => version.id);

  let slabs = [];

  if (versionIds.length > 0) {
    const { data: slabData, error: slabsError } = await supabase
      .from(SLAB_TABLE)
      .select("*")
      .eq("company_id", companyId)
      .in("policy_version_id", versionIds)
      .order("display_order", { ascending: true });

    throwIfError(slabsError);
    slabs = slabData || [];
  }

  return policies.map((policy) => ({
    ...policy,
    versions: (versions || [])
      .filter((version) => version.policy_id === policy.id)
      .map((version) => ({
        ...version,
        slabs: slabs.filter(
          (slab) => slab.policy_version_id === version.id
        ),
      })),
  }));
}

/**
 * Fetch one PT policy master.
 */
export async function getProfessionalTaxPolicyById(
  policyId,
  companyId
) {
  requireCompanyId(companyId);
  requireId(policyId, "Policy ID");

  const { data, error } = await supabase
    .from(POLICY_TABLE)
    .select("*")
    .eq("id", policyId)
    .eq("company_id", companyId)
    .maybeSingle();

  throwIfError(error);

  return data;
}

/**
 * Create a policy master.
 *
 * This function creates the master only.
 * Call createProfessionalTaxPolicyVersion() to create its draft version.
 *
 * If the second operation fails, the master can remain without a version.
 * The UI should report this clearly and allow the user to retry version
 * creation instead of silently creating duplicate masters.
 */
export async function createProfessionalTaxPolicy(
  policyData,
  companyId
) {
  requireCompanyId(companyId);

  if (!policyData || typeof policyData !== "object") {
    throw new Error("Policy details are required.");
  }

  const stateId = requireNonEmptyText(
    policyData.state_id,
    "State"
  );

  const policyName = requireNonEmptyText(
    policyData.policy_name,
    "Policy name"
  );

  const payload = {
    company_id: companyId,
    state_id: stateId,
    policy_name: policyName,
    policy_code: cleanOptionalText(policyData.policy_code),
  };

  const { data, error } = await supabase
    .from(POLICY_TABLE)
    .insert(payload)
    .select("*")
    .single();

  throwIfError(error);

  return data;
}

/**
 * Update policy master details.
 *
 * Policy master updates do not modify historical version snapshots.
 */
export async function updateProfessionalTaxPolicy(
  policyId,
  policyData,
  companyId
) {
  requireCompanyId(companyId);
  requireId(policyId, "Policy ID");

  if (!policyData || typeof policyData !== "object") {
    throw new Error("Policy details are required.");
  }

  const payload = {};

  if (policyData.state_id !== undefined) {
    payload.state_id = requireNonEmptyText(
      policyData.state_id,
      "State"
    );
  }

  if (policyData.policy_name !== undefined) {
    payload.policy_name = requireNonEmptyText(
      policyData.policy_name,
      "Policy name"
    );
  }

  if (policyData.policy_code !== undefined) {
    payload.policy_code = cleanOptionalText(
      policyData.policy_code
    );
  }

  if (Object.keys(payload).length === 0) {
    throw new Error("No policy fields were provided to update.");
  }

  payload.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from(POLICY_TABLE)
    .update(payload)
    .eq("id", policyId)
    .eq("company_id", companyId)
    .select("*")
    .single();

  throwIfError(error);

  return data;
}

// ---------------------------------------------------------
// POLICY VERSIONS
// ---------------------------------------------------------

/**
 * Fetch all versions for one policy.
 */
export async function getProfessionalTaxPolicyVersions(
  policyId,
  companyId
) {
  requireCompanyId(companyId);
  requireId(policyId, "Policy ID");

  const { data, error } = await supabase
    .from(VERSION_TABLE)
    .select("*")
    .eq("company_id", companyId)
    .eq("policy_id", policyId)
    .order("version_number", { ascending: false });

  throwIfError(error);

  return data || [];
}

/**
 * Fetch one version.
 */
export async function getProfessionalTaxPolicyVersionById(
  versionId,
  companyId
) {
  requireCompanyId(companyId);
  requireId(versionId, "Policy version ID");

  const { data, error } = await supabase
    .from(VERSION_TABLE)
    .select("*")
    .eq("id", versionId)
    .eq("company_id", companyId)
    .maybeSingle();

  throwIfError(error);

  return data;
}

/**
 * Create a new DRAFT version.
 *
 * version_number is calculated from the existing versions.
 * The database UNIQUE constraint remains the final safeguard against
 * simultaneous requests attempting to create the same version number.
 */
export async function createProfessionalTaxPolicyVersion(
  policyId,
  versionData,
  companyId
) {
  requireCompanyId(companyId);
  requireId(policyId, "Policy ID");

  if (!versionData || typeof versionData !== "object") {
    throw new Error("Policy version details are required.");
  }

  const policy = await getProfessionalTaxPolicyById(
    policyId,
    companyId
  );

  if (!policy) {
    throw new Error(
      "The PT policy was not found for the selected company."
    );
  }

  const versions = await getProfessionalTaxPolicyVersions(
    policyId,
    companyId
  );

  const highestVersion = versions.reduce(
    (highest, version) =>
      Math.max(highest, Number(version.version_number) || 0),
    0
  );

  const versionNumber = highestVersion + 1;

  const effectiveFrom = versionData.effective_from;
  const effectiveTo = versionData.effective_to || null;

  validateDateRange(effectiveFrom, effectiveTo);

  const salaryBasis = versionData.salary_basis || "GROSS_MONTHLY";
  const collectionFrequency =
    versionData.collection_frequency || "MONTHLY";

  const allowedSalaryBases = [
    "GROSS_MONTHLY",
    "BASIC_DA",
    "CONFIGURED_COMPONENTS",
    "OTHER",
  ];

  const allowedFrequencies = [
    "MONTHLY",
    "QUARTERLY",
    "HALF_YEARLY",
    "ANNUALLY",
    "CONFIGURED",
  ];

  if (!allowedSalaryBases.includes(salaryBasis)) {
    throw new Error("Invalid PT salary basis.");
  }

  if (!allowedFrequencies.includes(collectionFrequency)) {
    throw new Error("Invalid PT collection frequency.");
  }

  const specialMonth =
    versionData.special_collection_month === "" ||
    versionData.special_collection_month === undefined
      ? null
      : versionData.special_collection_month;

  if (
    specialMonth !== null &&
    specialMonth !== undefined &&
    (!Number.isInteger(Number(specialMonth)) ||
      Number(specialMonth) < 1 ||
      Number(specialMonth) > 12)
  ) {
    throw new Error(
      "Special collection month must be between 1 and 12."
    );
  }

  const payload = {
    company_id: companyId,
    policy_id: policyId,
    version_number: versionNumber,
    policy_name: policy.policy_name,
    effective_from: effectiveFrom,
    effective_to: effectiveTo,
    salary_basis: salaryBasis,
    collection_frequency: collectionFrequency,
    special_collection_month:
      specialMonth === null ? null : Number(specialMonth),
    exemption_rules: versionData.exemption_rules ?? {},
    source_reference: cleanOptionalText(
      versionData.source_reference
    ),
    remarks: cleanOptionalText(versionData.remarks),
    status: "DRAFT",
    is_enabled: versionData.is_enabled ?? true,
  };

  const { data, error } = await supabase
    .from(VERSION_TABLE)
    .insert(payload)
    .select("*")
    .single();

  throwIfError(error);

  return data;
}

/**
 * Update an existing DRAFT version.
 *
 * Active and superseded versions cannot be edited through this function.
 */
export async function updateProfessionalTaxPolicyVersion(
  versionId,
  versionData,
  companyId
) {
  requireCompanyId(companyId);
  requireId(versionId, "Policy version ID");

  if (!versionData || typeof versionData !== "object") {
    throw new Error("Policy version details are required.");
  }

  const existing = await getProfessionalTaxPolicyVersionById(
    versionId,
    companyId
  );

  if (!existing) {
    throw new Error(
      "The policy version was not found for the selected company."
    );
  }

  if (existing.status !== "DRAFT") {
    throw new Error(
      "Only DRAFT policy versions can be edited. Create a new version instead."
    );
  }

  const payload = {};

  const editableFields = [
    "effective_from",
    "effective_to",
    "salary_basis",
    "collection_frequency",
    "special_collection_month",
    "exemption_rules",
    "source_reference",
    "remarks",
    "is_enabled",
  ];

  editableFields.forEach((field) => {
    if (versionData[field] !== undefined) {
      payload[field] = versionData[field];
    }
  });

  if (versionData.effective_to === "") {
    payload.effective_to = null;
  }

  if (versionData.special_collection_month === "") {
    payload.special_collection_month = null;
  }

  if (payload.source_reference !== undefined) {
    payload.source_reference = cleanOptionalText(
      payload.source_reference
    );
  }

  if (payload.remarks !== undefined) {
    payload.remarks = cleanOptionalText(payload.remarks);
  }

  const effectiveFrom =
    payload.effective_from ?? existing.effective_from;

  const effectiveTo =
    payload.effective_to !== undefined
      ? payload.effective_to
      : existing.effective_to;

  validateDateRange(effectiveFrom, effectiveTo);

  if (
    payload.salary_basis !== undefined &&
    ![
      "GROSS_MONTHLY",
      "BASIC_DA",
      "CONFIGURED_COMPONENTS",
      "OTHER",
    ].includes(payload.salary_basis)
  ) {
    throw new Error("Invalid PT salary basis.");
  }

  if (
    payload.collection_frequency !== undefined &&
    ![
      "MONTHLY",
      "QUARTERLY",
      "HALF_YEARLY",
      "ANNUALLY",
      "CONFIGURED",
    ].includes(payload.collection_frequency)
  ) {
    throw new Error("Invalid PT collection frequency.");
  }

  if (payload.special_collection_month != null) {
    const month = Number(payload.special_collection_month);

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new Error(
        "Special collection month must be between 1 and 12."
      );
    }

    payload.special_collection_month = month;
  }

  if (Object.keys(payload).length === 0) {
    throw new Error("No version fields were provided to update.");
  }

  payload.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from(VERSION_TABLE)
    .update(payload)
    .eq("id", versionId)
    .eq("company_id", companyId)
    .eq("status", "DRAFT")
    .select("*")
    .single();

  throwIfError(error);

  return data;
}

// ---------------------------------------------------------
// PROFESSIONAL TAX SALARY SLABS
// ---------------------------------------------------------

/**
 * Fetch salary slabs for one policy version.
 */
export async function getProfessionalTaxPolicySlabs(
  versionId,
  companyId
) {
  requireCompanyId(companyId);
  requireId(versionId, "Policy version ID");

  const { data, error } = await supabase
    .from(SLAB_TABLE)
    .select("*")
    .eq("company_id", companyId)
    .eq("policy_version_id", versionId)
    .order("display_order", { ascending: true });

  throwIfError(error);

  return data || [];
}

/**
 * Validate salary slabs before saving.
 *
 * Range convention:
 *   salary_from is inclusive.
 *   salary_to is exclusive.
 *   A null salary_to means there is no upper limit.
 *
 * Example:
 *   0 to 15000
 *   15000 to 20000
 *   20000 to no upper limit
 *
 * This permits adjacent slabs without overlapping their boundaries.
 */
function validateProfessionalTaxSlabs(slabs) {
  if (!Array.isArray(slabs) || slabs.length === 0) {
    throw new Error(
      "Add at least one salary slab before saving the policy."
    );
  }

  const normalized = slabs.map((slab, index) => {
    const salaryFrom = Number(slab.salary_from);
    const salaryTo =
      slab.salary_to === "" ||
      slab.salary_to === null ||
      slab.salary_to === undefined
        ? null
        : Number(slab.salary_to);

    const ptAmount = Number(slab.pt_amount);

    if (!Number.isFinite(salaryFrom) || salaryFrom < 0) {
      throw new Error(
        `Slab ${index + 1}: Salary From must be zero or greater.`
      );
    }

    if (!Number.isFinite(ptAmount) || ptAmount < 0) {
      throw new Error(
        `Slab ${index + 1}: PT amount must be zero or greater.`
      );
    }

    if (
      salaryTo !== null &&
      (!Number.isFinite(salaryTo) || salaryTo <= salaryFrom)
    ) {
      throw new Error(
        `Slab ${index + 1}: Salary To must be greater than Salary From.`
      );
    }

    return {
      display_order: index + 1,
      salary_from: salaryFrom,
      salary_to: salaryTo,
      pt_amount: ptAmount,
      remarks: cleanOptionalText(slab.remarks),
    };
  });

  for (let index = 0; index < normalized.length; index += 1) {
    const current = normalized[index];
    const next = normalized[index + 1];

    if (current.salary_to === null && next) {
      throw new Error(
        "Only the final salary slab can have no upper salary limit."
      );
    }

    if (next) {
  if (current.salary_to === null) {
    continue;
  }

  if (current.salary_to >= next.salary_from) {
    throw new Error(
      `Slabs ${index + 1} and ${index + 2} overlap.`
    );
  }

  if (current.salary_to + 1 < next.salary_from) {
    throw new Error(
      `There is a salary range gap between slabs ${index + 1} and ${index + 2}.`
    );
  }
}
  }

  return normalized;
}

/**
 * Replace all slabs for a DRAFT version.
 *
 * IMPORTANT:
 * Supabase client calls are not a single transaction. If inserting the
 * replacement slabs fails after deletion, the old slabs will already
 * have been removed. For production-critical saves, use a database RPC
 * that validates and replaces all slabs in one transaction.
 */
export async function saveProfessionalTaxPolicySlabs(
  versionId,
  slabs,
  companyId
) {
  requireCompanyId(companyId);
  requireId(versionId, "Policy version ID");

  const version = await getProfessionalTaxPolicyVersionById(
    versionId,
    companyId
  );

  if (!version) {
    throw new Error(
      "The policy version was not found for the selected company."
    );
  }

  if (version.status !== "DRAFT") {
    throw new Error(
      "Salary slabs can only be changed for a DRAFT policy version."
    );
  }

  const validatedSlabs = validateProfessionalTaxSlabs(slabs);

  const { error: deleteError } = await supabase
    .from(SLAB_TABLE)
    .delete()
    .eq("company_id", companyId)
    .eq("policy_version_id", versionId);

  throwIfError(deleteError);

  const payload = validatedSlabs.map((slab) => ({
    ...slab,
    company_id: companyId,
    policy_version_id: versionId,
  }));

  const { data, error } = await supabase
    .from(SLAB_TABLE)
    .insert(payload)
    .select("*")
    .order("display_order", { ascending: true });

  throwIfError(error);

  return data || [];
}

// ---------------------------------------------------------
// POLICY HISTORY
// ---------------------------------------------------------

/**
 * Fetch PT policy version history for the selected company.
 *
 * Optional filters:
 *   policyId
 *   stateId
 *   status
 *   effectiveFrom
 *   effectiveTo
 *   search
 *
 * The date filters apply to effective_from.
 */
export async function getProfessionalTaxPolicyHistory(
  companyId,
  filters = {}
) {
  requireCompanyId(companyId);

  let query = supabase
    .from(VERSION_TABLE)
    .select(
      "*, professional_tax_policies!inner(id, state_id, policy_code, policy_name)"
    )
    .eq("company_id", companyId)
    .order("effective_from", { ascending: false })
    .order("version_number", { ascending: false });

  if (filters.policyId) {
    query = query.eq("policy_id", filters.policyId);
  }

  if (filters.status && filters.status !== "ALL") {
    query = query.eq("status", filters.status);
  }

  if (filters.effectiveFrom) {
    query = query.gte("effective_from", filters.effectiveFrom);
  }

  if (filters.effectiveTo) {
    query = query.lte("effective_from", filters.effectiveTo);
  }

  if (filters.search?.trim()) {
    const search = filters.search.trim().replace(/[,%()]/g, "");

    if (search) {
      query = query.ilike("policy_name", `%${search}%`);
    }
  }

  const { data, error } = await query;

  throwIfError(error);

  let results = data || [];

  // Filter state using the related policy master.
  if (filters.stateId) {
    results = results.filter(
      (version) =>
        version.professional_tax_policies?.state_id === filters.stateId
    );
  }

  return results;
}

// ---------------------------------------------------------
// POLICY ACTIVATION
// ---------------------------------------------------------

/**
 * Activate a PT policy version using a database RPC.
 *
 * The RPC must perform activation in a database transaction and verify:
 *   - The version belongs to company_id.
 *   - The version is a valid DRAFT.
 *   - Required salary slabs exist and are valid.
 *   - Effective dates do not conflict with other active versions
 *     of the same policy.
 *   - Previous versions are transitioned safely.
 *
 * The database function must accept:
 *   p_company_id UUID
 *   p_policy_version_id UUID
 *
 * Do not replace this with separate client-side status updates.
 */
export async function activateProfessionalTaxPolicyVersion(
  versionId,
  companyId
) {
  requireCompanyId(companyId);
  requireId(versionId, "Policy version ID");

  const version = await getProfessionalTaxPolicyVersionById(
    versionId,
    companyId
  );

  if (!version) {
    throw new Error(
      "The policy version was not found for the selected company."
    );
  }

  if (version.status !== "DRAFT") {
    throw new Error("Only DRAFT versions can be activated.");
  }

  const slabs = await getProfessionalTaxPolicySlabs(
    versionId,
    companyId
  );

  // Validate saved slabs before requesting activation.
  validateProfessionalTaxSlabs(slabs);

  const { data, error } = await supabase.rpc(ACTIVATION_RPC, {
    p_company_id: companyId,
    p_policy_version_id: versionId,
  });

  if (error) {
    throw new Error(
      `PT activation failed. Verify that the database RPC "${ACTIVATION_RPC}" exists and accepts p_company_id and p_policy_version_id. Details: ${error.message}`
    );
  }

  return data;
}

// ---------------------------------------------------------
// ENABLE / DISABLE DRAFT VERSION
// ---------------------------------------------------------

/**
 * Change the enabled flag on a DRAFT version.
 *
 * This does not activate a policy version.
 */
export async function setProfessionalTaxPolicyVersionEnabled(
  versionId,
  isEnabled,
  companyId
) {
  requireCompanyId(companyId);
  requireId(versionId, "Policy version ID");

  if (typeof isEnabled !== "boolean") {
    throw new Error("Enabled status must be true or false.");
  }

  const { data, error } = await supabase
    .from(VERSION_TABLE)
    .update({
      is_enabled: isEnabled,
      updated_at: new Date().toISOString(),
    })
    .eq("id", versionId)
    .eq("company_id", companyId)
    .eq("status", "DRAFT")
    .select("*")
    .single();

  throwIfError(error);

  return data;
}
