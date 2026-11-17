import React, { useEffect, useMemo, useState } from "react";
import { FiDollarSign, FiArrowDownRight, FiArrowUpRight, FiBriefcase, FiCalendar, FiFileText, FiPackage, FiRefreshCw, FiShoppingCart, FiTrendingUp, FiUsers, FiSettings, FiCheck, FiChevronDown, FiX, FiChevronUp, FiChevronDown as FiMoveDown } from "react-icons/fi";
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
const dateText = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
const startOfWeek = date => { const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()); d.setDate(d.getDate() - ((d.getDay()+6)%7)); return d; };
const endOfWeek = date => { const d = startOfWeek(date); d.setDate(d.getDate()+6); return d; };
const DATE_FILTERS = [{value:"today",label:"Today",group:"Quick"},{value:"yesterday",label:"Yesterday",group:"Quick"},{value:"thisWeek",label:"This Week",group:"Weeks"},{value:"lastWeek",label:"Last Week",group:"Weeks"},{value:"month",label:"This Month",group:"Months"},{value:"lastMonth",label:"Last Month",group:"Months"},{value:"quarter",label:"This Quarter",group:"Quarters"},{value:"lastQuarter",label:"Last Quarter",group:"Quarters"},{value:"year",label:"This Financial Year",group:"Years"},{value:"lastYear",label:"Previous Financial Year",group:"Years"},{value:"calendarYear",label:"This Calendar Year",group:"Years"},{value:"previousCalendarYear",label:"Last Calendar Year",group:"Years"},{value:"custom",label:"Custom Date Range",group:"Custom"}];
const MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

