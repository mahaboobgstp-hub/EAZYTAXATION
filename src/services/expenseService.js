import { supabase } from "../supabase/supabaseClient";

const currentDate = () => new Date().toISOString().slice(0, 10);
const moneyNumber = value => Number(value) || 0;

export async function generateExpenseNumber(companyId) {
  const { data: rows, error } = await supabase.from("document_sequences")
    .select("*").eq("document_type", "EXPENSE").order("created_at", { ascending: true }).limit(1);
  if (error) throw error;
  const sequence = rows?.[0];
  if (!sequence) {
    const { count, error: countError } = await supabase.from("expenses")
      .select("id", { count: "exact", head: true }).eq("company_id", companyId);
    if (countError) throw countError;
    return `EXP-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(5, "0")}`;
  }
  const fiscalYear = sequence.financial_year || "";
  return `${sequence.prefix || "EXP"}-${fiscalYear || new Date().getFullYear()}-${String(Number(sequence.last_number || 0) + 1).padStart(sequence.digits || 5, "0")}`;
}

export async function advanceExpenseSequence() {
  const { data: rows, error } = await supabase.from("document_sequences")
    .select("id,last_number").eq("document_type", "EXPENSE").order("created_at", { ascending: true }).limit(1);
  if (error) throw error;
  if (!rows?.[0]) return;
  const { error: updateError } = await supabase.from("document_sequences")
    .update({ last_number: Number(rows[0].last_number || 0) + 1 }).eq("id", rows[0].id);
  if (updateError) throw updateError;
}

export async function getExpenseMasters(companyId, accountingEnabled = false, includePaymentLedgers = false) {
  const [vendors, categories] = await Promise.all([
    supabase.from("vendors").select("id,vendor_name,gstin,state,address,company_id")
      .eq("company_id", companyId).order("vendor_name"),
    supabase.from("expense_categories").select("id,company_id,category_name,expenditure_type,group_id,subgroup_id,ledger_id,description,is_active").or(`company_id.eq.${companyId},company_id.is.null`).eq("is_active", true).order("category_name")
  ]);
  if (vendors.error) throw vendors.error;
  if (categories.error) throw categories.error;

  let expenseLedgers = [];
  let paymentLedgers = [];
  let accountGroups = [];
  if (accountingEnabled || includePaymentLedgers) {
    const { data: groups, error: groupError } = await supabase.from("account_groups")
      .select("id,group_name,account_nature")
      .eq("company_id", companyId)
      .eq("is_active", true);
    if (groupError) throw groupError;
    accountGroups = groups || [];
    const expenseGroupIds = accountingEnabled
      ? accountGroups.filter(group => group.account_nature === "Expense").map(group => group.id)
      : [];
    const assetGroupIds = includePaymentLedgers
      ? accountGroups.filter(group => group.account_nature === "Asset").map(group => group.id)
      : [];
    const [expenseResult, paymentResult, bankProfileResult] = await Promise.all([
      expenseGroupIds.length
        ? supabase.from("chart_of_accounts").select("id,ledger_name,ledger_code,group_id,party_type")
            .eq("company_id", companyId).eq("is_active", true).in("group_id", expenseGroupIds).order("ledger_name")
        : Promise.resolve({ data: [], error: null }),
      assetGroupIds.length
        ? supabase.from("chart_of_accounts").select("id,ledger_name,ledger_code,group_id,party_type")
            .eq("company_id", companyId).eq("is_active", true).in("group_id", assetGroupIds).order("ledger_name")
        : Promise.resolve({ data: [], error: null }),
      includePaymentLedgers
        ? supabase.from("bank_account_profiles")
            .select("id,ledger_id,bank_name,account_holder_name,account_number_masked,ifsc,branch_name,account_type")
            .eq("company_id", companyId).eq("is_active", true)
        : Promise.resolve({ data: [], error: null })
    ]);
    if (expenseResult.error) throw expenseResult.error;
    if (paymentResult.error) throw paymentResult.error;
    if (bankProfileResult.error) throw bankProfileResult.error;
    const groupNameById = new Map(accountGroups.map(group => [group.id, group.group_name]));
    const bankProfileByLedger = new Map((bankProfileResult.data || []).map(profile => [profile.ledger_id, profile]));
    expenseLedgers = (expenseResult.data || []).map(ledger => ({ ...ledger, group_name: groupNameById.get(ledger.group_id) || "" }));
    paymentLedgers = (paymentResult.data || []).map(ledger => ({
      ...ledger,
      group_name: groupNameById.get(ledger.group_id) || "",
      bank_profile: bankProfileByLedger.get(ledger.id) || null
    }));
  }

  return {
    vendors: vendors.data || [],
    categories: categories.data || [],
    expenseLedgers,
    paymentLedgers,
    accountGroups,
    hasChartOfAccounts: Boolean(accountingEnabled || includePaymentLedgers)
  };
}


