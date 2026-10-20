
import { useMemo, useState } from "react";
import {
  FiBookOpen,
  FiUsers,
  FiCheckCircle,
  FiClock,
  FiSearch,
  FiDownload,
  FiCalendar,
  FiTrendingUp,
  FiFilter,
  FiDollarSign,
  FiAward,
  FiRefreshCw,
} from "react-icons/fi";
import "../../css/hr/TrainingDashboardReports.css";

const INITIAL_PROGRAMMES = [
  {
    id: 1,
    code: "TRN-2026-001",
    title: "Workplace Safety",
    category: "Compliance",
    trainer: "Safety Team",
    department: "Production",
    startDate: "2026-10-20",
    endDate: "2026-10-20",
    participants: 24,
    completed: 18,
    status: "In Progress",
    budget: 12000,
    actualCost: 9000,
    averageScore: 82,
  },
  {
    id: 2,
    code: "TRN-2026-002",
    title: "Advanced Excel",
    category: "Technical",
    trainer: "External Trainer",
    department: "Finance",
    startDate: "2026-10-23",
    endDate: "2026-10-24",
    participants: 12,
    completed: 0,
    status: "Scheduled",
    budget: 18000,
    actualCost: 0,
    averageScore: 0,
  },
  {
    id: 3,
    code: "TRN-2026-003",
    title: "Leadership Essentials",
    category: "Leadership",
    trainer: "HR Development",
    department: "Management",
    startDate: "2026-10-10",
    endDate: "2026-10-11",
    participants: 10,
    completed: 10,
    status: "Completed",
    budget: 25000,
    actualCost: 22000,
    averageScore: 91,
  },
  {
    id: 4,
    code: "TRN-2026-004",
    title: "Cybersecurity Awareness",
    category: "Compliance",
    trainer: "IT Team",
    department: "IT",
    startDate: "2026-10-27",
    endDate: "2026-10-27",
    participants: 20,
    completed: 0,
    status: "Scheduled",
    budget: 8000,
    actualCost: 0,
    averageScore: 0,
  },
  {
    id: 5,
    code: "TRN-2026-005",
    title: "Communication Skills",
    category: "Soft Skills",
    trainer: "External Trainer",
    department: "Sales",
    startDate: "2026-10-05",
    endDate: "2026-10-05",
    participants: 15,
    completed: 13,
    status: "Completed",
    budget: 15000,
    actualCost: 13000,
    averageScore: 78,
  },
  {
    id: 6,
    code: "TRN-2026-006",
    title: "Quality Control Basics",
    category: "Technical",
    trainer: "Quality Team",
    department: "Production",
    startDate: "2026-11-03",
    endDate: "2026-11-03",
    participants: 16,
    completed: 0,
    status: "Draft",
    budget: 10000,
    actualCost: 0,
    averageScore: 0,
  },
];

