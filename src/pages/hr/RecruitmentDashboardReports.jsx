
import React, { useMemo, useState } from "react";
import {
  FiUsers,
  FiBriefcase,
  FiUserCheck,
  FiClock,
  FiSearch,
  FiDownload,
  FiCalendar,
  FiTrendingUp,
  FiCheckCircle,
  FiAlertCircle,
  FiFilter,
  FiRefreshCw,
} from "react-icons/fi";
import "../../css/hr/RecruitmentDashboardReports.css";

const sampleVacancies = [
  {
    id: 1,
    code: "REQ-2026-001",
    title: "Accounts Executive",
    department: "Finance",
    location: "Head Office",
    openings: 2,
    applicants: 24,
    interviews: 6,
    offers: 1,
    filled: 0,
    status: "Open",
    priority: "High",
    postedDate: "2026-10-01",
    targetDate: "2026-11-15",
  },
  {
    id: 2,
    code: "REQ-2026-002",
    title: "HR Executive",
    department: "Human Resources",
    location: "Head Office",
    openings: 1,
    applicants: 18,
    interviews: 4,
    offers: 1,
    filled: 1,
    status: "Filled",
    priority: "Medium",
    postedDate: "2026-09-10",
    targetDate: "2026-10-15",
  },
  {
    id: 3,
    code: "REQ-2026-003",
    title: "Sales Coordinator",
    department: "Sales",
    location: "Branch Office",
    openings: 2,
    applicants: 31,
    interviews: 8,
    offers: 0,
    filled: 0,
    status: "Open",
    priority: "Medium",
    postedDate: "2026-10-05",
    targetDate: "2026-11-20",
  },
  {
    id: 4,
    code: "REQ-2026-004",
    title: "IT Support Engineer",
    department: "IT",
    location: "Head Office",
    openings: 1,
    applicants: 12,
    interviews: 3,
    offers: 0,
    filled: 0,
    status: "On Hold",
    priority: "Low",
    postedDate: "2026-09-25",
    targetDate: "2026-12-01",
  },
  {
    id: 5,
    code: "REQ-2026-005",
    title: "Operations Supervisor",
    department: "Operations",
    location: "Factory",
    openings: 2,
    applicants: 27,
    interviews: 7,
    offers: 2,
    filled: 1,
    status: "Open",
    priority: "High",
    postedDate: "2026-09-18",
    targetDate: "2026-10-30",
  },
];

const samplePipeline = [
  { stage: "Applied", count: 112, color: "blue" },
  { stage: "Screening", count: 64, color: "purple" },
  { stage: "Shortlisted", count: 35, color: "teal" },
  { stage: "Interview", count: 28, color: "orange" },
  { stage: "Offer", count: 9, color: "green" },
  { stage: "Hired", count: 6, color: "darkgreen" },
];

const sampleActivity = [
  {
    id: 1,
    title: "Offer issued",
    detail: "Operations Supervisor · Candidate C-104",
    date: "2026-10-17",
    status: "Offer",
  },
  {
    id: 2,
    title: "Interview scheduled",
    detail: "Accounts Executive · Candidate C-118",
    date: "2026-10-19",
    status: "Interview",
  },
  {
    id: 3,
    title: "Vacancy created",
    detail: "Sales Coordinator · REQ-2026-003",
    date: "2026-10-16",
    status: "Vacancy",
  },
  {
    id: 4,
    title: "Candidate hired",
    detail: "HR Executive · Candidate C-092",
    date: "2026-10-14",
    status: "Hired",
  },
];

const todayISO = () => new Date().toISOString().slice(0, 10);

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

const csvEscape = (value) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

