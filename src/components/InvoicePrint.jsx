import React, { useState } from "react";
import jsPDF from "jspdf";
import "../css/sales/InvoicePrint.css";
import { numberToWords } from "../utils/numberToWords";
import { formatAmount } from "../utils/amountFormatter";

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const PAGE_MARGIN = 12;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
const MAX_ITEMS_PER_PAGE = 22;
const NAVY = [13, 48, 98];
const BLUE = [35, 92, 205];
const LIGHT_BLUE = [235, 242, 253];
const TEXT = [35, 47, 66];
const MUTED = [91, 105, 125];
const BORDER = [205, 216, 232];

function safeText(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function invoiceDateLabel(value) {
  if (!value) return "";
  const parsed = new Date(String(value).slice(0, 10) + "T00:00:00");
  if (Number.isNaN(parsed.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(parsed);
}

function amount(value) {
  return formatAmount(Number(value) || 0);
}

function itemRowHeight(item) {
  const description = safeText(item?.item_name || item?.particulars);
  const estimatedLines = Math.min(4, Math.max(1, Math.ceil(description.length / 44)));
  return Math.max(5.5, estimatedLines * 3.2 + 2.4);
}

function sumHeights(items) {
  return items.reduce((sum, item) => sum + itemRowHeight(item), 0);
}

function paginateItems(items) {
  const source = Array.isArray(items) ? items : [];
  if (!source.length) return [[]];

  const pages = [];
  let offset = 0;
  while (offset < source.length) {
    const isFirst = pages.length === 0;
    const remaining = source.slice(offset);
    const finalCapacity = isFirst ? 88 : 135;
    const finalCountLimit = Math.min(MAX_ITEMS_PER_PAGE, remaining.length);

    if (remaining.length <= finalCountLimit && sumHeights(remaining) <= finalCapacity) {
      pages.push(remaining);
      break;
    }

    // If all remaining rows fit on one page by count but are too tall, reserve
    // the largest tail that fits with the final-page totals and closing area.
    if (remaining.length <= MAX_ITEMS_PER_PAGE) {
      let tailCount = 0;
      let tailHeight = 0;
      for (let index = remaining.length - 1; index >= 0 && tailCount < finalCountLimit; index -= 1) {
        const height = itemRowHeight(remaining[index]);
        if (tailHeight + height > finalCapacity) break;
        tailHeight += height;
        tailCount += 1;
      }
      if (isFirst && remaining.length > 13) {
        tailCount = Math.min(tailCount, remaining.length - 10);
      }
      if (tailCount > 0 && tailCount < remaining.length) {
        let leadingCount = remaining.length - tailCount;
        const nonFinalCapacity = isFirst ? 150 : 210;
        while (leadingCount > 1 && sumHeights(remaining.slice(0, leadingCount)) > nonFinalCapacity) leadingCount -= 1;
        pages.push(remaining.slice(0, leadingCount));
        offset += leadingCount;
        continue;
      }
    }

    const nonFinalCapacity = isFirst ? 150 : 210;
    let count = Math.min(MAX_ITEMS_PER_PAGE, remaining.length);
    while (count > 1 && sumHeights(remaining.slice(0, count)) > nonFinalCapacity) count -= 1;

    // Preserve at least four rows for a compact final summary page when there is room.
    if (remaining.length - count > MAX_ITEMS_PER_PAGE) {
      const minTailCount = Math.min(MAX_ITEMS_PER_PAGE, Math.max(4, Math.ceil(remaining.length * 0.22)));
      count = Math.min(count, remaining.length - minTailCount);
      while (count > 1 && sumHeights(remaining.slice(0, count)) > nonFinalCapacity) count -= 1;
    }
    if (count < 1) count = 1;
    pages.push(remaining.slice(0, count));
    offset += count;
  }
  return pages;
}

async function loadImage(url) {
  if (!url) return null;
  try {
    if (String(url).startsWith("data:image/")) {
      const match = String(url).match(/^data:image\/(png|jpeg|jpg);/i);
      return { data: url, format: match ? match[1].replace("jpg", "jpeg").toUpperCase() : "PNG" };
    }
    const response = await fetch(url, { mode: "cors" });
    if (!response.ok) return null;
    const blob = await response.blob();
    const data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    const format = blob.type.toLowerCase().includes("png") ? "PNG" : "JPEG";
    return { data, format };
  } catch (error) {
    console.warn("Invoice image could not be included in the PDF:", error);
    return null;
  }
}

function addPdfImage(pdf, image, x, y, width, height) {
  if (!image?.data) return;
  try {
    pdf.addImage(image.data, image.format, x, y, width, height, undefined, "FAST");
  } catch (error) {
    console.warn("Invoice image could not be rendered:", error);
  }
}

function drawWrapped(pdf, value, x, y, width, options = {}) {
  const text = safeText(value);
  if (!text) return y;
  const fontSize = options.fontSize || 7;
  const lineHeight = options.lineHeight || 3;
  const fontStyle = options.bold ? "bold" : "normal";
  pdf.setFont("helvetica", fontStyle);
  pdf.setFontSize(fontSize);
  pdf.setTextColor(...(options.color || TEXT));
  const lines = pdf.splitTextToSize(text, width);
  if (options.align === "right") pdf.text(lines, x + width, y, { align: "right" });
  else pdf.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function drawBrandHeader(pdf, company, logo, pageIndex, invoice) {
  const first = pageIndex === 0;
  const logoX = PAGE_MARGIN;
  const logoY = first ? 9 : 8;
  const logoSize = first ? 23 : 18;
  addPdfImage(pdf, logo, logoX, logoY, logoSize, logoSize);

  const companyX = logo ? PAGE_MARGIN + logoSize + 5 : PAGE_MARGIN;
  const companyWidth = PAGE_WIDTH - PAGE_MARGIN - companyX;
  let y = first ? 14 : 13;
  y = drawWrapped(pdf, company?.company_name || "Company", companyX, y, companyWidth, {
    fontSize: first ? 11 : 9,
    lineHeight: 4.2,
    bold: true,
    color: NAVY,
    align: "right"
  });
  y = drawWrapped(pdf, company?.address, companyX, y + 1, companyWidth, {
    fontSize: first ? 7 : 6.5,
    lineHeight: 3,
    align: "right"
  });

  const contact = [
    company?.mobile ? "Phone: " + company.mobile : "",
    company?.email ? "Email: " + company.email : ""
  ].filter(Boolean).join("   |   ");
  if (contact) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(first ? 6.5 : 6);
    pdf.setTextColor(...MUTED);
    pdf.text(contact, companyX + companyWidth, y + 1, { align: "right" });
    y += 3.5;
  }

  const gstin = company?.gstin ? "GSTIN: " + company.gstin : "";
  if (gstin) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(first ? 7 : 6.5);
    pdf.setTextColor(...TEXT);
    pdf.text(gstin, companyX + companyWidth, y + 1, { align: "right" });
  }

  pdf.setDrawColor(...BLUE);
  pdf.setLineWidth(0.35);
  pdf.line(PAGE_MARGIN, first ? 35 : 30, PAGE_WIDTH - PAGE_MARGIN, first ? 35 : 30);

  const titleY = first ? 38 : 33;
  pdf.setFillColor(...NAVY);
  pdf.roundedRect(PAGE_MARGIN, titleY, CONTENT_WIDTH, 9, 1.5, 1.5, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(first ? 13 : 10);
  pdf.setTextColor(255, 255, 255);
  const title = first ? "TAX INVOICE" : "TAX INVOICE - CONTINUED";
  pdf.text(title, PAGE_WIDTH / 2, titleY + 6.1, { align: "center" });

  if (!first) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(...TEXT);
    pdf.text("Invoice No.: " + safeText(invoice?.invoice_no), PAGE_MARGIN, 49);
    pdf.text("Invoice Date: " + invoiceDateLabel(invoice?.invoice_date), PAGE_WIDTH - PAGE_MARGIN, 49, { align: "right" });
  }
}

function drawFirstPageMeta(pdf, invoice, settings) {
  const y = 52;
  const gap = 4;
  const leftX = PAGE_MARGIN;
  const cardW = (CONTENT_WIDTH - gap) / 2;
  const rightX = leftX + cardW + gap;
  const cardH = 26;

  pdf.setFillColor(...LIGHT_BLUE);
  pdf.setDrawColor(...BORDER);
  pdf.roundedRect(leftX, y, cardW, cardH, 2, 2, "FD");
  const metaRows = [
    ["Invoice No.", safeText(invoice?.invoice_no)],
    ["Invoice Date", invoiceDateLabel(invoice?.invoice_date)],
    ["Invoice Type", safeText(invoice?.sale_type).toUpperCase() === "CREDIT" ? "Credit Sale" : "Cash Sale"]
  ];
  let rowY = y + 7;
  for (const [label, value] of metaRows) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6.8);
    pdf.setTextColor(...MUTED);
    pdf.text(label, leftX + 3, rowY);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...TEXT);
    pdf.text(value || "-", leftX + 28, rowY, { maxWidth: cardW - 31 });
    rowY += 7;
  }

  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(...BORDER);
  pdf.roundedRect(rightX, y, cardW, cardH, 2, 2, "FD");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(6.5);
  pdf.setTextColor(...NAVY);
  pdf.text("TRANSPORT & REMARKS", rightX + 3, y + 5);
  const transportRows = [
    ["Vehicle No.", invoice?.vehicle_number || invoice?.vehicle_no],
    ["E-Way Bill", invoice?.eway_bill_number || invoice?.eway_bill_no]
  ].filter(([, value]) => safeText(value));
  let transportY = y + 9;
  for (const [label, value] of transportRows) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(5.8);
    pdf.setTextColor(...MUTED);
    pdf.text(label, rightX + 3, transportY);
    pdf.setTextColor(...TEXT);
    pdf.text(safeText(value), rightX + 24, transportY, { maxWidth: cardW - 27 });
    transportY += 3.6;
  }
  const remarks = safeText(invoice?.remarks);
  if (remarks) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(5.8);
    pdf.setTextColor(...MUTED);
    pdf.text("Remarks:", rightX + 3, transportY + .4);
    drawWrapped(pdf, remarks, rightX + 19, transportY + .4, cardW - 22, {
      fontSize: 5.6,
      lineHeight: 2.5,
      color: TEXT
    });
  }
}

