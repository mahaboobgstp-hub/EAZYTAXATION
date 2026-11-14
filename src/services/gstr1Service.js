import { supabase } from "../supabase/supabaseClient";

const STATE_CODES = {
  "JAMMU AND KASHMIR":"01","HIMACHAL PRADESH":"02","PUNJAB":"03",
  "CHANDIGARH":"04","UTTARAKHAND":"05","HARYANA":"06","DELHI":"07",
  "RAJASTHAN":"08","UTTAR PRADESH":"09","BIHAR":"10","SIKKIM":"11",
  "ARUNACHAL PRADESH":"12","NAGALAND":"13","MANIPUR":"14","MIZORAM":"15",
  "TRIPURA":"16","MEGHALAYA":"17","ASSAM":"18","WEST BENGAL":"19",
  "JHARKHAND":"20","ODISHA":"21","CHHATTISGARH":"22","MADHYA PRADESH":"23",
  "GUJARAT":"24","DAMAN AND DIU":"25","DADRA AND NAGAR HAVELI":"26",
  "MAHARASHTRA":"27","KARNATAKA":"29","GOA":"30","LAKSHADWEEP":"31",
  "KERALA":"32","TAMIL NADU":"33","PUDUCHERRY":"34",
  "ANDAMAN AND NICOBAR ISLANDS":"35","TELANGANA":"36","ANDHRA PRADESH":"37",
  "LADAKH":"38","OTHER TERRITORY":"97"
};

const num = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const round = value => Math.round((num(value) + Number.EPSILON) * 100) / 100;

export function getGSTR1Period(month, financialYear) {
  const m = Number(month);
  const startYear = Number(financialYear);
  const year = m >= 4 ? startYear : startYear + 1;
  const lastDay = new Date(year, m, 0).getDate();
  return {
    year,
    from: year + "-" + String(m).padStart(2, "0") + "-01",
    to: year + "-" + String(m).padStart(2, "0") + "-" + lastDay
  };
}

function stateCode(value, gstin) {
  const gstinCode = String(gstin || "").slice(0, 2);
  if (/^\d{2}$/.test(gstinCode)) return gstinCode;
  const text = String(value || "").trim().toUpperCase();
  const leading = text.match(/^(\d{2})\b/);
  return leading ? leading[1] : (STATE_CODES[text] || "");
}

function gstDate(value) {
  const parts = String(value || "").slice(0, 10).split("-");
  if (parts.length !== 3) return "";
  return parts[2] + "-" + parts[1] + "-" + parts[0];
}

export async function getGSTR1Data(companyId, month, financialYear) {
  if (!companyId) throw new Error("Select a company first.");

  const period = getGSTR1Period(month, financialYear);
  const { data: invoices, error: invoiceError } = await supabase
    .from("sales_invoices")
    .select("*")
    .eq("company_id", companyId)
    .eq("is_deleted", false)
    .gte("invoice_date", period.from)
    .lte("invoice_date", period.to)
    .order("invoice_date", { ascending: true });

  if (invoiceError) throw invoiceError;
  if (!invoices?.length) return [];

  const invoiceIds = invoices.map(row => row.id);
  const customerIds = [...new Set(invoices.map(row => row.customer_id).filter(Boolean))];

  const [itemsResult, customersResult] = await Promise.all([
    supabase.from("sales_invoice_items").select("*").in("invoice_id", invoiceIds).order("line_no"),
    customerIds.length
      ? supabase.from("customers").select("id, customer_name, gstin, state").eq("company_id", companyId).in("id", customerIds)
      : Promise.resolve({ data: [], error: null })
  ]);

  if (itemsResult.error) throw itemsResult.error;
  if (customersResult.error) throw customersResult.error;

  const itemsByInvoice = {};
  (itemsResult.data || []).forEach(item => {
    if (!itemsByInvoice[item.invoice_id]) itemsByInvoice[item.invoice_id] = [];
    itemsByInvoice[item.invoice_id].push(item);
  });

  const customersById = {};
  (customersResult.data || []).forEach(customer => { customersById[customer.id] = customer; });

  return invoices.map(invoice => ({
    ...invoice,
    customer: customersById[invoice.customer_id] || null,
    items: itemsByInvoice[invoice.id] || []
  }));
}

function itemTax(item, intraState) {
  const taxable = round(item.amount);
  const rate = num(item.gst_rate);
  const gst = round(taxable * rate / 100);
  const cgst = intraState ? round(gst / 2) : 0;
  const sgst = intraState ? round(gst - cgst) : 0;
  const igst = intraState ? 0 : gst;
  const cess = round(num(item.cess_amount) + num(item.additional_cess_amount));
  return { taxable, rate, cgst, sgst, igst, cess };
}

