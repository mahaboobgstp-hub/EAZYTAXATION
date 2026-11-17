import jsPDF from "jspdf";

const n = value => Number(value) || 0;
const clean = value => String(value ?? "").replace(/[\\r\\n]+/g, " ").trim();
const money = value => "₹ " + n(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const date = value => {
  if (!value) return "—";
  const parsed = new Date(String(value).slice(0, 10) + "T00:00:00");
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const NAVY = [13, 48, 98], BLUE = [35, 92, 205], PALE = [235, 242, 253];
const TEXT = [35, 47, 66], MUTED = [91, 105, 125], BORDER = [205, 216, 232];

async function loadImage(url) {
  if (!url) return null;
  try {
    if (String(url).startsWith("data:image/")) return { data: url, format: /image\\/png/i.test(url) ? "PNG" : "JPEG" };
    const response = await fetch(url, { mode: "cors" });
    if (!response.ok) return null;
    const blob = await response.blob();
    const data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    return { data, format: blob.type.toLowerCase().includes("png") ? "PNG" : "JPEG" };
  } catch (error) {
    console.warn("Quotation branding image could not be loaded:", error);
    return null;
  }
}
function addImage(pdf, image, x, y, w, h) {
  if (!image?.data) return;
  try { pdf.addImage(image.data, image.format, x, y, w, h, undefined, "FAST"); } catch (error) { console.warn("Quotation image render failed", error); }
}
function wrapped(pdf, value, x, y, width, size = 7, color = TEXT, bold = false) {
  const text = clean(value);
  if (!text) return y;
  pdf.setFont("helvetica", bold ? "bold" : "normal");
  pdf.setFontSize(size);
  pdf.setTextColor(...color);
  const lines = pdf.splitTextToSize(text, width);
  pdf.text(lines, x, y);
  return y + lines.length * (size * .42 + .2);
}

export async function createQuotationPdf({ document, items = [], company = {}, customer = {}, settings = {} }) {
  const [logo, signature] = await Promise.all([
    settings.show_logo ? loadImage(settings.logo_url) : Promise.resolve(null),
    settings.show_signature ? loadImage(settings.signature_url) : Promise.resolve(null)
  ]);
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  const W = 210, H = 297, M = 13, CW = W - M * 2;
  const name = String(document.invoice_no || "quotation").replace(/[^a-z0-9._-]/gi, "_") + ".pdf";
  pdf.setProperties({ title: "Quotation " + clean(document.invoice_no), subject: "Sales quotation", author: clean(company.company_name || "SYD Billing & Accounting") });
  let y = 13, pageNo = 1;
  const footer = () => {
    pdf.setDrawColor(...BORDER); pdf.setLineWidth(.25); pdf.line(M, 286, W - M, 286);
    const footerText = settings.show_footer && clean(settings.invoice_footer) ? clean(settings.invoice_footer) : "This quotation is not a tax invoice.";
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(6.3); pdf.setTextColor(...MUTED);
    pdf.text(pdf.splitTextToSize(footerText, CW - 25).slice(0, 1), M, 291);
    pdf.text("Page " + pageNo, W - M, 291, { align: "right" });
  };
  const nextPage = () => { footer(); pdf.addPage(); pageNo += 1; y = 15; };
  const ensure = height => { if (y + height > 275) nextPage(); };

  // Branded company header, matching the SYD sales-invoice design language.
  addImage(pdf, logo, M, 12, 25, 22);
  const companyX = logo ? 43 : M;
  const companyW = W - M - companyX;
  y = wrapped(pdf, company.company_name || "Company", companyX, 17, companyW, 13, NAVY, true) + 1;
  y = wrapped(pdf, company.address, companyX, y, companyW, 7.2, MUTED);
  const contact = [company.mobile ? "Phone: " + company.mobile : "", company.email ? "Email: " + company.email : ""].filter(Boolean).join("   |   ");
  y = wrapped(pdf, contact, companyX, y + 1, companyW, 6.5, MUTED);
  const companyTax = [company.gstin ? "GSTIN: " + company.gstin : "", company.pan ? "PAN: " + company.pan : ""].filter(Boolean).join("   |   ");
  y = wrapped(pdf, companyTax, companyX, y + 1, companyW, 6.5, TEXT, true);
  y = Math.max(y + 3, 39);
  pdf.setDrawColor(...BLUE); pdf.setLineWidth(.5); pdf.line(M, y, W - M, y);
  y += 4;
  pdf.setFillColor(...NAVY); pdf.roundedRect(M, y, CW, 11, 1.8, 1.8, "F");
  pdf.setFont("helvetica", "bold"); pdf.setFontSize(13); pdf.setTextColor(255,255,255);
  pdf.text("QUOTATION", W / 2, y + 7.2, { align: "center" });
  y += 17;

  // Document and customer cards.
  const gap = 4, cardW = (CW - gap) / 2, cardH = 34, rightX = M + cardW + gap;
  pdf.setFillColor(...PALE); pdf.setDrawColor(...BORDER);
  pdf.roundedRect(M, y, cardW, cardH, 2, 2, "FD");
  pdf.roundedRect(rightX, y, cardW, cardH, 2, 2, "FD");
  pdf.setFont("helvetica", "bold"); pdf.setFontSize(7.2); pdf.setTextColor(...NAVY);
  pdf.text("QUOTATION DETAILS", M + 3, y + 5);
  pdf.text("QUOTATION FOR", rightX + 3, y + 5);
  let ly = y + 11;
  [["Quotation No.", document.invoice_no], ["Date", date(document.invoice_date)], ["Valid Until", date(document.valid_until)]].forEach(([label,value]) => {
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(6.5); pdf.setTextColor(...MUTED); pdf.text(label, M + 3, ly);
    pdf.setFont("helvetica", "bold"); pdf.setTextColor(...TEXT); pdf.text(clean(value || "—"), M + 31, ly, { maxWidth: cardW - 34 }); ly += 6;
  });
  let ry = y + 11;
  const customerName = customer.customer_name || document.customer_name || "—";
  ry = wrapped(pdf, customerName, rightX + 3, ry, cardW - 6, 8.2, TEXT, true) + 1;
  const customerAddress = customer.billing_address || customer.address || customer.customer_address || customer.address_line1 || "";
  ry = wrapped(pdf, customerAddress, rightX + 3, ry, cardW - 6, 6.4, MUTED);
  const customerTax = [customer.gstin ? "GSTIN: " + customer.gstin : "", customer.state ? "State: " + customer.state : ""].filter(Boolean).join("  |  ");
  wrapped(pdf, customerTax, rightX + 3, ry + 1, cardW - 6, 6.1, MUTED, true);
  y += cardH + 7;

  // Item table with HSN/SAC and GST rates.
  const widths = [7, 48, 18, 10, 10, 22, 14, 11, 44];
  const headers = ["#", "Description", "HSN/SAC", "Unit", "Qty", "Rate (₹)", "GST", "CESS", "Amount (₹)"];
  const drawHeader = () => {
    pdf.setFillColor(...NAVY); pdf.rect(M, y, CW, 8, "F");
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(6.2); pdf.setTextColor(255,255,255);
    let x = M; headers.forEach((h,i) => { pdf.text(h, x + (i === 1 ? 2 : widths[i] / 2), y + 5.2, { align: i === 1 ? "left" : "center", maxWidth: widths[i] - 1 }); x += widths[i]; });
    y += 8;
  };
  drawHeader();
  items.forEach((item,index) => {
    const desc = clean(item.item_name || item.particulars || item.description || "—");
    const descLines = pdf.splitTextToSize(desc, widths[1] - 3);
    const rowH = Math.max(9, descLines.length * 3.4 + 3);
    if (y + rowH > 266) { nextPage(); drawHeader(); }
    if (index % 2 === 0) { pdf.setFillColor(248,250,253); pdf.rect(M,y,CW,rowH,"F"); }
    pdf.setDrawColor(...BORDER); pdf.setLineWidth(.18); pdf.rect(M,y,CW,rowH);
    let x = M; for (let i=1;i<widths.length;i++){ x += widths[i-1]; pdf.line(x,y,x,y+rowH); }
    const values = [String(index+1), desc, clean(item.hsn_sac), clean(item.unit), String(n(item.qty)), money(item.rate).replace("₹ ",""), n(item.gst_rate)+"%", n(item.cess_rate)+"%", money(item.amount)];
    x = M;
    values.forEach((value,i) => {
      pdf.setFont("helvetica", i===1 ? "normal" : "normal"); pdf.setFontSize(6.4); pdf.setTextColor(...TEXT);
      if (i===1) pdf.text(descLines.slice(0,5), x+2, y+4.2);
      else pdf.text(value, x+widths[i]/2, y+rowH/2+1, {align:"center", maxWidth:widths[i]-1});
      x += widths[i];
    });
    y += rowH;
  });
  y += 7;
  const totals = [["Taxable Value", document.taxable_value], ["CGST", document.cgst], ["SGST", document.sgst], ["IGST", document.igst], ["CESS", document.cess_amount]];
  const showTax = totals.some(([,v]) => n(v) !== 0) || items.some(item => n(item.gst_rate) || n(item.cess_rate));
  if (showTax) {
    ensure(43);
    pdf.setFillColor(247,249,253); pdf.setDrawColor(...BORDER); pdf.roundedRect(W-M-82,y-2,82,39,2,2,"FD");
    totals.forEach(([label,value]) => {
      pdf.setFont("helvetica","normal"); pdf.setFontSize(7); pdf.setTextColor(...MUTED);
      pdf.text(label,W-M-78,y+4);
      pdf.setFont("helvetica","normal"); pdf.setTextColor(...TEXT);
      pdf.text(money(value),W-M-4,y+4,{align:"right"});
      y += 6;
    });
  }
  ensure(17);
  pdf.setFillColor(...NAVY); pdf.roundedRect(W-M-82,y-1,82,11,1.5,1.5,"F");
  pdf.setFont("helvetica","bold"); pdf.setFontSize(9); pdf.setTextColor(255,255,255);
  pdf.text("GRAND TOTAL",W-M-78,y+6.2);
  pdf.text(money(document.total_amount),W-M-4,y+6.2,{align:"right"});
  y += 17;

  const terms = settings.show_terms_conditions ? clean(settings.terms_conditions) : "";
  const bank = settings.show_bank_details ? [["Bank",settings.bank_name],["A/C No.",settings.account_number],["IFSC",settings.ifsc_code],["UPI",settings.upi_id]].filter(([,v]) => clean(v)) : [];
  const notesHeight = Math.max(28, bank.length ? 30 : 0, terms ? Math.min(38, pdf.splitTextToSize(terms, 82).length * 3 + 12) : 0);
  ensure(notesHeight + 12);
  if (terms || bank.length) {
    const half = (CW - 5) / 2;
    pdf.setFillColor(248,250,253); pdf.setDrawColor(...BORDER);
    if (terms) {
      pdf.roundedRect(M,y,half,notesHeight,2,2,"FD");
      pdf.setFont("helvetica","bold"); pdf.setFontSize(7); pdf.setTextColor(...NAVY); pdf.text("TERMS & CONDITIONS",M+3,y+5);
      wrapped(pdf,terms,M+3,y+10,half-6,6.2,MUTED);
    }
    if (bank.length) {
      const bx = M + half + 5;
      pdf.roundedRect(bx,y,half,notesHeight,2,2,"FD");
      pdf.setFont("helvetica","bold"); pdf.setFontSize(7); pdf.setTextColor(...NAVY); pdf.text("BANK DETAILS",bx+3,y+5);
      let by = y+10; bank.forEach(([label,value]) => { pdf.setFont("helvetica","normal"); pdf.setFontSize(6.2); pdf.setTextColor(...MUTED); pdf.text(label,bx+3,by); pdf.setTextColor(...TEXT); pdf.text(clean(value),bx+25,by,{maxWidth:half-28}); by += 4.5; });
    }
    y += notesHeight + 6;
  }
  if (settings.show_signature && signature?.data) {
    ensure(25);
    const sx = W - M - 55;
    addImage(pdf, signature, sx + 9, y, 37, 13);
    pdf.setDrawColor(...BORDER); pdf.line(sx, y+16, W-M, y+16);
    pdf.setFont("helvetica","bold"); pdf.setFontSize(7); pdf.setTextColor(...TEXT);
    pdf.text("Authorized Signatory",W-M-27.5,y+21,{align:"center"});
  } else {
    ensure(18);
    const sx = W-M-55; pdf.setDrawColor(...BORDER); pdf.line(sx,y+10,W-M,y+10);
    pdf.setFont("helvetica","normal"); pdf.setFontSize(6.5); pdf.setTextColor(...MUTED);
    pdf.text("Authorized Signatory",W-M-27.5,y+15,{align:"center"});
  }
  for(let p=1;p<=pdf.getNumberOfPages();p++){ pdf.setPage(p); if(p===pdf.getNumberOfPages()) footer(); else footer(); }
  return { blob: pdf.output("blob"), fileName: name };
}
