import {supabase} from "../supabase/supabaseClient";
export async function createVendor(data,companyId){if(!companyId)throw new Error("Please select a Current Company.");const {error}=await supabase.from("vendors").insert([{...data,company_id:companyId}]);if(error)throw error;return true;}
export async function getVendors(companyId){let q=supabase.from("vendors").select("*").order("vendor_name");if(companyId)q=q.eq("company_id",companyId);const {data,error}=await q;if(error)throw error;return data;}
export async function updateVendor(id,data,companyId){let q=supabase.from("vendors").update(data).eq("id",id);if(companyId)q=q.eq("company_id",companyId);const {error}=await q;if(error)throw error;}
export async function deleteVendor(id,companyId){let q=supabase.from("vendors").delete().eq("id",id);if(companyId)q=q.eq("company_id",companyId);const {error}=await q;if(error)throw error;}
export async function getVendorsForDropdown(companyId){let q=supabase.from("vendors").select("id,vendor_name").order("vendor_name");if(companyId)q=q.eq("company_id",companyId);const {data,error}=await q;if(error)throw error;return data;}
