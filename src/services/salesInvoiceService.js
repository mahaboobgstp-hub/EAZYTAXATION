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

export async function generateInvoiceNumber() {

    const { data, error } = await supabase
        .from("invoice_sequences")
        .select("*")
        .eq("document_type", "SALES")
        .single();

    if (error) throw error;

    const nextNumber =
        Number(data.last_number) + 1;

    await supabase
        .from("invoice_sequences")
        .update({
            last_number: nextNumber
        })
        .eq("id", data.id);

    const invoiceNumber =
        `ET-${new Date().getFullYear()}-${String(nextNumber).padStart(5, '0')}`;

    return invoiceNumber;
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
        .eq("is_deleted", false)
        .order("invoice_date", {
            ascending: false
        });

    if (error) throw error;

    return data;
}
export async function getSalesInvoiceById(
    invoiceId
) {

    const { data, error } =
        await supabase
            .from("sales_invoices")
            .select("*")
            .eq("id", invoiceId)
            .single();

    if (error) throw error;

    return data;
}

export async function getSalesInvoiceItems(
    invoiceId
) {

    const { data, error } =
        await supabase
            .from("sales_invoice_items")
            .select("*")
            .eq("invoice_id", invoiceId)
            .order("line_no");

    if (error) throw error;

    return data;
}
export async function updateSalesInvoice(
    invoiceId,
    invoiceHeader,
    invoiceItems
) {

    const { error: headerError } =
        await supabase
            .from("sales_invoices")
            .update({
                ...invoiceHeader,
                updated_at: new Date()
            })
            .eq("id", invoiceId);

    if (headerError) {
        throw headerError;
    }

    const { error: deleteError } =
        await supabase
            .from("sales_invoice_items")
            .delete()
            .eq("invoice_id", invoiceId);

    if (deleteError) {
        throw deleteError;
    }

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

                gst_rate: Number(item.gst_rate),

                amount: Number(item.amount),

                updated_at: new Date()
            })
        );

    const { error: itemError } =
        await supabase
            .from("sales_invoice_items")
            .insert(itemsToInsert);

    if (itemError) {
        throw itemError;
    }

    return true;
}

export async function deleteSalesInvoice(
    invoiceId
) {

    const { error } =
        await supabase
            .from("sales_invoices")
            .update({
                is_deleted: true,
                updated_at: new Date()
            })
            .eq("id", invoiceId);

    if (error) {
        throw error;
    }

    return true;
}

