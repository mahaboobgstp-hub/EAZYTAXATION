import { supabase } from "../../supabase/supabaseClient";


/* =========================================================
   GET STATUTORY SETTINGS
========================================================= */

export async function getStatutorySettings(companyId) {

    if (!companyId) {
        return null;
    }

    const { data, error } = await supabase
        .from("company_statutory_settings")
        .select("*")
        .eq("company_id", companyId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data;
}


/* =========================================================
   CREATE STATUTORY SETTINGS
========================================================= */

export async function createStatutorySettings(
    settingsData,
    companyId
) {

    if (!companyId) {
        throw new Error("Company is required.");
    }

    const payload = {
        ...settingsData,
        company_id: companyId
    };

    const { data, error } = await supabase
        .from("company_statutory_settings")
        .insert([payload])
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}


/* =========================================================
   UPDATE STATUTORY SETTINGS
========================================================= */

export async function updateStatutorySettings(
    settingsId,
    settingsData,
    companyId
) {

    if (!settingsId || !companyId) {
        throw new Error(
            "Statutory settings ID and company are required."
        );
    }

    const { data, error } = await supabase
        .from("company_statutory_settings")
        .update(settingsData)
        .eq("id", settingsId)
        .eq("company_id", companyId)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}


/* =========================================================
   SAVE STATUTORY SETTINGS
   CREATE OR UPDATE
========================================================= */

export async function saveStatutorySettings(
    settingsData,
    companyId
) {

    if (!companyId) {
        throw new Error("Company is required.");
    }

    const existing =
        await getStatutorySettings(companyId);


    if (existing) {

        return await updateStatutorySettings(
            existing.id,
            settingsData,
            companyId
        );

    }


    return await createStatutorySettings(
        settingsData,
        companyId
    );
}


/* =========================================================
   GET PT REGISTRATIONS
========================================================= */

export async function getPTRegistrations(companyId) {

    if (!companyId) {
        return [];
    }

    const { data, error } = await supabase
        .from("company_pt_registrations")
        .select(`
            *,
            states (
                id,
                state_name
            )
        `)
        .eq("company_id", companyId)
        .order("created_at", {
            ascending: true
        });

    if (error) {
        throw error;
    }

    return data || [];
}


/* =========================================================
   CREATE PT REGISTRATION
========================================================= */

export async function createPTRegistration(
    registrationData,
    companyId
) {

    if (!companyId) {
        throw new Error("Company is required.");
    }

    const payload = {
        ...registrationData,
        company_id: companyId
    };

    const { data, error } = await supabase
        .from("company_pt_registrations")
        .insert([payload])
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}


/* =========================================================
   UPDATE PT REGISTRATION
========================================================= */

export async function updatePTRegistration(
    registrationId,
    registrationData,
    companyId
) {

    if (!registrationId || !companyId) {
        throw new Error(
            "PT registration ID and company are required."
        );
    }

    const { data, error } = await supabase
        .from("company_pt_registrations")
        .update(registrationData)
        .eq("id", registrationId)
        .eq("company_id", companyId)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}


/* =========================================================
   DEACTIVATE PT REGISTRATION
========================================================= */

export async function deactivatePTRegistration(
    registrationId,
    companyId
) {

    if (!registrationId || !companyId) {
        throw new Error(
            "PT registration ID and company are required."
        );
    }

    const { data, error } = await supabase
        .from("company_pt_registrations")
        .update({
            is_active: false
        })
        .eq("id", registrationId)
        .eq("company_id", companyId)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}
