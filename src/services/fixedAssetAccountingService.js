import { createVoucher, postVoucher } from "./accountingService";

/**
 * Build balanced acquisition lines from explicit ledger mapping.
 * GST eligibility is supplied by the user/accountant; this helper does not infer it.
 */
export function buildAssetAcquisitionVoucherLines({
  supplierLedgerId,
  assetLedgerId,
  gstLedgerId = null,
  purchaseValue,
  gstTotal = 0,
  gstRecoverable = false,
  capitalizedCost,
}) {
  const supplier = String(supplierLedgerId || "").trim();
  const asset = String(assetLedgerId || "").trim();
  const value = Number(purchaseValue || 0);
  const gst = Number(gstTotal || 0);
  const capCost = Number(capitalizedCost ?? value + (gstRecoverable ? 0 : gst));

  if (!supplier || !asset) throw new Error("Supplier and asset ledgers must be selected.");
  if (!Number.isFinite(value) || value <= 0) throw new Error("Purchase value must be greater than zero.");
  if (!Number.isFinite(gst) || gst < 0) throw new Error("GST amount cannot be negative.");
  if (gstRecoverable && gst > 0 && !String(gstLedgerId || "").trim()) {
    throw new Error("Select an Input GST ledger when GST is marked recoverable.");
  }
  if (!Number.isFinite(capCost) || capCost <= 0) throw new Error("Capitalized cost must be greater than zero.");

  const lines = [];
  if (gstRecoverable) {
    lines.push({ ledger_id: asset, debit: value, credit: 0, line_narration: "Fixed asset acquisition" });
    if (gst > 0) lines.push({ ledger_id: gstLedgerId, debit: gst, credit: 0, line_narration: "Recoverable input GST" });
  } else {
    lines.push({ ledger_id: asset, debit: capCost, credit: 0, line_narration: "Fixed asset acquisition (GST capitalized)" });
  }
  lines.push({ ledger_id: supplier, debit: 0, credit: value + gst, line_narration: "Supplier payable" });

  const debit = lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
  const credit = lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);
  if (Math.abs(debit - credit) > 0.005) {
    throw new Error("Acquisition voucher is not balanced. Review GST treatment and capitalized cost.");
  }
  return lines;
}

export async function createAndPostAssetAcquisitionVoucher(companyId, header, ledgerMapping, totals) {
  const lines = buildAssetAcquisitionVoucherLines({ ...ledgerMapping, ...totals });
  const voucher = await createVoucher(companyId, {
    voucher_type: header.voucher_type || "Journal",
    voucher_date: header.voucher_date,
    reference_number: header.reference_number || null,
    narration: header.narration || "Fixed asset acquisition",
    source_module: "fixed_assets",
    source_record_id: header.source_record_id || null,
  }, lines);
  return await postVoucher(companyId, voucher.id);
}

/** Payment voucher lines: debit supplier, credit selected cash/bank ledger. */
export function buildAssetSupplierPaymentLines({ supplierLedgerId, paymentLedgerId, amount, narration = "Payment for fixed asset acquisition" }) {
  const supplier = String(supplierLedgerId || "").trim();
  const payment = String(paymentLedgerId || "").trim();
  const value = Number(amount);
  if (!supplier || !payment) throw new Error("Supplier and cash/bank ledgers must be selected.");
  if (!Number.isFinite(value) || value <= 0) throw new Error("Payment amount must be greater than zero.");
  return [
    { ledger_id: supplier, debit: value, credit: 0, line_narration: narration },
    { ledger_id: payment, debit: 0, credit: value, line_narration: narration },
  ];
}

/** Create and post the voucher for a supplier payment linked to an asset acquisition. */
export async function createAndPostAssetSupplierPaymentVoucher(companyId, header, mapping, amount) {
  const lines = buildAssetSupplierPaymentLines({
    supplierLedgerId: mapping.supplierLedgerId,
    paymentLedgerId: mapping.paymentLedgerId,
    amount,
    narration: header.narration || "Payment for fixed asset acquisition",
  });
  const voucher = await createVoucher(companyId, {
    voucher_type: header.voucher_type || "Payment",
    voucher_date: header.voucher_date,
    reference_number: header.reference_number || null,
    narration: header.narration || "Payment for fixed asset acquisition",
    source_module: "fixed_assets",
    source_record_id: header.source_record_id || null,
  }, lines);
  return await postVoucher(companyId, voucher.id);
}
