import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FiBriefcase, FiSearch, FiUserCheck, FiPlus, FiTrash2, FiCheckCircle } from "react-icons/fi";
import { useCompany } from "../../context/CompanyContext";
import { assignCaToCompany, getCompanyCaAssignments, revokeCaAssignment, updateCaAccess } from "../../services/userAccessService";
import "../../css/settings/CAAssignment.css";

function CAAssignment() {
  const { companies, currentCompany, currentCompanyId, loading: companyLoading } = useCompany();
  const [selectedCompanyId, setSelectedCompanyId] = useState(currentCompanyId || "");
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [form, setForm] = useState({ caName: "", email: "", accessLevel: "read_only" });
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { if (currentCompanyId && !selectedCompanyId) setSelectedCompanyId(currentCompanyId); }, [currentCompanyId, selectedCompanyId]);

  const selectedCompany = companies.find((company) => company.id === selectedCompanyId);
  const loadAssignments = useCallback(async () => {
    if (!selectedCompanyId) { setAssignments([]); return; }
    try {
      const rows = await getCompanyCaAssignments(selectedCompanyId);
      setAssignments(rows.filter((row) => row.status === "Active"));
      setSelectedAssignment((previous) => rows.find((row) => row.id === previous?.id) || rows.find((row) => row.status === "Active") || null);
    } catch (e) { setError(e.message); }
  }, [selectedCompanyId]);

  useEffect(() => { loadAssignments(); }, [loadAssignments]);

  const filteredCompanies = useMemo(() => companies.filter((company) => (company.company_name || "").toLowerCase().includes(search.toLowerCase())), [companies, search]);

  const handleAssign = async (event) => {
    event.preventDefault();
    if (!selectedCompanyId) return;
    setSaving(true); setError(""); setMessage("");
    try {
      const result = await assignCaToCompany({
        companyId: selectedCompanyId,
        fullName: form.caName.trim(),
        email: form.email.trim().toLowerCase(),
        accessLevel: form.accessLevel,
      });
      setMessage(result.message || "CA assigned successfully.");
      setForm({ caName: "", email: "", accessLevel: "read_only" });
      await loadAssignments();
    } catch (e) { setError(e.message || "Unable to assign CA."); }
    finally { setSaving(false); }
  };

  const changeAccess = async (accessLevel) => {
    if (!selectedAssignment) return;
    setSaving(true); setError(""); setMessage("");
    try {
      await updateCaAccess(selectedAssignment.id, selectedCompanyId, accessLevel);
      setMessage("CA access updated successfully.");
      await loadAssignments();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const removeAssignment = async () => {
    if (!selectedAssignment || !window.confirm("Remove this CA's access to the selected company?")) return;
    setSaving(true); setError(""); setMessage("");
    try {
      await revokeCaAssignment(selectedAssignment.id, selectedCompanyId);
      setSelectedAssignment(null);
      setMessage("CA assignment removed.");
      await loadAssignments();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return <div className="ca-page">
    <div className="ca-heading"><div><span className="ca-eyebrow">ADMINISTRATION</span><h1>CA Assignment</h1><p>Assign Chartered Accountants to companies and control their access.</p></div><div className="ca-company-count"><FiBriefcase /> {companies.length} companies</div></div>
    {message && <div className="ca-alert success"><FiCheckCircle />{message}</div>}{error && <div className="ca-alert error">{error}</div>}
    {!selectedCompanyId && !companyLoading ? <div className="ca-empty">No company is available. Select or create a company first.</div> : <div className="ca-layout">
      <section className="ca-panel ca-companies">
        <div className="ca-panel-heading"><div><h2>Companies ({companies.length})</h2><p>Select a company to manage its CA assignment.</p></div></div>
        <div className="ca-search"><FiSearch /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search company..." /></div>
        <div className="ca-company-list">{filteredCompanies.map((company) => <button key={company.id} className={`ca-company-row ${selectedCompanyId === company.id ? "selected" : ""}`} onClick={() => { setSelectedCompanyId(company.id); setSelectedAssignment(null); setMessage(""); setError(""); }}><span className="ca-company-icon"><FiBriefcase /></span><span className="ca-company-name">{company.company_name || "Unnamed Company"}</span><span className="ca-company-chevron">›</span></button>)}</div>
      </section>
      <div className="ca-right">
        <section className="ca-panel ca-selected-company"><div className="ca-selected-title"><span className="ca-company-icon large"><FiBriefcase /></span><div><h2>{selectedCompany?.company_name || "Selected company"}</h2><p>{selectedCompany?.gstin || selectedCompany?.gst_number || "Company CA access settings"}</p></div></div>
          <div className="ca-tabs"><span className="active">CA Assignment</span><span>Company Details</span></div>
          {selectedAssignment ? <div className="ca-assigned-card"><div className="ca-avatar"><FiUserCheck /></div><div className="ca-assigned-info"><strong>{selectedAssignment.ca_name}</strong><span>{selectedAssignment.ca_email}</span></div><span className="ca-assigned-badge">Assigned</span></div> : <div className="ca-no-assignment">No Chartered Accountant is currently assigned to this company.</div>}
          {selectedAssignment && <div className="ca-access-block"><h3>Access Permission</h3><div className="ca-access-options">
            <button className={selectedAssignment.access_level === "read_write" ? "chosen" : ""} onClick={() => changeAccess("read_write")} disabled={saving}><strong>Read & Write Access</strong><span>View, create, edit and post accounting entries, manage masters and reports.</span></button>
            <button className={selectedAssignment.access_level === "read_only" ? "chosen" : ""} onClick={() => changeAccess("read_only")} disabled={saving}><strong>Read Only Access</strong><span>View company books, reports and records. No create, edit or post access.</span></button>
          </div><div className="ca-actions"><button className="ca-danger" onClick={removeAssignment} disabled={saving}><FiTrash2 /> Remove CA</button></div></div>}
        </section>
        <form className="ca-panel ca-add-form" onSubmit={handleAssign}><div className="ca-panel-heading"><div><h2><FiPlus /> {selectedAssignment ? "Assign Another CA" : "Assign Chartered Accountant"}</h2><p>Invite a CA or link an existing EazyTaxation account.</p></div></div>
          <div className="ca-form-grid"><label>CA Full Name *<input required value={form.caName} onChange={(e) => setForm({ ...form, caName: e.target.value })} placeholder="Enter CA name" /></label><label>CA Email Address *<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="ca@example.com" /></label></div>
          <div className="ca-new-access"><strong>Access Permission</strong><label><input type="radio" name="ca-access" checked={form.accessLevel === "read_write"} onChange={() => setForm({ ...form, accessLevel: "read_write" })} /> Read & Write</label><label><input type="radio" name="ca-access" checked={form.accessLevel === "read_only"} onChange={() => setForm({ ...form, accessLevel: "read_only" })} /> Read Only</label></div>
          <div className="ca-form-actions"><button className="ca-primary" disabled={saving || !selectedCompanyId}>{saving ? "Saving..." : "Assign CA & Send Invitation"}</button></div>
        </form>
      </div>
    </div>}
  </div>;
}
export default CAAssignment;