function drawPartyCard(pdf, title, name, address, gstin, state, x, y, width, height) {
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(...BORDER);
  pdf.roundedRect(x, y, width, height, 2, 2, "FD");
  pdf.setFillColor(...LIGHT_BLUE);
  pdf.roundedRect(x, y, width, 6, 2, 2, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  pdf.setTextColor(...NAVY);
  pdf.text(title, x + 3, y + 4.2);

  let textY = y + 10;
  textY = drawWrapped(pdf, name || "-", x + 3, textY, width - 6, {
    fontSize: 7,
    lineHeight: 3.2,
    bold: true
  });
  textY = drawWrapped(pdf, address || "-", x + 3, textY + 0.5, width - 6, {
    fontSize: 6.2,
    lineHeight: 2.7,
    color: MUTED
  });
  const taxLine = [gstin ? "GSTIN: " + gstin : "", state ? "State: " + state : ""].filter(Boolean).join("   |   ");
  drawWrapped(pdf, taxLine, x + 3, Math.min(y + height - 3, textY + 0.6), width - 6, {
    fontSize: 5.9,
    lineHeight: 2.5,
    bold: true,
    color: MUTED
  });
}

function drawItemTable(pdf, pageItems, startY, startingIndex) {
  const widths = [8, 51, 20, 14, 12, 21, 14, 12, 34];
  const headers = ["#", "Item / Description", "HSN/SAC", "Unit", "Qty", "Rate (Rs.)", "GST %", "Cess %", "Amount (Rs.)"];
  const tableX = PAGE_MARGIN;
  const headerH = 7;
  let y = startY;

  pdf.setFillColor(...NAVY);
  pdf.setDrawColor(...BORDER);
  pdf.rect(tableX, y, CONTENT_WIDTH, headerH, "F");
  let x = tableX;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(5.8);
  pdf.setTextColor(255, 255, 255);
  headers.forEach((header, index) => {
    pdf.text(header, x + widths[index] / 2, y + 4.6, { align: "center", maxWidth: widths[index] - 1 });
    x += widths[index];
  });
  y += headerH;

  pageItems.forEach((item, rowIndex) => {
    const itemName = safeText(item?.item_name || item?.particulars) || "-";
    const lines = pdf.splitTextToSize(itemName, widths[1] - 3);
    const rowH = Math.max(itemRowHeight(item), Math.min(lines.length, 4) * 3 + 2.2);
    const xPositions = [tableX];
    for (let index = 0; index < widths.length; index += 1) {
      xPositions.push(xPositions[index] + widths[index]);
    }

    if (rowIndex % 2 === 0) {
      pdf.setFillColor(248, 250, 253);
      pdf.rect(tableX, y, CONTENT_WIDTH, rowH, "F");
    }
    pdf.setDrawColor(...BORDER);
    pdf.setLineWidth(0.15);
    pdf.rect(tableX, y, CONTENT_WIDTH, rowH);
    for (let index = 1; index < widths.length; index += 1) {
      pdf.line(xPositions[index], y, xPositions[index], y + rowH);
    }

    const values = [
      String(startingIndex + rowIndex + 1),
      itemName,
      safeText(item?.hsn_sac),
      safeText(item?.unit),
      safeText(item?.qty),
      amount(item?.rate),
      safeText(item?.gst_rate) + "%",
      (Number(item?.cess_rate) || 0) + "%",
      amount((Number(item?.qty) || 0) * (Number(item?.rate) || 0))
    ];

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6.4);
    pdf.setTextColor(...TEXT);
    values.forEach((value, index) => {
      const cellX = xPositions[index];
      const cellW = widths[index];
      const baseline = y + (rowH - Math.min(lines.length, 4) * 2.8) / 2 + 2.5;
      if (index === 1) {
        const safeLines = pdf.splitTextToSize(value, cellW - 3).slice(0, Math.min(lines.length, 4));
        pdf.text(safeLines, cellX + 2, baseline, { maxWidth: cellW - 3 });
      } else {
        const alignRight = index === 5 || index === 8;
        pdf.text(value, alignRight ? cellX + cellW - 1.5 : cellX + cellW / 2, y + rowH / 2 + 1.2, {
          align: alignRight ? "right" : "center",
          maxWidth: cellW - 2
        });
      }
    });
    y += rowH;
  });

  return y;
}

