import { supabase } from "../supabase/supabaseClient";


// =========================================================
// GET DELIVERY CHALLANS
// =========================================================

export async function getDeliveryChallans(companyId) {

    if (!companyId) {
        return [];
    }

    const { data, error } = await supabase
        .from("delivery_challans")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_deleted", false)
        .order("challan_date", { ascending: false })
        .order("challan_no", { ascending: false });

    if (error) throw error;

    return data || [];
}


// =========================================================
// GET SINGLE DELIVERY CHALLAN
// =========================================================

export async function getDeliveryChallanById(
    challanId,
    companyId
) {

    if (!challanId || !companyId) {
        throw new Error("Delivery Challan or Company is missing.");
    }

    const { data, error } = await supabase
        .from("delivery_challans")
        .select("*")
        .eq("id", challanId)
        .eq("company_id", companyId)
        .eq("is_deleted", false)
        .single();

    if (error) throw error;

    return data;
}


// =========================================================
// GET DELIVERY CHALLAN ITEMS
// =========================================================

export async function getDeliveryChallanItems(
    challanId,
    companyId
) {

    if (!challanId || !companyId) {
        return [];
    }

    // Verify that the challan belongs to the current company

    const { data: challan, error: challanError } =
        await supabase
            .from("delivery_challans")
            .select("id")
            .eq("id", challanId)
            .eq("company_id", companyId)
            .eq("is_deleted", false)
            .single();

    if (challanError) throw challanError;

    if (!challan) {
        throw new Error(
            "Delivery Challan does not belong to this company."
        );
    }

    const { data, error } = await supabase
        .from("delivery_challan_items")
        .select("*")
        .eq("challan_id", challanId)
        .order("created_at");

    if (error) throw error;

    return data || [];
}


// =========================================================
// SAVE DELIVERY CHALLAN
// =========================================================

export async function saveDeliveryChallan(
    challanData,
    items,
    companyId
) {

    if (!companyId) {
        throw new Error("Please select a Current Company.");
    }

    if (!challanData.challan_no) {
        throw new Error("Delivery Challan number is required.");
    }

    if (!challanData.customer_id) {
        throw new Error("Please select a customer.");
    }

    if (!items || items.length === 0) {
        throw new Error("Please add at least one item.");
    }

    const headerData = {
    company_id: companyId,

    challan_no: challanData.challan_no,
    challan_date: challanData.challan_date,

    customer_id: challanData.customer_id,
    customer_name: challanData.customer_name,

    billing_address: challanData.billing_address,

    shipping_name: challanData.shipping_name,
    shipping_gstin: challanData.shipping_gstin,
    shipping_state: challanData.shipping_state,
    shipping_address: challanData.shipping_address,

    place_of_supply: challanData.place_of_supply,

    vehicle_no: challanData.vehicle_no,
    eway_bill_no: challanData.eway_bill_no,

    remarks: challanData.remarks,

    taxable_value: Number(challanData.taxable_value) || 0,
    cgst: Number(challanData.cgst) || 0,
    sgst: Number(challanData.sgst) || 0,
    igst: Number(challanData.igst) || 0,
    total_amount: Number(challanData.total_amount) || 0,

    status: challanData.status || "Draft"
};

    // -----------------------------------------------------
    // SAVE HEADER
    // -----------------------------------------------------

    const { data: challan, error: challanError } =
        await supabase
            .from("delivery_challans")
            .insert([headerData])
            .select()
            .single();

    if (challanError) throw challanError;


    // -----------------------------------------------------
    // SAVE ITEMS
    // -----------------------------------------------------

    const itemData = items
        .filter(item => item.item_id)
        .map(item => ({
            challan_id: challan.id,

            item_id: item.item_id,

            item_name: item.item_name,
            hsn_sac: item.hsn_sac,
            unit: item.unit,

            gst_rate: Number(item.gst_rate) || 0,

            qty: Number(item.qty) || 0,
            rate: Number(item.rate) || 0,
            amount: Number(item.amount) || 0
        }));


    if (itemData.length > 0) {

        const { error: itemsError } =
            await supabase
                .from("delivery_challan_items")
                .insert(itemData);

        if (itemsError) {

            // Remove header if item insertion fails

            await supabase
                .from("delivery_challans")
                .delete()
                .eq("id", challan.id)
                .eq("company_id", companyId);

            throw itemsError;
        }
    }

    return challan.id;
}


// =========================================================
// UPDATE DELIVERY CHALLAN
// =========================================================

export async function updateDeliveryChallan(
    challanId,
    challanData,
    items,
    companyId
) {

    if (!companyId) {
        throw new Error("Please select a Current Company.");
    }

    if (!challanId) {
        throw new Error("Delivery Challan ID is missing.");
    }


    // -----------------------------------------------------
    // UPDATE HEADER
    // -----------------------------------------------------

   const { data: challan, error: challanError } =
    await supabase
        .from("delivery_challans")
        .update({
            company_id: companyId,

            challan_no: challanData.challan_no,
            challan_date: challanData.challan_date,

            customer_id: challanData.customer_id,
            customer_name: challanData.customer_name,

            billing_address: challanData.billing_address,

            shipping_name: challanData.shipping_name,
            shipping_gstin: challanData.shipping_gstin,
            shipping_state: challanData.shipping_state,
            shipping_address: challanData.shipping_address,

            place_of_supply: challanData.place_of_supply,

            vehicle_no: challanData.vehicle_no,
            eway_bill_no: challanData.eway_bill_no,

            remarks: challanData.remarks,

            taxable_value:
                Number(challanData.taxable_value) || 0,

            cgst:
                Number(challanData.cgst) || 0,

            sgst:
                Number(challanData.sgst) || 0,

            igst:
                Number(challanData.igst) || 0,

            total_amount:
                Number(challanData.total_amount) || 0,

            status:
                challanData.status || "Draft"
        }) 
       .eq("id", challanId)
            .eq("company_id", companyId)
            .eq("is_deleted", false)
            .select()
            .single();

    if (challanError) throw challanError;


    // -----------------------------------------------------
    // DELETE OLD ITEMS
    // -----------------------------------------------------

    const { error: deleteError } =
        await supabase
            .from("delivery_challan_items")
            .delete()
            .eq("challan_id", challanId);

    if (deleteError) throw deleteError;


    // -----------------------------------------------------
    // INSERT NEW ITEMS
    // -----------------------------------------------------

    const itemData = items
        .filter(item => item.item_id)
        .map(item => ({
            challan_id: challanId,

            item_id: item.item_id,

            item_name: item.item_name,
            hsn_sac: item.hsn_sac,
            unit: item.unit,

            gst_rate: Number(item.gst_rate) || 0,

            qty: Number(item.qty) || 0,
            rate: Number(item.rate) || 0,
            amount: Number(item.amount) || 0
        }));


    if (itemData.length > 0) {

        const { error: itemsError } =
            await supabase
                .from("delivery_challan_items")
                .insert(itemData);

        if (itemsError) throw itemsError;
    }

    return challan;
}


// =========================================================
// DELETE DELIVERY CHALLAN
// =========================================================

export async function deleteDeliveryChallan(
    challanId,
    companyId
) {

    if (!companyId) {
        throw new Error("Please select a Current Company.");
    }

    const { error } = await supabase
        .from("delivery_challans")
        .update({
            is_deleted: true
        })
        .eq("id", challanId)
        .eq("company_id", companyId);

    if (error) throw error;

    return true;
}
