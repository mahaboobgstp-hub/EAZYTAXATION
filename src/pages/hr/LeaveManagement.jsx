
import React, { useMemo, useState } from "react";
import "../../css/hr/LeaveManagement.css";

const initialRequests = [
  {
    id: 1,
    employeeCode: "EMP001",
    employeeName: "Vamsi Cherukuri",
    department: "Administration",
    leaveType: "Casual Leave",
    fromDate: "2026-10-19",
    toDate: "2026-10-20",
    days: 2,
    reason: "Personal work",
    appliedOn: "2026-10-15",
    status: "Pending",
  },
  {
    id: 2,
    employeeCode: "EMP002",
    employeeName: "Mahaboob Basha",
    department: "Operations",
    leaveType: "Sick Leave",
    fromDate: "2026-10-12",
    toDate: "2026-10-12",
    days: 1,
    reason: "Not feeling well",
    appliedOn: "2026-10-11",
    status: "Approved",
  },
  {
    id: 3,
    employeeCode: "EMP003",
    employeeName: "Test Employee",
    department: "Security",
    leaveType: "Casual Leave",
    fromDate: "2026-10-08",
    toDate: "2026-10-09",
    days: 2,
    reason: "Family function",
    appliedOn: "2026-10-06",
    status: "Rejected",
  },
];

const emptyForm = {
  employeeCode: "",
  employeeName: "",
  department: "",
  leaveType: "Casual Leave",
  fromDate: "",
  toDate: "",
  reason: "",
};

function calculateDays(fromDate, toDate) {
  if (!fromDate || !toDate || toDate < fromDate) return 0;

  const start = new Date(`${fromDate}T00:00:00`);
  const end = new Date(`${toDate}T00:00:00`);

  return Math.floor((end - start) / 86400000) + 1;
}