function summaryRows(invoice, items) {
  const discountAmount = Number(invoice?.discount_amount) || 0;
  const taxable = Number(invoice?.taxable_value) || 0;
  const subtotal = taxable + discountAmount;
  const cessFromItems = (items || []).reduce((sum, item) => sum + (Number(item?.cess_amount) || 0), 0);
  const cess = Number(invoice?.cess_amount) || cessFromItems;
  return [
    ["Subtotal", subtotal],
    ["Discount", -discountAmount],
    ["Taxable Value", taxable],
    ["CGST", Number(invoice?.cgst) || 0],
    ["SGST", Number(invoice?.sgst) || 0],
    ["IGST", Number(invoice?.igst) || 0],
    ["Cess", cess],
    ["Other Charges", Number(invoice?.other_amount) || 0],
    ["Round Off", Number(invoice?.round_off) || 0]
  ];
}

function drawTotals(pdf, invoice, items, y, amountWords) {
  const x = 104;
  const width = PAGE_WIDTH - PAGE_MARGIN - x;
  const wordsX = PAGE_MARGIN;
  const wordsW = 85;
  const rowHeight = 3.8;
  const rows = summaryRows(invoice, items);

  pdf.setFillColor(247, 249, 253);
  pdf.setDrawColor(...BORDER);
  pdf.roundedRect(wordsX, y - 3, wordsW, 22, 2, 2, "FD");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(6.5);
  pdf.setTextColor(...NAVY);
  pdf.text("AMOUNT IN WORDS", wordsX + 3, y + 1.2);
  drawWrapped(pdf, amountWords, wordsX + 3, y + 5, wordsW - 6, {
    fontSize: 6.1,
    lineHeight: 2.8,
    bold: true
  });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6.8);
  rows.forEach((row, index) => {
    const rowY = y + index * rowHeight;
    if (index % 2 === 0) {
      pdf.setFillColor(248, 250, 253);
      pdf.rect(x, rowY - 3.2, width, rowHeight, "F");
    }
    pdf.setTextColor(...TEXT);
    pdf.text(row[0], x + 2, rowY);
    const valueText = (row[1] < 0 ? "- " : "") + "INR " + amount(Math.abs(row[1]));
    pdf.text(valueText, x + width - 2, rowY, { align: "right" });
  });

  const grandY = y + rows.length * rowHeight + 1;
  pdf.setFillColor(...NAVY);
  pdf.roundedRect(x, grandY - 3.8, width, 6.5, 1.2, 1.2, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.3);
  pdf.setTextColor(255, 255, 255);
  pdf.text("Grand Total", x + 2, grandY + 0.6);
  pdf.text("INR " + amount(invoice?.total_amount), x + width - 2, grandY + 0.6, { align: "right" });
  return Math.max(grandY + 3, y + 20);
}

