import { useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiDownload,
  FiEdit2,
  FiEye,
  FiFilter,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiCreditCard,
  FiX,
} from "react-icons/fi";
import "../../css/hr/EmployeeLoansAdvances.css";

const initialLoans = [
  {
    id: "LOAN-1001",
    employee: "Arun Kumar",
    employeeCode: "EMP001",
    department: "Accounts",
    loanType: "Salary Advance",
    principal: 15000,
    tenure: 3,
    installment: 5000,
    recovered: 5000,
    applicationDate: "2026-08-05",
    disbursementDate: "2026-08-10",
    startDate: "2026-09-01",
    status: "Disbursed",
    approver: "Finance Manager",
    reason: "Emergency family expenses",
    repayments: [
      { date: "2026-10-05", amount: 5000, remarks: "October instalment" },
    ],
  },
  {
    id: "LOAN-1002",
    employee: "Priya Sharma",
    employeeCode: "EMP002",
    department: "Human Resources",
    loanType: "Employee Loan",
    principal: 60000,
    tenure: 12,
    installment: 5000,
    recovered: 10000,
    applicationDate: "2026-07-12",
    disbursementDate: "2026-07-20",
    startDate: "2026-08-01",
    status: "Disbursed",
    approver: "HR Manager",
    reason: "Education expenses",
    repayments: [
      { date: "2026-09-05", amount: 5000, remarks: "September instalment" },
      { date: "2026-10-05", amount: 5000, remarks: "October instalment" },
    ],
  },
  {
    id: "LOAN-1003",
    employee: "Ravi Prasad",
    employeeCode: "EMP003",
    department: "Operations",
    loanType: "Salary Advance",
    principal: 10000,
    tenure: 2,
    installment: 5000,
    recovered: 0,
    applicationDate: "2026-10-10",
    disbursementDate: "",
    startDate: "",
    status: "Pending",
    approver: "Operations Manager",
    reason: "Unexpected personal expense",
    repayments: [],
  },
  {
    id: "LOAN-1004",
    employee: "Meena Reddy",
    employeeCode: "EMP004",
    department: "Sales",
    loanType: "Employee Loan",
    principal: 40000,
    tenure: 10,
    installment: 4000,
    recovered: 0,
    applicationDate: "2026-10-08",
    disbursementDate: "",
    startDate: "",
    status: "Approved",
    approver: "Sales Manager",
    reason: "Medical and family expenses",
    repayments: [],
  },
  {
    id: "LOAN-1005",
    employee: "Suresh Babu",
    employeeCode: "EMP005",
    department: "Accounts",
    loanType: "Salary Advance",
    principal: 8000,
    tenure: 2,
    installment: 4000,
    recovered: 0,
    applicationDate: "2026-09-18",
    disbursementDate: "",
    startDate: "",
    status: "Rejected",
    approver: "Finance Manager",
    reason: "Personal expense",
    rejectionReason: "Please provide additional supporting details.",
    repayments: [],
  },
];

const loanTypes = ["Salary Advance", "Employee Loan"];
const statuses = ["Pending", "Approved", "Disbursed", "Rejected", "Closed"];

const emptyForm = {
  employee: "",
  employeeCode: "",
  department: "",
  loanType: "Salary Advance",
  principal: "",
  tenure: 3,
  applicationDate: new Date().toISOString().slice(0, 10),
  approver: "",
  reason: "",
  rejectionReason: "",
};

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const statusClass = (status) =>
  status.toLowerCase().replace(/\s+/g, "-");

function StatusBadge({ status }) {
  return (
    <span className={`ela-status ela-status-${statusClass(status)}`}>
      {status}
    </span>
  );
}

function SummaryCard({ icon: Icon, color, label, value, note }) {
  return (
    <div className="ela-summary-card">
      <div className={`ela-summary-icon ela-icon-${color}`}>
        <Icon />
      </div>
      <div className="ela-summary-label">{label}</div>
      <div className="ela-summary-value">{value}</div>
      <div className="ela-summary-note">{note}</div>
    </div>
  );
}

