import { supabase } from "../supabase/supabaseClient";

const scoped = (query, companyId) => companyId ? query.eq("company_id", companyId) : query;

export async function getVendorsForDropdown(companyId) {
  let query = supabase.from("vendors").select("id,vendor_name,state,address,gstin,company_id").order("vendor_name");
  const { data, error } = await scoped(query, companyId);
  if (error) throw error;
  return data || [];
}

export async function getCompaniesForDropdown() {
  const { data, error } = await supabase.from("companies").select("id,company_name,state").order("company_name");
  if (error) throw error;
  return data || [];
}

export async function getItemsForDropdown(companyId) {
  let query = supabase.from("items").select("*").order("item_name");
  const { data, error } = await scoped(query, companyId);
  if (error) throw error;
  return data || [];
}

export async function generatePurchaseInvoiceNumber(companyId) {
  let query = supabase.from("invoice_sequences").select("*").eq("document_type","PURCHASE");
  if(companyId) query=query.eq("company_id",companyId);
  const { data, error } = await query.maybeSingle();
  if(error) throw error;
  if(!data) {
    const { count, error: countError } = await supabase.from("purchase_invoices").select("id",{count:"exact",head:true}).eq("company_id",companyId).eq("is_deleted",false);
    if(countError) throw countError;
    return `PI-${new Date().getFullYear()}-${String((count||0)+1).padStart(5,"0")}`;
  }
  const nextNumber = Number(data.last_number)+1;
  const { error: updateError } = await supabase.from("invoice_sequences").update({last_number:nextNumber}).eq("id",data.id);
  if(updateError) throw updateError;
  return `PI-${new Date().getFullYear()}-${String(nextNumber).padStart(5,"0")}`;
}

const normalizeItems = (invoiceId, invoiceItems) => invoiceItems.map((item,index)=>({
  invoice_id:invoiceId,line_no:index+1,item_id:item.item_id||null,item_name:item.item_name,hsn_sac:item.hsn_sac||"",uom:item.uom||"",
  qty:Number(item.qty)||0,rate:Number(item.rate)||0,gross_amount:Number(item.gross_amount)||0,
  discount_percent:Number(item.discount_percent)||0,discount_amount:Number(item.discount_amount)||0,
  taxable_value:Number(item.taxable_value)||0,gst_rate:Number(item.gst_rate)||0,
  cgst_amount:Number(item.cgst_amount)||0,sgst_amount:Number(item.sgst_amount)||0,igst_amount:Number(item.igst_amount)||0,
  line_total:Number(item.line_total)||0,remarks:item.remarks||""
}));

export async function savePurchaseInvoice(invoiceHeader, invoiceItems) {
  const {data:headerData,error:headerError}=await supabase.from("purchase_invoices").insert([invoiceHeader]).select("id").single();
  if(headerError) throw headerError;
  const invoiceId=headerData.id;
  const {error:itemError}=await supabase.from("purchase_invoice_items").insert(normalizeItems(invoiceId,invoiceItems));
  if(itemError) {
    await supabase.from("purchase_invoices").delete().eq("id",invoiceId);
    throw itemError;
  }
  return invoiceId;
}

export async function getPurchaseInvoices(companyId) {
  let query=supabase.from("purchase_invoices").select("*").eq("is_deleted",false).order("invoice_date",{ascending:false});
  const {data,error}=await scoped(query,companyId);if(error)throw error;return data||[];
}

export async function getPurchaseInvoiceById(invoiceId,companyId) {
  let query=supabase.from("purchase_invoices").select("*").eq("id",invoiceId).eq("is_deleted",false);
  const {data,error}=await scoped(query,companyId).single();if(error)throw error;return data;
}

export async function getPurchaseInvoiceItems(invoiceId,companyId) {
  if(companyId) {
    const {data:parent,error:parentError}=await supabase.from("purchase_invoices").select("id").eq("id",invoiceId).eq("company_id",companyId).eq("is_deleted",false).single();
    if(parentError) throw parentError;
  }
  const {data,error}=await supabase.from("purchase_invoice_items").select("*").eq("invoice_id",invoiceId).order("line_no");
  if(error)throw error;return data||[];
}

export async function updatePurchaseInvoice(invoiceId,invoiceHeader,invoiceItems,companyId) {
  let update=supabase.from("purchase_invoices").update({...invoiceHeader,updated_at:new Date().toISOString()}).eq("id",invoiceId);
  update=scoped(update,companyId);
  const {error:headerError}=await update;if(headerError)throw headerError;
  const {error:deleteError}=await supabase.from("purchase_invoice_items").delete().eq("invoice_id",invoiceId);
  if(deleteError)throw deleteError;
  const {error:itemError}=await supabase.from("purchase_invoice_items").insert(normalizeItems(invoiceId,invoiceItems));
  if(itemError)throw itemError;
  return true;
}

export async function deletePurchaseInvoice(invoiceId,companyId) {
  let query=supabase.from("purchase_invoices").update({is_deleted:true,updated_at:new Date().toISOString()}).eq("id",invoiceId);
  query=scoped(query,companyId);
  const {error}=await query;if(error)throw error;return true;
}