function drawFinalDetails(pdf, invoice, settings, signature, amountWords, y) {
  const leftX = PAGE_MARGIN;
  const leftW = 85;
  const rightX = 104;
  const rightW = PAGE_WIDTH - PAGE_MARGIN - rightX;
  const cardY = y + 1;

  if (settings?.show_bank_details) {
    pdf.setFillColor(247, 249, 253);
    pdf.setDrawColor(...BORDER);
    pdf.roundedRect(leftX, cardY, leftW, 24, 2, 2, "FD");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6.5);
    pdf.setTextColor(...NAVY);
    pdf.text("BANK DETAILS", leftX + 3, cardY + 4.2);
    const bankRows = [
      ["Bank", settings?.bank_name],
      ["A/C", settings?.account_number],
      ["IFSC", settings?.ifsc_code],
      ["UPI", settings?.upi_id]
    ].filter(([, value]) => safeText(value));
    let bankY = cardY + 8;
    for (const [label, value] of bankRows) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(5.8);
      pdf.setTextColor(...MUTED);
      pdf.text(label, leftX + 3, bankY);
      pdf.setTextColor(...TEXT);
      pdf.text(safeText(value), leftX + 19, bankY, { maxWidth: leftW - 22 });
      bankY += 3.5;
    }
  }

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6);
  pdf.setTextColor(...MUTED);
  pdf.text("For " + safeText(settings?.company_name || invoice?.company_name), rightX + rightW - 2, cardY + 4, { align: "right" });
  addPdfImage(pdf, signature, rightX + 29, cardY + 5, 34, 11);
  pdf.setDrawColor(...TEXT);
  pdf.setLineWidth(0.25);
  pdf.line(rightX + 20, cardY + 19, rightX + rightW - 2, cardY + 19);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(6.6);
  pdf.setTextColor(...TEXT);
  pdf.text("Authorized Signatory", rightX + rightW / 2, cardY + 23, { align: "center" });

  const terms = settings?.show_terms_conditions ? safeText(settings?.terms_conditions) : "";
  if (terms) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(5.2);
    pdf.setTextColor(...MUTED);
    pdf.text("Terms: " + terms, PAGE_MARGIN, 278, { maxWidth: CONTENT_WIDTH });
  }
  return cardY + 25;
}

