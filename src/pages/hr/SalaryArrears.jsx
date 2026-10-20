
import React, { useMemo, useState } from "react";
import "../../css/hr/SalaryArrears.css";

const SAMPLE_EMPLOYEES = [
  { id: "EMP001", name: "Sample Employee 1", department: "Accounts" },
  { id: "EMP002", name: "Sample Employee 2", department: "Operations" },
  { id: "EMP003", name: "Sample Employee 3", department: "HR" },
];

const INITIAL_ARREARS = [
  {
    id: "ARR-0001",
    employeeId: "EMP001",
    employeeName: "Sample Employee 1",
    reason: "Delayed salary increment",
    fromMonth: "2026-04",
    toMonth: "2026-06",
    oldSalary: 25000,
    revisedSalary: 30000,
    months: 3,
    amount: 15000,
    notes: "Illustrative sample record",
    status: "Draft",
    paidAmount: 0,
    createdAt: "2026-10-20",
  },
];

const REASONS = [
  "Delayed salary increment",
  "Promotion",
  "Salary revision",
  "Allowance revision",
  "Missed salary component",
  "Other approved adjustment",
];

const STATUSES = ["All", "Draft", "Submitted", "Approved", "Partially Paid", "Paid", "Rejected"];

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatMonth = (value) => {
  if (!value) return "—";

  const [year, month] = value.split("-").map(Number);
  if (!year || !month) return value;

  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
};

const getMonthsBetween = (fromMonth, toMonth) => {
  if (!fromMonth || !toMonth) return 0;

  const [fromYear, fromM] = fromMonth.split("-").map(Number);
  const [toYear, toM] = toMonth.split("-").map(Number);

  return (toYear - fromYear) * 12 + toM - fromM + 1;
};

const getStatusClass = (status) =>
  status.toLowerCase().replace(/\s+/g, "-");

const emptyForm = {
  employeeId: "",
  reason: REASONS[0],
  fromMonth: "",
  toMonth: "",
  oldSalary: "",
  revisedSalary: "",
  approvalDate: "",
  notes: "",
};

