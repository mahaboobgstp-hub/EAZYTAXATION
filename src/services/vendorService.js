import {supabase} from "../supabase/supabaseClient";
export async function createVendor(data,companyId){
  if(!companyId)throw new Error("Please select a Current Company.");
  const {data:created,error}=await supabase.rpc("create_party_with_ledger",{p_company_id:companyId,p_party_kind:"vendor",p_payload:data});
  if(error)throw error;
  return created;
}
export async function getVendors(companyId){let q=supabase.from("vendors").select("*").order("vendor_name");if(companyId)q=q.eq("company_id",companyId);const {data,error}=await q;if(error)throw error;return data;}
export async function updateVendor(id,data,companyId){const {main_ledger_id,intermediate_ledger_id,...masterData}=data;let q=supabase.from("vendors").update(masterData).eq("id",id).eq("company_id",companyId);const {error}=await q;if(error)throw error;}
export async function deleteVendor(id,companyId){let q=supabase.from("vendors").delete().eq("id",id);if(companyId)q=q.eq("company_id",companyId);const {error}=await q;if(error)throw error;}
export async function getVendorsForDropdown(companyId){let q=supabase.from("vendors").select("id,vendor_name").order("vendor_name");if(companyId)q=q.eq("company_id",companyId);const {data,error}=await q;if(error)throw error;return data;}