export async function createExpenseBankAccount(companyId, values) {
  if (!companyId) throw new Error("Select a company before creating a bank account.");
  const bankName = String(values.bank_name || "").trim();
  const accountNumber = String(values.account_number || "").replace(/\s+/g, "");
  const ifsc = String(values.ifsc || "").trim().toUpperCase();
  if (!bankName) throw new Error("Enter the bank name.");
  if (!/^\d{9,18}$/.test(accountNumber)) throw new Error("Enter a valid bank account number (9 to 18 digits).");
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) throw new Error("Enter a valid 11-character IFSC code.");
  const accountType = String(values.account_type || "Current");
  const maskedNumber = "••••" + accountNumber.slice(-4);

  const { data: duplicate, error: duplicateError } = await supabase.from("bank_account_profiles")
    .select("id").eq("company_id", companyId).eq("bank_name", bankName)
    .eq("account_number_masked", maskedNumber).eq("ifsc", ifsc).eq("is_active", true).limit(1);
  if (duplicateError) throw duplicateError;
  if (duplicate?.length) throw new Error("This bank account is already added to this company.");

  const { data: groups, error: groupsError } = await supabase.from("account_groups")
    .select("id,group_name,group_code,parent_group_id,account_nature")
    .eq("company_id", companyId).eq("is_active", true);
  if (groupsError) throw groupsError;
  const assetGroup = (groups || []).find(group => group.account_nature === "Asset" && !group.parent_group_id);
  if (!assetGroup) throw new Error("The Assets account group is missing. Create or load the standard Chart of Accounts groups first.");

  let bankGroup = (groups || []).find(group =>
    group.account_nature === "Asset" && group.parent_group_id === assetGroup.id &&
    group.group_name.trim().toLowerCase() === "bank accounts"
  );
  if (!bankGroup) {
    const groupCode = "BANK" + Date.now().toString().slice(-6);
    const { data, error } = await supabase.from("account_groups").insert([{
      company_id: companyId, group_name: "Bank Accounts", group_code: groupCode,
      parent_group_id: assetGroup.id, account_nature: "Asset", normal_balance: "Debit",
      statement_classification: "Balance Sheet", description: "Company bank account ledgers",
      is_system: false, is_active: true
    }]).select().single();
    if (error) throw error;
    bankGroup = data;
  }

  const ledgerName = bankName + " - " + accountType + " - " + accountNumber.slice(-4);
  const ledgerCode = "BNK" + Date.now().toString().slice(-8);
  const { data: ledger, error: ledgerError } = await supabase.from("chart_of_accounts").insert([{
    company_id: companyId, ledger_name: ledgerName, ledger_code: ledgerCode,
    group_id: bankGroup.id, opening_balance: Number(values.opening_balance || 0),
    opening_balance_type: values.opening_balance_type || "Debit",
    opening_date: values.opening_date || currentDate(), party_type: "Bank",
    description: "Bank account ledger created from Android Expense Entry",
    is_system: false, is_active: true
  }]).select().single();
  if (ledgerError) throw ledgerError;

  const { data: profile, error: profileError } = await supabase.from("bank_account_profiles").insert([{
    company_id: companyId, ledger_id: ledger.id, bank_name: bankName,
    account_holder_name: String(values.account_holder_name || "").trim() || null,
    account_number_masked: maskedNumber, ifsc,
    branch_name: String(values.branch_name || "").trim() || null,
    account_type: accountType, is_active: true
  }]).select().single();
  if (profileError) {
    await supabase.from("chart_of_accounts").delete().eq("id", ledger.id).eq("company_id", companyId);
    throw profileError;
  }
  return { ...ledger, bank_profile: profile };
}

export async function getExpenses(companyId) {
  if (!companyId) return [];
  const { data, error } = await supabase.from("expenses").select("*")
    .eq("company_id", companyId).order("expense_date", { ascending: false });
  if (error) throw error;
  const rows = data || [];
  const ids = [...new Set(rows.flatMap(row => [row.vendor_id, row.category_id, row.expense_ledger_id]).filter(Boolean))];
  const [vendors, categories, ledgers] = await Promise.all([
    ids.length ? supabase.from("vendors").select("id,vendor_name,gstin,state").in("id", rows.map(x => x.vendor_id).filter(Boolean)) : Promise.resolve({ data: [] }),
    ids.length ? supabase.from("expense_categories").select("id,category_name").in("id", rows.map(x => x.category_id).filter(Boolean)) : Promise.resolve({ data: [] }),
    rows.some(x => x.expense_ledger_id) ? supabase.from("chart_of_accounts").select("id,ledger_name").eq("company_id", companyId).in("id", rows.map(x => x.expense_ledger_id).filter(Boolean)) : Promise.resolve({ data: [] })
  ]);
  if (vendors.error) throw vendors.error;
  if (categories.error) throw categories.error;
  if (ledgers.error) throw ledgers.error;
  const vendorMap = new Map((vendors.data || []).map(item => [item.id, item]));
  const categoryMap = new Map((categories.data || []).map(item => [item.id, item]));
  const ledgerMap = new Map((ledgers.data || []).map(item => [item.id, item]));
  return rows.map(row => ({
    ...row,
    vendor_name: vendorMap.get(row.vendor_id)?.vendor_name || row.payee_name || "",
    vendor_gstin: vendorMap.get(row.vendor_id)?.gstin || "",
    category_name: categoryMap.get(row.category_id)?.category_name || ledgerMap.get(row.expense_ledger_id)?.ledger_name || "Uncategorized",
    vendor_state: vendorMap.get(row.vendor_id)?.state || ""
  }));
}

