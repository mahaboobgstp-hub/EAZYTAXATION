import React, { useMemo, useState } from "react";
import {
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiPieChart,
  FiUsers,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiSearch,
  FiDownload,
  FiRefreshCw,
  FiFilter,
  FiCalendar,
  FiBriefcase,
  FiActivity,
} from "react-icons/fi";
import "../../css/hr/HRBudgetDashboardReports.css";

const INITIAL_DEPARTMENTS = [
  {
    id: 1,
    name: "Human Resources",
    headcount: 8,
    budget: 1800000,
    actual: 1120000,
    committed: 180000,
    status: "On Track",
  },
  {
    id: 2,
    name: "Finance & Accounts",
    headcount: 12,
    budget: 2400000,
    actual: 1680000,
    committed: 260000,
    status: "On Track",
  },
  {
    id: 3,
    name: "Production",
    headcount: 65,
    budget: 9600000,
    actual: 7420000,
    committed: 920000,
    status: "Watch",
  },
  {
    id: 4,
    name: "Sales & Marketing",
    headcount: 18,
    budget: 4200000,
    actual: 3260000,
    committed: 410000,
    status: "On Track",
  },
  {
    id: 5,
    name: "Administration",
    headcount: 10,
    budget: 2100000,
    actual: 1740000,
    committed: 240000,
    status: "Over Budget Risk",
  },
  {
    id: 6,
    name: "Quality Control",
    headcount: 14,
    budget: 3000000,
    actual: 2050000,
    committed: 320000,
    status: "On Track",
  },
];

const INITIAL_MONTHS = [
  { month: "Apr", budget: 1800000, actual: 1620000 },
  { month: "May", budget: 1800000, actual: 1710000 },
  { month: "Jun", budget: 1800000, actual: 1760000 },
  { month: "Jul", budget: 1800000, actual: 1680000 },
  { month: "Aug", budget: 1800000, actual: 1790000 },
  { month: "Sep", budget: 1800000, actual: 1840000 },
  { month: "Oct", budget: 1800000, actual: 1720000 },
  { month: "Nov", budget: 1800000, actual: 0 },
  { month: "Dec", budget: 1800000, actual: 0 },
  { month: "Jan", budget: 1800000, actual: 0 },
  { month: "Feb", budget: 1800000, actual: 0 },
  { month: "Mar", budget: 1800000, actual: 0 },
];

const INITIAL_CATEGORIES = [
  { id: 1, name: "Salaries & Wages", budget: 16500000, actual: 11600000 },
  { id: 2, name: "Recruitment", budget: 900000, actual: 520000 },
  { id: 3, name: "Training & Development", budget: 650000, actual: 285000 },
  { id: 4, name: "Employee Benefits", budget: 2200000, actual: 1470000 },
  { id: 5, name: "Travel & Conveyance", budget: 450000, actual: 310000 },
  { id: 6, name: "Employee Welfare", budget: 750000, actual: 475000 },
  { id: 7, name: "Other HR Expenses", budget: 1650000, actual: 2610000 },
];

const INITIAL_ACTIVITIES = [
  {
    id: 1,
    title: "Production department budget reviewed",
    detail: "Department allocation review",
    date: "19 Oct 2026",
    status: "Reviewed",
  },
  {
    id: 2,
    title: "Training expenditure recorded",
    detail: "Training & Development",
    date: "18 Oct 2026",
    status: "Recorded",
  },
  {
    id: 3,
    title: "Recruitment budget approval pending",
    detail: "Recruitment expenses",
    date: "17 Oct 2026",
    status: "Pending",
  },
  {
    id: 4,
    title: "Administration budget flagged",
    detail: "Potential overspend",
    date: "16 Oct 2026",
    status: "Attention",
  },
];

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);

