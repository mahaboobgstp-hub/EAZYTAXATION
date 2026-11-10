import jsPDF from "jspdf";

const n = value => Number(value) || 0;
const inr = value => `INR ${n(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const clean = value => String(value || "—").replace(/[\r\n]+/g, " ");

export function downloadPurchasePdf({ kind, document, items = [], company = {} }) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();
  const margin = 14;
  const usable = width - margin * 2;
  const title = kind === "register" ? "TAX INVOICE" : kind === "orders" ? "PURCHASE ORDER" : kind === "returns" ? "PURCHASE RETURN" : "DEBIT NOTE";
  const number = document.invoice_no || document.order_no || document.return_no || document.debit_note_no || "Purchase Document";
  const date = document.invoice_date || document.order_date || document.return_date || document.debit_note_date || "";
  let y = 17;

  const paragraph = (value, x, top, maxWidth, fontSize = 9, style = "normal") => {
    pdf.setFont("helvetica", style);
    pdf.setFontSize(fontSize);
    const lines = pdf.splitTextToSize(clean(value), maxWidth);
    pdf.text(lines, x, top);
    return top + lines.length * (fontSize * 0.42) + 1.5;
  };

  const addTableHeader = () => {
    pdf.setFillColor(18, 57, 102);
    pdf.rect(margin, y, usable, 8, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.2);
    const cols = [
      ["#", margin + 2], ["Item / Description", margin + 10], ["HSN", margin + 76],
      ["Qty", margin + 98], ["Unit", margin + 111], ["Rate", margin + 126],
      ["GST %", margin + 151], ["Amount", margin + 165],
    ];
    cols.forEach(([label, x]) => pdf.text(label, x, y + 5.2));
    y += 8;
    pdf.setTextColor(28, 41, 60);
  };

  const addPage = () => {
    pdf.addPage();
    y = 17;
    paragraph(company.company_name || "Company", margin, y, usable, 12, "bold");
    y += 5;
    paragraph(company.address || "", margin, y, usable, 8);
    y += 3;
    paragraph(`${title} — Continued`, margin, y, usable, 10, "bold");
    y += 6;
    paragraph(`Document No.: ${number}     Date: ${date}`, margin, y, usable, 8);
    y += 7;
    addTableHeader();
  };

  pdf.setTextColor(20, 40, 67);
  y = paragraph(company.company_name || "Company", margin, y, usable * 0.65, 15, "bold");
  y = paragraph(company.address || "", margin, y, usable * 0.65, 8);
  y = paragraph(`GSTIN: ${company.gstin || "—"}`, margin, y, usable * 0.65, 8);
  y += 4;
  pdf.setFillColor(18, 57, 102);
  pdf.roundedRect(margin, y, usable, 10, 2, 2, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text(title, width / 2, y + 6.5, { align: "center" });
  y += 17;
  pdf.setTextColor(28, 41, 60);
  const colW = usable / 2 - 5;
  let leftY = paragraph(`Document No.: ${number}`, margin, y, colW, 9, "bold");
  leftY = paragraph(`Document Date: ${date}`, margin, leftY, colW, 9);
  if (document.supplier_invoice_no) leftY = paragraph(`Supplier Invoice: ${document.supplier_invoice_no}`, margin, leftY, colW, 9);
  if (document.original_purchase_invoice_no) leftY = paragraph(`Original Purchase Invoice: ${document.original_purchase_invoice_no}`, margin, leftY, colW, 9);
  let rightY = paragraph(`Supplier: ${document.vendor_name || "—"}`, margin + colW + 10, y, colW, 9, "bold");
  rightY = paragraph(`GSTIN: ${document.gstin || "—"}`, margin + colW + 10, rightY, colW, 9);
  rightY = paragraph(`State: ${document.vendor_state || "—"}`, margin + colW + 10, rightY, colW, 9);
  y = Math.max(leftY, rightY) + 6;
  if (document.reason) y = paragraph(`Reason: ${document.reason}`, margin, y, usable, 9) + 2;
  addTableHeader();

  items.forEach((item, index) => {
    const itemLines = pdf.splitTextToSize(clean(item.item_name), 62);
    const rowHeight = Math.max(8, itemLines.length * 4 + 3);
    if (y + rowHeight > height - 38) addPage();
    pdf.setDrawColor(220, 228, 237);
    pdf.line(margin, y + rowHeight, width - margin, y + rowHeight);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    const amount = item.line_total ?? item.amount ?? (n(item.taxable_value) + n(item.cgst_amount) + n(item.sgst_amount) + n(item.igst_amount));
    pdf.text(String(index + 1), margin + 2, y + 5);
    pdf.text(itemLines, margin + 10, y + 5);
    pdf.text(clean(item.hsn_sac).slice(0, 14), margin + 76, y + 5);
    pdf.text(String(n(item.qty)), margin + 98, y + 5);
    pdf.text(clean(item.uom).slice(0, 8), margin + 111, y + 5);
    pdf.text(n(item.rate).toFixed(2), margin + 126, y + 5);
    pdf.text(`${n(item.gst_rate)}%`, margin + 151, y + 5);
    pdf.text(n(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 }), width - margin - 2, y + 5, { align: "right" });
    y += rowHeight;
  });

  const taxable = document.taxable ?? document.taxable_value ?? items.reduce((s, item) => s + n(item.taxable_value), 0);
  const total = document.grand_total ?? document.total_amount ?? document.total_credit ?? 0;
  const summary = [
    ["Taxable Value", taxable], ["CGST", document.cgst], ["SGST", document.sgst],
    ["IGST", document.igst], ["Round Off", document.round_off],
  ];
  const summaryHeight = summary.length * 6 + 12;
  if (y + summaryHeight > height - 18) addPage();
  y += 6;
  summary.forEach(([label, value]) => {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text(label, width - margin - 64, y);
    pdf.text(inr(value), width - margin, y, { align: "right" });
    y += 5.5;
  });
  pdf.setFillColor(18, 57, 102);
  pdf.roundedRect(width - margin - 80, y, 80, 9, 1.5, 1.5, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text("Grand Total", width - margin - 77, y + 6);
  pdf.text(inr(total), width - margin - 3, y + 6, { align: "right" });

  const pageCount = pdf.getNumberOfPages();
  for (let page = 1; page <= pageCount; page++) {
    pdf.setPage(page);
    pdf.setDrawColor(205, 214, 225);
    pdf.line(margin, height - 10, width - margin, height - 10);
    pdf.setTextColor(100, 112, 130);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text(`Page ${page} of ${pageCount}`, width / 2, height - 5, { align: "center" });
  }
  const safeName = String(number).replace(/[^a-z0-9._-]/gi, "_");
  pdf.save(`${safeName}.pdf`);
}
