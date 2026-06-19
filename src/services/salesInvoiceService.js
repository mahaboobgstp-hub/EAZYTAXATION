import { supabase } from "../supabase/supabaseClient";

export async function getCustomersForDropdown() {

    const { data, error } = await supabase
        .from("customers")
        .select("id, customer_name")
        .order("customer_name");

    if (error) throw error;

    return data;
}

export async function getItemsForDropdown() {

    const { data, error } = await supabase
        .from("items")
        .select("*")
        .order("item_name");

    if (error) throw error;

    return data;
}

export async function saveSalesInvoice(
    invoiceHeader,
    invoiceItems
) {

    const {
        data: headerData,
        error: headerError
    } = await supabase
        .from("sales_invoices")
        .insert([invoiceHeader])
        .select();

    if (headerError) {
        throw headerError;
    }

    const invoiceId =
        headerData[0].id;

    const itemsToInsert =
        invoiceItems.map(
            (item, index) => ({

                invoice_id: invoiceId,

                line_no: index + 1,

                item_id: item.item_id,

                item_name: item.item_name,

                hsn_sac: item.hsn_sac,

                particulars: item.item_name,

                qty: Number(item.qty),

                rate: Number(item.rate),

                gst_rate:
                    Number(item.gst_rate),

                amount:
                    Number(item.amount)

            })
        );

    const { error: itemError } =
        await supabase
            .from("sales_invoice_items")
            .insert(itemsToInsert);

    if (itemError) {
        throw itemError;
    }

    return invoiceId;
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
