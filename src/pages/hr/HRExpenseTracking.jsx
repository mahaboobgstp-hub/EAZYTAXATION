import React, { useMemo, useState } from "react";
import {
  FiDollarSign,
  FiTrendingUp,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiPlus,
  FiSearch,
  FiFilter,
  FiDownload,
  FiEdit2,
  FiTrash2,
  FiX,
  FiSave,
  FiRefreshCw,
  FiCalendar,
  FiFileText,
} from "react-icons/fi";
import "../../css/hr/HRExpenseTracking.css";

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

const INITIAL_BUDGETS = [
  { department: "Human Resources", category: "Recruitment", budget: 300000 },
  { department: "Human Resources", category: "Training & Development", budget: 240000 },
  { department: "Production", category: "Employee Benefits", budget: 600000 },
  { department: "Finance & Accounts", category: "Training & Development", budget: 120000 },
  { department: "Sales & Marketing", category: "Travel & Conveyance", budget: 360000 },
  { department: "Administration", category: "Employee Welfare", budget: 180000 },
  { department: "Quality Control", category: "Training & Development", budget: 150000 },
  { department: "Human Resources", category: "Other HR Expenses", budget: 200000 },
];

const INITIAL_EXPENSES = [
  {
    id: 1,
    reference: "HRE-2026-001",
    date: "2026-10-03",
    department: "Human Resources",
    category: "Recruitment",
    description: "Job portal subscription",
    vendor: "Talent Search Services",
    invoiceNumber: "TS-1048",
    amount: 18000,
    paymentStatus: "Paid",
    approvalStatus: "Approved",
    paymentMethod: "Bank Transfer",
    remarks: "Monthly subscription",
  },
  {
    id: 2,
    reference: "HRE-2026-002",
    date: "2026-10-06",
    department: "Human Resources",
    category: "Training & Development",
    description: "Excel training programme",
    vendor: "Learning Solutions",
    invoiceNumber: "LS-220",
    amount: 32000,
    paymentStatus: "Pending",
    approvalStatus: "Approved",
    paymentMethod: "Bank Transfer",
    remarks: "Employee training",
  },
  {
    id: 3,
    reference: "HRE-2026-003",
    date: "2026-10-08",
    department: "Production",
    category: "Employee Benefits",
    description: "Employee welfare supplies",
    vendor: "Industrial Supplies Co.",
    invoiceNumber: "ISC-882",
    amount: 46000,
    paymentStatus: "Paid",
    approvalStatus: "Approved",
    paymentMethod: "UPI",
    remarks: "",
  },
  {
    id: 4,
    reference: "HRE-2026-004",
    date: "2026-10-10",
    department: "Sales & Marketing",
    category: "Travel & Conveyance",
    description: "Employee business travel",
    vendor: "City Travel Agency",
    invoiceNumber: "CTA-672",
    amount: 28500,
    paymentStatus: "Pending",
    approvalStatus: "Submitted",
    paymentMethod: "Bank Transfer",
    remarks: "Supporting bills to be verified",
  },
  {
    id: 5,
    reference: "HRE-2026-005",
    date: "2026-10-12",
    department: "Administration",
    category: "Employee Welfare",
    description: "Staff welfare event",
    vendor: "Event Partners",
    invoiceNumber: "EP-391",
    amount: 52000,
    paymentStatus: "Unpaid",
    approvalStatus: "Approved",
    paymentMethod: "Bank Transfer",
    remarks: "Quarterly event",
  },
  {
    id: 6,
    reference: "HRE-2026-006",
    date: "2026-10-15",
    department: "Human Resources",
    category: "Other HR Expenses",
    description: "HR documentation and supplies",
    vendor: "Office Mart",
    invoiceNumber: "OM-118",
    amount: 12500,
    paymentStatus: "Paid",
    approvalStatus: "Approved",
    paymentMethod: "Cash",
    remarks: "",
  },
  {
    id: 7,
    reference: "HRE-2026-007",
    date: "2026-10-18",
    department: "Quality Control",
    category: "Training & Development",
    description: "Quality awareness session",
    vendor: "Technical Training Centre",
    invoiceNumber: "TTC-508",
    amount: 22000,
    paymentStatus: "Pending",
    approvalStatus: "Submitted",
    paymentMethod: "Bank Transfer",
    remarks: "Awaiting review",
  },
];