function exportCSV(filename, headers, rows) {
  const csv = [headers, ...rows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\r\n");

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
}

export default function RecruitmentDashboardReports() {
  const [vacancies] = useState(sampleVacancies);
  const [pipeline] = useState(samplePipeline);
  const [activity] = useState(sampleActivity);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  const departments = useMemo(
    () => [...new Set(vacancies.map((item) => item.department))].sort(),
    [vacancies]
  );

  const filteredVacancies = useMemo(() => {
    const query = search.trim().toLowerCase();

    return vacancies.filter((item) => {
      const matchesSearch =
        !query ||
        [item.code, item.title, item.department, item.location].some(
          (value) => String(value || "").toLowerCase().includes(query)
        );

      return (
        matchesSearch &&
        (statusFilter === "All" || item.status === statusFilter) &&
        (departmentFilter === "All" ||
          item.department === departmentFilter) &&
        (priorityFilter === "All" || item.priority === priorityFilter)
      );
    });
  }, [vacancies, search, statusFilter, departmentFilter, priorityFilter]);

  const metrics = useMemo(() => {
    const openVacancies = vacancies.filter(
      (item) => item.status === "Open"
    ).length;

    const totalOpenings = vacancies
      .filter((item) => item.status === "Open")
      .reduce((sum, item) => sum + Math.max(0, item.openings - item.filled), 0);

    const applicants = vacancies.reduce(
      (sum, item) => sum + item.applicants,
      0
    );

    const interviews = vacancies.reduce(
      (sum, item) => sum + item.interviews,
      0
    );

    const offers = vacancies.reduce((sum, item) => sum + item.offers, 0);

    const hires = vacancies.reduce((sum, item) => sum + item.filled, 0);

    const overdue = vacancies.filter(
      (item) =>
        item.status === "Open" &&
        item.targetDate &&
        item.targetDate < todayISO()
    ).length;

    const fillRate =
      vacancies.reduce((sum, item) => sum + item.openings, 0) > 0
        ? Math.round(
            (hires /
              vacancies.reduce((sum, item) => sum + item.openings, 0)) *
              100
          )
        : 0;

    return {
      openVacancies,
      totalOpenings,
      applicants,
      interviews,
      offers,
      hires,
      overdue,
      fillRate,
    };
  }, [vacancies]);

  const exportVacancies = () => {
    exportCSV(
      "recruitment-vacancy-report.csv",
      [
        "Requisition Code",
        "Job Title",
        "Department",
        "Location",
        "Openings",
        "Applicants",
        "Interviews",
        "Offers",
        "Filled",
        "Status",
        "Priority",
        "Posted Date",
        "Target Date",
      ],
      filteredVacancies.map((item) => [
        item.code,
        item.title,
        item.department,
        item.location,
        item.openings,
        item.applicants,
        item.interviews,
        item.offers,
        item.filled,
        item.status,
        item.priority,
        item.postedDate,
        item.targetDate,
      ])
    );
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setDepartmentFilter("All");
    setPriorityFilter("All");
  };

  const statusClass = (value) =>
    value.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="recruitment-dashboard">
      <header className="rd-header">
        <div>
          <div className="rd-eyebrow">HR / RECRUITMENT</div>
          <h1>Recruitment Dashboard &amp; Reports</h1>
          <p>
            Monitor vacancies, candidates, interviews, offers and hiring
            progress.
          </p>
        </div>

        <div className="rd-header-actions">
          <button
            type="button"
            className="rd-btn rd-btn-secondary"
            onClick={resetFilters}
          >
            <FiRefreshCw /> Reset Filters
          </button>
          <button
            type="button"
            className="rd-btn rd-btn-primary"
            onClick={exportVacancies}
          >
            <FiDownload /> Export Report
          </button>
        </div>
      </header>

      <div className="rd-demo-notice">
        <FiAlertCircle />
        <span>
          Demonstration data only. These figures are not connected to live
          recruitment records.
        </span>
      </div>

      <section className="rd-kpi-grid">
        <article className="rd-kpi-card">
          <div className="rd-kpi-top">
            <span>Open Requisitions</span>
            <div className="rd-kpi-icon rd-blue"><FiBriefcase /></div>
          </div>
          <strong>{metrics.openVacancies}</strong>
          <small>{metrics.totalOpenings} unfilled openings</small>
        </article>

        <article className="rd-kpi-card">
          <div className="rd-kpi-top">
            <span>Total Applicants</span>
            <div className="rd-kpi-icon rd-purple"><FiUsers /></div>
          </div>
          <strong>{metrics.applicants}</strong>
          <small>Across listed requisitions</small>
        </article>

        <article className="rd-kpi-card">
          <div className="rd-kpi-top">
            <span>Interviews</span>
            <div className="rd-kpi-icon rd-orange"><FiCalendar /></div>
          </div>
          <strong>{metrics.interviews}</strong>
          <small>Recorded interview counts</small>
        </article>

        <article className="rd-kpi-card">
          <div className="rd-kpi-top">
            <span>Offers Issued</span>
            <div className="rd-kpi-icon rd-teal"><FiCheckCircle /></div>
          </div>
          <strong>{metrics.offers}</strong>
          <small>Across listed requisitions</small>
        </article>

        <article className="rd-kpi-card">
          <div className="rd-kpi-top">
            <span>Hires Recorded</span>
            <div className="rd-kpi-icon rd-green"><FiUserCheck /></div>
          </div>
          <strong>{metrics.hires}</strong>
          <small>{metrics.fillRate}% of listed openings filled</small>
        </article>

        <article className="rd-kpi-card">
          <div className="rd-kpi-top">
            <span>Overdue Vacancies</span>
            <div className="rd-kpi-icon rd-red"><FiClock /></div>
          </div>
          <strong>{metrics.overdue}</strong>
          <small>Open requisitions past target date</small>
        </article>
      </section>

      <section className="rd-main-grid">
        <article className="rd-panel">
          <div className="rd-panel-heading">
            <div>
              <h2>Recruitment Pipeline</h2>
              <p>Candidate volume by hiring stage</p>
            </div>
            <FiTrendingUp />
          </div>

          <div className="rd-pipeline">
            {pipeline.map((item) => {
              const maximum = Math.max(
                1,
                ...pipeline.map((stage) => stage.count)
              );
              return (
                <div className="rd-pipeline-row" key={item.stage}>
                  <div className="rd-pipeline-label">
                    <span>{item.stage}</span>
                    <strong>{item.count}</strong>
                  </div>
                  <div className="rd-progress-track">
                    <div
                      className={`rd-progress-fill rd-fill-${item.color}`}
                      style={{
                        width: `${(item.count / maximum) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="rd-chart-note">
            Pipeline counts are sample stage totals and are not deduplicated
            candidate records.
          </p>
        </article>

        <article className="rd-panel">
          <div className="rd-panel-heading">
            <div>
              <h2>Hiring Overview</h2>
              <p>Current recruitment indicators</p>
            </div>
            <FiUserCheck />
          </div>

          <div className="rd-overview-list">
            <div>
              <span>Applicants received</span>
              <strong>{metrics.applicants}</strong>
            </div>
            <div>
              <span>Interviews recorded</span>
              <strong>{metrics.interviews}</strong>
            </div>
            <div>
              <span>Offers issued</span>
              <strong>{metrics.offers}</strong>
            </div>
            <div>
              <span>Hires recorded</span>
              <strong>{metrics.hires}</strong>
            </div>
            <div>
              <span>Vacancies on hold</span>
              <strong>
                {vacancies.filter((item) => item.status === "On Hold").length}
              </strong>
            </div>
          </div>
          <div className="rd-overview-footer">
            <FiAlertCircle />
            Hiring conversion rates will be calculated from unique candidate
            records after database integration.
          </div>
        </article>
      </section>

      <section className="rd-panel rd-vacancy-panel">
        <div className="rd-panel-heading rd-vacancy-heading">
          <div>
            <h2>Vacancy Tracking</h2>
            <p>Search, filter and export recruitment requisitions.</p>
          </div>
          <button
            type="button"
            className="rd-btn rd-btn-secondary"
            onClick={exportVacancies}
          >
            <FiDownload /> Export Filtered List
          </button>
        </div>

        <div className="rd-filter-bar">
          <div className="rd-search">
            <FiSearch />
            <input
              type="search"
              placeholder="Search title, code, department or location..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search vacancies"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter by vacancy status"
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="On Hold">On Hold</option>
            <option value="Filled">Filled</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select
            value={departmentFilter}
            onChange={(event) => setDepartmentFilter(event.target.value)}
            aria-label="Filter by department"
          >
            <option value="All">All Departments</option>
            {departments.map((department) => (
              <option value={department} key={department}>
                {department}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
            aria-label="Filter by priority"
          >
            <option value="All">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="rd-table-wrap">
          <table className="rd-table">
            <thead>
              <tr>
                <th>Requisition / Job</th>
                <th>Department</th>
                <th>Openings</th>
                <th>Applicants</th>
                <th>Interviews</th>
                <th>Offers</th>
                <th>Target Date</th>
                <th>Priority</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredVacancies.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.title}</strong>
                    <span className="rd-subtext">{item.code}</span>
                    <span className="rd-location">{item.location}</span>
                  </td>
                  <td>{item.department}</td>
                  <td>
                    <strong>{item.openings}</strong>
                    <span className="rd-subtext">{item.filled} filled</span>
                  </td>
                  <td>{item.applicants}</td>
                  <td>{item.interviews}</td>
                  <td>{item.offers}</td>
                  <td>{formatDate(item.targetDate)}</td>
                  <td>
                    <span className={`rd-pill rd-priority-${statusClass(item.priority)}`}>
                      {item.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`rd-pill rd-status-${statusClass(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredVacancies.length === 0 && (
                <tr>
                  <td colSpan="9" className="rd-empty">
                    No vacancies match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="rd-table-footer">
          <span>{filteredVacancies.length} requisition(s) displayed</span>
          <span>
            <FiFilter /> Filters apply to the table and CSV export
          </span>
        </div>
      </section>

      <section className="rd-panel rd-activity-panel">
        <div className="rd-panel-heading">
          <div>
            <h2>Recent Recruitment Activity</h2>
            <p>Illustrative recent events across the recruitment process</p>
          </div>
          <FiClock />
        </div>

        <div className="rd-activity-list">
          {activity.map((item) => (
            <div className="rd-activity-item" key={item.id}>
              <div className={`rd-activity-icon rd-activity-${statusClass(item.status)}`}>
                {item.status === "Hired" ? (
                  <FiCheckCircle />
                ) : item.status === "Interview" ? (
                  <FiCalendar />
                ) : (
                  <FiBriefcase />
                )}
              </div>
              <div className="rd-activity-content">
                <strong>{item.title}</strong>
                <span>{item.detail}</span>
              </div>
              <time>{formatDate(item.date)}</time>
            </div>
          ))}
        </div>
      </section>

      <footer className="rd-footer-note">
        <FiAlertCircle />
        <span>
          This dashboard uses sample data. Applicant totals, stage counts and
          hiring metrics must be calculated from real requisition, candidate,
          interview and offer records before production use.
        </span>
      </footer>
    </div>
  );
}
