import { supabase } from "../../supabase/supabaseClient";


/* =========================================
   GET ALL POLICIES
========================================= */

export async function getLateDeductionPolicies(
    companyId
) {

    if (!companyId) {
        return [];
    }


    const {
        data,
        error
    } = await supabase
        .from("late_deduction_policies")
        .select("*")
        .eq(
            "company_id",
            companyId
        )
        .order(
            "effective_from",
            {
                ascending: false
            }
        );


    if (error) {
        throw error;
    }


    return data || [];

}


/* =========================================
   GET ACTIVE POLICIES
========================================= */

export async function getActiveLateDeductionPolicies(
    companyId
) {

    if (!companyId) {
        return [];
    }


    const {
        data,
        error
    } = await supabase
        .from("late_deduction_policies")
        .select("*")
        .eq(
            "company_id",
            companyId
        )
        .eq(
            "is_active",
            true
        )
        .order(
            "policy_name",
            {
                ascending: true
            }
        );


    if (error) {
        throw error;
    }


    return data || [];

}


/* =========================================
   CREATE POLICY
========================================= */

export async function createLateDeductionPolicy(
    policyData,
    companyId
) {

    if (!companyId) {
        throw new Error(
            "Company is required."
        );
    }


    const payload = {

        company_id:
            companyId,

        policy_name:
            policyData.policy_name,

        description:
            policyData.description ||
            null,

        effective_from:
            policyData.effective_from,

        effective_to:
            policyData.effective_to ||
            null,

        grace_minutes:
            Number(
                policyData.grace_minutes
            ) || 0,

        allowed_late_occurrences:
            Number(
                policyData.allowed_late_occurrences
            ) || 0,

        deduction_method:
            policyData.deduction_method ||
            "DAILY_RATE",

        deduction_value:
            Number(
                policyData.deduction_value
            ) || 0,

        max_deduction_days:
            Number(
                policyData.max_deduction_days
            ) || 0,

        is_active:
            policyData.is_active !== false,

        remarks:
            policyData.remarks ||
            null
    };


    const {
        data,
        error
    } = await supabase
        .from(
            "late_deduction_policies"
        )
        .insert(
            payload
        )
        .select()
        .single();


    if (error) {
        throw error;
    }


    return data;

}


/* =========================================
   UPDATE POLICY
========================================= */

export async function updateLateDeductionPolicy(
    policyId,
    policyData,
    companyId
) {

    if (!policyId || !companyId) {
        throw new Error(
            "Policy and company are required."
        );
    }


    const payload = {

        policy_name:
            policyData.policy_name,

        description:
            policyData.description ||
            null,

        effective_from:
            policyData.effective_from,

        effective_to:
            policyData.effective_to ||
            null,

        grace_minutes:
            Number(
                policyData.grace_minutes
            ) || 0,

        allowed_late_occurrences:
            Number(
                policyData.allowed_late_occurrences
            ) || 0,

        deduction_method:
            policyData.deduction_method ||
            "DAILY_RATE",

        deduction_value:
            Number(
                policyData.deduction_value
            ) || 0,

        max_deduction_days:
            Number(
                policyData.max_deduction_days
            ) || 0,

        is_active:
            policyData.is_active !== false,

        remarks:
            policyData.remarks ||
            null,

        updated_at:
            new Date().toISOString()

    };


    const {
        data,
        error
    } = await supabase
        .from(
            "late_deduction_policies"
        )
        .update(
            payload
        )
        .eq(
            "id",
            policyId
        )
        .eq(
            "company_id",
            companyId
        )
        .select()
        .single();


    if (error) {
        throw error;
    }


    return data;

}


/* =========================================
   DEACTIVATE POLICY
========================================= */

export async function deactivateLateDeductionPolicy(
    policyId,
    companyId
) {

    if (!policyId || !companyId) {
        throw new Error(
            "Policy and company are required."
        );
    }


    const {
        data,
        error
    } = await supabase
        .from(
            "late_deduction_policies"
        )
        .update({
            is_active: false,
            updated_at:
                new Date().toISOString()
        })
        .eq(
            "id",
            policyId
        )
        .eq(
            "company_id",
            companyId
        )
        .select()
        .single();


    if (error) {
        throw error;
    }


    return data;

      }
