import { supabase } from "../supabase/supabaseClient";

export async function createAssetCategory(data) {

    const { error } = await supabase
        .from("asset_categories")
        .insert([data]);

    if (error) throw error;

    return true;
}

export async function getAssetCategories() {

    const { data, error } = await supabase
        .from("asset_categories")
        .select("*")
        .order("category_name");

    if (error) throw error;

    return data;
}
