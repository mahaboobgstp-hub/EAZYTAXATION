import React, { useMemo, useState } from "react";
import {
  FiCalendar,
  FiDollarSign,
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiX,
  FiSave,
  FiDownload,
  FiRefreshCw,
  FiUsers,
  FiTarget,
  FiAlertCircle,
  FiCheckCircle,
  FiCopy,
} from "react-icons/fi";
import "../../css/hr/HRBudgetPlanning.css";

const DEPARTMENTS = [
  "Human Resources",
  "Finance & Accounts",
  "Production",
  "Sales & Marketing",
  "Administration",
  "Quality Control",
];

const CATEGORIES = [
  "Salaries & Wages",
  "Recruitment",
  "Training & Development",
  "Employee Benefits",
  "Travel & Conveyance",
  "Employee Welfare",
  "Other HR Expenses",
];

const MONTHS = [
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
  "January",
  "February",
  "March",
];

const INITIAL_PLANS = [
  {
    id: 1,
    code: "HRB-2026-001",
    year: "2026-27",
    department: "Human Resources",
    category: "Recruitment",
    budget: 300000,
    monthly: [25000, 25000, 25000, 25000, 25000, 25000, 25000, 25000, 25000, 25000, 25000, 25000],
    owner: "HR Manager",
    assumptions: "Planned hiring for approved vacancies.",
    status: "Draft",
  },
  {
    id: 2,
    code: "HRB-2026-002",
    year: "2026-27",
    department: "Human Resources",
    category: "Training & Development",
    budget: 240000,
    monthly: [10000, 10000, 20000, 10000, 20000, 10000, 30000, 20000, 30000, 30000, 20000, 30000],
    owner: "HR Manager",
    assumptions: "Technical, compliance and soft-skill training.",
    status: "Submitted",
  },
  {
    id: 3,
    code: "HRB-2026-003",
    year: "2026-27",
    department: "Production",
    category: "Employee Benefits",
    budget: 600000,
    monthly: [50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000],
    owner: "Production Manager",
    assumptions: "Employee welfare and eligible benefit expenses.",
    status: "Approved",
  },
  {
    id: 4,
    code: "HRB-2026-004",
    year: "2026-27",
    department: "Finance & Accounts",
    category: "Training & Development",
    budget: 120000,
    monthly: [0, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 20000],
    owner: "Finance Manager",
    assumptions: "Accounting, taxation and compliance training.",
    status: "Draft",
  },
  {
    id: 5,
    code: "HRB-2025-001",
    year: "2025-26",
    department: "Sales & Marketing",
    category: "Travel & Conveyance",
    budget: 360000,
    monthly: [20000, 20000, 30000, 30000, 30000, 30000, 30000, 30000, 30000, 30000, 30000, 20000],
    owner: "Sales Manager",
    assumptions: "Employee travel and business visits.",
    status: "Approved",
  },
];

