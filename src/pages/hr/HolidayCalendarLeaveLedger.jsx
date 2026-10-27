import React, { useCallback, useEffect, useState } from "react";
import {
  getHolidays,
  createHoliday,
  updateHoliday,
  deactivateHoliday,
} from "../../services/hr/holidayService";
import { getLeaveRecords } from "../../services/hr/leaveService";
import { useCompany } from "../../context/CompanyContext";
import "../../css/hr/HolidayCalendarLeaveLedger.css";

const emptyForm = {
  holiday_name: "",
  holiday_date: "",
  holiday_type: "National",
  is_paid: true,
  is_optional: false,
  description: "",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: 10,
  border: "1px solid #d1d5db",
  borderRadius: 6,
};

const buttonStyle = {
  padding: "8px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  background: "#fff",
  cursor: "pointer",
};

function formatDate(value) {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN");
}

export default function HolidayCalendarLeaveLedger() {
  const { currentCompanyId } = useCompany();

  const [holidays, setHolidays] = useState([]);
  const [leaveRecords, setLeaveRecords] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("holidays");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    if (!currentCompanyId) {
      setHolidays([]);
      setLeaveRecords([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [holidayRows, leaveRows] = await Promise.all([
        getHolidays(currentCompanyId, year),
        getLeaveRecords(currentCompanyId),
      ]);

      setHolidays(
        (holidayRows || []).filter((row) => row.is_active !== false)
      );
      setLeaveRecords(
        (leaveRows || []).filter((row) => row.is_active !== false)
      );
    } catch (err) {
      setError(err.message || "Unable to load holidays and leave records.");
    } finally {
      setLoading(false);
    }
  }, [currentCompanyId, year]);

  useEffect(() => {
    setHolidays([]);
    setLeaveRecords([]);
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setMessage("");
    loadData();
  }, [loadData]);

  const monthHolidays = holidays
    .filter((holiday) => {
      const date = new Date(`${holiday.holiday_date}T00:00:00`);
      return (
        date.getFullYear() === year &&
        date.getMonth() === month &&
        `${holiday.holiday_name} ${holiday.holiday_type}`
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    })
    .sort((a, b) => a.holiday_date.localeCompare(b.holiday_date));

  const monthName = new Date(year, month, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const leaveSearch = search.trim().toLowerCase();

  const filteredLeave = leaveRecords.filter((record) => {
    const employeeText = String(record.employee_id || "").toLowerCase();
    return (
      !leaveSearch ||
      employeeText.includes(leaveSearch) ||
      String(record.leave_type || "").toLowerCase().includes(leaveSearch) ||
      String(record.approval_status || "").toLowerCase().includes(leaveSearch)
    );
  });

  function startNew() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setMessage("");
    setShowForm(true);
  }

  function startEdit(holiday) {
    setEditingId(holiday.id);
    setForm({
      holiday_name: holiday.holiday_name || "",
      holiday_date: holiday.holiday_date || "",
      holiday_type: holiday.holiday_type || "National",
      is_paid: holiday.is_paid ?? true,
      is_optional: holiday.is_optional ?? false,
      description: holiday.description || "",
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

    if (!form.holiday_name.trim() || !form.holiday_date) {
      setError("Holiday name and date are required.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        holiday_name: form.holiday_name.trim(),
        holiday_date: form.holiday_date,
        holiday_type: form.holiday_type,
        is_paid: form.is_paid,
        is_optional: form.is_optional,
        description: form.description.trim() || null,
        work_location_id: null,
        client_id: null,
        is_active: true,
      };

      if (editingId) {
        await updateHoliday(editingId, payload, currentCompanyId);
        setMessage("Holiday updated successfully.");
      } else {
        await createHoliday(payload, currentCompanyId);
        setMessage("Holiday created successfully.");
      }

      const selectedDate = new Date(`${form.holiday_date}T00:00:00`);
      setYear(selectedDate.getFullYear());
      setMonth(selectedDate.getMonth());
      setSearch("");
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to save holiday.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(holiday) {
    if (!window.confirm(`Deactivate ${holiday.holiday_name}?`)) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await deactivateHoliday(holiday.id, currentCompanyId);
      setMessage("Holiday deactivated.");
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to deactivate holiday.");
    } finally {
      setSaving(false);
    }
  }

  function exportHolidays() {
    if (!monthHolidays.length) {
      window.alert("There are no holidays to export.");
      return;
    }

    const rows = [
      ["Holiday", "Date", "Type", "Paid", "Optional", "Description"],
      ...monthHolidays.map((item) => [
        item.holiday_name,
        item.holiday_date,
        item.holiday_type,
        item.is_paid ? "Yes" : "No",
        item.is_optional ? "Yes" : "No",
        item.description || "",
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\r\n");

    const url = URL.createObjectURL(
      new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    );

    const link = document.createElement("a");
    link.href = url;
    link.download = `holidays-${year}-${String(month + 1).padStart(2, "0")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!currentCompanyId) {
    return <div className="hcl-page">Please select a company first.</div>;
  }

  return (
    <div className="hcl-page">
      <div className="hcl-header">
        <div>
          <div className="hcl-eyebrow">HUMAN RESOURCES</div>
          <h1>Holiday Calendar & Leave Ledger</h1>
          <p>Manage company holidays and view actual leave applications.</p>
        </div>
        {activeTab === "holidays" && (
          <button className="hcl-primary-btn" onClick={startNew}>
            + Add Holiday
          </button>
        )}
      </div>

      {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}
      {message && <p role="status">{message}</p>}
      {loading && <p>Loading records...</p>}

      <div className="hcl-tabs">
        <button
          className={activeTab === "holidays" ? "active" : ""}
          onClick={() => {
            setActiveTab("holidays");
            setSearch("");
            setError("");
          }}
        >
          Holiday Calendar
        </button>
        <button
          className={activeTab === "ledger" ? "active" : ""}
          onClick={() => {
            setActiveTab("ledger");
            setSearch("");
            setError("");
          }}
        >
          Leave Ledger
        </button>
      </div>

      {showForm && activeTab === "holidays" && (
        <section className="hcl-table-card" style={{ padding: 18, marginBottom: 18 }}>
          <h2>{editingId ? "Edit Holiday" : "Add Holiday"}</h2>

          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
              <label>
                Holiday Name *
                <input
                  style={inputStyle}
                  required
                  value={form.holiday_name}
                  onChange={(e) => setForm({ ...form, holiday_name: e.target.value })}
                />
              </label>

              <label>
                Holiday Date *
                <input
                  style={inputStyle}
                  type="date"
                  required
                  value={form.holiday_date}
                  onChange={(e) => setForm({ ...form, holiday_date: e.target.value })}
                />
              </label>

              <label>
                Holiday Type *
                <select
                  style={inputStyle}
                  value={form.holiday_type}
                  onChange={(e) => setForm({ ...form, holiday_type: e.target.value })}
                >
                  <option>Public</option>
<option>National</option>
<option>Festival</option>
<option>Company</option>
<option>Client</option>
<option>Location</option>
<option>Optional</option>
                </select>
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={form.is_paid}
                  onChange={(e) => setForm({ ...form, is_paid: e.target.checked })}
                />{" "}
                Paid holiday
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={form.is_optional}
                  onChange={(e) => setForm({ ...form, is_optional: e.target.checked })}
                />{" "}
                Optional holiday
              </label>

              <label style={{ gridColumn: "1 / -1" }}>
                Description
                <textarea
                  style={inputStyle}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </label>
            </div>

            <p style={{ color: "#6b7280", fontSize: 13 }}>
              This form creates company-wide holidays. Location-specific holiday assignment is not included here.
            </p>

            <button className="hcl-primary-btn" disabled={saving}>
              {saving ? "Saving..." : "Save Holiday"}
            </button>
            <button
              type="button"
              style={{ ...buttonStyle, marginLeft: 8 }}
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setForm(emptyForm);
              }}
            >
              Cancel
            </button>
          </form>
        </section>
      )}

      {activeTab === "holidays" ? (
        <>
          <div className="hcl-stats">
            <div className="hcl-stat-card">
              <span>Holidays this month</span>
              <strong>{monthHolidays.length}</strong>
              <small>{monthName}</small>
            </div>
            <div className="hcl-stat-card">
              <span>Active holidays this year</span>
              <strong>{holidays.length}</strong>
              <small>{year}</small>
            </div>
            <div className="hcl-stat-card">
              <span>Paid holidays this year</span>
              <strong>{holidays.filter((item) => item.is_paid).length}</strong>
              <small>{year}</small>
            </div>
          </div>

          <div className="hcl-toolbar">
            <div className="hcl-month-control">
              <button
                style={buttonStyle}
                onClick={() => {
                  const next = new Date(year, month - 1, 1);
                  setYear(next.getFullYear());
                  setMonth(next.getMonth());
                }}
              >
                Previous
              </button>
              <strong>{monthName}</strong>
              <button
                style={buttonStyle}
                onClick={() => {
                  const next = new Date(year, month + 1, 1);
                  setYear(next.getFullYear());
                  setMonth(next.getMonth());
                }}
              >
                Next
              </button>
            </div>

            <div className="hcl-toolbar-actions">
              <input
                style={inputStyle}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search holidays"
              />
              <button className="hcl-secondary-btn" onClick={exportHolidays}>
                Export CSV
              </button>
              <button className="hcl-secondary-btn" onClick={loadData}>
                Refresh
              </button>
            </div>
          </div>

          <div className="hcl-table-card">
            <div className="hcl-table-heading">
              <h2>Holiday Schedule</h2>
              <span>{monthHolidays.length} records</span>
            </div>

            <div className="hcl-table-wrap">
              <table className="hcl-table">
                <thead>
                  <tr>
                    <th>Holiday</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Paid</th>
                    <th>Optional</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {monthHolidays.map((holiday) => (
                    <tr key={holiday.id}>
                      <td>{holiday.holiday_name}</td>
                      <td>{formatDate(holiday.holiday_date)}</td>
                      <td>{holiday.holiday_type}</td>
                      <td>{holiday.is_paid ? "Yes" : "No"}</td>
                      <td>{holiday.is_optional ? "Yes" : "No"}</td>
                      <td>
                        <button style={buttonStyle} disabled={saving} onClick={() => startEdit(holiday)}>
                          Edit
                        </button>{" "}
                        <button style={buttonStyle} disabled={saving} onClick={() => handleDeactivate(holiday)}>
                          Deactivate
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!loading && monthHolidays.length === 0 && (
                    <tr>
                      <td colSpan="6">No active holidays found for this month.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <section className="hcl-table-card">
          <div className="hcl-table-heading">
            <h2>Leave Application Ledger</h2>
            <span>{filteredLeave.length} records</span>
          </div>

          <input
            style={{ ...inputStyle, margin: "12px 0" }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee ID, leave type or status"
          />

          <div className="hcl-table-wrap">
            <table className="hcl-table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Leave Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Days</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeave.map((record) => (
                  <tr key={record.id}>
                    <td>{record.employee_id}</td>
                    <td>{record.leave_type}</td>
                    <td>{formatDate(record.from_date)}</td>
                    <td>{formatDate(record.to_date)}</td>
                    <td>{record.total_days}</td>
                    <td>{record.approval_status || "Pending"}</td>
                  </tr>
                ))}
                {!loading && filteredLeave.length === 0 && (
                  <tr>
                    <td colSpan="6">No leave records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
            }
