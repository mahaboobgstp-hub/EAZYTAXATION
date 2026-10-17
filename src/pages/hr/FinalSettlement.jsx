
import React, { useMemo, useState } from "react";
import "../../css/hr/FinalSettlement.css";

const demoEmployees = [
  {
    id: "EMP001",
    code: "EMP001",
    name: "Vamsi Cherukuri",
    department: "Administration",
    designation: "Accountant",
    joiningDate: "2024-04-01",
    leavingDate: "2026-10-15",
    monthlySalary: 30000,
  },
  {
    id: "EMP002",
    code: "EMP002",
    name: "Mahaboob Basha",
    department: "Operations",
    designation: "Supervisor",
    joiningDate: "2025-01-01",
    leavingDate: "",
    monthlySalary: 35000,
  },
  {
    id: "EMP003",
    code: "EMP003",
    name: "Test Employee",
    department: "Security",
    designation: "Security Guard",
    joiningDate: "2025-06-01",
    leavingDate: "",
    monthlySalary: 18000,
  },
];

const initialSettlements = [
  {
    id: 1,
    employeeId: "EMP001",
    employeeName: "Vamsi Cherukuri",
    employeeCode: "EMP001",
    leavingDate: "2026-10-15",
    gross: 35000,
    deductions: 5000,
    net: 30000,
    status: "Draft",
    paymentStatus: "Unpaid",
  },
];

const emptyForm = {
  employeeId: "",
  settlementDate: new Date().toISOString().slice(0, 10),
  unpaidSalary: 0,
  leaveEncashment: 0,
  noticePay: 0,
  gratuity: 0,
  bonusAndIncentives: 0,
  reimbursement: 0,
  otherDues: 0,
  loanRecovery: 0,
  advanceRecovery: 0,
  noticeRecovery: 0,
  otherDeductions: 0,
  remarks: "",
};

