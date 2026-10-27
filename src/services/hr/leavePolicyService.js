
import { supabase } from "../../supabase/supabaseClient";

function requireCompany(companyId) {
    if (!companyId) {
        throw new Error("Please select a company.");
    }
}

// Fetch leave policies for the selected company.
export async function getLeavePolicies(
    companyId,
    activeOnly = false
) {
    requireCompany(companyId);

    let query = supabase
        .from("leave_policies")
        .select("*")
        .eq("company_id", companyId)
        .order("policy_name", { ascending: true });

    if (activeOnly) {
        query = query.eq("is_active", true);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
}

// Fetch one policy belonging to the selected company.
export async function getLeavePolicyById(
    policyId,
    companyId
) {
    if (!policyId) {
        throw new Error("Leave policy is required.");
    }

    requireCompany(companyId);

    const { data, error } = await supabase
        .from("leave_policies")
        .select("*")
        .eq("id", policyId)
        .eq("company_id", companyId)
        .maybeSingle();

    if (error) throw error;

    return data;
}

// Create a leave policy.
export async function createLeavePolicy(
    policyData,
    companyId
) {
    requireCompany(companyId);

    if (!policyData?.policy_name?.trim()) {
        throw new Error("Policy name is required.");
    }

    const payload = {
        ...policyData,
        policy_name: policyData.policy_name.trim(),
        company_id: companyId,
    };

    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;

    const { data, error } = await supabase
        .from("leave_policies")
        .insert(payload)
        .select()
        .single();

    if (error) throw error;

    return data;
}

// Update a policy without changing its company.
export async function updateLeavePolicy(
    policyId,
    policyData,
    companyId
) {
    if (!policyId) {
        throw new Error("Leave policy is required.");
    }

    requireCompany(companyId);

    if (!policyData?.policy_name?.trim()) {
        throw new Error("Policy name is required.");
    }

    const payload = { ...policyData };

    delete payload.id;
    delete payload.company_id;
    delete payload.created_at;

    payload.policy_name = payload.policy_name.trim();
    payload.updated_at = new Date().toISOString();

    const { data, error } = await supabase
        .from("leave_policies")
        .update(payload)
        .eq("id", policyId)
        .eq("company_id", companyId)
        .select()
        .single();

    if (error) throw error;

    return data;
}

// Deactivate instead of deleting a policy with history.
export async function deactivateLeavePolicy(
    policyId,
    companyId
) {
    if (!policyId) {
        throw new Error("Leave policy is required.");
    }

    requireCompany(companyId);

    const { data, error } = await supabase
        .from("leave_policies")
        .update({
            is_active: false,
            updated_at: new Date().toISOString(),
        })
        .eq("id", policyId)
        .eq("company_id", companyId)
        .select()
        .single();

    if (error) throw error;

    return data;
}

// Fetch the leave types belonging to a policy.
export async function getLeavePolicyTypes(
    policyId,
    companyId,
    activeOnly = false
) {
    if (!policyId) {
        throw new Error("Leave policy is required.");
    }

    requireCompany(companyId);

    // Confirm the parent policy belongs to this company.
    const policy = await getLeavePolicyById(
        policyId,
        companyId
    );

    if (!policy) {
        throw new Error(
            "Leave policy was not found in this company."
        );
    }

    let query = supabase
        .from("leave_policy_types")
        .select("*")
        .eq("leave_policy_id", policyId)
        .eq("company_id", companyId)
        .order("leave_type_name", { ascending: true });

    if (activeOnly) {
        query = query.eq("is_active", true);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
}

// Create a leave type under a company-owned policy.
export async function createLeavePolicyType(
    typeData,
    companyId
) {
    requireCompany(companyId);

    if (
        !typeData?.leave_policy_id ||
        !typeData?.leave_type_name?.trim()
    ) {
        throw new Error(
            "Leave policy and leave type name are required."
        );
    }

    const policy = await getLeavePolicyById(
        typeData.leave_policy_id,
        companyId
    );

    if (!policy) {
        throw new Error(
            "Leave policy was not found in this company."
        );
    }

    const payload = {
        ...typeData,
        leave_type_name: typeData.leave_type_name.trim(),
        company_id: companyId,
    };

    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;

    const { data, error } = await supabase
        .from("leave_policy_types")
        .insert(payload)
        .select()
        .single();

    if (error) throw error;

    return data;
}

// Update a leave type within its company.
export async function updateLeavePolicyType(
    typeId,
    typeData,
    companyId
) {
    if (!typeId) {
        throw new Error("Leave type is required.");
    }

    requireCompany(companyId);

    const payload = { ...typeData };

    delete payload.id;
    delete payload.company_id;
    delete payload.created_at;

    if (payload.leave_policy_id) {
        const policy = await getLeavePolicyById(
            payload.leave_policy_id,
            companyId
        );

        if (!policy) {
            throw new Error(
                "Leave policy was not found in this company."
            );
        }
    }

    payload.updated_at = new Date().toISOString();

    const { data, error } = await supabase
        .from("leave_policy_types")
        .update(payload)
        .eq("id", typeId)
        .eq("company_id", companyId)
        .select()
        .single();

    if (error) throw error;

    return data;
}

// Deactivate a leave type.
export async function deactivateLeavePolicyType(
    typeId,
    companyId
) {
    if (!typeId) {
        throw new Error("Leave type is required.");
    }

    requireCompany(companyId);

    const { data, error } = await supabase
        .from("leave_policy_types")
        .update({
            is_active: false,
            updated_at: new Date().toISOString(),
        })
        .eq("id", typeId)
        .eq("company_id", companyId)
        .select()
        .single();

    if (error) throw error;

    return data;
}
