import { supabase } from "../supabase/supabaseClient";

/* ==========================================
   DROPDOWNS
========================================== */

export async function getVendorsForDropdown() {

    const { data, error } = await supabase
        .from("vendors")
        .select("id, vendor_name, state, address, gstin")
        .order("vendor_name");

    if (error) throw error;

    return data;
}

export async function getCompaniesForDropdown() {

    const { data, error } =
        await supabase
            .from("companies")
            .select("id, company_name, state")
            .order("company_name");

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

/* ==========================================
   PURCHASE INVOICE NUMBER
========================================== */

export async function generatePurchaseInvoiceNumber() {

    const { data, error } = await supabase
        .from("invoice_sequences")
        .select("*")
        .eq("document_type", "PURCHASE")
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
        `PI-${new Date().getFullYear()}-${String(nextNumber).padStart(5, "0")}`;

    return invoiceNumber;
}

/* ==========================================
   SAVE PURCHASE INVOICE
========================================== */

export async function savePurchaseInvoice(
    invoiceHeader,
    invoiceItems
) {

    const {
        data: headerData,
        error: headerError
    } = await supabase
        .from("purchase_invoices")
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

                gst_rate: Number(item.gst_rate),

                amount: Number(item.amount)

            })
        );

    const { error: itemError } =
        await supabase
            .from("purchase_invoice_items")
            .insert(itemsToInsert);

    if (itemError) {
        throw itemError;
    }

    return invoiceId;
}

/* ==========================================
   GET PURCHASE INVOICES
========================================== */

export async function getPurchaseInvoices() {

    const { data, error } =
        await supabase
            .from("purchase_invoices")
            .select("*")
            .eq("is_deleted", false)
            .order("invoice_date", {
                ascending: false
            });

    if (error) throw error;

    return data;
}

/* ==========================================
   GET PURCHASE INVOICE BY ID
========================================== */

export async function getPurchaseInvoiceById(
    invoiceId
) {

    const { data, error } =
        await supabase
            .from("purchase_invoices")
            .select("*")
            .eq("id", invoiceId)
            .single();

    if (error) throw error;

    return data;
}

/* ==========================================
   GET PURCHASE INVOICE ITEMS
========================================== */

export async function getPurchaseInvoiceItems(
    invoiceId
) {

    const { data, error } =
        await supabase
            .from("purchase_invoice_items")
            .select("*")
            .eq("invoice_id", invoiceId)
            .order("line_no");

    if (error) throw error;

    return data;
}

/* ==========================================
   UPDATE PURCHASE INVOICE
========================================== */

export async function updatePurchaseInvoice(
    invoiceId,
    invoiceHeader,
    invoiceItems
) {

    const { error: headerError } =
        await supabase
            .from("purchase_invoices")
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
            .from("purchase_invoice_items")
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
            .from("purchase_invoice_items")
            .insert(itemsToInsert);

    if (itemError) {
        throw itemError;
    }

    return true;
}

/* ==========================================
   DELETE PURCHASE INVOICE
========================================== */

export async function deletePurchaseInvoice(
    invoiceId
) {

    const { error } =
        await supabase
            .from("purchase_invoices")
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
