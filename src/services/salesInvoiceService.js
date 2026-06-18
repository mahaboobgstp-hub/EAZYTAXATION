import { supabase } from "../supabase/supabaseClient";

export async function getCustomersForDropdown() {

    const { data, error } = await supabase
        .from("customers")
        .select("id, customer_name")
        .order("customer_name");

    if (error) throw error;

    return data;
}

export async function saveSalesInvoice(invoiceData) {

    const { data, error } = await supabase
        .from("sales_invoices")
        .insert([invoiceData])
        .select();

    if (error) throw error;

    return data[0];
}

export async function getSalesInvoices() {

    const { data, error } = await supabase
        .from("sales_invoices")
        .select("*")
        .order("invoice_date", {
            ascending: false
        });

    if (error) throw error;

    return data;
}