const emptyForm = () => ({
  date: new Date().toISOString().slice(0, 10),
  department: "",
  category: "",
  description: "",
  vendor: "",
  invoiceNumber: "",
  amount: "",
  paymentStatus: "Unpaid",
  approvalStatus: "Draft",
  paymentMethod: "Bank Transfer",
  remarks: "",
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

function HRExpenseTracking() {
  const [expenses, setExpenses] = useState(INITIAL_EXPENSES);
  const [budgets] = useState(INITIAL_BUDGETS);
  const [financialYear, setFinancialYear] = useState("2026-27");
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [approvalFilter, setApprovalFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState({});
  const [deleteId, setDeleteId] = useState(null);
  const [notice, setNotice] = useState("");

  const yearExpenses = useMemo(() => {
    const [startYear] = financialYear.split("-").map(Number);
    const start = `${startYear}-04-01`;
    const end = `${startYear + 1}-03-31`;
    return expenses.filter((expense) => expense.date >= start && expense.date <= end);
  }, [expenses, financialYear]);

  const yearBudgets = useMemo(
    () => budgets.reduce((sum, item) => sum + item.budget, 0),
    [budgets]
  );

  const totals = useMemo(() => {
    const actual = yearExpenses
      .filter((item) => item.approvalStatus === "Approved")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const pendingApproval = yearExpenses
      .filter((item) =>
        ["Draft", "Submitted"].includes(item.approvalStatus)
      )
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const paid = yearExpenses
      .filter(
        (item) =>
          item.approvalStatus === "Approved" &&
          item.paymentStatus === "Paid"
      )
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const unpaid = yearExpenses
      .filter(
        (item) =>
          item.approvalStatus === "Approved" &&
          item.paymentStatus !== "Paid"
      )
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const available = yearBudgets - actual;

    return {
      actual,
      pendingApproval,
      paid,
      unpaid,
      available,
      utilization: yearBudgets > 0 ? (actual / yearBudgets) * 100 : 0,
      count: yearExpenses.length,
    };
  }, [yearExpenses, yearBudgets]);

  const filteredExpenses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return yearExpenses.filter((expense) => {
      const matchesSearch =
        !query ||
        expense.reference.toLowerCase().includes(query) ||
        expense.description.toLowerCase().includes(query) ||
        expense.vendor.toLowerCase().includes(query) ||
        expense.invoiceNumber.toLowerCase().includes(query);

      return (
        matchesSearch &&
        (departmentFilter === "All" ||
          expense.department === departmentFilter) &&
        (categoryFilter === "All" || expense.category === categoryFilter) &&
        (paymentFilter === "All" ||
          expense.paymentStatus === paymentFilter) &&
        (approvalFilter === "All" ||
          expense.approvalStatus === approvalFilter) &&
        (!dateFrom || expense.date >= dateFrom) &&
        (!dateTo || expense.date <= dateTo)
      );
    });
  }, [
    yearExpenses,
    search,
    departmentFilter,
    categoryFilter,
    paymentFilter,
    approvalFilter,
    dateFrom,
    dateTo,
  ]);

  const categorySummary = useMemo(
    () =>
      CATEGORIES.map((category) => {
        const budget = budgets
          .filter((item) => item.category === category)
          .reduce((sum, item) => sum + item.budget, 0);

        const actual = yearExpenses
          .filter(
            (item) =>
              item.category === category &&
              item.approvalStatus === "Approved"
          )
          .reduce((sum, item) => sum + Number(item.amount || 0), 0);

        return {
          category,
          budget,
          actual,
          variance: budget - actual,
        };
      }).filter((item) => item.budget > 0 || item.actual > 0),
    [budgets, yearExpenses]
  );

  const departmentSummary = useMemo(
    () =>
      DEPARTMENTS.map((department) => {
        const budget = budgets
          .filter((item) => item.department === department)
          .reduce((sum, item) => sum + item.budget, 0);

        const actual = yearExpenses
          .filter(
            (item) =>
              item.department === department &&
              item.approvalStatus === "Approved"
          )
          .reduce((sum, item) => sum + Number(item.amount || 0), 0);

        return {
          department,
          budget,
          actual,
          variance: budget - actual,
        };
      }).filter((item) => item.budget > 0 || item.actual > 0),
    [budgets, yearExpenses]
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (expense) => {
    setEditingId(expense.id);
    setForm({
      ...expense,
      amount: String(expense.amount),
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
    const amount = Number(form.amount);

    if (!form.date) nextErrors.date = "Select an expense date.";
    if (!form.department) nextErrors.department = "Select a department.";
    if (!form.category) nextErrors.category = "Select an expense category.";
    if (!form.description.trim()) {
      nextErrors.description = "Enter an expense description.";
    }
    if (!form.vendor.trim()) nextErrors.vendor = "Enter the vendor or payee.";
    if (form.amount === "" || !Number.isFinite(amount) || amount <= 0) {
      nextErrors.amount = "Enter an amount greater than zero.";
    }
    if (dateFrom && dateTo && dateFrom > dateTo) {
      nextErrors.date = "The expense date range is invalid.";
    }

    const duplicateInvoice =
      form.invoiceNumber.trim() &&
      expenses.some(
        (item) =>
          item.id !== editingId &&
          item.invoiceNumber.trim().toLowerCase() ===
            form.invoiceNumber.trim().toLowerCase() &&
          item.vendor.trim().toLowerCase() === form.vendor.trim().toLowerCase()
      );

    if (duplicateInvoice) {
      nextErrors.invoiceNumber =
        "This vendor invoice number already exists in the sample register.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const saveExpense = (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    const record = {
      ...form,
      id: editingId ?? Date.now(),
      reference:
        expenses.find((item) => item.id === editingId)?.reference ||
        `HRE-${form.date.slice(0, 4)}-${String(expenses.length + 1).padStart(3, "0")}`,
      description: form.description.trim(),
      vendor: form.vendor.trim(),
      invoiceNumber: form.invoiceNumber.trim(),
      amount: Number(form.amount),
      remarks: form.remarks.trim(),
    };

    setExpenses((previous) =>
      editingId
        ? previous.map((item) => (item.id === editingId ? record : item))
        : [record, ...previous]
    );

    setFinancialYear(
      (() => {
        const year = Number(record.date.slice(0, 4));
        const month = Number(record.date.slice(5, 7));
        const startYear = month >= 4 ? year : year - 1;
        return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
      })()
    );

    setNotice(
      editingId
        ? "Expense updated in this prototype."
        : "Expense recorded in this prototype."
    );
    closeModal();
  };

  const deleteExpense = () => {
    setExpenses((previous) => previous.filter((item) => item.id !== deleteId));
    setDeleteId(null);
    setNotice("Expense deleted from this prototype.");
  };

  const resetFilters = () => {
    setSearch("");
    setDepartmentFilter("All");
    setCategoryFilter("All");
    setPaymentFilter("All");
    setApprovalFilter("All");
    setDateFrom("");
    setDateTo("");
  };

  const exportExpenses = () => {
    exportCSV("HR_Expense_Tracking.csv", [
      [
        "Reference",
        "Date",
        "Financial Year",
        "Department",
        "Category",
        "Description",
        "Vendor",
        "Invoice Number",
        "Amount",
        "Payment Status",
        "Approval Status",
        "Payment Method",
        "Remarks",
      ],
      ...filteredExpenses.map((item) => [
        item.reference,
        item.date,
        financialYear,
        item.department,
        item.category,
        item.description,
        item.vendor,
        item.invoiceNumber,
        item.amount,
        item.paymentStatus,
        item.approvalStatus,
        item.paymentMethod,
        item.remarks,
      ]),
    ]);
  };

  const maximumCategory = Math.max(
    ...categorySummary.map((item) => Math.max(item.budget, item.actual)),
    1
  );

  const maximumDepartment = Math.max(
    ...departmentSummary.map((item) => Math.max(item.budget, item.actual)),
    1
  );

  return (
    <div className="het-page">
      <header className="het-header">
        <div>
          <div className="het-eyebrow">
            <FiFileText />
            HUMAN RESOURCES
          </div>
          <h1>HR Expense Tracking</h1>
          <p>
            Record HR expenditure, monitor payments and compare approved
            expenses against budget allocations.
          </p>
        </div>

        <div className="het-header-actions">
          <label className="het-year-select">
            <FiCalendar />
            <select
              value={financialYear}
              onChange={(event) => setFinancialYear(event.target.value)}
              aria-label="Financial year"
            >
              <option value="2025-26">FY 2025–26</option>
              <option value="2026-27">FY 2026–27</option>
              <option value="2027-28">FY 2027–28</option>
            </select>
          </label>

          <button
            type="button"
            className="het-btn het-btn-primary"
            onClick={openCreate}
          >
            <FiPlus />
            Add Expense
          </button>
        </div>
      </header>

      <div className="het-prototype">
        <FiAlertCircle />
        <div>
          <strong>Prototype — sample data only</strong>
          <p>
            Expenses and changes are held in browser page state only. Budget
            limits are illustrative; no accounting ledger, payment gateway,
            approval authority or Supabase connection is active.
          </p>
        </div>
      </div>

      {notice && (
        <div className="het-notice" role="status">
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

      <section className="het-kpis">
        <article className="het-kpi het-kpi-blue">
          <div className="het-kpi-top">
            <span>Illustrative HR Budget</span>
            <FiDollarSign />
          </div>
          <strong>{formatCompact(yearBudgets)}</strong>
          <small>Sum of configured category allocations</small>
        </article>

        <article className="het-kpi het-kpi-green">
          <div className="het-kpi-top">
            <span>Approved Expenditure</span>
            <FiTrendingUp />
          </div>
          <strong>{formatCompact(totals.actual)}</strong>
          <small>{totals.utilization.toFixed(1)}% of configured budget</small>
        </article>

        <article className="het-kpi het-kpi-orange">
          <div className="het-kpi-top">
            <span>Awaiting Approval</span>
            <FiClock />
          </div>
          <strong>{formatCompact(totals.pendingApproval)}</strong>
          <small>Draft and submitted expense entries</small>
        </article>

        <article className="het-kpi het-kpi-purple">
          <div className="het-kpi-top">
            <span>Approved but Unpaid</span>
            <FiFileText />
          </div>
          <strong>{formatCompact(totals.unpaid)}</strong>
          <small>Approved expenses not marked paid</small>
        </article>
      </section>

      <section className="het-utilization-grid">
        <article className="het-panel">
          <div className="het-panel-title">
            <div>
              <h2>Overall Budget Utilization</h2>
              <p>Approved expense amount compared with configured budget</p>
            </div>
            <FiTrendingUp />
          </div>

          <div className="het-utilization-number">
            <strong>{totals.utilization.toFixed(1)}%</strong>
            <span>Utilized</span>
          </div>

          <div className="het-progress-track">
            <div
              className={`het-progress-fill ${
                totals.utilization > 100 ? "het-progress-over" : ""
              }`}
              style={{ width: `${Math.min(totals.utilization, 100)}%` }}
            />
          </div>

          <div className="het-budget-stat-list">
            <div>
              <span>
                <i className="het-dot het-dot-spent" />
                Approved expenditure
              </span>
              <strong>{formatCurrency(totals.actual)}</strong>
            </div>
            <div>
              <span>
                <i className="het-dot het-dot-available" />
                Remaining against budget
              </span>
              <strong className={totals.available < 0 ? "het-negative" : ""}>
                {formatCurrency(totals.available)}
              </strong>
            </div>
            <div>
              <span>
                <i className="het-dot het-dot-pending" />
                Awaiting approval
              </span>
              <strong>{formatCurrency(totals.pendingApproval)}</strong>
            </div>
          </div>

          {totals.available < 0 && (
            <div className="het-alert">
              <FiAlertCircle />
              Approved expenditure exceeds the configured budget.
            </div>
          )}
        </article>

        <article className="het-panel">
          <div className="het-panel-title">
            <div>
              <h2>Expense Category Breakdown</h2>
              <p>Approved expenses versus configured category budget</p>
            </div>
            <FiDollarSign />
          </div>

          <div className="het-category-list">
            {categorySummary.map((item) => {
              const ratio =
                item.budget > 0 ? (item.actual / item.budget) * 100 : 0;
              const overBudget = item.actual > item.budget;

              return (
                <div className="het-category-row" key={item.category}>
                  <div className="het-category-heading">
                    <span>{item.category}</span>
                    <strong>{formatCurrency(item.actual)}</strong>
                  </div>
                  <div className="het-category-track">
                    <div
                      className={`het-category-fill ${
                        overBudget ? "het-category-over" : ""
                      }`}
                      style={{
                        width: `${Math.min(
                          (Math.max(item.budget, item.actual) /
                            maximumCategory) *
                            100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="het-category-foot">
                    <span>Budget: {formatCurrency(item.budget)}</span>
                    <span className={overBudget ? "het-negative" : ""}>
                      {overBudget
                        ? "Over budget"
                        : `${ratio.toFixed(1)}% utilized`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className="het-panel het-department-panel">
        <div className="het-panel-title">
          <div>
            <h2>Department-wise Utilization</h2>
            <p>Compare each department's configured budget and approved spend</p>
          </div>
        </div>

        {departmentSummary.length === 0 ? (
          <div className="het-empty">No department budget data available.</div>
        ) : (
          <div className="het-department-list">
            {departmentSummary.map((item) => {
              const utilization =
                item.budget > 0 ? (item.actual / item.budget) * 100 : 0;

              return (
                <div className="het-department-row" key={item.department}>
                  <div className="het-department-name">
                    <strong>{item.department}</strong>
                    <span>
                      {formatCurrency(item.actual)} of{" "}
                      {formatCurrency(item.budget)}
                    </span>
                  </div>

                  <div className="het-department-bars">
                    <div className="het-department-budget">
                      <div
                        className={`het-department-actual ${
                          utilization > 100 ? "het-department-over" : ""
                        }`}
                        style={{
                          width: `${
                            item.budget > 0
                              ? Math.min((item.actual / item.budget) * 100, 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="het-department-result">
                    <strong className={item.variance < 0 ? "het-negative" : ""}>
                      {formatCurrency(item.variance)}
                    </strong>
                    <span>{utilization.toFixed(1)}% used</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="het-chart-legend">
          <span><i className="het-dot het-dot-spent" /> Approved spend</span>
          <span><i className="het-dot het-dot-available" /> Budget track</span>
        </div>
        <p className="het-chart-note">
          Negative variance means approved expenses exceed the configured
          department allocation.
        </p>
      </section>

      <section className="het-panel het-register">
        <div className="het-panel-title het-register-heading">
          <div>
            <h2>HR Expense Register</h2>
            <p>
              Search and manage expense entries for FY {financialYear}.
            </p>
          </div>
          <button
            type="button"
            className="het-btn het-btn-secondary"
            onClick={exportExpenses}
          >
            <FiDownload />
            Export CSV
          </button>
        </div>

        <div className="het-filters">
          <label className="het-search">
            <FiSearch />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search reference, description, vendor or invoice..."
            />
          </label>

          <label className="het-select-filter">
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
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            aria-label="Filter category"
          >
            <option value="All">All categories</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={paymentFilter}
            onChange={(event) => setPaymentFilter(event.target.value)}
            aria-label="Filter payment status"
          >
            <option value="All">All payment statuses</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Unpaid">Unpaid</option>
          </select>

          <select
            value={approvalFilter}
            onChange={(event) => setApprovalFilter(event.target.value)}
            aria-label="Filter approval status"
          >
            <option value="All">All approval statuses</option>
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <div className="het-date-filters">
          <label>
            From
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </label>
          <label>
            To
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </label>
          <button
            type="button"
            className="het-btn het-btn-reset"
            onClick={resetFilters}
          >
            <FiRefreshCw />
            Reset Filters
          </button>
        </div>

        <div className="het-table-scroll">
          <table className="het-table">
            <thead>
              <tr>
                <th>Reference / Date</th>
                <th>Description / Invoice</th>
                <th>Department</th>
                <th>Category</th>
                <th>Vendor</th>
                <th>Amount</th>
                <th>Approval</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((expense) => (
                <tr key={expense.id}>
                  <td>
                    <strong>{expense.reference}</strong>
                    <small>{expense.date}</small>
                  </td>
                  <td>
                    <strong>{expense.description}</strong>
                    <small>
                      Invoice: {expense.invoiceNumber || "—"}
                    </small>
                  </td>
                  <td>{expense.department}</td>
                  <td>{expense.category}</td>
                  <td>{expense.vendor}</td>
                  <td><strong>{formatCurrency(expense.amount)}</strong></td>
                  <td>
                    <span
                      className={`het-status het-status-${expense.approvalStatus.toLowerCase()}`}
                    >
                      {expense.approvalStatus}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`het-status het-payment-${expense.paymentStatus.toLowerCase()}`}
                    >
                      {expense.paymentStatus}
                    </span>
                  </td>
                  <td>
                    <div className="het-row-actions">
                      <button
                        type="button"
                        onClick={() => openEdit(expense)}
                        title="Edit expense"
                        aria-label={`Edit ${expense.reference}`}
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        type="button"
                        className="het-delete-action"
                        onClick={() => setDeleteId(expense.id)}
                        title="Delete expense"
                        aria-label={`Delete ${expense.reference}`}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan="9" className="het-empty">
                    No expenses match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="het-register-footer">
          <span>
            Showing {filteredExpenses.length} of {yearExpenses.length} entries
          </span>
          <strong>
            Filtered total:{" "}
            {formatCurrency(
              filteredExpenses.reduce(
                (sum, item) => sum + Number(item.amount || 0),
                0
              )
            )}
          </strong>
        </div>
      </section>

      {showModal && (
        <div
          className="het-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            className="het-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="het-modal-title"
          >
            <div className="het-modal-header">
              <div>
                <h2 id="het-modal-title">
                  {editingId ? "Edit HR Expense" : "Record HR Expense"}
                </h2>
                <p>
                  Enter the expense details and its current workflow status.
                </p>
              </div>
              <button
                type="button"
                className="het-close-btn"
                onClick={closeModal}
                aria-label="Close dialog"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={saveExpense}>
              <div className="het-modal-body">
                <div className="het-form-grid">
                  <label>
                    Expense Date <span>*</span>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(event) => updateForm("date", event.target.value)}
                    />
                    {errors.date && <small className="het-error">{errors.date}</small>}
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
                      <small className="het-error">{errors.department}</small>
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
                      <small className="het-error">{errors.category}</small>
                    )}
                  </label>

                  <label>
                    Amount (₹) <span>*</span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form.amount}
                      onChange={(event) => updateForm("amount", event.target.value)}
                      placeholder="Enter amount"
                    />
                    {errors.amount && (
                      <small className="het-error">{errors.amount}</small>
                    )}
                  </label>

                  <label className="het-full-field">
                    Expense Description <span>*</span>
                    <input
                      value={form.description}
                      onChange={(event) =>
                        updateForm("description", event.target.value)
                      }
                      placeholder="Purpose of expenditure"
                    />
                    {errors.description && (
                      <small className="het-error">{errors.description}</small>
                    )}
                  </label>

                  <label>
                    Vendor / Payee <span>*</span>
                    <input
                      value={form.vendor}
                      onChange={(event) => updateForm("vendor", event.target.value)}
                      placeholder="Vendor or payee name"
                    />
                    {errors.vendor && (
                      <small className="het-error">{errors.vendor}</small>
                    )}
                  </label>

                  <label>
                    Invoice / Bill Number
                    <input
                      value={form.invoiceNumber}
                      onChange={(event) =>
                        updateForm("invoiceNumber", event.target.value)
                      }
                      placeholder="Supplier invoice reference"
                    />
                    {errors.invoiceNumber && (
                      <small className="het-error">{errors.invoiceNumber}</small>
                    )}
                  </label>

                  <label>
                    Approval Status
                    <select
                      value={form.approvalStatus}
                      onChange={(event) =>
                        updateForm("approvalStatus", event.target.value)
                      }
                    >
                      <option value="Draft">Draft</option>
                      <option value="Submitted">Submitted</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                    <small>
                      Prototype only; no authorization checks are performed.
                    </small>
                  </label>

                  <label>
                    Payment Status
                    <select
                      value={form.paymentStatus}
                      onChange={(event) =>
                        updateForm("paymentStatus", event.target.value)
                      }
                    >
                      <option value="Unpaid">Unpaid</option>
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                    </select>
                  </label>

                  <label>
                    Payment Method
                    <select
                      value={form.paymentMethod}
                      onChange={(event) =>
                        updateForm("paymentMethod", event.target.value)
                      }
                    >
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="UPI">UPI</option>
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Corporate Card">Corporate Card</option>
                      <option value="Other">Other</option>
                    </select>
                  </label>

                  <label className="het-full-field">
                    Remarks
                    <textarea
                      rows="3"
                      value={form.remarks}
                      onChange={(event) =>
                        updateForm("remarks", event.target.value)
                      }
                      placeholder="Supporting documents, purpose or notes..."
                    />
                  </label>
                </div>
              </div>

              <div className="het-modal-footer">
                <button
                  type="button"
                  className="het-btn het-btn-secondary"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button type="submit" className="het-btn het-btn-primary">
                  <FiSave />
                  {editingId ? "Save Changes" : "Record Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId !== null && (
        <div className="het-modal-overlay">
          <div
            className="het-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="het-delete-title"
          >
            <div className="het-confirm-icon"><FiTrash2 /></div>
            <h2 id="het-delete-title">Delete this expense?</h2>
            <p>
              This removes the expense from this prototype's page state. No
              accounting entry will be created or reversed.
            </p>
            <div className="het-modal-footer">
              <button
                type="button"
                className="het-btn het-btn-secondary"
                onClick={() => setDeleteId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="het-btn het-btn-danger"
                onClick={deleteExpense}
              >
                <FiTrash2 />
                Delete Expense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HRExpenseTracking;
