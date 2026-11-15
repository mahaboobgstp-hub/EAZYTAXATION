import { supabase } from "../supabase/supabaseClient";

/**
 * Client-side facade for the SYD bank-feed Edge Function.
 * Provider credentials are never sent from this module.
 */
export async function getBankFeedStatus(companyId) {
  if (!companyId) throw new Error("Select a company first.");
  const { data, error } = await supabase.functions.invoke("finbox-bank-connect", {
    body: { action: "get_status", company_id: companyId }
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.message || data.error);
  return data;
}

export async function checkFinBoxReadiness(companyId) {
  if (!companyId) throw new Error("Select a company first.");
  const { data, error } = await supabase.functions.invoke("finbox-bank-connect", {
    body: { action: "provider_health", company_id: companyId }
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.message || data.error);
  return data;
}

/**
 * This becomes the consent-session call after FinBox supplies its current
 * API contract, sandbox credentials, and redirect/callback requirements.
 */
export async function startFinBoxConnection({ companyId, bankAccountId }) {
  if (!companyId || !bankAccountId) {
    throw new Error("Select a company and bank account first.");
  }
  const { data, error } = await supabase.functions.invoke("finbox-bank-connect", {
    body: {
      action: "start_connection",
      company_id: companyId,
      bank_account_id: bankAccountId
    }
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.message || data.error);
  return data;
}
