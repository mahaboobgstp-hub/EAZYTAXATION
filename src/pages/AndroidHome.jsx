import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FiFileText, FiShoppingCart, FiClipboard, FiUsers, FiPackage, FiX, FiArrowRight,
  FiCreditCard, FiUser, FiBriefcase, FiCalendar, FiTrendingUp, FiDollarSign,
  FiBookOpen, FiClock, FiGrid, FiMoreVertical,
  FiEye, FiEdit2, FiShare2, FiPrinter, FiDownload, FiCpu
} from "react-icons/fi";
import { useCompany } from "../context/CompanyContext";
import { supabase } from "../supabase/supabaseClient";
import { createSalesInvoicePdf } from "../utils/salesInvoiceDocumentPdf";
import { downloadPurchasePdf } from "../utils/purchaseDocumentPdf";
import { downloadExpensePdf } from "../utils/expenseDocumentPdf";
import { getExpenseById } from "../services/expenseService";
import "../css/AndroidHome.css";
import SYD_MASCOT from "../assets/sydMascot";

const money = value => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value || 0));
const dateText = value => value ? new Date(value + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—";

const shortcuts = [
  { title: "Sales Invoice", path: "/app/sales", icon: FiFileText, tone: "sales" },
  { title: "Purchase Invoice", path: "/app/purchases", icon: FiShoppingCart, tone: "purchases" },
  { title: "Expense Entry", path: "/app/expenses", icon: FiClipboard, tone: "expenses" },
  { title: "Receipts & Payments", panel: "money", icon: FiCreditCard, tone: "banking" },
  { title: "Parties", panel: "parties", icon: FiUsers, tone: "parties" },
  { title: "Items", path: "/app/items", icon: FiPackage, tone: "items" },
  { title: "Business Dashboard", path: "/app/dashboard", icon: FiGrid, tone: "dashboard" },
  { title: "AI Assistant", path: "/app/ai-assistant", icon: FiCpu, tone: "assistant" }
];

const reportLinks = [
  ["Sales", "/app/sales-reports", "Sales performance and invoices", FiTrendingUp, "sales"],
  ["Purchases", "/app/purchase-reports", "Supplier purchases and totals", FiShoppingCart, "purchases"],
  ["Expenses", "/app/expense-reports", "Business expenses", FiClipboard, "expenses"],
  ["GST", "/app/gst-reports", "GST summary and tax values", FiDollarSign, "gst"],
  ["Ledgers", "/app/customer-ledger", "Customer, vendor and item ledgers", FiBookOpen, "ledgers"],
  ["Ageing", "/app/receivables-ageing", "Receivables and payables ageing", FiClock, "ageing"]
];

const sources = [
  { table: "sales_invoices", date: "invoice_date", type: "Sales", number: "invoice_no", party: "customer_name", amount: "total_amount", path: "/app/sales-register" },
  { table: "purchase_invoices", date: "invoice_date", type: "Purchase", number: "invoice_no", party: "vendor_name", amount: "grand_total", path: "/app/purchase-register" },
  { table: "expenses", date: "expense_date", type: "Expense", number: "expense_no", party: "payee_name", amount: "total_amount", path: "/app/expense-register" },
  { table: "expense_payments", date: "payment_date", type: "Payment", number: "payment_no", party: "paid_to", amount: "amount", path: "/app/payments" },
  { table: "accounting_vouchers", date: "voucher_date", type: "Voucher", number: "voucher_no", party: "narration", amount: "total_debit", path: "/app/banking?tab=transactions" }
];

export default function AndroidHome() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentCompany, currentCompanyId } = useCompany();
  const [panel, setPanel] = useState(searchParams.get("panel") || "");
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [transactionError, setTransactionError] = useState("");
  const [menuId, setMenuId] = useState(null);
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => setPanel(searchParams.get("panel") || ""), [searchParams]);

  useEffect(() => {
    let active = true;
    if (!currentCompanyId || panel !== "transactions") return () => { active = false; };
    setLoadingTransactions(true); setTransactionError("");
    const load = async () => {
      try {
        const results = await Promise.all(sources.map(async source => {
          const { data, error } = await supabase.from(source.table).select("*").eq("company_id", currentCompanyId)
            .order(source.date, { ascending: false }).limit(10);
          if (error) throw error;
          return (data || []).map(row => ({
            id: row.id, date: row[source.date],
            type: source.type === "Voucher" ? (row.voucher_type || "Voucher") : source.type,
            number: row[source.number] || row.voucher_number || row.reference_number || "—",
            party: row[source.party] || row.vendor_name || row.customer_name || row.payee_name || "—",
            amount: row[source.amount] || 0, path: source.path, table: source.table, raw: row
          }));
        }));
        if (active) setTransactions(results.flat().sort((a,b) => String(b.date || "").localeCompare(String(a.date || ""))).slice(0,10));
      } catch (error) { if (active) setTransactionError(error.message || "Unable to load recent transactions."); }
      finally { if (active) setLoadingTransactions(false); }
    };
    load();
    return () => { active = false; };
  }, [currentCompanyId, panel]);

  const closePanel = () => {
    setPanel(""); setMenuId(null); setActionMessage("");
    if (searchParams.has("panel")) { const next = new URLSearchParams(searchParams); next.delete("panel"); setSearchParams(next, { replace: true }); }
  };
  const openShortcut = item => item.path ? navigate(item.path) : setPanel(item.panel);

  const fetchItems = async (table, parentColumn, id) => {
    const { data, error } = await supabase.from(table).select("*").eq(parentColumn, id).order("line_no");
    if (error) throw error;
    return data || [];
  };

  const makePdf = async (row) => {
    const record = row.raw;
    if (row.type === "Sales") {
      const items = await fetchItems("sales_invoice_items", "invoice_id", row.id);
      return createSalesInvoicePdf({ document: record, items, company: currentCompany });
    }
    if (row.type === "Purchase") {
      const items = await fetchItems("purchase_invoice_items", "invoice_id", row.id);
      const result = downloadPurchasePdf({ kind: "register", document: record, items, company: currentCompany, returnBlob: true });
      return result;
    }
    if (row.type === "Expense") {
      const detail = await getExpenseById(row.id, currentCompanyId);
      const result = downloadExpensePdf({ kind: "expense", record: detail, items: detail.items || [], company: currentCompany, returnBlob: true });
      return result;
    }
    if (row.type === "Payment") {
      const result = downloadExpensePdf({ kind: "payment", record, items: [], company: currentCompany, returnBlob: true });
      return result;
    }
    throw new Error("PDF actions are not available for this voucher type yet.");
  };

  const transactionAction = async (row, action) => {
    setMenuId(null); setActionMessage("");
    if (action === "View Document") {
      try {
        const result = await makePdf(row);
        if (!result?.blob) throw new Error("The document preview could not be generated.");
        const url = URL.createObjectURL(result.blob);
        const opened = window.open(url, "_blank");
        if (!opened) { const link = document.createElement("a"); link.href = url; link.download = result.fileName; link.click(); }
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      } catch (error) { setActionMessage(error.message || "Unable to open this document."); }
      return;
    }
    if (action === "Edit Document") {
      if (row.type === "Sales") return navigate("/app/sales", { state: { editInvoiceId: row.id } });
      if (row.type === "Purchase") return navigate("/app/purchases", { state: { editPurchaseInvoiceId: row.id } });
      if (row.type === "Expense") return navigate("/app/expenses", { state: { editExpenseId: row.id } });
      if (row.type === "Payment") return navigate("/app/payments", { state: { editPaymentId: row.id } });
      return navigate(row.path);
    }
    try {
      const result = await makePdf(row);
      if (!result?.blob) throw new Error("The PDF could not be generated for this transaction.");
      const file = new File([result.blob], result.fileName || (row.number + ".pdf"), { type: "application/pdf" });
      if (action === "Download PDF") {
        const url = URL.createObjectURL(result.blob); const link = document.createElement("a");
        link.href = url; link.download = file.name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else if (action === "Print Document") {
        const url = URL.createObjectURL(result.blob); const popup = window.open(url, "_blank");
        if (!popup) { const link = document.createElement("a"); link.href = url; link.download = file.name; link.click(); }
        else popup.onload = () => popup.print();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      } else if (action === "Share Document") {
        if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) await navigator.share({ title: file.name, files: [file] });
        else { const url = URL.createObjectURL(result.blob); const link = document.createElement("a"); link.href = url; link.download = file.name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); setActionMessage("PDF downloaded. You can attach it to WhatsApp or email."); }
      }
    } catch (error) { if (error.name !== "AbortError") setActionMessage(error.message || "Unable to process this document."); }
  };

  const actionOptions = [
    ["View Document", FiEye], ["Edit Document", FiEdit2], ["Share Document", FiShare2],
    ["Print Document", FiPrinter], ["Download PDF", FiDownload]
  ];

  return (
    <main className="android-home" aria-label="Home">
      <div className="android-home-welcome">
        <span className="android-home-eyebrow">SYD BILLING &amp; ACCOUNTING</span>
        <h1>Welcome back</h1><p>{currentCompany?.company_name || "Your business, at a glance"}</p>
      </div>
      <section className="android-home-grid" aria-label="Quick actions">
        {shortcuts.map(({ title, path, panel: panelName, icon: Icon, tone }) => (
          <button key={title} type="button" className={`android-home-tile ${tone}`} onClick={() => openShortcut({ path, panel: panelName })} aria-label={title}>
            <span className="android-home-tile-icon">{tone === "assistant" ? <img src={SYD_MASCOT} alt="" aria-hidden="true" draggable="false" /> : <Icon />}</span><span className="android-home-tile-title">{title}</span>
          </button>
        ))}
      </section>
      {panel && <div className="android-home-overlay" onMouseDown={event => event.target === event.currentTarget && closePanel()}>
        <section className="android-home-panel" role="dialog" aria-modal="true" aria-label="Quick navigation">
          <header className="android-home-panel-header"><div><span className="android-home-eyebrow">QUICK ACCESS</span>
            <h2>{panel === "money" ? "Receipts & Payments" : panel === "parties" ? "Parties" : panel === "transactions" ? "Recent Transactions" : "Reports"}</h2></div>
            <button type="button" onClick={closePanel} aria-label="Close"><FiX /></button>
          </header>
          {panel === "money" && <div className="android-home-panel-options">
            <button type="button" onClick={() => navigate("/app/banking?tab=receipts")}><span className="android-panel-option-icon"><FiCreditCard /></span><span><b>Receipts</b><small>Record and view money received</small></span><FiArrowRight /></button>
            <button type="button" onClick={() => navigate("/app/payments")}><span className="android-panel-option-icon"><FiCreditCard /></span><span><b>Payments</b><small>Record and view money paid</small></span><FiArrowRight /></button>
          </div>}
          {panel === "parties" && <div className="android-home-panel-options">
            <button type="button" onClick={() => navigate("/app/customers")}><span className="android-panel-option-icon"><FiUser /></span><span><b>Customers</b><small>Customer master and details</small></span><FiArrowRight /></button>
            <button type="button" onClick={() => navigate("/app/vendors")}><span className="android-panel-option-icon"><FiBriefcase /></span><span><b>Vendors</b><small>Supplier master and details</small></span><FiArrowRight /></button>
          </div>}
          {panel === "reports" && <div className="android-home-panel-options android-report-options">
            {reportLinks.map(([label, path, description, Icon, tone]) => <button type="button" key={label} onClick={() => navigate(path)}>
              <span className={`android-panel-option-icon report-icon-${tone}`}><Icon /></span><span><b>{label}</b><small>{description}</small></span><FiArrowRight />
            </button>)}
          </div>}
          {panel === "transactions" && <div className="android-recent-transactions">
            {!currentCompanyId ? <p className="android-panel-empty">Select a company to view transactions.</p>
              : loadingTransactions ? <p className="android-panel-empty">Loading recent transactions…</p>
              : transactionError ? <p className="android-panel-error">{transactionError}</p>
              : !transactions.length ? <p className="android-panel-empty">No transactions found for this company.</p>
              : transactions.map(row => <article className="android-transaction-row" key={row.type + row.id}>
                <span className="android-transaction-mark"><FiFileText /></span>
                <span className="android-transaction-copy"><b>{row.type} · {row.number}</b><small>{row.party} · {dateText(row.date)}</small></span>
                <strong>{money(row.amount)}</strong>
                <div className="android-transaction-menu-wrap">
                  <button type="button" className="android-transaction-menu-button" aria-label={`Actions for ${row.number}`} aria-expanded={menuId === row.id} onClick={() => setMenuId(menuId === row.id ? null : row.id)}><FiMoreVertical /></button>
                  {menuId === row.id && <div className="android-transaction-menu">
                    {actionOptions.map(([label, Icon]) => <button type="button" key={label} onClick={() => transactionAction(row, label)}><Icon /><span>{label}</span></button>)}
                  </div>}
                </div>
              </article>)}
            {actionMessage && <p className="android-panel-error android-action-message">{actionMessage}</p>}
          </div>}
        </section>
      </div>}
    </main>
  );
}
