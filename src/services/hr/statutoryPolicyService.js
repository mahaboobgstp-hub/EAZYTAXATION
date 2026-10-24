
import { supabase } from "../../supabase/supabaseClient";

// Supported codes already allowed by the database constraint.
export const STATUTORY_POLICY_CODES = {
    EPF_EMPLOYEE: "EPF_EMPLOYEE",
    EPF_EMPLOYER_TOTAL: "EPF_EMPLOYER_TOTAL",
    EPS_EMPLOYER: "EPS_EMPLOYER",
    EDLI_EMPLOYER: "EDLI_EMPLOYER",
    EPF_ADMIN_CHARGE: "EPF_ADMIN_CHARGE",
    EDLI_ADMIN_CHARGE: "EDLI_ADMIN_CHARGE",
    ESI_EMPLOYEE: "ESI_EMPLOYEE",
    ESI_EMPLOYER: "ESI_EMPLOYER",
    GRATUITY_EMPLOYER: "GRATUITY_EMPLOYER",
    PT_EMPLOYEE: "PT_EMPLOYEE"
};

const POLICY_COLUMNS = `
    id,
    company_id,
    policy_code,
    policy_name,
    state_id,
    effective_from,
    effective_to,
    rate_percent,
    fixed_amount,
    wage_floor,
    wage_ceiling,
    calculation_base,
    eligibility_rules,
    calculation_rules,
    source_reference,
    remarks,
    is_active,
    created_at,
    updated_at
`;

function requireCompanyId(companyId) {
    if (!companyId) {
        throw new Error("A current company is required.");
    }
}

function requireDate(date) {
    if (
        !date ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date)
    ) {
        throw new Error(
            "A valid date in YYYY-MM-DD format is required."
        );
    }
}

