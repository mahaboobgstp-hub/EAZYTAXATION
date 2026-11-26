import { supabase } from "../supabase/supabaseClient";

const requireCompany = id => { if (!id) throw new Error("Select a company first."); return id; };

export async function getAccountingClassificationRules(companyId, sourceModule) {
  const id = requireCompany(companyId);
  let query = supabase.from("transaction_accounting_rules").select("*").eq("company_id", id).eq("is_active", true).order("priority", { ascending: false });
  if (sourceModule) query = query.eq("source_module", sourceModule);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function saveAccountingClassificationRule(companyId, rule) {
  const id = requireCompany(companyId);
  if (!rule?.source_module || !rule?.match_type || !String(rule.match_value || "").trim()) throw new Error("Module, rule type and match value are required.");
  const payload = { ...rule, company_id: id, match_value: String(rule.match_value).trim(), is_active: true };
  const { data, error } = await supabase.from("transaction_accounting_rules").upsert(payload, { onConflict: "company_id,source_module,match_type,match_value" }).select().single();
  if (error) throw error;
  return data;
}

export async function classifyPurchaseInvoices(companyId, invoiceIds, purchaseLedgerId, applySupplierDefault = false, vendorId = null) {
  const id = requireCompany(companyId);
  if (!purchaseLedgerId) throw new Error("Choose a purchase, expense, inventory or asset ledger.");
  if (!Array.isArray(invoiceIds) || !invoiceIds.length) throw new Error("Select at least one invoice.");
  const { error } = await supabase.from("purchase_invoices").update({ purchase_ledger_id: purchaseLedgerId, accounting_classification_status: "Categorized", accounting_status: "Unposted", accounting_message: null }).eq("company_id", id).in("id", invoiceIds).eq("is_deleted", false);
  if (error) throw error;
  if (applySupplierDefault && vendorId) {
    const { error: vendorError } = await supabase.from("vendors").update({ default_purchase_ledger_id: purchaseLedgerId }).eq("company_id", id).eq("id", vendorId);
    if (vendorError) throw vendorError;
    const { error: ruleError } = await saveAccountingClassificationRule(id, { source_module: "Purchase", match_type: "Supplier", match_value: vendorId, debit_ledger_id: purchaseLedgerId, priority: 300, auto_apply: true });
    if (ruleError) throw ruleError;
    const { error: bulkError } = await supabase.from("purchase_invoices").update({ purchase_ledger_id: purchaseLedgerId, accounting_classification_status: "Categorized" }).eq("company_id", id).eq("vendor_id", vendorId).eq("is_deleted", false).is("accounting_voucher_id", null);
    if (bulkError) throw bulkError;
  }
  return true;
}

export async function classifySalesInvoices(companyId, invoiceIds, salesLedgerId, applyCustomerDefault = false, customerId = null) {
  const id = requireCompany(companyId);
  if (!salesLedgerId) throw new Error("Choose a sales or income ledger.");
  if (!Array.isArray(invoiceIds) || !invoiceIds.length) throw new Error("Select at least one invoice.");
  const { error } = await supabase.from("sales_invoices").update({ sales_ledger_id: salesLedgerId, accounting_classification_status: "Categorized", accounting_status: "Unposted", accounting_message: null }).eq("company_id", id).in("id", invoiceIds).eq("is_deleted", false);
  if (error) throw error;
  if (applyCustomerDefault && customerId) {
    const { error: customerError } = await supabase.from("customers").update({ default_sales_ledger_id: salesLedgerId }).eq("company_id", id).eq("id", customerId);
    if (customerError) throw customerError;
    await saveAccountingClassificationRule(id, { source_module: "Sales", match_type: "Customer", match_value: customerId, credit_ledger_id: salesLedgerId, priority: 300, auto_apply: true });
    const { error: bulkError } = await supabase.from("sales_invoices").update({ sales_ledger_id: salesLedgerId, accounting_classification_status: "Categorized" }).eq("company_id", id).eq("customer_id", customerId).eq("is_deleted", false).is("accounting_voucher_id", null);
    if (bulkError) throw bulkError;
  }
  return true;
}

export async function classifyBankStatementLines(companyId, lineIds, ledgerId, category) {
  const id = requireCompany(companyId);
  if (!Array.isArray(lineIds) || !lineIds.length) throw new Error("Select at least one bank transaction.");
  const { data: ledger, error: ledgerError } = await supabase.from("chart_of_accounts").select("id,ledger_name").eq("company_id", id).eq("id", ledgerId).single();
  if (ledgerError) throw ledgerError;
  const { error } = await supabase.from("bank_statement_lines").update({ ledger_id: ledger.id, ledger_name: ledger.ledger_name, category: category || "Other", classification_status: "To Post" }).eq("company_id", id).in("id", lineIds);
  if (error) throw error;
  return true;
}
