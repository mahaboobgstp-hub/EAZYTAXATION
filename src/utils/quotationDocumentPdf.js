import jsPDF from "jspdf";
import { supabase } from "../supabase/supabaseClient";

const n = value => Number(value) || 0;
const clean = value => String(value ?? "").replace(/[\\r\\n]+/g, " ").trim();
const money = value => "INR " + n(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const date = value => {
  if (!value) return "—";
  const parsed = new Date(String(value).slice(0, 10) + "T00:00:00");
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const NAVY = [20, 43, 74], BLUE = [31, 91, 190], PALE = [239, 244, 250];
const TEXT = [37, 51, 70], MUTED = [99, 113, 132], BORDER = [218, 226, 236], WHITE = [255,255,255];

function storageObjectFromUrl(value) {
  try {
    const url = new URL(value);
    const marker = "/storage/v1/object/public/";
    const index = url.pathname.indexOf(marker);
    if (index < 0) return null;
    const parts = decodeURIComponent(url.pathname.slice(index + marker.length)).split("/");
    const bucket = parts.shift();
    return bucket && parts.length ? { bucket, path: parts.join("/") } : null;
  } catch { return null; }
}

async function blobToImage(blob) {
  if (!blob) return null;
  let data;
  try {
    data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    let width = 1, height = 1;
    if (typeof createImageBitmap === "function") {
      const bitmap = await createImageBitmap(blob);
      width = bitmap.width; height = bitmap.height; bitmap.close();
    }
    let format = blob.type.toLowerCase().includes("png") ? "PNG" : "JPEG";
    if (!["image/png", "image/jpeg"].includes(blob.type.toLowerCase())) {
      const image = new Image();
      image.src = data;
      await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; });
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
      canvas.getContext("2d").drawImage(image, 0, 0);
      data = canvas.toDataURL("image/png"); format = "PNG";
      width = canvas.width; height = canvas.height;
    }
    return { data, format, width, height };
  } catch (error) {
    console.warn("Quotation image conversion failed:", error);
    return null;
  }
}

async function loadImage(url) {
  if (!url) return null;
  try {
    if (String(url).startsWith("data:image/")) {
      const response = await fetch(url);
      return blobToImage(await response.blob());
    }
    const object = storageObjectFromUrl(String(url));
    if (object) {
      const { data, error } = await supabase.storage.from(object.bucket).download(object.path);
      if (!error && data) return await blobToImage(data);
      console.warn("Quotation image storage download failed:", error);
    }
    const response = await fetch(url);
    if (!response.ok) throw new Error("Image request returned " + response.status);
    return await blobToImage(await response.blob());
  } catch (error) {
    console.warn("Quotation branding image could not be loaded:", error);
    return null;
  }
}

function addImageFit(pdf, image, x, y, width, height) {
  if (!image?.data) return;
  const scale = Math.min(width / image.width, height / image.height);
  const w = image.width * scale, h = image.height * scale;
  try { pdf.addImage(image.data, image.format, x + (width-w)/2, y + (height-h)/2, w, h, undefined, "FAST"); }
  catch (error) { console.warn("Quotation image render failed:", error); }
}

function writeWrapped(pdf, value, x, y, width, size = 8, color = TEXT, bold = false, maxLines = 20) {
  const text = clean(value);
  if (!text) return y;
  pdf.setFont("helvetica", bold ? "bold" : "normal");
  pdf.setFontSize(size);
  pdf.setTextColor(...color);
  const lines = pdf.splitTextToSize(text, width).slice(0, maxLines);
  pdf.text(lines, x, y);
  return y + lines.length * (size * 0.43 + 0.9);
}

