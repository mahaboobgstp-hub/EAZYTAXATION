
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
  FiUploadCloud,
  FiCreditCard,
  FiX,
} from "react-icons/fi";
import "../../css/hr/ExpenseReimbursement.css";

const initialClaims = [
  {
    id: "EXP-1001",
    employee: "Arun Kumar",
    employeeCode: "EMP001",
    department: "Accounts",
    category: "Travel",
    expenseDate: "2026-10-04",
    submittedDate: "2026-10-05",
    amount: 1850,
    description: "Client office visit and local transportation",
    paymentMethod: "Personal Payment",
    status: "Pending",
    approver: "Finance Manager",
    rejectionReason: "",
    paymentDate: "",
  },
  {
    id: "EXP-1002",
    employee: "Priya Sharma",
    employeeCode: "EMP002",
    department: "Human Resources",
    category: "Office Supplies",
    expenseDate: "2026-10-02",
    submittedDate: "2026-10-03",
    amount: 2450,
    description: "Stationery and office supplies",
    paymentMethod: "Personal Payment",
    status: "Approved",
    approver: "HR Manager",
    rejectionReason: "",
    paymentDate: "",
  },
  {
    id: "EXP-1003",
    employee: "Ravi Prasad",
    employeeCode: "EMP003",
    department: "Operations",
    category: "Travel",
    expenseDate: "2026-09-27",
    submittedDate: "2026-09-28",
    amount: 3200,
    description: "Business travel expenses",
    paymentMethod: "Personal Payment",
    status: "Paid",
    approver: "Operations Manager",
    rejectionReason: "",
    paymentDate: "2026-10-06",
  },
  {
    id: "EXP-1004",
    employee: "Meena Reddy",
    employeeCode: "EMP004",
    department: "Sales",
    category: "Meals",
    expenseDate: "2026-10-06",
    submittedDate: "2026-10-07",
    amount: 850,
    description: "Meals during customer meeting",
    paymentMethod: "Personal Payment",
    status: "Rejected",
    approver: "Sales Manager",
    rejectionReason: "Please provide the itemised bill.",
    paymentDate: "",
  },
  {
    id: "EXP-1005",
    employee: "Suresh Babu",
    employeeCode: "EMP005",
    department: "Accounts",
    category: "Communication",
    expenseDate: "2026-10-08",
    submittedDate: "2026-10-09",
    amount: 699,
    description: "Business calls and mobile data",
    paymentMethod: "Personal Payment",
    status: "Pending",
    approver: "Finance Manager",
    rejectionReason: "",
    paymentDate: "",
  },
];

const categories = [
  "Travel",
  "Meals",
  "Accommodation",
  "Office Supplies",
  "Communication",
  "Fuel",
  "Client Entertainment",
  "Training",
  "Medical",
  "Other",
];

const statuses = ["Pending", "Approved", "Rejected", "Paid"];

const emptyForm = {
  employee: "",
  employeeCode: "",
  department: "",
  category: "Travel",
  expenseDate: "",
  amount: "",
  description: "",
  paymentMethod: "Personal Payment",
  approver: "",
  status: "Pending",
  rejectionReason: "",
  paymentDate: "",
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
    <span className={`er-status er-status-${statusClass(status)}`}>
      {status}
    </span>
  );
}

function SummaryCard({ icon: Icon, label, value, note, color }) {
  return (
    <div className="er-summary-card">
      <div className={`er-summary-icon er-icon-${color}`}>
        <Icon />
      </div>
      <div className="er-summary-label">{label}</div>
      <div className="er-summary-value">{value}</div>
      <div className="er-summary-note">{note}</div>
    </div>
  );
}