function formatDate(value) {
  if (!value) return "—";

  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function LeaveManagement() {
  const [requests, setRequests] = useState(initialRequests);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        request.employeeName.toLowerCase().includes(searchText) ||
        request.employeeCode.toLowerCase().includes(searchText) ||
        request.department.toLowerCase().includes(searchText);

      const matchesStatus =
        statusFilter === "All" || request.status === statusFilter;

      const matchesLeaveType =
        leaveTypeFilter === "All" ||
        request.leaveType === leaveTypeFilter;

      return matchesSearch && matchesStatus && matchesLeaveType;
    });
  }, [requests, search, statusFilter, leaveTypeFilter]);

  const pendingCount = requests.filter(
    (item) => item.status === "Pending"
  ).length;

  const approvedCount = requests.filter(
    (item) => item.status === "Approved"
  ).length;

  const rejectedCount = requests.filter(
    (item) => item.status === "Rejected"
  ).length;

  const approvedDays = requests
    .filter((item) => item.status === "Approved")
    .reduce((total, item) => total + item.days, 0);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (
      !form.employeeCode.trim() ||
      !form.employeeName.trim() ||
      !form.fromDate ||
      !form.toDate ||
      !form.reason.trim()
    ) {
      setMessage("Please complete all required fields.");
      return;
    }

    if (form.toDate < form.fromDate) {
      setMessage("The To Date cannot be earlier than the From Date.");
      return;
    }

    const newRequest = {
      ...form,
      id: Date.now(),
      days: calculateDays(form.fromDate, form.toDate),
      appliedOn: new Date().toISOString().slice(0, 10),
      status: "Pending",
    };

    setRequests((current) => [newRequest, ...current]);
    setForm(emptyForm);
    setShowForm(false);
    setMessage("Leave request added to this screen.");
  }

  function updateStatus(id, status) {
    setRequests((current) =>
      current.map((request) =>
        request.id === id ? { ...request, status } : request
      )
    );

    setMessage(`Request marked as ${status.toLowerCase()}.`);
  }

  return (
    <div className="leave-page">
      <div className="leave-page-header">
        <div>
          <h1>Leave Management</h1>
          <p>Manage employee leave requests, approvals and leave records.</p>
        </div>

        <button
          className="leave-primary-button"
          onClick={() => {
            setMessage("");
            setShowForm((current) => !current);
          }}
        >
          {showForm ? "Cancel" : "+ Apply Leave"}
        </button>
      </div>

      <div className="leave-demo-notice">
        UI preview: changes are temporary and will not be saved after refreshing.
      </div>

      {message && (
        <div className="leave-message" role="status">
          {message}
        </div>
      )}

      <div className="leave-summary-grid">
        <div className="leave-summary-card">
          <span className="leave-summary-label">Total Requests</span>
          <strong>{requests.length}</strong>
          <small>All leave applications</small>
        </div>

        <div className="leave-summary-card pending-card">
          <span className="leave-summary-label">Pending Approval</span>
          <strong>{pendingCount}</strong>
          <small>Awaiting a decision</small>
        </div>

        <div className="leave-summary-card approved-card">
          <span className="leave-summary-label">Approved Requests</span>
          <strong>{approvedCount}</strong>
          <small>{approvedDays} approved calendar days</small>
        </div>

        <div className="leave-summary-card rejected-card">
          <span className="leave-summary-label">Rejected Requests</span>
          <strong>{rejectedCount}</strong>
          <small>Not approved</small>
        </div>
      </div>

      {showForm && (
        <section className="leave-panel">
          <div className="leave-panel-heading">
            <div>
              <h2>New Leave Request</h2>
              <p>Enter the employee and leave details.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="leave-form-grid">
              <label>
                Employee Code *
                <input
                  value={form.employeeCode}
                  onChange={(event) =>
                    updateForm("employeeCode", event.target.value)
                  }
                  placeholder="e.g. EMP004"
                  required
                />
              </label>

              <label>
                Employee Name *
                <input
                  value={form.employeeName}
                  onChange={(event) =>
                    updateForm("employeeName", event.target.value)
                  }
                  placeholder="Enter employee name"
                  required
                />
              </label>

              <label>
                Department
                <input
                  value={form.department}
                  onChange={(event) =>
                    updateForm("department", event.target.value)
                  }
                  placeholder="Enter department"
                />
              </label>

              <label>
                Leave Type *
                <select
                  value={form.leaveType}
                  onChange={(event) =>
                    updateForm("leaveType", event.target.value)
                  }
                >
                  <option>Casual Leave</option>
                  <option>Sick Leave</option>
                  <option>Earned Leave</option>
                  <option>Unpaid Leave</option>
                  <option>Compensatory Off</option>
                  <option>Other</option>
                </select>
              </label>

              <label>
                From Date *
                <input
                  type="date"
                  value={form.fromDate}
                  onChange={(event) =>
                    updateForm("fromDate", event.target.value)
                  }
                  required
                />
              </label>

              <label>
                To Date *
                <input
                  type="date"
                  min={form.fromDate || undefined}
                  value={form.toDate}
                  onChange={(event) =>
                    updateForm("toDate", event.target.value)
                  }
                  required
                />
              </label>

              <label className="leave-full-width">
                Reason for Leave *
                <textarea
                  rows="3"
                  value={form.reason}
                  onChange={(event) =>
                    updateForm("reason", event.target.value)
                  }
                  placeholder="Enter the reason for leave"
                  required
                />
              </label>
            </div>

            <div className="leave-form-footer">
              <span>
                Requested duration:{" "}
                <strong>
                  {calculateDays(form.fromDate, form.toDate)} day(s)
                </strong>
              </span>

              <button type="submit" className="leave-primary-button">
                Submit Request
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="leave-panel">
        <div className="leave-panel-heading">
          <div>
            <h2>Leave Applications</h2>
            <p>Review requests and update their approval status.</p>
          </div>
          <span className="leave-record-count">
            {filteredRequests.length} record(s)
          </span>
        </div>

        <div className="leave-filter-bar">
          <input
            className="leave-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search employee, code or department..."
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter by status"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>

          <select
            value={leaveTypeFilter}
            onChange={(event) => setLeaveTypeFilter(event.target.value)}
            aria-label="Filter by leave type"
          >
            <option value="All">All Leave Types</option>
            <option value="Casual Leave">Casual Leave</option>
            <option value="Sick Leave">Sick Leave</option>
            <option value="Earned Leave">Earned Leave</option>
            <option value="Unpaid Leave">Unpaid Leave</option>
            <option value="Compensatory Off">Compensatory Off</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="leave-table-wrapper">
          <table className="leave-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>Leave Period</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Applied On</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredRequests.map((request) => (
                <tr key={request.id}>
                  <td>
                    <strong>{request.employeeName}</strong>
                    <small>{request.employeeCode}</small>
                    <small>{request.department || "—"}</small>
                  </td>

                  <td>{request.leaveType}</td>

                  <td>
                    <div>{formatDate(request.fromDate)}</div>
                    <small>to {formatDate(request.toDate)}</small>
                  </td>

                  <td>{request.days}</td>
                  <td className="leave-reason-cell">{request.reason}</td>
                  <td>{formatDate(request.appliedOn)}</td>

                  <td>
                    <span
                      className={`leave-status leave-status-${request.status.toLowerCase()}`}
                    >
                      {request.status}
                    </span>
                  </td>

                  <td>
                    {request.status === "Pending" ? (
                      <div className="leave-action-buttons">
                        <button
                          className="leave-approve-button"
                          onClick={() =>
                            updateStatus(request.id, "Approved")
                          }
                        >
                          Approve
                        </button>
                        <button
                          className="leave-reject-button"
                          onClick={() =>
                            updateStatus(request.id, "Rejected")
                          }
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <button
                        className="leave-reset-button"
                        onClick={() =>
                          updateStatus(request.id, "Pending")
                        }
                      >
                        Reopen
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan="8" className="leave-empty-state">
                    No leave requests match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="leave-panel leave-future-panel">
        <div>
          <h2>Next Integration</h2>
          <p>
            Connect this screen to employee records, assigned leave policies,
            leave balances, approval history and payroll attendance deductions.
          </p>
        </div>
        <span className="leave-coming-soon">Database integration pending</span>
      </section>
    </div>
  );
}
