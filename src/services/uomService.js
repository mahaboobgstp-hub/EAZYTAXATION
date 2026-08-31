import { supabase } from "../supabase/supabaseClient";

async function getCompanyId() {

    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser();

    if (userError) throw userError;

    if (!user) {
        throw new Error("User is not logged in.");
    }

    const { data, error } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

    if (error) throw error;

    if (!data?.company_id) {
        throw new Error("Company is not assigned to this user.");
    }

    return data.company_id;
}


// =====================================================
// GET ALL ACTIVE UNITS
// =====================================================

export async function getUnits() {

    const companyId = await getCompanyId();

    const { data, error } = await supabase
        .from("units")
        .select("*")
        .eq("company_id", companyId)
        .order("unit_name");

    if (error) throw error;

    return data;
}


// =====================================================
// GET ALL UNITS INCLUDING INACTIVE
// =====================================================

export async function getAllUnits() {

    const companyId = await getCompanyId();

    const { data, error } = await supabase
        .from("units")
        .select("*")
        .eq("company_id", companyId)
        .order("unit_name");

    if (error) throw error;

    return data;
}


// =====================================================
// GET UNIT BY ID
// =====================================================

export async function getUnitById(unitId) {

    const companyId = await getCompanyId();

    const { data, error } = await supabase
        .from("units")
        .select("*")
        .eq("id", unitId)
        .eq("company_id", companyId)
        .single();

    if (error) throw error;

    return data;
}


// =====================================================
// CREATE UNIT
// =====================================================

export async function createUnit(data) {

    const companyId = await getCompanyId();

    const unitData = {
        ...data,
        company_id: companyId
    };

    const { error } = await supabase
        .from("units")
        .insert([unitData]);

    if (error) throw error;

    return true;
}


// =====================================================
// UPDATE UNIT
// =====================================================

export async function updateUnit(unitId, data) {

    const companyId = await getCompanyId();

    const { error } = await supabase
        .from("units")
        .update(data)
        .eq("id", unitId)
        .eq("company_id", companyId);

    if (error) throw error;

    return true;
}


// =====================================================
// DEACTIVATE UNIT
// =====================================================

export async function deactivateUnit(unitId) {

    const companyId = await getCompanyId();

    const { error } = await supabase
        .from("units")
        .update({
            is_active: false
        })
        .eq("id", unitId)
        .eq("company_id", companyId);

    if (error) throw error;

    return true;
}


// =====================================================
// ACTIVATE UNIT
// =====================================================

export async function activateUnit(unitId) {

    const companyId = await getCompanyId();

    const { error } = await supabase
        .from("units")
        .update({
            is_active: true
        })
        .eq("id", unitId)
        .eq("company_id", companyId);

    if (error) throw error;

    return true;
}
