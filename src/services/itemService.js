import { supabase } from "../supabase/supabaseClient";

export async function createItem(data) {

    const { error } = await supabase
        .from("items")
        .insert([data]);

    if (error) throw error;

    return true;
}

export async function getItems() {

    const { data, error } = await supabase
        .from("items")
        .select("*")
        .order("item_name");

    if (error) throw error;

    return data;
}
export async function deleteItem(id) {

    const { error } = await supabase
        .from("items")
        .delete()
        .eq("id", id);

    if (error) throw error;

}
