import React, { useEffect, useMemo, useState } from "react";
import { FiDollarSign, FiArrowDownRight, FiArrowUpRight, FiBriefcase, FiCalendar, FiFileText, FiPackage, FiRefreshCw, FiShoppingCart, FiTrendingUp, FiUsers } from "react-icons/fi";
import { useCompany } from "../context/CompanyContext";
import { supabase } from "../supabase/supabaseClient";
import "../css/Dashboard.css";

const money = value => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value) || 0);
const number = value => new Intl.NumberFormat("en-IN").format(Number(value) || 0);
const amount = (row, keys) => {
  for (const key of keys) if (row?.[key] !== undefined && row?.[key] !== null) return Number(row[key]) || 0;
  return 0;
};
const getFinancialYear = date => {
  const year = date.getFullYear();
  return date.getMonth() >= 3 ? year : year - 1;
};
const dateText = date => date.toISOString().slice(0, 10);
const MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

export default function Dashboard() {
  const { currentCompany, currentCompanyId, loading: companyLoading } = useCompany();
  const [period, setPeriod] = useState("year");
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState({ sales: [], purchases: [], expenses: [], itemSales: [], customers: 0, vendors: 0, items: 0, error: "" });

  const range = useMemo(() => {
    const now = new Date();
    const fy = getFinancialYear(now);
    const start = new Date(fy, 3, 1);
    const end = new Date(fy + 1, 2, 31);
    if (period === "month") return { from: dateText(new Date(now.getFullYear(), now.getMonth(), 1)), to: dateText(now), label: now.toLocaleDateString("en-IN", { month: "long", year: "numeric" }) };
    if (period === "quarter") {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      return { from: dateText(new Date(now.getFullYear(), quarterStartMonth, 1)), to: dateText(now), label: "Current quarter" };
    }
    return { from: dateText(start), to: dateText(end), label: `FY ${fy}–${String(fy + 1).slice(-2)} (Apr ${fy} – Mar ${fy + 1})` };
  }, [period]);

  const loadDashboard = async () => {
    if (!currentCompanyId) {
      setData({ sales: [], purchases: [], expenses: [], customers: 0, vendors: 0, items: 0, error: "" });
      return;
    }
    setRefreshing(true);
    try {
      const [sales, purchases, expenses, customers, vendors, items] = await Promise.all([
        supabase.from("sales_invoices").select("*").eq("company_id", currentCompanyId).eq("is_deleted", false).gte("invoice_date", range.from).lte("invoice_date", range.to).order("invoice_date", { ascending: true }),
        supabase.from("purchase_invoices").select("*").eq("company_id", currentCompanyId).eq("is_deleted", false).gte("invoice_date", range.from).lte("invoice_date", range.to).order("invoice_date", { ascending: true }),
        supabase.from("expenses").select("*").eq("company_id", currentCompanyId).gte("expense_date", range.from).lte("expense_date", range.to),
        supabase.from("customers").select("id", { count: "exact", head: true }).eq("company_id", currentCompanyId),
        supabase.from("vendors").select("id", { count: "exact", head: true }).eq("company_id", currentCompanyId),
        supabase.from("items").select("id", { count: "exact", head: true }).eq("company_id", currentCompanyId)
      ]);
      const firstError = [sales, purchases, expenses, customers, vendors, items].find(result => result.error);
      if (firstError) throw firstError.error;
      const invoiceIds = (sales.data || []).map(row => row.id).filter(Boolean);
      const itemResult = invoiceIds.length
        ? await supabase.from("sales_invoice_items").select("*").in("invoice_id", invoiceIds)
        : { data: [], error: null };
      if (itemResult.error) throw itemResult.error;
      setData({
        sales: sales.data || [], purchases: purchases.data || [], expenses: expenses.data || [],
        itemSales: itemResult.data || [],
        customers: customers.count || 0, vendors: vendors.count || 0, items: items.count || 0, error: ""
      });
    } catch (error) {
      setData(previous => ({ ...previous, error: error.message || "Unable to load dashboard information." }));
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { loadDashboard(); }, [currentCompanyId, range.from, range.to]);

  const totals = useMemo(() => {
    const sales = data.sales.reduce((sum, row) => sum + amount(row, ["total_amount", "grand_total", "invoice_value"]), 0);
    const purchases = data.purchases.reduce((sum, row) => sum + amount(row, ["grand_total", "total_amount", "invoice_value"]), 0);
    const expenses = data.expenses.reduce((sum, row) => sum + amount(row, ["total_amount", "grand_total", "amount"]), 0);
    const gst = data.sales.reduce((sum, row) => sum + amount(row, ["cgst"]) + amount(row, ["sgst"]) + amount(row, ["igst"]) + amount(row, ["cess_amount"]) + amount(row, ["additional_cess_amount"]), 0);
    const receivables = data.sales.reduce((sum, row) => sum + Math.max(0, amount(row, ["balance_amount", "outstanding_amount", "due_amount"]) || (amount(row, ["total_amount", "grand_total"]) - amount(row, ["paid_amount"]))), 0);
    const payables = data.purchases.reduce((sum, row) => sum + Math.max(0, amount(row, ["balance_amount", "outstanding_amount", "due_amount"]) || (amount(row, ["grand_total", "total_amount"]) - amount(row, ["paid_amount"]))), 0);
    return { sales, purchases, expenses, gst, receivables, payables };
  }, [data]);

  const monthly = useMemo(() => MONTHS.map((month, index) => {
    const fy = getFinancialYear(new Date());
    const year = index < 9 ? fy : fy + 1;
    const monthIndex = (index + 3) % 12;
    const sum = (rows, keys) => rows.filter(row => {
      const date = new Date(`${row.invoice_date || row.expense_date || "2000-01-01"}T00:00:00`);
      return date.getFullYear() === year && date.getMonth() === monthIndex;
    }).reduce((total, row) => total + amount(row, keys), 0);
    return { month, sales: sum(data.sales, ["total_amount", "grand_total"]), purchases: sum(data.purchases, ["grand_total", "total_amount"]) };
  }), [data]);

  const topCustomers = useMemo(() => {
    const map = new Map();
    data.sales.forEach(row => {
      const name = row.customer_name || "Unspecified customer";
      map.set(name, (map.get(name) || 0) + amount(row, ["total_amount", "grand_total"]));
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [data.sales]);

  const topItems = useMemo(() => {
    const map = new Map();
    (data.itemSales || []).forEach(row => {
      const name = row.item_name || row.particulars || "Unspecified item";
      map.set(name, (map.get(name) || 0) + amount(row, ["amount", "line_total", "taxable_value"]));
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [data.itemSales]);

  const maxTrend = Math.max(1, ...monthly.flatMap(row => [row.sales, row.purchases]));
  const maxCustomer = Math.max(1, ...topCustomers.map(row => row[1]));
  const maxItem = Math.max(1, ...topItems.map(row => row[1]));
  const fyLabel = range.label;

  return <main className="erp-dashboard">
    <div className="dashboard-heading">
      <div><span className="dashboard-eyebrow">BUSINESS OVERVIEW</span><h1>Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"}!</h1><p>Here’s your business overview for {fyLabel}</p></div>
      <div className="dashboard-actions">
        <div className="dashboard-periods">
          <button className={period === "month" ? "active" : ""} onClick={() => setPeriod("month")}>This Month</button>
          <button className={period === "quarter" ? "active" : ""} onClick={() => setPeriod("quarter")}>This Quarter</button>
          <button className={period === "year" ? "active" : ""} onClick={() => setPeriod("year")}>This Year</button>
        </div>
        <button className="dashboard-refresh" onClick={loadDashboard} disabled={refreshing} aria-label="Refresh dashboard"><FiRefreshCw className={refreshing ? "spinning" : ""}/></button>
      </div>
    </div>

    {companyLoading ? <div className="dashboard-message">Loading company information…</div> : !currentCompanyId ? <div className="dashboard-message"><FiBriefcase/><div><strong>Select a company to view its dashboard</strong><span>Choose a company from the sidebar. Dashboard figures are always restricted to the selected company.</span></div></div> : <>
      {data.error && <div className="dashboard-error">{data.error} <button onClick={loadDashboard}>Retry</button></div>}
      <div className="dashboard-company-line"><FiBriefcase/> <strong>{currentCompany?.company_name || "Selected company"}</strong><span>·</span><span>{range.from} to {range.to}</span></div>

      <section className="dashboard-kpis">
        <Kpi icon={<FiTrendingUp/>} label="Sales (Invoice Value)" value={money(totals.sales)} note={`${number(data.sales.length)} invoices`} tone="green"/>
        <Kpi icon={<FiShoppingCart/>} label="Purchases" value={money(totals.purchases)} note={`${number(data.purchases.length)} invoices`} tone="blue"/>
        <Kpi icon={<FiDollarSign/>} label="Expenses" value={money(totals.expenses)} note={`${number(data.expenses.length)} entries`} tone="amber"/>
        <Kpi icon={<FiFileText/>} label="GST Output" value={money(totals.gst)} note="From sales invoices" tone="purple"/>
        <Kpi icon={<FiDollarSign/>} label="Bank Balance" value="Not connected" note="Bank account integration pending" tone="rose"/>
      </section>

      <section className="dashboard-middle-grid">
        <article className="dashboard-panel dashboard-trend-panel">
          <div className="dashboard-panel-heading"><div><h2>Sales vs Purchases Trend</h2><p>Month-wise invoice values</p></div><div className="dashboard-legend"><span><i className="sales-dot"/>Sales</span><span><i className="purchase-dot"/>Purchases</span></div></div>
          <div className="dashboard-chart">
            <div className="dashboard-ylabels"><span>{money(maxTrend)}</span><span>{money(maxTrend * .75)}</span><span>{money(maxTrend * .5)}</span><span>{money(maxTrend * .25)}</span><span>₹0</span></div>
            <div className="dashboard-bars">{monthly.map(row => <div className="dashboard-month" key={row.month}><div className="dashboard-bar-pair"><span className="dashboard-bar sales-bar" style={{height: `${Math.max(2, row.sales / maxTrend * 100)}%`}} title={`Sales ${money(row.sales)}`}/><span className="dashboard-bar purchase-bar" style={{height: `${Math.max(2, row.purchases / maxTrend * 100)}%`}} title={`Purchases ${money(row.purchases)}`}/></div><small>{row.month}</small></div>)}</div>
          </div>
        </article>
        <article className="dashboard-panel dashboard-balance-panel">
          <div className="dashboard-panel-heading"><div><h2>Receivables & Payables</h2><p>Outstanding invoice balances</p></div></div>
          <div className="dashboard-balance-card receivable"><span><FiArrowDownRight/> Receivables (To Receive)</span><strong>{money(totals.receivables)}</strong></div>
          <div className="dashboard-balance-card payable"><span><FiArrowUpRight/> Payables (To Pay)</span><strong>{money(totals.payables)}</strong></div>
          <p className="dashboard-note">Calculated from available invoice balance and payment fields.</p>
        </article>
        <article className="dashboard-panel dashboard-snapshot-panel">
          <div className="dashboard-panel-heading"><div><h2>Business Snapshot</h2><p>Current company records</p></div></div>
          <Snapshot icon={<FiFileText/>} label="Total Invoices (Sales)" value={number(data.sales.length)}/>
          <Snapshot icon={<FiShoppingCart/>} label="Total Purchase Invoices" value={number(data.purchases.length)}/>
          <Snapshot icon={<FiUsers/>} label="Total Customers" value={number(data.customers)}/>
          <Snapshot icon={<FiBriefcase/>} label="Total Suppliers" value={number(data.vendors)}/>
          <Snapshot icon={<FiPackage/>} label="Active Items" value={number(data.items)}/>
        </article>
      </section>

      <section className="dashboard-bottom-grid">
        <article className="dashboard-panel dashboard-bank-panel"><div className="dashboard-panel-heading"><div><h2>Cash & Bank Position</h2><p>Account balances</p></div></div><div className="dashboard-bank-empty"><span><FiDollarSign/></span><strong>Bank balances are not connected yet</strong><p>Once bank account balances are linked to the accounting ledger, this section will show the live consolidated position.</p></div></article>
        <article className="dashboard-panel dashboard-list-panel"><div className="dashboard-panel-heading"><div><h2>Top 5 Customers</h2><p>By sales value in selected period</p></div></div>{topCustomers.length ? topCustomers.map(([name, value]) => <RankRow key={name} name={name} value={value} max={maxCustomer}/>) : <Empty>No sales invoices found for this period.</Empty>}</article>
        <article className="dashboard-panel dashboard-list-panel"><div className="dashboard-panel-heading"><div><h2>Top 5 Items</h2><p>By sales value</p></div></div>{topItems.length ? topItems.map(([name, value]) => <RankRow key={name} name={name} value={value} max={maxItem}/>) : <Empty>No sales item records found for this period.</Empty>}</article>
      </section>
    </>}
  </main>;
}

function Kpi({ icon, label, value, note, tone }) {
  return <article className={`dashboard-kpi ${tone}`}><span className="dashboard-kpi-icon">{icon}</span><div><span className="dashboard-kpi-label">{label}</span><strong>{value}</strong><small>{note}</small></div></article>;
}
function Snapshot({ icon, label, value }) {
  return <div className="dashboard-snapshot-row"><span>{icon}{label}</span><strong>{value}</strong></div>;
}
function RankRow({ name, value, max }) {
  return <div className="dashboard-rank-row"><span title={name}>{name}</span><i><b style={{width: `${value / max * 100}%`}}/></i><strong>{money(value)}</strong></div>;
}
function Empty({ children }) { return <div className="dashboard-empty">{children}</div>; }