function drawPageFooter(pdf, pageNumber, pageCount, settings, continued) {
  const lineY = 287;
  pdf.setDrawColor(...BORDER);
  pdf.setLineWidth(0.25);
  pdf.line(PAGE_MARGIN, lineY, PAGE_WIDTH - PAGE_MARGIN, lineY);

  const footer = settings?.show_footer ? safeText(settings?.invoice_footer) : "";
  if (footer) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(5.8);
    pdf.setTextColor(...MUTED);
    pdf.text(pdf.splitTextToSize(footer, CONTENT_WIDTH - 30).slice(0, 1), PAGE_WIDTH / 2, lineY - 2, { align: "center" });
  } else if (continued) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6.4);
    pdf.setTextColor(...BLUE);
    pdf.text("Continued on next page", PAGE_WIDTH - PAGE_MARGIN, lineY - 3, { align: "right" });
  }

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6.5);
  pdf.setTextColor(...MUTED);
  pdf.text("Page " + pageNumber + " of " + pageCount, PAGE_WIDTH / 2, 293, { align: "center" });
}

function drawPdfPage(pdf, pageItems, pageIndex, pageCount, allItems, invoice, settings, company, customer, logo, signature, amountWords) {
  const first = pageIndex === 0;
  const last = pageIndex === pageCount - 1;
  drawBrandHeader(pdf, company, logo, pageIndex, invoice);
  if (first) {
    drawFirstPageMeta(pdf, invoice, settings);
    const addressY = 82;
    const cardW = (CONTENT_WIDTH - 4) / 2;
    drawPartyCard(
      pdf,
      "BILL TO",
      invoice?.customer_name || "",
      invoice?.billing_address || customerAddress(invoice),
      customer?.gstin || invoice?.customer_gstin || "",
      invoice?.customer_state || customer?.state || invoice?.place_of_supply || "",
      PAGE_MARGIN,
      addressY,
      cardW,
      32
    );
    drawPartyCard(
      pdf,
      "SHIP TO",
      invoice?.shipping_name || invoice?.customer_name || "",
      invoice?.shipping_address || invoice?.billing_address || "",
      invoice?.shipping_gstin || "",
      invoice?.shipping_state || invoice?.place_of_supply || "",
      PAGE_MARGIN + cardW + 4,
      addressY,
      cardW,
      32
    );
  }

  const tableStartY = first ? 119 : 57;
  const rowStartIndex = allItems.indexOf(pageItems[0]);
  const tableEndY = drawItemTable(pdf, pageItems, tableStartY, Math.max(0, rowStartIndex));
  if (last) {
    const totalsEnd = drawTotals(pdf, invoice, allItems, tableEndY + 3, amountWords);
    drawFinalDetails(pdf, invoice, settings, signature, amountWords, totalsEnd + 3);
  }
  drawPageFooter(pdf, pageIndex + 1, pageCount, settings, !last);
}

