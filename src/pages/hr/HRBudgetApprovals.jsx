import React, { useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiDollarSign,
  FiAlertTriangle,
  FiSearch,
  FiFilter,
  FiDownload,
  FiEye,
  FiEdit2,
  FiPlus,
  FiX,
  FiSave,
  FiRefreshCw,
  FiFileText,
  FiTrendingUp,
  FiActivity,
} from "react-icons/fi";
import "../../css/hr/HRBudgetApprovals.css";

const DEPARTMENTS = [
  "Human Resources",
  "Finance & Accounts",
  "Production",
  "Sales & Marketing",
  "Administration",
  "Quality Control",
];

const INITIAL_REQUESTS = [
  {
    id: 1,
    reference: "BAP-2026-001",
    financialYear: "2026-27",
    department: "Human Resources",
    category: "Recruitment",
    requestType: "Annual Budget",
    originalBudget: 300000,
    requestedBudget: 360000,
    actualSpend: 92000,
    committedCost: 35000,
    requester: "HR Manager",
    submittedDate: "2026-10-05",
    status: "Pending",
    priority: "Normal",
    reason: "Additional recruitment requirements for approved vacancies.",
    reviewer: "Finance Manager",
    reviewNotes: "",
  },
  {
    id: 2,
    reference: "BAP-2026-002",
    financialYear: "2026-27",
    department: "Production",
    category: "Employee Benefits",
    requestType: "Budget Revision",
    originalBudget: 600000,
    requestedBudget: 720000,
    actualSpend: 410000,
    committedCost: 85000,
    requester: "Production Manager",
    submittedDate: "2026-10-08",
    status: "Pending",
    priority: "High",
    reason: "Additional employee welfare expenditure based on revised requirements.",
    reviewer: "HR Director",
    reviewNotes: "",
  },
  {
    id: 3,
    reference: "BAP-2026-003",
    financialYear: "2026-27",
    department: "Finance & Accounts",
    category: "Training & Development",
    requestType: "Annual Budget",
    originalBudget: 120000,
    requestedBudget: 120000,
    actualSpend: 32000,
    committedCost: 10000,
    requester: "Finance Manager",
    submittedDate: "2026-10-09",
    status: "Approved",
    priority: "Normal",
    reason: "Annual accounting and compliance training plan.",
    reviewer: "Finance Controller",
    reviewNotes: "Approved as proposed.",
  },
  {
    id: 4,
    reference: "BAP-2026-004",
    financialYear: "2026-27",
    department: "Administration",
    category: "Employee Welfare",
    requestType: "Budget Revision",
    originalBudget: 180000,
    requestedBudget: 150000,
    actualSpend: 98000,
    committedCost: 18000,
    requester: "Admin Manager",
    submittedDate: "2026-10-11",
    status: "Approved",
    priority: "Normal",
    reason: "Reallocation based on expected expenditure.",
    reviewer: "HR Director",
    reviewNotes: "Approved subject to monthly review.",
  },
  {
    id: 5,
    reference: "BAP-2026-005",
    financialYear: "2026-27",
    department: "Sales & Marketing",
    category: "Travel & Conveyance",
    requestType: "Budget Revision",
    originalBudget: 360000,
    requestedBudget: 450000,
    actualSpend: 280000,
    committedCost: 45000,
    requester: "Sales Manager",
    submittedDate: "2026-10-13",
    status: "Rejected",
    priority: "High",
    reason: "Increase requested for additional travel and customer visits.",
    reviewer: "Finance Controller",
    reviewNotes: "Please provide supporting forecast and revised travel plan.",
  },
  {
    id: 6,
    reference: "BAP-2026-006",
    financialYear: "2026-27",
    department: "Quality Control",
    category: "Training & Development",
    requestType: "Annual Budget",
    originalBudget: 150000,
    requestedBudget: 180000,
    actualSpend: 105000,
    committedCost: 30000,
    requester: "Quality Manager",
    submittedDate: "2026-10-16",
    status: "Pending",
    priority: "High",
    reason: "Additional technical and quality compliance training.",
    reviewer: "HR Director",
    reviewNotes: "",
  },
  {
    id: 7,
    reference: "BAP-2026-007",
    financialYear: "2026-27",
    department: "Human Resources",
    category: "Other HR Expenses",
    requestType: "Budget Revision",
    originalBudget: 200000,
    requestedBudget: 175000,
    actualSpend: 155000,
    committedCost: 12000,
    requester: "HR Manager",
    submittedDate: "2026-10-17",
    status: "Pending",
    priority: "Normal",
    reason: "Revision following review of the remaining annual requirements.",
    reviewer: "Finance Manager",
    reviewNotes: "",
  },
];

