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
  const level=values.ledger_level||"Main Ledger";
  const parentId=values.parent_ledger_id||null;
  if(!["Main Ledger","Intermediate Ledger","Subledger"].includes(level))throw new Error("Invalid ledger level.");
  if(level==="Main Ledger"&&parentId)throw new Error("Main Ledgers cannot have a parent ledger.");
  if(level!=="Main Ledger"&&!parentId)throw new Error("Select a parent ledger for this ledger level.");
  if(level==="Main Ledger"&&!values.group_id)throw new Error("Select an account group.");
  if(parentId){
    const {data:parent,error:parentError}=await supabase.from("chart_of_accounts").select("id,company_id,group_id,ledger_level,is_active").eq("company_id",id).eq("id",parentId).maybeSingle();
    if(parentError)throw parentError;
    if(!parent||parent.is_active===false)throw new Error("Selected parent ledger is unavailable for this company.");
    const expectedParentLevel=level==="Intermediate Ledger"?"Main Ledger":"Intermediate Ledger";
    if(parent.ledger_level!==expectedParentLevel)throw new Error(level==="Intermediate Ledger"?"Intermediate Ledgers must be under a Main Ledger.":"Subledgers must be under an Intermediate Ledger.");
    if(values.group_id&&values.group_id!==parent.group_id)throw new Error("Child ledger must belong to the same account group as its parent.");
    values={...values,group_id:parent.group_id};
  }
  const payload={...values,company_id:id,ledger_level:level,parent_ledger_id:parentId,is_posting_enabled:level==="Subledger"?true:values.is_posting_enabled!==false};
  const { data, error } = await supabase.from("chart_of_accounts").insert([payload]).select().single();
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
