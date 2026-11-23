import {supabase} from "../supabase/supabaseClient";
export async function createCustomer(data,companyId){
  if(!companyId)throw new Error("Please select a Current Company.");
  const {data:created,error}=await supabase.rpc("create_party_with_ledger",{p_company_id:companyId,p_party_kind:"customer",p_payload:data});
  if(error)throw error;
  return created;
}
export async function getCustomers(companyId){if(!companyId)return[];const {data,error}=await supabase.from("customers").select("*").eq("company_id",companyId).order("customer_name");if(error)throw error;return data;}
export async function getCustomerById(customerId){const {data,error}=await supabase.from("customers").select("*").eq("id",customerId).single();if(error)throw error;return data;}
