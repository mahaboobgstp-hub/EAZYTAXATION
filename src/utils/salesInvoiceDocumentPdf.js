import jsPDF from "jspdf";

const n = value => Number(value) || 0;
const money = value => "INR " + n(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const clean = value => String(value || "—").replace(/[\r\n]+/g, " ");

export function createSalesInvoicePdf({ document, items = [], company = {} }) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const w = pdf.internal.pageSize.getWidth();
  const h = pdf.internal.pageSize.getHeight();
  const m = 14;
  let y = 18;
  pdf.setTextColor(18, 39, 68);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text(clean(company.company_name || "Company"), m, y);
  y += 7;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.text(pdf.splitTextToSize(clean(company.address || ""), w - 2 * m), m, y);
  y += 12;
  pdf.setFillColor(18, 57, 102);
  pdf.roundedRect(m, y, w - 2 * m, 10, 2, 2, "F");
  pdf.setTextColor(255,255,255);
  pdf.setFont("helvetica","bold");
  pdf.setFontSize(12);
  pdf.text("TAX INVOICE", w / 2, y + 6.5, { align: "center" });
  y += 18;
  pdf.setTextColor(25,40,60);
  pdf.setFontSize(9);
  pdf.text("Invoice No.: " + clean(document.invoice_no), m, y);
  pdf.text("Date: " + clean(document.invoice_date), w - m, y, { align: "right" });
  y += 7;
  pdf.text("Bill To: " + clean(document.customer_name), m, y);
  y += 10;
  pdf.setFillColor(235,242,251);
  pdf.rect(m, y, w - 2*m, 8, "F");
  pdf.setFont("helvetica","bold");
  pdf.setFontSize(8);
  pdf.text("#", m+2, y+5.5);
  pdf.text("Item / Description", m+10, y+5.5);
  pdf.text("Qty", m+112, y+5.5);
  pdf.text("Rate", m+130, y+5.5);
  pdf.text("Amount", w-m-2, y+5.5, {align:"right"});
  y += 10;
  pdf.setFont("helvetica","normal");
  items.forEach((item,index) => {
    if (y > h-42) { pdf.addPage(); y=18; }
    const description = pdf.splitTextToSize(clean(item.item_name || item.particulars), 90);
    pdf.text(String(index+1),m+2,y);
    pdf.text(description,m+10,y);
    pdf.text(String(n(item.qty)),m+112,y);
    pdf.text(money(item.rate),m+130,y);
    pdf.text(money(item.amount),w-m-2,y,{align:"right"});
    y += Math.max(7,description.length*4+3);
    pdf.setDrawColor(220,228,237);pdf.line(m,y,w-m,y);
  });
  y += 8;
  const totals = [["Taxable Value",document.taxable_value],["CGST",document.cgst],["SGST",document.sgst],["IGST",document.igst],["Grand Total",document.total_amount]];
  totals.forEach(([label,value]) => { pdf.setFont("helvetica",label==="Grand Total"?"bold":"normal");pdf.setFontSize(9);pdf.text(label,w-m-65,y);pdf.text(money(value),w-m,y,{align:"right"});y+=6; });
  const name = String(document.invoice_no || "sales-invoice").replace(/[^a-z0-9._-]/gi,"_") + ".pdf";
  return { blob: pdf.output("blob"), fileName: name };
}
