
/**
 * EAZYTAXATION
 * src/services/hr/salaryTdsCalculationService.js
 *
 * Tax slabs and policy values must be loaded from the selected,
 * approved policy. Do not hardcode annual tax rates here.
 */

const money = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const nonNegative = (value) => Math.max(0, Number(value) || 0);

export function calculateSlabTax(taxableIncome, slabs = []) {
  const income = nonNegative(taxableIncome);

  const orderedSlabs = [...slabs].sort(
    (a, b) => Number(a.income_from) - Number(b.income_from)
  );

  let tax = 0;

  for (const slab of orderedSlabs) {
    const lower = Number(slab.income_from);
    const upper =
      slab.income_to === null || slab.income_to === undefined
        ? Infinity
        : Number(slab.income_to);

    const taxableInThisSlab = Math.max(
      0,
      Math.min(income, upper) - lower
    );

    tax += taxableInThisSlab * (Number(slab.tax_rate_percent) / 100);
  }

  return money(tax);
}

export function calculateAnnualSalaryTax({
  policy,
  slabs,
  projectedGrossSalary,
  approvedExemptions = 0,
  approvedDeductions = 0,
  otherTaxableIncome = 0,
  surchargeAmount = 0,
  rebateAmount,
}) {
  if (!policy) {
    throw new Error("A salary TDS policy is required.");
  }

  if (!Array.isArray(slabs) || slabs.length === 0) {
    throw new Error("Tax slabs are missing for the selected policy.");
  }

  const gross = nonNegative(projectedGrossSalary);
  const exemptions = nonNegative(approvedExemptions);
  const deductions = nonNegative(approvedDeductions);
  const otherIncome = nonNegative(otherTaxableIncome);

  const standardDeduction = nonNegative(policy.standard_deduction);

  const salaryAfterExemptions = Math.max(0, gross - exemptions);

  const taxableIncome = Math.max(
    0,
    salaryAfterExemptions +
      otherIncome -
      standardDeduction -
      deductions
  );

  const slabTax = calculateSlabTax(taxableIncome, slabs);

  // The final policy engine must apply all statutory rebate conditions,
  // marginal relief, surcharge thresholds and caps before finalization.
  const rebate =
    rebateAmount === undefined
      ? 0
      : Math.min(slabTax, nonNegative(rebateAmount));

  const taxAfterRebate = Math.max(0, slabTax - rebate);

  const surcharge = nonNegative(surchargeAmount);
  const cessPercent = nonNegative(policy.cess_percent);

  const cess = money((taxAfterRebate + surcharge) * cessPercent / 100);

  const annualTax = money(taxAfterRebate + surcharge + cess);

  return {
    projectedGrossSalary: money(gross),
    taxableIncome: money(taxableIncome),
    slabTax: money(slabTax),
    rebate: money(rebate),
    surcharge: money(surcharge),
    cess,
    annualTax,
  };
}

export function calculateMonthlyTds({
  annualTax,
  tdsAlreadyDeducted = 0,
  monthsRemaining = 1,
}) {
  const remainingTax = Math.max(
    0,
    nonNegative(annualTax) - nonNegative(tdsAlreadyDeducted)
  );

  const periods = Math.max(1, Math.floor(Number(monthsRemaining) || 1));

  return {
    remainingTax: money(remainingTax),
    monthlyTds: money(remainingTax / periods),
  };
}
