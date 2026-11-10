import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCompany } from "../../context/CompanyContext";
import {
  createAccountGroup,
  createLedger,
  createVoucher,
  getAccountingData,
  postVoucher
} from "../../services/accountingService";
import "../../css/accounting/AccountingWorkspace.css";

const money = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 2
}).format(Number(value || 0));

const today = () => new Date().toISOString().slice(0, 10);
const blankLine = () => ({ ledger_id: "", debit: "", credit: "", line_narration: "" });

const NAV = [
  { label: "Accounting Dashboard", path: "/app/accounting" },
  { label: "Chart of Accounts", path: "/app/chart-of-accounts" },
  { label: "Journal Voucher", path: "/app/journal-voucher" },
  { label: "Ledger", path: "/app/ledger" },
  { label: "Trial Balance", path: "/app/trial-balance" },
  { label: "Profit & Loss", path: "/app/profit-loss" },
  { label: "Balance Sheet", path: "/app/balance-sheet" }
];

const DEFAULT_GROUPS = [
  ["Assets","AST",null,"Asset","Debit","Balance Sheet"],
  ["Liabilities","LIA",null,"Liability","Credit","Balance Sheet"],
  ["Equity","EQT",null,"Equity","Credit","Balance Sheet"],
  ["Income","INC",null,"Income","Credit","Profit & Loss"],
  ["Expenses","EXP",null,"Expense","Debit","Profit & Loss"]
];