function customerAddress(invoice) {
  return invoice?.billing_address || "";
}

function formatQuantity(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return safeText(value);
  return numeric.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function InvoicePrint({ invoice, items = [], settings, company, customer, onClose }) {
  const [downloading, setDownloading] = useState(false);
  if (!invoice) return null;

  const itemList = Array.isArray(items) ? items : [];
  const pages = paginateItems(itemList);
  const amountWords = numberToWords(Number(invoice.total_amount || 0));
  const cessFromItems = itemList.reduce((sum, item) => sum + (Number(item?.cess_amount) || 0), 0);
  const discountAmount = Number(invoice.discount_amount) || 0;
  const subtotal = (Number(invoice.taxable_value) || 0) + discountAmount;
  const cessTotal = Number(invoice.cess_amount) || cessFromItems;

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const [logo, signature] = await Promise.all([
        settings?.show_logo ? loadImage(settings?.logo_url) : Promise.resolve(null),
        settings?.show_signature ? loadImage(settings?.signature_url) : Promise.resolve(null)
      ]);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true
      });
      pdf.setProperties({
        title: "Tax Invoice " + safeText(invoice.invoice_no),
        subject: "GST tax invoice",
        author: safeText(company?.company_name)
      });

      pages.forEach((pageItems, pageIndex) => {
        if (pageIndex > 0) pdf.addPage("a4", "portrait");
        drawPdfPage(pdf, pageItems, pageIndex, pages.length, itemList, invoice, settings, company, customer, logo, signature, amountWords);
      });

      const filename = (safeText(invoice.invoice_no) || "sales-invoice").replace(/[^\w.-]+/g, "_") + ".pdf";
      pdf.save(filename);
    } catch (error) {
      console.error("Unable to generate invoice PDF:", error);
      alert("Unable to generate the invoice PDF. " + (error?.message || ""));
    } finally {
      setDownloading(false);
    }
  };

  const renderRows = (pageItems, pageIndex) => {
    const rowOffset = pages.slice(0, pageIndex).reduce((sum, page) => sum + page.length, 0);
    return pageItems.map((item, index) => (
      <tr key={item.id || (rowOffset + index)}>
        <td>{rowOffset + index + 1}</td>
        <td className="invoice-item-name">{item.item_name || item.particulars}</td>
        <td>{item.hsn_sac}</td>
        <td>{item.unit}</td>
        <td>{formatQuantity(item.qty)}</td>
        <td className="number-cell">INR {amount(item.rate)}</td>
        <td>{Number(item.gst_rate) || 0}%</td>
        <td>{Number(item.cess_rate) || 0}%</td>
        <td className="number-cell">INR {amount((Number(item.qty) || 0) * (Number(item.rate) || 0))}</td>
      </tr>
    ));
  };

  return (
    <div className="invoice-overlay">
      <div className="invoice-print">
        <div className="invoice-actions">
          <button type="button" onClick={onClose}>Close</button>
          <button type="button" onClick={() => window.print()}>Print Invoice</button>
          <button type="button" onClick={handleDownloadPDF} disabled={downloading}>
            {downloading ? "Preparing PDF..." : "Download PDF"}
          </button>
        </div>

        <div id="invoice-content" className="invoice-paper-stack">
          {pages.map((pageItems, pageIndex) => {
            const first = pageIndex === 0;
            const last = pageIndex === pages.length - 1;
            const rowOffset = pages.slice(0, pageIndex).reduce((sum, page) => sum + page.length, 0);
            return (
              <article className="invoice-pdf-page" key={pageIndex}>
                <header className="invoice-pdf-company-header">
                  <div className="invoice-pdf-brand">
                    {settings?.show_logo && settings?.logo_url && <img src={settings.logo_url} alt="" />}
                    <div>
                      <h2>{company?.company_name}</h2>
                      <p>{company?.address}</p>
                      <p>
                        {company?.mobile ? "Phone: " + company.mobile : ""}
                        {company?.mobile && company?.email ? " | " : ""}
                        {company?.email ? "Email: " + company.email : ""}
                      </p>
                      <strong>GSTIN: {company?.gstin || "-"}</strong>
                    </div>
                  </div>
                </header>

                <div className="invoice-pdf-title">{first ? "TAX INVOICE" : "TAX INVOICE - CONTINUED"}</div>

                {!first && (
                  <div className="invoice-pdf-continuation-meta">
                    <span>Invoice No.: <strong>{invoice.invoice_no}</strong></span>
                    <span>Invoice Date: <strong>{invoiceDateLabel(invoice.invoice_date)}</strong></span>
                  </div>
                )}

                {first && (
                  <>
                    <div className="invoice-pdf-meta-grid">
                      <div className="invoice-pdf-meta-card">
                        <p><span>Invoice No.</span><strong>{invoice.invoice_no}</strong></p>
                        <p><span>Invoice Date</span><strong>{invoiceDateLabel(invoice.invoice_date)}</strong></p>
                        <p><span>Invoice Type</span><strong>{String(invoice.sale_type || "CASH").toUpperCase() === "CREDIT" ? "Credit Sale" : "Cash Sale"}</strong></p>
                      </div>
                      <div className="invoice-pdf-transport-card">
                        <h3>Transport &amp; Remarks</h3>
                        <p><span>Vehicle No.</span><strong>{invoice.vehicle_number || invoice.vehicle_no || "-"}</strong></p>
                        <p><span>E-Way Bill</span><strong>{invoice.eway_bill_number || invoice.eway_bill_no || "-"}</strong></p>
                        <p className="transport-remarks"><span>Remarks</span><strong>{invoice.remarks || "-"}</strong></p>
                      </div>
                    </div>
                    <div className="invoice-pdf-party-grid">
                      <PartyCard title="Bill To" name={invoice.customer_name} address={invoice.billing_address || customer?.address} gstin={customer?.gstin || invoice.customer_gstin} state={invoice.customer_state || customer?.state || invoice.place_of_supply} place={invoice.place_of_supply} />
                      <PartyCard title="Ship To" name={invoice.shipping_name || invoice.customer_name} address={invoice.shipping_address || invoice.billing_address} gstin={invoice.shipping_gstin || customer?.gstin} state={invoice.shipping_state || invoice.place_of_supply} />
                    </div>
                  </>
                )}

                <div className="invoice-pdf-items-wrap">
                  <table className="invoice-pdf-items-table">
                    <thead>
                      <tr>
                        <th>#</th><th>Item / Description</th><th>HSN/SAC</th><th>Unit</th><th>Qty</th>
                        <th>Rate (Rs.)</th><th>GST %</th><th>Cess %</th><th>Amount (Rs.)</th>
                      </tr>
                    </thead>
                    <tbody>{renderRows(pageItems, pageIndex)}</tbody>
                  </table>
                </div>

                {last && (
                  <>
                    <div className="invoice-pdf-final-summary">
                      <div className="invoice-pdf-amount-words">
                        <h3>Amount in Words</h3>
                        <p>{amountWords}</p>
                      </div>
                      <div className="invoice-pdf-totals">
                        <SummaryLine label="Subtotal" value={"INR " + amount(subtotal)} />
                        <SummaryLine label="Discount" value={"- INR " + amount(discountAmount)} />
                        <SummaryLine label="Taxable Value" value={"INR " + amount(invoice.taxable_value)} emphasis />
                        <SummaryLine label="CGST" value={"INR " + amount(invoice.cgst)} />
                        <SummaryLine label="SGST" value={"INR " + amount(invoice.sgst)} />
                        <SummaryLine label="IGST" value={"INR " + amount(invoice.igst)} />
                        <SummaryLine label="Cess" value={"INR " + amount(cessTotal)} />
                        <SummaryLine label="Other Charges" value={"INR " + amount(invoice.other_amount)} />
                        <SummaryLine label="Round Off" value={"INR " + amount(invoice.round_off)} />
                        <div className="invoice-pdf-grand-total"><strong>Grand Total</strong><strong>INR {amount(invoice.total_amount)}</strong></div>
                      </div>
                    </div>

                    <div className="invoice-pdf-closing-grid">
                      {settings?.show_bank_details && (
                        <div className="invoice-pdf-bank-card">
                          <h3>Bank Details</h3>
                          <p><span>Bank Name</span><strong>{settings.bank_name || "-"}</strong></p>
                          <p><span>A/C Number</span><strong>{settings.account_number || "-"}</strong></p>
                          <p><span>IFSC Code</span><strong>{settings.ifsc_code || "-"}</strong></p>
                          <p><span>UPI ID</span><strong>{settings.upi_id || "-"}</strong></p>
                        </div>
                      )}
                      <div className="invoice-pdf-signature">
                        <p>For {settings?.company_name || company?.company_name}</p>
                        {settings?.show_signature && settings?.signature_url && <img src={settings.signature_url} alt="" />}
                        <div className="invoice-pdf-signature-line" />
                        <strong>Authorized Signatory</strong>
                      </div>
                    </div>

                    {settings?.show_terms_conditions && settings?.terms_conditions && (
                      <div className="invoice-pdf-terms"><strong>Terms:</strong> {settings.terms_conditions}</div>
                    )}
                  </>
                )}

                <footer className="invoice-pdf-footer">
                  {!last && <strong>Continued on next page</strong>}
                  {settings?.show_footer && settings?.invoice_footer && <span className="invoice-pdf-footer-text">{settings.invoice_footer}</span>}
                  <span className="invoice-pdf-page-number">Page {pageIndex + 1} of {pages.length}</span>
                </footer>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PartyCard({ title, name, address, gstin, state, place }) {
  return (
    <section className="invoice-pdf-party-card">
      <h3>{title}</h3>
      <strong>{name || "-"}</strong>
      <p>{address || "-"}</p>
      <div>
        {gstin && <span>GSTIN: {gstin}</span>}
        {state && <span>State: {state}</span>}
        {place && <span>Place of supply: {place}</span>}
      </div>
    </section>
  );
}

function SummaryLine({ label, value, emphasis }) {
  return (
    <div className={"invoice-pdf-summary-line" + (emphasis ? " emphasis" : "")}>
      <span>{label}</span><strong>{value}</strong>
    </div>
  );
}

export default InvoicePrint;