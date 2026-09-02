import { supabase } from "../supabase/supabaseClient";


// =====================================================
// GET ALL ACTIVE UNITS
// =====================================================

export async function getUnits() {

    const { data, error } = await supabase
        .from("units")
        .select("*")
        .eq("is_active", true)
        .order("unit_name");

    if (error) throw error;

    return data;
}


// =====================================================
// GET ALL UNITS INCLUDING INACTIVE
// =====================================================

export async function getAllUnits() {

    const { data, error } = await supabase
        .from("units")
        .select("*")
        .order("unit_name");

    if (error) throw error;

    return data;
}


// =====================================================
// GET UNIT BY ID
// =====================================================

export async function getUnitById(unitId) {

    const { data, error } = await supabase
        .from("units")
        .select("*")
        .eq("id", unitId)
        .single();

    if (error) throw error;

    return data;
}


// =====================================================
// CREATE UNIT
// =====================================================

export async function createUnit(data) {

    const { error } = await supabase
        .from("units")
        .insert([data]);

    if (error) throw error;

    return true;
}


// =====================================================
// UPDATE UNIT
// =====================================================

export async function updateUnit(unitId, data) {

    const { error } = await supabase
        .from("units")
        .update(data)
        .eq("id", unitId);

    if (error) throw error;

    return true;
}


// =====================================================
// DEACTIVATE UNIT
// =====================================================

export async function deactivateUnit(unitId) {

    const { error } = await supabase
        .from("units")
        .update({
            is_active: false
        })
        .eq("id", unitId);

    if (error) throw error;

    return true;
}


// =====================================================
// ACTIVATE UNIT
// =====================================================

export async function activateUnit(unitId) {

    const { error } = await supabase
        .from("units")
        .update({
            is_active: true
        })
        .eq("id", unitId);

    if (error) throw error;

    return true;
}
