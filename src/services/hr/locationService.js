import { supabase } from "../../supabase/supabaseClient";


/* =====================================================
   GET ALL LOCATIONS FOR A COMPANY
===================================================== */

export async function getLocations(companyId) {
    const { data, error } = await supabase
        .from("locations")
        .select("*")
        .eq("company_id", companyId)
        .order("location_name", { ascending: true });

    if (error) throw error;

    return data || [];
}


/* =====================================================
   GET ACTIVE LOCATIONS FOR DROPDOWNS
===================================================== */

export async function getActiveLocations(companyId) {
    const { data, error } = await supabase
        .from("locations")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("location_name", { ascending: true });

    if (error) throw error;

    return data || [];
}


/* =====================================================
   GET SINGLE LOCATION
===================================================== */

export async function getLocationById(
    locationId,
    companyId
) {
    const { data, error } = await supabase
        .from("locations")
        .select("*")
        .eq("id", locationId)
        .eq("company_id", companyId)
        .maybeSingle();

    if (error) throw error;

    return data;
}


/* =====================================================
   CREATE LOCATION
===================================================== */

export async function createLocation(
    locationData,
    companyId
) {
    const { data, error } = await supabase
        .from("locations")
        .insert([
            {
                company_id: companyId,

                location_code:
                    locationData.location_code,

                location_name:
                    locationData.location_name,

                address:
                    locationData.address || null,

                city:
                    locationData.city || null,

                state:
                    locationData.state || null,

                pincode:
                    locationData.pincode || null,

                contact_person:
                    locationData.contact_person || null,

                mobile:
                    locationData.mobile || null,

                is_active:
                    locationData.is_active ?? true
            }
        ])
        .select()
        .single();

    if (error) throw error;

    return data;
}


/* =====================================================
   UPDATE LOCATION
===================================================== */

export async function updateLocation(
    locationId,
    locationData,
    companyId
) {
    const { data, error } = await supabase
        .from("locations")
        .update({
            location_code:
                locationData.location_code,

            location_name:
                locationData.location_name,

            address:
                locationData.address || null,

            city:
                locationData.city || null,

            state:
                locationData.state || null,

            pincode:
                locationData.pincode || null,

            contact_person:
                locationData.contact_person || null,

            mobile:
                locationData.mobile || null,

            is_active:
                locationData.is_active ?? true,

            updated_at:
                new Date().toISOString()
        })
        .eq("id", locationId)
        .eq("company_id", companyId)
        .select()
        .single();

    if (error) throw error;

    return data;
}


/* =====================================================
   DELETE LOCATION
===================================================== */

export async function deleteLocation(
    locationId,
    companyId
) {
    const { data, error } = await supabase
        .from("locations")
        .delete()
        .eq("id", locationId)
        .eq("company_id", companyId)
        .select()
        .single();

    if (error) throw error;

    return data;
}
