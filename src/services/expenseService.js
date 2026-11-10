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

export async function getExpenseMasters(companyId) {
  const [vendors, categories] = await Promise.all([
    supabase.from("vendors").select("id,vendor_name,gstin,state,address,company_id")
      .eq("company_id", companyId).order("vendor_name"),
    supabase.from("expense_categories").select("id,category_name").order("category_name")
  ]);
  if (vendors.error) throw vendors.error;
  if (categories.error) throw categories.error;
  return { vendors: vendors.data || [], categories: categories.data || [] };
}

export async function getExpenses(companyId) {
  if (!companyId) return [];
  const { data, error } = await supabase.from("expenses").select("*")
    .eq("company_id", companyId).order("expense_date", { ascending: false });
  if (error) throw error;
  const rows = data || [];
  const ids = [...new Set(rows.flatMap(row => [row.vendor_id, row.category_id]).filter(Boolean))];
  const [vendors, categories] = await Promise.all([
    ids.length ? supabase.from("vendors").select("id,vendor_name,gstin,state").in("id", rows.map(x => x.vendor_id).filter(Boolean)) : Promise.resolve({ data: [] }),
    ids.length ? supabase.from("expense_categories").select("id,category_name").in("id", rows.map(x => x.category_id).filter(Boolean)) : Promise.resolve({ data: [] })
  ]);
  if (vendors.error) throw vendors.error;
  if (categories.error) throw categories.error;
  const vendorMap = new Map((vendors.data || []).map(item => [item.id, item]));
  const categoryMap = new Map((categories.data || []).map(item => [item.id, item]));
  return rows.map(row => ({
    ...row,
    vendor_name: vendorMap.get(row.vendor_id)?.vendor_name || row.payee_name || "",
    vendor_gstin: vendorMap.get(row.vendor_id)?.gstin || "",
    category_name: categoryMap.get(row.category_id)?.category_name || "Uncategorized",
    vendor_state: vendorMap.get(row.vendor_id)?.state || ""
  }));
}

export async function getExpenseById(id, companyId) {
  let query = supabase.from("expenses").select("*").eq("id", id);
  if (companyId) query = query.eq("company_id", companyId);
  const { data, error } = await query.single();
  if (error) throw error;
  const [lines, vendors, categories] = await Promise.all([
    getExpenseItems(id),
    data.vendor_id ? supabase.from("vendors").select("id,vendor_name,gstin,state,address").eq("id", data.vendor_id).maybeSingle() : Promise.resolve({ data: null }),
    data.category_id ? supabase.from("expense_categories").select("id,category_name").eq("id", data.category_id).maybeSingle() : Promise.resolve({ data: null })
  ]);
  const lines = linesFromItems.length ? linesFromItems : (moneyNumber(data.taxable_amount) > 0 ? [{ description: data.remarks || "Expense", hsn_sac: "", qty: 1, uom: "", rate: moneyNumber(data.taxable_amount), taxable_amount: moneyNumber(data.taxable_amount), gst_percent: moneyNumber(data.gst_percent), cgst_amount: moneyNumber(data.cgst), sgst_amount: moneyNumber(data.sgst), igst_amount: moneyNumber(data.igst), total_amount: moneyNumber(data.total_amount) }] : []);
  return { ...data, items: lines, vendor_name: vendors.data?.vendor_name || data.payee_name || "", vendor_gstin: vendors.data?.gstin || "", vendor_state: vendors.data?.state || "", vendor_address: vendors.data?.address || "", category_name: categories.data?.category_name || "" };
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