export async function getExpenseById(id, companyId) {
  let query = supabase.from("expenses").select("*").eq("id", id);
  if (companyId) query = query.eq("company_id", companyId);
  const { data, error } = await query.single();
  if (error) throw error;
  const [linesFromItems, vendors, categories, expenseLedger] = await Promise.all([
    getExpenseItems(id),
    data.vendor_id ? supabase.from("vendors").select("id,vendor_name,gstin,state,address").eq("id", data.vendor_id).maybeSingle() : Promise.resolve({ data: null }),
    data.category_id ? supabase.from("expense_categories").select("id,category_name").eq("id", data.category_id).maybeSingle() : Promise.resolve({ data: null }),
    data.expense_ledger_id ? supabase.from("chart_of_accounts").select("id,ledger_name").eq("id", data.expense_ledger_id).eq("company_id", companyId).maybeSingle() : Promise.resolve({ data: null })
  ]);
  const lines = linesFromItems.length ? linesFromItems : (moneyNumber(data.taxable_amount) > 0 ? [{ description: data.remarks || "Expense", hsn_sac: "", qty: 1, uom: "", rate: moneyNumber(data.taxable_amount), taxable_amount: moneyNumber(data.taxable_amount), gst_percent: moneyNumber(data.gst_percent), cgst_amount: moneyNumber(data.cgst), sgst_amount: moneyNumber(data.sgst), igst_amount: moneyNumber(data.igst), total_amount: moneyNumber(data.total_amount) }] : []);
  return { ...data, items: lines, vendor_name: vendors.data?.vendor_name || data.payee_name || "", vendor_gstin: vendors.data?.gstin || "", vendor_state: vendors.data?.state || "", vendor_address: vendors.data?.address || "", category_name: categories.data?.category_name || expenseLedger.data?.ledger_name || "", expense_ledger_name: expenseLedger.data?.ledger_name || "" };
}

export async function getExpenseItems(expenseId) {
  const { data, error } = await supabase.from("expense_items").select("*")
    .eq("expense_id", expenseId).order("line_no");
  if (error) throw error;
  return data || [];
}

const normalizedItems = (expenseId, items = []) => items.map((item, index) => ({
  expense_id: expenseId,
  line_no: index + 1,
  description: item.description.trim(),
  hsn_sac: item.hsn_sac || "",
  qty: moneyNumber(item.qty),
  uom: item.uom || "",
  rate: moneyNumber(item.rate),
  discount_percent: moneyNumber(item.discount_percent),
  discount_amount: moneyNumber(item.discount_amount),
  taxable_amount: moneyNumber(item.taxable_amount),
  gst_percent: moneyNumber(item.gst_percent),
  cgst_amount: moneyNumber(item.cgst_amount),
  sgst_amount: moneyNumber(item.sgst_amount),
  igst_amount: moneyNumber(item.igst_amount),
  total_amount: moneyNumber(item.total_amount)
}));

export async function saveExpense(header, items, companyId) {
  const { data, error } = await supabase.from("expenses")
    .insert([{ ...header, company_id: companyId }]).select("id").single();
  if (error) throw error;
  const expenseId = data.id;
  const { error: itemError } = await supabase.from("expense_items").insert(normalizedItems(expenseId, items));
  if (itemError) {
    await supabase.from("expenses").delete().eq("id", expenseId).eq("company_id", companyId);
    throw itemError;
  }
  await advanceExpenseSequence();
  return expenseId;
}

export async function updateExpense(id, header, items, companyId) {
  const { error } = await supabase.from("expenses")
    .update({ ...header, updated_at: new Date().toISOString() })
    .eq("id", id).eq("company_id", companyId);
  if (error) throw error;
  const { error: deleteError } = await supabase.from("expense_items").delete().eq("expense_id", id);
  if (deleteError) throw deleteError;
  const { error: insertError } = await supabase.from("expense_items").insert(normalizedItems(id, items));
  if (insertError) throw insertError;
  return id;
}