const formatCompact = (amount) => {
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

const percentage = (value, total) =>
  total > 0 ? Math.round((value / total) * 100) : 0;

const escapeCSV = (value) => {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
};

const downloadCSV = (filename, rows) => {
  const csv = rows.map((row) => row.map(escapeCSV).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], {
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

function HRBudgetDashboardReports() {
  const [departments] = useState(INITIAL_DEPARTMENTS);
  const [months] = useState(INITIAL_MONTHS);
  const [categories] = useState(INITIAL_CATEGORIES);
  const [activities] = useState(INITIAL_ACTIVITIES);

  const [financialYear, setFinancialYear] = useState("2026-27");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const totals = useMemo(() => {
    const annualBudget = departments.reduce(
      (sum, item) => sum + item.budget,
      0
    );
    const actual = departments.reduce((sum, item) => sum + item.actual, 0);
    const committed = departments.reduce(
      (sum, item) => sum + item.committed,
      0
    );
    const remaining = annualBudget - actual - committed;

    return {
      annualBudget,
      actual,
      committed,
      remaining,
      utilization: percentage(actual, annualBudget),
      committedPercentage: percentage(committed, annualBudget),
      availablePercentage: percentage(
        Math.max(remaining, 0),
        annualBudget
      ),
    };
  }, [departments]);

  const filteredDepartments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return departments.filter((department) => {
      const matchesSearch =
        !query ||
        department.name.toLowerCase().includes(query) ||
        department.status.toLowerCase().includes(query);

      const matchesDepartment =
        departmentFilter === "All" ||
        department.name === departmentFilter;

      const matchesStatus =
        statusFilter === "All" || department.status === statusFilter;

      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [departments, searchTerm, departmentFilter, statusFilter]);

  const currentMonthSpend = months
    .filter((month) => month.actual > 0)
    .reduce((sum, month) => sum + month.actual, 0);

  const currentMonthBudget = months
    .filter((month) => month.actual > 0)
    .reduce((sum, month) => sum + month.budget, 0);

  const highestDepartment = [...departments].sort(
    (a, b) => b.actual - a.actual
  )[0];

  const overspendCategories = categories.filter(
    (category) => category.actual > category.budget
  );

  const handleExportDepartments = () => {
    downloadCSV("HR_Budget_Department_Report.csv", [
      [
        "Financial Year",
        "Department",
        "Headcount",
        "Allocated Budget",
        "Actual Spend",
        "Committed Cost",
        "Remaining Budget",
        "Utilization %",
        "Status",
      ],
      ...filteredDepartments.map((department) => [
        financialYear,
        department.name,
        department.headcount,
        department.budget,
        department.actual,
        department.committed,
        department.budget - department.actual - department.committed,
        percentage(department.actual, department.budget),
        department.status,
      ]),
    ]);
  };

  const handleExportCategories = () => {
    downloadCSV("HR_Budget_Expense_Category_Report.csv", [
      ["Financial Year", "Expense Category", "Budget", "Actual", "Variance"],
      ...categories.map((category) => [
        financialYear,
        category.name,
        category.budget,
        category.actual,
        category.budget - category.actual,
      ]),
    ]);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setDepartmentFilter("All");
    setStatusFilter("All");
  };

  return (
    <div className="hbd-page">
      <div className="hbd-header">
        <div>
          <div className="hbd-eyebrow">
            <FiBriefcase />
            HUMAN RESOURCES
          </div>
          <h1>HR Budget Dashboard & Reports</h1>
          <p>
            Monitor HR allocations, spending, commitments and budget
            utilization across departments.
          </p>
        </div>

        <div className="hbd-header-actions">
          <label className="hbd-year-control">
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
            className="hbd-btn hbd-btn-primary"
            onClick={handleExportDepartments}
          >
            <FiDownload />
            Export Report
          </button>
        </div>
      </div>

      <div className="hbd-prototype-banner">
        <FiAlertCircle />
        <div>
          <strong>Prototype / Sample Data</strong>
          <span>
            Figures are illustrative and change with the selected filters only
            where supported. No live accounting data, budget approvals or
            Supabase records are connected yet.
          </span>
        </div>
      </div>

      <div className="hbd-kpi-grid">
        <div className="hbd-kpi-card hbd-kpi-blue">
          <div className="hbd-kpi-top">
            <span>Annual HR Budget</span>
            <div className="hbd-kpi-icon"><FiDollarSign /></div>
          </div>
          <strong>{formatCompact(totals.annualBudget)}</strong>
          <small>Across {departments.length} departments</small>
        </div>

        <div className="hbd-kpi-card hbd-kpi-green">
          <div className="hbd-kpi-top">
            <span>Actual Expenditure</span>
            <div className="hbd-kpi-icon"><FiTrendingUp /></div>
          </div>
          <strong>{formatCompact(totals.actual)}</strong>
          <small>{totals.utilization}% of allocated budget</small>
        </div>

        <div className="hbd-kpi-card hbd-kpi-orange">
          <div className="hbd-kpi-top">
            <span>Committed Costs</span>
            <div className="hbd-kpi-icon"><FiClock /></div>
          </div>
          <strong>{formatCompact(totals.committed)}</strong>
          <small>Expected future expenditure</small>
        </div>

        <div className="hbd-kpi-card hbd-kpi-purple">
          <div className="hbd-kpi-top">
            <span>Available Balance</span>
            <div className="hbd-kpi-icon"><FiPieChart /></div>
          </div>
          <strong>{formatCompact(totals.remaining)}</strong>
          <small>After actual and committed costs</small>
        </div>
      </div>

      <div className="hbd-overview-grid">
        <section className="hbd-panel hbd-utilization-panel">
          <div className="hbd-panel-heading">
            <div>
              <h2>Budget Utilization</h2>
              <p>Overall position for FY {financialYear}</p>
            </div>
            <FiActivity />
          </div>

          <div className="hbd-utilization-content">
            <div
              className="hbd-donut"
              style={{
                "--hbd-utilization": `${Math.min(totals.utilization, 100)}%`,
              }}
              role="img"
              aria-label={`Actual budget utilization ${totals.utilization}%`}
            >
              <div className="hbd-donut-center">
                <strong>{totals.utilization}%</strong>
                <span>Utilized</span>
              </div>
            </div>

            <div className="hbd-utilization-legend">
              <div>
                <span className="hbd-legend-dot hbd-dot-actual" />
                <span>Actual spend</span>
                <strong>{formatCurrency(totals.actual)}</strong>
              </div>
              <div>
                <span className="hbd-legend-dot hbd-dot-committed" />
                <span>Committed</span>
                <strong>{formatCurrency(totals.committed)}</strong>
              </div>
              <div>
                <span className="hbd-legend-dot hbd-dot-available" />
                <span>Available</span>
                <strong>{formatCurrency(totals.remaining)}</strong>
              </div>
            </div>
          </div>

          <div className="hbd-progress-block">
            <div className="hbd-progress-label">
              <span>Actual + committed</span>
              <strong>
                {percentage(
                  totals.actual + totals.committed,
                  totals.annualBudget
                )}%
              </strong>
            </div>
            <div className="hbd-progress-track">
              <div
                className="hbd-progress-fill"
                style={{
                  width: `${Math.min(
                    percentage(
                      totals.actual + totals.committed,
                      totals.annualBudget
                    ),
                    100
                  )}%`,
                }}
              />
            </div>
          </div>
        </section>

        <section className="hbd-panel hbd-monthly-panel">
          <div className="hbd-panel-heading">
            <div>
              <h2>Monthly Budget vs Actual</h2>
              <p>Illustrative expenditure by month</p>
            </div>
            <FiTrendingUp />
          </div>

          <div className="hbd-monthly-summary">
            <div>
              <span>Recorded actual</span>
              <strong>{formatCompact(currentMonthSpend)}</strong>
            </div>
            <div>
              <span>Recorded budget</span>
              <strong>{formatCompact(currentMonthBudget)}</strong>
            </div>
          </div>

          <div className="hbd-monthly-chart">
            {months.map((month) => {
              const maxValue = Math.max(
                ...months.map((item) => Math.max(item.budget, item.actual)),
                1
              );
              const budgetHeight = (month.budget / maxValue) * 100;
              const actualHeight = (month.actual / maxValue) * 100;

              return (
                <div className="hbd-month-column" key={month.month}>
                  <div className="hbd-month-bars">
                    <div
                      className="hbd-month-bar hbd-month-budget"
                      style={{ height: `${budgetHeight}%` }}
                      title={`${month.month} budget: ${formatCurrency(month.budget)}`}
                    />
                    <div
                      className="hbd-month-bar hbd-month-actual"
                      style={{ height: `${actualHeight}%` }}
                      title={`${month.month} actual: ${formatCurrency(month.actual)}`}
                    />
                  </div>
                  <span>{month.month}</span>
                </div>
              );
            })}
          </div>

          <div className="hbd-chart-legend">
            <span><i className="hbd-legend-dot hbd-dot-budget" /> Budget</span>
            <span><i className="hbd-legend-dot hbd-dot-actual" /> Actual</span>
          </div>
        </section>
      </div>

      <section className="hbd-panel hbd-department-panel">
        <div className="hbd-panel-heading hbd-table-heading">
          <div>
            <h2>Department-wise Budget Overview</h2>
            <p>Compare allocations, actual costs and remaining funds</p>
          </div>
          <button
            type="button"
            className="hbd-btn hbd-btn-secondary"
            onClick={handleExportDepartments}
          >
            <FiDownload />
            Export Departments
          </button>
        </div>

        <div className="hbd-filters">
          <div className="hbd-search">
            <FiSearch />
            <input
              type="search"
              placeholder="Search department or status..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <label className="hbd-filter-control">
            <FiFilter />
            <select
              value={departmentFilter}
              onChange={(event) => setDepartmentFilter(event.target.value)}
              aria-label="Filter by department"
            >
              <option value="All">All departments</option>
              {departments.map((department) => (
                <option key={department.id} value={department.name}>
                  {department.name}
                </option>
              ))}
            </select>
          </label>

          <label className="hbd-filter-control">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by budget status"
            >
              <option value="All">All statuses</option>
              <option value="On Track">On Track</option>
              <option value="Watch">Watch</option>
              <option value="Over Budget Risk">Over Budget Risk</option>
            </select>
          </label>

          <button
            type="button"
            className="hbd-btn hbd-btn-reset"
            onClick={handleResetFilters}
            title="Reset filters"
          >
            <FiRefreshCw />
            Reset
          </button>
        </div>

        <div className="hbd-table-wrap">
          <table className="hbd-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Headcount</th>
                <th>Budget</th>
                <th>Actual Spend</th>
                <th>Committed</th>
                <th>Remaining</th>
                <th>Utilization</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredDepartments.map((department) => {
                const remaining =
                  department.budget -
                  department.actual -
                  department.committed;
                const utilization = percentage(
                  department.actual,
                  department.budget
                );

                return (
                  <tr key={department.id}>
                    <td>
                      <strong>{department.name}</strong>
                    </td>
                    <td>{department.headcount}</td>
                    <td>{formatCurrency(department.budget)}</td>
                    <td>{formatCurrency(department.actual)}</td>
                    <td>{formatCurrency(department.committed)}</td>
                    <td className={remaining < 0 ? "hbd-negative" : ""}>
                      {formatCurrency(remaining)}
                    </td>
                    <td>
                      <div className="hbd-table-utilization">
                        <span>{utilization}%</span>
                        <div className="hbd-mini-track">
                          <div
                            className={`hbd-mini-fill ${
                              utilization >= 90 ? "hbd-mini-warning" : ""
                            }`}
                            style={{ width: `${Math.min(utilization, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`hbd-status ${
                          department.status === "On Track"
                            ? "hbd-status-good"
                            : department.status === "Watch"
                            ? "hbd-status-watch"
                            : "hbd-status-risk"
                        }`}
                      >
                        {department.status}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filteredDepartments.length === 0 && (
                <tr>
                  <td colSpan="8" className="hbd-empty">
                    No departments match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="hbd-table-footer">
          Showing {filteredDepartments.length} of {departments.length} departments
        </div>
      </section>

      <div className="hbd-bottom-grid">
        <section className="hbd-panel hbd-category-panel">
          <div className="hbd-panel-heading">
            <div>
              <h2>Expense Category Analysis</h2>
              <p>Budget versus actual by expense type</p>
            </div>
            <button
              type="button"
              className="hbd-icon-btn"
              onClick={handleExportCategories}
              aria-label="Export expense categories"
              title="Export expense categories"
            >
              <FiDownload />
            </button>
          </div>

          <div className="hbd-category-list">
            {categories.map((category) => {
              const used = percentage(category.actual, category.budget);
              const overBudget = category.actual > category.budget;

              return (
                <div className="hbd-category-item" key={category.id}>
                  <div className="hbd-category-top">
                    <span>{category.name}</span>
                    <strong>{formatCurrency(category.actual)}</strong>
                  </div>
                  <div className="hbd-category-track">
                    <div
                      className={`hbd-category-fill ${
                        overBudget ? "hbd-category-over" : ""
                      }`}
                      style={{ width: `${Math.min(used, 100)}%` }}
                    />
                  </div>
                  <div className="hbd-category-bottom">
                    <span>Budget: {formatCurrency(category.budget)}</span>
                    <span className={overBudget ? "hbd-negative" : ""}>
                      {overBudget ? "Over budget" : `${used}% utilized`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {overspendCategories.length > 0 && (
            <div className="hbd-inline-alert">
              <FiAlertCircle />
              {overspendCategories.length} expense category
              {overspendCategories.length > 1 ? "ies" : ""} exceed
              {overspendCategories.length === 1 ? "s" : ""} the illustrative
              budget.
            </div>
          )}
        </section>

        <section className="hbd-panel hbd-insights-panel">
          <div className="hbd-panel-heading">
            <div>
              <h2>Budget Insights</h2>
              <p>Highlights from the sample figures</p>
            </div>
            <FiPieChart />
          </div>

          <div className="hbd-insight-card">
            <div className="hbd-insight-icon hbd-insight-blue">
              <FiUsers />
            </div>
            <div>
              <span>Highest actual expenditure</span>
              <strong>{highestDepartment?.name || "Not available"}</strong>
              <small>
                {formatCurrency(highestDepartment?.actual || 0)} recorded
              </small>
            </div>
          </div>

          <div className="hbd-insight-card">
            <div className="hbd-insight-icon hbd-insight-orange">
              <FiTrendingDown />
            </div>
            <div>
              <span>Categories exceeding budget</span>
              <strong>{overspendCategories.length}</strong>
              <small>Review spending and variance before approval</small>
            </div>
          </div>

          <div className="hbd-insight-card">
            <div className="hbd-insight-icon hbd-insight-green">
              <FiCheckCircle />
            </div>
            <div>
              <span>Budget still available</span>
              <strong>{formatCurrency(totals.remaining)}</strong>
              <small>After deducting actual and committed costs</small>
            </div>
          </div>

          <div className="hbd-insight-note">
            <FiAlertCircle />
            <p>
              These insights are calculated from the sample data in this page.
              They are not an accounting forecast or an approved financial
              statement.
            </p>
          </div>
        </section>

        <section className="hbd-panel hbd-activity-panel">
          <div className="hbd-panel-heading">
            <div>
              <h2>Recent Budget Activity</h2>
              <p>Illustrative HR budget events</p>
            </div>
            <FiClock />
          </div>

          <div className="hbd-activity-list">
            {activities.map((activity) => (
              <div className="hbd-activity-item" key={activity.id}>
                <div
                  className={`hbd-activity-marker ${
                    activity.status === "Pending"
                      ? "hbd-marker-pending"
                      : activity.status === "Attention"
                      ? "hbd-marker-risk"
                      : "hbd-marker-complete"
                  }`}
                />
                <div className="hbd-activity-content">
                  <strong>{activity.title}</strong>
                  <span>{activity.detail}</span>
                  <small>{activity.date}</small>
                </div>
                <span
                  className={`hbd-activity-status ${
                    activity.status === "Pending"
                      ? "hbd-activity-pending"
                      : activity.status === "Attention"
                      ? "hbd-activity-risk"
                      : ""
                  }`}
                >
                  {activity.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="hbd-footer-note">
        <FiAlertCircle />
        <span>
          Budget figures are sample values. Actual budget control requires
          approved allocations, linked HR expenses, committed obligations,
          authorization workflows and company-scoped database access.
        </span>
      </div>
    </div>
  );
}

export default HRBudgetDashboardReports;