export function buildGSTR1(company, invoices, month, financialYear) {
  if (!company?.gstin) throw new Error("Company GSTIN is missing. Update Company Master.");
  if (!invoices?.length) throw new Error("No sales invoices exist for the selected period.");

  const period = getGSTR1Period(month, financialYear);
  const fp = String(month).padStart(2, "0") + String(period.year);
  const warnings = [];
  const b2b = {};
  const b2cl = {};
  const b2cs = {};
  const hsn = {};

  invoices.forEach(invoice => {
    const customerGstin = String(invoice.customer?.gstin || invoice.shipping_gstin || "").trim().toUpperCase();
    const pos = stateCode(
      invoice.place_of_supply || invoice.shipping_state || invoice.customer_state || invoice.customer?.state,
      customerGstin
    );
    if (!pos) {
      warnings.push(invoice.invoice_no + ": place of supply/state code is missing.");
      return;
    }
    if (!invoice.items?.length) {
      warnings.push(invoice.invoice_no + ": invoice has no line items.");
      return;
    }

    const supplierState = stateCode(company.state, company.gstin);
    const intraState = supplierState ? supplierState === pos : invoice.gst_type === "INTRA_STATE";
    const itms = [];

    invoice.items.forEach((item, index) => {
      if (!item.hsn_sac) warnings.push(invoice.invoice_no + ": HSN/SAC missing for " + (item.item_name || "an item") + ".");
      const tax = itemTax(item, intraState);
      itms.push({
        num: index + 1,
        itm_det: {
          rt: tax.rate,
          txval: tax.taxable,
          iamt: tax.igst,
          camt: tax.cgst,
          samt: tax.sgst,
          csamt: tax.cess
        }
      });

      const hsnCode = String(item.hsn_sac || "").trim();
      if (hsnCode) {
        const hsnKey = [hsnCode, tax.rate, intraState ? "I" : "O"].join("|");
        if (!hsn[hsnKey]) {
          hsn[hsnKey] = {
            num: Object.keys(hsn).length + 1,
            hsn_sc: hsnCode,
            desc: String(item.item_name || item.particulars || "").slice(0, 60),
            uqc: String(item.unit || "OTH").toUpperCase(),
            qty: 0, val: 0, txval: 0, iamt: 0, camt: 0, samt: 0, csamt: 0
          };
        }
        const row = hsn[hsnKey];
        row.qty += num(item.qty);
        row.txval += tax.taxable;
        row.iamt += tax.igst;
        row.camt += tax.cgst;
        row.samt += tax.sgst;
        row.csamt += tax.cess;
        row.val += tax.taxable + tax.igst + tax.cgst + tax.sgst + tax.cess;
      }
    });

    const invoiceValue = round(invoice.total_amount);
    const invoiceJson = {
      inum: String(invoice.invoice_no || ""),
      idt: gstDate(invoice.invoice_date),
      val: invoiceValue,
      pos,
      rchrg: "N",
      itms
    };

    if (customerGstin) {
      if (!b2b[customerGstin]) b2b[customerGstin] = { ctin: customerGstin, inv: [] };
      b2b[customerGstin].inv.push({ ...invoiceJson, inv_typ: "R" });
    } else if (!intraState && invoiceValue > 100000) {
      if (!b2cl[pos]) b2cl[pos] = { pos, inv: [] };
      b2cl[pos].inv.push(invoiceJson);
    } else {
      itms.forEach(row => {
        const d = row.itm_det;
        const key = [intraState ? "INTRA" : "INTER", pos, d.rt].join("|");
        if (!b2cs[key]) {
          b2cs[key] = { sply_ty: intraState ? "INTRA" : "INTER", pos, typ: "OE", rt: d.rt, txval: 0, iamt: 0, camt: 0, samt: 0, csamt: 0 };
        }
        b2cs[key].txval += num(d.txval);
        b2cs[key].iamt += num(d.iamt);
        b2cs[key].camt += num(d.camt);
        b2cs[key].samt += num(d.samt);
        b2cs[key].csamt += num(d.csamt);
      });
    }
  });

  const roundRows = rows => rows.map(row => Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, typeof value === "number" ? round(value) : value])
  ));

  const json = {
    version: "GST3.2.4",
    gstin: String(company.gstin).toUpperCase(),
    fp,
    b2b: Object.values(b2b),
    b2cl: Object.values(b2cl),
    b2cs: roundRows(Object.values(b2cs)),
    hsn: { data: roundRows(Object.values(hsn)) }
  };

  return {
    json,
    warnings,
    invoiceCount: invoices.length,
    taxableValue: round(invoices.reduce((sum, row) => sum + num(row.taxable_value), 0)),
    totalGST: round(invoices.reduce((sum, row) => sum + num(row.cgst) + num(row.sgst) + num(row.igst), 0)),
    invoiceValue: round(invoices.reduce((sum, row) => sum + num(row.total_amount), 0))
  };
}

export async function getGSTR1History(companyId) {
  const { data, error } = await supabase
    .from("gst_return_history")
    .select("*")
    .eq("company_id", companyId)
    .eq("return_type", "GSTR-1")
    .order("generated_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function saveGSTR1History(companyId, details) {
  const { data, error } = await supabase
    .from("gst_return_history")
    .insert({
      company_id: companyId,
      return_type: "GSTR-1",
      return_period: details.returnPeriod,
      financial_year: details.financialYear,
      file_name: details.fileName,
      invoice_count: details.invoiceCount,
      taxable_value: details.taxableValue,
      total_gst: details.totalGST,
      invoice_value: details.invoiceValue,
      status: "Generated"
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function markGSTR1Uploaded(companyId, historyId) {
  const { error } = await supabase
    .from("gst_return_history")
    .update({ status: "Uploaded", uploaded_at: new Date().toISOString() })
    .eq("id", historyId)
    .eq("company_id", companyId)
    .eq("return_type", "GSTR-1");
  if (error) throw error;
}