export default function ExpenseReimbursement() {
  const [claims, setClaims] = useState(initialClaims);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [departmentFilter, setDepartmentFilter] =
    useState("All Departments");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [modal, setModal] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [receiptName, setReceiptName] = useState("");
  const [receiptError, setReceiptError] = useState("");

  const departments = useMemo(
    () => [...new Set(claims.map((claim) => claim.department).filter(Boolean))],
    [claims]
  );

  const filteredClaims = useMemo(() => {
    const query = search.trim().toLowerCase();

    return claims.filter((claim) => {
      const matchesSearch =
        !query ||
        claim.id.toLowerCase().includes(query) ||
        claim.employee.toLowerCase().includes(query) ||
        claim.employeeCode.toLowerCase().includes(query) ||
        claim.description.toLowerCase().includes(query);

      return (
        matchesSearch &&
        (statusFilter === "All Statuses" || claim.status === statusFilter) &&
        (categoryFilter === "All Categories" ||
          claim.category === categoryFilter) &&
        (departmentFilter === "All Departments" ||
          claim.department === departmentFilter) &&
        (!dateFrom || claim.expenseDate >= dateFrom) &&
        (!dateTo || claim.expenseDate <= dateTo)
      );
    });
  }, [
    claims,
    search,
    statusFilter,
    categoryFilter,
    departmentFilter,
    dateFrom,
    dateTo,
  ]);

  const pendingClaims = claims.filter(
    (claim) => claim.status === "Pending"
  );
  const approvedClaims = claims.filter(
    (claim) => claim.status === "Approved"
  );
  const paidClaims = claims.filter((claim) => claim.status === "Paid");

  const pendingAmount = pendingClaims.reduce(
    (sum, claim) => sum + Number(claim.amount),
    0
  );
  const approvedAmount = approvedClaims.reduce(
    (sum, claim) => sum + Number(claim.amount),
    0
  );
  const paidAmount = paidClaims.reduce(
    (sum, claim) => sum + Number(claim.amount),
    0
  );

  const selectedClaim = claims.find((claim) => claim.id === selectedId);

  function updateForm(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  function openNewClaim() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setReceiptName("");
    setReceiptError("");
    setModal("form");
  }

  function openEditClaim(claim) {
    if (claim.status !== "Pending" && claim.status !== "Rejected") {
      window.alert("Only pending or rejected claims can be edited.");
      return;
    }

    setEditingId(claim.id);
    setForm({
      ...claim,
      amount: String(claim.amount),
    });
    setReceiptName("");
    setReceiptError("");
    setModal("form");
  }

  function saveClaim(event) {
    event.preventDefault();

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      window.alert("Enter a valid expense amount greater than zero.");
      return;
    }

    if (dateFrom && dateTo && dateFrom > dateTo) {
      window.alert("The start date cannot be after the end date.");
      return;
    }

    const claim = {
      ...form,
      employee: form.employee.trim(),
      employeeCode: form.employeeCode.trim(),
      department: form.department.trim(),
      approver: form.approver.trim(),
      description: form.description.trim(),
      rejectionReason:
        form.status === "Rejected" ? form.rejectionReason.trim() : "",
      paymentDate: form.status === "Paid" ? form.paymentDate : "",
      amount,
      expenseDate: form.expenseDate,
      submittedDate: editingId
        ? claims.find((item) => item.id === editingId)?.submittedDate ||
          new Date().toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
    };

    if (claim.status === "Rejected" && !claim.rejectionReason) {
      window.alert("Enter a rejection reason for a rejected claim.");
      return;
    }

    if (claim.status === "Paid" && !claim.paymentDate) {
      window.alert("Enter the reimbursement payment date.");
      return;
    }

    if (editingId) {
      setClaims((previous) =>
        previous.map((item) =>
          item.id === editingId ? { ...item, ...claim } : item
        )
      );
    } else {
      setClaims((previous) => [
        {
          ...claim,
          id: `EXP-${Date.now().toString().slice(-7)}`,
        },
        ...previous,
      ]);
    }

    setModal("");
  }

  function updateClaimStatus(id, status) {
    const existing = claims.find((claim) => claim.id === id);
    if (!existing) return;

    if (existing.status === "Paid") {
      window.alert("A paid claim cannot be changed in this prototype.");
      return;
    }

    if (status === "Paid" && existing.status !== "Approved") {
      window.alert("Only approved claims can be marked as paid.");
      return;
    }

    if (status === "Rejected") {
      const reason = window.prompt("Enter the reason for rejection:");
      if (!reason?.trim()) return;

      setClaims((previous) =>
        previous.map((claim) =>
          claim.id === id
            ? {
                ...claim,
                status,
                rejectionReason: reason.trim(),
                paymentDate: "",
              }
            : claim
        )
      );
      return;
    }

    if (status === "Paid") {
      const paymentDate = window.prompt(
        "Enter payment date (YYYY-MM-DD):",
        new Date().toISOString().slice(0, 10)
      );

      if (!paymentDate || !/^\d{4}-\d{2}-\d{2}$/.test(paymentDate)) {
        window.alert("Enter a payment date in YYYY-MM-DD format.");
        return;
      }

      const parsedDate = new Date(`${paymentDate}T00:00:00`);
      if (
        Number.isNaN(parsedDate.getTime()) ||
        parsedDate.toISOString().slice(0, 10) !== paymentDate
      ) {
        window.alert("Enter a valid calendar date.");
        return;
      }

      setClaims((previous) =>
        previous.map((claim) =>
          claim.id === id
            ? { ...claim, status, paymentDate, rejectionReason: "" }
            : claim
        )
      );
      return;
    }

    setClaims((previous) =>
      previous.map((claim) =>
        claim.id === id
          ? {
              ...claim,
              status,
              rejectionReason: "",
              paymentDate: "",
            }
          : claim
      )
    );
  }

  function deleteClaim(id) {
    const claim = claims.find((item) => item.id === id);
    if (!claim) return;

    if (claim.status !== "Pending" && claim.status !== "Rejected") {
      window.alert("Only pending or rejected claims can be deleted.");
      return;
    }

    if (!window.confirm(`Delete claim ${id}?`)) return;

    setClaims((previous) => previous.filter((item) => item.id !== id));

    if (selectedId === id) setSelectedId(null);
  }

  function exportClaims() {
    const headers = [
      "Claim ID",
      "Employee",
      "Employee Code",
      "Department",
      "Category",
      "Expense Date",
      "Submitted Date",
      "Amount INR",
      "Description",
      "Status",
      "Approver",
      "Rejection Reason",
      "Payment Date",
    ];

    const rows = filteredClaims.map((claim) => [
      claim.id,
      claim.employee,
      claim.employeeCode,
      claim.department,
      claim.category,
      claim.expenseDate,
      claim.submittedDate,
      claim.amount,
      claim.description,
      claim.status,
      claim.approver,
      claim.rejectionReason,
      claim.paymentDate,
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
    link.download = "expense-reimbursement.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function resetFilters() {
    setSearch("");
    setStatusFilter("All Statuses");
    setCategoryFilter("All Categories");
    setDepartmentFilter("All Departments");
    setDateFrom("");
    setDateTo("");
  }

  return (
    <div className="er-page">
      <header className="er-header">
        <div>
          <div className="er-eyebrow">HUMAN RESOURCES / EXPENSES</div>
          <h1>Expense Reimbursement</h1>
          <p>Manage employee expense claims, approvals and reimbursements.</p>
        </div>

        <div className="er-header-actions">
          <button
            type="button"
            className="er-btn er-btn-secondary"
            onClick={exportClaims}
          >
            <FiDownload /> Export CSV
          </button>
          <button
            type="button"
            className="er-btn er-btn-primary"
            onClick={openNewClaim}
          >
            <FiPlus /> New Expense Claim
          </button>
        </div>
      </header>

      <div className="er-prototype-notice">
        <FiWallet />
        <span>
          <strong>Prototype mode:</strong> sample records and changes are held
          in temporary browser state. Receipt selection is for UI testing only;
          files are not uploaded or stored.
        </span>
      </div>

      <section className="er-summary-grid">
        <SummaryCard
          icon={FiWallet}
          color="blue"
          label="Total Claims"
          value={claims.length}
          note="All recorded claims"
        />
        <SummaryCard
          icon={FiClock}
          color="orange"
          label="Pending Approval"
          value={pendingClaims.length}
          note={money(pendingAmount) + " awaiting review"}
        />
        <SummaryCard
          icon={FiCheckCircle}
          color="purple"
          label="Approved · Unpaid"
          value={money(approvedAmount)}
          note={`${approvedClaims.length} claims awaiting payment`}
        />
        <SummaryCard
          icon={FiDollarSign}
          color="green"
          label="Reimbursed"
          value={money(paidAmount)}
          note={`${paidClaims.length} claims marked as paid`}
        />
      </section>

      <section className="er-panel">
        <div className="er-panel-header">
          <div>
            <h2>Expense Claims</h2>
            <p>Review employee submissions and track reimbursement status.</p>
          </div>
          <span className="er-record-count">
            {filteredClaims.length} records
          </span>
        </div>

        <div className="er-filters">
          <div className="er-search">
            <FiSearch />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search claim, employee or description..."
            />
          </div>

          <label className="er-filter">
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

          <label className="er-filter">
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              aria-label="Filter by category"
            >
              <option>All Categories</option>
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>

          <label className="er-filter">
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

          <label className="er-date-filter">
            <span>From</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              aria-label="Expense date from"
            />
          </label>

          <label className="er-date-filter">
            <span>To</span>
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              aria-label="Expense date to"
            />
          </label>

          <button
            type="button"
            className="er-reset-btn"
            onClick={resetFilters}
          >
            Reset
          </button>
        </div>

        <div className="er-table-wrap">
          <table className="er-table">
            <thead>
              <tr>
                <th>CLAIM / EMPLOYEE</th>
                <th>CATEGORY</th>
                <th>EXPENSE DATE</th>
                <th>AMOUNT</th>
                <th>APPROVER</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredClaims.map((claim) => (
                <tr key={claim.id}>
                  <td>
                    <div className="er-employee-cell">
                      <div className="er-avatar">
                        {claim.employee
                          .split(" ")
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <strong>{claim.employee}</strong>
                        <span>{claim.employeeCode}</span>
                        <small>{claim.id}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="er-category">{claim.category}</span>
                    <small className="er-cell-subtitle">
                      {claim.department}
                    </small>
                  </td>
                  <td>{formatDate(claim.expenseDate)}</td>
                  <td>
                    <strong className="er-amount">
                      {money(claim.amount)}
                    </strong>
                  </td>
                  <td>{claim.approver || "—"}</td>
                  <td><StatusBadge status={claim.status} /></td>
                  <td>
                    <div className="er-actions">
                      <button
                        type="button"
                        title="View claim"
                        aria-label={`View ${claim.id}`}
                        onClick={() => setSelectedId(claim.id)}
                      >
                        <FiEye />
                      </button>
                      {(claim.status === "Pending" ||
                        claim.status === "Rejected") && (
                        <button
                          type="button"
                          title="Edit claim"
                          aria-label={`Edit ${claim.id}`}
                          onClick={() => openEditClaim(claim)}
                        >
                          <FiEdit2 />
                        </button>
                      )}
                      {claim.status === "Pending" && (
                        <>
                          <button
                            type="button"
                            className="er-approve-action"
                            title="Approve claim"
                            aria-label={`Approve ${claim.id}`}
                            onClick={() =>
                              updateClaimStatus(claim.id, "Approved")
                            }
                          >
                            <FiCheckCircle />
                          </button>
                          <button
                            type="button"
                            className="er-delete-action"
                            title="Reject claim"
                            aria-label={`Reject ${claim.id}`}
                            onClick={() =>
                              updateClaimStatus(claim.id, "Rejected")
                            }
                          >
                            <FiX />
                          </button>
                        </>
                      )}
                      {claim.status === "Approved" && (
                        <button
                          type="button"
                          className="er-approve-action"
                          title="Mark as paid"
                          aria-label={`Mark ${claim.id} as paid`}
                          onClick={() => updateClaimStatus(claim.id, "Paid")}
                        >
                          <FiDollarSign />
                        </button>
                      )}
                      {(claim.status === "Pending" ||
                        claim.status === "Rejected") && (
                        <button
                          type="button"
                          className="er-delete-action"
                          title="Delete claim"
                          aria-label={`Delete ${claim.id}`}
                          onClick={() => deleteClaim(claim.id)}
                        >
                          <FiTrash2 />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredClaims.length === 0 && (
                <tr>
                  <td colSpan="7" className="er-empty">
                    No expense claims match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="er-table-footer">
          Showing {filteredClaims.length} of {claims.length} claims
        </footer>
      </section>

      {modal === "form" && (
        <div
          className="er-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setModal("");
          }}
        >
          <section
            className="er-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="er-form-title"
          >
            <header className="er-modal-header">
              <div>
                <h2 id="er-form-title">
                  {editingId ? "Edit Expense Claim" : "New Expense Claim"}
                </h2>
                <p>Enter the employee, expense and supporting bill details.</p>
              </div>
              <button
                type="button"
                className="er-icon-btn"
                onClick={() => setModal("")}
                aria-label="Close form"
              >
                <FiX />
              </button>
            </header>

            <form onSubmit={saveClaim}>
              <div className="er-form-grid">
                <label>
                  Employee Name *
                  <input
                    required
                    value={form.employee}
                    onChange={(event) =>
                      updateForm("employee", event.target.value)
                    }
                    placeholder="Enter employee name"
                  />
                </label>

                <label>
                  Employee ID *
                  <input
                    required
                    value={form.employeeCode}
                    onChange={(event) =>
                      updateForm("employeeCode", event.target.value)
                    }
                    placeholder="e.g. EMP006"
                  />
                </label>

                <label>
                  Department *
                  <input
                    required
                    value={form.department}
                    onChange={(event) =>
                      updateForm("department", event.target.value)
                    }
                    placeholder="Department"
                  />
                </label>

                <label>
                  Expense Category *
                  <select
                    required
                    value={form.category}
                    onChange={(event) =>
                      updateForm("category", event.target.value)
                    }
                  >
                    {categories.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Expense Date *
                  <input
                    required
                    type="date"
                    value={form.expenseDate}
                    onChange={(event) =>
                      updateForm("expenseDate", event.target.value)
                    }
                  />
                </label>

                <label>
                  Claim Amount (INR) *
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.amount}
                    onChange={(event) =>
                      updateForm("amount", event.target.value)
                    }
                    placeholder="0.00"
                  />
                </label>

                <label>
                  Payment Method
                  <select
                    value={form.paymentMethod}
                    onChange={(event) =>
                      updateForm("paymentMethod", event.target.value)
                    }
                  >
                    <option>Personal Payment</option>
                    <option>Company Card</option>
                    <option>Cash Advance</option>
                  </select>
                </label>

                <label>
                  Approver
                  <input
                    value={form.approver}
                    onChange={(event) =>
                      updateForm("approver", event.target.value)
                    }
                    placeholder="Manager or approver"
                  />
                </label>

                <label className="er-form-full">
                  Expense Description *
                  <textarea
                    required
                    rows="3"
                    value={form.description}
                    onChange={(event) =>
                      updateForm("description", event.target.value)
                    }
                    placeholder="Explain the business purpose of this expense"
                  />
                </label>

                <label className="er-form-full">
                  Supporting Bill / Receipt
                  <div className="er-upload-box">
                    <FiUploadCloud />
                    <span>
                      {receiptName || "Choose a receipt for UI testing"}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(event) => {
                        const file = event.target.files?.[0];

                        if (!file) return;

                        const allowedTypes = [
                          "application/pdf",
                          "image/jpeg",
                          "image/png",
                        ];

                        if (!allowedTypes.includes(file.type)) {
                          setReceiptName("");
                          setReceiptError(
                            "Choose a PDF, JPEG or PNG receipt."
                          );
                          event.target.value = "";
                          return;
                        }

                        if (file.size > 5 * 1024 * 1024) {
                          setReceiptName("");
                          setReceiptError(
                            "Receipt size must not exceed 5 MB."
                          );
                          event.target.value = "";
                          return;
                        }

                        setReceiptName(file.name);
                        setReceiptError("");
                      }}
                    />
                  </div>
                  {receiptError && (
                    <span className="er-field-error">{receiptError}</span>
                  )}
                  <small className="er-help-text">
                    Maximum 5 MB. The selected file is not uploaded or saved
                    in this prototype.
                  </small>
                </label>

                {editingId && (
                  <>
                    <label>
                      Status
                      <select
                        value={form.status}
                        onChange={(event) =>
                          updateForm("status", event.target.value)
                        }
                      >
                        {statuses.map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>
                    </label>

                    {form.status === "Rejected" && (
                      <label>
                        Rejection Reason *
                        <input
                          required
                          value={form.rejectionReason}
                          onChange={(event) =>
                            updateForm("rejectionReason", event.target.value)
                          }
                          placeholder="Reason for rejection"
                        />
                      </label>
                    )}

                    {form.status === "Paid" && (
                      <label>
                        Payment Date *
                        <input
                          required
                          type="date"
                          value={form.paymentDate}
                          onChange={(event) =>
                            updateForm("paymentDate", event.target.value)
                          }
                        />
                      </label>
                    )}
                  </>
                )}
              </div>

              <footer className="er-modal-footer">
                <button
                  type="button"
                  className="er-btn er-btn-secondary"
                  onClick={() => setModal("")}
                >
                  Cancel
                </button>
                <button type="submit" className="er-btn er-btn-primary">
                  <FiCheckCircle /> Save Claim
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {selectedClaim && (
        <div
          className="er-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedId(null);
          }}
        >
          <section
            className="er-modal er-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="er-detail-title"
          >
            <header className="er-modal-header">
              <div>
                <h2 id="er-detail-title">Expense Claim Details</h2>
                <p>{selectedClaim.id}</p>
              </div>
              <button
                type="button"
                className="er-icon-btn"
                onClick={() => setSelectedId(null)}
                aria-label="Close details"
              >
                <FiX />
              </button>
            </header>

            <div className="er-detail-hero">
              <div className="er-avatar er-avatar-large">
                {selectedClaim.employee
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div>
                <h3>{selectedClaim.employee}</h3>
                <p>
                  {selectedClaim.employeeCode} · {selectedClaim.department}
                </p>
                <StatusBadge status={selectedClaim.status} />
              </div>
              <strong className="er-detail-amount">
                {money(selectedClaim.amount)}
              </strong>
            </div>

            <div className="er-detail-grid">
              <div>
                <span>Category</span>
                <strong>{selectedClaim.category}</strong>
              </div>
              <div>
                <span>Expense Date</span>
                <strong>{formatDate(selectedClaim.expenseDate)}</strong>
              </div>
              <div>
                <span>Submitted Date</span>
                <strong>{formatDate(selectedClaim.submittedDate)}</strong>
              </div>
              <div>
                <span>Payment Method</span>
                <strong>{selectedClaim.paymentMethod}</strong>
              </div>
              <div>
                <span>Approver</span>
                <strong>{selectedClaim.approver || "—"}</strong>
              </div>
              <div>
                <span>Payment Date</span>
                <strong>{formatDate(selectedClaim.paymentDate)}</strong>
              </div>
            </div>

            <div className="er-detail-description">
              <h4>Expense Description</h4>
              <p>{selectedClaim.description || "No description provided."}</p>

              {selectedClaim.rejectionReason && (
                <>
                  <h4>Rejection Reason</h4>
                  <p className="er-rejection-note">
                    {selectedClaim.rejectionReason}
                  </p>
                </>
              )}
            </div>

            <footer className="er-modal-footer er-detail-footer">
              {selectedClaim.status === "Pending" && (
                <>
                  <button
                    type="button"
                    className="er-btn er-btn-danger"
                    onClick={() =>
                      updateClaimStatus(selectedClaim.id, "Rejected")
                    }
                  >
                    <FiX /> Reject
                  </button>
                  <button
                    type="button"
                    className="er-btn er-btn-primary"
                    onClick={() =>
                      updateClaimStatus(selectedClaim.id, "Approved")
                    }
                  >
                    <FiCheckCircle /> Approve Claim
                  </button>
                </>
              )}
              {selectedClaim.status === "Approved" && (
                <button
                  type="button"
                  className="er-btn er-btn-primary"
                  onClick={() =>
                    updateClaimStatus(selectedClaim.id, "Paid")
                  }
                >
                  <FiDollarSign /> Mark as Paid
                </button>
              )}
              {(selectedClaim.status === "Pending" ||
                selectedClaim.status === "Rejected") && (
                <button
                  type="button"
                  className="er-btn er-btn-secondary"
                  onClick={() => {
                    const claim = selectedClaim;
                    setSelectedId(null);
                    openEditClaim(claim);
                  }}
                >
                  <FiEdit2 /> Edit Claim
                </button>
              )}
              <button
                type="button"
                className="er-btn er-btn-secondary"
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