// List policies belonging only to the selected company.
// Historical versions are included unless activeOnly is true.
export async function getStatutoryPolicies(
    companyId,
    { activeOnly = false, policyCode = null } = {}
) {
    requireCompanyId(companyId);

    let query = supabase
        .from("statutory_policy_versions")
        .select(POLICY_COLUMNS)
        .eq("company_id", companyId)
        .order("policy_code", { ascending: true })
        .order("effective_from", { ascending: false });

    if (activeOnly) {
        query = query.eq("is_active", true);
    }

    if (policyCode) {
        query = query.eq("policy_code", policyCode);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
}

// Resolve policies that cover a payroll date.
// Do not filter historical records by is_active: a closed policy
// may still be the correct policy for a past payroll period.
export async function getStatutoryPoliciesForDate(
    companyId,
    effectiveDate,
    { policyCodes = null, stateId = null } = {}
) {
    requireCompanyId(companyId);
    requireDate(effectiveDate);

    let query = supabase
        .from("statutory_policy_versions")
        .select(POLICY_COLUMNS)
        .eq("company_id", companyId)
        .lte("effective_from", effectiveDate)
        .order("policy_code", { ascending: true })
        .order("effective_from", { ascending: false });

    if (policyCodes?.length) {
        query = query.in("policy_code", policyCodes);
    }

    if (stateId) {
        query = query.or(
            `state_id.is.null,state_id.eq.${stateId}`
        );
    }

    const { data, error } = await query;

    if (error) throw error;

    const coveringPolicies = (data || []).filter(policy =>
        !policy.effective_to ||
        policy.effective_to >= effectiveDate
    );

    // A company must not have ambiguous overlapping policies
    // for the same code and state on a payroll date.
    const resolved = new Map();

    for (const policy of coveringPolicies) {
        const key = `${policy.policy_code}:${policy.state_id || "GLOBAL"}`;

        if (resolved.has(key)) {
            throw new Error(
                `Overlapping statutory policy versions found for ` +
                `${policy.policy_code}. Please correct the effective dates.`
            );
        }

        resolved.set(key, policy);
    }

    return Array.from(resolved.values());
}

// Convenience resolver for one policy code.
// Returns null if no matching policy covers the requested date.
export async function getStatutoryPolicyForDate(
    companyId,
    policyCode,
    effectiveDate,
    { stateId = null } = {}
) {
    const policies = await getStatutoryPoliciesForDate(
        companyId,
        effectiveDate,
        {
            policyCodes: [policyCode],
            stateId
        }
    );

    const matching = policies.filter(
        policy => policy.policy_code === policyCode
    );

    if (matching.length > 1) {
        throw new Error(
            `Multiple applicable versions found for ${policyCode}.`
        );
    }

    return matching[0] || null;
}


const ALLOWED_CALCULATION_BASES = new Set([
    "BASIC",
    "BASIC_DA",
    "ELIGIBLE_GROSS",
    "GROSS",
    "CEILING_CAPPED_WAGES",
    "FIXED_AMOUNT",
    "SLAB",
    "OTHER"
]);

// Create a draft policy version.
// New policies remain inactive until explicitly activated.
export async function createStatutoryPolicyVersion({
    companyId,
    policyCode,
    policyName,
    stateId = null,
    effectiveFrom,
    effectiveTo = null,
    ratePercent = null,
    fixedAmount = null,
    wageFloor = null,
    wageCeiling = null,
    calculationBase,
    eligibilityRules = {},
    calculationRules = {},
    sourceReference = null,
    remarks = null
}) {
    requireCompanyId(companyId);
    requireDate(effectiveFrom);

    if (
        effectiveTo !== null &&
        effectiveTo !== "" &&
        effectiveTo < effectiveFrom
    ) {
        throw new Error(
            "Effective To cannot be earlier than Effective From."
        );
    }

    if (
        !Object.values(STATUTORY_POLICY_CODES).includes(policyCode)
    ) {
        throw new Error("Unsupported statutory policy code.");
    }

    if (!String(policyName || "").trim()) {
        throw new Error("Policy name is required.");
    }

    if (!ALLOWED_CALCULATION_BASES.has(calculationBase)) {
        throw new Error("Invalid statutory calculation base.");
    }

    if (
        policyCode === STATUTORY_POLICY_CODES.PT_EMPLOYEE &&
        !stateId
    ) {
        throw new Error(
            "Professional Tax policy requires a state."
        );
    }

    const numericFields = {
        ratePercent,
        fixedAmount,
        wageFloor,
        wageCeiling
    };

    for (const [field, value] of Object.entries(numericFields)) {
        if (
            value !== null &&
            value !== "" &&
            (!Number.isFinite(Number(value)) || Number(value) < 0)
        ) {
            throw new Error(`${field} must be a non-negative number.`);
        }
    }

    const hasRate =
        ratePercent !== null && ratePercent !== "";
    const hasFixedAmount =
        fixedAmount !== null && fixedAmount !== "";

    if (
        !hasRate &&
        !hasFixedAmount &&
        !["SLAB", "OTHER"].includes(calculationBase)
    ) {
        throw new Error(
            "Provide a rate, fixed amount, or SLAB/OTHER calculation base."
        );
    }

    if (
        wageFloor !== null &&
        wageFloor !== "" &&
        wageCeiling !== null &&
        wageCeiling !== "" &&
        Number(wageCeiling) < Number(wageFloor)
    ) {
        throw new Error(
            "Wage ceiling cannot be lower than wage floor."
        );
    }

    const payload = {
        company_id: companyId,
        policy_code: policyCode,
        policy_name: String(policyName).trim(),
        state_id: stateId || null,
        effective_from: effectiveFrom,
        effective_to: effectiveTo || null,
        rate_percent: hasRate ? Number(ratePercent) : null,
        fixed_amount: hasFixedAmount ? Number(fixedAmount) : null,
        wage_floor:
            wageFloor === null || wageFloor === ""
                ? null
                : Number(wageFloor),
        wage_ceiling:
            wageCeiling === null || wageCeiling === ""
                ? null
                : Number(wageCeiling),
        calculation_base: calculationBase,
        eligibility_rules: eligibilityRules,
        calculation_rules: calculationRules,
        source_reference: sourceReference || null,
        remarks: remarks || null,
        is_active: false
    };

    const { data, error } = await supabase
        .from("statutory_policy_versions")
        .insert(payload)
        .select(POLICY_COLUMNS)
        .single();

    if (error) throw error;

    return data;
}

// Activate a draft using the transaction-safe PostgreSQL function.
export async function activateStatutoryPolicyVersion(
    companyId,
    policyId
) {
    requireCompanyId(companyId);

    if (!policyId) {
        throw new Error("A policy version ID is required.");
    }

    const { data, error } = await supabase.rpc(
        "activate_statutory_policy_version",
        {
            p_company_id: companyId,
            p_policy_id: policyId
        }
    );

    if (error) throw error;

    return data;
}

// ============================================================
// COMPLETE STATUTORY POLICY PACKAGE SERVICE
// File: src/services/hr/statutoryPolicyService.js
// ============================================================

function requirePackageCompanyId(companyId) {
    if (!companyId) {
        throw new Error("A current company is required.");
    }
}

function requirePackageDate(date) {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new Error(
            "A valid effective date in YYYY-MM-DD format is required."
        );
    }
}