const TRAINING_STATUSES = ["Draft", "Scheduled", "In Progress", "Completed", "Cancelled"];

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const statusClass = (status) =>
  status.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export default function TrainingDashboardReports() {
  const [programmes] = useState(INITIAL_PROGRAMMES);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const departments = useMemo(
    () => [...new Set(programmes.map((p) => p.department).filter(Boolean))].sort(),
    [programmes]
  );

  const categories = useMemo(
    () => [...new Set(programmes.map((p) => p.category).filter(Boolean))].sort(),
    [programmes]
  );

  const filteredProgrammes = useMemo(() => {
    const term = search.trim().toLowerCase();

    return programmes.filter((p) => {
      const matchesSearch =
        !term ||
        [p.code, p.title, p.category, p.trainer, p.department].some((value) =>
          String(value || "").toLowerCase().includes(term)
        );

      return (
        matchesSearch &&
        (statusFilter === "All" || p.status === statusFilter) &&
        (departmentFilter === "All" || p.department === departmentFilter) &&
        (categoryFilter === "All" || p.category === categoryFilter)
      );
    });
  }, [programmes, search, statusFilter, departmentFilter, categoryFilter]);

  const totalProgrammes = programmes.length;
  const activeProgrammes = programmes.filter((p) =>
    ["Scheduled", "In Progress"].includes(p.status)
  ).length;
  const totalParticipants = programmes.reduce((sum, p) => sum + p.participants, 0);
  const totalCompleted = programmes.reduce((sum, p) => sum + p.completed, 0);
  const completionRate = totalParticipants
    ? Math.round((totalCompleted / totalParticipants) * 100)
    : 0;

  const budgetTotal = programmes.reduce((sum, p) => sum + p.budget, 0);
  const actualTotal = programmes.reduce((sum, p) => sum + p.actualCost, 0);

  const completedProgrammes = programmes.filter(
    (p) => p.status === "Completed" && p.averageScore > 0
  );
  const averageScore = completedProgrammes.length
    ? Math.round(
        completedProgrammes.reduce((sum, p) => sum + p.averageScore, 0) /
          completedProgrammes.length
      )
    : 0;

  const upcomingProgrammes = programmes
    .filter((p) => ["Scheduled", "In Progress"].includes(p.status))
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 4);

  const departmentStats = useMemo(() => {
    return departments.map((department) => {
      const items = programmes.filter((p) => p.department === department);
      const assigned = items.reduce((sum, p) => sum + p.participants, 0);
      const completed = items.reduce((sum, p) => sum + p.completed, 0);

      return {
        department,
        programmes: items.length,
        assigned,
        completed,
        rate: assigned ? Math.round((completed / assigned) * 100) : 0,
      };
    });
  }, [departments, programmes]);

  const exportCsv = () => {
    const headers = [
      "Programme Code",
      "Programme",
      "Category",
      "Trainer",
      "Department",
      "Start Date",
      "End Date",
      "Participants",
      "Completed Participants",
      "Status",
      "Budget",
      "Actual Cost",
      "Average Assessment Score",
    ];

    const rows = filteredProgrammes.map((p) => [
      p.code,
      p.title,
      p.category,
      p.trainer,
      p.department,
      p.startDate,
      p.endDate,
      p.participants,
      p.completed,
      p.status,
      p.budget,
      p.actualCost,
      p.averageScore || "",
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
    link.download = "training-dashboard-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setDepartmentFilter("All");
    setCategoryFilter("All");
  };

  return (
    <div className="tdr-page">
      <div className="tdr-page-header">
        <div>
          <span className="tdr-eyebrow">TRAINING &amp; DEVELOPMENT</span>
          <h1>Training Dashboard &amp; Reports</h1>
          <p>Monitor training programmes, participation, completion and expenditure.</p>
        </div>
        <button type="button" className="tdr-btn tdr-btn-primary" onClick={exportCsv}>
          <FiDownload /> Export Report
        </button>
      </div>

      <div className="tdr-stats-grid">
        <div className="tdr-stat-card">
          <div className="tdr-stat-icon tdr-blue"><FiBookOpen /></div>
          <div>
            <span>Total Programmes</span>
            <strong>{totalProgrammes}</strong>
            <small>All listed programmes</small>
          </div>
        </div>
        <div className="tdr-stat-card">
          <div className="tdr-stat-icon tdr-purple"><FiClock /></div>
          <div>
            <span>Active Programmes</span>
            <strong>{activeProgrammes}</strong>
            <small>Scheduled or in progress</small>
          </div>
        </div>
        <div className="tdr-stat-card">
          <div className="tdr-stat-icon tdr-green"><FiUsers /></div>
          <div>
            <span>Participants Completed</span>
            <strong>{totalCompleted} / {totalParticipants}</strong>
            <small>{completionRate}% of assigned participants</small>
          </div>
        </div>
        <div className="tdr-stat-card">
          <div className="tdr-stat-icon tdr-orange"><FiAward /></div>
          <div>
            <span>Average Assessment Score</span>
            <strong>{averageScore ? `${averageScore}%` : "—"}</strong>
            <small>Completed programmes with scores</small>
          </div>
        </div>
      </div>

      <div className="tdr-overview-grid">
        <section className="tdr-panel tdr-completion-panel">
          <div className="tdr-panel-heading">
            <div>
              <h2>Overall Training Completion</h2>
              <p>Completed participants compared with assignments</p>
            </div>
            <FiTrendingUp />
          </div>
          <div className="tdr-completion-content">
            <div
              className="tdr-donut"
              style={{ "--tdr-progress": `${completionRate}%` }}
              role="img"
              aria-label={`Training completion rate ${completionRate}%`}
            >
              <div>
                <strong>{completionRate}%</strong>
                <span>Completed</span>
              </div>
            </div>
            <div className="tdr-completion-legend">
              <div>
                <span className="tdr-legend-dot tdr-dot-green" />
                <span>Completed</span>
                <strong>{totalCompleted}</strong>
              </div>
              <div>
                <span className="tdr-legend-dot tdr-dot-grey" />
                <span>Remaining</span>
                <strong>{Math.max(totalParticipants - totalCompleted, 0)}</strong>
              </div>
              <div>
                <span className="tdr-legend-dot tdr-dot-blue" />
                <span>Total assigned</span>
                <strong>{totalParticipants}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="tdr-panel tdr-budget-panel">
          <div className="tdr-panel-heading">
            <div>
              <h2>Training Expenditure</h2>
              <p>Budget compared with recorded actual cost</p>
            </div>
            <FiDollarSign />
          </div>
          <div className="tdr-budget-values">
            <div>
              <span>Planned Budget</span>
              <strong>{money(budgetTotal)}</strong>
            </div>
            <div>
              <span>Actual Cost</span>
              <strong>{money(actualTotal)}</strong>
            </div>
          </div>
          <div className="tdr-budget-track">
            <div
              className="tdr-budget-fill"
              style={{
                width: `${budgetTotal ? Math.min((actualTotal / budgetTotal) * 100, 100) : 0}%`,
              }}
            />
          </div>
          <div className="tdr-budget-footer">
            <span>
              {budgetTotal
                ? `${Math.round((actualTotal / budgetTotal) * 100)}% of budget recorded`
                : "No budget recorded"}
            </span>
            <strong>{money(budgetTotal - actualTotal)} remaining</strong>
          </div>
          <small className="tdr-disclaimer">
            Sample figures only. Remaining budget is not a verified accounting balance.
          </small>
        </section>
      </div>

      <div className="tdr-lower-grid">
        <section className="tdr-panel">
          <div className="tdr-panel-heading">
            <div>
              <h2>Department Training Summary</h2>
              <p>Participant completion by department</p>
            </div>
          </div>
          <div className="tdr-department-list">
            {departmentStats.map((item) => (
              <div className="tdr-department-row" key={item.department}>
                <div className="tdr-department-top">
                  <strong>{item.department}</strong>
                  <span>{item.completed}/{item.assigned} completed</span>
                </div>
                <div className="tdr-progress-track">
                  <div
                    className="tdr-progress-fill"
                    style={{ width: `${item.rate}%` }}
                  />
                </div>
                <small>
                  {item.rate}% completion · {item.programmes} programme(s)
                </small>
              </div>
            ))}
          </div>
        </section>

        <section className="tdr-panel">
          <div className="tdr-panel-heading">
            <div>
              <h2>Upcoming Training</h2>
              <p>Next scheduled or active programmes</p>
            </div>
            <FiCalendar />
          </div>
          <div className="tdr-upcoming-list">
            {upcomingProgrammes.map((programme) => (
              <div className="tdr-upcoming-item" key={programme.id}>
                <div className="tdr-calendar-box">
                  <span>
                    {new Date(`${programme.startDate}T00:00:00`).toLocaleDateString(
                      "en-IN",
                      { month: "short" }
                    )}
                  </span>
                  <strong>
                    {new Date(`${programme.startDate}T00:00:00`).getDate()}
                  </strong>
                </div>
                <div className="tdr-upcoming-details">
                  <strong>{programme.title}</strong>
                  <span>{programme.department} · {programme.category}</span>
                  <small>{programme.trainer}</small>
                </div>
                <span className={`tdr-status tdr-status-${statusClass(programme.status)}`}>
                  {programme.status}
                </span>
              </div>
            ))}
            {upcomingProgrammes.length === 0 && (
              <div className="tdr-empty">No upcoming training programmes.</div>
            )}
          </div>
        </section>
      </div>

      <section className="tdr-panel tdr-register-panel">
        <div className="tdr-panel-heading">
          <div>
            <h2>Training Programme Register</h2>
            <p>Filter programme details and export the matching records.</p>
          </div>
          <button type="button" className="tdr-btn tdr-btn-secondary" onClick={resetFilters}>
            <FiRefreshCw /> Reset Filters
          </button>
        </div>

        <div className="tdr-filters">
          <div className="tdr-search">
            <FiSearch />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search programme, trainer or code..."
              aria-label="Search training programmes"
            />
          </div>
          <div className="tdr-filter-control">
            <FiFilter />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by programme status"
            >
              <option value="All">All statuses</option>
              {TRAINING_STATUSES.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <select
            className="tdr-select-filter"
            value={departmentFilter}
            onChange={(event) => setDepartmentFilter(event.target.value)}
            aria-label="Filter by department"
          >
            <option value="All">All departments</option>
            {departments.map((department) => (
              <option key={department} value={department}>{department}</option>
            ))}
          </select>
          <select
            className="tdr-select-filter"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            aria-label="Filter by category"
          >
            <option value="All">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div className="tdr-table-wrapper">
          <table className="tdr-table">
            <thead>
              <tr>
                <th>Programme</th>
                <th>Category</th>
                <th>Department</th>
                <th>Training Dates</th>
                <th>Participants</th>
                <th>Completion</th>
                <th>Budget / Actual</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredProgrammes.map((programme) => {
                const rate = programme.participants
                  ? Math.round((programme.completed / programme.participants) * 100)
                  : 0;

                return (
                  <tr key={programme.id}>
                    <td>
                      <div className="tdr-programme-cell">
                        <strong>{programme.title}</strong>
                        <small>{programme.code}</small>
                        <small>Trainer: {programme.trainer}</small>
                      </div>
                    </td>
                    <td>{programme.category}</td>
                    <td>{programme.department}</td>
                    <td>
                      <div className="tdr-date-cell">
                        <strong>{formatDate(programme.startDate)}</strong>
                        <small>to {formatDate(programme.endDate)}</small>
                      </div>
                    </td>
                    <td>{programme.participants}</td>
                    <td>
                      <div className="tdr-completion-cell">
                        <strong>{rate}%</strong>
                        <div className="tdr-progress-track">
                          <div
                            className="tdr-progress-fill"
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                        <small>{programme.completed}/{programme.participants} completed</small>
                      </div>
                    </td>
                    <td>
                      <div className="tdr-cost-cell">
                        <strong>{money(programme.budget)}</strong>
                        <small>Actual: {money(programme.actualCost)}</small>
                      </div>
                    </td>
                    <td>
                      <span className={`tdr-status tdr-status-${statusClass(programme.status)}`}>
                        {programme.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredProgrammes.length === 0 && (
                <tr>
                  <td colSpan="8" className="tdr-empty">
                    No programmes match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="tdr-prototype-note">
        <strong>Prototype notice:</strong> This dashboard uses sample data and does not
        yet read from Supabase. Participant totals are programme assignments, not unique
        employees; an employee attending multiple programmes is counted multiple times.
        Assessment averages and costs are illustrative until validated against saved records.
      </div>
    </div>
  );
}