function AccountingWorkspace() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentCompany, currentCompanyId } = useCompany();
  const [data, setData] = useState({ groups: [], ledgers: [], vouchers: [], lines: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [showLedgerForm, setShowLedgerForm] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [selectedLedger, setSelectedLedger] = useState("");
  const [fromDate, setFromDate] = useState(new Date(new Date().getFullYear(), 3, 1).toISOString().slice(0,10));
  const [toDate, setToDate] = useState(today());
  const [groupForm, setGroupForm] = useState({
    group_name:"", group_code:"", parent_group_id:"", account_nature:"Asset",
    normal_balance:"Debit", statement_classification:"Balance Sheet", description:""
  });
  const [ledgerForm, setLedgerForm] = useState({
    ledger_name:"", ledger_code:"", group_id:"", opening_balance:"0",
    opening_balance_type:"Debit", opening_date:today(), party_type:"",
    gst_applicable:false, gstin:"", description:""
  });
  const [voucher, setVoucher] = useState({
    voucher_type:"Journal", voucher_date:today(), reference_number:"", narration:""
  });
  const [voucherLines, setVoucherLines] = useState([blankLine(), blankLine()]);

  const page = NAV.find((item) => item.path === location.pathname)?.label || "Accounting Dashboard";
  const postedVouchers = useMemo(() => data.vouchers.filter((item) => item.status === "Posted"), [data.vouchers]);
  const postedLines = useMemo(() => {
    const postedIds = new Set(postedVouchers.map((item) => item.id));
    return data.lines.filter((line) => postedIds.has(line.voucher_id));
  }, [data.lines, postedVouchers]);

  const load = async () => {
    if (!currentCompanyId) {
      setData({ groups: [], ledgers: [], vouchers: [], lines: [] });
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const result = await getAccountingData(currentCompanyId);
      setData(result);
    } catch (err) {
      setError(err.message || "Unable to load accounting data. Apply the accounting database migration first.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [currentCompanyId]);

  const totals = useMemo(() => {
    const debit = postedLines.reduce((sum, row) => sum + Number(row.debit || 0), 0);
    const credit = postedLines.reduce((sum, row) => sum + Number(row.credit || 0), 0);
    const income = data.ledgers.filter((ledger) => data.groups.find((g) => g.id === ledger.group_id)?.account_nature === "Income")
      .reduce((sum, ledger) => sum + ledgerBalance(ledger, postedLines, data.vouchers), 0);
    const expenses = data.ledgers.filter((ledger) => data.groups.find((g) => g.id === ledger.group_id)?.account_nature === "Expense")
      .reduce((sum, ledger) => sum + ledgerBalance(ledger, postedLines, data.vouchers), 0);
    return { debit, credit, income, expenses, profit: income - expenses };
  }, [postedLines, data.ledgers, data.groups, data.vouchers]);

  function ledgerBalance(ledger, lines = postedLines, vouchers = data.vouchers, startDate = null, endDate = null, includeOpening = true) {
    const voucherMap = new Map(vouchers.filter((item) => item.status === "Posted").map((item) => [item.id, item]));
    const activity = lines.filter((line) => {
      if (line.ledger_id !== ledger.id) return false;
      const linkedVoucher = voucherMap.get(line.voucher_id);
      if (!linkedVoucher) return false;
      if (startDate && linkedVoucher.voucher_date < startDate) return false;
      if (endDate && linkedVoucher.voucher_date > endDate) return false;
      return true;
    });
    const debit = activity.reduce((sum, row) => sum + Number(row.debit || 0), 0);
    const credit = activity.reduce((sum, row) => sum + Number(row.credit || 0), 0);
    const opening = includeOpening
      ? Number(ledger.opening_balance || 0) * (ledger.opening_balance_type === "Credit" ? -1 : 1)
      : 0;
    return opening + debit - credit;
  }

  const groupChildren = (parentId) => data.groups.filter((group) => (group.parent_group_id || null) === (parentId || null));
  const getGroupPath = (groupId) => {
    const group = data.groups.find((item) => item.id === groupId);
    if (!group) return "Unassigned";
    const parent = data.groups.find((item) => item.id === group.parent_group_id);
    return parent ? parent.group_name + " / " + group.group_name : group.group_name;
  };

  const handleCreateGroup = async (event) => {
    event.preventDefault();
    try {
      setBusy(true); setError(""); setNotice("");
      await createAccountGroup(currentCompanyId, {
        ...groupForm,
        parent_group_id: groupForm.parent_group_id || null,
        is_active: true
      });
      setGroupForm({ group_name:"", group_code:"", parent_group_id:"", account_nature:"Asset", normal_balance:"Debit", statement_classification:"Balance Sheet", description:"" });
      setShowGroupForm(false);
      setNotice("Account group created successfully.");
      await load();
    } catch (err) { setError(err.message || "Unable to create account group."); }
    finally { setBusy(false); }
  };

  const handleCreateLedger = async (event) => {
    event.preventDefault();
    try {
      setBusy(true); setError(""); setNotice("");
      await createLedger(currentCompanyId, {
        ...ledgerForm,
        opening_balance: Number(ledgerForm.opening_balance || 0),
        group_id: ledgerForm.group_id,
        party_type: ledgerForm.party_type || null,
        gstin: ledgerForm.gstin || null
      });
      setLedgerForm({ ledger_name:"", ledger_code:"", group_id:"", opening_balance:"0", opening_balance_type:"Debit", opening_date:today(), party_type:"", gst_applicable:false, gstin:"", description:"" });
      setShowLedgerForm(false);
      setNotice("General ledger created successfully.");
      await load();
    } catch (err) { setError(err.message || "Unable to create ledger."); }
    finally { setBusy(false); }
  };

  const loadDefaultGroups = async () => {
    if (data.groups.length) {
      setError("Default groups can only be loaded into an empty Chart of Accounts.");
      return;
    }
    try {
      setBusy(true); setError("");
      for (const row of DEFAULT_GROUPS) {
        await createAccountGroup(currentCompanyId, {
          group_name:row[0], group_code:row[1], parent_group_id:null,
          account_nature:row[3], normal_balance:row[4],
          statement_classification:row[5], description:"Default system account group",
          is_system:true, is_active:true
        });
      }
      setNotice("Five standard account groups have been created.");
      await load();
    } catch (err) { setError(err.message || "Unable to create default groups."); }
    finally { setBusy(false); }
  };

  const changeLine = (index, key, value) => {
    setVoucherLines((previous) => previous.map((line, i) => i === index ? { ...line, [key]:value } : line));
  };
  const debitTotal = voucherLines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
  const creditTotal = voucherLines.reduce((sum, line) => sum + Number(line.credit || 0), 0);
  const isBalanced = debitTotal > 0 && Math.abs(debitTotal - creditTotal) < 0.005 &&
    voucherLines.every((line) => line.ledger_id && ((Number(line.debit || 0) > 0) !== (Number(line.credit || 0) > 0)));

  const saveVoucher = async (postNow) => {
    try {
      setBusy(true); setError(""); setNotice("");
      const created = await createVoucher(currentCompanyId, {
        ...voucher,
        voucher_number:"JV-" + Date.now().toString().slice(-8),
        source_module:"Manual",
        status:"Draft"
      }, voucherLines);
      if (postNow) await postVoucher(currentCompanyId, created.id);
      setVoucher({ voucher_type:"Journal", voucher_date:today(), reference_number:"", narration:"" });
      setVoucherLines([blankLine(), blankLine()]);
      setNotice(postNow ? "Journal voucher posted successfully." : "Journal voucher saved as draft.");
      await load();
    } catch (err) { setError(err.message || "Unable to save journal voucher."); }
    finally { setBusy(false); }
  };

  const reportRows = useMemo(() => data.ledgers.map((ledger) => {
    const signed = ledgerBalance(ledger, postedLines, data.vouchers, null, toDate, true);
    return { ...ledger, balance:Math.abs(signed), side:signed >= 0 ? "Dr" : "Cr", groupName:getGroupPath(ledger.group_id) };
  }), [data.ledgers, postedLines, data.vouchers, data.groups, toDate]);

  const periodRows = useMemo(() => data.ledgers.map((ledger) => {
    const signed = ledgerBalance(ledger, postedLines, data.vouchers, fromDate, toDate, false);
    return { ...ledger, balance:Math.abs(signed), side:signed >= 0 ? "Dr" : "Cr", groupName:getGroupPath(ledger.group_id) };
  }), [data.ledgers, postedLines, data.vouchers, data.groups, fromDate, toDate]);

  const visibleLines = selectedLedger
    ? postedLines.filter((line) => line.ledger_id === selectedLedger)
    : postedLines;

  const renderGroupTree = (parentId = null, depth = 0) => {
    const groups = groupChildren(parentId);
    return groups.map((group) => {
      const children = groupChildren(group.id);
      const ledgers = data.ledgers.filter((ledger) => ledger.group_id === group.id);
      const isOpen = expanded[group.id] !== false;
      return (
        <React.Fragment key={group.id}>
          <tr className="coa-group-row">
            <td>
              <button className="coa-tree-toggle" onClick={() => setExpanded((old) => ({ ...old, [group.id]:!isOpen }))}>
                <span style={{ paddingLeft: depth * 20 }}>{children.length || ledgers.length ? (isOpen ? "⌄" : "›") : "•"}</span>
                <span className="coa-folder">▰</span>
                <strong>{group.group_name}</strong>
              </button>
            </td>
            <td><span className="type-pill">{depth ? "Sub Group" : "Group"}</span></td>
            <td>{group.group_code}</td>
            <td>{group.account_nature}</td>
            <td className="amount-cell">{money(ledgers.reduce((sum, item) => sum + Math.abs(ledgerBalance(item)), 0))}</td>
          </tr>
          {isOpen && <>
            {children.length > 0 && renderGroupTree(group.id, depth + 1)}
            {ledgers.map((ledger) => (
              <tr className="coa-ledger-row" key={ledger.id}>
                <td><button className="coa-ledger-link" style={{ paddingLeft: (depth + 1) * 20 + 28 }} onClick={() => { setSelectedLedger(ledger.id); navigate("/app/ledger"); }}>↳ {ledger.ledger_name}</button></td>
                <td><span className="type-pill ledger-pill">Ledger</span></td>
                <td>{ledger.ledger_code}</td>
                <td>{ledger.party_type || "General"}</td>
                <td className="amount-cell">{money(Math.abs(ledgerBalance(ledger)))}</td>
              </tr>
            ))}
          </>}
        </React.Fragment>
      );
    });
  };

  const renderHeader = (title, description, actions = null) => (
    <div className="accounting-page-heading">
      <div><div className="accounting-eyebrow">EAZYTAXATION / ACCOUNTING</div><h1>{title}</h1><p>{description}</p></div>
      <div className="accounting-heading-actions">{actions}</div>
    </div>
  );

  const renderDashboard = () => (
    <>
      {renderHeader("Accounting Dashboard", "Your company's financial position at a glance.", <><select className="accounting-filter"><option>FY 2026-27</option></select><select className="accounting-filter"><option>Current Period</option></select></>)}
      <div className="accounting-stat-grid">
        <div className="accounting-stat"><span>Total Debits Posted</span><strong>{money(totals.debit)}</strong><small>Posted journal entries</small></div>
        <div className="accounting-stat"><span>Total Credits Posted</span><strong>{money(totals.credit)}</strong><small>Posted journal entries</small></div>
        <div className="accounting-stat stat-green"><span>Net Profit / (Loss)</span><strong>{money(totals.profit)}</strong><small>Based on classified ledger balances</small></div>
        <div className="accounting-stat"><span>General Ledgers</span><strong>{data.ledgers.length}</strong><small>Active chart accounts</small></div>
      </div>
      <div className="accounting-dashboard-grid">
        <section className="accounting-panel">
          <div className="panel-heading"><div><h3>Recent Journal Vouchers</h3><p>Latest accounting activity</p></div><button className="text-action" onClick={() => navigate("/app/journal-voucher")}>View all</button></div>
          <div className="table-scroll"><table className="accounting-table"><thead><tr><th>Voucher No.</th><th>Date</th><th>Type</th><th>Status</th><th className="align-right">Amount</th></tr></thead><tbody>
            {data.vouchers.slice(0,6).map((item) => <tr key={item.id}><td className="strong-cell">{item.voucher_number}</td><td>{item.voucher_date}</td><td>{item.voucher_type}</td><td><span className={"status-pill " + item.status.toLowerCase()}>{item.status}</span></td><td className="align-right">{money(item.total_debit)}</td></tr>)}
            {!data.vouchers.length && <tr><td colSpan="5" className="empty-cell">No vouchers created yet.</td></tr>}
          </tbody></table></div>
        </section>
        <section className="accounting-panel">
          <div className="panel-heading"><div><h3>Quick Actions</h3><p>Common accounting tasks</p></div></div>
          <div className="quick-actions">
            <button onClick={() => navigate("/app/journal-voucher")}>＋ <span><b>Journal Voucher</b><small>Create a manual entry</small></span></button>
            <button onClick={() => { setShowGroupForm(true); navigate("/app/chart-of-accounts"); }}>▤ <span><b>Create Account Group</b><small>Build account hierarchy</small></span></button>
            <button onClick={() => { setShowLedgerForm(true); navigate("/app/chart-of-accounts"); }}>▣ <span><b>Create Ledger</b><small>Add a general ledger</small></span></button>
            <button onClick={() => navigate("/app/trial-balance")}>▥ <span><b>Trial Balance</b><small>Review debit and credit totals</small></span></button>
          </div>
        </section>
      </div>
      <section className="accounting-panel accounting-shortcuts">
        <div className="panel-heading"><div><h3>Financial Reports</h3><p>Open live reports generated from posted accounting entries.</p></div></div>
        <div className="report-shortcuts">
          {NAV.slice(3).map((item) => <button key={item.path} onClick={() => navigate(item.path)}>{item.label}<span>→</span></button>)}
        </div>
      </section>
    </>
  );

  const renderChart = () => (
    <>
      {renderHeader("Chart of Accounts", "Manage account groups, subgroups and general ledgers.", <><button className="btn-secondary" onClick={loadDefaultGroups} disabled={busy || data.groups.length > 0}>Load Standard Groups</button><button className="btn-secondary" onClick={() => setShowGroupForm(true)}>＋ New Group</button><button className="btn-primary" onClick={() => setShowLedgerForm(true)}>＋ New Ledger</button></>)}
      <section className="accounting-panel">
        <div className="coa-toolbar"><input placeholder="⌕  Search group or ledger..." onChange={(e) => { const value=e.target.value.toLowerCase(); setExpanded(Object.fromEntries(data.groups.map((g)=>[g.id, !value || g.group_name.toLowerCase().includes(value)]))); }} /><div className="view-toggle"><button className="selected">Tree View</button><button onClick={() => setExpanded(Object.fromEntries(data.groups.map((g)=>[g.id,true])))}>Expand All</button></div></div>
        <div className="table-scroll"><table className="accounting-table coa-table"><thead><tr><th>Account / Ledger</th><th>Type</th><th>Code</th><th>Nature</th><th className="align-right">Balance (₹)</th></tr></thead><tbody>
          {renderGroupTree()}
          {!data.groups.length && <tr><td colSpan="5" className="empty-cell">Your Chart of Accounts is empty. Start with the five standard account groups.</td></tr>}
        </tbody></table></div>
      </section>
      {showGroupForm && <div className="accounting-modal-backdrop"><form className="accounting-modal" onSubmit={handleCreateGroup}>
        <div className="modal-heading"><div><h2>Create Account Group</h2><p>Create a main group or a subgroup under an existing group.</p></div><button type="button" onClick={() => setShowGroupForm(false)}>✕</button></div>
        <div className="accounting-form-grid">
          <label>Group Name *<input required value={groupForm.group_name} onChange={(e)=>setGroupForm({...groupForm,group_name:e.target.value})} placeholder="e.g. Current Assets"/></label>
          <label>Group Code *<input required value={groupForm.group_code} onChange={(e)=>setGroupForm({...groupForm,group_code:e.target.value.toUpperCase()})} placeholder="e.g. CA"/></label>
          <label>Parent Group<select value={groupForm.parent_group_id} onChange={(e)=>setGroupForm({...groupForm,parent_group_id:e.target.value})}><option value="">None – Main Group</option>{data.groups.filter((g)=>!g.parent_group_id).map((g)=><option key={g.id} value={g.id}>{g.group_name}</option>)}</select></label>
          <label>Account Nature *<select required value={groupForm.account_nature} onChange={(e)=>setGroupForm({...groupForm,account_nature:e.target.value,normal_balance:["Asset","Expense"].includes(e.target.value)?"Debit":"Credit",statement_classification:e.target.value==="Income"||e.target.value==="Expense"?"Profit & Loss":"Balance Sheet"})}>{["Asset","Liability","Equity","Income","Expense"].map((v)=><option key={v}>{v}</option>)}</select></label>
          <label>Normal Balance *<select value={groupForm.normal_balance} onChange={(e)=>setGroupForm({...groupForm,normal_balance:e.target.value})}><option>Debit</option><option>Credit</option></select></label>
          <label>Statement Classification *<select value={groupForm.statement_classification} onChange={(e)=>setGroupForm({...groupForm,statement_classification:e.target.value})}><option>Balance Sheet</option><option>Profit & Loss</option></select></label>
          <label className="full-field">Description<textarea rows="3" value={groupForm.description} onChange={(e)=>setGroupForm({...groupForm,description:e.target.value})} placeholder="Describe the purpose of this account group"/></label>
        </div>
        <div className="modal-actions"><button type="button" className="btn-secondary" onClick={()=>setShowGroupForm(false)}>Cancel</button><button className="btn-primary" disabled={busy}>{busy?"Saving...":"Save Group"}</button></div>
      </form></div>}
      {showLedgerForm && <div className="accounting-modal-backdrop"><form className="accounting-modal" onSubmit={handleCreateLedger}>
        <div className="modal-heading"><div><h2>Create General Ledger</h2><p>Every ledger must belong to an account group.</p></div><button type="button" onClick={()=>setShowLedgerForm(false)}>✕</button></div>
        <div className="accounting-form-grid">
          <label>Ledger Name *<input required value={ledgerForm.ledger_name} onChange={(e)=>setLedgerForm({...ledgerForm,ledger_name:e.target.value})} placeholder="e.g. HDFC Bank A/c"/></label>
          <label>Ledger Code *<input required value={ledgerForm.ledger_code} onChange={(e)=>setLedgerForm({...ledgerForm,ledger_code:e.target.value.toUpperCase()})} placeholder="e.g. BANK001"/></label>
          <label className="full-field">Parent Group / Subgroup *<select required value={ledgerForm.group_id} onChange={(e)=>setLedgerForm({...ledgerForm,group_id:e.target.value})}><option value="">Select account group</option>{data.groups.map((g)=><option key={g.id} value={g.id}>{getGroupPath(g.id)}</option>)}</select></label>
          <label>Opening Balance (₹)<input type="number" min="0" step="0.01" value={ledgerForm.opening_balance} onChange={(e)=>setLedgerForm({...ledgerForm,opening_balance:e.target.value})}/></label>
          <label>Balance Type<select value={ledgerForm.opening_balance_type} onChange={(e)=>setLedgerForm({...ledgerForm,opening_balance_type:e.target.value})}><option>Debit</option><option>Credit</option></select></label>
          <label>Opening Date<input type="date" value={ledgerForm.opening_date} onChange={(e)=>setLedgerForm({...ledgerForm,opening_date:e.target.value})}/></label>
          <label>Party Type<select value={ledgerForm.party_type} onChange={(e)=>setLedgerForm({...ledgerForm,party_type:e.target.value})}><option value="">General Ledger</option>{["Customer","Supplier","Bank","Employee","Other"].map((v)=><option key={v}>{v}</option>)}</select></label>
          <label className="full-field checkbox-field"><input type="checkbox" checked={ledgerForm.gst_applicable} onChange={(e)=>setLedgerForm({...ledgerForm,gst_applicable:e.target.checked})}/> GST Applicable</label>
          {ledgerForm.gst_applicable && <label>GSTIN<input value={ledgerForm.gstin} onChange={(e)=>setLedgerForm({...ledgerForm,gstin:e.target.value.toUpperCase()})} maxLength="15" placeholder="15 digit GSTIN"/></label>}
          <label className="full-field">Description<textarea rows="2" value={ledgerForm.description} onChange={(e)=>setLedgerForm({...ledgerForm,description:e.target.value})}/></label>
        </div>
        <div className="modal-actions"><button type="button" className="btn-secondary" onClick={()=>setShowLedgerForm(false)}>Cancel</button><button className="btn-primary" disabled={busy || !data.groups.length}>{busy?"Saving...":"Save Ledger"}</button></div>
      </form></div>}
    </>
  );

  const renderJournal = () => (
    <>
      {renderHeader("Journal Voucher", "Record a balanced double-entry accounting transaction.", <button className="btn-secondary" onClick={()=>navigate("/app/chart-of-accounts")}>Manage Ledgers</button>)}
      <section className="accounting-panel">
        <div className="accounting-form-grid journal-header-grid">
          <label>Voucher Type<select value={voucher.voucher_type} onChange={(e)=>setVoucher({...voucher,voucher_type:e.target.value})}>{["Journal","Receipt","Payment","Contra"].map((v)=><option key={v}>{v}</option>)}</select></label>
          <label>Voucher Date<input type="date" value={voucher.voucher_date} onChange={(e)=>setVoucher({...voucher,voucher_date:e.target.value})}/></label>
          <label>Reference Number<input value={voucher.reference_number} onChange={(e)=>setVoucher({...voucher,reference_number:e.target.value})} placeholder="External reference"/></label>
          <label className="full-field">Narration<input value={voucher.narration} onChange={(e)=>setVoucher({...voucher,narration:e.target.value})} placeholder="Enter transaction narration"/></label>
        </div>
        <div className="panel-heading journal-lines-heading"><div><h3>Accounting Entry</h3><p>Select ledger accounts and enter debit or credit amounts.</p></div><button className="btn-secondary" onClick={()=>setVoucherLines([...voucherLines,blankLine()])}>＋ Add Row</button></div>
        <div className="table-scroll"><table className="accounting-table journal-table"><thead><tr><th style={{width:"42px"}}>S.No.</th><th>Particulars (Ledger)</th><th>Debit (₹)</th><th>Credit (₹)</th><th>Narration</th><th></th></tr></thead><tbody>
          {voucherLines.map((line,index)=><tr key={index}><td>{index+1}</td><td><select value={line.ledger_id} onChange={(e)=>changeLine(index,"ledger_id",e.target.value)}><option value="">Select Ledger</option>{data.ledgers.map((ledger)=><option key={ledger.id} value={ledger.id}>{ledger.ledger_name}</option>)}</select></td><td><input type="number" min="0" step="0.01" value={line.debit} onChange={(e)=>setVoucherLines((old)=>old.map((row,i)=>i===index?{...row,debit:e.target.value,credit:e.target.value?"":row.credit}:row))}/></td><td><input type="number" min="0" step="0.01" value={line.credit} onChange={(e)=>setVoucherLines((old)=>old.map((row,i)=>i===index?{...row,credit:e.target.value,debit:e.target.value?"":row.debit}:row))}/></td><td><input value={line.line_narration} onChange={(e)=>changeLine(index,"line_narration",e.target.value)} placeholder="Optional"/></td><td><button className="icon-danger" disabled={voucherLines.length<=2} onClick={()=>setVoucherLines((old)=>old.filter((_,i)=>i!==index))}>×</button></td></tr>)}
        </tbody><tfoot><tr><th colSpan="2">Total</th><th>{money(debitTotal)}</th><th>{money(creditTotal)}</th><th colSpan="2"><span className={"balance-indicator "+(isBalanced?"balanced":"unbalanced")}>{isBalanced?"✓ Balanced":"Not Balanced"}</span></th></tr></tfoot></table></div>
        <div className="journal-footer"><span className="muted-note">A voucher can only be posted when total debit equals total credit.</span><div><button className="btn-secondary" disabled={busy || !isBalanced || !currentCompanyId} onClick={()=>saveVoucher(false)}>Save as Draft</button><button className="btn-primary" disabled={busy || !isBalanced || !currentCompanyId} onClick={()=>saveVoucher(true)}>{busy?"Processing...":"Post Voucher"}</button></div></div>
      </section>
    </>
  );

  const renderLedger = () => {
    const ledger = data.ledgers.find((item)=>item.id===selectedLedger) || data.ledgers[0];
    const ledgerLines = ledger ? postedLines.filter((line)=>line.ledger_id===ledger.id && data.vouchers.find((v)=>v.id===line.voucher_id)?.voucher_date>=fromDate && data.vouchers.find((v)=>v.id===line.voucher_id)?.voucher_date<=toDate) : [];
    const ledgerOpening = ledger ? Number(ledger.opening_balance||0) * (ledger.opening_balance_type==="Credit"?-1:1) : 0;
    const priorMovement = ledger ? postedLines.filter((line) => {
      if (line.ledger_id !== ledger.id) return false;
      const linked = data.vouchers.find((item) => item.id === line.voucher_id);
      return linked && linked.voucher_date < fromDate;
    }).reduce((sum, line) => sum + Number(line.debit||0) - Number(line.credit||0), 0) : 0;
    let running = ledgerOpening + priorMovement;
    return <>
      {renderHeader("General Ledger", "Account-wise transaction statement with running balance.", <button className="btn-secondary" onClick={()=>window.print()}>Export / Print</button>)}
      <section className="accounting-panel">
        <div className="report-filters">
          <label>Ledger Account<select value={ledger?.id||""} onChange={(e)=>setSelectedLedger(e.target.value)}><option value="">Select ledger</option>{data.ledgers.map((item)=><option key={item.id} value={item.id}>{item.ledger_name}</option>)}</select></label>
          <label>From Date<input type="date" value={fromDate} onChange={(e)=>setFromDate(e.target.value)}/></label>
          <label>To Date<input type="date" value={toDate} onChange={(e)=>setToDate(e.target.value)}/></label>
        </div>
        {ledger && <div className="ledger-summary"><span>Ledger Group: <b>{getGroupPath(ledger.group_id)}</b></span><span>Opening Balance: <b>{money(Math.abs(ledgerOpening))} {ledgerOpening<0?"Cr":"Dr"}</b></span></div>}
        <div className="table-scroll"><table className="accounting-table"><thead><tr><th>Date</th><th>Voucher No.</th><th>Particulars</th><th className="align-right">Debit (₹)</th><th className="align-right">Credit (₹)</th><th className="align-right">Balance (₹)</th></tr></thead><tbody>
          {ledgerLines.map((line)=>{const v=data.vouchers.find((item)=>item.id===line.voucher_id);running += Number(line.debit||0)-Number(line.credit||0);return <tr key={line.id}><td>{v?.voucher_date}</td><td>{v?.voucher_number}</td><td>{line.line_narration||v?.narration||"Accounting entry"}</td><td className="align-right">{Number(line.debit)?money(line.debit):"—"}</td><td className="align-right">{Number(line.credit)?money(line.credit):"—"}</td><td className="align-right">{money(Math.abs(running))} {running<0?"Cr":"Dr"}</td></tr>;})}
          {!ledgerLines.length && <tr><td colSpan="6" className="empty-cell">No posted transactions for this ledger and date range.</td></tr>}
        </tbody></table></div>
      </section>
    </>;
  };

  const renderTrialBalance = () => {
    const debitRows = reportRows.filter((row)=>row.side==="Dr");
    const creditRows = reportRows.filter((row)=>row.side==="Cr");
    const totalDr = debitRows.reduce((sum,row)=>sum+row.balance,0);
    const totalCr = creditRows.reduce((sum,row)=>sum+row.balance,0);
    return <>
      {renderHeader("Trial Balance", "Closing debit and credit balances of all general ledgers.", <button className="btn-secondary" onClick={()=>window.print()}>Export / Print</button>)}
      <section className="accounting-panel">
        <div className="report-filters"><label>As on Date<input type="date" value={toDate} onChange={(e)=>setToDate(e.target.value)}/></label><label>Report Type<select><option>Detailed</option><option>Group Summary</option></select></label><button className="btn-primary" onClick={load}>Show Report</button></div>
        <div className="table-scroll"><table className="accounting-table"><thead><tr><th>Particulars</th><th>Group</th><th className="align-right">Debit (₹)</th><th className="align-right">Credit (₹)</th></tr></thead><tbody>
          {reportRows.map((row)=><tr key={row.id}><td className="strong-cell">{row.ledger_name}</td><td>{row.groupName}</td><td className="align-right">{row.side==="Dr"?money(row.balance):"—"}</td><td className="align-right">{row.side==="Cr"?money(row.balance):"—"}</td></tr>)}
          {!reportRows.length && <tr><td colSpan="4" className="empty-cell">No ledgers available. Create your Chart of Accounts first.</td></tr>}
        </tbody><tfoot><tr><th colSpan="2">Total</th><th className="align-right">{money(totalDr)}</th><th className="align-right">{money(totalCr)}</th></tr></tfoot></table></div>
        <div className={"report-balance-note "+(Math.abs(totalDr-totalCr)<0.005?"balanced":"unbalanced")}>{Math.abs(totalDr-totalCr)<0.005?"✓ Trial Balance is balanced":"⚠ Difference: "+money(Math.abs(totalDr-totalCr))}</div>
      </section>
    </>;
  };

  const renderProfitLoss = () => {
    const incomeRows=periodRows.filter((row)=>data.groups.find((g)=>g.id===row.group_id)?.account_nature==="Income");
    const expenseRows=periodRows.filter((row)=>data.groups.find((g)=>g.id===row.group_id)?.account_nature==="Expense");
    const income=incomeRows.reduce((sum,row)=>sum+(row.side==="Cr"?row.balance:-row.balance),0);
    const expenses=expenseRows.reduce((sum,row)=>sum+(row.side==="Dr"?row.balance:-row.balance),0);
    return <>
      {renderHeader("Profit & Loss Account", "Income and expenses for the selected reporting period.", <button className="btn-secondary" onClick={()=>window.print()}>Export / Print</button>)}
      <section className="accounting-panel financial-statement">
        <div className="statement-title"><h2>{currentCompany?.company_name||"Company"}</h2><p>For the period {fromDate} to {toDate}</p></div>
        <div className="statement-section"><h3>Income</h3>{incomeRows.map((row)=><div className="statement-row" key={row.id}><span>{row.ledger_name}</span><b>{money(row.side==="Cr"?row.balance:-row.balance)}</b></div>)}<div className="statement-total"><b>Total Income (A)</b><b>{money(income)}</b></div></div>
        <div className="statement-section"><h3>Expenses</h3>{expenseRows.map((row)=><div className="statement-row" key={row.id}><span>{row.ledger_name}</span><b>{money(row.side==="Dr"?row.balance:-row.balance)}</b></div>)}<div className="statement-total"><b>Total Expenses (B)</b><b>{money(expenses)}</b></div></div>
        <div className="statement-net"><span>{income-expenses>=0?"Net Profit (A - B)":"Net Loss (B - A)"}</span><strong>{money(Math.abs(income-expenses))}</strong></div>
      </section>
    </>;
  };

  const renderBalanceSheet = () => {
    const groups=["Asset","Liability","Equity"];
    const sections=groups.map((nature)=>({nature,rows:reportRows.filter((row)=>data.groups.find((g)=>g.id===row.group_id)?.account_nature===nature)}));
    const assets=sections.find((s)=>s.nature==="Asset").rows.reduce((sum,row)=>sum+(row.side==="Dr"?row.balance:-row.balance),0);
    const liabilities=sections.find((s)=>s.nature==="Liability").rows.reduce((sum,row)=>sum+(row.side==="Cr"?row.balance:-row.balance),0);
    const equity=sections.find((s)=>s.nature==="Equity").rows.reduce((sum,row)=>sum+(row.side==="Cr"?row.balance:-row.balance),0);
    const currentProfit=periodRows.filter((row)=>data.groups.find((g)=>g.id===row.group_id)?.account_nature==="Income").reduce((sum,row)=>sum+(row.side==="Cr"?row.balance:-row.balance),0)
      - periodRows.filter((row)=>data.groups.find((g)=>g.id===row.group_id)?.account_nature==="Expense").reduce((sum,row)=>sum+(row.side==="Dr"?row.balance:-row.balance),0);
    return <>
      {renderHeader("Balance Sheet", "Assets, liabilities and equity as at the selected date.", <button className="btn-secondary" onClick={()=>window.print()}>Export / Print</button>)}
      <section className="accounting-panel financial-statement">
        <div className="statement-title"><h2>{currentCompany?.company_name||"Company"}</h2><p>As on {toDate}</p></div>
        <div className="balance-sheet-grid">
          <div><h3>Liabilities & Equity</h3>{sections.filter((s)=>s.nature!=="Asset").map((section)=><div className="statement-section" key={section.nature}><h4>{section.nature==="Equity"?"Capital & Reserves":"Liabilities"}</h4>{section.rows.map((row)=><div className="statement-row" key={row.id}><span>{row.ledger_name}</span><b>{money(row.balance)}</b></div>)}</div>)}<div className="statement-row"><span>Current Year Profit / (Loss)</span><b>{money(currentProfit)}</b></div><div className="statement-total"><b>Total Liabilities & Equity</b><b>{money(liabilities+equity+currentProfit)}</b></div></div>
          <div><h3>Assets</h3>{sections.filter((s)=>s.nature==="Asset").map((section)=><div className="statement-section" key={section.nature}><h4>Assets</h4>{section.rows.map((row)=><div className="statement-row" key={row.id}><span>{row.ledger_name}</span><b>{money(row.balance)}</b></div>)}</div>)}<div className="statement-total"><b>Total Assets</b><b>{money(assets)}</b></div></div>
        </div>
        <div className={"report-balance-note "+(Math.abs(assets-(liabilities+equity+currentProfit))<0.01?"balanced":"unbalanced")}>{Math.abs(assets-(liabilities+equity+currentProfit))<0.01?"✓ Balance Sheet balances":"⚠ Balance Sheet difference: "+money(Math.abs(assets-(liabilities+equity+currentProfit)))}</div>
      </section>
    </>;
  };

  if (!currentCompanyId) return <div className="accounting-workspace"><div className="accounting-empty-state"><h2>Select a company</h2><p>Please select a company from the left sidebar to access its accounting records.</p></div></div>;

  return (
    <div className="accounting-workspace">
      {error && <div className="accounting-alert error">{error}<button onClick={()=>setError("")}>×</button></div>}
      {notice && <div className="accounting-alert success">{notice}<button onClick={()=>setNotice("")}>×</button></div>}
      {loading ? <div className="accounting-loading">Loading accounting workspace…</div> :
        page==="Chart of Accounts" ? renderChart() :
        page==="Journal Voucher" ? renderJournal() :
        page==="Ledger" ? renderLedger() :
        page==="Trial Balance" ? renderTrialBalance() :
        page==="Profit & Loss" ? renderProfitLoss() :
        page==="Balance Sheet" ? renderBalanceSheet() : renderDashboard()}
    </div>
  );
}

export default AccountingWorkspace;
