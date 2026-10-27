
import { supabase } from "../../supabase/supabaseClient";

// List holidays for one company.
export async function getHolidays(companyId, year) {
    if (!companyId) {
        throw new Error("Please select a company.");
    }

    let query = supabase
        .from("holiday_master")
        .select("*")
        .eq("company_id", companyId)
        .order("holiday_date", { ascending: true });

    if (year !== undefined && year !== null && year !== "") {
        const numericYear = Number(year);

        if (!Number.isInteger(numericYear)) {
            throw new Error("A valid holiday year is required.");
        }

        query = query
            .gte("holiday_date", `${numericYear}-01-01`)
            .lte("holiday_date", `${numericYear}-12-31`);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
}

// Retrieve a holiday by ID within the selected company.
export async function getHolidayById(holidayId, companyId) {
    if (!holidayId || !companyId) {
        throw new Error("Holiday and company are required.");
    }

    const { data, error } = await supabase
        .from("holiday_master")
        .select("*")
        .eq("id", holidayId)
        .eq("company_id", companyId)
        .maybeSingle();

    if (error) throw error;

    return data;
}

// Create a holiday using existing holiday_master columns.
export async function createHoliday(holidayData, companyId) {
    if (!companyId) {
        throw new Error("Please select a company.");
    }

    if (!holidayData?.holiday_name || !holidayData?.holiday_date) {
        throw new Error("Holiday name and date are required.");
    }

    const payload = {
        ...holidayData,
        company_id: companyId,
    };

    delete payload.id;

    const { data, error } = await supabase
        .from("holiday_master")
        .insert(payload)
        .select()
        .single();

    if (error) throw error;

    return data;
}

// Update a holiday without allowing its company to be changed.
export async function updateHoliday(
    holidayId,
    holidayData,
    companyId
) {
    if (!holidayId || !companyId) {
        throw new Error("Holiday and company are required.");
    }

    const payload = { ...holidayData };

    delete payload.id;
    delete payload.company_id;

    const { data, error } = await supabase
        .from("holiday_master")
        .update({
            ...payload,
            updated_at: new Date().toISOString(),
        })
        .eq("id", holidayId)
        .eq("company_id", companyId)
        .select()
        .single();

    if (error) throw error;

    return data;
}

// Deactivate instead of deleting historical holiday records.
export async function deactivateHoliday(holidayId, companyId) {
    if (!holidayId || !companyId) {
        throw new Error("Holiday and company are required.");
    }

    const { data, error } = await supabase
        .from("holiday_master")
        .update({
            is_active: false,
            updated_at: new Date().toISOString(),
        })
        .eq("id", holidayId)
        .eq("company_id", companyId)
        .select()
        .single();

    if (error) throw error;

    return data;
}