export default function EmployeeLoansAdvances() {
  const [loans, setLoans] = useState(initialLoans);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [departmentFilter, setDepartmentFilter] = useState("All Departments");
  const [modal, setModal] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [repaymentForm, setRepaymentForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    amount: "",
    remarks: "",
  });
  const [disbursementForm, setDisbursementForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    startDate: new Date().toISOString().slice(0, 10),
  });

  const departments = useMemo(
    () => [...new Set(loans.map((loan) => loan.department).filter(Boolean))],
    [loans]
  );

  const filteredLoans = useMemo(() => {
    const query = search.trim().toLowerCase();

    return loans.filter((loan) => {
      const matchesSearch =
        !query ||
        loan.id.toLowerCase().includes(query) ||
        loan.employee.toLowerCase().includes(query) ||
        loan.employeeCode.toLowerCase().includes(query) ||
        loan.reason.toLowerCase().includes(query);

      return (
        matchesSearch &&
        (statusFilter === "All Statuses" || loan.status === statusFilter) &&
        (typeFilter === "All Types" || loan.loanType === typeFilter) &&
        (departmentFilter === "All Departments" ||
          loan.department === departmentFilter)
      );
    });
  }, [loans, search, statusFilter, typeFilter, departmentFilter]);

  const outstanding = loans.reduce((sum, loan) => {
    if (loan.status !== "Disbursed") return sum;
    return sum + Math.max(0, Number(loan.principal) - Number(loan.recovered));
  }, 0);

  const pendingCount = loans.filter(
    (loan) => loan.status === "Pending"
  ).length;

  const approvedAmount = loans
    .filter((loan) => loan.status === "Approved")
    .reduce((sum, loan) => sum + Number(loan.principal), 0);

  const recoveredAmount = loans.reduce(
    (sum, loan) => sum + Number(loan.recovered || 0),
    0
  );

  const selectedLoan = loans.find((loan) => loan.id === selectedId);

  function updateForm(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  function openNewLoan() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setModal("form");
  }

  function openEditLoan(loan) {
    if (!["Pending", "Rejected"].includes(loan.status)) {
      window.alert("Only pending or rejected applications can be edited.");
      return;
    }

    setEditingId(loan.id);
    setForm({
      employee: loan.employee,
      employeeCode: loan.employeeCode,
      department: loan.department,
      loanType: loan.loanType,
      principal: String(loan.principal),
      tenure: String(loan.tenure),
      applicationDate: loan.applicationDate,
      approver: loan.approver,
      reason: loan.reason,
      rejectionReason: loan.rejectionReason || "",
    });
    setModal("form");
  }

  function saveLoan(event) {
    event.preventDefault();

    const principal = Number(form.principal);
    const tenure = Number(form.tenure);

    if (!Number.isFinite(principal) || principal <= 0) {
      window.alert("Enter a loan amount greater than zero.");
      return;
    }

    if (!Number.isInteger(tenure) || tenure < 1 || tenure > 120) {
      window.alert("Enter a repayment tenure between 1 and 120 months.");
      return;
    }

    const loan = {
      employee: form.employee.trim(),
      employeeCode: form.employeeCode.trim(),
      department: form.department.trim(),
      loanType: form.loanType,
      principal,
      tenure,
      installment: Math.round((principal / tenure) * 100) / 100,
      applicationDate: form.applicationDate,
      approver: form.approver.trim(),
      reason: form.reason.trim(),
      rejectionReason: "",
      status: "Pending",
    };

    if (editingId) {
      setLoans((previous) =>
        previous.map((item) =>
          item.id === editingId
            ? { ...item, ...loan, status: "Pending" }
            : item
        )
      );
    } else {
      setLoans((previous) => [
        {
          ...loan,
          id: `LOAN-${Date.now().toString().slice(-7)}`,
          recovered: 0,
          disbursementDate: "",
          startDate: "",
          repayments: [],
        },
        ...previous,
      ]);
    }

    setModal("");
  }

  function approveLoan(id) {
    setLoans((previous) =>
      previous.map((loan) =>
        loan.id === id
          ? { ...loan, status: "Approved", rejectionReason: "" }
          : loan
      )
    );
  }

  function rejectLoan(id) {
    const reason = window.prompt("Enter the reason for rejection:");
    if (!reason?.trim()) return;

    setLoans((previous) =>
      previous.map((loan) =>
        loan.id === id
          ? { ...loan, status: "Rejected", rejectionReason: reason.trim() }
          : loan
      )
    );
  }

  function openDisbursement(loan) {
    setSelectedId(loan.id);
    setDisbursementForm({
      date: new Date().toISOString().slice(0, 10),
      startDate: new Date().toISOString().slice(0, 10),
    });
    setModal("disbursement");
  }

  function saveDisbursement(event) {
    event.preventDefault();

    const loan = loans.find((item) => item.id === selectedId);
    if (!loan || loan.status !== "Approved") return;

    if (disbursementForm.startDate < disbursementForm.date) {
      window.alert("The repayment start date cannot precede disbursement.");
      return;
    }

    setLoans((previous) =>
      previous.map((item) =>
        item.id === selectedId
          ? {
              ...item,
              status: "Disbursed",
              disbursementDate: disbursementForm.date,
              startDate: disbursementForm.startDate,
            }
          : item
      )
    );

    setModal("");
  }

  function openRepayment(loan) {
    setSelectedId(loan.id);
    setRepaymentForm({
      date: new Date().toISOString().slice(0, 10),
      amount: String(loan.installment),
      remarks: "",
    });
    setModal("repayment");
  }

  function saveRepayment(event) {
    event.preventDefault();

    const loan = loans.find((item) => item.id === selectedId);
    if (!loan || loan.status !== "Disbursed") return;

    const balance = Math.max(0, loan.principal - loan.recovered);
    const amount = Number(repaymentForm.amount);

    if (!Number.isFinite(amount) || amount <= 0 || amount > balance) {
      window.alert(`Enter an amount greater than zero and no more than ${money(balance)}.`);
      return;
    }

    if (!repaymentForm.date) {
      window.alert("Select the repayment date.");
      return;
    }

    const newRecovered = Math.round((loan.recovered + amount) * 100) / 100;
    const fullyRepaid = newRecovered >= loan.principal;

    setLoans((previous) =>
      previous.map((item) =>
        item.id === selectedId
          ? {
              ...item,
              recovered: newRecovered,
              status: fullyRepaid ? "Closed" : "Disbursed",
              repayments: [
                ...(item.repayments || []),
                {
                  date: repaymentForm.date,
                  amount,
                  remarks: repaymentForm.remarks.trim(),
                },
              ],
            }
          : item
      )
    );

    setModal("");
  }

  function deleteLoan(id) {
    const loan = loans.find((item) => item.id === id);
    if (!loan || !["Pending", "Rejected"].includes(loan.status)) {
      window.alert("Only pending or rejected applications can be deleted.");
      return;
    }

    if (!window.confirm(`Delete application ${id}?`)) return;

    setLoans((previous) => previous.filter((item) => item.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function exportLoans() {
    const headers = [
      "Loan ID",
      "Employee",
      "Employee Code",
      "Department",
      "Loan Type",
      "Principal INR",
      "Tenure Months",
      "Monthly Instalment INR",
      "Recovered INR",
      "Outstanding INR",
      "Application Date",
      "Disbursement Date",
      "Repayment Start Date",
      "Status",
      "Approver",
      "Reason",
    ];

    const rows = filteredLoans.map((loan) => [
      loan.id,
      loan.employee,
      loan.employeeCode,
      loan.department,
      loan.loanType,
      loan.principal,
      loan.tenure,
      loan.installment,
      loan.recovered,
      Math.max(0, loan.principal - loan.recovered),
      loan.applicationDate,
      loan.disbursementDate,
      loan.startDate,
      loan.status,
      loan.approver,
      loan.reason,
    ]);

    const escapeCsv = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "employee-loans-advances.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function resetFilters() {
    setSearch("");
    setStatusFilter("All Statuses");
    setTypeFilter("All Types");
    setDepartmentFilter("All Departments");
  }

  return (
    <div className="ela-page">
      <header className="ela-header">
        <div>
          <div className="ela-eyebrow">HUMAN RESOURCES / EMPLOYEE FINANCE</div>
          <h1>Employee Loans & Advances</h1>
          <p>Manage employee funding requests, disbursements and recoveries.</p>
        </div>
        <div className="ela-header-actions">
          <button
            type="button"
            className="ela-btn ela-btn-secondary"
            onClick={exportLoans}
          >
            <FiDownload /> Export CSV
          </button>
          <button
            type="button"
            className="ela-btn ela-btn-primary"
            onClick={openNewLoan}
          >
            <FiPlus /> New Application
          </button>
        </div>
      </header>

      <div className="ela-notice">
        <FiCreditCard />
        <span>
          <strong>Prototype mode:</strong> applications and repayments use
          temporary browser state. No real disbursement or payroll deduction
          takes place.
        </span>
      </div>

      <section className="ela-summary-grid">
        <SummaryCard
          icon={FiDollarSign}
          color="blue"
          label="Outstanding Balance"
          value={money(outstanding)}
          note="Disbursed loans only"
        />
        <SummaryCard
          icon={FiClock}
          color="orange"
          label="Pending Applications"
          value={pendingCount}
          note="Awaiting review"
        />
        <SummaryCard
          icon={FiCheckCircle}
          color="purple"
          label="Approved · Not Disbursed"
          value={money(approvedAmount)}
          note="Awaiting disbursement"
        />
        <SummaryCard
          icon={FiCreditCard}
          color="green"
          label="Total Recovered"
          value={money(recoveredAmount)}
          note="Recorded repayments"
        />
      </section>

      <section className="ela-panel">
        <div className="ela-panel-header">
          <div>
            <h2>Loan Applications</h2>
            <p>Review applications and track repayments by employee.</p>
          </div>
          <span className="ela-record-count">
            {filteredLoans.length} records
          </span>
        </div>

        <div className="ela-filters">
          <div className="ela-search">
            <FiSearch />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search employee, loan ID or reason..."
            />
          </div>

          <label className="ela-filter">
            <FiFilter />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by status"
            >
              <option>All Statuses</option>
              {statuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>

          <label className="ela-filter">
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              aria-label="Filter by loan type"
            >
              <option>All Types</option>
              {loanTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>

          <label className="ela-filter">
            <select
              value={departmentFilter}
              onChange={(event) => setDepartmentFilter(event.target.value)}
              aria-label="Filter by department"
            >
              <option>All Departments</option>
              {departments.map((department) => (
                <option key={department}>{department}</option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="ela-reset-btn"
            onClick={resetFilters}
          >
            Reset
          </button>
        </div>

        <div className="ela-table-wrap">
          <table className="ela-table">
            <thead>
              <tr>
                <th>EMPLOYEE / APPLICATION</th>
                <th>LOAN TYPE</th>
                <th>PRINCIPAL</th>
                <th>INSTALMENT</th>
                <th>OUTSTANDING</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredLoans.map((loan) => {
                const balance = Math.max(
                  0,
                  Number(loan.principal) - Number(loan.recovered)
                );

                return (
                  <tr key={loan.id}>
                    <td>
                      <div className="ela-employee-cell">
                        <div className="ela-avatar">
                          {loan.employee
                            .split(" ")
                            .map((part) => part[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <strong>{loan.employee}</strong>
                          <span>{loan.employeeCode}</span>
                          <small>{loan.id}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="ela-type">{loan.loanType}</span>
                      <small className="ela-cell-subtitle">
                        {loan.department}
                      </small>
                    </td>
                    <td>
                      <strong className="ela-money">
                        {money(loan.principal)}
                      </strong>
                    </td>
                    <td>{money(loan.installment)}</td>
                    <td>
                      <strong className="ela-money">
                        {money(balance)}
                      </strong>
                    </td>
                    <td><StatusBadge status={loan.status} /></td>
                    <td>
                      <div className="ela-actions">
                        <button
                          type="button"
                          title="View loan"
                          aria-label={`View ${loan.id}`}
                          onClick={() => setSelectedId(loan.id)}
                        >
                          <FiEye />
                        </button>

                        {["Pending", "Rejected"].includes(loan.status) && (
                          <>
                            <button
                              type="button"
                              title="Edit application"
                              aria-label={`Edit ${loan.id}`}
                              onClick={() => openEditLoan(loan)}
                            >
                              <FiEdit2 />
                            </button>
                            {loan.status === "Pending" && (
                              <>
                                <button
                                  type="button"
                                  className="ela-approve-action"
                                  title="Approve"
                                  aria-label={`Approve ${loan.id}`}
                                  onClick={() => approveLoan(loan.id)}
                                >
                                  <FiCheckCircle />
                                </button>
                                <button
                                  type="button"
                                  className="ela-delete-action"
                                  title="Reject"
                                  aria-label={`Reject ${loan.id}`}
                                  onClick={() => rejectLoan(loan.id)}
                                >
                                  <FiX />
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              className="ela-delete-action"
                              title="Delete application"
                              aria-label={`Delete ${loan.id}`}
                              onClick={() => deleteLoan(loan.id)}
                            >
                              <FiTrash2 />
                            </button>
                          </>
                        )}

                        {loan.status === "Approved" && (
                          <button
                            type="button"
                            className="ela-approve-action"
                            title="Record disbursement"
                            aria-label={`Disburse ${loan.id}`}
                            onClick={() => openDisbursement(loan)}
                          >
                            <FiDollarSign />
                          </button>
                        )}

                        {loan.status === "Disbursed" && (
                          <button
                            type="button"
                            className="ela-approve-action"
                            title="Record repayment"
                            aria-label={`Record repayment for ${loan.id}`}
                            onClick={() => openRepayment(loan)}
                          >
                            <FiCreditCard />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredLoans.length === 0 && (
                <tr>
                  <td colSpan="7" className="ela-empty">
                    No loan applications match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="ela-table-footer">
          Showing {filteredLoans.length} of {loans.length} applications
        </footer>
      </section>

      {modal === "form" && (
        <div
          className="ela-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setModal("");
          }}
        >
          <section className="ela-modal" role="dialog" aria-modal="true">
            <header className="ela-modal-header">
              <div>
                <h2>{editingId ? "Edit Application" : "New Loan Application"}</h2>
                <p>Enter the employee's funding request and repayment terms.</p>
              </div>
              <button
                type="button"
                className="ela-icon-btn"
                onClick={() => setModal("")}
                aria-label="Close form"
              >
                <FiX />
              </button>
            </header>

            <form onSubmit={saveLoan}>
              <div className="ela-form-grid">
                <label>
                  Employee Name *
                  <input
                    required
                    value={form.employee}
                    onChange={(event) => updateForm("employee", event.target.value)}
                    placeholder="Employee name"
                  />
                </label>

                <label>
                  Employee ID *
                  <input
                    required
                    value={form.employeeCode}
                    onChange={(event) => updateForm("employeeCode", event.target.value)}
                    placeholder="e.g. EMP006"
                  />
                </label>

                <label>
                  Department *
                  <input
                    required
                    value={form.department}
                    onChange={(event) => updateForm("department", event.target.value)}
                    placeholder="Department"
                  />
                </label>

                <label>
                  Loan Type *
                  <select
                    required
                    value={form.loanType}
                    onChange={(event) => updateForm("loanType", event.target.value)}
                  >
                    {loanTypes.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Requested Amount (INR) *
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.principal}
                    onChange={(event) => updateForm("principal", event.target.value)}
                    placeholder="0.00"
                  />
                </label>

                <label>
                  Repayment Tenure (Months) *
                  <input
                    required
                    type="number"
                    min="1"
                    max="120"
                    step="1"
                    value={form.tenure}
                    onChange={(event) => updateForm("tenure", event.target.value)}
                  />
                </label>

                <label>
                  Application Date *
                  <input
                    required
                    type="date"
                    value={form.applicationDate}
                    onChange={(event) => updateForm("applicationDate", event.target.value)}
                  />
                </label>

                <label>
                  Approving Manager
                  <input
                    value={form.approver}
                    onChange={(event) => updateForm("approver", event.target.value)}
                    placeholder="Manager name"
                  />
                </label>

                <div className="ela-installment-preview ela-form-full">
                  <span>Estimated monthly instalment</span>
                  <strong>
                    {money(
                      Number(form.principal) > 0 && Number(form.tenure) > 0
                        ? Number(form.principal) / Number(form.tenure)
                        : 0
                    )}
                  </strong>
                  <small>
                    Illustrative principal-only calculation. Interest, fees and
                    company policy are not included.
                  </small>
                </div>

                <label className="ela-form-full">
                  Reason for Loan / Advance *
                  <textarea
                    required
                    rows="3"
                    value={form.reason}
                    onChange={(event) => updateForm("reason", event.target.value)}
                    placeholder="Explain the reason for the request"
                  />
                </label>

                {editingId && form.rejectionReason && (
                  <div className="ela-rejection-info ela-form-full">
                    <strong>Previous rejection reason</strong>
                    <p>{form.rejectionReason}</p>
                  </div>
                )}
              </div>

              <footer className="ela-modal-footer">
                <button
                  type="button"
                  className="ela-btn ela-btn-secondary"
                  onClick={() => setModal("")}
                >
                  Cancel
                </button>
                <button type="submit" className="ela-btn ela-btn-primary">
                  <FiCheckCircle /> Submit Application
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {modal === "disbursement" && (
        <div className="ela-modal-backdrop">
          <section className="ela-modal ela-modal-small" role="dialog" aria-modal="true">
            <header className="ela-modal-header">
              <div>
                <h2>Record Disbursement</h2>
                <p>Record the dates for the approved application.</p>
              </div>
              <button
                type="button"
                className="ela-icon-btn"
                onClick={() => setModal("")}
                aria-label="Close"
              >
                <FiX />
              </button>
            </header>

            <form onSubmit={saveDisbursement}>
              <div className="ela-form-grid">
                <label className="ela-form-full">
                  Disbursement Date *
                  <input
                    required
                    type="date"
                    value={disbursementForm.date}
                    onChange={(event) =>
                      setDisbursementForm((previous) => ({
                        ...previous,
                        date: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="ela-form-full">
                  First Repayment Date *
                  <input
                    required
                    type="date"
                    value={disbursementForm.startDate}
                    min={disbursementForm.date}
                    onChange={(event) =>
                      setDisbursementForm((previous) => ({
                        ...previous,
                        startDate: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
              <footer className="ela-modal-footer">
                <button
                  type="button"
                  className="ela-btn ela-btn-secondary"
                  onClick={() => setModal("")}
                >
                  Cancel
                </button>
                <button type="submit" className="ela-btn ela-btn-primary">
                  Confirm Disbursement
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {modal === "repayment" && (
        <div className="ela-modal-backdrop">
          <section className="ela-modal ela-modal-small" role="dialog" aria-modal="true">
            <header className="ela-modal-header">
              <div>
                <h2>Record Repayment</h2>
                <p>Record a repayment against the outstanding balance.</p>
              </div>
              <button
                type="button"
                className="ela-icon-btn"
                onClick={() => setModal("")}
                aria-label="Close"
              >
                <FiX />
              </button>
            </header>

            <form onSubmit={saveRepayment}>
              <div className="ela-form-grid">
                <label className="ela-form-full">
                  Repayment Date *
                  <input
                    required
                    type="date"
                    value={repaymentForm.date}
                    onChange={(event) =>
                      setRepaymentForm((previous) => ({
                        ...previous,
                        date: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="ela-form-full">
                  Repayment Amount (INR) *
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={repaymentForm.amount}
                    onChange={(event) =>
                      setRepaymentForm((previous) => ({
                        ...previous,
                        amount: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="ela-form-full">
                  Reference / Remarks
                  <textarea
                    rows="2"
                    value={repaymentForm.remarks}
                    onChange={(event) =>
                      setRepaymentForm((previous) => ({
                        ...previous,
                        remarks: event.target.value,
                      }))
                    }
                    placeholder="Optional repayment reference"
                  />
                </label>
              </div>
              <footer className="ela-modal-footer">
                <button
                  type="button"
                  className="ela-btn ela-btn-secondary"
                  onClick={() => setModal("")}
                >
                  Cancel
                </button>
                <button type="submit" className="ela-btn ela-btn-primary">
                  Record Repayment
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {selectedLoan && !modal && (
        <div
          className="ela-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedId(null);
          }}
        >
          <section className="ela-modal ela-detail-modal" role="dialog" aria-modal="true">
            <header className="ela-modal-header">
              <div>
                <h2>Loan Details</h2>
                <p>{selectedLoan.id}</p>
              </div>
              <button
                type="button"
                className="ela-icon-btn"
                onClick={() => setSelectedId(null)}
                aria-label="Close details"
              >
                <FiX />
              </button>
            </header>

            <div className="ela-detail-hero">
              <div className="ela-avatar ela-avatar-large">
                {selectedLoan.employee
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="ela-detail-employee">
                <h3>{selectedLoan.employee}</h3>
                <p>
                  {selectedLoan.employeeCode} · {selectedLoan.department}
                </p>
                <StatusBadge status={selectedLoan.status} />
              </div>
              <strong className="ela-detail-amount">
                {money(selectedLoan.principal)}
              </strong>
            </div>

            <div className="ela-detail-grid">
              <div><span>Loan Type</span><strong>{selectedLoan.loanType}</strong></div>
              <div><span>Tenure</span><strong>{selectedLoan.tenure} months</strong></div>
              <div><span>Monthly Instalment</span><strong>{money(selectedLoan.installment)}</strong></div>
              <div><span>Total Recovered</span><strong>{money(selectedLoan.recovered)}</strong></div>
              <div><span>Outstanding Balance</span><strong>{money(Math.max(0, selectedLoan.principal - selectedLoan.recovered))}</strong></div>
              <div><span>Approver</span><strong>{selectedLoan.approver || "—"}</strong></div>
              <div><span>Application Date</span><strong>{formatDate(selectedLoan.applicationDate)}</strong></div>
              <div><span>Disbursement Date</span><strong>{formatDate(selectedLoan.disbursementDate)}</strong></div>
              <div><span>Repayment Start</span><strong>{formatDate(selectedLoan.startDate)}</strong></div>
            </div>

            <div className="ela-detail-description">
              <h4>Purpose of Loan</h4>
              <p>{selectedLoan.reason || "No reason recorded."}</p>

              {selectedLoan.rejectionReason && (
                <>
                  <h4>Rejection Reason</h4>
                  <p className="ela-rejection-info">
                    {selectedLoan.rejectionReason}
                  </p>
                </>
              )}

              <h4>Repayment History</h4>
              {selectedLoan.repayments?.length ? (
                <div className="ela-table-wrap ela-repayment-wrap">
                  <table className="ela-table ela-repayment-table">
                    <thead>
                      <tr>
                        <th>DATE</th>
                        <th>AMOUNT</th>
                        <th>REMARKS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedLoan.repayments.map((repayment, index) => (
                        <tr key={`${repayment.date}-${index}`}>
                          <td>{formatDate(repayment.date)}</td>
                          <td>{money(repayment.amount)}</td>
                          <td>{repayment.remarks || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No repayments recorded.</p>
              )}
            </div>

            <footer className="ela-modal-footer ela-detail-footer">
              {selectedLoan.status === "Pending" && (
                <>
                  <button
                    type="button"
                    className="ela-btn ela-btn-danger"
                    onClick={() => rejectLoan(selectedLoan.id)}
                  >
                    <FiX /> Reject
                  </button>
                  <button
                    type="button"
                    className="ela-btn ela-btn-primary"
                    onClick={() => approveLoan(selectedLoan.id)}
                  >
                    <FiCheckCircle /> Approve
                  </button>
                </>
              )}

              {selectedLoan.status === "Approved" && (
                <button
                  type="button"
                  className="ela-btn ela-btn-primary"
                  onClick={() => openDisbursement(selectedLoan)}
                >
                  <FiDollarSign /> Disburse
                </button>
              )}

              {selectedLoan.status === "Disbursed" && (
                <button
                  type="button"
                  className="ela-btn ela-btn-primary"
                  onClick={() => openRepayment(selectedLoan)}
                >
                  <FiCreditCard /> Record Repayment
                </button>
              )}

              {["Pending", "Rejected"].includes(selectedLoan.status) && (
                <button
                  type="button"
                  className="ela-btn ela-btn-secondary"
                  onClick={() => openEditLoan(selectedLoan)}
                >
                  <FiEdit2 /> Edit
                </button>
              )}

              <button
                type="button"
                className="ela-btn ela-btn-secondary"
                onClick={() => setSelectedId(null)}
              >
                Close
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}