const PACKAGE_COLUMNS = `
    id,
    company_id,
    version_number,
    policy_name,
    effective_from,
    effective_to,
    status,
    policy_data,
    remarks,
    created_at,
    updated_at,
    created_by,
    updated_by
`;

// Get one row per complete package version.
export async function getStatutoryPolicyPackages(companyId) {
    requirePackageCompanyId(companyId);

    const { data, error } = await supabase
        .from("statutory_policy_packages")
        .select(PACKAGE_COLUMNS)
        .eq("company_id", companyId)
        .order("version_number", { ascending: false });

    if (error) throw error;

    return data || [];
}

// Get the current active package, if one exists.
export async function getActiveStatutoryPolicyPackage(companyId) {
    requirePackageCompanyId(companyId);

    const { data, error } = await supabase
        .from("statutory_policy_packages")
        .select(PACKAGE_COLUMNS)
        .eq("company_id", companyId)
        .eq("status", "ACTIVE")
        .maybeSingle();

    if (error) throw error;

    return data || null;
}

// Resolve the package applicable to a payroll date.
// Historical/superseded packages remain eligible for past payroll.
export async function getStatutoryPolicyPackageForDate(
    companyId,
    payrollDate
) {
    requirePackageCompanyId(companyId);
    requirePackageDate(payrollDate);

    const { data, error } = await supabase
        .from("statutory_policy_packages")
        .select(PACKAGE_COLUMNS)
        .eq("company_id", companyId)
        .lte("effective_from", payrollDate)
        .order("effective_from", { ascending: false })
        .order("version_number", { ascending: false });

    if (error) throw error;

    const matches = (data || []).filter(packageVersion =>
        !packageVersion.effective_to ||
        packageVersion.effective_to >= payrollDate
    );

    if (matches.length > 1) {
        throw new Error(
            "Overlapping statutory package versions exist for this payroll date. Please review Policy History."
        );
    }

    return matches[0] || null;
}

// Create a complete draft package.
// If policyData is omitted, copy the most recent package as the
// starting point. The caller can then edit the copied configuration.
export async function createStatutoryPolicyPackageDraft({
    companyId,
    policyName,
    effectiveFrom,
    policyData,
    remarks = null
}) {
    requirePackageCompanyId(companyId);
    requirePackageDate(effectiveFrom);

    const cleanName = String(policyName || "").trim();

    if (!cleanName) {
        throw new Error("Package name is required.");
    }

    let completePolicyData = policyData;

    if (
        completePolicyData === undefined ||
        completePolicyData === null
    ) {
        const existingPackages =
            await getStatutoryPolicyPackages(companyId);

        completePolicyData =
            existingPackages.length > 0
                ? existingPackages[0].policy_data
                : {};
    }

    if (
        typeof completePolicyData !== "object" ||
        Array.isArray(completePolicyData)
    ) {
        throw new Error(
            "The statutory package configuration must be an object."
        );
    }

    const existingPackages =
        await getStatutoryPolicyPackages(companyId);

    const nextVersion =
        existingPackages.reduce(
            (highest, item) =>
                Math.max(highest, Number(item.version_number) || 0),
            0
        ) + 1;

    const { data: authData } =
        await supabase.auth.getUser();

    const userId = authData?.user?.id || null;

    const payload = {
        company_id: companyId,
        version_number: nextVersion,
        policy_name: cleanName,
        effective_from: effectiveFrom,
        effective_to: null,
        status: "DRAFT",
        policy_data: completePolicyData,
        remarks: remarks || null,
        created_by: userId,
        updated_by: userId
    };

    const { data, error } = await supabase
        .from("statutory_policy_packages")
        .insert(payload)
        .select(PACKAGE_COLUMNS)
        .single();

    if (error) {
        // The unique company/version constraint protects against
        // duplicate version numbers if simultaneous saves occur.
        throw error;
    }

    return data;
}

// Activate one complete package through the PostgreSQL function.
export async function activateStatutoryPolicyPackage(
    companyId,
    packageId
) {
    requirePackageCompanyId(companyId);

    if (!packageId) {
        throw new Error("A package version is required.");
    }

    const { data, error } = await supabase.rpc(
        "activate_statutory_policy_package",
        {
            p_company_id: companyId,
            p_package_id: packageId
        }
    );

    if (error) throw error;

    return data;
        }