const INITIAL_ACTIVITY = [
  {
    id: 1,
    reference: "BAP-2026-004",
    action: "Budget revision approved",
    actor: "HR Director",
    date: "2026-10-12",
    detail: "Administration · Employee Welfare",
  },
  {
    id: 2,
    reference: "BAP-2026-005",
    action: "Budget revision rejected",
    actor: "Finance Controller",
    date: "2026-10-14",
    detail: "Sales & Marketing · Travel & Conveyance",
  },
  {
    id: 3,
    reference: "BAP-2026-006",
    action: "Request submitted for review",
    actor: "Quality Manager",
    date: "2026-10-16",
    detail: "Quality Control · Training & Development",
  },
];

const emptyForm = () => ({
  financialYear: "2026-27",
  department: "",
  category: "",
  requestType: "Budget Revision",
  originalBudget: "",
  requestedBudget: "",
  actualSpend: "0",
  committedCost: "0",
  requester: "",
  submittedDate: new Date().toISOString().slice(0, 10),
  priority: "Normal",
  reason: "",
  reviewer: "",
});

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const formatCompact = (value) => {
  const amount = Number(value) || 0;
  if (Math.abs(amount) >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (Math.abs(amount) >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }
  if (Math.abs(amount) >= 1000) {
    return `₹${(amount / 1000).toFixed(1)} K`;
  }
  return `₹${amount}`;
};

const csvCell = (value) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

const exportCSV = (filename, rows) => {
  const content = rows
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");

  const blob = new Blob(["\uFEFF" + content], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

function HRBudgetApprovals() {
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [activity, setActivity] = useState(INITIAL_ACTIVITY);
  const [financialYear, setFinancialYear] = useState("2026-27");
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewingRequest, setViewingRequest] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState({});
  const [decision, setDecision] = useState(null);
  const [decisionNotes, setDecisionNotes] = useState("");
  const [notice, setNotice] = useState("");

  const yearRequests = useMemo(
    () =>
      requests.filter((item) => item.financialYear === financialYear),
    [requests, financialYear]
  );

  const metrics = useMemo(() => {
    const pending = yearRequests.filter((item) => item.status === "Pending");
    const approved = yearRequests.filter((item) => item.status === "Approved");
    const rejected = yearRequests.filter((item) => item.status === "Rejected");

    const pendingAmount = pending.reduce(
      (sum, item) => sum + Number(item.requestedBudget || 0),
      0
    );

    const approvedRequested = approved.reduce(
      (sum, item) => sum + Number(item.requestedBudget || 0),
      0
    );

    const requestedIncrease = yearRequests.reduce(
      (sum, item) =>
        sum + Math.max(0, Number(item.requestedBudget) - Number(item.originalBudget)),
      0
    );

    return {
      pendingCount: pending.length,
      pendingAmount,
      approvedCount: approved.length,
      approvedRequested,
      rejectedCount: rejected.length,
      requestedIncrease,
      total: yearRequests.length,
    };
  }, [yearRequests]);

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    return yearRequests.filter((item) => {
      const matchesSearch =
        !query ||
        item.reference.toLowerCase().includes(query) ||
        item.department.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.requester.toLowerCase().includes(query) ||
        item.reviewer.toLowerCase().includes(query);

      return (
        matchesSearch &&
        (departmentFilter === "All" ||
          item.department === departmentFilter) &&
        (statusFilter === "All" || item.status === statusFilter) &&
        (typeFilter === "All" || item.requestType === typeFilter) &&
        (priorityFilter === "All" || item.priority === priorityFilter)
      );
    });
  }, [
    yearRequests,
    search,
    departmentFilter,
    statusFilter,
    typeFilter,
    priorityFilter,
  ]);

  const varianceRows = useMemo(() => {
    return DEPARTMENTS.map((department) => {
      const items = yearRequests.filter(
        (item) => item.department === department
      );

      const approvedBudget = items
        .filter((item) => item.status === "Approved")
        .reduce((sum, item) => sum + Number(item.requestedBudget || 0), 0);

      const actual = items.reduce(
        (sum, item) => sum + Number(item.actualSpend || 0),
        0
      );

      const committed = items.reduce(
        (sum, item) => sum + Number(item.committedCost || 0),
        0
      );

      const available = approvedBudget - actual - committed;
      const utilization =
        approvedBudget > 0
          ? ((actual + committed) / approvedBudget) * 100
          : 0;

      return {
        department,
        approvedBudget,
        actual,
        committed,
        available,
        utilization,
      };
    }).filter(
      (item) =>
        item.approvedBudget > 0 ||
        item.actual > 0 ||
        item.committed > 0
    );
  }, [yearRequests]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (item) => {
    if (item.status !== "Pending" && item.status !== "Rejected") {
      setNotice("Only pending or rejected requests can be edited in this prototype.");
      return;
    }

    setEditingId(item.id);
    setForm({
      financialYear: item.financialYear,
      department: item.department,
      category: item.category,
      requestType: item.requestType,
      originalBudget: String(item.originalBudget),
      requestedBudget: String(item.requestedBudget),
      actualSpend: String(item.actualSpend),
      committedCost: String(item.committedCost),
      requester: item.requester,
      submittedDate: item.submittedDate,
      priority: item.priority,
      reason: item.reason,
      reviewer: item.reviewer,
    });
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setErrors({});
  };

  const updateForm = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: "" }));
  };

  const validateForm = () => {
    const nextErrors = {};
    const original = Number(form.originalBudget);
    const requested = Number(form.requestedBudget);
    const actual = Number(form.actualSpend);
    const committed = Number(form.committedCost);

    if (!form.financialYear) nextErrors.financialYear = "Select a financial year.";
    if (!form.department) nextErrors.department = "Select a department.";
    if (!form.category) nextErrors.category = "Select a category.";
    if (!form.requestType) nextErrors.requestType = "Select a request type.";

    if (
      form.originalBudget === "" ||
      !Number.isFinite(original) ||
      original < 0
    ) {
      nextErrors.originalBudget = "Enter a valid original budget.";
    }

    if (
      form.requestedBudget === "" ||
      !Number.isFinite(requested) ||
      requested <= 0
    ) {
      nextErrors.requestedBudget = "Enter a requested budget greater than zero.";
    }

    if (!Number.isFinite(actual) || actual < 0) {
      nextErrors.actualSpend = "Actual spend cannot be negative.";
    }

    if (!Number.isFinite(committed) || committed < 0) {
      nextErrors.committedCost = "Committed cost cannot be negative.";
    }

    if (!form.requester.trim()) nextErrors.requester = "Enter the requester.";
    if (!form.reviewer.trim()) nextErrors.reviewer = "Enter the assigned reviewer.";
    if (!form.submittedDate) nextErrors.submittedDate = "Select a request date.";
    if (!form.reason.trim()) nextErrors.reason = "Enter the reason for the request.";

    const duplicate = requests.some(
      (item) =>
        item.id !== editingId &&
        item.financialYear === form.financialYear &&
        item.department === form.department &&
        item.category === form.category &&
        item.requestType === form.requestType &&
        item.status === "Pending"
    );

    if (duplicate) {
      nextErrors.category =
        "A pending request already exists for this department, category and request type.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const saveRequest = (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    const existing = requests.find((item) => item.id === editingId);
    const record = {
      id: editingId ?? Date.now(),
      reference:
        existing?.reference ||
        `BAP-${form.financialYear.slice(0, 4)}-${String(requests.length + 1).padStart(3, "0")}`,
      financialYear: form.financialYear,
      department: form.department,
      category: form.category,
      requestType: form.requestType,
      originalBudget: Number(form.originalBudget),
      requestedBudget: Number(form.requestedBudget),
      actualSpend: Number(form.actualSpend),
      committedCost: Number(form.committedCost),
      requester: form.requester.trim(),
      submittedDate: form.submittedDate,
      status: "Pending",
      priority: form.priority,
      reason: form.reason.trim(),
      reviewer: form.reviewer.trim(),
      reviewNotes: existing?.reviewNotes || "",
    };

    setRequests((previous) =>
      editingId
        ? previous.map((item) => (item.id === editingId ? record : item))
        : [record, ...previous]
    );

    setActivity((previous) => [
      {
        id: Date.now(),
        reference: record.reference,
        action: editingId
          ? "Request updated and resubmitted"
          : "Budget request submitted",
        actor: record.requester,
        date: new Date().toISOString().slice(0, 10),
        detail: `${record.department} · ${record.category}`,
      },
      ...previous,
    ]);

    setFinancialYear(record.financialYear);
    setNotice(
      editingId
        ? "Request updated and returned to Pending in this prototype."
        : "Budget request submitted in this prototype."
    );
    closeModal();
  };

  const openDecision = (item, nextStatus) => {
    setDecision({ item, nextStatus });
    setDecisionNotes(item.reviewNotes || "");
  };

  const confirmDecision = () => {
    if (!decision) return;

    const { item, nextStatus } = decision;
    const notes = decisionNotes.trim();

    if (nextStatus === "Rejected" && !notes) {
      setNotice("Enter a review note before rejecting a request.");
      return;
    }

    setRequests((previous) =>
      previous.map((request) =>
        request.id === item.id
          ? {
              ...request,
              status: nextStatus,
              reviewNotes: notes,
            }
          : request
      )
    );

    setActivity((previous) => [
      {
        id: Date.now(),
        reference: item.reference,
        action: `Budget request ${nextStatus.toLowerCase()}`,
        actor: item.reviewer || "Reviewer",
        date: new Date().toISOString().slice(0, 10),
        detail: `${item.department} · ${item.category}${notes ? ` · ${notes}` : ""}`,
      },
      ...previous,
    ]);

    setNotice(`${item.reference} marked ${nextStatus} in this prototype.`);
    setDecision(null);
    setDecisionNotes("");
  };

  const resetFilters = () => {
    setSearch("");
    setDepartmentFilter("All");
    setStatusFilter("All");
    setTypeFilter("All");
    setPriorityFilter("All");
  };

  const exportRequests = () => {
    exportCSV("HR_Budget_Approval_Revision_Report.csv", [
      [
        "Reference",
        "Financial Year",
        "Department",
        "Category",
        "Request Type",
        "Original Budget",
        "Requested Budget",
        "Change Amount",
        "Change %",
        "Actual Spend",
        "Committed Cost",
        "Available After Actual and Commitments",
        "Requester",
        "Reviewer",
        "Submitted Date",
        "Priority",
        "Status",
        "Reason",
        "Review Notes",
      ],
      ...filteredRequests.map((item) => [
        item.reference,
        item.financialYear,
        item.department,
        item.category,
        item.requestType,
        item.originalBudget,
        item.requestedBudget,
        item.requestedBudget - item.originalBudget,
        item.originalBudget > 0
          ? (((item.requestedBudget - item.originalBudget) / item.originalBudget) * 100).toFixed(2)
          : "",
        item.actualSpend,
        item.committedCost,
        item.requestedBudget - item.actualSpend - item.committedCost,
        item.requester,
        item.reviewer,
        item.submittedDate,
        item.priority,
        item.status,
        item.reason,
        item.reviewNotes,
      ]),
    ]);
  };

  const exportVariance = () => {
    exportCSV("HR_Budget_Variance_Report.csv", [
      [
        "Financial Year",
        "Department",
        "Approved Budget in Current Sample",
        "Actual Spend",
        "Committed Cost",
        "Available After Actual and Commitments",
        "Utilization %",
      ],
      ...varianceRows.map((item) => [
        financialYear,
        item.department,
        item.approvedBudget,
        item.actual,
        item.committed,
        item.available,
        item.utilization.toFixed(2),
      ]),
    ]);
  };

  return (
    <div className="hba-page">
      <header className="hba-header">
        <div>
          <div className="hba-eyebrow">
            <FiActivity />
            HUMAN RESOURCES
          </div>
          <h1>Budget Approvals & Variance Analysis</h1>
          <p>
            Review budget requests, control revisions and identify department
            spending risks before budgets are finalized.
          </p>
        </div>

        <div className="hba-header-actions">
          <label className="hba-year-select">
            <FiClock />
            <select
              value={financialYear}
              onChange={(event) => setFinancialYear(event.target.value)}
              aria-label="Select financial year"
            >
              <option value="2025-26">FY 2025–26</option>
              <option value="2026-27">FY 2026–27</option>
              <option value="2027-28">FY 2027–28</option>
            </select>
          </label>
          <button
            type="button"
            className="hba-btn hba-btn-primary"
            onClick={openCreate}
          >
            <FiPlus />
            New Request
          </button>
        </div>
      </header>

      <div className="hba-prototype">
        <FiAlertTriangle />
        <div>
          <strong>Prototype — sample data only</strong>
          <p>
            Approval decisions are simulated in page state. This page does not
            enforce user roles, create a legally reliable audit trail, or save
            records to Supabase.
          </p>
        </div>
      </div>

      {notice && (
        <div className="hba-notice" role="status">
          <FiCheckCircle />
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
          >
            <FiX />
          </button>
        </div>
      )}

      <section className="hba-kpis">
        <article className="hba-kpi hba-kpi-orange">
          <div className="hba-kpi-top">
            <span>Pending Requests</span>
            <FiClock />
          </div>
          <strong>{metrics.pendingCount}</strong>
          <small>{formatCompact(metrics.pendingAmount)} awaiting review</small>
        </article>

        <article className="hba-kpi hba-kpi-green">
          <div className="hba-kpi-top">
            <span>Approved Requests</span>
            <FiCheckCircle />
          </div>
          <strong>{metrics.approvedCount}</strong>
          <small>{formatCompact(metrics.approvedRequested)} approved request value</small>
        </article>

        <article className="hba-kpi hba-kpi-blue">
          <div className="hba-kpi-top">
            <span>Requested Increases</span>
            <FiTrendingUp />
          </div>
          <strong>{formatCompact(metrics.requestedIncrease)}</strong>
          <small>Positive changes requested before decisions</small>
        </article>

        <article className="hba-kpi hba-kpi-red">
          <div className="hba-kpi-top">
            <span>Rejected Requests</span>
            <FiXCircle />
          </div>
          <strong>{metrics.rejectedCount}</strong>
          <small>Requests needing review or resubmission</small>
        </article>
      </section>

      <section className="hba-panel hba-register">
        <div className="hba-panel-title hba-register-title">
          <div>
            <h2>Budget Approval & Revision Register</h2>
            <p>
              Review requests, inspect variances and record prototype decisions.
            </p>
          </div>
          <button
            type="button"
            className="hba-btn hba-btn-secondary"
            onClick={exportRequests}
          >
            <FiDownload />
            Export Requests
          </button>
        </div>

        <div className="hba-filters">
          <label className="hba-search">
            <FiSearch />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search reference, department, category or requester..."
            />
          </label>

          <label className="hba-filter-select">
            <FiFilter />
            <select
              value={departmentFilter}
              onChange={(event) => setDepartmentFilter(event.target.value)}
              aria-label="Filter department"
            >
              <option value="All">All departments</option>
              {DEPARTMENTS.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </label>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter status"
          >
            <option value="All">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            aria-label="Filter request type"
          >
            <option value="All">All request types</option>
            <option value="Annual Budget">Annual Budget</option>
            <option value="Budget Revision">Budget Revision</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
            aria-label="Filter priority"
          >
            <option value="All">All priorities</option>
            <option value="Normal">Normal</option>
            <option value="High">High</option>
          </select>

          <button
            type="button"
            className="hba-btn hba-btn-reset"
            onClick={resetFilters}
          >
            <FiRefreshCw />
            Reset
          </button>
        </div>

        <div className="hba-table-scroll">
          <table className="hba-table">
            <thead>
              <tr>
                <th>Request</th>
                <th>Department / Category</th>
                <th>Request Type</th>
                <th>Original Budget</th>
                <th>Requested Budget</th>
                <th>Change</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((item) => {
                const change = item.requestedBudget - item.originalBudget;
                const changePercent =
                  item.originalBudget > 0
                    ? (change / item.originalBudget) * 100
                    : 0;

                return (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.reference}</strong>
                      <small>{item.submittedDate}</small>
                      <small>By {item.requester}</small>
                    </td>
                    <td>
                      <strong>{item.department}</strong>
                      <small>{item.category}</small>
                    </td>
                    <td>{item.requestType}</td>
                    <td>{formatCurrency(item.originalBudget)}</td>
                    <td><strong>{formatCurrency(item.requestedBudget)}</strong></td>
                    <td>
                      <strong className={change > 0 ? "hba-increase" : change < 0 ? "hba-decrease" : ""}>
                        {change > 0 ? "+" : ""}
                        {formatCurrency(change)}
                      </strong>
                      <small>
                        {change > 0 ? "+" : ""}
                        {changePercent.toFixed(1)}%
                      </small>
                    </td>
                    <td>
                      <span
                        className={`hba-priority hba-priority-${item.priority.toLowerCase()}`}
                      >
                        {item.priority}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`hba-status hba-status-${item.status.toLowerCase()}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div className="hba-row-actions">
                        <button
                          type="button"
                          onClick={() => setViewingRequest(item)}
                          title="View details"
                          aria-label={`View ${item.reference}`}
                        >
                          <FiEye />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          title="Edit request"
                          aria-label={`Edit ${item.reference}`}
                          disabled={item.status === "Approved"}
                        >
                          <FiEdit2 />
                        </button>
                        {item.status === "Pending" && (
                          <>
                            <button
                              type="button"
                              className="hba-approve-action"
                              onClick={() => openDecision(item, "Approved")}
                              title="Approve request"
                              aria-label={`Approve ${item.reference}`}
                            >
                              <FiCheckCircle />
                            </button>
                            <button
                              type="button"
                              className="hba-reject-action"
                              onClick={() => openDecision(item, "Rejected")}
                              title="Reject request"
                              aria-label={`Reject ${item.reference}`}
                            >
                              <FiXCircle />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan="9" className="hba-empty">
                    No budget requests match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="hba-register-footer">
          <span>
            Showing {filteredRequests.length} of {yearRequests.length} requests
            for FY {financialYear}
          </span>
          <span>
            Pending value: <strong>{formatCurrency(metrics.pendingAmount)}</strong>
          </span>
        </div>
      </section>

      <section className="hba-panel hba-variance-panel">
        <div className="hba-panel-title hba-register-title">
          <div>
            <h2>Department Budget Variance</h2>
            <p>
              Approved request values less actual spend and committed costs.
              These totals use the sample request records on this page.
            </p>
          </div>
          <button
            type="button"
            className="hba-btn hba-btn-secondary"
            onClick={exportVariance}
          >
            <FiDownload />
            Export Variance
          </button>
        </div>

        <div className="hba-table-scroll">
          <table className="hba-table hba-variance-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Approved Budget*</th>
                <th>Actual Spend</th>
                <th>Committed Costs</th>
                <th>Available Balance</th>
                <th>Utilization</th>
                <th>Position</th>
              </tr>
            </thead>
            <tbody>
              {varianceRows.map((item) => {
                const overBudget = item.available < 0;
                const utilization = item.utilization;

                return (
                  <tr key={item.department}>
                    <td><strong>{item.department}</strong></td>
                    <td>{formatCurrency(item.approvedBudget)}</td>
                    <td>{formatCurrency(item.actual)}</td>
                    <td>{formatCurrency(item.committed)}</td>
                    <td className={overBudget ? "hba-increase" : ""}>
                      {formatCurrency(item.available)}
                    </td>
                    <td>
                      <div className="hba-util-cell">
                        <span>{utilization.toFixed(1)}%</span>
                        <div className="hba-util-track">
                          <div
                            className={`hba-util-fill ${overBudget ? "hba-util-over" : ""}`}
                            style={{ width: `${Math.min(utilization, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`hba-status ${overBudget ? "hba-status-rejected" : utilization >= 80 ? "hba-status-pending" : "hba-status-approved"}`}
                      >
                        {overBudget
                          ? "Over Budget"
                          : utilization >= 80
                          ? "Watch"
                          : "Within Balance"}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {varianceRows.length === 0 && (
                <tr>
                  <td colSpan="7" className="hba-empty">
                    No variance data available for this financial year.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="hba-footnote">
          * Approved Budget is calculated from approved requests represented in
          this prototype. It is not the authoritative company budget ledger.
        </p>
      </section>

      <section className="hba-panel hba-activity-panel">
        <div className="hba-panel-title">
          <div>
            <h2>Approval Activity</h2>
            <p>Illustrative request history generated in this session</p>
          </div>
          <FiActivity />
        </div>

        {activity.length === 0 ? (
          <div className="hba-empty">No activity recorded.</div>
        ) : (
          <div className="hba-activity-list">
            {activity.map((item) => (
              <div className="hba-activity-item" key={item.id}>
                <div
                  className={`hba-activity-icon ${
                    item.action.toLowerCase().includes("rejected")
                      ? "hba-activity-red"
                      : item.action.toLowerCase().includes("approved")
                      ? "hba-activity-green"
                      : "hba-activity-blue"
                  }`}
                >
                  {item.action.toLowerCase().includes("rejected") ? (
                    <FiXCircle />
                  ) : item.action.toLowerCase().includes("approved") ? (
                    <FiCheckCircle />
                  ) : (
                    <FiFileText />
                  )}
                </div>
                <div className="hba-activity-content">
                  <strong>{item.action}</strong>
                  <span>{item.reference} · {item.detail}</span>
                  <small>{item.actor} · {item.date}</small>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {showModal && (
        <div
          className="hba-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            className="hba-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="hba-modal-title"
          >
            <div className="hba-modal-header">
              <div>
                <h2 id="hba-modal-title">
                  {editingId ? "Edit Budget Request" : "New Budget Request"}
                </h2>
                <p>
                  Provide the original budget, requested amount and justification.
                </p>
              </div>
              <button
                type="button"
                className="hba-close-btn"
                onClick={closeModal}
                aria-label="Close dialog"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={saveRequest}>
              <div className="hba-modal-body">
                <div className="hba-form-grid">
                  <label>
                    Financial Year <span>*</span>
                    <select
                      value={form.financialYear}
                      onChange={(event) => updateForm("financialYear", event.target.value)}
                    >
                      <option value="2025-26">2025–26</option>
                      <option value="2026-27">2026–27</option>
                      <option value="2027-28">2027–28</option>
                    </select>
                    {errors.financialYear && <small className="hba-error">{errors.financialYear}</small>}
                  </label>

                  <label>
                    Request Type <span>*</span>
                    <select
                      value={form.requestType}
                      onChange={(event) => updateForm("requestType", event.target.value)}
                    >
                      <option value="Annual Budget">Annual Budget</option>
                      <option value="Budget Revision">Budget Revision</option>
                    </select>
                    {errors.requestType && <small className="hba-error">{errors.requestType}</small>}
                  </label>

                  <label>
                    Department <span>*</span>
                    <select
                      value={form.department}
                      onChange={(event) => updateForm("department", event.target.value)}
                    >
                      <option value="">Select department</option>
                      {DEPARTMENTS.map((department) => (
                        <option key={department} value={department}>
                          {department}
                        </option>
                      ))}
                    </select>
                    {errors.department && <small className="hba-error">{errors.department}</small>}
                  </label>

                  <label>
                    Expense Category <span>*</span>
                    <select
                      value={form.category}
                      onChange={(event) => updateForm("category", event.target.value)}
                    >
                      <option value="">Select category</option>
                      <option value="Salaries & Wages">Salaries & Wages</option>
                      <option value="Recruitment">Recruitment</option>
                      <option value="Training & Development">Training & Development</option>
                      <option value="Employee Benefits">Employee Benefits</option>
                      <option value="Travel & Conveyance">Travel & Conveyance</option>
                      <option value="Employee Welfare">Employee Welfare</option>
                      <option value="Other HR Expenses">Other HR Expenses</option>
                    </select>
                    {errors.category && <small className="hba-error">{errors.category}</small>}
                  </label>

                  <label>
                    Original Budget (₹) <span>*</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.originalBudget}
                      onChange={(event) => updateForm("originalBudget", event.target.value)}
                      placeholder="Current approved allocation"
                    />
                    {errors.originalBudget && <small className="hba-error">{errors.originalBudget}</small>}
                  </label>

                  <label>
                    Requested Budget (₹) <span>*</span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form.requestedBudget}
                      onChange={(event) => updateForm("requestedBudget", event.target.value)}
                      placeholder="Proposed allocation"
                    />
                    {errors.requestedBudget && <small className="hba-error">{errors.requestedBudget}</small>}
                  </label>

                  <label>
                    Actual Spend (₹)
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.actualSpend}
                      onChange={(event) => updateForm("actualSpend", event.target.value)}
                    />
                    {errors.actualSpend && <small className="hba-error">{errors.actualSpend}</small>}
                  </label>

                  <label>
                    Committed Cost (₹)
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.committedCost}
                      onChange={(event) => updateForm("committedCost", event.target.value)}
                    />
                    {errors.committedCost && <small className="hba-error">{errors.committedCost}</small>}
                  </label>

                  <label>
                    Requester <span>*</span>
                    <input
                      value={form.requester}
                      onChange={(event) => updateForm("requester", event.target.value)}
                      placeholder="Requesting manager"
                    />
                    {errors.requester && <small className="hba-error">{errors.requester}</small>}
                  </label>

                  <label>
                    Assigned Reviewer <span>*</span>
                    <input
                      value={form.reviewer}
                      onChange={(event) => updateForm("reviewer", event.target.value)}
                      placeholder="Reviewer role or name"
                    />
                    {errors.reviewer && <small className="hba-error">{errors.reviewer}</small>}
                  </label>

                  <label>
                    Request Date <span>*</span>
                    <input
                      type="date"
                      value={form.submittedDate}
                      onChange={(event) => updateForm("submittedDate", event.target.value)}
                    />
                    {errors.submittedDate && <small className="hba-error">{errors.submittedDate}</small>}
                  </label>

                  <label>
                    Priority
                    <select
                      value={form.priority}
                      onChange={(event) => updateForm("priority", event.target.value)}
                    >
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                    </select>
                  </label>

                  <label className="hba-full-field">
                    Business Justification <span>*</span>
                    <textarea
                      rows="4"
                      value={form.reason}
                      onChange={(event) => updateForm("reason", event.target.value)}
                      placeholder="Explain the reason for the annual budget or revision..."
                    />
                    {errors.reason && <small className="hba-error">{errors.reason}</small>}
                  </label>
                </div>

                {form.originalBudget !== "" && form.requestedBudget !== "" && (
                  <div className="hba-change-preview">
                    <div>
                      <span>Proposed change</span>
                      <strong
                        className={
                          Number(form.requestedBudget) > Number(form.originalBudget)
                            ? "hba-increase"
                            : Number(form.requestedBudget) < Number(form.originalBudget)
                            ? "hba-decrease"
                            : ""
                        }
                      >
                        {Number(form.requestedBudget) > Number(form.originalBudget) ? "+" : ""}
                        {formatCurrency(Number(form.requestedBudget) - Number(form.originalBudget))}
                      </strong>
                    </div>
                    <div>
                      <span>Change percentage</span>
                      <strong>
                        {Number(form.originalBudget) > 0
                          ? `${(((Number(form.requestedBudget) - Number(form.originalBudget)) / Number(form.originalBudget)) * 100).toFixed(1)}%`
                          : "N/A"}
                      </strong>
                    </div>
                    <div>
                      <span>Remaining after actual + commitments</span>
                      <strong
                        className={
                          Number(form.requestedBudget) -
                            Number(form.actualSpend || 0) -
                            Number(form.committedCost || 0) <
                          0
                            ? "hba-increase"
                            : ""
                        }
                      >
                        {formatCurrency(
                          Number(form.requestedBudget) -
                            Number(form.actualSpend || 0) -
                            Number(form.committedCost || 0)
                        )}
                      </strong>
                    </div>
                  </div>
                )}
              </div>

              <div className="hba-modal-footer">
                <button
                  type="button"
                  className="hba-btn hba-btn-secondary"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button type="submit" className="hba-btn hba-btn-primary">
                  <FiSave />
                  {editingId ? "Update & Resubmit" : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {decision && (
        <div className="hba-modal-overlay">
          <div
            className="hba-decision-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="hba-decision-title"
          >
            <div
              className={`hba-decision-icon ${
                decision.nextStatus === "Approved"
                  ? "hba-decision-approved"
                  : "hba-decision-rejected"
              }`}
            >
              {decision.nextStatus === "Approved" ? <FiCheckCircle /> : <FiXCircle />}
            </div>
            <h2 id="hba-decision-title">
              {decision.nextStatus} budget request?
            </h2>
            <p>
              {decision.item.reference} · {decision.item.department} ·{" "}
              {formatCurrency(decision.item.requestedBudget)}
            </p>

            <label className="hba-decision-notes">
              Review notes {decision.nextStatus === "Rejected" ? "(required)" : "(optional)"}
              <textarea
                rows="4"
                value={decisionNotes}
                onChange={(event) => setDecisionNotes(event.target.value)}
                placeholder={
                  decision.nextStatus === "Approved"
                    ? "Add approval notes or conditions..."
                    : "Explain why this request is rejected..."
                }
              />
            </label>

            <div className="hba-modal-footer">
              <button
                type="button"
                className="hba-btn hba-btn-secondary"
                onClick={() => setDecision(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`hba-btn ${
                  decision.nextStatus === "Approved"
                    ? "hba-btn-primary"
                    : "hba-btn-danger"
                }`}
                onClick={confirmDecision}
              >
                {decision.nextStatus === "Approved" ? <FiCheckCircle /> : <FiXCircle />}
                Confirm {decision.nextStatus}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingRequest && (
        <div
          className="hba-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setViewingRequest(null);
          }}
        >
          <div
            className="hba-view-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="hba-view-title"
          >
            <div className="hba-modal-header">
              <div>
                <h2 id="hba-view-title">Budget Request Details</h2>
                <p>{viewingRequest.reference}</p>
              </div>
              <button
                type="button"
                className="hba-close-btn"
                onClick={() => setViewingRequest(null)}
                aria-label="Close details"
              >
                <FiX />
              </button>
            </div>

            <div className="hba-view-body">
              <div className="hba-view-status-row">
                <span className={`hba-status hba-status-${viewingRequest.status.toLowerCase()}`}>
                  {viewingRequest.status}
                </span>
                <span className={`hba-priority hba-priority-${viewingRequest.priority.toLowerCase()}`}>
                  {viewingRequest.priority} priority
                </span>
              </div>

              <div className="hba-detail-grid">
                <div><span>Financial Year</span><strong>{viewingRequest.financialYear}</strong></div>
                <div><span>Request Type</span><strong>{viewingRequest.requestType}</strong></div>
                <div><span>Department</span><strong>{viewingRequest.department}</strong></div>
                <div><span>Category</span><strong>{viewingRequest.category}</strong></div>
                <div><span>Original Budget</span><strong>{formatCurrency(viewingRequest.originalBudget)}</strong></div>
                <div><span>Requested Budget</span><strong>{formatCurrency(viewingRequest.requestedBudget)}</strong></div>
                <div><span>Actual Spend</span><strong>{formatCurrency(viewingRequest.actualSpend)}</strong></div>
                <div><span>Committed Cost</span><strong>{formatCurrency(viewingRequest.committedCost)}</strong></div>
                <div><span>Requester</span><strong>{viewingRequest.requester}</strong></div>
                <div><span>Reviewer</span><strong>{viewingRequest.reviewer}</strong></div>
                <div><span>Request Date</span><strong>{viewingRequest.submittedDate}</strong></div>
                <div><span>Proposed Change</span><strong>{formatCurrency(viewingRequest.requestedBudget - viewingRequest.originalBudget)}</strong></div>
              </div>

              <div className="hba-detail-note">
                <strong>Business Justification</strong>
                <p>{viewingRequest.reason || "No justification supplied."}</p>
              </div>

              <div className="hba-detail-note">
                <strong>Review Notes</strong>
                <p>{viewingRequest.reviewNotes || "No review notes recorded."}</p>
              </div>
            </div>

            <div className="hba-modal-footer">
              <button
                type="button"
                className="hba-btn hba-btn-secondary"
                onClick={() => setViewingRequest(null)}
              >
                Close
              </button>
              {viewingRequest.status === "Pending" && (
                <>
                  <button
                    type="button"
                    className="hba-btn hba-btn-danger"
                    onClick={() => {
                      const item = viewingRequest;
                      setViewingRequest(null);
                      openDecision(item, "Rejected");
                    }}
                  >
                    <FiXCircle />
                    Reject
                  </button>
                  <button
                    type="button"
                    className="hba-btn hba-btn-primary"
                    onClick={() => {
                      const item = viewingRequest;
                      setViewingRequest(null);
                      openDecision(item, "Approved");
                    }}
                  >
                    <FiCheckCircle />
                    Approve
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HRBudgetApprovals;
