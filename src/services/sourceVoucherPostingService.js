import { supabase } from "../supabase/supabaseClient";

const round2 = value => Math.round((Number(value) || 0) * 100) / 100;

async function findLedger(companyId, patterns) {
  const { data, error } = await supabase.from("chart_of_accounts")
    .select("id,ledger_name").eq("company_id", companyId).eq("is_active", true);
  if (error) throw error;
  return (data || []).find(row => patterns.some(pattern => pattern.test(row.ledger_name))) || null;
}

async function requireLedger(companyId, patterns, label) {
  const ledger = await findLedger(companyId, patterns);
  if (!ledger) throw new Error("Missing " + label + " ledger in Chart of Accounts. Configure it before posting.");
  return ledger;
}

async function postVoucher({ companyId, module, sourceId, type, date, ref, narration, lines }) {
  const debit = round2(lines.reduce((sum, line) => sum + round2(line.debit), 0));
  const credit = round2(lines.reduce((sum, line) => sum + round2(line.credit), 0));
  if (lines.length < 2 || debit <= 0 || Math.abs(debit - credit) > 0.01) {
    throw new Error("Posting rejected: voucher is not balanced (Dr " + debit + " / Cr " + credit + ").");
  }
  const { data, error } = await supabase.rpc("post_accounting_source_voucher", {
    p_company_id: companyId, p_source_module: module, p_source_record_id: sourceId,
    p_voucher_type: type, p_voucher_date: date, p_reference_number: ref || null,
    p_narration: narration, p_lines: lines
  });
  if (error) throw error;
  return data;
}

export async function postPurchaseInvoice(companyId, invoice) {
  if (!companyId || !invoice?.id) throw new Error("Company and purchase invoice are required.");
  if (invoice.accounting_voucher_id) return invoice.accounting_voucher_id;
  if (!invoice.purchase_ledger_id) throw new Error("Categorize the purchase invoice before posting.");
  const { data: vendor, error } = await supabase.from("vendors").select("ledger_id,vendor_name")
    .eq("company_id", companyId).eq("id", invoice.vendor_id).single();
  if (error) throw error;
  if (!vendor.ledger_id) throw new Error("Supplier has no linked payable ledger.");
  const lines = [{ ledger_id: invoice.purchase_ledger_id, debit: round2(invoice.taxable), credit: 0, narration: "Purchase taxable value" }];
  const taxMappings = [
    ["cgst", [/input.*cgst/i, /cgst.*input/i, /central.*input.*tax/i]],
    ["sgst", [/input.*sgst/i, /sgst.*input/i, /state.*input.*tax/i]],
    ["igst", [/input.*igst/i, /igst.*input/i, /integrated.*input.*tax/i]]
  ];
  for (const [key, patterns] of taxMappings) {
    const amount = round2(invoice[key]);
    if (amount > 0) {
      const ledger = await requireLedger(companyId, patterns, "Input " + key.toUpperCase());
      lines.push({ ledger_id: ledger.id, debit: amount, credit: 0, narration: "Input GST " + key.toUpperCase() });
    }
  }
  const purchaseCess = round2(invoice.cess || invoice.cess_amount);
  if (purchaseCess > 0) {
    const cessLedger = await requireLedger(companyId, [/input.*cess/i, /cess.*input/i], "Input Cess");
    lines.push({ ledger_id: cessLedger.id, debit: purchaseCess, credit: 0, narration: "Input Cess" });
  }
  lines.push({ ledger_id: vendor.ledger_id, debit: 0, credit: round2(invoice.grand_total), narration: "Supplier payable - " + vendor.vendor_name });
  const debitSum = round2(lines.reduce((sum, line) => sum + round2(line.debit), 0));
  const creditSum = round2(lines.reduce((sum, line) => sum + round2(line.credit), 0));
  const difference = round2(debitSum - creditSum);
  if (Math.abs(difference) > 0.01) {
    if (Math.abs(difference) > 1) throw new Error("Invoice tax and total differ by more than ₹1.00. Review the invoice totals before posting.");
    const roundOffLedger = await requireLedger(companyId, [/round.?off/i], "Round Off");
    lines.push({ ledger_id: roundOffLedger.id, debit: difference < 0 ? Math.abs(difference) : 0, credit: difference > 0 ? difference : 0, narration: "Purchase invoice rounding adjustment" });
  }
  const voucherId = await postVoucher({ companyId, module: "Purchase", sourceId: invoice.id, type: "Purchase", date: invoice.invoice_date, ref: invoice.supplier_invoice_no || invoice.invoice_no, narration: "Purchase " + (invoice.invoice_no || "") + " - " + vendor.vendor_name, lines });
  const { error: updateError } = await supabase.from("purchase_invoices").update({ accounting_status: "Posted", accounting_voucher_id: voucherId, accounting_message: null }).eq("company_id", companyId).eq("id", invoice.id);
  if (updateError) throw updateError;
  return voucherId;
}

