import { supabase } from "../supabase/supabaseClient";

export async function getStates() {

    const { data, error } = await supabase
        .from("states")
        .select("*")
        .order("state_name");

    if (error) throw error;

    return data;
}
