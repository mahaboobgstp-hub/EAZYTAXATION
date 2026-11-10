import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FiUserPlus, FiUsers, FiSearch, FiShield, FiCheckCircle } from "react-icons/fi";
import { useCompany } from "../../context/CompanyContext";
import {
  ACCESS_MODULES, defaultPermissions, getCompanyUsers,
  inviteCompanyUser, updateCompanyUser
} from "../../services/userAccessService";
import "../../css/settings/UsersAccess.css";

const emptyForm = () => ({
  fullName: "", email: "", role: "Accounts", status: "Active",
  permissions: JSON.parse(JSON.stringify(defaultPermissions)),
});

function UsersAccess() {
  const { currentCompany, currentCompanyId, loading: companyLoading } = useCompany();
  const [users, setUsers] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadUsers = useCallback(async () => {
    if (!currentCompanyId) { setUsers([]); setLoading(false); return; }
    try {
      setLoading(true);
      const rows = await getCompanyUsers(currentCompanyId);
      setUsers(rows);
      if (selectedId) {
        const selected = rows.find((row) => row.id === selectedId);
        if (selected) setForm({ ...emptyForm(), ...selected, fullName: selected.full_name, permissions: { ...defaultPermissions, ...(selected.permissions || {}) } });
      }
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [currentCompanyId, selectedId]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const filteredUsers = useMemo(() => users.filter((user) =>
    [user.full_name, user.email, user.role].join(" ").toLowerCase().includes(search.toLowerCase())
  ), [users, search]);

  const selectUser = (user) => {
    setSelectedId(user.id);
    setForm({
      fullName: user.full_name || "",
      email: user.email || "",
      role: user.role || "Accounts",
      status: user.status || "Active",
      permissions: { ...defaultPermissions, ...(user.permissions || {}) },
    });
    setMessage("");
    setError("");
  };

  const changePermission = (moduleKey, field, checked) => {
    setForm((previous) => ({
      ...previous,
      permissions: {
        ...previous.permissions,
        [moduleKey]: {
          ...(previous.permissions[moduleKey] || {}),
          [field]: checked,
          ...(field === "write" && checked ? { read: true } : {}),
          ...(field === "read" && !checked ? { write: false } : {}),
        },
      },
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!currentCompanyId) return;
    setSaving(true); setError(""); setMessage("");
    try {
      if (selectedId) {
        await updateCompanyUser(selectedId, currentCompanyId, {
          full_name: form.fullName.trim(), role: form.role, status: form.status,
          permissions: form.permissions,
        });
        setMessage("User access updated successfully.");
      } else {
        const result = await inviteCompanyUser({
          companyId: currentCompanyId,
          fullName: form.fullName.trim(),
          email: form.email.trim().toLowerCase(),
          role: form.role,
          permissions: form.permissions,
        });
        setMessage(result.message || "Invitation sent successfully.");
      }
      setSelectedId("");
      setForm(emptyForm());
      await loadUsers();
    } catch (e) { setError(e.message || "Unable to save user."); }
    finally { setSaving(false); }
  };

  return (
    <div className="ua-page">
      <div className="ua-heading">
        <div><span className="ua-eyebrow">ADMINISTRATION</span><h1>Users & Access</h1><p>Create and manage users, roles and module-wise permissions.</p></div>
        <div className="ua-company-chip">{currentCompany?.company_name || (companyLoading ? "Loading company..." : "Select a company")}</div>
      </div>
      {message && <div className="ua-alert success"><FiCheckCircle />{message}</div>}
      {error && <div className="ua-alert error">{error}</div>}
      {!currentCompanyId ? <div className="ua-empty">Select a company from the sidebar to manage its users.</div> : (
        <div className="ua-layout">
          <section className="ua-panel ua-user-list">
            <div className="ua-panel-title"><div><h2><FiUsers /> Users ({users.length})</h2><span>People with access to this company</span></div><button className="ua-primary" onClick={() => { setSelectedId(""); setForm(emptyForm()); setError(""); }}><FiUserPlus /> Add User</button></div>
            <div className="ua-search"><FiSearch /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..." /></div>
            {loading ? <div className="ua-empty">Loading users...</div> : filteredUsers.length === 0 ? <div className="ua-empty">No users found. Add your first user.</div> : (
              <div className="ua-users-table">
                <div className="ua-table-head"><span>Name</span><span>Email</span><span>Role</span><span>Status</span></div>
                {filteredUsers.map((user) => <button type="button" key={user.id} className={`ua-user-row ${selectedId === user.id ? "selected" : ""}`} onClick={() => selectUser(user)}>
                  <strong>{user.full_name}</strong><span>{user.email}</span><span className="ua-role">{user.role}</span><span className={`ua-status ${user.status === "Active" ? "active" : "inactive"}`}>{user.status}</span>
                </button>)}
              </div>
            )}
          </section>
          <form className="ua-panel ua-editor" onSubmit={handleSave}>
            <div className="ua-panel-title"><div><h2><FiUserPlus /> {selectedId ? "Edit User Access" : "Add User"}</h2><span>Set identity, role and permissions</span></div>{selectedId && <button type="button" className="ua-text-button" onClick={() => { setSelectedId(""); setForm(emptyForm()); }}>New user</button>}</div>
            <div className="ua-form-grid">
              <label>Full Name *<input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Enter full name" /></label>
              <label>Email Address *<input required type="email" disabled={Boolean(selectedId)} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@company.com" /></label>
              <label>Role *<select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option>Accounts</option><option>Billing</option><option>Inventory</option><option>HR & Payroll</option><option>GST</option><option>Custom</option></select></label>
              <label>Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option>Active</option><option>Inactive</option></select></label>
            </div>
            <div className="ua-permission-heading"><div><h3><FiShield /> Permissions</h3><p>Set module-wise Read / Write access for this user.</p></div></div>
            <div className="ua-permission-table">
              <div className="ua-permission-head"><span>Module</span><span>Read (View)</span><span>Write (Create / Edit / Delete)</span></div>
              {ACCESS_MODULES.map((module) => <div className="ua-permission-row" key={module.key}>
                <strong>{module.label}</strong>
                <label><input type="checkbox" checked={Boolean(form.permissions[module.key]?.read)} onChange={(e) => changePermission(module.key, "read", e.target.checked)} aria-label={module.label + " read"} /></label>
                <label><input type="checkbox" checked={Boolean(form.permissions[module.key]?.write)} onChange={(e) => changePermission(module.key, "write", e.target.checked)} aria-label={module.label + " write"} /></label>
              </div>)}
            </div>
            <div className="ua-form-actions"><button type="button" className="ua-secondary" onClick={() => { setSelectedId(""); setForm(emptyForm()); }}>Cancel</button><button className="ua-primary" disabled={saving}>{saving ? "Saving..." : selectedId ? "Update Access" : "Create User"}</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
export default UsersAccess;
