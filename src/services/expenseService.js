import { supabase } from "../supabase/supabaseClient";

/* ===========================================
   GENERATE EXPENSE VOUCHER NUMBER
=========================================== */

export async function generateExpenseNumber() {

    const { data, error } = await supabase
        .from("document_sequences")
        .select("*")
        .eq("document_type", "EXPENSE")
        .single();

    if (error) throw error;

    const nextNumber =
        Number(data.last_number) + 1;

    const prefix =
        data.prefix || "EXP";

    const voucherNumber =
        `${prefix}-${new Date().getFullYear()}-${String(nextNumber).padStart(5, "0")}`;

    return voucherNumber;

}

/* ===========================================
   SAVE EXPENSE
=========================================== */

export async function saveExpense(expense) {

    const { data, error } = await supabase
        .from("expenses")
        .insert([expense])
        .select();

    if (error) throw error;

    /* Increase sequence only AFTER successful save */

    const { data: sequence } = await supabase
        .from("document_sequences")
        .select("*")
        .eq("document_type", "EXPENSE")
        .single();

    await supabase
        .from("document_sequences")
        .update({

            last_number:
                Number(sequence.last_number) + 1

        })
        .eq("id", sequence.id);

    return data;

}

/* ===========================================
   GET ALL EXPENSES
=========================================== */

export async function getExpenses() {

    const { data, error } = await supabase
        .from("expenses")
        .select(`
            *,
            companies(company_name),
            vendors(vendor_name),
            expense_categories(category_name)
        `)
        .order("expense_date", {

            ascending: false

        });

    if (error) throw error;

    return data;

}

/* ===========================================
   GET SINGLE EXPENSE
=========================================== */

export async function getExpenseById(id) {

    const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("id", id)
        .single();

    if (error) throw error;

    return data;

}

/* ===========================================
   UPDATE EXPENSE
=========================================== */

export async function updateExpense(

    id,

    expense

) {

    const { error } = await supabase
        .from("expenses")
        .update({

            ...expense,

            updated_at:
                new Date()

        })
        .eq("id", id);

    if (error) throw error;

    return true;

}

/* ===========================================
   DELETE EXPENSE
=========================================== */

export async function deleteExpense(id) {

    const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", id);

    if (error) throw error;

    return true;

}
