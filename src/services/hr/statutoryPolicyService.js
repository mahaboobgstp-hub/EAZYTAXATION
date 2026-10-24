
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
