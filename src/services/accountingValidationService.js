import { supabase } from "../supabase/supabaseClient";

const money = value => Math.round((Number(value) || 0) * 100) / 100;

export async function validateAccountingIntegrity(companyId) {
  if (!companyId) throw new Error("Select a company before validating accounting data.");
  const [vouchers, lines, purchases, sales, bank] = await Promise.all([
    supabase.from("accounting_vouchers").select("id,voucher_type,voucher_date,status,total_debit,total_credit,source_module,source_record_id").eq("company_id", companyId),
    supabase.from("accounting_voucher_lines").select("voucher_id,ledger_id,debit,credit").eq("company_id", companyId),
    supabase.from("purchase_invoices").select("id,invoice_no,accounting_status,accounting_voucher_id,purchase_ledger_id").eq("company_id", companyId).eq("is_deleted", false),
    supabase.from("sales_invoices").select("id,invoice_no,accounting_status,accounting_voucher_id,sales_ledger_id").eq("company_id", companyId).eq("is_deleted", false),
    supabase.from("bank_statement_lines").select("id,match_status,matched_voucher_id,classification_status,ledger_id").eq("company_id", companyId)
  ]);
  for (const result of [vouchers, lines, purchases, sales, bank]) if (result.error) throw result.error;
  const voucherRows = vouchers.data || [], lineRows = lines.data || [];
  const sums = new Map();
  for (const line of lineRows) {
    const current = sums.get(line.voucher_id) || { debit: 0, credit: 0, lineCount: 0 };
    current.debit += money(line.debit); current.credit += money(line.credit); current.lineCount += 1;
    sums.set(line.voucher_id, current);
  }
  const imbalance = voucherRows.map(v => {
    const total = sums.get(v.id) || { debit: 0, credit: 0, lineCount: 0 };
    return { ...v, lineDebit: money(total.debit), lineCredit: money(total.credit), lineCount: total.lineCount, difference: money(total.debit-total.credit) };
  }).filter(v => v.lineCount < 2 || Math.abs(v.difference) > 0.01 || Math.abs(money(v.total_debit)-v.lineDebit)>0.01 || Math.abs(money(v.total_credit)-v.lineCredit)>0.01);
  const missingPurchases=(purchases.data||[]).filter(p=>p.accounting_status!=="Posted"||!p.accounting_voucher_id);
  const missingSales=(sales.data||[]).filter(s=>s.accounting_status!=="Posted"||!s.accounting_voucher_id);
  const unpostedBank=(bank.data||[]).filter(b=>b.match_status!=="Matched"||!b.matched_voucher_id);
  return {
    companyId,
    voucherCount:voucherRows.length,
    postedVoucherCount:voucherRows.filter(v=>v.status==="Posted").length,
    voucherLineCount:lineRows.length,
    imbalanceCount:imbalance.length,
    imbalanceDetails:imbalance,
    unpostedPurchaseCount:missingPurchases.length,
    unpostedSalesCount:missingSales.length,
    unpostedBankLineCount:unpostedBank.length,
    unclassifiedPurchaseCount:(purchases.data||[]).filter(p=>!p.purchase_ledger_id).length,
    unclassifiedSalesCount:(sales.data||[]).filter(s=>!s.sales_ledger_id).length,
    bankWithoutCounterpartCount:(bank.data||[]).filter(b=>!b.ledger_id).length,
    balanced:imbalance.length===0
  };
}
