import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FiFileText, FiShoppingCart, FiClipboard, FiUsers, FiPackage,
  FiActivity, FiBarChart2, FiCpu, FiX, FiArrowRight,
  FiCreditCard, FiUser, FiBriefcase, FiCalendar
} from "react-icons/fi";
import { useCompany } from "../context/CompanyContext";
import { supabase } from "../supabase/supabaseClient";
import "../css/AndroidHome.css";

const money = value => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 2
}).format(Number(value || 0));

const dateText = value => value
  ? new Date(value + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
  : "—";

const shortcuts = [
  { title: "Sales Invoice", path: "/app/sales", icon: FiFileText, tone: "sales" },
  { title: "Purchase Invoice", path: "/app/purchases", icon: FiShoppingCart, tone: "purchases" },
  { title: "Expense Entry", path: "/app/expenses", icon: FiClipboard, tone: "expenses" },
  { title: "Receipts & Payments", panel: "money", icon: FiCreditCard, tone: "banking" },
  { title: "Parties", panel: "parties", icon: FiUsers, tone: "parties" },
  { title: "Items", path: "/app/items", icon: FiPackage, tone: "items" },
  { title: "Transactions", panel: "transactions", icon: FiActivity, tone: "transactions" },
  { title: "Reports", panel: "reports", icon: FiBarChart2, tone: "reports" }
];

const reportLinks = [
  ["Sales", "/app/sales-reports", "Sales performance and invoices"],
  ["Purchases", "/app/purchase-reports", "Supplier purchases and totals"],
  ["Expenses", "/app/expense-reports", "Business expenses"],
  ["GST", "/app/gst-reports", "GST summary and tax values"],
  ["Ledgers", "/app/customer-ledger", "Customer, vendor and item ledgers"],
  ["Ageing", "/app/receivables-ageing", "Receivables and payables ageing"]
];

export default function AndroidHome() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentCompany, currentCompanyId } = useCompany();
  const [panel, setPanel] = useState(searchParams.get("panel") || "");
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [transactionError, setTransactionError] = useState("");

  useEffect(() => {
    const requested = searchParams.get("panel") || "";
    setPanel(requested);
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    if (!currentCompanyId || panel !== "transactions") return () => { active = false; };
    setLoadingTransactions(true);
    setTransactionError("");
    const load = async () => {
      const sources = [
        { table: "sales_invoices", date: "invoice_date", type: "Sales", number: "invoice_no", party: "customer_name", amount: "total_amount", path: "/app/sales-register" },
        { table: "purchase_invoices", date: "invoice_date", type: "Purchase", number: "invoice_no", party: "vendor_name", amount: "total_amount", path: "/app/purchase-register" },
        { table: "expenses", date: "expense_date", type: "Expense", number: "expense_no", party: "vendor_name", amount: "total_amount", path: "/app/expense-register" },
        { table: "expense_payments", date: "payment_date", type: "Payment", number: "payment_no", party: "paid_to", amount: "amount", path: "/app/payments" },
        { table: "accounting_vouchers", date: "voucher_date", type: "Voucher", number: "voucher_no", party: "narration", amount: "total_debit", path: "/app/banking?tab=transactions" }
      ];
      try {
        const results = await Promise.all(sources.map(async source => {
          const { data, error } = await supabase.from(source.table).select("*")
            .eq("company_id", currentCompanyId)
            .order(source.date, { ascending: false }).limit(10);
          if (error) throw error;
          return (data || []).map(row => ({
            id: row.id,
            date: row[source.date],
            type: source.type === "Voucher" ? (row.voucher_type || "Voucher") : source.type,
            number: row[source.number] || row.voucher_number || row.reference_number || "—",
            party: row[source.party] || "—",
            amount: row[source.amount] || 0,
            path: source.path
          }));
        }));
        if (!active) return;
        setTransactions(results.flat().sort((a, b) => String(b.date || "").localeCompare(String(a.date || ""))).slice(0, 10));
      } catch (error) {
        if (active) setTransactionError(error.message || "Unable to load recent transactions.");
      } finally {
        if (active) setLoadingTransactions(false);
      }
    };
    load();
    return () => { active = false; };
  }, [currentCompanyId, panel]);

  const closePanel = () => {
    setPanel("");
    if (searchParams.has("panel")) {
      const next = new URLSearchParams(searchParams);
      next.delete("panel");
      setSearchParams(next, { replace: true });
    }
  };

  const openShortcut = item => {
    if (item.path) navigate(item.path);
    else setPanel(item.panel);
  };

  return (
    <main className="android-home" aria-label="Home">
      <div className="android-home-welcome">
        <span className="android-home-eyebrow">SYD BILLING &amp; ACCOUNTING</span>
        <h1>Welcome back</h1>
        <p>{currentCompany?.company_name || "Your business, at a glance"}</p>
      </div>

      <section className="android-home-grid" aria-label="Quick actions">
        {shortcuts.map(({ title, path, panel: panelName, icon: Icon, tone }) => (
          <button key={title} type="button" className={`android-home-tile ${tone}`}
            onClick={() => openShortcut({ path, panel: panelName })} aria-label={title}>
            <span className="android-home-tile-icon"><Icon /></span>
            <span className="android-home-tile-title">{title}</span>
          </button>
        ))}
      </section>

      <button type="button" className="android-home-ai" onClick={() => navigate("/app/ai-assistant")} aria-label="Open AI Assistant">
        <FiCpu /><span>AI Assistant</span>
      </button>

      {panel && <div className="android-home-overlay" onMouseDown={event => event.target === event.currentTarget && closePanel()}>
        <section className="android-home-panel" role="dialog" aria-modal="true" aria-label="Quick navigation">
          <header className="android-home-panel-header">
            <div>
              <span className="android-home-eyebrow">QUICK ACCESS</span>
              <h2>{panel === "money" ? "Receipts & Payments" : panel === "parties" ? "Parties" : panel === "transactions" ? "Recent Transactions" : "Reports"}</h2>
            </div>
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
            {reportLinks.map(([label, path, description]) => <button type="button" key={label} onClick={() => navigate(path)}>
              <span className="android-panel-option-icon">{label === "Ageing" ? <FiCalendar /> : <FiBarChart2 />}</span>
              <span><b>{label}</b><small>{description}</small></span><FiArrowRight />
            </button>)}
          </div>}

          {panel === "transactions" && <div className="android-recent-transactions">
            {!currentCompanyId ? <p className="android-panel-empty">Select a company to view transactions.</p>
              : loadingTransactions ? <p className="android-panel-empty">Loading recent transactions…</p>
              : transactionError ? <p className="android-panel-error">{transactionError}</p>
              : !transactions.length ? <p className="android-panel-empty">No transactions found for this company.</p>
              : transactions.map(row => <button type="button" className="android-transaction-row" key={row.type + row.id} onClick={() => navigate(row.path)}>
                <span className="android-transaction-mark"><FiFileText /></span>
                <span className="android-transaction-copy"><b>{row.type} · {row.number}</b><small>{row.party} · {dateText(row.date)}</small></span>
                <strong>{money(row.amount)}</strong>
              </button>)}
          </div>}
        </section>
      </div>}
    </main>
  );
}
