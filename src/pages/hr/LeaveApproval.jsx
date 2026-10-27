import React, { useEffect, useMemo, useState } from "react";
import { useCompany } from "../../context/CompanyContext";
import {
  decideLeaveApplication,
  getCompanyEmployeesForLeave,
  getLeaveApplications,
} from "../../services/hr/leaveWorkflowService";

const buttonStyle = {
  padding: "8px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  background: "#fff",
  cursor: "pointer",
  marginRight: 6,
};

export default function LeaveApproval() {
  const { currentCompanyId } = useCompany();

  const [employees, setEmployees] = useState([]);
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState("Pending");
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
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
    setError("");
    setMessage("");
    load();

    // load intentionally follows selected company changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCompanyId]);

  const employeeMap = useMemo(
    () => new Map(employees.map((employee) => [employee.id, employee])),
    [employees]
  );

  const visibleRows = useMemo(
    () =>
      rows.filter(
        (row) =>
          filter === "All" ||
          (row.approval_status || "Pending") === filter
      ),
    [rows, filter]
  );

  async function decide(row, decision) {
    let reason = "";

    if (decision === "Rejected") {
      reason =
        window.prompt(
          "Enter the reason for rejecting this leave application:"
        ) || "";

      if (!reason.trim()) {
        setError("A rejection reason is required. No change was made.");
        return;
      }
    } else if (!window.confirm("Approve this leave application?")) {
      return;
    }

    setSavingId(row.id);
    setError("");
    setMessage("");

    try {
      await decideLeaveApplication(
        row.id,
        currentCompanyId,
        decision,
        reason
      );

      setMessage(`Application ${decision.toLowerCase()} successfully.`);
      await load();
    } catch (e) {
      setError(e.message || "Unable to update application.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 1300, margin: "0 auto" }}>
      <h2>Leave Approval</h2>

      <p>
        Review and decide leave applications for the selected company.
      </p>

      {!currentCompanyId && <p>Please select a company first.</p>}

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

      <div style={{ margin: "16px 0" }}>
        <label>
          Show status&nbsp;
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ padding: 8, borderRadius: 6 }}
          >
            <option>Pending</option>
            <option>Approved</option>
            <option>Rejected</option>
            <option value="All">All</option>
          </select>
        </label>

        <button
          type="button"
          style={{ ...buttonStyle, marginLeft: 10 }}
          onClick={load}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

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
                  "Period",
                  "Days",
                  "Session",
                  "Reason",
                  "Status",
                  "Rejection reason",
                  "Decision",
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
              {visibleRows.map((row) => {
                const pending =
                  (row.approval_status || "Pending") === "Pending";

                return (
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
                      {row.session_type || "Full Day"}
                    </td>

                    <td style={{ padding: 10, borderBottom: "1px solid #e2e8f0" }}>
                      {row.reason || "—"}
                    </td>

                    <td style={{ padding: 10, borderBottom: "1px solid #e2e8f0" }}>
                      {row.approval_status || "Pending"}
                    </td>

                    <td style={{ padding: 10, borderBottom: "1px solid #e2e8f0" }}>
                      {row.rejection_reason || "—"}
                    </td>

                    <td
                      style={{
                        padding: 10,
                        borderBottom: "1px solid #e2e8f0",
                        minWidth: 180,
                      }}
                    >
                      {pending ? (
                        <>
                          <button
                            type="button"
                            style={buttonStyle}
                            disabled={!!savingId}
                            onClick={() => decide(row, "Approved")}
                          >
                            {savingId === row.id
                              ? "Saving..."
                              : "Approve"}
                          </button>

                          <button
                            type="button"
                            style={buttonStyle}
                            disabled={!!savingId}
                            onClick={() => decide(row, "Rejected")}
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}

              {!visibleRows.length && (
                <tr>
                  <td colSpan={9} style={{ padding: 14 }}>
                    No applications match this filter.
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
