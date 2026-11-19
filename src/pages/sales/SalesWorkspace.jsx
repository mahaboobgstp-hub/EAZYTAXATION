import React, { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { useCompany } from "../../context/CompanyContext";
import { supabase } from "../../supabase/supabaseClient";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { getInvoiceSettings } from "../../services/invoiceSettingsService";
import "../../css/sales/SalesWorkspace.css";
import { buildSalesInvoicePdf } from "../../components/InvoicePrint";
import { createQuotationPdf } from "../../utils/quotationDocumentPdf";
import { notifyPdfDownloaded } from "../../utils/pdfDownloadNotification";
import { saveDocumentToPublicStorage } from "../../services/nativeDocumentStorage";
import QuotationPdfPreview from "../../components/QuotationPdfPreview";
import InvoicePrint from "../../components/InvoicePrint";

const CONFIG = {
  register: {
    title: "Sales Register", table: "sales_invoices", date: "invoice_date", number: "invoice_no",
    metrics: ["Invoices", "Total sales", "Paid", "Outstanding"],
    columns: ["Invoice No.", "Date", "Customer", "Type", "Payment status", "Total", "Paid", "Balance"],
  },
  quotations: {
    title: "Quotations", table: "quotations", date: "invoice_date", number: "invoice_no",
    metrics: ["Total quotations"],
    columns: ["Date", "Customer", "Amount"],
  },
  orders: {
    title: "Sales Orders", table: "sales_orders", date: "order_date", number: "order_no",
    metrics: ["Open orders", "Order value", "Pending fulfillment"],
    columns: ["Order No.", "Date", "Customer", "Expected delivery", "Total", "Fulfillment", "Status"],
  },
  challans: {
    title: "Delivery Challans", table: "delivery_challans", date: "challan_date", number: "challan_no",
    metrics: ["Ready to dispatch", "In transit", "Delivered"],
    columns: ["Challan No.", "Date", "Customer", "Sales order", "Vehicle", "Dispatch status"],
  },
  credits: {
    title: "Credit Notes", table: "credit_notes", date: "credit_note_date", number: "credit_note_no",
    metrics: ["Credits issued", "Applied", "Pending"],
    columns: ["Credit Note No.", "Date", "Customer", "Original invoice", "Reason", "Amount", "Status"],
  },
};

const currency = value => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value) || 0);
const dateText = value => value ? new Date(value + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const num = value => Number(value) || 0;
const errorText = error => error?.message || "Something went wrong. Please try again.";
const isNativeAndroid = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";

export default function SalesWorkspace({ kind }) {
  const config = CONFIG[kind];
  const { currentCompanyId, currentCompany } = useCompany();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [itemsMaster, setItemsMaster] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [customerFilter, setCustomerFilter] = useState("");
  const [billingTypeFilter, setBillingTypeFilter] = useState("All");
  const [placeOfSupplyFilter, setPlaceOfSupplyFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showQuotationDatePopover, setShowQuotationDatePopover] = useState(false);
  const [showRegisterFilters, setShowRegisterFilters] = useState(false);
  const [draftDateFrom, setDraftDateFrom] = useState("");
  const [draftDateTo, setDraftDateTo] = useState("");
  const [dialog, setDialog] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);
  const [quotationPreview, setQuotationPreview] = useState(null);
  const [invoicePreview, setInvoicePreview] = useState(null);
  const [invoicePreviewLoading, setInvoicePreviewLoading] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState(null);
  const [menuId, setMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState(null);
  const [editingQuotationId, setEditingQuotationId] = useState(null);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editingCreditNoteId, setEditingCreditNoteId] = useState(null);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), dueDate: "", customerId: "", originalInvoiceId: "", originalInvoiceMode: "invoice", reason: "", taxInclusive: false });
  const [lines, setLines] = useState([{ description: "", qty: "1", rate: "0", gstRate: "0", cessRate: "0" }]);

  const load = async () => {
    if (!currentCompanyId) { setRows([]); setLoading(false); return; }
    setLoading(true); setMessage("");
    let query = supabase.from(config.table).select("*").eq("company_id", currentCompanyId);
    if (kind === "register" || kind === "quotations" || kind === "credits" || kind === "orders") query = query.eq("is_deleted", false);
    query = query.order(config.date, { ascending: false });
    const { data, error } = await query;
    if (error) setMessage(errorText(error)); else setRows(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [currentCompanyId, kind]);
  useEffect(() => {
    if (!currentCompanyId) return;
    supabase.from("customers").select("id, customer_name, state").eq("company_id", currentCompanyId).order("customer_name").then(({ data }) => setCustomers(data || []));
    if (isNativeAndroid) supabase.from("items").select("id, item_name, hsn_sac, unit, sales_rate, gst_rate").eq("company_id", currentCompanyId).order("item_name").then(({ data }) => setItemsMaster(data || []));
    if (kind === "credits") supabase.from("sales_invoices").select("id, invoice_no, customer_id, customer_name, total_amount").eq("company_id", currentCompanyId).eq("is_deleted", false).order("invoice_date", { ascending: false }).then(({ data }) => setInvoices(data || []));
  }, [currentCompanyId, kind]);

  const filtered = useMemo(() => rows.filter(row => {
    const text = [row[config.number], row.customer_name, row.company_name, row.reason, row.vehicle_no, row.status].join(" ").toLowerCase();
    const status = kind === "register" ? (row.sale_type === "CASH" ? "Paid" : "Outstanding") : row.status || "Draft";
    return (!search || text.includes(search.toLowerCase())) &&
      (kind === "quotations" || statusFilter === "All statuses" || status.toLowerCase() === statusFilter.toLowerCase()) &&
      (kind === "credits" || !customerFilter || row.customer_id === customerFilter) &&
      (kind !== "register" || billingTypeFilter === "All" || (row.sale_type === "CASH" ? "Cash" : "Credit") === billingTypeFilter) &&
      (kind === "credits" || !placeOfSupplyFilter || row.place_of_supply === placeOfSupplyFilter) &&
      (kind === "credits" || ((!dateFrom || row[config.date] >= dateFrom) && (!dateTo || row[config.date] <= dateTo)));
  }), [rows, search, statusFilter, customerFilter, billingTypeFilter, placeOfSupplyFilter, dateFrom, dateTo, config, kind]);

  const metrics = useMemo(() => {
    const metricRows = isNativeAndroid ? filtered : rows;
    if (kind === "register") {
      const paid = metricRows.filter(r => r.sale_type === "CASH").reduce((s, r) => s + num(r.total_amount), 0);
      const outstanding = metricRows.filter(r => r.sale_type !== "CASH").reduce((s, r) => s + num(r.total_amount), 0);
      return [metricRows.length, currency(metricRows.reduce((s, r) => s + num(r.total_amount), 0)), currency(paid), currency(outstanding)];
    }
    if (kind === "quotations") return [metricRows.length];
    if (kind === "orders") return [metricRows.filter(r => !["fulfilled", "cancelled"].includes((r.status || "draft").toLowerCase())).length, currency(metricRows.reduce((s, r) => s + num(r.total_amount), 0)), metricRows.filter(r => !["fulfilled", "cancelled"].includes((r.fulfillment_status || "pending").toLowerCase())).length];
    if (kind === "challans") return [];
    return [currency(metricRows.filter(r => r.status !== "Void").reduce((s, r) => s + num(r.total_amount), 0)), currency(metricRows.filter(r => r.status === "Applied").reduce((s, r) => s + num(r.total_amount), 0)), currency(metricRows.filter(r => !["Applied", "Void"].includes(r.status)).reduce((s, r) => s + num(r.total_amount), 0))];
  }, [filtered, rows, kind]);

  const handleLineItemChange = (index, itemId) => {
    const item = itemsMaster.find(row => row.id === itemId);
    setLines(prev => prev.map((line, i) => i === index ? {
      ...line,
      item_id: item?.id || "",
      description: item?.item_name || "",
      hsn_sac: item?.hsn_sac || "",
      unit: item?.unit || "",
      rate: String(item?.sales_rate || 0),
      gstRate: String(item?.gst_rate || 0),
      cessRate: String(item?.cess_rate || 0),
    } : line));
  };

  const handleOriginalInvoiceChange = async invoiceId => {
    const invoice = invoices.find(row => row.id === invoiceId);
    setForm(prev => ({ ...prev, originalInvoiceId: invoiceId, customerId: invoice?.customer_id || prev.customerId }));
    if (!invoiceId) { setLines([]); return; }
    try {
      const { data: originalItems, error: itemError } = await supabase
        .from("sales_invoice_items")
        .select("item_id, item_name, particulars, hsn_sac, unit, qty, rate, gst_rate, amount")
        .eq("invoice_id", invoiceId)
        .order("line_no", { ascending: true });
      if (itemError) throw itemError;

      const { data: priorNotes, error: noteError } = await supabase
        .from("credit_notes")
        .select("id, status")
        .eq("company_id", currentCompanyId)
        .eq("original_invoice_id", invoiceId)
        .eq("is_deleted", false);
      if (noteError) throw noteError;

      const activeNoteIds = (priorNotes || [])
        .filter(note => !["void", "cancelled"].includes(String(note.status || "").toLowerCase()))
        .map(note => note.id);
      let returnedRows = [];
      if (activeNoteIds.length) {
        const { data, error } = await supabase
          .from("credit_note_items")
          .select("item_id, item_name, qty")
          .in("credit_note_id", activeNoteIds);
        if (error) throw error;
        returnedRows = data || [];
      }

      const nextLines = (originalItems || []).map(item => {
        const itemKey = item.item_id || item.item_name || item.particulars;
        const returned = returnedRows
          .filter(row => (row.item_id || row.item_name) === itemKey)
          .reduce((sum, row) => sum + (Number(row.qty) || 0), 0);
        const originalQty = Number(item.qty) || 0;
        const maxQty = Math.max(0, originalQty - returned);
        const taxableRate = originalQty > 0 && Number.isFinite(Number(item.amount))
          ? Number(item.amount) / originalQty
          : Number(item.rate) || 0;
        return {
          item_id: item.item_id || "",
          description: item.item_name || item.particulars || "",
          hsn_sac: item.hsn_sac || "",
          unit: item.unit || "",
          qty: String(maxQty),
          rate: String(taxableRate),
          gstRate: String(Number(item.gst_rate) || 0),
          originalQty,
          returnedQty: returned,
          maxQty,
        };
      });
      setLines(nextLines);
    } catch (error) {
      setMessage(errorText(error));
      setLines([]);
    }
  };

  const openCreate = () => {
    setEditingQuotationId(null);
    setEditingOrderId(null);
    setEditingCreditNoteId(null);
    setForm({ date: new Date().toISOString().slice(0, 10), dueDate: "", customerId: "", originalInvoiceId: "", originalInvoiceMode: "invoice", reason: "", taxInclusive: false });
    setLines([{ description: "", qty: "1", rate: "0", gstRate: "0", cessRate: "0" }]);
    setMessage(""); setFormStep(1); setDialog(true);
  };

  const save = async event => {
    if (event?.preventDefault) event.preventDefault();
    if (!currentCompanyId) { setMessage("Select a company before creating a document."); return; }
    setSaving(true); setMessage("");
    try {
      const customer = customers.find(c => c.id === form.customerId);
      if (!customer) throw new Error("Select a customer.");
      if (kind === "credits" && isNativeAndroid && form.originalInvoiceMode === "invoice" && !form.originalInvoiceId) throw new Error("Select the original sales invoice, or choose Without Invoice Reference.");
      if (kind === "credits" && isNativeAndroid && form.originalInvoiceMode === "invoice" && lines.some(line => num(line.qty) > num(line.maxQty))) throw new Error("Return quantity cannot exceed the remaining returnable quantity.");
      const prefix = kind === "quotations" ? "QT" : kind === "orders" ? "SO" : "CN";
      const existing = await supabase.from(config.table).select("id", { count: "exact", head: true }).eq("company_id", currentCompanyId);
      if (existing.error) throw existing.error;
      const documentNo = editingQuotationId ? rows.find(row => row.id === editingQuotationId)?.invoice_no : editingOrderId ? rows.find(row => row.id === editingOrderId)?.order_no : editingCreditNoteId ? rows.find(row => row.id === editingCreditNoteId)?.credit_note_no : `${prefix}-${new Date(form.date).getFullYear()}-${String((existing.count || 0) + 1).padStart(5, "0")}`;
      const validLines = lines.filter(line => line.description.trim() && (!isNativeAndroid || num(line.qty) > 0));
      if (!validLines.length) throw new Error("Add at least one item or description.");
      const taxableValue = Math.round(validLines.reduce((sum, line) => { const combinedRate = num(line.gstRate) + num(line.cessRate); const base = form.taxInclusive ? num(line.rate) / (1 + combinedRate / 100) : num(line.rate); return sum + Math.max(0, num(line.qty)) * Math.max(0, base); }, 0) * 100) / 100;
      const taxAmount = Math.round(validLines.reduce((sum, line) => { const combinedRate = num(line.gstRate) + num(line.cessRate); const base = form.taxInclusive ? num(line.rate) / (1 + combinedRate / 100) : num(line.rate); return sum + Math.max(0, num(line.qty)) * Math.max(0, base) * Math.max(0, num(line.gstRate)) / 100; }, 0) * 100) / 100;
      const cessAmount = Math.round(validLines.reduce((sum, line) => { const combinedRate = num(line.gstRate) + num(line.cessRate); const base = form.taxInclusive ? num(line.rate) / (1 + combinedRate / 100) : num(line.rate); return sum + Math.max(0, num(line.qty)) * Math.max(0, base) * Math.max(0, num(line.cessRate)) / 100; }, 0) * 100) / 100;
      const intraState = Boolean(currentCompany?.state && customer.state && currentCompany.state.toLowerCase() === customer.state.toLowerCase());
      const cgst = intraState ? Math.round(taxAmount / 2 * 100) / 100 : 0;
      const sgst = intraState ? Math.round((taxAmount - cgst) * 100) / 100 : 0;
      const igst = intraState ? 0 : taxAmount;
      const amount = Math.round((taxableValue + taxAmount + cessAmount) * 100) / 100;
      const common = { company_id: currentCompanyId, customer_id: customer.id, customer_name: customer.customer_name, taxable_value: taxableValue, cgst, sgst, igst, ...(kind === "quotations" ? { cess_amount: cessAmount, tax_inclusive: Boolean(form.taxInclusive) } : {}), total_amount: amount, created_at: new Date().toISOString() };
      let table, header, itemTable, parentField, id;
      let previousItemIds = [];
      if (kind === "quotations") {
        table = "quotations"; itemTable = "quotation_items"; parentField = "invoice_id";
        header = { ...common, invoice_no: documentNo, invoice_date: form.date, valid_until: form.dueDate || null, status: editingQuotationId ? (rows.find(row => row.id === editingQuotationId)?.status || "Draft") : "Draft" };
      } else if (kind === "orders") {
        table = "sales_orders"; itemTable = "sales_order_items"; parentField = "order_id";
        const existingOrder = editingOrderId ? rows.find(row => row.id === editingOrderId) : null;
        header = { ...common, order_no: documentNo, order_date: form.date, expected_delivery_date: form.dueDate || null, status: existingOrder?.status || "Open", fulfillment_status: existingOrder?.fulfillment_status || "Pending" };
      } else {
        table = "credit_notes"; itemTable = "credit_note_items"; parentField = "credit_note_id";
        const existingCredit = editingCreditNoteId ? rows.find(row => row.id === editingCreditNoteId) : null;
        header = { ...common, created_at: existingCredit?.created_at || common.created_at, credit_note_no: documentNo, credit_note_date: form.date, original_invoice_id: form.originalInvoiceMode === "invoice" ? (form.originalInvoiceId || null) : null, original_invoice_no: form.originalInvoiceMode === "invoice" ? (invoices.find(i => i.id === form.originalInvoiceId)?.invoice_no || null) : null, reason: form.reason.trim(), status: existingCredit?.status || "Issued" };
        if (!header.reason) throw new Error("Enter a reason for this credit note.");
      }
      if (editingQuotationId && kind === "quotations") {
        id = editingQuotationId;
        const { error } = await supabase.from(table).update(header).eq("id", id).eq("company_id", currentCompanyId);
        if (error) throw error;
        const { data: oldItems, error: oldItemsError } = await supabase.from(itemTable).select("id").eq(parentField, id);
        if (oldItemsError) throw oldItemsError;
        previousItemIds = (oldItems || []).map(item => item.id);
      } else if (editingOrderId && kind === "orders") {
        id = editingOrderId;
        const { error } = await supabase.from(table).update(header).eq("id", id).eq("company_id", currentCompanyId);
        if (error) throw error;
        const { data: oldItems, error: oldItemsError } = await supabase.from(itemTable).select("id").eq(parentField, id);
        if (oldItemsError) throw oldItemsError;
        previousItemIds = (oldItems || []).map(item => item.id);
      } else if (editingCreditNoteId && kind === "credits") {
        id = editingCreditNoteId;
        const { error } = await supabase.from(table).update(header).eq("id", id).eq("company_id", currentCompanyId);
        if (error) throw error;
        const { data: oldItems, error: oldItemsError } = await supabase.from(itemTable).select("id").eq(parentField, id);
        if (oldItemsError) throw oldItemsError;
        previousItemIds = (oldItems || []).map(item => item.id);
      } else {
        const { data, error } = await supabase.from(table).insert(header).select("id").single();
        if (error) throw error;
        id = data.id;
      }
      const itemsToInsert = validLines.map((line, index) => ({
        [parentField]: id,
        line_no: index + 1,
        ...(isNativeAndroid ? { item_id: line.item_id || null, hsn_sac: line.hsn_sac || null, unit: line.unit || null } : {}),
        item_name: line.description.trim(),
        ...(kind === "quotations" ? { particulars: line.description.trim() } : { description: line.description.trim() }),
        qty: Math.max(0, num(line.qty)),
        rate: Math.max(0, num(line.rate)),
        gst_rate: Math.max(0, num(line.gstRate)),
        ...(kind === "quotations" ? { cess_rate: Math.max(0, num(line.cessRate)) } : {}),
        amount: Math.round((Math.max(0, num(line.qty)) * (form.taxInclusive ? num(line.rate) / (1 + (num(line.gstRate) + num(line.cessRate)) / 100) : num(line.rate))) * (1 + (Math.max(0, num(line.gstRate)) + Math.max(0, num(line.cessRate))) / 100) * 100) / 100
      }));
      const { error: itemError } = await supabase.from(itemTable).insert(itemsToInsert);
      if (itemError) { if (!editingQuotationId && !editingOrderId && !editingCreditNoteId) await supabase.from(table).delete().eq("id", id).eq("company_id", currentCompanyId); throw itemError; }
      if ((editingQuotationId || editingOrderId || editingCreditNoteId) && previousItemIds.length) {
        const { error: cleanupError } = await supabase.from(itemTable).delete().in("id", previousItemIds);
        if (cleanupError) throw cleanupError;
      }
      setDialog(false); setEditingQuotationId(null); setEditingOrderId(null); setEditingCreditNoteId(null); await load();
    } catch (error) { setMessage(errorText(error)); }
    finally { setSaving(false); }
  };

  const toggleQuotationMenu = (event, rowId) => {
    if (menuId === rowId) { setMenuId(null); setMenuPosition(null); return; }
    const rect = event.currentTarget.getBoundingClientRect();
    const menuHeight = 300;
    const top = Math.max(8, Math.min(rect.bottom + 6, window.innerHeight - menuHeight - 10));
    setMenuPosition({ top, right: Math.max(8, window.innerWidth - rect.right), maxHeight: Math.max(160, window.innerHeight - top - 12) });
    setMenuId(rowId);
  };

  const updateStatus = async (row, value, field = "status") => {
    const table = config.table;
    const { error } = await supabase.from(table).update({ [field]: value }).eq("id", row.id).eq("company_id", currentCompanyId);
    if (error) setMessage(errorText(error)); else setRows(prev => prev.map(item => item.id === row.id ? { ...item, [field]: value } : item));
  };

  const editQuotation = async row => {
    try {
      const { data: items, error } = await supabase.from("quotation_items").select("*").eq("invoice_id", row.id).order("line_no");
      if (error) throw error;
      setEditingQuotationId(row.id);
      setForm({ date: row.invoice_date || new Date().toISOString().slice(0, 10), dueDate: row.valid_until || "", customerId: row.customer_id || "", originalInvoiceId: "", reason: "", taxInclusive: Boolean(row.tax_inclusive) });
      setLines((items || []).map(item => ({ item_id: item.item_id || "", description: item.item_name || item.particulars || "", hsn_sac: item.hsn_sac || "", unit: item.unit || "", qty: String(item.qty ?? 1), rate: String(item.rate ?? 0), gstRate: String(item.gst_rate ?? 0), cessRate: String(item.cess_rate ?? 0) })));
      setFormStep(1); setMessage(""); setDialog(true); setMenuId(null); 
    } catch (error) { setMessage(errorText(error)); }
  };

  const editSalesOrder = async row => {
    try {
      const { data: items, error } = await supabase.from("sales_order_items").select("*").eq("order_id", row.id).order("line_no");
      if (error) throw error;
      setEditingOrderId(row.id);
      setEditingQuotationId(null);
      setForm({ date: row.order_date || new Date().toISOString().slice(0, 10), dueDate: row.expected_delivery_date || "", customerId: row.customer_id || "", originalInvoiceId: "", reason: "", taxInclusive: false });
      setLines((items || []).map(item => ({ item_id: item.item_id || "", description: item.item_name || item.description || "", hsn_sac: item.hsn_sac || "", unit: item.unit || "", qty: String(item.qty ?? 1), rate: String(item.rate ?? 0), gstRate: String(item.gst_rate ?? 0), cessRate: String(item.cess_rate ?? 0) })));
      setFormStep(1); setMessage(""); setDialog(true); setMenuId(null); setMenuPosition(null);
    } catch (error) { setMessage(errorText(error)); }
  };

  const makeSalesOrderPdf = async row => {
    const { data: items, error } = await supabase.from("sales_order_items").select("*").eq("order_id", row.id).order("line_no");
    if (error) throw error;
    const pdf = new jsPDF();
    const companyName = currentCompany?.company_name || "Company";
    pdf.setFontSize(18); pdf.text("SALES ORDER", 14, 20);
    pdf.setFontSize(11); pdf.text(companyName, 14, 29);
    pdf.setFontSize(10);
    pdf.text("Order No: " + (row.order_no || "—"), 14, 42);
    pdf.text("Order Date: " + dateText(row.order_date), 14, 49);
    pdf.text("Customer: " + (row.customer_name || "—"), 14, 56);
    pdf.text("Expected Delivery: " + dateText(row.expected_delivery_date), 14, 63);
    let y = 78;
    pdf.setFont("helvetica", "bold");
    pdf.text("Item / Description", 14, y); pdf.text("Qty", 118, y); pdf.text("Rate", 143, y); pdf.text("Amount", 174, y);
    pdf.setFont("helvetica", "normal"); y += 8;
    (items || []).forEach(item => {
      if (y > 270) { pdf.addPage(); y = 20; }
      const label = String(item.item_name || item.description || "—").slice(0, 55);
      pdf.text(label, 14, y); pdf.text(String(num(item.qty)), 118, y); pdf.text(currency(item.rate), 143, y); pdf.text(currency(item.amount), 174, y, { align: "right" }); y += 8;
    });
    y += 8; pdf.setFont("helvetica", "bold"); pdf.text("Order Total: " + currency(row.total_amount), 14, y);
    return { blob: pdf.output("blob"), fileName: (row.order_no || "Sales-Order") + ".pdf" };
  };

  const salesOrderAction = async (row, action) => {
    setMenuId(null); setMenuPosition(null);
    if (action === "View") return view(row);
    if (action === "Edit") return editSalesOrder(row);
    if (action === "Cancel") {
      if (!window.confirm("Cancel sales order " + (row.order_no || "") + "?")) return;
      await updateStatus(row, "Cancelled");
      return;
    }
    try {
      const result = await makeSalesOrderPdf(row);
      if (!result.blob || result.blob.size < 100) throw new Error("The sales order PDF could not be generated.");
      if (action === "Download") {
        if (isNativeAndroid) {
          const saved = await saveDocumentToPublicStorage({ blob: result.blob, fileName: result.fileName, folder: "Sales Orders", mimeType: "application/pdf" });
          const notification = await notifyPdfDownloaded({ fileUri: saved.uri, fileName: result.fileName, documentLabel: "Sales order PDF" });
          if (!notification?.ok) setMessage("Sales order PDF saved, but its notification could not be posted. " + (notification?.message || ""));
          else setMessage("");
        } else {
          const url = URL.createObjectURL(result.blob); const link = document.createElement("a");
          link.href = url; link.download = result.fileName; link.click(); setTimeout(() => URL.revokeObjectURL(url), 60000);
        }
        return;
      }
      if (action === "Share") {
        if (isNativeAndroid) {
          const bytes = new Uint8Array(await result.blob.arrayBuffer()); let binary = "";
          for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
          const saved = await Filesystem.writeFile({ path: "Sales Orders/" + result.fileName, data: btoa(binary), directory: Directory.Cache, recursive: true });
          await Share.share({ title: result.fileName, text: "Sales Order " + (row.order_no || ""), files: [saved.uri], dialogTitle: "Share sales order PDF" });
        } else {
          const file = new File([result.blob], result.fileName, { type: "application/pdf" });
          if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) await navigator.share({ title: result.fileName, files: [file] });
          else { const url = URL.createObjectURL(result.blob); const link = document.createElement("a"); link.href = url; link.download = result.fileName; link.click(); setTimeout(() => URL.revokeObjectURL(url), 60000); }
        }
      }
    } catch (error) { if (error.name !== "AbortError") setMessage(errorText(error)); }
  };

  const makeDeliveryChallanPdf = async row => {
    const { data: items, error } = await supabase.from("delivery_challan_items").select("*").eq("challan_id", row.id).order("created_at");
    if (error) throw error;
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const companyName = currentCompany?.company_name || row.company_name || "Company";
    pdf.setTextColor(23, 57, 95); pdf.setFont("helvetica", "bold"); pdf.setFontSize(18);
    pdf.text("DELIVERY CHALLAN", 14, 20);
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(10); pdf.text(companyName, 14, 28);
    pdf.setDrawColor(215, 225, 237); pdf.line(14, 33, 196, 33); pdf.setTextColor(38, 59, 89);
    pdf.text("Challan No: " + (row.challan_no || "—"), 14, 42);
    pdf.text("Date: " + dateText(row.challan_date), 14, 49);
    pdf.text("Customer: " + (row.customer_name || "—"), 14, 56);
    pdf.text("Sales Order: " + (row.sales_order_no || "—"), 14, 63);
    pdf.text("Place of Supply: " + (row.place_of_supply || "—"), 14, 70);
    pdf.text("Vehicle No: " + (row.vehicle_no || "—"), 110, 42);
    pdf.text("E-Way Bill No: " + (row.eway_bill_no || "—"), 110, 49);
    let y = 82;
    pdf.setFillColor(239, 244, 250); pdf.rect(14, y, 182, 9, "F");
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(9);
    pdf.text("Item / Description", 17, y + 6); pdf.text("Qty", 125, y + 6); pdf.text("Rate", 148, y + 6); pdf.text("Amount", 193, y + 6, { align: "right" });
    y += 15; pdf.setFont("helvetica", "normal");
    (items || []).forEach(item => {
      const itemLines = pdf.splitTextToSize(String(item.item_name || item.description || "—"), 100);
      const rowHeight = Math.max(8, itemLines.length * 4.5);
      if (y + rowHeight > 270) { pdf.addPage(); y = 20; }
      pdf.text(itemLines, 17, y); pdf.text(String(num(item.qty)), 125, y); pdf.text(currency(item.rate), 148, y); pdf.text(currency(item.amount), 193, y, { align: "right" });
      y += rowHeight + 3; pdf.setDrawColor(235, 239, 244); pdf.line(14, y - 1, 196, y - 1);
    });
    y += 7; if (y > 250) { pdf.addPage(); y = 22; }
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(10);
    pdf.text("Taxable Value: " + currency(row.taxable_value), 14, y); y += 7;
    pdf.text("CGST: " + currency(row.cgst), 14, y); y += 7;
    pdf.text("SGST: " + currency(row.sgst), 14, y); y += 7;
    pdf.text("IGST: " + currency(row.igst), 14, y); y += 9;
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(12); pdf.text("Total Amount: " + currency(row.total_amount), 14, y);
    return { blob: pdf.output("blob"), fileName: (row.challan_no || "Delivery-Challan") + ".pdf" };
  };

  const deliveryChallanAction = async (row, action) => {
    setMenuId(null); setMenuPosition(null);
    if (action === "View") {
      try {
        const result = await makeDeliveryChallanPdf(row);
        if (!result?.blob || result.blob.size < 100) throw new Error("The delivery challan PDF could not be generated.");
        setQuotationPreview({ ...result, row, documentType: "delivery-challan" });
      } catch (error) { setMessage(errorText(error)); }
      return;
    }
    if (action === "Edit") {
      navigate("/app/delivery-challans/new", { state: { editChallanId: row.id } });
      return;
    }
    if (action === "Cancel") {
      if (!window.confirm("Cancel delivery challan " + (row.challan_no || "") + "? It will be marked as Cancelled.")) return;
      await updateStatus(row, "Cancelled");
      return;
    }
    try {
      const result = await makeDeliveryChallanPdf(row);
      if (!result?.blob || result.blob.size < 100) throw new Error("The delivery challan PDF could not be generated.");
      if (action === "Download") {
        if (isNativeAndroid) {
          const saved = await saveDocumentToPublicStorage({ blob: result.blob, fileName: result.fileName, folder: "Delivery Challans", mimeType: "application/pdf" });
          const notification = await notifyPdfDownloaded({ fileUri: saved.uri, fileName: result.fileName, documentLabel: "Delivery challan PDF" });
          if (!notification?.ok) setMessage("Delivery challan PDF saved, but its notification could not be posted. " + (notification?.message || ""));
          else setMessage("");
        } else {
          const url = URL.createObjectURL(result.blob); const link = document.createElement("a");
          link.href = url; link.download = result.fileName; link.click(); setTimeout(() => URL.revokeObjectURL(url), 60000);
        }
        return;
      }
      if (action === "Share") {
        if (isNativeAndroid) {
          const bytes = new Uint8Array(await result.blob.arrayBuffer()); let binary = "";
          for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
          const saved = await Filesystem.writeFile({ path: "Delivery Challans/" + result.fileName, data: btoa(binary), directory: Directory.Cache, recursive: true });
          await Share.share({ title: result.fileName, text: "Delivery Challan " + (row.challan_no || ""), files: [saved.uri], dialogTitle: "Share delivery challan PDF" });
        } else {
          const file = new File([result.blob], result.fileName, { type: "application/pdf" });
          if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) await navigator.share({ title: result.fileName, files: [file] });
          else { const url = URL.createObjectURL(result.blob); const link = document.createElement("a"); link.href = url; link.download = result.fileName; link.click(); setTimeout(() => URL.revokeObjectURL(url), 60000); }
        }
      }
    } catch (error) { if (error.name !== "AbortError") setMessage(errorText(error)); }
  };

  const editCreditNote = async row => {
    try {
      const { data: items, error } = await supabase.from("credit_note_items").select("*").eq("credit_note_id", row.id).order("line_no");
      if (error) throw error;
      setEditingCreditNoteId(row.id); setEditingQuotationId(null); setEditingOrderId(null);
      setForm({ date: row.credit_note_date || new Date().toISOString().slice(0, 10), dueDate: "", customerId: row.customer_id || "", originalInvoiceId: row.original_invoice_id || "", originalInvoiceMode: row.original_invoice_id ? "invoice" : "without_invoice", reason: row.reason || "", taxInclusive: false });
      setLines((items || []).map(item => ({ item_id: item.item_id || "", description: item.item_name || item.description || "", hsn_sac: item.hsn_sac || "", unit: item.unit || "", qty: String(item.qty ?? 0), rate: String(item.rate ?? 0), gstRate: String(item.gst_rate ?? 0), cessRate: "0", originalQty: Number(item.qty) || 0, returnedQty: 0, maxQty: Number(item.qty) || 0 })));
      setFormStep(1); setMessage(""); setDialog(true); setMenuId(null); setMenuPosition(null);
    } catch (error) { setMessage(errorText(error)); }
  };

  const makeCreditNotePdf = async row => {
    const { data: items, error } = await supabase.from("credit_note_items").select("*").eq("credit_note_id", row.id).order("line_no");
    if (error) throw error;
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    pdf.setTextColor(23, 57, 95); pdf.setFont("helvetica", "bold"); pdf.setFontSize(18); pdf.text("CREDIT NOTE", 14, 20);
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(10); pdf.text(currentCompany?.company_name || "Company", 14, 28);
    pdf.setDrawColor(215, 225, 237); pdf.line(14, 33, 196, 33); pdf.setTextColor(38, 59, 89);
    pdf.text("Credit Note No: " + (row.credit_note_no || "—"), 14, 42);
    pdf.text("Date: " + dateText(row.credit_note_date), 14, 49);
    pdf.text("Customer: " + (row.customer_name || "—"), 14, 56);
    pdf.text("Original Invoice: " + (row.original_invoice_no || "—"), 14, 63);
    const reasonLines = pdf.splitTextToSize("Reason: " + (row.reason || "—"), 178);
    pdf.text(reasonLines, 14, 70);
    let y = 76 + reasonLines.length * 5;
    pdf.setFillColor(239, 244, 250); pdf.rect(14, y, 182, 9, "F");
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(9);
    pdf.text("Item / Description", 17, y + 6); pdf.text("Qty", 125, y + 6); pdf.text("Rate", 148, y + 6); pdf.text("Amount", 193, y + 6, { align: "right" });
    y += 15; pdf.setFont("helvetica", "normal");
    (items || []).forEach(item => {
      const itemLines = pdf.splitTextToSize(String(item.item_name || item.description || "—"), 100);
      const rowHeight = Math.max(8, itemLines.length * 4.5);
      if (y + rowHeight > 270) { pdf.addPage(); y = 20; }
      pdf.text(itemLines, 17, y); pdf.text(String(num(item.qty)), 125, y); pdf.text(currency(item.rate), 148, y); pdf.text(currency(item.amount), 193, y, { align: "right" });
      y += rowHeight + 3; pdf.setDrawColor(235, 239, 244); pdf.line(14, y - 1, 196, y - 1);
    });
    y += 7; if (y > 270) { pdf.addPage(); y = 22; }
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(10);
    pdf.text("Taxable Value: " + currency(row.taxable_value), 14, y); y += 7;
    pdf.text("CGST: " + currency(row.cgst), 14, y); y += 7;
    pdf.text("SGST: " + currency(row.sgst), 14, y); y += 7;
    pdf.text("IGST: " + currency(row.igst), 14, y); y += 9;
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(12); pdf.text("Credit Note Total: " + currency(row.total_amount), 14, y);
    return { blob: pdf.output("blob"), fileName: (row.credit_note_no || "Credit-Note") + ".pdf" };
  };

  const creditNoteAction = async (row, action) => {
    setMenuId(null); setMenuPosition(null);
    if (action === "View") {
      try {
        const result = await makeCreditNotePdf(row);
        if (!result?.blob || result.blob.size < 100) throw new Error("The credit note PDF could not be generated.");
        setQuotationPreview({ ...result, row, documentType: "credit-note" });
      } catch (error) { setMessage(errorText(error)); }
      return;
    }
    if (action === "Edit") return editCreditNote(row);
    if (action === "Cancel") {
      if (!window.confirm("Cancel credit note " + (row.credit_note_no || "") + "? It will be marked as void.")) return;
      await updateStatus(row, "Void"); return;
    }
    try {
      const result = await makeCreditNotePdf(row);
      if (!result?.blob || result.blob.size < 100) throw new Error("The credit note PDF could not be generated.");
      if (action === "Download") {
        if (isNativeAndroid) {
          const saved = await saveDocumentToPublicStorage({ blob: result.blob, fileName: result.fileName, folder: "Credit Notes", mimeType: "application/pdf" });
          const notice = await notifyPdfDownloaded({ fileUri: saved.uri, fileName: result.fileName, documentLabel: "Credit note PDF" });
          if (!notice?.ok) setMessage("Credit note PDF saved, but its notification could not be posted. " + (notice?.message || ""));
          else setMessage("");
        } else {
          const url = URL.createObjectURL(result.blob); const link = document.createElement("a"); link.href = url; link.download = result.fileName; link.click(); setTimeout(() => URL.revokeObjectURL(url), 60000);
        }
        return;
      }
      if (action === "Share") {
        if (isNativeAndroid) {
          const bytes = new Uint8Array(await result.blob.arrayBuffer()); let binary = "";
          for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
          const saved = await Filesystem.writeFile({ path: "Credit Notes/" + result.fileName, data: btoa(binary), directory: Directory.Cache, recursive: true });
          await Share.share({ title: result.fileName, text: "Credit Note " + (row.credit_note_no || ""), files: [saved.uri], dialogTitle: "Share credit note PDF" });
        } else {
          const file = new File([result.blob], result.fileName, { type: "application/pdf" });
          if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) await navigator.share({ title: result.fileName, files: [file] });
          else { const url = URL.createObjectURL(result.blob); const link = document.createElement("a"); link.href = url; link.download = result.fileName; link.click(); setTimeout(() => URL.revokeObjectURL(url), 60000); }
        }
      }
    } catch (error) { if (error.name !== "AbortError") setMessage(errorText(error)); }
  };

  const makeQuotationPdf = async row => {
    const [itemsResult, customerResult, settings] = await Promise.all([
      supabase.from("quotation_items").select("*").eq("invoice_id", row.id).order("line_no"),
      row.customer_id ? supabase.from("customers").select("*").eq("id", row.customer_id).eq("company_id", currentCompanyId).maybeSingle() : Promise.resolve({ data: null, error: null }),
      getInvoiceSettings(currentCompanyId)
    ]);
    if (itemsResult.error) throw itemsResult.error;
    if (customerResult.error) throw customerResult.error;
    if (!itemsResult.data?.length) throw new Error("This quotation has no saved item lines. Please edit and save it before generating a PDF.");
    const result = await createQuotationPdf({ document: row, items: itemsResult.data, company: currentCompany || {}, customer: customerResult.data || {}, settings: settings || {} });
    if (!result?.blob || result.blob.size < 100) throw new Error("The quotation PDF could not be generated. Please try again.");
    return result;
  };

  const writeQuotationPdf = async (result, directory = Directory.Documents) => {
    if (directory === Directory.Documents && isNativeAndroid) {
      const saved = await saveDocumentToPublicStorage({
        blob: result.blob,
        fileName: result.fileName,
        folder: "Quotations",
        mimeType: "application/pdf"
      });
      return saved.uri;
    }
    const bytes = new Uint8Array(await result.blob.arrayBuffer());
    let binary = "";
    for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    const saved = await Filesystem.writeFile({ path: "Quotations/" + result.fileName, data: btoa(binary), directory, recursive: true });
    return saved.uri;
  };

  const openQuotationPreview = async row => {
    try {
      setMessage("");
      const result = await makeQuotationPdf(row);
      setQuotationPreview({ ...result, row });
      setMenuId(null); setMenuPosition(null);
    } catch (error) { setMessage(errorText(error)); }
  };

  const shareQuotation = async row => {
    try {
      const result = await makeQuotationPdf(row);
      if (isNativeAndroid) {
        const uri = await writeQuotationPdf(result, Directory.Cache);
        await Share.share({ title: result.fileName, text: "Quotation " + (row.invoice_no || ""), files: [uri], dialogTitle: "Share quotation PDF" });
      } else {
        const file = new File([result.blob], result.fileName, { type: "application/pdf" });
        if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) await navigator.share({ title: result.fileName, files: [file] });
        else { const url = URL.createObjectURL(result.blob); const link = document.createElement("a"); link.href = url; link.download = result.fileName; link.click(); setTimeout(() => URL.revokeObjectURL(url), 60000); }
      }
    } catch (error) { if (error.name !== "AbortError") setMessage(errorText(error)); }
  };

  const downloadQuotation = async row => {
    try {
      const result = await makeQuotationPdf(row);
      if (isNativeAndroid) {
        const uri = await writeQuotationPdf(result, Directory.Documents);
        const notification = await notifyPdfDownloaded({ fileUri: uri, fileName: result.fileName, documentLabel: "Quotation PDF" });
        if (!notification?.ok) {
          setMessageType("error");
          setMessage("Quotation PDF was saved, but the Android system notification could not be posted. " + (notification?.message || ""));
        } else {
          setMessage("");
        }
        setMenuId(null); setMenuPosition(null);
        return uri;
      }
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement("a"); link.href = url; link.download = result.fileName; document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      setMessageType("success");
      setMessage("Quotation PDF download started: " + result.fileName);
      setDownloadNotice({ fileName: result.fileName, location: "your browser's Downloads folder", uri: null });
    } catch (error) { setMessageType("error"); setMessage(errorText(error)); }
  };

  const view = async row => {
    const itemConfig = {
      register: ["sales_invoice_items", "invoice_id", "line_no"],
      quotations: ["quotation_items", "invoice_id", "line_no"],
      orders: ["sales_order_items", "order_id", "line_no"],
      challans: ["delivery_challan_items", "challan_id", "created_at"],
      credits: ["credit_note_items", "credit_note_id", "line_no"],
    }[kind];
    const [table, parent, orderBy] = itemConfig;
    const { data: items, error } = await supabase.from(table).select("*").eq(parent, row.id).order(orderBy);
    if (error) setMessage(errorText(error));
    setSelected({ ...row, items: items || [] });
  };

  const printInvoice = async row => {
    const { data: items } = await supabase.from("sales_invoice_items").select("*").eq("invoice_id", row.id).order("line_no");
    const rowsHtml = (items || []).map((i, n) => `<tr><td>${n + 1}</td><td>${i.item_name || i.particulars || ""}</td><td>${num(i.qty)}</td><td>${currency(i.rate)}</td><td>${currency(i.amount)}</td></tr>`).join("");
    const popup = window.open("", "_blank", "width=900,height=700");
    if (!popup) return;
    popup.document.write(`<!doctype html><html><head><title>${row.invoice_no}</title><style>body{font:14px Arial;padding:32px;color:#15243b}h1{margin:0 0 6px}table{width:100%;border-collapse:collapse;margin-top:20px}td,th{border:1px solid #dbe2ea;padding:9px;text-align:left}th{background:#eff4fa}.total{text-align:right;font-weight:bold;margin-top:18px}</style></head><body><h1>Tax Invoice</h1><p>${currentCompany?.company_name || ""}</p><hr><p>Invoice: ${row.invoice_no} &nbsp; Date: ${dateText(row.invoice_date)}</p><p>Bill To: ${row.customer_name || ""}</p><table><thead><tr><th>#</th><th>Item / Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>${rowsHtml}</tbody></table><p class="total">Grand Total: ${currency(row.total_amount)}</p></body></html>`);
    popup.document.close(); popup.focus(); popup.print();
  };

  const writeSalesInvoicePdf = async (result, directory = Directory.Documents) => {
    if (directory === Directory.Documents && isNativeAndroid) {
      const saved = await saveDocumentToPublicStorage({
        blob: result.blob,
        fileName: result.fileName,
        folder: "Sales Invoices",
        mimeType: "application/pdf"
      });
      return saved.uri;
    }
    const bytes = new Uint8Array(await result.blob.arrayBuffer());
    let binary = "";
    for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    const saved = await Filesystem.writeFile({ path: "Sales Invoices/" + result.fileName, data: btoa(binary), directory, recursive: true });
    return saved.uri;
  };

  const registerAction = async (row, action) => {
    setMenuId(null);
    if (action === "Preview" || action === "View") {
      setInvoicePreviewLoading(true);
      setMessage("");
      try {
        const [itemResult, customerResult, settings] = await Promise.all([
          supabase.from("sales_invoice_items").select("*").eq("invoice_id", row.id).order("line_no"),
          supabase.from("customers").select("*").eq("id", row.customer_id).eq("company_id", currentCompanyId).maybeSingle(),
          getInvoiceSettings(currentCompanyId)
        ]);
        if (itemResult.error) throw itemResult.error;
        if (customerResult.error) throw customerResult.error;
        setInvoicePreview({
          invoice: row,
          items: itemResult.data || [],
          settings,
          company: currentCompany || {},
          customer: customerResult.data || null
        });
      } catch (error) {
        setMessage(errorText(error));
        setMessageType("error");
      } finally {
        setInvoicePreviewLoading(false);
      }
      return;
    }
    if (action === "Edit") return navigate("/app/sales", { state: { editInvoiceId: row.id } });
    if (action === "Delete" || action === "Cancel Invoice") return deleteRow(row);
    try {
      const [itemResult, customerResult, settings] = await Promise.all([
        supabase.from("sales_invoice_items").select("*").eq("invoice_id", row.id).order("line_no"),
        row.customer_id
          ? supabase.from("customers").select("*").eq("id", row.customer_id).eq("company_id", currentCompanyId).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        getInvoiceSettings(currentCompanyId)
      ]);
      if (itemResult.error) throw itemResult.error;
      if (customerResult.error) throw customerResult.error;
      const result = await buildSalesInvoicePdf({
        invoice: row,
        items: itemResult.data || [],
        settings,
        company: currentCompany || {},
        customer: customerResult.data || null
      });
      if (!result?.blob || result.blob.size < 100) throw new Error("The sales invoice PDF could not be generated. Please try again.");
      if (action === "Download") {
        if (isNativeAndroid) {
          const uri = await writeSalesInvoicePdf(result, Directory.Documents);
          const notification = await notifyPdfDownloaded({ fileUri: uri, fileName: result.fileName, documentLabel: "Sales invoice PDF" });
          if (!notification?.ok) {
            setMessageType("error");
            setMessage("Sales invoice PDF was saved, but the Android system notification could not be posted. " + (notification?.message || ""));
          } else {
            setMessage("");
          }
          return;
        }
        const url = URL.createObjectURL(result.blob);
        const link = document.createElement("a");
        link.href = url; link.download = result.fileName; document.body.appendChild(link); link.click(); link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
        setMessageType("success");
        setMessage("Sales invoice PDF download started: " + result.fileName);
        setDownloadNotice({ fileName: result.fileName, location: "your browser's Downloads folder", uri: null });
        return;
      }
      if (action === "Share") {
        if (isNativeAndroid) {
          const uri = await writeSalesInvoicePdf(result, Directory.Cache);
          await Share.share({ title: result.fileName, text: "Sales invoice " + (row.invoice_no || ""), files: [uri], dialogTitle: "Share sales invoice PDF" });
          return;
        }
        const file = new File([result.blob], result.fileName, { type: "application/pdf" });
        if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) await navigator.share({ title: result.fileName, files: [file] });
        else {
          const url = URL.createObjectURL(result.blob);
          const link = document.createElement("a"); link.href = url; link.download = result.fileName; link.click();
          setTimeout(() => URL.revokeObjectURL(url), 60000);
          setMessageType("success");
          setMessage("PDF downloaded. Attach it to WhatsApp or email to share.");
        }
      }
    } catch (error) { if (error.name !== "AbortError") { setMessageType("error"); setMessage(errorText(error)); } }
  };

  const deleteRow = async row => {
    const prompt = kind === "register" ? `Delete invoice ${row[config.number]}? The invoice number will remain reserved and the record will be removed from the active Sales Register.` : `Delete ${row[config.number]}? This will remove it from this register.`;
    if (!window.confirm(prompt)) return;
    const { error } = await supabase.from(config.table).update({ is_deleted: true }).eq("id", row.id).eq("company_id", currentCompanyId);
    if (error) setMessage(errorText(error)); else setRows(prev => prev.filter(item => item.id !== row.id));
  };

  const createAction = kind === "register" ? () => navigate("/app/sales") : kind === "challans" ? () => navigate("/app/delivery-challans/new") : openCreate;
  const actionLabel = kind === "register" ? "New Sales Invoice" : kind === "quotations" ? "New Quotation" : kind === "orders" ? "New Sales Order" : kind === "challans" ? "New Delivery Challan" : "Create Credit Note";
  const statuses = kind === "register" ? [] : kind === "quotations" ? ["Draft", "Sent", "Accepted", "Rejected", "Expired"] : kind === "orders" ? ["Open", "Confirmed", "Partially Fulfilled", "Fulfilled", "Cancelled"] : kind === "challans" ? ["Draft", "Ready to Dispatch", "In Transit", "Delivered", "Cancelled"] : ["Draft", "Issued", "Applied", "Void"];

  const activeRegisterFilterCount = [statusFilter !== "All statuses", Boolean(customerFilter), billingTypeFilter !== "All", Boolean(placeOfSupplyFilter), Boolean(dateFrom), Boolean(dateTo)].filter(Boolean).length;

  return <main className={`sales-workspace ${kind === "register" ? "sw-register-workspace" : ""}`} >
    <header className="sw-heading"><div>{kind !== "register" && kind !== "orders" && kind !== "challans" && <p className="sw-breadcrumb">Billing &amp; Accounting / Sales / {config.title}</p>}<h1>{config.title}</h1>{kind !== "register" && kind !== "orders" && kind !== "challans" && <p className="sw-subtitle">Manage {config.title.toLowerCase()} for {currentCompany?.company_name || "your selected company"}.</p>}</div><button className="sw-primary" onClick={createAction}>＋ {actionLabel}</button></header>
    {message && <div className={`sw-alert ${messageType === "success" ? "sw-alert-success" : ""}`} role={messageType === "success" ? "status" : "alert"}>{message}<button onClick={() => setMessage("")}>×</button></div>}
    {!currentCompanyId ? <div className="sw-empty">Choose a current company from the sidebar to view its sales records.</div> : <>
    {kind !== "quotations" && kind !== "register" && kind !== "orders" && kind !== "credits" && kind !== "challans" && <section className={`sw-metrics sw-metrics-${metrics.length}`}>{config.metrics.map((label, i) => <article className="sw-metric" key={label}><span>{label}</span><strong>{metrics[i]}</strong></article>)}</section>}
    {kind === "challans" ? <section className="sw-filters sw-challan-filters"><select aria-label="Universal delivery challan filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option>All statuses</option>{statuses.map(status => <option key={status}>{status}</option>)}</select><label className="sw-search"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search delivery challans" /></label></section> : kind === "credits" ? <section className="sw-filters sw-credit-filters"><select aria-label="Universal credit note filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option>All statuses</option>{statuses.map(status => <option key={status}>{status}</option>)}</select><label className="sw-search"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search credit notes" /></label></section> : kind === "orders" ? <section className="sw-filters sw-order-filters"><select aria-label="Universal sales order filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option>All statuses</option>{statuses.map(status => <option key={status}>{status}</option>)}</select><label className="sw-search"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sales orders" /></label></section> : kind === "quotations" ? <section className="sw-filters sw-quotation-filters">
      <div className="sw-quotation-date-wrap">
        <button type="button" className="sw-quotation-date-trigger" onClick={() => { setDraftDateFrom(dateFrom); setDraftDateTo(dateTo); setShowQuotationDatePopover(value => !value); }}>
          <span>▦</span><span>{dateFrom || dateTo ? "Custom period" : "All dates"}</span><span>⌄</span>
        </button>
        {showQuotationDatePopover && <><button type="button" className="sw-date-popover-dismiss" aria-label="Close date filter" onClick={() => setShowQuotationDatePopover(false)} /><div className="sw-quotation-date-popover">
          <strong>Custom date range</strong>
          <label>From<input type="date" value={draftDateFrom} max={draftDateTo || undefined} onChange={e => setDraftDateFrom(e.target.value)} /></label>
          <label>To<input type="date" value={draftDateTo} min={draftDateFrom || undefined} onChange={e => setDraftDateTo(e.target.value)} /></label>
          <div><button type="button" className="sw-date-clear" onClick={() => { setDraftDateFrom(""); setDraftDateTo(""); setDateFrom(""); setDateTo(""); setShowQuotationDatePopover(false); }}>Clear</button><button type="button" className="sw-date-apply" onClick={() => { setDateFrom(draftDateFrom); setDateTo(draftDateTo); setShowQuotationDatePopover(false); }}>Apply</button></div>
        </div></>}
      </div>
      <label className="sw-search"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search quotations" /></label>
    </section> : kind === "register" ? <section className="sw-filters sw-register-filters">
      <div className="sw-register-filter-toolbar">
        <label className="sw-search"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by number or customer" /></label>
        <button type="button" className={showRegisterFilters ? "sw-register-filter-toggle active" : "sw-register-filter-toggle"} aria-expanded={showRegisterFilters} onClick={() => setShowRegisterFilters(value => !value)}>
          <span>☷</span> Filters {activeRegisterFilterCount > 0 && <span className="sw-register-filter-count">{activeRegisterFilterCount}</span>} <span className="sw-register-filter-chevron">{showRegisterFilters ? "⌃" : "⌄"}</span>
        </button>
      </div>
      {showRegisterFilters && <div className="sw-register-filter-panel">
        <label className="sw-register-filter-field"><span>Status</span><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option>All statuses</option><option>Paid</option><option>Outstanding</option></select></label>
        <label className="sw-register-filter-field"><span>Customer</span><select value={customerFilter} onChange={e => setCustomerFilter(e.target.value)}><option value="">All customers</option>{customers.map(customer => <option key={customer.id} value={customer.id}>{customer.customer_name}</option>)}</select></label>
        <label className="sw-register-filter-field"><span>Billing type</span><select value={billingTypeFilter} onChange={e => setBillingTypeFilter(e.target.value)}><option value="All">All billing types</option><option value="Cash">Cash</option><option value="Credit">Credit</option></select></label>
        <label className="sw-register-filter-field"><span>Place of supply</span><select value={placeOfSupplyFilter} onChange={e => setPlaceOfSupplyFilter(e.target.value)}><option value="">All states</option>{[...new Set(rows.map(row => row.place_of_supply).filter(Boolean))].sort().map(state => <option key={state} value={state}>{state}</option>)}</select></label>
        <label className="sw-register-filter-field"><span>From date</span><input type="date" value={dateFrom} max={dateTo || undefined} onChange={e => setDateFrom(e.target.value)} /></label>
        <label className="sw-register-filter-field"><span>To date</span><input type="date" value={dateTo} min={dateFrom || undefined} onChange={e => setDateTo(e.target.value)} /></label>
        <div className="sw-register-filter-actions"><button type="button" className="sw-reset" onClick={() => { setStatusFilter("All statuses"); setCustomerFilter(""); setBillingTypeFilter("All"); setPlaceOfSupplyFilter(""); setDateFrom(""); setDateTo(""); setSearch(""); }}>Clear filters</button></div>
      </div>}
    </section> : <section className="sw-filters"><label className="sw-search"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by number or customer" /></label>
      <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option>All statuses</option>{statuses.map(s => <option key={s}>{s}</option>)}</select>
      <label>From <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></label><label>To <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} /></label>
      <button className="sw-reset" onClick={() => { setSearch(""); setStatusFilter("All statuses"); setDateFrom(""); setDateTo(""); }}>Reset</button>
    </section>}
    <section className="sw-table-card"><div className="sw-table-top"><div><h2>{config.title}</h2><span>{filtered.length} records</span></div>{kind !== "quotations" && <button className="sw-export" onClick={() => window.print()}>Print list</button>}</div>
      {loading ? <div className="sw-empty">Loading records…</div> : filtered.length === 0 ? <div className="sw-empty"><strong>No records found</strong><span>Create your first {config.title.toLowerCase()} to see it here.</span><button className="sw-primary" onClick={createAction}>＋ {actionLabel}</button></div> :
      kind === "challans" ? <div className="sw-challan-card-list">{filtered.map(row => <article className="sw-challan-transaction-card" key={row.id}><div className="sw-challan-card-top"><strong>{row.challan_no || "—"}</strong><time dateTime={row.challan_date || ""}>{dateText(row.challan_date)}</time></div><div className="sw-challan-card-bottom"><span>{row.customer_name || row.company_name || currentCompany?.company_name || "—"}</span><div className="sw-challan-card-actions"><strong>{currency(row.total_amount)}</strong><button type="button" className="sw-kebab" aria-label={"Actions for " + row.challan_no} aria-expanded={menuId === row.id} onClick={event => toggleQuotationMenu(event, row.id)}>⋮</button></div></div>{menuId === row.id && menuPosition && createPortal(<><div className="sw-menu-dismiss" onClick={() => { setMenuId(null); setMenuPosition(null); }} /><div className="sw-menu sw-challan-action-menu sw-quotation-menu-portal" style={{ position: "fixed", top: menuPosition.top, right: menuPosition.right, maxHeight: menuPosition.maxHeight, overflowY: "auto" }}>{["View","Edit","Download","Share","Cancel"].map(action => <button type="button" key={action} className={action === "Cancel" ? "sw-register-delete-action" : ""} onClick={() => deliveryChallanAction(row, action)}>{action}</button>)}</div></>, document.body)}</article>)}</div> : kind === "credits" ? <div className="sw-credit-card-list">{filtered.map(row => <article className="sw-credit-transaction-card" key={row.id}><div className="sw-credit-card-top"><strong>{row.credit_note_no || "—"}</strong><time dateTime={row.credit_note_date || ""}>{dateText(row.credit_note_date)}</time></div><div className="sw-credit-card-bottom"><span>{row.customer_name || "—"}</span><div className="sw-credit-card-actions"><strong>{currency(row.total_amount)}</strong><button type="button" className="sw-kebab" aria-label={"Actions for " + row.credit_note_no} aria-expanded={menuId === row.id} onClick={event => toggleQuotationMenu(event, row.id)}>⋮</button></div></div>{menuId === row.id && menuPosition && createPortal(<><div className="sw-menu-dismiss" onClick={() => { setMenuId(null); setMenuPosition(null); }} /><div className="sw-menu sw-credit-action-menu sw-quotation-menu-portal" style={{ position: "fixed", top: menuPosition.top, right: menuPosition.right, maxHeight: menuPosition.maxHeight, overflowY: "auto" }}>{["View","Edit","Download","Share","Cancel"].map(action => <button type="button" key={action} className={action === "Cancel" ? "sw-register-delete-action" : ""} onClick={() => creditNoteAction(row, action)}>{action}</button>)}</div></>, document.body)}</article>)}</div> : kind === "orders" ? <div className="sw-order-card-list">{filtered.map(row => <article className="sw-order-transaction-card" key={row.id}><div className="sw-order-card-top"><strong>{row.order_no || "—"}</strong><time dateTime={row.order_date || ""}>{dateText(row.order_date)}</time></div><div className="sw-order-card-bottom"><span>{row.customer_name || currentCompany?.company_name || "—"}</span><div className="sw-order-card-actions"><strong>{currency(row.total_amount)}</strong><button type="button" className="sw-kebab" aria-label={"Actions for " + row.order_no} aria-expanded={menuId === row.id} onClick={event => toggleQuotationMenu(event, row.id)}>⋮</button></div></div>{menuId === row.id && menuPosition && createPortal(<><div className="sw-menu-dismiss" onClick={() => { setMenuId(null); setMenuPosition(null); }} /><div className="sw-menu sw-order-action-menu sw-quotation-menu-portal" style={{ position: "fixed", top: menuPosition.top, right: menuPosition.right, maxHeight: menuPosition.maxHeight, overflowY: "auto" }}>{["View","Edit","Download","Share","Cancel"].map(action => <button type="button" key={action} className={action === "Cancel" ? "sw-register-delete-action" : ""} onClick={() => salesOrderAction(row, action)}>{action}</button>)}</div></>, document.body)}</article>)}</div> : kind === "register" ? <div className="sw-register-card-list">{filtered.map(row => {
        const paymentStatus = String(row.payment_status || "").trim().toLowerCase();
        const isPaid = paymentStatus ? ["paid", "fully paid", "settled", "complete", "completed"].includes(paymentStatus) : row.sale_type === "CASH";
        return <article className="sw-register-transaction-card" key={row.id}>
          <div className="sw-register-card-main">
            <div className="sw-register-card-details">
              <strong className="sw-register-customer-name">{row.customer_name || "—"}</strong>
              <img className={"sw-register-payment-emblem " + (isPaid ? "is-paid" : "is-unpaid")} src={isPaid ? "/assets/payment-emblems/paid.svg" : "/assets/payment-emblems/unpaid.svg"} alt={isPaid ? "Paid" : "Unpaid"} />
              <div className="sw-register-card-meta">
                <time dateTime={row.invoice_date || ""}>{dateText(row.invoice_date)}</time>
                <span aria-hidden="true">·</span>
                <span className="sw-register-invoice-number">{row.invoice_no || "—"}</span>
              </div>
            </div>
            <strong className="sw-register-card-amount">{currency(row.total_amount)}</strong>
            <button type="button" className="sw-kebab sw-register-card-menu-button" aria-label={"Actions for " + row.invoice_no} aria-expanded={menuId === row.id} onClick={event => toggleQuotationMenu(event, row.id)}>⋮</button>
          </div>
          {menuId === row.id && menuPosition && createPortal(<><div className="sw-menu-dismiss" onClick={() => { setMenuId(null); setMenuPosition(null); }} /><div className="sw-menu sw-register-action-menu sw-quotation-menu-portal" style={{ position: "fixed", top: menuPosition.top, right: menuPosition.right, maxHeight: menuPosition.maxHeight, overflowY: "auto" }}>
            <button type="button" onClick={() => { setMenuId(null); setMenuPosition(null); registerAction(row, "Preview"); }}>Preview</button>
            <button type="button" onClick={() => { setMenuId(null); setMenuPosition(null); registerAction(row, "Edit"); }}>Edit</button>
            <button type="button" onClick={() => { setMenuId(null); setMenuPosition(null); registerAction(row, "Download"); }}>Download</button>
            <button type="button" onClick={() => { setMenuId(null); setMenuPosition(null); registerAction(row, "Share"); }}>Share</button>
            <button type="button" className="sw-register-delete-action" onClick={() => { setMenuId(null); setMenuPosition(null); registerAction(row, "Delete"); }}>Delete</button>
          </div></>, document.body)}
        </article>;
      })}</div> : <div className="sw-table-scroll"><table className={kind === "quotations" ? "sw-quotation-table" : ""}><thead><tr>{config.columns.map(c => <th key={c}>{c}</th>)}<th>Actions</th></tr></thead><tbody>{filtered.map(row => {
        const status = kind === "register" ? (row.sale_type === "CASH" ? "Paid" : "Outstanding") : row.status || "Draft";
        const balance = kind === "register" ? (row.sale_type === "CASH" ? 0 : num(row.total_amount)) : null;
        return <tr key={row.id} className={kind === "quotations" ? "sw-quotation-row" : ""}>
          {kind === "quotations" ? <><td data-label="Date">{dateText(row[config.date])}</td><td data-label="Customer" className="sw-quotation-customer">{row.customer_name || "—"}</td></> : <><td className="sw-docno" data-label={config.columns[0]}>{row[config.number] || "—"}</td><td data-label={config.columns[1]}>{dateText(row[config.date])}</td><td data-label={config.columns[2]}>{row.customer_name || "—"}</td></>}
          {kind === "register" && <><td data-label="Type"><span className="sw-type">{row.sale_type === "CASH" ? "Cash sale" : "Credit sale"}</span></td><td data-label="Payment status"><span className={`sw-status ${status.toLowerCase()}`}>{status}</span></td><td data-label="Total" className="sw-money">{currency(row.total_amount)}</td><td data-label="Paid" className="sw-money">{currency(balance === 0 ? row.total_amount : 0)}</td><td data-label="Balance" className="sw-money">{currency(balance)}</td></>}
          {kind === "quotations" && <td data-label="Amount" className="sw-money sw-quotation-amount"><div className="sw-quotation-amount-inner"><strong>{currency(row.total_amount)}</strong><div className="sw-menu-wrap"><button type="button" className="sw-kebab" aria-label={"Actions for " + row.invoice_no} aria-expanded={menuId === row.id} onClick={event => toggleQuotationMenu(event, row.id)}>⋮</button>{menuId === row.id && menuPosition && createPortal(<><div className="sw-menu-dismiss" onClick={() => { setMenuId(null); setMenuPosition(null); }} /><div className="sw-menu sw-quotation-menu sw-quotation-menu-portal" style={{ position: "fixed", top: menuPosition.top, right: menuPosition.right, maxHeight: menuPosition.maxHeight, overflowY: "auto" }}><button type="button" onClick={() => openQuotationPreview(row)}>View PDF</button><button type="button" onClick={() => editQuotation(row)}>Edit</button><button type="button" onClick={() => shareQuotation(row)}>Share</button><button type="button" onClick={() => downloadQuotation(row)}>Download</button></div></>, document.body)}</div></div></td>}
          {kind === "orders" && <></>}
          {kind === "challans" && <><td data-label="Sales order">{row.sales_order_no || "—"}</td><td data-label="Vehicle">{row.vehicle_no || "—"}</td><td data-label="Dispatch status"><select className="sw-status-select" value={status} onChange={e => updateStatus(row, e.target.value)}>{statuses.map(s => <option key={s}>{s}</option>)}</select></td></>}
          {kind === "credits" && <></>}
          <td data-label="Actions">{kind === "quotations" ? <div className="sw-menu-wrap"><button type="button" className="sw-kebab" aria-label={"Actions for " + row.invoice_no} aria-expanded={menuId === row.id} onClick={event => toggleQuotationMenu(event, row.id)}>⋮</button>{menuId === row.id && menuPosition && createPortal(<><div className="sw-menu-dismiss" onClick={() => { setMenuId(null); setMenuPosition(null); }} /><div className="sw-menu sw-quotation-menu sw-quotation-menu-portal" style={{ position: "fixed", top: menuPosition.top, right: menuPosition.right, maxHeight: menuPosition.maxHeight, overflowY: "auto" }}><button type="button" onClick={() => openQuotationPreview(row)}>View PDF</button><button type="button" onClick={() => { setMenuId(null); setMenuPosition(null); editQuotation(row); }}>Edit</button><button type="button" onClick={() => { setMenuId(null); setMenuPosition(null); shareQuotation(row); }}>Share</button><button type="button" onClick={() => { setMenuId(null); setMenuPosition(null); downloadQuotation(row); }}>Download</button></div></>, document.body)}</div> : kind === "register" ? <div className="sw-menu-wrap"><button type="button" className="sw-kebab" aria-label={"Actions for " + row.invoice_no} aria-expanded={menuId === row.id} onClick={() => setMenuId(menuId === row.id ? null : row.id)}>⋮</button>{menuId === row.id && <div className="sw-menu">{["View","Edit","Print","Download","Share","Cancel Invoice"].map(action => <button type="button" key={action} onClick={() => registerAction(row, action)}>{action}</button>)}</div>}</div> : <div className="sw-actions"><button onClick={() => view(row)}>View</button>{isNativeAndroid && kind === "orders" && <button onClick={() => navigate("/app/delivery-challans/new", { state: { salesOrderId: row.id } })}>Create Challan</button>}{isNativeAndroid && (kind === "orders" || (kind === "quotations" && String(row.status || "").toLowerCase() === "accepted")) && <button onClick={() => navigate("/app/sales", { state: { sourceType: kind, sourceId: row.id } })}>Convert to Invoice</button>}{kind !== "register" && <button className="sw-delete" onClick={() => deleteRow(row)}>Delete</button>}</div>}</td>
        </tr>;
      })}</tbody></table></div>}
    </section></>}
    {dialog && <div className="sw-modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setDialog(false); }}><section className="sw-modal" role="dialog" aria-modal="true" aria-labelledby="sw-modal-title"><header><div><p className="sw-breadcrumb">Billing &amp; Accounting / Sales</p><h2 id="sw-modal-title">{actionLabel}</h2></div><button className="sw-close" onClick={() => setDialog(false)} aria-label="Close">×</button></header><form onSubmit={e => { e.preventDefault(); }} noValidate>
      {isNativeAndroid && <nav className="sw-mobile-steps" aria-label="Document creation steps"><span className={formStep === 1 ? "active" : formStep > 1 ? "complete" : ""}>1. Details</span><span className={formStep === 2 ? "active" : formStep > 2 ? "complete" : ""}>2. Items</span><span className={formStep === 3 ? "active" : ""}>3. Review</span></nav>}
      {(!isNativeAndroid || formStep === 1) && <>
      <label>Company<input value={currentCompany?.company_name || ""} readOnly /></label>
      {kind === "credits" && isNativeAndroid && <fieldset className="sw-rate-type"><legend>Credit Note Reference</legend><label><input type="radio" name="creditNoteReference" checked={form.originalInvoiceMode === "invoice"} onChange={() => { setForm(prev => ({ ...prev, originalInvoiceMode: "invoice" })); setLines([{ description: "", qty: "1", rate: "0", gstRate: "0", cessRate: "0" }]); }} /> Against an Invoice</label><label><input type="radio" name="creditNoteReference" checked={form.originalInvoiceMode === "without_invoice"} onChange={() => { setForm(prev => ({ ...prev, originalInvoiceMode: "without_invoice", originalInvoiceId: "" })); setLines([{ description: "", qty: "1", rate: "0", gstRate: "0", cessRate: "0" }]); }} /> Without Invoice Reference</label></fieldset>}{kind === "credits" && (!isNativeAndroid || form.originalInvoiceMode === "invoice") && <label>Original sales invoice<select required={isNativeAndroid && form.originalInvoiceMode === "invoice"} value={form.originalInvoiceId} onChange={e => isNativeAndroid ? handleOriginalInvoiceChange(e.target.value) : (() => { const invoice = invoices.find(i => i.id === e.target.value); setForm({ ...form, originalInvoiceId: e.target.value, customerId: invoice?.customer_id || form.customerId }); })()}><option value="">Select invoice</option>{invoices.map(i => <option key={i.id} value={i.id}>{i.invoice_no} · {i.customer_name} · {currency(i.total_amount)}</option>)}</select></label>}
      <div className="sw-form-grid"><label>Customer<select required value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })}><option value="">Select customer</option>{customers.map(c => <option key={c.id} value={c.id}>{c.customer_name}</option>)}</select></label><label>{kind === "orders" ? "Order date" : kind === "credits" ? "Credit note date" : "Quotation date"}<input required type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></label>{kind !== "credits" && <label>{kind === "orders" ? "Expected delivery" : "Valid until"}<input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></label>}</div>
      {kind === "quotations" && <fieldset className="sw-rate-type"><legend>Rate Type</legend><label><input type="radio" name="quotationRateType" checked={!form.taxInclusive} onChange={() => setForm(prev => ({ ...prev, taxInclusive: false }))} /> Without Tax</label><label><input type="radio" name="quotationRateType" checked={Boolean(form.taxInclusive)} onChange={() => setForm(prev => ({ ...prev, taxInclusive: true }))} /> With Tax</label></fieldset>}
      {kind === "credits" && <label>Reason<input required value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Reason for issuing credit" /></label>}
      </>}
      {(!isNativeAndroid || formStep === 2) && <div className="sw-line-items"><div className="sw-line-heading"><strong>Items</strong>{!(isNativeAndroid && kind === "credits" && form.originalInvoiceMode === "invoice") && <button type="button" className="sw-add-line" onClick={() => setLines(prev => [...prev, { description: "", qty: "1", rate: "0", gstRate: "0", cessRate: "0" }])}>＋ Add line</button>}</div>{lines.map((line, index) => <div className="sw-line-row" key={index}>{isNativeAndroid && kind !== "credits" ? <label>Item<select value={line.item_id || ""} onChange={e => handleLineItemChange(index, e.target.value)}><option value="">Select item</option>{itemsMaster.map(item => <option key={item.id} value={item.id}>{item.item_name}</option>)}</select></label> : isNativeAndroid && kind === "credits" && form.originalInvoiceMode === "invoice" ? <label>Original invoice item<input value={line.description} readOnly /></label> : <label>Item / description<input value={line.description} onChange={e => setLines(prev => prev.map((item, i) => i === index ? { ...item, description: e.target.value } : item))} placeholder="Enter item or service" /></label>}<label>{kind === "credits" && isNativeAndroid && form.originalInvoiceMode === "invoice" ? "Return quantity" : "Quantity"}<input type="number" min="0" max={kind === "credits" && isNativeAndroid && form.originalInvoiceMode === "invoice" ? line.maxQty : undefined} step="0.01" value={line.qty} disabled={kind === "credits" && isNativeAndroid && form.originalInvoiceMode === "invoice" && Number(line.maxQty) <= 0} onChange={e => setLines(prev => prev.map((item, i) => i === index ? { ...item, qty: e.target.value } : item))} /></label><label>Rate (₹)<input type="number" min="0" step="0.01" value={line.rate} readOnly={isNativeAndroid && kind === "credits" && form.originalInvoiceMode === "invoice"} onChange={e => setLines(prev => prev.map((item, i) => i === index ? { ...item, rate: e.target.value } : item))} /></label><div className="sw-tax-fields"><label>GST %<select value={line.gstRate} disabled={isNativeAndroid && kind === "credits" && form.originalInvoiceMode === "invoice"} onChange={e => setLines(prev => prev.map((item, i) => i === index ? { ...item, gstRate: e.target.value } : item))}>{["0", "5", "12", "18", "28"].map(rate => <option key={rate} value={rate}>{rate}%</option>)}</select></label>{kind === "quotations" && <label>CESS %<input type="number" min="0" step="0.01" value={line.cessRate || "0"} onChange={e => setLines(prev => prev.map((item, i) => i === index ? { ...item, cessRate: e.target.value } : item))} /></label>}</div>{kind === "credits" && isNativeAndroid && form.originalInvoiceMode === "invoice" && <small className="sw-note">Invoiced: {line.originalQty || 0} · Previously returned: {line.returnedQty || 0} · Returnable: {line.maxQty || 0}</small>}<strong className="sw-line-amount">{currency(num(line.qty) * num(line.rate) * (1 + num(line.gstRate) / 100))}</strong>{lines.length > 1 && <button type="button" className="sw-remove-line" onClick={() => setLines(prev => prev.filter((_, i) => i !== index))} aria-label="Remove item">×</button>}</div>)}</div>
      }
      {(!isNativeAndroid || formStep === 3) && <>
      <div className="sw-total-breakdown"><div>Taxable Value<strong>{currency(lines.reduce((sum, line) => sum + num(line.qty) * (form.taxInclusive ? num(line.rate) / (1 + (num(line.gstRate) + num(line.cessRate)) / 100) : num(line.rate)), 0))}</strong></div><div>GST<strong>{currency(lines.reduce((sum, line) => { const base = num(line.qty) * (form.taxInclusive ? num(line.rate) / (1 + (num(line.gstRate) + num(line.cessRate)) / 100) : num(line.rate)); return sum + base * num(line.gstRate) / 100; }, 0))}</strong></div><div>CESS<strong>{currency(lines.reduce((sum, line) => { const base = num(line.qty) * (form.taxInclusive ? num(line.rate) / (1 + (num(line.gstRate) + num(line.cessRate)) / 100) : num(line.rate)); return sum + base * num(line.cessRate) / 100; }, 0))}</strong></div><div>Grand total<strong>{currency(lines.reduce((sum, line) => { const base = num(line.qty) * (form.taxInclusive ? num(line.rate) / (1 + (num(line.gstRate) + num(line.cessRate)) / 100) : num(line.rate)); return sum + base * (1 + (num(line.gstRate) + num(line.cessRate)) / 100); }, 0))}</strong></div></div>
      <p className="sw-note">GST is split using the company and customer state. Saving the document does not post ledger entries, change invoice balances, or update stock.</p>
      </>}
      <footer>
        {isNativeAndroid ? <>
          <button type="button" className="sw-secondary" onClick={() => formStep === 1 ? setDialog(false) : setFormStep(step => step - 1)}>{formStep === 1 ? "Cancel" : "Back"}</button>
          {formStep < 3
            ? <button type="button" className="sw-primary" onClick={() => { if (formStep === 1 && (!form.customerId || (kind === "credits" && ((form.originalInvoiceMode === "invoice" && !form.originalInvoiceId) || !form.reason.trim())))) { setMessage("Complete the required document details first."); return; } if (formStep === 2 && !lines.some(line => line.description.trim() && num(line.qty) > 0)) { setMessage("Add at least one item with a valid quantity."); return; } setMessage(""); setFormStep(step => step + 1); }}>Next: {formStep === 1 ? "Add Items" : "Review"} →</button>
            : <button type="button" disabled={saving} className="sw-primary" onClick={() => save()}>{saving ? "Saving…" : `Save ${kind === "orders" ? "Sales Order" : kind === "credits" ? "Credit Note" : "Quotation"}`}</button>}
        </> : <>
          <button type="button" className="sw-secondary" onClick={() => setDialog(false)}>Cancel</button>
          <button disabled={saving} className="sw-primary">{saving ? "Saving…" : `Save ${kind === "orders" ? "Sales Order" : kind === "credits" ? "Credit Note" : "Quotation"}`}</button>
        </>}
      </footer>
    </form></section></div>}
    {downloadNotice && <div className="sw-download-confirmation-backdrop" role="presentation"><section className="sw-download-confirmation" role="dialog" aria-modal="true" aria-label="PDF download complete"><div className="sw-download-confirmation-icon">✓</div><h2>PDF downloaded</h2><p><strong>{downloadNotice.fileName}</strong></p><p>Saved in: <b>{downloadNotice.location}</b></p><button type="button" className="sw-primary" onClick={() => setDownloadNotice(null)}>Done</button></section></div>}
    {quotationPreview && <QuotationPdfPreview blob={quotationPreview.blob} fileName={quotationPreview.fileName} documentTitle={quotationPreview.documentType === "credit-note" ? "Credit Note" : quotationPreview.documentType === "delivery-challan" ? "Delivery Challan" : "Quotation"} onClose={() => setQuotationPreview(null)} onDownload={() => quotationPreview.documentType === "credit-note" ? creditNoteAction(quotationPreview.row, "Download") : quotationPreview.documentType === "delivery-challan" ? deliveryChallanAction(quotationPreview.row, "Download") : downloadQuotation(quotationPreview.row)} onShare={() => quotationPreview.documentType === "credit-note" ? creditNoteAction(quotationPreview.row, "Share") : quotationPreview.documentType === "delivery-challan" ? deliveryChallanAction(quotationPreview.row, "Share") : shareQuotation(quotationPreview.row)} />}
    {invoicePreviewLoading && <div className="invoice-preview-loading" role="status">Preparing invoice preview…</div>}
    {invoicePreview && createPortal(<InvoicePrint invoice={invoicePreview.invoice} items={invoicePreview.items} settings={invoicePreview.settings} company={invoicePreview.company} customer={invoicePreview.customer} onClose={() => setInvoicePreview(null)} />, document.body)}
    {selected && <div className="sw-modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setSelected(null); }}><section className="sw-modal sw-view-modal" role="dialog" aria-modal="true"><header><div><p className="sw-breadcrumb">{config.title}</p><h2>{selected[config.number] || "Record details"}</h2></div><button className="sw-close" onClick={() => setSelected(null)} aria-label="Close">×</button></header><dl className="sw-detail-grid"><div><dt>Date</dt><dd>{dateText(selected[config.date])}</dd></div><div><dt>Customer</dt><dd>{selected.customer_name || "—"}</dd></div><div><dt>Status</dt><dd>{selected.status || (selected.sale_type === "CASH" ? "Paid" : "Outstanding")}</dd></div><div><dt>Total</dt><dd>{currency(selected.total_amount)}</dd></div>{selected.reason && <div><dt>Reason</dt><dd>{selected.reason}</dd></div>}</dl>{selected.items?.length > 0 && <div className="sw-table-scroll"><table><thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>{selected.items.map((i,n)=><tr key={i.id || n}><td>{i.item_name || i.particulars}</td><td>{num(i.qty)}</td><td>{currency(i.rate)}</td><td>{currency(i.amount)}</td></tr>)}</tbody></table></div>}<footer>{kind === "register" && <button className="sw-primary" onClick={() => { const id = selected.id; setSelected(null); navigate("/app/sales", { state: { editInvoiceId: id } }); }}>Edit invoice</button>}{kind === "orders" && <><button className="sw-primary" onClick={() => { const id = selected.id; setSelected(null); navigate("/app/delivery-challans/new", { state: { salesOrderId: id } }); }}>Create Challan</button><button className="sw-primary" onClick={() => { const id = selected.id; setSelected(null); navigate("/app/sales", { state: { sourceType: "orders", sourceId: id } }); }}>Convert to Invoice</button></>}{kind === "challans" && <button className="sw-primary" onClick={() => { const id = selected.id; setSelected(null); navigate("/app/delivery-challans/new", { state: { editChallanId: id } }); }}>Edit challan</button>}<button className="sw-secondary" onClick={() => setSelected(null)}>Close</button></footer></section></div>}
  </main>;
}
