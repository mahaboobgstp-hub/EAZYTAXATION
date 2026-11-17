import jsPDF from "jspdf";

const n = value => Number(value) || 0;
const money = value => "INR " + n(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const clean = value => String(value || "—").replace(/[\r\n]+/g, " ");

export function createQuotationPdf({ document, items = [], company = {} }) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();
  const margin = 14;
  let y = 18;

  const heading = (text, size = 10) => {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(size);
    pdf.setTextColor(22, 48, 79);
    pdf.text(text, margin, y);
    y += size * 0.55 + 3;
  };
  const ensureSpace = amount => {
    if (y + amount > height - 18) { pdf.addPage(); y = 18; }
  };

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(17);
  pdf.setTextColor(18, 39, 68);
  pdf.text(clean(company.company_name || "Company"), margin, y);
  y += 7;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(90, 105, 125);
  const companyAddress = pdf.splitTextToSize(clean(company.address || company.billing_address || ""), width - margin * 2);
  pdf.text(companyAddress, margin, y);
  y += Math.max(7, companyAddress.length * 4 + 3);

  pdf.setFillColor(18, 57, 102);
  pdf.roundedRect(margin, y, width - margin * 2, 11, 2, 2, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.text("QUOTATION", width / 2, y + 7.2, { align: "center" });
  y += 19;

  pdf.setTextColor(35, 50, 70);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "bold");
  pdf.text("Quotation No.: " + clean(document.invoice_no), margin, y);
  pdf.setFont("helvetica", "normal");
  pdf.text("Date: " + clean(document.invoice_date), width - margin, y, { align: "right" });
  y += 7;
  pdf.text("Customer: " + clean(document.customer_name), margin, y);
  y += 7;
  pdf.text("Valid Until: " + clean(document.valid_until), margin, y);
  pdf.text("Rate Type: " + (document.tax_inclusive ? "With Tax (Inclusive)" : "Without Tax (Exclusive)"), width - margin, y, { align: "right" });
  y += 11;

  pdf.setFillColor(235, 242, 251);
  pdf.rect(margin, y, width - margin * 2, 8, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);
  pdf.setTextColor(45, 61, 82);
  const cols = [margin + 2, margin + 10, margin + 103, margin + 120, margin + 139, width - margin - 2];
  ["#", "Item / Description", "Qty", "Rate", "GST / CESS", "Amount"].forEach((label, i) => {
    pdf.text(label, cols[i], y + 5.5, i === 5 ? { align: "right" } : undefined);
  });
  y += 11;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  (items || []).forEach((item, index) => {
    ensureSpace(12);
    const description = pdf.splitTextToSize(clean(item.item_name || item.particulars), 86);
    pdf.text(String(index + 1), cols[0], y);
    pdf.text(description, cols[1], y);
    pdf.text(String(n(item.qty)), cols[2], y);
    pdf.text(money(item.rate), cols[3], y);
    pdf.text(n(item.gst_rate) + "% / " + n(item.cess_rate) + "%", cols[4], y);
    pdf.text(money(item.amount), cols[5], y, { align: "right" });
    y += Math.max(7, description.length * 4 + 3);
    pdf.setDrawColor(220, 228, 237);
    pdf.line(margin, y, width - margin, y);
  });

  y += 8;
  const totals = [
    ["Taxable Value", document.taxable_value],
    ["CGST", document.cgst],
    ["SGST", document.sgst],
    ["IGST", document.igst],
    ["CESS", document.cess_amount],
    ["Grand Total", document.total_amount],
  ];
  totals.forEach(([label, value]) => {
    ensureSpace(8);
    pdf.setFont("helvetica", label === "Grand Total" ? "bold" : "normal");
    pdf.setFontSize(label === "Grand Total" ? 11 : 9);
    pdf.setTextColor(35, 50, 70);
    pdf.text(label, width - margin - 65, y);
    pdf.text(money(value), width - margin, y, { align: "right" });
    y += 6;
  });

  ensureSpace(16);
  y += 5;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(95, 108, 125);
  pdf.text("This is a quotation and not a tax invoice.", margin, y);

  const fileName = String(document.invoice_no || "quotation").replace(/[^a-z0-9._-]/gi, "_") + ".pdf";
  return { blob: pdf.output("blob"), fileName };
}