export async function createQuotationPdf({ document, items = [], company = {}, customer = {}, settings = {} }) {
  const [logo, signature] = await Promise.all([
    settings.show_logo && settings.logo_url ? loadImage(settings.logo_url) : Promise.resolve(null),
    settings.show_signature && settings.signature_url ? loadImage(settings.signature_url) : Promise.resolve(null)
  ]);
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  const W = 210, H = 297, M = 13, CW = W - 2 * M;
  const fileName = String(document.invoice_no || "quotation").replace(/[^a-z0-9._-]/gi, "_") + ".pdf";
  pdf.setProperties({ title: "Quotation " + clean(document.invoice_no), subject: "Sales quotation", author: clean(company.company_name || "SYD Billing & Accounting") });
  let y = 13;
  const footer = page => {
    pdf.setDrawColor(...BORDER); pdf.setLineWidth(.25); pdf.line(M, 285, W-M, 285);
    const footerText = settings.show_footer && clean(settings.invoice_footer) ? clean(settings.invoice_footer) : "This quotation is an offer only and is not a tax invoice.";
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(6.8); pdf.setTextColor(...MUTED);
    pdf.text(pdf.splitTextToSize(footerText, CW-25).slice(0,1), M, 290);
    pdf.text("Page " + page, W-M, 290, { align: "right" });
  };
  const addPage = () => {
    footer(pdf.getNumberOfPages());
    pdf.addPage();
    y = 15;
    pdf.setFont("helvetica","bold"); pdf.setFontSize(8); pdf.setTextColor(...NAVY);
    pdf.text(clean(company.company_name || "Company"), M, y);
    pdf.setDrawColor(...BORDER); pdf.line(M,y+3,W-M,y+3);
    y += 12;
  };
  const ensure = height => { if (y + height > 274) addPage(); };

  // Branded business header: use the same stored logo/signature configured for sales invoices.
  if (logo) addImageFit(pdf, logo, M, y, 27, 22);
  const textX = logo ? M + 32 : M;
  const textW = W - M - textX;
  let headerY = y + 5;
  headerY = writeWrapped(pdf, company.company_name || "Company", textX, headerY, textW, 14, NAVY, true, 2) + 1;
  const address = [company.address, company.address_line1, company.city, company.state, company.pincode].filter(Boolean).join(", ");
  headerY = writeWrapped(pdf, address, textX, headerY, textW, 7.3, MUTED, false, 2);
  const contact = [company.mobile ? "Phone: " + company.mobile : "", company.email ? "Email: " + company.email : ""].filter(Boolean).join("   |   ");
  headerY = writeWrapped(pdf, contact, textX, headerY, textW, 7, MUTED, false, 2);
  const gstin = company.gstin || company.gst_number || company.gst_no || "";
  const pan = company.pan || company.pan_number || "";
  writeWrapped(pdf, [gstin ? "GSTIN: " + gstin : "", pan ? "PAN: " + pan : ""].filter(Boolean).join("   |   "), textX, headerY, textW, 7, TEXT, true, 1);
  y = Math.max(y + 25, headerY + 5);
  pdf.setDrawColor(...BLUE); pdf.setLineWidth(.7); pdf.line(M,y,W-M,y);
  y += 5;
  pdf.setFillColor(...NAVY); pdf.roundedRect(M,y,CW,12,2,2,"F");
  pdf.setFont("helvetica","bold"); pdf.setFontSize(14); pdf.setTextColor(...WHITE);
  pdf.text("QUOTATION",W/2,y+7.8,{align:"center"});
  y += 18;

  // Quote reference and customer details.
  const gap = 5, cardW = (CW-gap)/2, cardH = 37, rightX = M+cardW+gap;
  pdf.setFillColor(...PALE); pdf.setDrawColor(...BORDER);
  pdf.roundedRect(M,y,cardW,cardH,2,2,"FD");
  pdf.roundedRect(rightX,y,cardW,cardH,2,2,"FD");
  pdf.setFont("helvetica","bold"); pdf.setFontSize(7.5); pdf.setTextColor(...BLUE);
  pdf.text("QUOTATION DETAILS",M+4,y+6);
  pdf.text("QUOTATION FOR",rightX+4,y+6);
  let ly=y+13;
  [["Quotation No.",document.invoice_no],["Date",date(document.invoice_date)],["Valid Until",date(document.valid_until)]].forEach(([label,value])=>{
    pdf.setFont("helvetica","normal"); pdf.setFontSize(7); pdf.setTextColor(...MUTED); pdf.text(label,M+4,ly);
    pdf.setFont("helvetica","bold"); pdf.setTextColor(...TEXT); pdf.text(clean(value || "—"),M+32,ly,{maxWidth:cardW-36}); ly+=7;
  });
  const customerName = customer.customer_name || document.customer_name || "—";
  let cy = writeWrapped(pdf,customerName,rightX+4,y+14,cardW-8,9,TEXT,true,2);
  const customerAddress = customer.billing_address || customer.address || customer.customer_address || customer.address_line1 || "";
  cy = writeWrapped(pdf,customerAddress,rightX+4,cy+1,cardW-8,7,MUTED,false,2);
  const customerGstin = customer.gstin || customer.gst_number || "";
  const customerState = customer.state || customer.state_name || "";
  writeWrapped(pdf,[customerGstin ? "GSTIN: "+customerGstin : "",customerState ? "State: "+customerState : ""].filter(Boolean).join("   |   "),rightX+4,cy+1,cardW-8,6.8,TEXT,true,1);
  y += cardH+8;

  // Readable line-item table. GST and CESS rates are shown separately.
  const widths = [8, 58, 20, 12, 22, 22, 18, 24];
  const headers = ["#","Description","HSN/SAC","Qty","Rate (INR)","GST %","CESS %","Amount (INR)"];
  const drawTableHeader = () => {
    pdf.setFillColor(...NAVY); pdf.rect(M,y,CW,9,"F");
    pdf.setFont("helvetica","bold"); pdf.setFontSize(6.8); pdf.setTextColor(...WHITE);
    let x=M;
    headers.forEach((label,i)=>{pdf.text(label,x+(i===1?2:widths[i]/2),y+5.8,{align:i===1?"left":"center",maxWidth:widths[i]-1});x+=widths[i];});
    y+=9;
  };
  drawTableHeader();
  items.forEach((item,index)=>{
    const description = clean(item.item_name || item.particulars || item.description || "—");
    const descLines = pdf.splitTextToSize(description,widths[1]-4);
    const rowH = Math.max(11,descLines.length*4+4);
    ensure(rowH+1);
    if (y===15) drawTableHeader();
    if (index%2===0) {pdf.setFillColor(248,250,253);pdf.rect(M,y,CW,rowH,"F");}
    pdf.setDrawColor(...BORDER);pdf.setLineWidth(.2);pdf.rect(M,y,CW,rowH);
    let x=M;for(let i=1;i<widths.length;i++){x+=widths[i-1];pdf.line(x,y,x,y+rowH);}
    const values=[String(index+1),description,clean(item.hsn_sac || item.hsn_code),String(n(item.qty)),money(item.rate).replace("INR ",""),n(item.gst_rate)+"%",n(item.cess_rate)+"%",money(item.amount).replace("INR ","")];
    x=M;
    values.forEach((value,i)=>{
      pdf.setFont("helvetica","normal");pdf.setFontSize(6.8);pdf.setTextColor(...TEXT);
      if(i===1) pdf.text(descLines.slice(0,4),x+2,y+5);
      else pdf.text(value,x+widths[i]/2,y+rowH/2+1,{align:"center",maxWidth:widths[i]-1});
      x+=widths[i];
    });
    y+=rowH;
  });
  y+=7;

  // Tax calculation summary.
  const taxRows=[["Taxable value",document.taxable_value],["CGST",document.cgst],["SGST",document.sgst],["IGST",document.igst],["CESS",document.cess_amount]];
  const showTax=taxRows.some(([,value])=>n(value)!==0)||items.some(item=>n(item.gst_rate)!==0||n(item.cess_rate)!==0);
  if(showTax){
    ensure(43);
    pdf.setFillColor(...PALE);pdf.setDrawColor(...BORDER);pdf.roundedRect(W-M-83,y-2,83,39,2,2,"FD");
    taxRows.forEach(([label,value])=>{
      pdf.setFont("helvetica","normal");pdf.setFontSize(7.2);pdf.setTextColor(...MUTED);pdf.text(label,W-M-79,y+4);
      pdf.setTextColor(...TEXT);pdf.text(money(value),W-M-4,y+4,{align:"right"});y+=6;
    });
  }
  ensure(16);
  pdf.setFillColor(...NAVY);pdf.roundedRect(W-M-83,y-1,83,12,1.5,1.5,"F");
  pdf.setFont("helvetica","bold");pdf.setFontSize(9.2);pdf.setTextColor(...WHITE);
  pdf.text("GRAND TOTAL",W-M-79,y+6.8);
  pdf.text(money(document.total_amount),W-M-4,y+6.8,{align:"right"});
  y+=18;

  const terms=settings.show_terms_conditions ? clean(settings.terms_conditions) : "";
  const bank=settings.show_bank_details ? [["Bank",settings.bank_name],["Account",settings.account_number],["IFSC",settings.ifsc_code],["UPI",settings.upi_id]].filter(([,value])=>clean(value)) : [];
  const termsLines=terms ? pdf.splitTextToSize(terms,82) : [];
  const notesHeight=Math.max(terms ? Math.min(42,termsLines.length*3.8+12) : 0,bank.length ? 31 : 0,0);
  if(terms || bank.length){
    ensure(notesHeight+12);
    const half=(CW-5)/2;
    if(terms){
      pdf.setFillColor(248,250,253);pdf.setDrawColor(...BORDER);pdf.roundedRect(M,y,half,notesHeight,2,2,"FD");
      pdf.setFont("helvetica","bold");pdf.setFontSize(7.2);pdf.setTextColor(...BLUE);pdf.text("TERMS & CONDITIONS",M+4,y+6);
      writeWrapped(pdf,terms,M+4,y+12,half-8,6.8,MUTED,false,8);
    }
    if(bank.length){
      const bx=M+half+5;
      pdf.setFillColor(248,250,253);pdf.setDrawColor(...BORDER);pdf.roundedRect(bx,y,half,notesHeight,2,2,"FD");
      pdf.setFont("helvetica","bold");pdf.setFontSize(7.2);pdf.setTextColor(...BLUE);pdf.text("BANK DETAILS",bx+4,y+6);
      let by=y+13;bank.forEach(([label,value])=>{pdf.setFont("helvetica","normal");pdf.setFontSize(6.6);pdf.setTextColor(...MUTED);pdf.text(label,bx+4,by);pdf.setTextColor(...TEXT);pdf.text(clean(value),bx+26,by,{maxWidth:half-30});by+=5;});
    }
    y+=notesHeight+7;
  }

  ensure(28);
  if(signature) addImageFit(pdf,signature,W-M-49,y,42,15);
  const signY=y+18;
  pdf.setDrawColor(...BORDER);pdf.line(W-M-55,signY,W-M,signY);
  pdf.setFont("helvetica","bold");pdf.setFontSize(7.2);pdf.setTextColor(...TEXT);
  pdf.text("Authorized Signatory",W-M-27.5,signY+5,{align:"center"});

  for(let page=1;page<=pdf.getNumberOfPages();page++){pdf.setPage(page);footer(page);}
  return { blob: pdf.output("blob"), fileName };
}
