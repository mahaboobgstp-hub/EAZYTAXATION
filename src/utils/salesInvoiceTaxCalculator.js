const number = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const money = (value) =>
  Math.round((number(value) + Number.EPSILON) * 100) / 100;

export function calculateSalesInvoiceTax({
  items = [],
  taxInclusive = false,
  discountType = "AMOUNT",
  discountValue = 0,
  intraState = true,
  otherAmount = 0,
  roundOff = 0
}) {
  const preparedItems = items.map((item) => {
    const qty = number(item.qty);
    const enteredRate = number(item.rate);
    const gstRate = number(item.gst_rate);
    const cessRate = number(item.cess_rate);
    // The entered rate includes GST and percentage-based cess
    // only when taxInclusive is selected.
    const percentageTaxRate = gstRate + cessRate;

    const taxableBeforeDiscount = taxInclusive
      ? (enteredRate * qty) / (1 + percentageTaxRate / 100)
      : enteredRate * qty;

    const cessBeforeDiscount =
      taxableBeforeDiscount * cessRate / 100;

    const gstBeforeDiscount =
      taxableBeforeDiscount * gstRate / 100;

    return {
      ...item,
      qty,
      taxableBeforeDiscount,
      gstBeforeDiscount,
      cessBeforeDiscount
    };
  });

  const grossTaxable = preparedItems.reduce(
    (sum, item) => sum + item.taxableBeforeDiscount,
    0
  );

  const discountInput = number(discountValue);

  const discountAmount = discountType === "PERCENT"
    ? grossTaxable * discountInput / 100
    : discountInput;

  const actualDiscount = Math.min(
    Math.max(discountAmount, 0),
    grossTaxable
  );

  const discountRatio = grossTaxable > 0
    ? actualDiscount / grossTaxable
    : 0;

  const calculatedItems = preparedItems.map((item) => {
    const lineDiscount =
      item.taxableBeforeDiscount * discountRatio;

    const taxableAmount =
      item.taxableBeforeDiscount - lineDiscount;

    const cgstAmount = intraState
      ? taxableAmount * number(item.gst_rate) / 200
      : 0;

    const sgstAmount = intraState
      ? taxableAmount * number(item.gst_rate) / 200
      : 0;

    const igstAmount = intraState
      ? 0
      : taxableAmount * number(item.gst_rate) / 100;

    const cessAmount =
      taxableAmount * number(item.cess_rate) / 100;

    return {
      ...item,
      discount_amount: money(lineDiscount),
      taxable_amount: money(taxableAmount),
      cgst_amount: money(cgstAmount),
      sgst_amount: money(sgstAmount),
      igst_amount: money(igstAmount),
      cess_amount: money(cessAmount),
      amount: money(taxableAmount)
    };
  });

  const totals = calculatedItems.reduce(
    (sum, item) => ({
      taxable: sum.taxable + item.taxable_amount,
      cgst: sum.cgst + item.cgst_amount,
      sgst: sum.sgst + item.sgst_amount,
      igst: sum.igst + item.igst_amount,
      cess: sum.cess + item.cess_amount,
    }),
    {
      taxable: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      cess: 0
    }
  );

  const totalBeforeRoundOff =
    totals.taxable +
    totals.cgst +
    totals.sgst +
    totals.igst +
    totals.cess +
    number(otherAmount);

  return {
    items: calculatedItems,
    totals: {
      taxable: money(totals.taxable),
      cgst: money(totals.cgst),
      sgst: money(totals.sgst),
      igst: money(totals.igst),
      cess: money(totals.cess),
      discount: money(actualDiscount),
      otherAmount: money(otherAmount),
      roundOff: money(roundOff),
      grandTotal: money(totalBeforeRoundOff + number(roundOff))
    }
  };
}
