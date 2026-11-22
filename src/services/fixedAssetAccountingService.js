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
    // Non-recoverable GST is capitalized: asset debit must equal gross supplier invoice.
    if (Math.abs(capCost - (value + gst)) > 0.02) {
      throw new Error("When GST is not recoverable, capitalized cost must equal purchase value plus GST.");
    }
    lines.push({ ledger_id: asset, debit: value + gst, credit: 0, line_narration: "Fixed asset acquisition (GST capitalized)" });
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

/** Balanced monthly depreciation voucher: depreciation expense debit, accumulated depreciation credit. */
export function buildDepreciationVoucherLines({ depreciationExpenseLedgerId, accumulatedDepreciationLedgerId, amount, narration = "Fixed asset depreciation" }) {
  const expense = String(depreciationExpenseLedgerId || "").trim();
  const accumulated = String(accumulatedDepreciationLedgerId || "").trim();
  const value = Number(amount);
  if (!expense || !accumulated) throw new Error("Select depreciation expense and accumulated depreciation ledgers.");
  if (!Number.isFinite(value) || value <= 0) throw new Error("Depreciation amount must be positive.");
  return [
    { ledger_id: expense, debit: value, credit: 0, line_narration: narration },
    { ledger_id: accumulated, debit: 0, credit: value, line_narration: narration },
  ];
}

export async function createAndPostDepreciationVoucher(companyId, header, mapping, amount) {
  const lines = buildDepreciationVoucherLines({ ...mapping, amount, narration: header.narration });
  const voucher = await createVoucher(companyId, {
    voucher_type: header.voucher_type || "Journal", voucher_date: header.voucher_date,
    reference_number: header.reference_number || null,
    narration: header.narration || "Fixed asset depreciation", source_module: "fixed_assets",
    source_record_id: header.source_record_id || null,
  }, lines);
  return await postVoucher(companyId, voucher.id);
}


/** Balanced disposal lines for a single asset. Any gain/loss is calculated against NBV. */
export function buildAssetDisposalVoucherLines({ assetLedgerId, accumulatedDepreciationLedgerId, proceedsLedgerId, gainLedgerId, lossLedgerId, assetCost, accumulatedDepreciation, saleProceeds, narration = "Fixed asset disposal" }) {
  const assetLedger = String(assetLedgerId || "").trim();
  const accumulatedLedger = String(accumulatedDepreciationLedgerId || "").trim();
  const proceedsLedger = String(proceedsLedgerId || "").trim();
  const cost = Number(assetCost), accumulated = Number(accumulatedDepreciation || 0), proceeds = Number(saleProceeds || 0);
  if (!assetLedger || !accumulatedLedger || !proceedsLedger) throw new Error("Select asset, accumulated depreciation, and proceeds ledgers.");
  if (![cost, accumulated, proceeds].every(Number.isFinite) || cost <= 0 || accumulated < 0 || accumulated > cost || proceeds < 0) throw new Error("Invalid disposal amounts.");
  const nbv = cost - accumulated, gain = proceeds - nbv, lines = [];
  lines.push({ ledger_id: proceedsLedger, debit: proceeds, credit: 0, line_narration: narration });
  if (accumulated > 0) lines.push({ ledger_id: accumulatedLedger, debit: accumulated, credit: 0, line_narration: "Accumulated depreciation cleared" });
  lines.push({ ledger_id: assetLedger, debit: 0, credit: cost, line_narration: "Asset cost removed" });
  if (gain > 0.005) {
    const ledger = String(gainLedgerId || "").trim();
    if (!ledger) throw new Error("Select a gain-on-disposal ledger for a profitable disposal.");
    lines.push({ ledger_id: ledger, debit: 0, credit: gain, line_narration: "Gain on disposal" });
  } else if (gain < -0.005) {
    const ledger = String(lossLedgerId || "").trim();
    if (!ledger) throw new Error("Select a loss-on-disposal ledger for a disposal loss.");
    lines.push({ ledger_id: ledger, debit: Math.abs(gain), credit: 0, line_narration: "Loss on disposal" });
  }
  const debits = lines.reduce((s, l) => s + Number(l.debit || 0), 0), credits = lines.reduce((s, l) => s + Number(l.credit || 0), 0);
  if (Math.abs(debits - credits) > 0.02) throw new Error("Disposal voucher lines did not balance.");
  return lines;
}

export async function createAndPostAssetDisposalVoucher(companyId, header, mapping, amounts) {
  const lines = buildAssetDisposalVoucherLines({ ...mapping, ...amounts, narration: header.narration });
  const voucher = await createVoucher(companyId, {
    voucher_type: header.voucher_type || "Journal", voucher_date: header.voucher_date,
    reference_number: header.reference_number || null,
    narration: header.narration || "Fixed asset disposal", source_module: "fixed_assets",
    source_record_id: header.source_record_id || null,
  }, lines);
  return await postVoucher(companyId, voucher.id);
}