const emptyForm = (year = "2026-27") => ({
  code: "",
  year,
  department: "",
  category: "",
  budget: "",
  monthly: Array(12).fill(""),
  owner: "",
  assumptions: "",
  status: "Draft",
});

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const formatCompact = (value) => {
  const number = Number(value) || 0;
  if (Math.abs(number) >= 10000000) {
    return `₹${(number / 10000000).toFixed(2)} Cr`;
  }
  if (Math.abs(number) >= 100000) {
    return `₹${(number / 100000).toFixed(2)} L`;
  }
  if (Math.abs(number) >= 1000) {
    return `₹${(number / 1000).toFixed(1)} K`;
  }
  return `₹${number}`;
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

function HRBudgetPlanning() {
  const [plans, setPlans] = useState(INITIAL_PLANS);
  const [selectedYear, setSelectedYear] = useState("2026-27");
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState({});
  const [deleteId, setDeleteId] = useState(null);
  const [notice, setNotice] = useState("");

  const yearPlans = useMemo(
    () => plans.filter((plan) => plan.year === selectedYear),
    [plans, selectedYear]
  );

  const totals = useMemo(() => {
    const planned = yearPlans.reduce(
      (sum, plan) => sum + Number(plan.budget || 0),
      0
    );
    const approved = yearPlans
      .filter((plan) => plan.status === "Approved")
      .reduce((sum, plan) => sum + Number(plan.budget || 0), 0);
    const submitted = yearPlans
      .filter((plan) => plan.status === "Submitted")
      .reduce((sum, plan) => sum + Number(plan.budget || 0), 0);
    const draft = yearPlans
      .filter((plan) => plan.status === "Draft")
      .reduce((sum, plan) => sum + Number(plan.budget || 0), 0);

    return {
      planned,
      approved,
      submitted,
      draft,
      count: yearPlans.length,
      departments: new Set(yearPlans.map((plan) => plan.department)).size,
    };
  }, [yearPlans]);

  const filteredPlans = useMemo(() => {
    const query = search.trim().toLowerCase();

    return yearPlans.filter((plan) => {
      const matchesSearch =
        !query ||
        plan.code.toLowerCase().includes(query) ||
        plan.department.toLowerCase().includes(query) ||
        plan.category.toLowerCase().includes(query) ||
        plan.owner.toLowerCase().includes(query);

      return (
        matchesSearch &&
        (departmentFilter === "All" ||
          plan.department === departmentFilter) &&
        (categoryFilter === "All" || plan.category === categoryFilter) &&
        (statusFilter === "All" || plan.status === statusFilter)
      );
    });
  }, [
    yearPlans,
    search,
    departmentFilter,
    categoryFilter,
    statusFilter,
  ]);

  const monthlyTotals = useMemo(
    () =>
      MONTHS.map((month, index) => ({
        month,
        amount: yearPlans.reduce(
          (sum, plan) => sum + Number(plan.monthly?.[index] || 0),
          0
        ),
      })),
    [yearPlans]
  );

  const monthlyPlannedTotal = monthlyTotals.reduce(
    (sum, month) => sum + month.amount,
    0
  );

  const groupedDepartments = useMemo(
    () =>
      DEPARTMENTS.map((department) => {
        const items = yearPlans.filter(
          (plan) => plan.department === department
        );
        return {
          department,
          total: items.reduce(
            (sum, plan) => sum + Number(plan.budget || 0),
            0
          ),
          approved: items
            .filter((plan) => plan.status === "Approved")
            .reduce((sum, plan) => sum + Number(plan.budget || 0), 0),
          count: items.length,
        };
      }).filter((item) => item.count > 0),
    [yearPlans]
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm(selectedYear));
    setErrors({});
    setNotice("");
    setShowModal(true);
  };

  const openEdit = (plan) => {
    setEditingId(plan.id);
    setForm({
      ...plan,
      monthly: Array.from({ length: 12 }, (_, index) =>
        plan.monthly?.[index] === undefined
          ? ""
          : String(plan.monthly[index])
      ),
      budget: String(plan.budget),
    });
    setErrors({});
    setNotice("");
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

  const updateMonth = (index, value) => {
    setForm((previous) => ({
      ...previous,
      monthly: previous.monthly.map((amount, monthIndex) =>
        monthIndex === index ? value : amount
      ),
    }));
    setErrors((previous) => ({ ...previous, monthly: "" }));
  };

  const monthlyFormTotal = form.monthly.reduce(
    (sum, amount) => sum + (Number(amount) || 0),
    0
  );

  const validateForm = () => {
    const nextErrors = {};
    const budget = Number(form.budget);

    if (!form.year) nextErrors.year = "Select a financial year.";
    if (!form.department) nextErrors.department = "Select a department.";
    if (!form.category) nextErrors.category = "Select a category.";
    if (form.budget === "" || !Number.isFinite(budget) || budget <= 0) {
      nextErrors.budget = "Enter a budget greater than zero.";
    }
    if (!form.owner.trim()) nextErrors.owner = "Enter the budget owner.";

    const invalidMonth = form.monthly.some(
      (amount) =>
        amount !== "" &&
        (!Number.isFinite(Number(amount)) || Number(amount) < 0)
    );
    if (invalidMonth) {
      nextErrors.monthly = "Monthly amounts cannot be negative.";
    } else if (monthlyFormTotal > budget) {
      nextErrors.monthly =
        "Monthly allocation total cannot exceed the annual budget.";
    }

    const duplicate = plans.some(
      (plan) =>
        plan.id !== editingId &&
        plan.year === form.year &&
        plan.department === form.department &&
        plan.category === form.category
    );
    if (duplicate) {
      nextErrors.category =
        "A plan already exists for this year, department and category. Edit that plan instead.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const savePlan = (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    const existing = plans.find((plan) => plan.id === editingId);
    const record = {
      id: editingId ?? Date.now(),
      code:
        form.code.trim() ||
        existing?.code ||
        `HRB-${form.year.slice(0, 4)}-${String(plans.length + 1).padStart(3, "0")}`,
      year: form.year,
      department: form.department,
      category: form.category,
      budget: Number(form.budget),
      monthly: form.monthly.map((amount) => Number(amount) || 0),
      owner: form.owner.trim(),
      assumptions: form.assumptions.trim(),
      status: form.status,
    };

    setPlans((previous) =>
      editingId
        ? previous.map((plan) => (plan.id === editingId ? record : plan))
        : [record, ...previous]
    );

    setSelectedYear(record.year);
    setNotice(
      editingId
        ? "Budget plan updated in this prototype."
        : "Budget plan created in this prototype."
    );
    closeModal();
  };

  const deletePlan = () => {
    setPlans((previous) => previous.filter((plan) => plan.id !== deleteId));
    setDeleteId(null);
    setNotice("Budget plan deleted from this prototype.");
  };

  const duplicatePlan = (plan) => {
    const copy = {
      ...plan,
      id: Date.now(),
      code: `HRB-${plan.year.slice(0, 4)}-${String(plans.length + 1).padStart(3, "0")}`,
      status: "Draft",
      monthly: [...plan.monthly],
      assumptions: plan.assumptions
        ? `${plan.assumptions} (Copied from ${plan.code})`
        : `Copied from ${plan.code}`,
    };
    setPlans((previous) => [copy, ...previous]);
    setSelectedYear(copy.year);
    setNotice(`A draft copy of ${plan.code} was created.`);
  };

  const resetFilters = () => {
    setSearch("");
    setDepartmentFilter("All");
    setCategoryFilter("All");
    setStatusFilter("All");
  };

  const exportPlans = () => {
    exportCSV("HR_Annual_Budget_Planning.csv", [
      [
        "Budget Code",
        "Financial Year",
        "Department",
        "Expense Category",
        "Annual Budget",
        ...MONTHS,
        "Monthly Allocation Total",
        "Unallocated Amount",
        "Budget Owner",
        "Assumptions",
        "Status",
      ],
      ...filteredPlans.map((plan) => [
        plan.code,
        plan.year,
        plan.department,
        plan.category,
        plan.budget,
        ...plan.monthly,
        plan.monthly.reduce((sum, amount) => sum + Number(amount || 0), 0),
        plan.budget -
          plan.monthly.reduce((sum, amount) => sum + Number(amount || 0), 0),
        plan.owner,
        plan.assumptions,
        plan.status,
      ]),
    ]);
  };

  const maximumMonthly = Math.max(
    ...monthlyTotals.map((item) => item.amount),
    1
  );

  return (
    <div className="hbp-page">
      <header className="hbp-header">
        <div>
          <div className="hbp-eyebrow">
            <FiTarget />
            HUMAN RESOURCES
          </div>
          <h1>Annual HR Budget Planning</h1>
          <p>
            Prepare annual HR budgets, allocate department funding and plan
            expenditure across the financial year.
          </p>
        </div>

        <div className="hbp-header-actions">
          <label className="hbp-year-select">
            <FiCalendar />
            <select
              value={selectedYear}
              onChange={(event) => {
                setSelectedYear(event.target.value);
                setNotice("");
              }}
              aria-label="Select financial year"
            >
              <option value="2025-26">FY 2025–26</option>
              <option value="2026-27">FY 2026–27</option>
              <option value="2027-28">FY 2027–28</option>
            </select>
          </label>

          <button
            type="button"
            className="hbp-btn hbp-btn-primary"
            onClick={openCreate}
          >
            <FiPlus />
            Create Budget Plan
          </button>
        </div>
      </header>

      <div className="hbp-prototype">
        <FiAlertCircle />
        <div>
          <strong>Prototype — sample data only</strong>
          <p>
            Changes are held in page state and are not saved to Supabase.
            Budget submissions and approvals are illustrative, not actual
            authorization.
          </p>
        </div>
      </div>

      {notice && (
        <div className="hbp-notice" role="status">
          <FiCheckCircle />
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss message"
          >
            <FiX />
          </button>
        </div>
      )}

      <section className="hbp-kpis">
        <article className="hbp-kpi hbp-kpi-blue">
          <div className="hbp-kpi-top">
            <span>Total Planned Budget</span>
            <FiDollarSign />
          </div>
          <strong>{formatCompact(totals.planned)}</strong>
          <small>{totals.count} budget plan records</small>
        </article>

        <article className="hbp-kpi hbp-kpi-green">
          <div className="hbp-kpi-top">
            <span>Approved Budget</span>
            <FiCheckCircle />
          </div>
          <strong>{formatCompact(totals.approved)}</strong>
          <small>Plans marked Approved</small>
        </article>

        <article className="hbp-kpi hbp-kpi-orange">
          <div className="hbp-kpi-top">
            <span>Awaiting Review</span>
            <FiCalendar />
          </div>
          <strong>{formatCompact(totals.submitted)}</strong>
          <small>Plans marked Submitted</small>
        </article>

        <article className="hbp-kpi hbp-kpi-purple">
          <div className="hbp-kpi-top">
            <span>Draft Budget</span>
            <FiEdit2 />
          </div>
          <strong>{formatCompact(totals.draft)}</strong>
          <small>Not yet submitted</small>
        </article>
      </section>

      <section className="hbp-summary-grid">
        <article className="hbp-panel">
          <div className="hbp-panel-title">
            <div>
              <h2>Department Allocation Summary</h2>
              <p>Planned and approved amounts by department</p>
            </div>
            <FiUsers />
          </div>

          {groupedDepartments.length === 0 ? (
            <div className="hbp-empty">No budget plans for this year.</div>
          ) : (
            <div className="hbp-department-list">
              {groupedDepartments.map((item) => {
                const approvedShare =
                  item.total > 0 ? (item.approved / item.total) * 100 : 0;
                const totalShare =
                  totals.planned > 0
                    ? (item.total / totals.planned) * 100
                    : 0;

                return (
                  <div className="hbp-department-row" key={item.department}>
                    <div className="hbp-department-heading">
                      <div>
                        <strong>{item.department}</strong>
                        <span>
                          {item.count} plan{item.count !== 1 ? "s" : ""} ·{" "}
                          {totalShare.toFixed(1)}% of total
                        </span>
                      </div>
                      <strong>{formatCurrency(item.total)}</strong>
                    </div>
                    <div className="hbp-allocation-track">
                      <div
                        className="hbp-allocation-planned"
                        style={{ width: `${totalShare}%` }}
                      >
                        <div
                          className="hbp-allocation-approved"
                          style={{
                            width: `${approvedShare}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="hbp-department-foot">
                      <span>
                        Approved: {formatCurrency(item.approved)}
                      </span>
                      <span>
                        Pending/draft:{" "}
                        {formatCurrency(item.total - item.approved)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="hbp-legend">
            <span>
              <i className="hbp-legend-approved" /> Approved
            </span>
            <span>
              <i className="hbp-legend-pending" /> Not approved
            </span>
          </div>
        </article>

        <article className="hbp-panel">
          <div className="hbp-panel-title">
            <div>
              <h2>Monthly Allocation Plan</h2>
              <p>Sum of planned monthly amounts for {selectedYear}</p>
            </div>
            <FiCalendar />
          </div>

          <div className="hbp-monthly-total">
            <span>Total monthly allocations entered</span>
            <strong>{formatCompact(monthlyPlannedTotal)}</strong>
          </div>

          <div className="hbp-month-chart">
            {monthlyTotals.map((month) => (
              <div className="hbp-month-column" key={month.month}>
                <div className="hbp-month-bar-wrap">
                  <div
                    className="hbp-month-bar"
                    style={{
                      height: `${(month.amount / maximumMonthly) * 100}%`,
                    }}
                    title={`${month.month}: ${formatCurrency(month.amount)}`}
                  />
                </div>
                <span>{month.month.slice(0, 3)}</span>
              </div>
            ))}
          </div>

          <div className="hbp-month-chart-note">
            Monthly figures are entered within each budget plan. Blank months
            count as zero; an annual budget may still have unallocated funds.
          </div>
        </article>
      </section>

      <section className="hbp-panel hbp-register">
        <div className="hbp-panel-title hbp-register-title">
          <div>
            <h2>Annual Budget Plan Register</h2>
            <p>
              Create, review, edit, duplicate and export department budget plans.
            </p>
          </div>
          <button
            type="button"
            className="hbp-btn hbp-btn-secondary"
            onClick={exportPlans}
          >
            <FiDownload />
            Export CSV
          </button>
        </div>

        <div className="hbp-filters">
          <label className="hbp-search">
            <FiSearch />
            <input
              type="search"
              placeholder="Search code, department, category or owner..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

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

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            aria-label="Filter expense category"
          >
            <option value="All">All categories</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter budget status"
          >
            <option value="All">All statuses</option>
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>

          <button
            type="button"
            className="hbp-btn hbp-btn-reset"
            onClick={resetFilters}
          >
            <FiRefreshCw />
            Reset
          </button>
        </div>

        <div className="hbp-table-scroll">
          <table className="hbp-table">
            <thead>
              <tr>
                <th>Budget Code</th>
                <th>Department</th>
                <th>Expense Category</th>
                <th>Annual Budget</th>
                <th>Monthly Allocated</th>
                <th>Unallocated</th>
                <th>Budget Owner</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlans.map((plan) => {
                const monthlyTotal = plan.monthly.reduce(
                  (sum, amount) => sum + Number(amount || 0),
                  0
                );
                const unallocated = plan.budget - monthlyTotal;

                return (
                  <tr key={plan.id}>
                    <td>
                      <strong>{plan.code}</strong>
                      <small>FY {plan.year}</small>
                    </td>
                    <td>{plan.department}</td>
                    <td>{plan.category}</td>
                    <td>{formatCurrency(plan.budget)}</td>
                    <td>{formatCurrency(monthlyTotal)}</td>
                    <td
                      className={
                        unallocated < 0 ? "hbp-negative" : ""
                      }
                    >
                      {formatCurrency(unallocated)}
                    </td>
                    <td>{plan.owner}</td>
                    <td>
                      <span
                        className={`hbp-status hbp-status-${plan.status.toLowerCase()}`}
                      >
                        {plan.status}
                      </span>
                    </td>
                    <td>
                      <div className="hbp-row-actions">
                        <button
                          type="button"
                          onClick={() => openEdit(plan)}
                          aria-label={`Edit ${plan.code}`}
                          title="Edit"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          type="button"
                          onClick={() => duplicatePlan(plan)}
                          aria-label={`Duplicate ${plan.code}`}
                          title="Duplicate as draft"
                        >
                          <FiCopy />
                        </button>
                        <button
                          type="button"
                          className="hbp-delete-action"
                          onClick={() => setDeleteId(plan.id)}
                          aria-label={`Delete ${plan.code}`}
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredPlans.length === 0 && (
                <tr>
                  <td colSpan="9" className="hbp-empty">
                    No budget plans match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="hbp-register-footer">
          <span>
            Showing {filteredPlans.length} of {yearPlans.length} plans for FY{" "}
            {selectedYear}
          </span>
          <span>
            Annual plan total: <strong>{formatCurrency(totals.planned)}</strong>
          </span>
        </div>
      </section>

      {showModal && (
        <div
          className="hbp-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            className="hbp-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="hbp-modal-title"
          >
            <div className="hbp-modal-header">
              <div>
                <h2 id="hbp-modal-title">
                  {editingId ? "Edit Budget Plan" : "Create Annual Budget Plan"}
                </h2>
                <p>
                  Define the annual amount and distribute it across months.
                </p>
              </div>
              <button
                type="button"
                className="hbp-close-btn"
                onClick={closeModal}
                aria-label="Close dialog"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={savePlan}>
              <div className="hbp-modal-body">
                <div className="hbp-form-grid">
                  <label>
                    Financial Year <span>*</span>
                    <select
                      value={form.year}
                      onChange={(event) => updateForm("year", event.target.value)}
                    >
                      <option value="2025-26">2025–26</option>
                      <option value="2026-27">2026–27</option>
                      <option value="2027-28">2027–28</option>
                    </select>
                    {errors.year && <small className="hbp-error">{errors.year}</small>}
                  </label>

                  <label>
                    Budget Code
                    <input
                      value={form.code}
                      onChange={(event) => updateForm("code", event.target.value)}
                      placeholder="Auto-generated if blank"
                    />
                  </label>

                  <label>
                    Department <span>*</span>
                    <select
                      value={form.department}
                      onChange={(event) =>
                        updateForm("department", event.target.value)
                      }
                    >
                      <option value="">Select department</option>
                      {DEPARTMENTS.map((department) => (
                        <option key={department} value={department}>
                          {department}
                        </option>
                      ))}
                    </select>
                    {errors.department && (
                      <small className="hbp-error">{errors.department}</small>
                    )}
                  </label>

                  <label>
                    Expense Category <span>*</span>
                    <select
                      value={form.category}
                      onChange={(event) =>
                        updateForm("category", event.target.value)
                      }
                    >
                      <option value="">Select category</option>
                      {CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <small className="hbp-error">{errors.category}</small>
                    )}
                  </label>

                  <label>
                    Annual Budget (₹) <span>*</span>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={form.budget}
                      onChange={(event) => updateForm("budget", event.target.value)}
                      placeholder="Enter annual budget"
                    />
                    {errors.budget && (
                      <small className="hbp-error">{errors.budget}</small>
                    )}
                  </label>

                  <label>
                    Budget Owner <span>*</span>
                    <input
                      value={form.owner}
                      onChange={(event) => updateForm("owner", event.target.value)}
                      placeholder="Name or role"
                    />
                    {errors.owner && (
                      <small className="hbp-error">{errors.owner}</small>
                    )}
                  </label>

                  <label>
                    Workflow Status
                    <select
                      value={form.status}
                      onChange={(event) => updateForm("status", event.target.value)}
                    >
                      <option value="Draft">Draft</option>
                      <option value="Submitted">Submitted</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                    <small>
                      Prototype only; this does not enforce authorization.
                    </small>
                  </label>

                  <label className="hbp-assumptions">
                    Planning Assumptions / Notes
                    <textarea
                      rows="3"
                      value={form.assumptions}
                      onChange={(event) =>
                        updateForm("assumptions", event.target.value)
                      }
                      placeholder="Hiring plan, training needs, inflation, headcount changes..."
                    />
                  </label>
                </div>

                <div className="hbp-month-section">
                  <div className="hbp-month-section-title">
                    <div>
                      <h3>Monthly Allocation</h3>
                      <p>Enter the planned amount for each financial-year month.</p>
                    </div>
                    <div className="hbp-month-total">
                      <span>Allocated</span>
                      <strong>{formatCurrency(monthlyFormTotal)}</strong>
                    </div>
                  </div>

                  <div className="hbp-month-form-grid">
                    {MONTHS.map((month, index) => (
                      <label key={month}>
                        {month}
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={form.monthly[index]}
                          onChange={(event) =>
                            updateMonth(index, event.target.value)
                          }
                          placeholder="0"
                        />
                      </label>
                    ))}
                  </div>

                  <div
                    className={`hbp-allocation-balance ${
                      monthlyFormTotal > (Number(form.budget) || 0)
                        ? "hbp-balance-error"
                        : ""
                    }`}
                  >
                    <span>Annual budget</span>
                    <strong>{formatCurrency(Number(form.budget) || 0)}</strong>
                    <span>Not yet allocated</span>
                    <strong>
                      {formatCurrency(
                        (Number(form.budget) || 0) - monthlyFormTotal
                      )}
                    </strong>
                  </div>

                  {errors.monthly && (
                    <small className="hbp-error">{errors.monthly}</small>
                  )}
                </div>
              </div>

              <div className="hbp-modal-footer">
                <button
                  type="button"
                  className="hbp-btn hbp-btn-secondary"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button type="submit" className="hbp-btn hbp-btn-primary">
                  <FiSave />
                  {editingId ? "Save Changes" : "Create Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId !== null && (
        <div className="hbp-modal-overlay">
          <div
            className="hbp-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="hbp-delete-title"
          >
            <div className="hbp-confirm-icon">
              <FiTrash2 />
            </div>
            <h2 id="hbp-delete-title">Delete budget plan?</h2>
            <p>
              This removes the selected plan from this prototype's page state.
              This action cannot be undone after confirming.
            </p>
            <div className="hbp-modal-footer">
              <button
                type="button"
                className="hbp-btn hbp-btn-secondary"
                onClick={() => setDeleteId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="hbp-btn hbp-btn-danger"
                onClick={deletePlan}
              >
                <FiTrash2 />
                Delete Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HRBudgetPlanning;
