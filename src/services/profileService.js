import { supabase } from "../supabase/supabaseClient";

/* ===========================================
   CREATE PROFILE
=========================================== */

export async function createProfile(profile) {

    const { data, error } = await supabase
        .from("profiles")
        .insert([profile])
        .select();

    if (error) throw error;

    return data;

}

/* ===========================================
   GET PROFILE
=========================================== */

export async function getProfile(userId) {

    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

    if (error) throw error;

    return data;

}

/* ===========================================
   UPDATE PROFILE
=========================================== */

export async function updateProfile(

    userId,

    profileData

) {

    const { data, error } = await supabase
        .from("profiles")
        .update(profileData)
        .eq("id", userId)
        .select();

    if (error) throw error;

    return data;

}

/* ===========================================
   DELETE PROFILE
=========================================== */

export async function deleteProfile(userId) {

    const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

    if (error) throw error;

    return true;

}
