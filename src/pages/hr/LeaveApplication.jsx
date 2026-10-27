import React, { useEffect, useMemo, useState } from "react";
import { useCompany } from "../../context/CompanyContext";
import {
  calculateLeaveDays,
  getCompanyEmployeesForLeave,
  getLeaveApplications,
  submitLeaveApplication,
  updatePendingLeaveApplication,
} from "../../services/hr/leaveWorkflowService";

const LEAVE_TYPES = [
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
];

const blankForm = {
  employee_id: "",
  leave_type: "Casual",
  from_date: "",
  to_date: "",
  session_type: "Full Day",
  reason: "",
  remarks: "",
};

const fieldStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px",
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  background: "#fff",
};

const buttonStyle = {
  padding: "9px 14px",
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  background: "#fff",
  cursor: "pointer",
};

export default function LeaveApplication() {
  const { currentCompanyId } = useCompany();

  const [employees, setEmployees] = useState([]);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    if (!currentCompanyId) {
      setEmployees([]);
      setRows([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [employeeRows, leaveRows] = await Promise.all([
        getCompanyEmployeesForLeave(currentCompanyId),
        getLeaveApplications(currentCompanyId),
      ]);

      setEmployees(employeeRows);
      setRows(leaveRows);
    } catch (e) {
      setError(e.message || "Unable to load leave applications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setEmployees([]);
    setRows([]);
    setForm(blankForm);
    setEditingId(null);
    setMessage("");
    setError("");
    load();

    // load intentionally follows selected company changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCompanyId]);

  const employeeMap = useMemo(
    () => new Map(employees.map((employee) => [employee.id, employee])),
    [employees]
  );

  const days = useMemo(() => {
    try {
      return calculateLeaveDays(
        form.from_date,
        form.to_date,
        form.session_type
      );
    } catch {
      return 0;
    }
  }, [form.from_date, form.to_date, form.session_type]);

  function change(name, value) {
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  function startEdit(row) {
    if ((row.approval_status || "Pending") !== "Pending") {
      setError("Only pending applications can be edited.");
      return;
    }

    setEditingId(row.id);
    setForm({
      employee_id: row.employee_id || "",
      leave_type: row.leave_type || "Casual",
      from_date: row.from_date || "",
      to_date: row.to_date || "",
      session_type: row.session_type || "Full Day",
      reason: row.reason || "",
      remarks: row.remarks || "",
    });

    setError("");
    setMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!currentCompanyId) {
      setError("Select a company first.");
      return;
    }

    if (!employeeMap.has(form.employee_id)) {
      setError("Select an employee from this company.");
      return;
    }

    if (!form.leave_type) {
      setError("Select a leave type.");
      return;
    }

    if (
      !form.from_date ||
      !form.to_date ||
      form.to_date < form.from_date
    ) {
      setError("Enter a valid leave date range.");
      return;
    }

    if (
      form.session_type !== "Full Day" &&
      form.from_date !== form.to_date
    ) {
      setError("Half-day leave must be for a single date.");
      return;
    }

    setSaving(true);

    try {
      if (editingId) {
        await updatePendingLeaveApplication(
          editingId,
          form,
          currentCompanyId
        );
        setMessage("Pending leave application updated.");
      } else {
        await submitLeaveApplication(form, currentCompanyId);
        setMessage("Leave application submitted for approval.");
      }

      setForm(blankForm);
      setEditingId(null);
      await load();
    } catch (e) {
      setError(e.message || "Unable to save leave application.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <h2>Leave Application</h2>

      <p>
        Submit leave for an employee in the selected company.
        New applications are saved as Pending.
      </p>

      {!currentCompanyId && (
        <p>Please select a company before continuing.</p>
      )}

      {error && (
        <div
          role="alert"
          style={{ color: "#b91c1c", margin: "12px 0" }}
        >
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          style={{ color: "#166534", margin: "12px 0" }}
        >
          {message}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 14,
          padding: 18,
          border: "1px solid #e2e8f0",
          borderRadius: 10,
          marginBottom: 24,
        }}
      >
        <label>
          Employee
          <select
            required
            value={form.employee_id}
            onChange={(e) => change("employee_id", e.target.value)}
            style={fieldStyle}
          >
            <option value="">Select employee</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.employee_code
                  ? `${employee.employee_code} — `
                  : ""}
                {employee.employee_name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Leave type
          <select
            required
            value={form.leave_type}
            onChange={(e) => change("leave_type", e.target.value)}
            style={fieldStyle}
          >
            {LEAVE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label>
          From date
          <input
            required
            type="date"
            value={form.from_date}
            onChange={(e) => change("from_date", e.target.value)}
            style={fieldStyle}
          />
        </label>

        <label>
          To date
          <input
            required
            type="date"
            min={form.from_date || undefined}
            value={form.to_date}
            onChange={(e) => change("to_date", e.target.value)}
            style={fieldStyle}
          />
        </label>

        <label>
          Session
          <select
            value={form.session_type}
            onChange={(e) => change("session_type", e.target.value)}
            style={fieldStyle}
          >
            <option>Full Day</option>
            <option>First Half</option>
            <option>Second Half</option>
          </select>
        </label>

        <label>
          Calculated days
          <input
            readOnly
            value={days || ""}
            style={{ ...fieldStyle, background: "#f8fafc" }}
          />
        </label>

        <label style={{ gridColumn: "1 / -1" }}>
          Reason
          <textarea
            value={form.reason}
            onChange={(e) => change("reason", e.target.value)}
            rows={2}
            style={fieldStyle}
          />
        </label>

        <label style={{ gridColumn: "1 / -1" }}>
          Remarks
          <textarea
            value={form.remarks}
            onChange={(e) => change("remarks", e.target.value)}
            rows={2}
            style={fieldStyle}
          />
        </label>

        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            gridColumn: "1 / -1",
          }}
        >
          <button
            type="submit"
            disabled={saving || !currentCompanyId}
            style={buttonStyle}
          >
            {saving
              ? "Saving..."
              : editingId
                ? "Update Pending Application"
                : "Submit Application"}
          </button>

          {editingId && (
            <button
              type="button"
              style={buttonStyle}
              onClick={() => {
                setEditingId(null);
                setForm(blankForm);
                setError("");
              }}
            >
              Cancel edit
            </button>
          )}
        </div>
      </form>

      <h3>Applications for selected company</h3>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse" }}
          >
            <thead>
              <tr>
                {[
                  "Employee",
                  "Leave type",
                  "Dates",
                  "Days",
                  "Status",
                  "Reason",
                  "Action",
                ].map((heading) => (
                  <th
                    key={heading}
                    style={{
                      textAlign: "left",
                      padding: 10,
                      borderBottom: "1px solid #cbd5e1",
                    }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td style={{ padding: 10, borderBottom: "1px solid #e2e8f0" }}>
                    {employeeMap.get(row.employee_id)?.employee_name ||
                      row.employee_id}
                  </td>

                  <td style={{ padding: 10, borderBottom: "1px solid #e2e8f0" }}>
                    {row.leave_type}
                  </td>

                  <td style={{ padding: 10, borderBottom: "1px solid #e2e8f0" }}>
                    {row.from_date} – {row.to_date}
                  </td>

                  <td style={{ padding: 10, borderBottom: "1px solid #e2e8f0" }}>
                    {row.total_days}
                  </td>

                  <td style={{ padding: 10, borderBottom: "1px solid #e2e8f0" }}>
                    {row.approval_status || "Pending"}
                  </td>

                  <td style={{ padding: 10, borderBottom: "1px solid #e2e8f0" }}>
                    {row.reason || "—"}
                  </td>

                  <td style={{ padding: 10, borderBottom: "1px solid #e2e8f0" }}>
                    {(row.approval_status || "Pending") === "Pending" && (
                      <button
                        type="button"
                        style={buttonStyle}
                        onClick={() => startEdit(row)}
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {!rows.length && (
                <tr>
                  <td colSpan={7} style={{ padding: 14 }}>
                    No leave applications found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
