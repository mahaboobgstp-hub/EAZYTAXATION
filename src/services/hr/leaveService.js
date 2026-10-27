
import { supabase } from "../../supabase/supabaseClient";

// Fetch leave records for the selected company.
// Optional filters use the existing leave_master table.
export async function getLeaveRecords(companyId) {
    if (!companyId) {
        throw new Error("Please select a company.");
    }

    const { data, error } = await supabase
        .from("leave_master")
        .select("*")
        .eq("company_id", companyId);

    if (error) throw error;

    return data || [];
}

// Fetch one leave record within the selected company.
export async function getLeaveRecordById(leaveId, companyId) {
    if (!leaveId || !companyId) {
        throw new Error("Leave record and company are required.");
    }

    const { data, error } = await supabase
        .from("leave_master")
        .select("*")
        .eq("id", leaveId)
        .eq("company_id", companyId)
        .maybeSingle();

    if (error) throw error;

    return data;
}

// Create a leave record.
// Pass only fields that exist in leave_master.
export async function createLeaveRecord(leaveData, companyId) {
    if (!companyId) {
        throw new Error("Please select a company.");
    }

    if (!leaveData || typeof leaveData !== "object") {
        throw new Error("Valid leave data is required.");
    }

    const payload = {
        ...leaveData,
        company_id: companyId,
    };

    // Never allow the caller to supply a different record ID.
    delete payload.id;

    const { data, error } = await supabase
        .from("leave_master")
        .insert(payload)
        .select()
        .single();

    if (error) throw error;

    return data;
}

// Update a leave record, constrained by both record and company.
export async function updateLeaveRecord(
    leaveId,
    leaveData,
    companyId
) {
    if (!leaveId || !companyId) {
        throw new Error("Leave record and company are required.");
    }

    const payload = { ...leaveData };

    // Company ownership and record identity cannot be changed here.
    delete payload.id;
    delete payload.company_id;

    const { data, error } = await supabase
        .from("leave_master")
        .update({
            ...payload,
            updated_at: new Date().toISOString(),
        })
        .eq("id", leaveId)
        .eq("company_id", companyId)
        .select()
        .single();

    if (error) throw error;

    return data;
}

// Delete only within the selected company.
export async function deleteLeaveRecord(leaveId, companyId) {
    if (!leaveId || !companyId) {
        throw new Error("Leave record and company are required.");
    }

    const { data, error } = await supabase
        .from("leave_master")
        .delete()
        .eq("id", leaveId)
        .eq("company_id", companyId)
        .select()
        .single();

    if (error) throw error;

    return data;
}