export async function uploadExpenseAttachment(companyId, expenseNo, file) {
  if (!file) return null;
  if (!["application/pdf", "image/jpeg", "image/png"].includes(file.type)) throw new Error("Upload a PDF, JPG, or PNG file.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Attachment must be 10 MB or smaller.");
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${companyId}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from("expense-attachments").upload(path, file, { upsert: true });
  if (error) throw error;
  return path;
}

export async function getExpenseAttachmentUrl(path) {
  if (!path) return "";
  const { data, error } = await supabase.storage.from("expense-attachments").createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}

export async function getExpensePayments(companyId) {
  if (!companyId) return [];
  const { data, error } = await supabase.from("expense_payments").select("*")
    .eq("company_id", companyId).order("payment_date", { ascending: false });
  if (error) throw error;
  const rows = data || [];
  const expenseIds = [...new Set(rows.map(x => x.expense_id).filter(Boolean))];
  const vendorIds = [...new Set(rows.map(x => x.vendor_id).filter(Boolean))];
  const [expenses, vendors] = await Promise.all([
    expenseIds.length ? supabase.from("expenses").select("id,expense_no,total_amount").in("id", expenseIds) : Promise.resolve({ data: [] }),
    vendorIds.length ? supabase.from("vendors").select("id,vendor_name").in("id", vendorIds) : Promise.resolve({ data: [] })
  ]);
  if (expenses.error) throw expenses.error;
  if (vendors.error) throw vendors.error;
  const expenseMap = new Map((expenses.data || []).map(row => [row.id, row]));
  const vendorMap = new Map((vendors.data || []).map(row => [row.id, row]));
  return rows.map(row => ({
    ...row,
    expense_no: expenseMap.get(row.expense_id)?.expense_no || "",
    paid_to: row.paid_to || vendorMap.get(row.vendor_id)?.vendor_name || "Supplier"
  }));
}

async function recalculateExpensePaid(expenseId, companyId) {
  if (!expenseId) return;
  const [{ data: expense, error: expenseError }, { data: payments, error: paymentsError }] = await Promise.all([
    supabase.from("expenses").select("id,total_amount").eq("id", expenseId).eq("company_id", companyId).maybeSingle(),
    supabase.from("expense_payments").select("amount").eq("expense_id", expenseId).eq("company_id", companyId).eq("status", "Completed")
  ]);
  if (expenseError) throw expenseError;
  if (paymentsError) throw paymentsError;
  if (!expense) return;
  const paid = (payments || []).reduce((sum, row) => sum + moneyNumber(row.amount), 0);
  const total = moneyNumber(expense.total_amount);
  const status = paid >= total && total > 0 ? "Paid" : paid > 0 ? "Partially Paid" : "Unpaid";
  const { error } = await supabase.from("expenses").update({ paid_amount: paid, payment_status: status })
    .eq("id", expenseId).eq("company_id", companyId);
  if (error) throw error;
}

const paymentNo = async companyId => {
  const { count, error } = await supabase.from("expense_payments").select("id", { count: "exact", head: true }).eq("company_id", companyId);
  if (error) throw error;
  return `PAY-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(5, "0")}`;
};

export async function createExpensePayment(payment, companyId) {
  const { data: expense, error: expenseError } = payment.expense_id
    ? await supabase.from("expenses").select("id,vendor_id,payee_name,total_amount").eq("id", payment.expense_id).eq("company_id", companyId).single()
    : { data: null, error: null };
  if (expenseError) throw expenseError;
  const number = payment.payment_no || await paymentNo(companyId);
  const { data, error } = await supabase.from("expense_payments").insert([{
    ...payment,
    company_id: companyId,
    payment_no: number,
    vendor_id: payment.vendor_id || expense?.vendor_id || null,
    paid_to: payment.paid_to || expense?.payee_name || "Supplier"
  }]).select("id").single();
  if (error) throw error;
  if (payment.status === "Completed" && payment.expense_id) await recalculateExpensePaid(payment.expense_id, companyId);
  return data.id;
}

export async function updateExpensePayment(id, payment, companyId) {
  const { data: previous, error: readError } = await supabase.from("expense_payments")
    .select("expense_id").eq("id", id).eq("company_id", companyId).single();
  if (readError) throw readError;
  const { error } = await supabase.from("expense_payments")
    .update({ ...payment, updated_at: new Date().toISOString() }).eq("id", id).eq("company_id", companyId);
  if (error) throw error;
  await recalculateExpensePaid(previous.expense_id, companyId);
  if (payment.expense_id !== previous.expense_id) await recalculateExpensePaid(payment.expense_id, companyId);
  return id;
}
