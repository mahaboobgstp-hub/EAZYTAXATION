import { supabase } from "../supabase/supabaseClient";

/** Company accounting is available only when Accounting is enabled and COA ledgers exist. */
export async function getMasterAccountingSetup(companyId) {
  if (!companyId) return { enabled: false, groups: [], ledgers: [] };
  const [{ data: company, error: companyError }, { data: ledgers, error: ledgerError }, { data: groups, error: groupError }] = await Promise.all([
    supabase.from("companies").select("accounting_enabled,chart_of_accounts_enabled").eq("id", companyId).single(),
    supabase.from("chart_of_accounts").select("id,ledger_name,ledger_code,group_id,parent_ledger_id,ledger_level,is_posting_enabled,is_active").eq("company_id", companyId).eq("is_active", true).order("ledger_name"),
    supabase.from("account_groups").select("id,group_name,group_code,parent_group_id,account_nature,normal_balance,is_active").eq("company_id", companyId).eq("is_active", true).order("group_name")
  ]);
  if (companyError) throw companyError;
  if (ledgerError) throw ledgerError;
  if (groupError) throw groupError;
  const activeLedgers = ledgers || [];
  const enabled = !!company?.accounting_enabled && activeLedgers.length > 0;
  return { enabled, groups: groups || [], ledgers: activeLedgers };
}

export const mainGroupsForMaster=(setup,nature=null)=>(setup?.groups||[]).filter(g=>!g.parent_group_id&&g.is_active!==false&&(!nature||g.account_nature===nature));
export const childGroupsForMaster=(setup,parentId)=>(setup?.groups||[]).filter(g=>g.parent_group_id===parentId&&g.is_active!==false);
export const ledgersForMasterGroup=(setup,groupId)=>(setup?.ledgers||[]).filter(l=>l.group_id===groupId&&l.is_active!==false&&l.is_posting_enabled!==false);
export const mainLedgersForMaster = setup => (setup?.ledgers || []).filter(x => x.ledger_level === "Main Ledger" && x.is_active !== false);
export const intermediateLedgersForMaster = (setup, mainLedgerId) => (setup?.ledgers || []).filter(x => x.ledger_level === "Intermediate Ledger" && x.is_active !== false && x.parent_ledger_id === mainLedgerId);
export const postingLedgersForMaster = (setup, intermediateLedgerId) => (setup?.ledgers || []).filter(x => x.ledger_level === "Subledger" && x.is_active !== false && x.is_posting_enabled !== false && x.parent_ledger_id === intermediateLedgerId);
