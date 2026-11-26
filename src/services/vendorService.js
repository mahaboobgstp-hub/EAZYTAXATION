import {supabase} from "../supabase/supabaseClient";

// Only send fields that actually exist in the public.vendors table.
// Customer-only fields (notably customer_code) must never be sent to vendor operations.
const VENDOR_FIELDS = [
  "vendor_name","legal_name","vendor_code","vendor_type","vendor_group","constitution",
  "gst_registration_type","gstin","pan","gst_registered","place_of_supply","composition_scheme",
  "reverse_charge_applicable","tds_applicable","tcs_applicable","e_invoice_applicable",
  "opening_balance","opening_balance_type","credit_limit","credit_period_days","payment_terms",
  "default_purchase_ledger","default_payment_mode","billing_address_line1","billing_address_line2",
  "billing_city","billing_state","billing_pin","billing_country","shipping_same_as_billing",
  "shipping_address_line1","shipping_address_line2","shipping_city","shipping_state","shipping_pin",
  "shipping_country","contact_person","designation","mobile","alternate_mobile","email","website",
  "bank_account_holder","bank_name","bank_account_number","bank_ifsc","bank_branch","bank_account_type",
  "msme_udyam_number","vendor_category","remarks","address","state","is_active"
];

function sanitizeVendorPayload(data={}) {
  return Object.fromEntries(VENDOR_FIELDS.filter(key => Object.prototype.hasOwnProperty.call(data,key)).map(key => [key,data[key]]));
}

export async function createVendor(data,companyId){
  if(!companyId)throw new Error("Please select a Current Company.");
  const payload=sanitizeVendorPayload(data);
  const {data:created,error}=await supabase.rpc("create_party_with_ledger",{p_company_id:companyId,p_party_kind:"vendor",p_payload:payload});
  if(error)throw error;
  return created;
}
export async function getVendors(companyId){let q=supabase.from("vendors").select("*").order("vendor_name");if(companyId)q=q.eq("company_id",companyId);const {data,error}=await q;if(error)throw error;return data;}
export async function updateVendor(id,data,companyId){let q=supabase.from("vendors").update(sanitizeVendorPayload(data)).eq("id",id);if(companyId)q=q.eq("company_id",companyId);const {error}=await q;if(error)throw error;}
export async function deleteVendor(id,companyId){let q=supabase.from("vendors").delete().eq("id",id);if(companyId)q=q.eq("company_id",companyId);const {error}=await q;if(error)throw error;}
export async function getVendorsForDropdown(companyId){let q=supabase.from("vendors").select("id,vendor_name").order("vendor_name");if(companyId)q=q.eq("company_id",companyId);const {data,error}=await q;if(error)throw error;return data;}