export default function Dashboard() {
  const { currentCompany, currentCompanyId, loading: companyLoading } = useCompany();
  const [period, setPeriod] = useState("year");
  const [customFrom, setCustomFrom] = useState(dateText(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  const [customTo, setCustomTo] = useState(dateText(new Date()));
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [showWidgetSettings, setShowWidgetSettings] = useState(false);
  const defaultCardOrder = ["sales","purchases","expenses","gst","trend","balances","snapshot","bank","cash","customers","items"];
  const [cardOrder, setCardOrder] = useState(() => { try { const saved=JSON.parse(localStorage.getItem("syd-dashboard-order")||"null"); return Array.isArray(saved) && saved.length===11 ? saved : defaultCardOrder; } catch { return defaultCardOrder; } });
  useEffect(() => { localStorage.setItem("syd-dashboard-order", JSON.stringify(cardOrder)); }, [cardOrder]);
  const [widgets, setWidgets] = useState(() => { try { return {sales:true,purchases:true,expenses:true,gst:true,trend:true,balances:true,snapshot:true,bank:true,cash:true,customers:true,items:true,...JSON.parse(localStorage.getItem("syd-dashboard-widgets") || "{}")}; } catch { return {sales:true,purchases:true,expenses:true,gst:true,trend:true,balances:true,snapshot:true,bank:true,cash:true,customers:true,items:true}; } });
  useEffect(() => { localStorage.setItem("syd-dashboard-widgets", JSON.stringify(widgets)); }, [widgets]);
  const widgetLabels = {sales:"Sales summary",purchases:"Purchase summary",expenses:"Expense summary",gst:"GST summary",trend:"Sales & purchase trend",balances:"Receivables & payables",snapshot:"Business snapshot",bank:"Bank balance",cash:"Cash balance",customers:"Top 5 customers",items:"Top 5 items"};
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState({ sales: [], purchases: [], expenses: [], itemSales: [], customers: 0, vendors: 0, items: 0, groups: [], ledgers: [], vouchers: [], voucherLines: [], error: "" });

  const range = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const fy = getFinancialYear(today);
    let from, to, label;
    switch (period) {
      case "today": from=today; to=today; label="Today"; break;
      case "yesterday": from=new Date(today.getFullYear(),today.getMonth(),today.getDate()-1); to=from; label="Yesterday"; break;
      case "thisWeek": from=startOfWeek(today); to=today; label="This Week"; break;
      case "lastWeek": to=startOfWeek(today); to.setDate(to.getDate()-1); from=startOfWeek(to); label="Last Week"; break;
      case "month": from=new Date(today.getFullYear(),today.getMonth(),1); to=today; label="This Month"; break;
      case "lastMonth": from=new Date(today.getFullYear(),today.getMonth()-1,1); to=new Date(today.getFullYear(),today.getMonth(),0); label="Last Month"; break;
      case "quarter": { const q=Math.floor(today.getMonth()/3)*3; from=new Date(today.getFullYear(),q,1); to=today; label="This Quarter"; break; }
      case "lastQuarter": { const q=Math.floor(today.getMonth()/3)*3; to=new Date(today.getFullYear(),q,0); from=new Date(to.getFullYear(),to.getMonth()-2,1); label="Last Quarter"; break; }
      case "calendarYear": from=new Date(today.getFullYear(),0,1); to=today; label="This Calendar Year"; break;
      case "previousCalendarYear": from=new Date(today.getFullYear()-1,0,1); to=new Date(today.getFullYear()-1,11,31); label="Last Calendar Year"; break;
      case "lastYear": from=new Date(fy-1,3,1); to=new Date(fy,2,31); label="Previous Financial Year"; break;
      case "custom": from=new Date(`${customFrom}T00:00:00`); to=new Date(`${customTo}T00:00:00`); label="Custom Date Range"; break;
      default: from=new Date(fy,3,1); to=new Date(fy+1,2,31); label="This Financial Year";
    }
    return {from:dateText(from),to:dateText(to),label};
  }, [period,customFrom,customTo]);

  const loadDashboard = async () => {
    if (!currentCompanyId) {
      setData({ sales: [], purchases: [], expenses: [], customers: 0, vendors: 0, items: 0, error: "" });
      return;
    }
    setRefreshing(true);
    try {
      const [sales, purchases, expenses, customers, vendors, items, groups, ledgers, vouchers, voucherLines, latestSales, latestPurchases] = await Promise.all([
        supabase.from("sales_invoices").select("*").eq("company_id", currentCompanyId).eq("is_deleted", false).gte("invoice_date", range.from).lte("invoice_date", range.to).order("invoice_date", { ascending: true }),
        supabase.from("purchase_invoices").select("*").eq("company_id", currentCompanyId).eq("is_deleted", false).gte("invoice_date", range.from).lte("invoice_date", range.to).order("invoice_date", { ascending: true }),
        supabase.from("expenses").select("*").eq("company_id", currentCompanyId).gte("expense_date", range.from).lte("expense_date", range.to),
        supabase.from("customers").select("id", { count: "exact", head: true }).eq("company_id", currentCompanyId),
        supabase.from("vendors").select("id", { count: "exact", head: true }).eq("company_id", currentCompanyId),
        supabase.from("items").select("id", { count: "exact", head: true }).eq("company_id", currentCompanyId),
        supabase.from("account_groups").select("id,group_name,account_nature,normal_balance").eq("company_id", currentCompanyId),
        supabase.from("chart_of_accounts").select("id,ledger_name,group_id,opening_balance,opening_balance_type,opening_date,party_type,is_active").eq("company_id", currentCompanyId).eq("is_active",true),
        supabase.from("accounting_vouchers").select("id,voucher_date,status").eq("company_id", currentCompanyId).eq("status","Posted").lte("voucher_date",dateText(new Date())),
        supabase.from("accounting_voucher_lines").select("voucher_id,ledger_id,debit,credit").eq("company_id", currentCompanyId),
        supabase.from("sales_invoices").select("invoice_date").eq("company_id",currentCompanyId).eq("is_deleted",false).order("invoice_date",{ascending:false}).limit(1),
        supabase.from("purchase_invoices").select("invoice_date").eq("company_id",currentCompanyId).eq("is_deleted",false).order("invoice_date",{ascending:false}).limit(1)
      ]);
      const firstError = [sales, purchases, expenses, customers, vendors, items, groups, ledgers, vouchers, voucherLines, latestSales, latestPurchases].find(result => result.error);
      if (firstError) throw firstError.error;
      const invoiceIds = (sales.data || []).map(row => row.id).filter(Boolean);
      const itemResult = invoiceIds.length
        ? await supabase.from("sales_invoice_items").select("*").in("invoice_id", invoiceIds)
        : { data: [], error: null };
      if (itemResult.error) throw itemResult.error;
      setData({
        sales: sales.data || [], purchases: purchases.data || [], expenses: expenses.data || [],
        itemSales: itemResult.data || [],
        customers: customers.count || 0, vendors: vendors.count || 0, items: items.count || 0,
        groups: groups.data || [], ledgers: ledgers.data || [], vouchers: vouchers.data || [], voucherLines: voucherLines.data || [], latestSalesDate: latestSales.data?.[0]?.invoice_date || null, latestPurchaseDate: latestPurchases.data?.[0]?.invoice_date || null, error: ""
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
    const salesTaxable = data.sales.reduce((sum,row)=>sum+amount(row,["taxable_value"]),0);
    const purchases = data.purchases.reduce((sum, row) => sum + amount(row, ["grand_total", "total_amount", "invoice_value"]), 0);
    const purchasesTaxable = data.purchases.reduce((sum,row)=>sum+amount(row,["taxable","taxable_value"]),0);
    const expenses = data.expenses.reduce((sum, row) => sum + amount(row, ["total_amount", "grand_total", "amount"]), 0);
    const gstOutput = data.sales.reduce((sum,row)=>sum+amount(row,["cgst"])+amount(row,["sgst"])+amount(row,["igst"])+amount(row,["cess_amount"])+amount(row,["additional_cess_amount"]),0);
    const gstInput = data.purchases.reduce((sum,row)=>sum+amount(row,["cgst"])+amount(row,["sgst"])+amount(row,["igst"]),0);
    const gstCashLedger = data.ledgers.filter(l=>/gst.*cash|cash.*gst|electronic cash/i.test(l.ledger_name)).reduce((sum,l)=>sum+ledgerClosingBalance(l,data),0);
    const gstLiability = gstOutput - gstInput - Math.max(0,gstCashLedger);
    const receivables = data.sales.reduce((sum, row) => sum + Math.max(0, amount(row, ["balance_amount", "outstanding_amount", "due_amount"]) || (amount(row, ["total_amount", "grand_total"]) - amount(row, ["paid_amount"]))), 0);
    const payables = data.purchases.reduce((sum, row) => sum + Math.max(0, amount(row, ["balance_amount", "outstanding_amount", "due_amount"]) || (amount(row, ["grand_total", "total_amount"]) - amount(row, ["paid_amount"]))), 0);
    return { sales, salesTaxable, purchases, purchasesTaxable, expenses, gstOutput, gstInput, gstCashLedger, gstLiability, receivables, payables };
  }, [data]);

  const latestAccountingDate = useMemo(() => { const dates=[data.latestSalesDate,data.latestPurchaseDate,...data.vouchers.map(r=>r.voucher_date)].filter(Boolean).sort(); return dates.length?dates[dates.length-1]:null; },[data.latestSalesDate,data.latestPurchaseDate,data.vouchers]);
  const currentLedgerBalances = useMemo(() => data.ledgers.map(ledger=>({ledger,balance:ledgerClosingBalance(ledger,data)})),[data.ledgers,data.vouchers,data.voucherLines]);
  const cashBalance = currentLedgerBalances.filter(x=>/cash/i.test(x.ledger.ledger_name)).reduce((sum,x)=>sum+x.balance,0);
  const bankBalance = currentLedgerBalances.filter(x=>x.ledger.party_type==="Bank" || /bank/i.test(x.ledger.ledger_name)).reduce((sum,x)=>sum+x.balance,0);

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
      <div className="dashboard-heading-copy"><span className="dashboard-eyebrow">BUSINESS OVERVIEW</span><h1>Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"}!</h1><p>Here’s your business overview for {fyLabel}</p></div>
      <div className="dashboard-actions">
        <div className="dashboard-filter-wrap">
          <button className={`dashboard-date-trigger ${dateFilterOpen ? "is-open" : ""}`} type="button" onClick={() => setDateFilterOpen(v=>!v)} aria-expanded={dateFilterOpen}>
            <span className="dashboard-date-icon"><FiCalendar/></span><span className="dashboard-date-copy"><small>REPORTING PERIOD</small><strong>{DATE_FILTERS.find(option=>option.value===period)?.label || "This Financial Year"}</strong></span><FiChevronDown className="dashboard-date-chevron"/>
          </button>
          {dateFilterOpen && <><button className="dashboard-popover-backdrop" aria-label="Close date filter" onClick={()=>setDateFilterOpen(false)}/><div className="dashboard-date-menu">
            <div className="dashboard-menu-title"><div><strong>Select reporting period</strong><span>Applies to all dashboard figures and charts</span></div><button onClick={()=>setDateFilterOpen(false)} aria-label="Close"><FiX/></button></div>
            <div className="dashboard-date-options">{["Quick","Weeks","Months","Quarters","Years","Custom"].map(group=><div className="dashboard-date-group" key={group}><small>{group}</small><div>{DATE_FILTERS.filter(option=>option.group===group).map(option=><button key={option.value} className={period===option.value?"selected":""} onClick={()=>{setPeriod(option.value);if(option.value!=="custom")setDateFilterOpen(false);}}>{option.label}{period===option.value&&<FiCheck/>}</button>)}</div></div>)}</div>
            {period==="custom"&&<div className="dashboard-custom-range"><label>From date<input type="date" value={customFrom} max={customTo} onChange={e=>setCustomFrom(e.target.value)}/></label><label>To date<input type="date" value={customTo} min={customFrom} onChange={e=>setCustomTo(e.target.value)}/></label><button onClick={()=>setDateFilterOpen(false)} disabled={!customFrom||!customTo||customFrom>customTo}>Apply date range</button></div>}
          </div></>}
        </div>
        <button className="dashboard-configure-button" type="button" onClick={() => setShowWidgetSettings(v => !v)} aria-expanded={showWidgetSettings}><FiSettings/><span>Configure</span></button>
        <button className="dashboard-icon-button" onClick={loadDashboard} disabled={refreshing} aria-label="Refresh dashboard"><FiRefreshCw className={refreshing ? "spinning" : ""}/></button>
      </div>
    </div>

    {showWidgetSettings && <><button className="dashboard-config-backdrop" onClick={()=>setShowWidgetSettings(false)} aria-label="Close dashboard configuration"/><section className="dashboard-config-popover" role="dialog" aria-modal="true" aria-label="Customize dashboard"><div className="dashboard-config-heading"><div><span className="dashboard-config-icon"><FiSettings/></span><div><h2>Customize dashboard</h2><p>Choose visibility and card order.</p></div></div><button onClick={()=>setShowWidgetSettings(false)} aria-label="Close configuration"><FiX/></button></div><label className="dashboard-select-all"><input type="checkbox" checked={Object.keys(widgetLabels).every(key=>widgets[key])} onChange={e=>setWidgets(prev=>Object.fromEntries(Object.keys(widgetLabels).map(key=>[key,e.target.checked])))}/><span>Select all dashboard items</span></label><div className="dashboard-widget-grid">{cardOrder.map((key,index)=><div key={key} className={`dashboard-widget-option ${widgets[key]?"is-enabled":""}`}><label className="dashboard-widget-toggle"><input type="checkbox" checked={!!widgets[key]} onChange={e=>setWidgets(prev=>({...prev,[key]:e.target.checked}))}/><span className="dashboard-widget-check">{widgets[key]&&<FiCheck/>}</span><span className="dashboard-widget-label">{widgetLabels[key]}</span></label><div className="dashboard-widget-movers"><button type="button" disabled={index===0} onClick={()=>setCardOrder(prev=>{const next=[...prev];[next[index-1],next[index]]=[next[index],next[index-1]];return next;})} aria-label={`Move ${widgetLabels[key]} up`}><FiChevronUp/></button><button type="button" disabled={index===cardOrder.length-1} onClick={()=>setCardOrder(prev=>{const next=[...prev];[next[index+1],next[index]]=[next[index],next[index+1]];return next;})} aria-label={`Move ${widgetLabels[key]} down`}><FiMoveDown/></button></div></div>)}</div><button className="dashboard-config-done" onClick={()=>setShowWidgetSettings(false)}>Done</button></section></>}
    {companyLoading ? <div className="dashboard-message">Loading company information…</div> : !currentCompanyId ? <div className="dashboard-message"><FiBriefcase/><div><strong>Select a company to view its dashboard</strong><span>Choose a company from the sidebar. Dashboard figures are always restricted to the selected company.</span></div></div> : <>
      {data.error && <div className="dashboard-error">{data.error} <button onClick={loadDashboard}>Retry</button></div>}
      <div className="dashboard-company-line"><FiBriefcase/> <strong>{currentCompany?.company_name || "Selected company"}</strong><span>·</span><span>{range.from} to {range.to}</span></div>

      <div className="dashboard-all-cards"><section className="dashboard-kpis">
        <Kpi style={{order:cardOrder.indexOf("sales")}} hidden={!widgets.sales} icon={<FiTrendingUp/>} label="Sales" value={money(totals.sales)} note={`Taxable ${money(totals.salesTaxable)} · ${number(data.sales.length)} invoices`} tone="green"/>
        <Kpi style={{order:cardOrder.indexOf("purchases")}} hidden={!widgets.purchases} icon={<FiShoppingCart/>} label="Purchases" value={money(totals.purchases)} note={`Taxable ${money(totals.purchasesTaxable)} · ${number(data.purchases.length)} invoices`} tone="blue"/>
        <Kpi style={{order:cardOrder.indexOf("expenses")}} hidden={!widgets.expenses} icon={<FiDollarSign/>} label="Expenses" value={money(totals.expenses)} note={`${number(data.expenses.length)} entries`} tone="amber"/>
        <GstCard style={{order:cardOrder.indexOf("gst")}} hidden={!widgets.gst} output={totals.gstOutput} input={totals.gstInput} cashLedger={totals.gstCashLedger} liability={totals.gstLiability} updatedThrough={latestAccountingDate}/> 
        <Kpi style={{order:cardOrder.indexOf("bank")}} hidden={!widgets.bank} icon={<FiDollarSign/>} label="Bank Balance" value={bankBalance ? money(bankBalance) : "—"} note={bankBalance ? "Current closing balance" : "No bank ledger balance available"} tone="rose"/><Kpi style={{order:cardOrder.indexOf("cash")}} hidden={!widgets.cash} icon={<FiDollarSign/>} label="Cash in Hand" value={money(cashBalance)} note="Current closing balance" tone="amber"/>
      </section>

      <section className="dashboard-middle-grid">
        <article style={{order:cardOrder.indexOf("trend")}} hidden={!widgets.trend} className="dashboard-panel dashboard-trend-panel">
          <div className="dashboard-panel-heading"><div><h2>Sales vs Purchases Trend</h2><p>Month-wise invoice values</p></div><div className="dashboard-legend"><span><i className="sales-dot"/>Sales</span><span><i className="purchase-dot"/>Purchases</span></div></div>
          <div className="dashboard-chart">
            <div className="dashboard-ylabels"><span>{money(maxTrend)}</span><span>{money(maxTrend * .75)}</span><span>{money(maxTrend * .5)}</span><span>{money(maxTrend * .25)}</span><span>₹0</span></div>
            <div className="dashboard-bars">{monthly.map(row => <div className="dashboard-month" key={row.month}><div className="dashboard-bar-pair"><span className="dashboard-bar sales-bar" style={{height: `${Math.max(2, row.sales / maxTrend * 100)}%`}} title={`Sales ${money(row.sales)}`}/><span className="dashboard-bar purchase-bar" style={{height: `${Math.max(2, row.purchases / maxTrend * 100)}%`}} title={`Purchases ${money(row.purchases)}`}/></div><small>{row.month}</small></div>)}</div>
          </div>
        </article>
        <article style={{order:cardOrder.indexOf("balances")}} hidden={!widgets.balances} className="dashboard-panel dashboard-balance-panel">
          <div className="dashboard-panel-heading"><div><h2>Receivables & Payables</h2><p>Outstanding invoice balances</p></div></div>
          <div className="dashboard-balance-card receivable"><span><FiArrowDownRight/> Receivables (To Receive)</span><strong>{money(totals.receivables)}</strong></div>
          <div className="dashboard-balance-card payable"><span><FiArrowUpRight/> Payables (To Pay)</span><strong>{money(totals.payables)}</strong></div>
          <p className="dashboard-note">Calculated from available invoice balance and payment fields.</p>
        </article>
        <article style={{order:cardOrder.indexOf("snapshot")}} hidden={!widgets.snapshot} className="dashboard-panel dashboard-snapshot-panel">
          <div className="dashboard-panel-heading"><div><h2>Business Snapshot</h2><p>Current company records</p></div></div>
          <Snapshot icon={<FiFileText/>} label="Total Invoices (Sales)" value={number(data.sales.length)}/>
          <Snapshot icon={<FiShoppingCart/>} label="Total Purchase Invoices" value={number(data.purchases.length)}/>
          <Snapshot icon={<FiUsers/>} label="Total Customers" value={number(data.customers)}/>
          <Snapshot icon={<FiBriefcase/>} label="Total Suppliers" value={number(data.vendors)}/>
          <Snapshot icon={<FiPackage/>} label="Active Items" value={number(data.items)}/>
        </article>
      </section>

      <section className="dashboard-bottom-grid">
        
        <article style={{order:cardOrder.indexOf("customers")}} hidden={!widgets.customers} className="dashboard-panel dashboard-list-panel"><div className="dashboard-panel-heading"><div><h2>Top 5 Customers</h2><p>By sales value in selected period</p></div></div>{topCustomers.length ? topCustomers.map(([name, value]) => <RankRow key={name} name={name} value={value} max={maxCustomer}/>) : <Empty>No sales invoices found for this period.</Empty>}</article>
        <article style={{order:cardOrder.indexOf("items")}} hidden={!widgets.items} className="dashboard-panel dashboard-list-panel"><div className="dashboard-panel-heading"><div><h2>Top 5 Items</h2><p>By sales value</p></div></div>{topItems.length ? topItems.map(([name, value]) => <RankRow key={name} name={name} value={value} max={maxItem}/>) : <Empty>No sales item records found for this period.</Empty>}</article>
      </section></div>
    </>}
  </main>;
}

function ledgerClosingBalance(ledger, data) {
  const posted = new Set((data.vouchers||[]).filter(v=>v.status==="Posted").map(v=>v.id));
  const lines=(data.voucherLines||[]).filter(line=>line.ledger_id===ledger.id && posted.has(line.voucher_id));
  const debit=lines.reduce((sum,line)=>sum+Number(line.debit||0),0);
  const credit=lines.reduce((sum,line)=>sum+Number(line.credit||0),0);
  const opening=Number(ledger.opening_balance||0)*(ledger.opening_balance_type==="Credit"?-1:1);
  return opening+debit-credit;
}

function Kpi({ icon, label, value, note, tone, hidden = false, style }){
  return <article style={style} hidden={hidden} className={`dashboard-kpi ${tone}`}><span className="dashboard-kpi-icon">{icon}</span><div><span className="dashboard-kpi-label">{label}</span><strong>{value}</strong><small>{note}</small></div></article>;
}
function GstCard({output,input,cashLedger,liability,updatedThrough,hidden,style}) {
  return <article style={style} hidden={hidden} className="dashboard-panel dashboard-gst-card">
    <div className="dashboard-panel-heading"><div><h2>GST Summary</h2><p>Calculated from SYD accounting records</p></div></div>
    <div className="dashboard-gst-metric"><span>GST Output</span><strong>{money(output)}</strong></div>
    <div className="dashboard-gst-metric"><span>Purchase GST Input (Books)</span><strong>{money(input)}</strong></div>
    <div className="dashboard-gst-metric"><span>GST Cash Ledger</span><strong>{money(cashLedger)}</strong></div>
    <div className="dashboard-gst-liability"><span>Estimated Net GST Payable</span><strong>{money(liability)}</strong></div>
    <p className="dashboard-gst-updated">Accounting entries updated through: <b>{updatedThrough || "No posted accounting entries"}</b></p>
    <p className="dashboard-gst-disclaimer">Indicative book balance only. Reconcile with GST portal before filing.</p>
  </article>;
}
function Snapshot({ icon, label, value }) {
  return <div className="dashboard-snapshot-row"><span>{icon}{label}</span><strong>{value}</strong></div>;
}
function RankRow({ name, value, max }) {
  return <div className="dashboard-rank-row"><span title={name}>{name}</span><i><b style={{width: `${value / max * 100}%`}}/></i><strong>{money(value)}</strong></div>;
}
function Empty({ children }) { return <div className="dashboard-empty">{children}</div>; }
