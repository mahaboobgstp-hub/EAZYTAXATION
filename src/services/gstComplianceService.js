import { supabase } from "../supabase/supabaseClient";

const money = value => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
const periodRange = (month, fy) => {
  const m = Number(month), y = Number(fy) + (m < 4 ? 1 : 0);
  return { from: `${y}-${String(m).padStart(2,"0")}-01`, to: `${y}-${String(m).padStart(2,"0")}-${new Date(y,m,0).getDate()}` };
};

export async function getGSTR3BBooks(companyId, month, fy) {
  if (!companyId) throw new Error("Select a company first.");
  const { from, to } = periodRange(month, fy);
  const [sales, purchases] = await Promise.all([
    supabase.from("sales_invoices").select("id,invoice_no,invoice_date,taxable_value,cgst,sgst,igst,cess_amount,additional_cess_amount,sale_type").eq("company_id",companyId).eq("is_deleted",false).gte("invoice_date",from).lte("invoice_date",to),
    supabase.from("purchase_invoices").select("id,invoice_no,supplier_invoice_no,supplier_invoice_date,invoice_date,taxable,cgst,sgst,igst,grand_total,gstin,gst_treatment").eq("company_id",companyId).eq("is_deleted",false).gte("invoice_date",from).lte("invoice_date",to)
  ]);
  if (sales.error) throw sales.error;
  if (purchases.error) throw purchases.error;
  const out = (sales.data || []).reduce((a,r)=>({taxable:a.taxable+Number(r.taxable_value||0),cgst:a.cgst+Number(r.cgst||0),sgst:a.sgst+Number(r.sgst||0),igst:a.igst+Number(r.igst||0),cess:a.cess+Number(r.cess_amount||0)+Number(r.additional_cess_amount||0)}),{taxable:0,cgst:0,sgst:0,igst:0,cess:0});
  const itc = (purchases.data || []).reduce((a,r)=>({cgst:a.cgst+Number(r.cgst||0),sgst:a.sgst+Number(r.sgst||0),igst:a.igst+Number(r.igst||0)}),{cgst:0,sgst:0,igst:0});
  return { sales:sales.data||[], purchases:purchases.data||[], outward:Object.fromEntries(Object.entries(out).map(([k,v])=>[k,money(v)])), itc:Object.fromEntries(Object.entries(itc).map(([k,v])=>[k,money(v)])) };
}

export async function getEwayBillSources(companyId) {
  if (!companyId) throw new Error("Select a company first.");
  const [sales, challans] = await Promise.all([
    supabase.from("sales_invoices").select("id,invoice_no,invoice_date,customer_name,shipping_name,shipping_gstin,shipping_state,place_of_supply,vehicle_no,eway_bill_no,taxable_value,total_amount").eq("company_id",companyId).eq("is_deleted",false).order("invoice_date",{ascending:false}).limit(250),
    supabase.from("delivery_challans").select("id,challan_no,challan_date,customer_name,shipping_name,shipping_gstin,shipping_state,place_of_supply,vehicle_no,eway_bill_no,taxable_value,total_amount,status").eq("company_id",companyId).eq("is_deleted",false).order("challan_date",{ascending:false}).limit(250)
  ]);
  if (sales.error) throw sales.error;
  if (challans.error) throw challans.error;
  return [
    ...(sales.data||[]).map(r=>({...r,source_type:"Invoice",document_no:r.invoice_no,document_date:r.invoice_date,recipient:r.shipping_name||r.customer_name})),
    ...(challans.data||[]).map(r=>({...r,source_type:"Delivery Challan",document_no:r.challan_no,document_date:r.challan_date,recipient:r.shipping_name||r.customer_name}))
  ].sort((a,b)=>String(b.document_date).localeCompare(String(a.document_date)));
}

export async function saveEwayBillReference(companyId, record) {
  if (!companyId || !record?.id) throw new Error("Invalid source document.");
  const table = record.source_type === "Invoice" ? "sales_invoices" : "delivery_challans";
  const { error } = await supabase.from(table).update({
    eway_bill_no: record.eway_bill_no.trim(),
    vehicle_no: record.vehicle_no?.trim() || null
  }).eq("id",record.id).eq("company_id",companyId);
  if (error) throw error;
}

export function extractGSTR2BDocuments(payload) {
  const root = payload?.data?.docdata || payload?.docdata || payload?.data || payload;
  const docs = [];
  const pushInvoices = (group, supplierGSTIN) => {
    (Array.isArray(group) ? group : []).forEach(section => {
      const gstin = section.ctin || section.gstin || supplierGSTIN || "";
      (section.inv || section.invoices || []).forEach(inv => docs.push({
        supplier_gstin:String(gstin).toUpperCase(),
        invoice_no:String(inv.inum || inv.doc_num || inv.invoice_no || "").trim(),
        invoice_date:String(inv.idt || inv.doc_dt || inv.invoice_date || "").trim(),
        invoice_value:Number(inv.val ?? inv.doc_val ?? inv.invoice_value ?? 0),
        taxable_value:Number(inv.itms?.reduce?.((s,x)=>s+Number(x.itm_det?.txval||x.txval||0),0) ?? inv.txval ?? 0),
        igst:Number(inv.itms?.reduce?.((s,x)=>s+Number(x.itm_det?.iamt||0),0) ?? inv.igst ?? 0),
        cgst:Number(inv.itms?.reduce?.((s,x)=>s+Number(x.itm_det?.camt||0),0) ?? inv.cgst ?? 0),
        sgst:Number(inv.itms?.reduce?.((s,x)=>s+Number(x.itm_det?.samt||0),0) ?? inv.sgst ?? 0),
        source_section:"B2B"
      }));
    });
  };
  pushInvoices(root?.b2b);
  pushInvoices(root?.b2ba);
  pushInvoices(root?.cdnr);
  pushInvoices(root?.cdnra);
  if (!docs.length && Array.isArray(root?.b2b)) pushInvoices(root.b2b);
  return docs;
}

export async function getPurchaseDocumentsForReconciliation(companyId, month, fy) {
  if (!companyId) throw new Error("Select a company first.");
  const {from,to}=periodRange(month,fy);
  const {data,error}=await supabase.from("purchase_invoices")
    .select("id,invoice_no,supplier_invoice_no,supplier_invoice_date,invoice_date,gstin,taxable,cgst,sgst,igst,grand_total")
    .eq("company_id",companyId).eq("is_deleted",false).gte("invoice_date",from).lte("invoice_date",to);
  if(error) throw error;
  return data||[];
}

export { money, periodRange };
