import { supabase } from "../supabase/supabaseClient";

export async function getSandboxEwayBillStatus(companyId, invoiceId) {
  if (!companyId || !invoiceId) return [];
  const { data, error } = await supabase.functions.invoke("ewaybill-sandbox", {
    body: { action: "get_status", company_id: companyId, invoice_id: invoiceId },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.message || data.error);
  return data?.records || [];
}

export async function getSandboxEwayBillHealth(companyId) {
  if (!companyId) throw new Error("Select a company.");
  const { data, error } = await supabase.functions.invoke("ewaybill-sandbox", {
    body: { action: "sandbox_health", company_id: companyId },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.message || data.error);
  return data;
}

// Generation/cancellation calls intentionally remain unavailable until PeriOne's
// sandbox API contract, auth flow, and payloads have been verified.
