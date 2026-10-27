import React, { useCallback, useEffect, useMemo, useState } from "react";
import "../../css/hr/LeaveManagement.css";
import { useCompany } from "../../context/CompanyContext";
import { supabase } from "../../supabase/supabaseClient";
import {
  getLeaveRecords,
  createLeaveRecord,
  updateLeaveRecord,
} from "../../services/hr/leaveService";

const emptyForm = {
  employee_id: "",
  leave_type: "",
  from_date: "",
  to_date: "",
  session_type: "Full Day",
  reason: "",
  remarks: "",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
};

const buttonStyle = {
  padding: "9px 13px",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  background: "#fff",
  cursor: "pointer",
};

function calculateDays(from, to, session) {
  if (!from || !to || to < from) return 0;

  if (session === "First Half" || session === "Second Half") {
    return 0.5;
  }

  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);

  return Math.round((end - start) / 86400000) + 1;
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN");
}

export default function LeaveManagement() {
  const { currentCompanyId } = useCompany();

  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    if (!currentCompanyId) {
      setRecords([]);
      setEmployees([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [leaveRows, employeeResult] = await Promise.all([
        getLeaveRecords(currentCompanyId),
        supabase
          .from("employees")
          .select("id, employee_code, employee_name, department_id, employee_status")
          .eq("company_id", currentCompanyId)
          .eq("is_active", true)
          .order("employee_name"),
      ]);

      if (employeeResult.error) throw employeeResult.error;

      setRecords(
        (leaveRows || []).filter((row) => row.is_active !== false)
      );
      setEmployees(employeeResult.data || []);
    } catch (err) {
      setError(err.message || "Unable to load leave records.");
    } finally {
      setLoading(false);
    }
  }, [currentCompanyId]);

  useEffect(() => {
    setRecords([]);
    setEmployees([]);
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setMessage("");
    loadData();
  }, [loadData]);

  const employeeMap = useMemo(
    () => new Map(employees.map((employee) => [employee.id, employee])),
    [employees]
  );

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...records]
      .filter((record) => {
        const employee = employeeMap.get(record.employee_id);
        const name = employee?.employee_name || "";
        const code = employee?.employee_code || "";

        const matchesSearch =
          !query ||
          name.toLowerCase().includes(query) ||
          code.toLowerCase().includes(query) ||
          String(record.leave_type || "").toLowerCase().includes(query);

        const matchesStatus =
          statusFilter === "All" ||
          (record.approval_status || "Pending") === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) =>
        String(b.applied_on || "").localeCompare(String(a.applied_on || ""))
      );
  }, [records, search, statusFilter, employeeMap]);

  const pendingCount = records.filter(
    (row) => (row.approval_status || "Pending") === "Pending"
  ).length;

  const approvedCount = records.filter(
    (row) => row.approval_status === "Approved"
  ).length;

  function startNew() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setMessage("");
    setShowForm(true);
  }

  function startEdit(record) {
    if ((record.approval_status || "Pending") !== "Pending") {
      setError("Only pending leave applications can be edited.");
      return;
    }

    setEditingId(record.id);
    setForm({
      employee_id: record.employee_id || "",
      leave_type: record.leave_type || "",
      from_date: record.from_date || "",
      to_date: record.to_date || "",
      session_type: record.session_type || "Full Day",
      reason: record.reason || "",
      remarks: record.remarks || "",
    });
    setError("");
    setMessage("");
    setShowForm(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!currentCompanyId) {
      setError("Please select a company.");
      return;
    }

    if (!form.employee_id || !employeeMap.has(form.employee_id)) {
      setError("Select a valid employee from the selected company.");
      return;
    }

    if (!form.leave_type.trim()) {
      setError("Leave type is required.");
      return;
    }

    if (!form.from_date || !form.to_date || form.to_date < form.from_date) {
      setError("Enter valid leave dates.");
      return;
    }

    const totalDays = calculateDays(
      form.from_date,
      form.to_date,
      form.session_type
    );

    if (
  form.session_type !== "Full Day" &&
  form.from_date !== form.to_date
) {
      setError("Half-day leave must be for a single date.");
      return;
    }

    const payload = {
      employee_id: form.employee_id,
      leave_type: form.leave_type.trim(),
      from_date: form.from_date,
      to_date: form.to_date,
      total_days: totalDays,
      session_type: form.session_type,
      reason: form.reason.trim() || null,
      remarks: form.remarks.trim() || null,
    };

    setSaving(true);

    try {
      if (editingId) {
        await updateLeaveRecord(editingId, payload, currentCompanyId);
        setMessage("Leave application updated.");
      } else {
        await createLeaveRecord(
          {
            ...payload,
            applied_on: new Date().toISOString(),
            approval_status: "Pending",
            is_active: true,
          },
          currentCompanyId
        );
        setMessage("Leave application saved.");
      }

      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to save leave application.");
    } finally {
      setSaving(false);
    }
  }

  async function decideLeave(record, status) {
    if (!currentCompanyId) return;

    if ((record.approval_status || "Pending") !== "Pending") {
      setError("Only pending applications can be approved or rejected.");
      return;
    }

    let rejectionReason = null;

    if (status === "Rejected") {
      rejectionReason = window.prompt("Enter the rejection reason:");

      if (rejectionReason === null) return;

      if (!rejectionReason.trim()) {
        setError("A rejection reason is required.");
        return;
      }
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      const { data, error: updateError } = await supabase
        .from("leave_master")
        .update({
          approval_status: status,
          approved_by: null,
          approved_on: new Date().toISOString(),
          rejection_reason: rejectionReason,
          updated_at: new Date().toISOString(),
        })
        .eq("id", record.id)
        .eq("company_id", currentCompanyId)
        .select()
        .single();

      if (updateError) throw updateError;

      setMessage(`Leave application ${status.toLowerCase()}.`);
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to update leave decision.");
    } finally {
      setSaving(false);
    }
  }

  async function deactivateLeave(record) {
    if (!window.confirm("Deactivate this leave record?")) return;

    setSaving(true);
    setError("");

    try {
      const { error: updateError } = await supabase
        .from("leave_master")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", record.id)
        .eq("company_id", currentCompanyId);

      if (updateError) throw updateError;

      setMessage("Leave record deactivated.");
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to deactivate leave record.");
    } finally {
      setSaving(false);
    }
  }

  if (!currentCompanyId) {
    return <div className="leave-page">Please select a company first.</div>;
  }

  return (
    <div className="leave-page">
      <div className="leave-page-header">
        <div>
          <h1>Leave Management</h1>
          <p>Company leave applications and approval records.</p>
        </div>
        <button className="leave-primary-button" onClick={startNew}>
          + Apply Leave
        </button>
      </div>

      {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}
      {message && <p role="status">{message}</p>}
      {loading && <p>Loading leave records...</p>}

      <div className="leave-summary-grid">
        <div className="leave-summary-card">
          <span className="leave-summary-label">Total Applications</span>
          <strong>{records.length}</strong>
        </div>
        <div className="leave-summary-card pending-card">
          <span className="leave-summary-label">Pending</span>
          <strong>{pendingCount}</strong>
        </div>
        <div className="leave-summary-card approved-card">
          <span className="leave-summary-label">Approved</span>
          <strong>{approvedCount}</strong>
        </div>
      </div>

      {showForm && (
        <section className="leave-panel">
          <h2>{editingId ? "Edit Leave Application" : "New Leave Application"}</h2>

          <form onSubmit={handleSubmit}>
            <div className="leave-form-grid">
              <label>
                Employee *
                <select
                  style={inputStyle}
                  required
                  value={form.employee_id}
                  onChange={(e) =>
                    setForm({ ...form, employee_id: e.target.value })
                  }
                >
                  <option value="">Select employee</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.employee_code} — {employee.employee_name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
  Leave Type *
  <select
    style={inputStyle}
    required
    value={form.leave_type}
    onChange={(e) =>
      setForm({ ...form, leave_type: e.target.value })
    }
  >
    <option value="">Select leave type</option>
    {[
      "Casual",
      "Sick",
      "Earned",
      "Maternity",
      "Paternity",
      "Loss of Pay",
      "Comp Off",
      "Work From Home",
      "On Duty",
      "Other",
    ].map((type) => (
      <option key={type} value={type}>
        {type}
      </option>
    ))}
  </select>
</label>

              <label>
                Session
                <select
                  style={inputStyle}
                  value={form.session_type}
                  onChange={(e) =>
                    setForm({ ...form, session_type: e.target.value })
                  }
                >
                  <option>Full Day</option>
<option>First Half</option>
<option>Second Half</option>
                </select>
              </label>

              <label>
                From Date *
                <input
                  style={inputStyle}
                  type="date"
                  required
                  value={form.from_date}
                  onChange={(e) =>
                    setForm({ ...form, from_date: e.target.value })
                  }
                />
              </label>

              <label>
                To Date *
                <input
                  style={inputStyle}
                  type="date"
                  required
                  min={form.from_date || undefined}
                  value={form.to_date}
                  onChange={(e) =>
                    setForm({ ...form, to_date: e.target.value })
                  }
                />
              </label>

              <label>
                Reason
                <input
                  style={inputStyle}
                  value={form.reason}
                  onChange={(e) =>
                    setForm({ ...form, reason: e.target.value })
                  }
                />
              </label>

              <label style={{ gridColumn: "1 / -1" }}>
                Remarks
                <textarea
                  style={inputStyle}
                  value={form.remarks}
                  onChange={(e) =>
                    setForm({ ...form, remarks: e.target.value })
                  }
                />
              </label>
            </div>

            <p>
              Calculated days:{" "}
              {calculateDays(form.from_date, form.to_date, form.session_type)}
            </p>

            <button className="leave-primary-button" disabled={saving}>
              {saving ? "Saving..." : "Save Application"}
            </button>
            <button
              type="button"
              style={{ ...buttonStyle, marginLeft: 8 }}
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </form>
        </section>
      )}

      <section className="leave-panel">
        <h2>Leave Applications</h2>

        <div className="leave-filter-bar">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee, code or leave type"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>All</option>
            <option>Pending</option>
            <option>Approved</option>
            <option>Rejected</option>
          </select>
          <button style={buttonStyle} onClick={loadData} disabled={loading}>
            Refresh
          </button>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Employee", "Leave Type", "From", "To", "Days", "Status", "Actions"].map((title) => (
                  <th key={title} style={{ padding: 10, textAlign: "left", borderBottom: "1px solid #ddd" }}>
                    {title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => {
                const employee = employeeMap.get(record.employee_id);
                const status = record.approval_status || "Pending";

                return (
                  <tr key={record.id}>
                    <td style={{ padding: 10 }}>
                      {employee?.employee_name || "Employee unavailable"}
                      <small style={{ display: "block" }}>
                        {employee?.employee_code || record.employee_id}
                      </small>
                    </td>
                    <td style={{ padding: 10 }}>{record.leave_type}</td>
                    <td style={{ padding: 10 }}>{formatDate(record.from_date)}</td>
                    <td style={{ padding: 10 }}>{formatDate(record.to_date)}</td>
                    <td style={{ padding: 10 }}>{record.total_days}</td>
                    <td style={{ padding: 10 }}>{status}</td>
                    <td style={{ padding: 10 }}>
                      {status === "Pending" && (
                        <>
                          <button style={buttonStyle} disabled={saving} onClick={() => startEdit(record)}>Edit</button>{" "}
                          <button style={buttonStyle} disabled={saving} onClick={() => decideLeave(record, "Approved")}>Approve</button>{" "}
                          <button style={buttonStyle} disabled={saving} onClick={() => decideLeave(record, "Rejected")}>Reject</button>
                        </>
                      )}
                      <button style={buttonStyle} disabled={saving} onClick={() => deactivateLeave(record)}>
                        Deactivate
                      </button>
                    </td>
                  </tr>
                );
              })}

              {!loading && filteredRecords.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ padding: 20, textAlign: "center" }}>
                    No leave applications found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
      }