function SalaryArrears() {
  const [arrears, setArrears] = useState(INITIAL_ARREARS);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [message, setMessage] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const months = getMonthsBetween(form.fromMonth, form.toMonth);
  const salaryDifference =
    (Number(form.revisedSalary) || 0) -
    (Number(form.oldSalary) || 0);

  const estimatedAmount =
    months > 0 && salaryDifference > 0
      ? months * salaryDifference
      : 0;

  const filteredArrears = useMemo(() => {
    const query = search.trim().toLowerCase();

    return arrears.filter((item) => {
      const matchesSearch =
        !query ||
        item.id.toLowerCase().includes(query) ||
        item.employeeName.toLowerCase().includes(query) ||
        item.employeeId.toLowerCase().includes(query) ||
        item.reason.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [arrears, search, statusFilter]);

  const totals = useMemo(() => {
    const approvedOrLater = arrears.filter((item) =>
      ["Approved", "Partially Paid", "Paid"].includes(item.status)
    );

    const approved = approvedOrLater.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    const paid = arrears.reduce(
      (sum, item) => sum + (Number(item.paidAmount) || 0),
      0
    );

    const pendingApproval = arrears
      .filter((item) => ["Draft", "Submitted"].includes(item.status))
      .reduce((sum, item) => sum + item.amount, 0);

    return {
      records: arrears.length,
      approved,
      paid,
      outstanding: Math.max(approved - paid, 0),
      pendingApproval,
    };
  }, [arrears]);

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setMessage("");
  };

  const openNewForm = () => {
    setForm(emptyForm);
    setSelectedId(null);
    setShowForm(true);
    setMessage("");
  };

  const closeForm = () => {
    setShowForm(false);
    setSelectedId(null);
    setMessage("");
  };

  const saveArrears = (event) => {
    event.preventDefault();

    if (!form.employeeId || !form.fromMonth || !form.toMonth) {
      setMessage("Please select an employee and both salary periods.");
      return;
    }

    if (form.toMonth < form.fromMonth) {
      setMessage("The ending period cannot be earlier than the starting period.");
      return;
    }

    if (!form.oldSalary || !form.revisedSalary) {
      setMessage("Enter both the old and revised monthly salary.");
      return;
    }

    if (Number(form.oldSalary) < 0 || Number(form.revisedSalary) < 0) {
      setMessage("Salary values cannot be negative.");
      return;
    }

    if (Number(form.revisedSalary) <= Number(form.oldSalary)) {
      setMessage(
        "This page currently handles positive salary arrears only. Salary reductions and recoveries need a separate adjustment workflow."
      );
      return;
    }

    const employee = SAMPLE_EMPLOYEES.find(
      (item) => item.id === form.employeeId
    );

    if (!employee) {
      setMessage("The selected sample employee could not be found.");
      return;
    }

    const numberOfMonths = getMonthsBetween(form.fromMonth, form.toMonth);

    if (numberOfMonths <= 0) {
      setMessage("Please select a valid arrears period.");
      return;
    }

    const newRecord = {
      id: `ARR-${String(Date.now()).slice(-6)}`,
      employeeId: employee.id,
      employeeName: employee.name,
      reason: form.reason,
      fromMonth: form.fromMonth,
      toMonth: form.toMonth,
      oldSalary: Number(form.oldSalary),
      revisedSalary: Number(form.revisedSalary),
      months: numberOfMonths,
      amount: numberOfMonths * (
        Number(form.revisedSalary) - Number(form.oldSalary)
      ),
      approvalDate: form.approvalDate,
      notes: form.notes.trim(),
      status: "Draft",
      paidAmount: 0,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setArrears((previous) => [newRecord, ...previous]);
    setShowForm(false);
    setMessage("");
  };

  const changeStatus = (id, nextStatus) => {
    setArrears((previous) =>
      previous.map((item) => {
        if (item.id !== id) return item;

        // This is only a UI demonstration. Real approval must be
        // permission-controlled and recorded on the server.
        if (nextStatus === "Submitted" && item.status !== "Draft") {
          return item;
        }

        if (nextStatus === "Approved" && item.status !== "Submitted") {
          return item;
        }

        if (nextStatus === "Rejected" && !["Draft", "Submitted"].includes(item.status)) {
          return item;
        }

        return { ...item, status: nextStatus };
      })
    );
  };

  const recordPayment = (item) => {
    if (item.status !== "Approved" && item.status !== "Partially Paid") {
      return;
    }

    const remaining = Math.max(item.amount - item.paidAmount, 0);

    if (remaining <= 0) return;

    const input = window.prompt(
      `Outstanding amount: ${formatCurrency(remaining)}\nEnter the payment amount:`,
      String(remaining)
    );

    if (input === null || input.trim() === "") return;

    const payment = Number(input);

    if (!Number.isFinite(payment) || payment <= 0 || payment > remaining) {
      window.alert("Enter a valid amount not exceeding the outstanding balance.");
      return;
    }

    setArrears((previous) =>
      previous.map((record) => {
        if (record.id !== item.id) return record;

        const newPaidAmount = record.paidAmount + payment;

        return {
          ...record,
          paidAmount: newPaidAmount,
          status: newPaidAmount >= record.amount ? "Paid" : "Partially Paid",
        };
      })
    );
  };

  const exportCsv = () => {
    const headers = [
      "Arrears ID",
      "Employee ID",
      "Employee Name",
      "Reason",
      "From Period",
      "To Period",
      "Old Monthly Salary",
      "Revised Monthly Salary",
      "Months",
      "Gross Arrears",
      "Paid Amount",
      "Outstanding",
      "Status",
    ];

    const rows = filteredArrears.map((item) => [
      item.id,
      item.employeeId,
      item.employeeName,
      item.reason,
      item.fromMonth,
      item.toMonth,
      item.oldSalary,
      item.revisedSalary,
      item.months,
      item.amount,
      item.paidAmount,
      Math.max(item.amount - item.paidAmount, 0),
      item.status,
    ]);

    const escapeCsv = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "salary-arrears-register.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="salary-arrears-page">
      <div className="arrears-page-header">
        <div>
          <div className="arrears-eyebrow">PAYROLL MANAGEMENT</div>
          <h1>Salary Arrears</h1>
          <p>
            Record retrospective salary adjustments, track approvals and
            monitor outstanding arrears.
          </p>
        </div>

        <div className="arrears-header-actions">
          <button
            type="button"
            className="arrears-btn arrears-btn-secondary"
            onClick={exportCsv}
          >
            Export Register
          </button>
          <button
            type="button"
            className="arrears-btn arrears-btn-primary"
            onClick={openNewForm}
          >
            + Record Arrears
          </button>
        </div>
      </div>

      <div className="arrears-demo-notice">
        <strong>Demonstration mode:</strong> employee records and arrears
        are sample data stored in page memory. They are not saved to Supabase
        and are not included in actual payroll. Do not use this page to authorize
        or pay real employee arrears yet.
      </div>

      <div className="arrears-summary-grid">
        <div className="arrears-summary-card">
          <span>Total Records</span>
          <strong>{totals.records}</strong>
          <small>All arrears entries</small>
        </div>
        <div className="arrears-summary-card">
          <span>Approved Arrears</span>
          <strong>{formatCurrency(totals.approved)}</strong>
          <small>Approved and payable</small>
        </div>
        <div className="arrears-summary-card">
          <span>Paid Amount</span>
          <strong>{formatCurrency(totals.paid)}</strong>
          <small>Payments recorded in this session</small>
        </div>
        <div className="arrears-summary-card">
          <span>Outstanding</span>
          <strong>{formatCurrency(totals.outstanding)}</strong>
          <small>Approved balance remaining</small>
        </div>
      </div>

      {showForm && (
        <section className="arrears-panel arrears-form-panel">
          <div className="arrears-panel-heading">
            <div>
              <h2>Record Salary Arrears</h2>
              <p>Enter the old and revised salary for the affected period.</p>
            </div>
            <button
              type="button"
              className="arrears-close-btn"
              onClick={closeForm}
              aria-label="Close form"
            >
              ×
            </button>
          </div>

          <form onSubmit={saveArrears}>
            <div className="arrears-form-grid">
              <label>
                Employee <span>*</span>
                <select
                  name="employeeId"
                  value={form.employeeId}
                  onChange={updateForm}
                  required
                >
                  <option value="">Select employee</option>
                  {SAMPLE_EMPLOYEES.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.id} — {employee.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Reason <span>*</span>
                <select
                  name="reason"
                  value={form.reason}
                  onChange={updateForm}
                  required
                >
                  {REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Arrears From <span>*</span>
                <input
                  type="month"
                  name="fromMonth"
                  value={form.fromMonth}
                  onChange={updateForm}
                  required
                />
              </label>

              <label>
                Arrears To <span>*</span>
                <input
                  type="month"
                  name="toMonth"
                  min={form.fromMonth || undefined}
                  value={form.toMonth}
                  onChange={updateForm}
                  required
                />
              </label>

              <label>
                Old Monthly Salary (₹) <span>*</span>
                <input
                  type="number"
                  name="oldSalary"
                  min="0"
                  step="0.01"
                  value={form.oldSalary}
                  onChange={updateForm}
                  placeholder="25000"
                  required
                />
              </label>

              <label>
                Revised Monthly Salary (₹) <span>*</span>
                <input
                  type="number"
                  name="revisedSalary"
                  min="0"
                  step="0.01"
                  value={form.revisedSalary}
                  onChange={updateForm}
                  placeholder="30000"
                  required
                />
              </label>

              <label>
                Approval Date
                <input
                  type="date"
                  name="approvalDate"
                  value={form.approvalDate}
                  onChange={updateForm}
                />
              </label>

              <label className="arrears-full-width">
                Remarks / Approval Reference
                <textarea
                  name="notes"
                  rows="3"
                  value={form.notes}
                  onChange={updateForm}
                  placeholder="Enter approval reference, revision details or supporting remarks"
                />
              </label>
            </div>

            <div className="arrears-calculation-preview">
              <div>
                <span>Monthly Difference</span>
                <strong>{formatCurrency(Math.max(salaryDifference, 0))}</strong>
              </div>
              <div>
                <span>Number of Months</span>
                <strong>{Math.max(months, 0)}</strong>
              </div>
              <div className="arrears-preview-total">
                <span>Estimated Gross Arrears</span>
                <strong>{formatCurrency(estimatedAmount)}</strong>
              </div>
            </div>

            <p className="arrears-calculation-note">
              Estimate only. This simple calculation assumes a constant monthly
              difference for every selected month. It does not calculate
              partial months, individual salary components, attendance-based
              adjustments or statutory deductions.
            </p>

            {message && (
              <div className="arrears-form-error" role="alert">
                {message}
              </div>
            )}

            <div className="arrears-form-actions">
              <button
                type="button"
                className="arrears-btn arrears-btn-secondary"
                onClick={closeForm}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="arrears-btn arrears-btn-primary"
              >
                Save as Draft
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="arrears-panel">
        <div className="arrears-panel-heading arrears-register-heading">
          <div>
            <h2>Arrears Register</h2>
            <p>Review salary differences, approval status and payments.</p>
          </div>
          <span className="arrears-record-count">
            {filteredArrears.length} records
          </span>
        </div>

        <div className="arrears-filters">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search employee, ID or reason..."
            aria-label="Search arrears"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter by status"
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status === "All" ? "All statuses" : status}
              </option>
            ))}
          </select>
        </div>

        <div className="arrears-table-wrap">
          <table className="arrears-table">
            <thead>
              <tr>
                <th>Arrears ID / Employee</th>
                <th>Reason</th>
                <th>Period</th>
                <th>Salary Difference</th>
                <th>Gross Arrears</th>
                <th>Outstanding</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredArrears.map((item) => {
                const outstanding = Math.max(
                  item.amount - item.paidAmount,
                  0
                );

                return (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.id}</strong>
                      <small>
                        {item.employeeName}
                        <br />
                        {item.employeeId}
                      </small>
                    </td>
                    <td>{item.reason}</td>
                    <td>
                      {formatMonth(item.fromMonth)}
                      <small>to {formatMonth(item.toMonth)}</small>
                    </td>
                    <td>
                      {formatCurrency(item.revisedSalary - item.oldSalary)}
                      <small>per month</small>
                    </td>
                    <td className="arrears-amount">
                      {formatCurrency(item.amount)}
                    </td>
                    <td>{formatCurrency(outstanding)}</td>
                    <td>
                      <span
                        className={`arrears-status ${getStatusClass(item.status)}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div className="arrears-row-actions">
                        {item.status === "Draft" && (
                          <button
                            type="button"
                            onClick={() => changeStatus(item.id, "Submitted")}
                          >
                            Submit
                          </button>
                        )}

                        {item.status === "Submitted" && (
                          <>
                            <button
                              type="button"
                              onClick={() => changeStatus(item.id, "Approved")}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              className="arrears-reject-action"
                              onClick={() => changeStatus(item.id, "Rejected")}
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {["Approved", "Partially Paid"].includes(item.status) && (
                          <button
                            type="button"
                            onClick={() => recordPayment(item)}
                          >
                            Record Payment
                          </button>
                        )}

                        {["Paid", "Rejected"].includes(item.status) && (
                          <span className="arrears-no-action">No actions</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredArrears.length === 0 && (
                <tr>
                  <td colSpan="8" className="arrears-empty">
                    No arrears records match your search. Select
                    {" "}Record Arrears to create a new draft.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="arrears-register-footer">
          <span>
            Pending approval: {formatCurrency(totals.pendingApproval)}
          </span>
          <span>
            Showing {filteredArrears.length} of {arrears.length} records
          </span>
        </div>
      </section>
    </div>
  );
}

export default SalaryArrears;
