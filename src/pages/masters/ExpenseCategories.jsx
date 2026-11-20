import React, { useEffect, useMemo, useState } from "react";
import { useCompany } from "../../context/CompanyContext";
import {
  createExpenseCategory,
  getExpenseCategorySetup,
  updateExpenseCategory
} from "../../services/expenseCategoryService";
import "../../css/masters/ExpenseCategories.css";

const TYPE_OPTIONS = [
  { value: "capital_expenditure", label: "Capital Expenditure", nature: "Asset" },
  { value: "manufacturing_direct", label: "Manufacturing – Direct Cost", nature: "Expense" },
  { value: "manufacturing_indirect", label: "Manufacturing – Indirect Cost", nature: "Expense" },
  { value: "operating_expense", label: "Operating Expense", nature: "Expense" }
];
const emptyForm = () => ({
  category_name: "", description: "", expenditure_type: "operating_expense",
  group_id: "", subgroup_id: "", ledger_id: "", is_active: true
});
const typeLabel = value => TYPE_OPTIONS.find(item => item.value === value)?.label || "General Expense";

export default function ExpenseCategories() {
  const { currentCompany, currentCompanyId } = useCompany();
  const accountingEnabled = Boolean(currentCompany?.accounting_enabled);
  const [categories, setCategories] = useState([]);
  const [groups, setGroups] = useState([]);
  const [ledgers, setLedgers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    if (!currentCompanyId) { setCategories([]); setGroups([]); setLedgers([]); setLoading(false); return; }
    setLoading(true);
    try {
      const result = await getExpenseCategorySetup(currentCompanyId);
      setCategories(result.categories);
      setGroups(result.groups);
      setLedgers(result.ledgers);
      setError("");
    } catch (e) { setError(e.message || "Unable to load expense categories."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [currentCompanyId]);

  const selectedType = TYPE_OPTIONS.find(item => item.value === form.expenditure_type) || TYPE_OPTIONS[3];
  const mainGroups = useMemo(() => groups.filter(group =>
    !group.parent_group_id && group.account_nature === selectedType.nature
  ), [groups, selectedType.nature]);
  const subGroups = useMemo(() => groups.filter(group =>
    group.parent_group_id === form.group_id
  ), [groups, form.group_id]);
  const selectedLedgerGroup = form.subgroup_id || form.group_id;
  const availableLedgers = useMemo(() => ledgers.filter(ledger =>
    ledger.group_id === selectedLedgerGroup
  ), [ledgers, selectedLedgerGroup]);

  const visibleCategories = useMemo(() => {
    const term = search.trim().toLowerCase();
    return categories.filter(category => !term || [
      category.category_name, category.description, typeLabel(category.expenditure_type)
    ].some(value => String(value || "").toLowerCase().includes(term)));
  }, [categories, search]);

  const startCreate = (source = null) => {
    setEditingId(null);
    setForm({ ...emptyForm(), category_name: source?.category_name || "", description: source?.description || "" });
    setError(""); setNotice(""); setShowForm(true);
  };

  const startEdit = category => {
    if (!category.company_id) return;
    setEditingId(category.id);
    setForm({
      category_name: category.category_name || "",
      description: category.description || "",
      expenditure_type: category.expenditure_type || "operating_expense",
      group_id: category.group_id || "",
      subgroup_id: category.subgroup_id || "",
      ledger_id: category.ledger_id || "",
      is_active: category.is_active !== false
    });
    setError(""); setNotice(""); setShowForm(true);
  };

  const updateField = (key, value) => setForm(previous => {
    if (key === "expenditure_type") return { ...previous, expenditure_type: value, group_id: "", subgroup_id: "", ledger_id: "" };
    if (key === "group_id") return { ...previous, group_id: value, subgroup_id: "", ledger_id: "" };
    if (key === "subgroup_id") return { ...previous, subgroup_id: value, ledger_id: "" };
    return { ...previous, [key]: value };
  });

  const handleSubmit = async event => {
    event.preventDefault();
    setSaving(true); setError(""); setNotice("");
    try {
      const payload = accountingEnabled ? form : {
        category_name: form.category_name, description: form.description, is_active: form.is_active
      };
      if (editingId) await updateExpenseCategory(currentCompanyId, editingId, payload);
      else await createExpenseCategory(currentCompanyId, payload);
      setNotice(editingId ? "Expense category updated." : "Expense category created.");
      setShowForm(false); setForm(emptyForm()); setEditingId(null);
      await load();
    } catch (e) { setError(e.message || "Unable to save expense category."); }
    finally { setSaving(false); }
  };

  const toggleActive = async category => {
    if (!category.company_id) return;
    try {
      await updateExpenseCategory(currentCompanyId, category.id, {
        category_name: category.category_name, description: category.description,
        expenditure_type: category.expenditure_type, group_id: category.group_id,
        subgroup_id: category.subgroup_id, ledger_id: category.ledger_id,
        is_active: category.is_active === false
      });
      await load();
    } catch (e) { setError(e.message || "Unable to update category status."); }
  };

  if (!currentCompanyId) return <main className="expense-categories-page"><h1>Expense Categories</h1><p>Select a company to continue.</p></main>;

  return (
    <main className="expense-categories-page">
      <header className="ec-page-heading">
        <div><span className="ec-eyebrow">Masters / Expenses</span><h1>Expense Categories</h1>
          <p>{accountingEnabled ? "Manage categories with accounting groups, expenditure types and ledger links." : "Create and manage simple expense categories for everyday expense recording."}</p>
        </div>
        <button className="ec-primary" type="button" onClick={() => startCreate()}>＋ Add Category</button>
      </header>

      <section className="ec-mode-card">
        <div className="ec-mode-icon">{accountingEnabled ? "▦" : "✓"}</div>
        <div><b>{accountingEnabled ? "Chart of Accounts mode" : "Simple category mode"}</b>
          <p>{accountingEnabled
            ? "The category must be classified and linked to a ledger in this company's Chart of Accounts."
            : "No groups, subgroups or ledger mapping are required. Create a name and use it immediately."}</p>
        </div>
      </section>

      {notice && <div className="ec-notice">{notice}</div>}
      {error && <div className="ec-error">{error}</div>}

      {showForm && <section className="ec-form-card">
        <div className="ec-form-heading"><div><h2>{editingId ? "Edit Expense Category" : "Create Expense Category"}</h2><p>{accountingEnabled ? "Complete the accounting classification for this company." : "Enter a category name to start using it."}</p></div>
          <button type="button" className="ec-close" onClick={() => { setShowForm(false); setError(""); }}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <label>Category Name <span>*</span><input value={form.category_name} onChange={e => updateField("category_name", e.target.value)} placeholder="e.g. Office Maintenance" required maxLength={100}/></label>
          {accountingEnabled && <>
            <label>Type of Expenditure <span>*</span><select value={form.expenditure_type} onChange={e => updateField("expenditure_type", e.target.value)}>
              {TYPE_OPTIONS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select></label>
            <div className="ec-field-note">This category will be classified under {selectedType.nature === "Asset" ? "Assets" : "Expenses"} in the Chart of Accounts.</div>
            <label>Main Group <span>*</span><select value={form.group_id} onChange={e => updateField("group_id", e.target.value)} required>
              <option value="">Select main group</option>{mainGroups.map(group => <option key={group.id} value={group.id}>{group.group_name}</option>)}
            </select></label>
            <label>Subgroup <small>(Optional)</small><select value={form.subgroup_id} onChange={e => updateField("subgroup_id", e.target.value)} disabled={!form.group_id}>
              <option value="">No subgroup / select later</option>{subGroups.map(group => <option key={group.id} value={group.id}>{group.group_name}</option>)}
            </select></label>
            <label>Linked Ledger <span>*</span><select value={form.ledger_id} onChange={e => updateField("ledger_id", e.target.value)} required disabled={!selectedLedgerGroup}>
              <option value="">Select ledger</option>{availableLedgers.map(ledger => <option key={ledger.id} value={ledger.id}>{ledger.ledger_name}</option>)}
            </select></label>
            {!groups.length && <div className="ec-warning">No active account groups were found for this company. Set up the Chart of Accounts before creating an advanced expense category.</div>}
            {selectedLedgerGroup && !availableLedgers.length && <div className="ec-warning">No active ledger is linked to this group. Create the ledger in Chart of Accounts, then return here.</div>}
          </>}
          <label>Description <small>(Optional)</small><textarea rows="3" value={form.description} onChange={e => updateField("description", e.target.value)} placeholder="Add a short description"/></label>
          <div className="ec-form-actions"><button type="button" className="ec-secondary" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="ec-primary" disabled={saving}>{saving ? "Saving…" : editingId ? "Update Category" : "Save Category"}</button></div>
        </form>
      </section>}

      <section className="ec-list-card">
        <div className="ec-list-heading"><div><h2>Available Categories</h2><span>{visibleCategories.length} categories</span></div>
          <input className="ec-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search categories…"/>
        </div>
        {loading ? <div className="ec-empty">Loading categories…</div> : !visibleCategories.length ? <div className="ec-empty">No categories found. Add your first expense category.</div> :
          <div className="ec-category-list">{visibleCategories.map(category => {
            const isShared = !category.company_id;
            const group = groups.find(item => item.id === category.group_id);
            const subgroup = groups.find(item => item.id === category.subgroup_id);
            const ledger = ledgers.find(item => item.id === category.ledger_id);
            const rowClass = "ec-category-row" + (category.is_active === false ? " is-inactive" : "");
            const classification = isShared ? "Shared default category · configure for this company" :
              typeLabel(category.expenditure_type) + " · " + (group?.group_name || "Group not set") + (subgroup ? " / " + subgroup.group_name : "");
            return <article className={rowClass} key={category.id}>
              <div className="ec-category-symbol">{accountingEnabled ? (category.expenditure_type === "capital_expenditure" ? "◇" : "▤") : "•"}</div>
              <div className="ec-category-main"><b>{category.category_name}</b>
                {accountingEnabled ? <small>{classification}</small> : <small>{category.description || (isShared ? "Default category" : "Company category")}</small>}
                {accountingEnabled && !isShared && <small className="ec-ledger-name">Ledger: {ledger?.ledger_name || "Not mapped"}</small>}
              </div>
              {isShared ? (accountingEnabled ? <button type="button" className="ec-outline-small" onClick={() => startCreate(category)}>Configure</button> : <span className="ec-default-tag">Default</span>) :
                <div className="ec-row-actions"><button type="button" className="ec-outline-small" onClick={() => startEdit(category)}>Edit</button><button type="button" className="ec-text-action" onClick={() => toggleActive(category)}>{category.is_active === false ? "Activate" : "Deactivate"}</button></div>}
            </article>;
          })}</div>}
      </section>
    </main>
  );
}