const numericFields = [
  ["unpaidSalary", "Unpaid Salary"],
  ["leaveEncashment", "Leave Encashment"],
  ["noticePay", "Notice Pay / Compensation"],
  ["gratuity", "Gratuity"],
  ["bonusAndIncentives", "Bonus / Incentives"],
  ["reimbursement", "Approved Reimbursements"],
  ["otherDues", "Other Employee Dues"],
  ["loanRecovery", "Loan Recovery"],
  ["advanceRecovery", "Salary Advance Recovery"],
  ["noticeRecovery", "Notice Period Recovery"],
  ["otherDeductions", "Other Deductions"],
];

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function FinalSettlement() {
  const [employees] = useState(demoEmployees);
  const [settlements, setSettlements] = useState(initialSettlements);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [message, setMessage] = useState("");

  const selectedEmployee = employees.find(
    (employee) => employee.id === form.employeeId
  );

  const totals = useMemo(() => {
    const earnings = numericFields
      .slice(0, 7)
      .reduce((sum, [field]) => sum + (Number(form[field]) || 0), 0);

    const deductions = numericFields
      .slice(7)
      .reduce((sum, [field]) => sum + (Number(form[field]) || 0), 0);

    return {
      earnings,
      deductions,
      net: earnings - deductions,
    };
  }, [form]);

  const filteredSettlements = settlements.filter((item) => {
    const query = search.toLowerCase();

    const matchesSearch =
      item.employeeName.toLowerCase().includes(query) ||
      item.employeeCode.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "All" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const draftCount = settlements.filter(
    (item) => item.status === "Draft"
  ).length;

  const reviewCount = settlements.filter(
    (item) => item.status === "Under Review"
  ).length;

  const approvedCount = settlements.filter(
    (item) => item.status === "Approved"
  ).length;

  const paidCount = settlements.filter(
    (item) => item.paymentStatus === "Paid"
  ).length;

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function openNewSettlement() {
    setForm({
      ...emptyForm,
      settlementDate: new Date().toISOString().slice(0, 10),
    });
    setEditingId(null);
    setMessage("");
    setShowForm(true);
  }

  function openExistingSettlement(settlement) {
    const employee = employees.find(
      (item) => item.id === settlement.employeeId
    );

    if (!employee?.leavingDate) {
      setMessage(
        "Date of Leaving is missing in Employee Master for this employee."
      );
      return;
    }

    setForm({
      ...emptyForm,
      employeeId: settlement.employeeId,
      settlementDate:
        settlement.settlementDate ||
        new Date().toISOString().slice(0, 10),
      ...Object.fromEntries(
        numericFields.map(([field]) => [
          field,
          Number(settlement[field]) || 0,
        ])
      ),
      remarks: settlement.remarks || "",
    });

    setEditingId(settlement.id);
    setShowForm(true);
    setMessage("");
  }

  function handleSave(event) {
    event.preventDefault();
    setMessage("");

    if (!selectedEmployee) {
      setMessage("Please select an employee.");
      return;
    }

    if (!selectedEmployee.leavingDate) {
      setMessage(
        "Cannot prepare settlement. Record Date of Leaving in Employee Master first."
      );
      return;
    }

    if (form.settlementDate < selectedEmployee.leavingDate) {
      setMessage(
        "The settlement preparation date cannot be earlier than the employee's leaving date."
      );
      return;
    }

    if (totals.net < 0) {
      setMessage(
        "Deductions exceed total dues. Please review the settlement amounts."
      );
      return;
    }

    const record = {
      id: editingId || Date.now(),
      employeeId: selectedEmployee.id,
      employeeName: selectedEmployee.name,
      employeeCode: selectedEmployee.code,
      department: selectedEmployee.department,
      designation: selectedEmployee.designation,
      joiningDate: selectedEmployee.joiningDate,
      leavingDate: selectedEmployee.leavingDate,
      settlementDate: form.settlementDate,
      ...Object.fromEntries(
        numericFields.map(([field]) => [
          field,
          Number(form[field]) || 0,
        ])
      ),
      gross: totals.earnings,
      deductions: totals.deductions,
      net: totals.net,
      remarks: form.remarks,
      status: "Draft",
      paymentStatus: "Unpaid",
    };

    if (editingId) {
      setSettlements((current) =>
        current.map((item) => (item.id === editingId ? record : item))
      );
      setMessage("Settlement draft updated in this screen.");
    } else {
      setSettlements((current) => [record, ...current]);
      setMessage("Settlement draft created in this screen.");
    }

    setShowForm(false);
    setEditingId(null);
  }

  function updateSettlementStatus(id, status) {
    const item = settlements.find((record) => record.id === id);
    if (!item) return;

    if (status === "Under Review" && item.status !== "Draft") {
      setMessage("Only draft settlements can be submitted for review.");
      return;
    }

    if (status === "Approved" && item.status !== "Under Review") {
      setMessage("Only settlements under review can be approved.");
      return;
    }

    if (status === "Paid" && item.status !== "Approved") {
      setMessage("Only approved settlements can be marked paid.");
      return;
    }

    setSettlements((current) =>
      current.map((record) =>
        record.id === id
          ? {
              ...record,
              status: status === "Paid" ? "Approved" : status,
              paymentStatus:
                status === "Paid" ? "Paid" : record.paymentStatus,
            }
          : record
      )
    );

    setMessage(
      status === "Paid"
        ? "Settlement marked paid in this screen."
        : `Settlement status updated to ${status}.`
    );
  }

  return (
    <div className="ffs-page">
      <div className="ffs-header">
        <div>
          <h1>Final Settlement</h1>
          <p>
            Full &amp; Final settlement for employees leaving the organisation.
          </p>
        </div>

        <button className="ffs-primary-button" onClick={openNewSettlement}>
          + New Settlement
        </button>
      </div>

      <div className="ffs-demo-notice">
        UI preview only: sample employee and settlement data is temporary.
        Records will not persist after refreshing.
      </div>

      {message && (
        <div className="ffs-message" role="status">
          {message}
        </div>
      )}

      <div className="ffs-summary-grid">
        <div className="ffs-summary-card">
          <span>Settlement Records</span>
          <strong>{settlements.length}</strong>
          <small>All settlement records</small>
        </div>

        <div className="ffs-summary-card ffs-draft-card">
          <span>Draft</span>
          <strong>{draftCount}</strong>
          <small>Being prepared</small>
        </div>

        <div className="ffs-summary-card ffs-review-card">
          <span>Under Review</span>
          <strong>{reviewCount}</strong>
          <small>Awaiting approval</small>
        </div>

        <div className="ffs-summary-card ffs-paid-card">
          <span>Paid Settlements</span>
          <strong>{paidCount}</strong>
          <small>{approvedCount} approved record(s)</small>
        </div>
      </div>

      {showForm && (
        <section className="ffs-panel">
          <div className="ffs-panel-heading">
            <div>
              <h2>
                {editingId ? "Edit Settlement Draft" : "Prepare Settlement"}
              </h2>
              <p>
                Employees must have a Date of Leaving recorded before settlement.
              </p>
            </div>

            <button
              type="button"
              className="ffs-secondary-button"
              onClick={() => setShowForm(false)}
            >
              Close
            </button>
          </div>

          <form onSubmit={handleSave}>
            <div className="ffs-form-grid">
              <label className="ffs-field ffs-full-width">
                Employee *
                <select
                  value={form.employeeId}
                  onChange={(event) =>
                    updateField("employeeId", event.target.value)
                  }
                  required
                >
                  <option value="">Select employee</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.code} — {employee.name}
                      {employee.leavingDate
                        ? ` (Leaving: ${formatDate(employee.leavingDate)})`
                        : " (Date of Leaving not recorded)"}
                    </option>
                  ))}
                </select>
              </label>

              {selectedEmployee && (
                <div className="ffs-employee-info ffs-full-width">
                  <div>
                    <span>Department</span>
                    <strong>{selectedEmployee.department}</strong>
                  </div>
                  <div>
                    <span>Designation</span>
                    <strong>{selectedEmployee.designation}</strong>
                  </div>
                  <div>
                    <span>Date of Joining</span>
                    <strong>{formatDate(selectedEmployee.joiningDate)}</strong>
                  </div>
                  <div>
                    <span>Date of Leaving</span>
                    <strong>
                      {selectedEmployee.leavingDate
                        ? formatDate(selectedEmployee.leavingDate)
                        : "Not recorded"}
                    </strong>
                  </div>
                </div>
              )}

              {selectedEmployee && !selectedEmployee.leavingDate && (
                <div className="ffs-blocked-notice ffs-full-width">
                  Settlement is locked for this employee. Update Date of
                  Leaving in Employee Master first.
                </div>
              )}

              <label className="ffs-field">
                Settlement Preparation Date *
                <input
                  type="date"
                  value={form.settlementDate}
                  onChange={(event) =>
                    updateField("settlementDate", event.target.value)
                  }
                  required
                />
              </label>

              <label className="ffs-field">
                Monthly Salary Reference
                <input
                  value={
                    selectedEmployee
                      ? money(selectedEmployee.monthlySalary)
                      : "Select employee"
                  }
                  readOnly
                />
              </label>
            </div>

            <div className="ffs-calculation-section">
              <h3>Employee Dues / Earnings</h3>
              <p>
                Enter verified amounts. Payroll proration and leave encashment
                calculations will be integrated later.
              </p>

              <div className="ffs-form-grid">
                {numericFields.slice(0, 7).map(([field, label]) => (
                  <label className="ffs-field" key={field}>
                    {label}
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form[field]}
                      onChange={(event) =>
                        updateField(field, event.target.value)
                      }
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="ffs-calculation-section">
              <h3>Deductions / Recoveries</h3>
              <p>
                Record verified outstanding amounts supported by employee
                and payroll records.
              </p>

              <div className="ffs-form-grid">
                {numericFields.slice(7).map(([field, label]) => (
                  <label className="ffs-field" key={field}>
                    {label}
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form[field]}
                      onChange={(event) =>
                        updateField(field, event.target.value)
                      }
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="ffs-totals-grid">
              <div>
                <span>Total Employee Dues</span>
                <strong>{money(totals.earnings)}</strong>
              </div>

              <div>
                <span>Total Deductions</span>
                <strong>{money(totals.deductions)}</strong>
              </div>

              <div className="ffs-net-total">
                <span>Net Settlement Payable</span>
                <strong>{money(totals.net)}</strong>
              </div>
            </div>

            <label className="ffs-field ffs-remarks-field">
              Remarks / Approval Notes
              <textarea
                rows="3"
                value={form.remarks}
                onChange={(event) =>
                  updateField("remarks", event.target.value)
                }
                placeholder="Enter supporting notes or observations"
              />
            </label>

            <div className="ffs-form-footer">
              <button
                type="button"
                className="ffs-secondary-button"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="ffs-primary-button"
                disabled={!selectedEmployee?.leavingDate}
              >
                Save Settlement Draft
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="ffs-panel">
        <div className="ffs-panel-heading">
          <div>
            <h2>Settlement Register</h2>
            <p>Track settlement preparation, approval and payment.</p>
          </div>

          <span className="ffs-record-count">
            {filteredSettlements.length} record(s)
          </span>
        </div>

        <div className="ffs-filters">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search employee name or code..."
            aria-label="Search settlements"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter settlement status"
          >
            <option value="All">All statuses</option>
            <option value="Draft">Draft</option>
            <option value="Under Review">Under Review</option>
            <option value="Approved">Approved</option>
          </select>
        </div>

        <div className="ffs-table-wrapper">
          <table className="ffs-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Last Working Day</th>
                <th>Gross Dues</th>
                <th>Deductions</th>
                <th>Net Payable</th>
                <th>Approval Status</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredSettlements.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.employeeName}</strong>
                    <small>{item.employeeCode}</small>
                  </td>

                  <td>{formatDate(item.leavingDate)}</td>
                  <td>{money(item.gross)}</td>
                  <td>{money(item.deductions)}</td>
                  <td className="ffs-net-cell">{money(item.net)}</td>

                  <td>
                    <span
                      className={`ffs-status ffs-status-${item.status
                        .toLowerCase()
                        .replaceAll(" ", "-")}`}
                    >
                      {item.status}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`ffs-payment-status ${
                        item.paymentStatus === "Paid"
                          ? "ffs-payment-paid"
                          : ""
                      }`}
                    >
                      {item.paymentStatus}
                    </span>
                  </td>

                  <td>
                    <div className="ffs-row-actions">
                      <button
                        className="ffs-secondary-button"
                        onClick={() => openExistingSettlement(item)}
                      >
                        View / Edit
                      </button>

                      {item.status === "Draft" && (
                        <button
                          className="ffs-action-button"
                          onClick={() =>
                            updateSettlementStatus(item.id, "Under Review")
                          }
                        >
                          Submit
                        </button>
                      )}

                      {item.status === "Under Review" && (
                        <button
                          className="ffs-action-button"
                          onClick={() =>
                            updateSettlementStatus(item.id, "Approved")
                          }
                        >
                          Approve
                        </button>
                      )}

                      {item.status === "Approved" &&
                        item.paymentStatus !== "Paid" && (
                          <button
                            className="ffs-action-button"
                            onClick={() =>
                              updateSettlementStatus(item.id, "Paid")
                            }
                          >
                            Mark Paid
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredSettlements.length === 0 && (
                <tr>
                  <td colSpan="8" className="ffs-empty-state">
                    No settlements match your search or status filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ffs-panel ffs-guidance-panel">
        <h2>Settlement Controls</h2>
        <ul>
          <li>
            Record Date of Leaving in Employee Master before preparing a
            settlement.
          </li>
          <li>
            Keep approval and payment as separate steps.
          </li>
          <li>
            Verify gratuity eligibility and applicable rules before entering
            a gratuity amount.
          </li>
          <li>
            Reconcile the settlement with payroll, leave balances, advances,
            loans and approved reimbursements.
          </li>
        </ul>
      </section>
    </div>
  );
}