export async function postSalesInvoice(companyId, invoice) {
  if (!companyId || !invoice?.id) throw new Error("Company and sales invoice are required.");
  if (invoice.accounting_voucher_id) return invoice.accounting_voucher_id;
  if (!invoice.sales_ledger_id) throw new Error("Categorize the sales invoice before posting.");
  const { data: customer, error } = await supabase.from("customers").select("ledger_id,customer_name")
    .eq("company_id", companyId).eq("id", invoice.customer_id).single();
  if (error) throw error;
  if (!customer.ledger_id) throw new Error("Customer has no linked receivable ledger.");
  const lines = [{ ledger_id: customer.ledger_id, debit: round2(invoice.total_amount), credit: 0, narration: "Customer receivable" }];
  const taxMappings = [
    ["cgst", [/output.*cgst/i, /cgst.*output/i, /central.*output.*tax/i]],
    ["sgst", [/output.*sgst/i, /sgst.*output/i, /state.*output.*tax/i]],
    ["igst", [/output.*igst/i, /igst.*output/i, /integrated.*output.*tax/i]]
  ];
  for (const [key, patterns] of taxMappings) {
    const amount = round2(invoice[key]);
    if (amount > 0) {
      const ledger = await requireLedger(companyId, patterns, "Output " + key.toUpperCase());
      lines.push({ ledger_id: ledger.id, debit: 0, credit: amount, narration: "Output GST " + key.toUpperCase() });
    }
  }
  lines.push({ ledger_id: invoice.sales_ledger_id, debit: 0, credit: round2(invoice.taxable_value), narration: "Sales income" });
  const salesCess = round2(invoice.cess_amount);
  const salesAdditionalCess = round2(invoice.additional_cess_amount);
  if (salesCess > 0) { const cessLedger = await requireLedger(companyId, [/output.*cess/i, /cess.*output/i], "Output Cess"); lines.push({ ledger_id: cessLedger.id, debit: 0, credit: salesCess, narration: "Output Cess" }); }
  if (salesAdditionalCess > 0) { const additionalLedger = await requireLedger(companyId, [/additional.*cess/i, /cess.*additional/i], "Additional Cess"); lines.push({ ledger_id: additionalLedger.id, debit: 0, credit: salesAdditionalCess, narration: "Additional Output Cess" }); }
  const salesDebitSum = round2(lines.reduce((sum, line) => sum + round2(line.debit), 0));
  const salesCreditSum = round2(lines.reduce((sum, line) => sum + round2(line.credit), 0));
  const salesDifference = round2(salesDebitSum - salesCreditSum);
  if (Math.abs(salesDifference) > 0.01) {
    if (Math.abs(salesDifference) > 1) throw new Error("Sales invoice tax and total differ by more than ₹1.00. Review invoice totals before posting.");
    const roundOffLedger = await requireLedger(companyId, [/round.?off/i], "Round Off");
    lines.push({ ledger_id: roundOffLedger.id, debit: salesDifference < 0 ? Math.abs(salesDifference) : 0, credit: salesDifference > 0 ? salesDifference : 0, narration: "Sales invoice rounding adjustment" });
  }
  const voucherId = await postVoucher({ companyId, module: "Sales", sourceId: invoice.id, type: "Sales", date: invoice.invoice_date, ref: invoice.invoice_no, narration: "Sales " + (invoice.invoice_no || "") + " - " + customer.customer_name, lines });
  const { error: updateError } = await supabase.from("sales_invoices").update({ accounting_status: "Posted", accounting_voucher_id: voucherId, accounting_message: null }).eq("company_id", companyId).eq("id", invoice.id);
  if (updateError) throw updateError;
  return voucherId;
}

export async function postBankStatementLine(companyId, line) {
  if (!companyId || !line?.id) throw new Error("Company and bank transaction are required.");
  if (line.matched_voucher_id) return line.matched_voucher_id;
  if (!line.ledger_id) throw new Error("Categorize the bank transaction to a counterpart ledger first.");
  const { data: bank, error } = await supabase.from("bank_account_profiles").select("ledger_id,bank_name")
    .eq("company_id", companyId).eq("id", line.bank_account_id).single();
  if (error) throw error;
  if (!bank.ledger_id) throw new Error("Bank account has no linked ledger.");
  const amount = round2(line.amount);
  const isReceipt = line.direction === "Credit";
  const lines = isReceipt
    ? [{ ledger_id: bank.ledger_id, debit: amount, credit: 0, narration: "Bank receipt" }, { ledger_id: line.ledger_id, debit: 0, credit: amount, narration: line.narration || "Receipt counterpart" }]
    : [{ ledger_id: line.ledger_id, debit: amount, credit: 0, narration: line.narration || "Payment counterpart" }, { ledger_id: bank.ledger_id, debit: 0, credit: amount, narration: "Bank payment" }];
  const voucherId = await postVoucher({ companyId, module: "Bank", sourceId: line.id, type: isReceipt ? "Receipt" : "Payment", date: line.statement_date, ref: line.reference_number, narration: line.narration, lines });
  const { error: updateError } = await supabase.from("bank_statement_lines").update({ matched_voucher_id: voucherId, match_status: "Matched", matched_at: new Date().toISOString(), classification_status: "Posted" }).eq("company_id", companyId).eq("id", line.id);
  if (updateError) throw updateError;
  return voucherId;
}
