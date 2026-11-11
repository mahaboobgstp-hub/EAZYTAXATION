import { supabase } from "../supabase/supabaseClient";

const requireCompany = (companyId) => {
  if (!companyId) throw new Error("Please select a company before using Accounting.");
  return companyId;
};

export async function getAccountingData(companyId) {
  const id = requireCompany(companyId);
  const [groups, ledgers, vouchers, lines] = await Promise.all([
    supabase.from("account_groups").select("*").eq("company_id", id).order("group_name"),
    supabase.from("chart_of_accounts").select("*").eq("company_id", id).order("ledger_name"),
    supabase.from("accounting_vouchers").select("*").eq("company_id", id).order("voucher_date", { ascending: false }),
    supabase.from("accounting_voucher_lines").select("*").eq("company_id", id)
  ]);
  for (const result of [groups, ledgers, vouchers, lines]) {
    if (result.error) throw result.error;
  }
  return {
    groups: groups.data || [],
    ledgers: ledgers.data || [],
    vouchers: vouchers.data || [],
    lines: lines.data || []
  };
}

export async function createAccountGroup(companyId, values) {
  const id = requireCompany(companyId);
  const { data, error } = await supabase.from("account_groups")
    .insert([{ ...values, company_id: id }]).select().single();
  if (error) throw error;
  return data;
}

export async function createLedger(companyId, values) {
  const id = requireCompany(companyId);
  const { data, error } = await supabase.from("chart_of_accounts")
    .insert([{ ...values, company_id: id }]).select().single();
  if (error) throw error;
  return data;
}

export async function createVoucher(companyId, header, lines) {
  const id = requireCompany(companyId);
  const totalDebit = lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);
  if (lines.length < 2 || totalDebit <= 0 || Math.abs(totalDebit - totalCredit) > 0.005) {
    throw new Error("Voucher must contain at least two lines and total Debit must equal total Credit.");
  }

  const { data: voucher, error: voucherError } = await supabase.from("accounting_vouchers")
    .insert([{
      ...header,
      company_id: id,
      total_debit: totalDebit,
      total_credit: totalCredit,
      created_by: (await supabase.auth.getUser()).data.user?.id || null
    }]).select().single();
  if (voucherError) throw voucherError;

  const rows = lines.map((line, index) => ({
    company_id: id,
    voucher_id: voucher.id,
    ledger_id: line.ledger_id,
    line_number: index + 1,
    debit: Number(line.debit || 0),
    credit: Number(line.credit || 0),
    line_narration: line.line_narration || null
  }));

  const { error: linesError } = await supabase.from("accounting_voucher_lines").insert(rows);
  if (linesError) {
    await supabase.from("accounting_vouchers").delete().eq("id", voucher.id).eq("company_id", id);
    throw linesError;
  }
  return voucher;
}

export async function postVoucher(companyId, voucherId) {
  const id = requireCompany(companyId);
  const { data, error } = await supabase.rpc("post_accounting_voucher", {
    p_company_id: id,
    p_voucher_id: voucherId
  });
  if (error) throw error;
  return data;
}
