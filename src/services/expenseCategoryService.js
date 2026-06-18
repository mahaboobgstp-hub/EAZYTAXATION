import { supabase } from "../supabase/supabaseClient";

export async function createExpenseCategory(data) {

    const { error } = await supabase
        .from("expense_categories")
        .insert([data]);

    if (error) throw error;

    return true;
}

export async function getExpenseCategories() {

    const { data, error } = await supabase
        .from("expense_categories")
        .select("*")
        .order("category_name");

    if (error) throw error;

    return data;
}
