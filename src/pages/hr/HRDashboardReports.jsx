
import React, { useMemo, useState } from "react";
import {
  FiUsers,
  FiUserCheck,
  FiCalendar,
  FiDollarSign,
  FiFileText,
  FiClock,
  FiDownload,
  FiTrendingUp,
  FiAlertCircle,
  FiRefreshCw,
} from "react-icons/fi";
import "../../css/hr/HRDashboardReports.css";

const initialEmployees = [
  { id: "EMP001", name: "Arun Kumar", department: "Finance", status: "Active" },
  { id: "EMP002", name: "Priya Sharma", department: "HR", status: "Active" },
  { id: "EMP003", name: "Rahul Nair", department: "Operations", status: "Active" },
  { id: "EMP004", name: "Meena Raj", department: "Accounts", status: "Active" },
  { id: "EMP005", name: "Vijay Kumar", department: "Sales", status: "On Leave" },
  { id: "EMP006", name: "Anitha Das", department: "Operations", status: "Active" },
  { id: "EMP007", name: "Karthik Rao", department: "Sales", status: "Inactive" },
  { id: "EMP008", name: "Sneha Patel", department: "Finance", status: "Active" },
];

const initialAttendance = [
  { department: "Finance", present: 18, absent: 1, late: 2 },
  { department: "HR", present: 8, absent: 0, late: 1 },
  { department: "Operations", present: 32, absent: 3, late: 4 },
  { department: "Accounts", present: 12, absent: 1, late: 1 },
  { department: "Sales", present: 15, absent: 2, late: 3 },
];

const initialPayroll = [
  { month: "May", gross: 420000, deductions: 42000, net: 378000 },
  { month: "Jun", gross: 435000, deductions: 44000, net: 391000 },
  { month: "Jul", gross: 440000, deductions: 45000, net: 395000 },
  { month: "Aug", gross: 452000, deductions: 46000, net: 406000 },
  { month: "Sep", gross: 460000, deductions: 47000, net: 413000 },
  { month: "Oct", gross: 465000, deductions: 48000, net: 417000 },
];

const initialActions = [
  {
    id: 1,
    title: "Expense claims awaiting review",
    description: "Review pending employee reimbursement claims.",
    count: 4,
    type: "warning",
  },
  {
    id: 2,
    title: "Leave requests awaiting approval",
    description: "Review pending leave requests.",
    count: 3,
    type: "info",
  },
  {
    id: 3,
    title: "Payroll processing",
    description: "Verify payroll status before finalisation.",
    count: 1,
    type: "success",
  },
];

const formatINR = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const exportCSV = (filename, rows) => {
  if (!rows.length) {
    window.alert("No records available to export.");
    return;
  }

  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export default function HRDashboardReports() {
  const [period, setPeriod] = useState("October 2026");
  const [department, setDepartment] = useState("All");
  const [reportType, setReportType] = useState("employees");
  const [search, setSearch] = useState("");

  const employees = useMemo(() => {
    return initialEmployees.filter((employee) => {
      const matchesDepartment =
        department === "All" || employee.department === department;
      const matchesSearch =
        `${employee.id} ${employee.name} ${employee.department} ${employee.status}`
          .toLowerCase()
          .includes(search.toLowerCase());

      return matchesDepartment && matchesSearch;
    });
  }, [department, search]);

  const attendance = useMemo(() => {
    if (department === "All") return initialAttendance;
    return initialAttendance.filter(
      (record) => record.department === department
    );
  }, [department]);

  const attendanceTotals = useMemo(
    () =>
      attendance.reduce(
        (totals, record) => ({
          present: totals.present + record.present,
          absent: totals.absent + record.absent,
          late: totals.late + record.late,
        }),
        { present: 0, absent: 0, late: 0 }
      ),
    [attendance]
  );

  const activeCount = employees.filter(
    (employee) => employee.status === "Active"
  ).length;
  const onLeaveCount = employees.filter(
    (employee) => employee.status === "On Leave"
  ).length;

  const payrollTotal = initialPayroll[initialPayroll.length - 1];

  const reportRows = useMemo(() => {
    if (reportType === "attendance") {
      return [
        ["Department", "Present", "Absent", "Late"],
        ...attendance.map((record) => [
          record.department,
          record.present,
          record.absent,
          record.late,
        ]),
      ];
    }

    if (reportType === "payroll") {
      return [
        ["Month", "Gross Payroll", "Deductions", "Net Payroll"],
        ...initialPayroll.map((record) => [
          record.month,
          record.gross,
          record.deductions,
          record.net,
        ]),
      ];
    }

    return [
      ["Employee ID", "Employee", "Department", "Status"],
      ...employees.map((employee) => [
        employee.id,
        employee.name,
        employee.department,
        employee.status,
      ]),
    ];
  }, [reportType, attendance, employees]);

  const downloadReport = () => {
    exportCSV(
      `hr-${reportType}-${period.toLowerCase().replace(/\s+/g, "-")}.csv`,
      reportRows
    );
  };

  const resetFilters = () => {
    setDepartment("All");
    setSearch("");
    setPeriod("October 2026");
  };

  const maxPayroll = Math.max(...initialPayroll.map((item) => item.net));

  return (
    <div className="hrdr-page">
      <header className="hrdr-header">
        <div>
          <span className="hrdr-eyebrow">HUMAN RESOURCES</span>
          <h1>HR Dashboard & Reports</h1>
          <p>
            Monitor your workforce, attendance, payroll and HR activities from
            one place.
          </p>
        </div>

        <button className="hrdr-primary-btn" onClick={downloadReport}>
          <FiDownload /> Export Report
        </button>
      </header>

      <div className="hrdr-demo-notice">
        <FiAlertCircle />
        <span>
          Demonstration dashboard — the figures below are sample data, not live
          company records.
        </span>
      </div>

      <section className="hrdr-filters">
        <label>
          Reporting period
          <select value={period} onChange={(event) => setPeriod(event.target.value)}>
            <option>May 2026</option>
            <option>June 2026</option>
            <option>July 2026</option>
            <option>August 2026</option>
            <option>September 2026</option>
            <option>October 2026</option>
          </select>
        </label>

        <label>
          Department
          <select
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
          >
            <option>All</option>
            <option>Finance</option>
            <option>HR</option>
            <option>Operations</option>
            <option>Accounts</option>
            <option>Sales</option>
          </select>
        </label>

        <button className="hrdr-reset-btn" onClick={resetFilters}>
          <FiRefreshCw /> Reset filters
        </button>
      </section>

      <section className="hrdr-metrics">
        <article className="hrdr-metric-card">
          <div className="hrdr-metric-top">
            <span>Total employees</span>
            <span className="hrdr-icon-box blue"><FiUsers /></span>
          </div>
          <strong>{employees.length}</strong>
          <small>Employees in the selected department</small>
        </article>

        <article className="hrdr-metric-card">
          <div className="hrdr-metric-top">
            <span>Active employees</span>
            <span className="hrdr-icon-box green"><FiUserCheck /></span>
          </div>
          <strong>{activeCount}</strong>
          <small>{employees.length ? Math.round((activeCount / employees.length) * 100) : 0}% of filtered employees</small>
        </article>

        <article className="hrdr-metric-card">
          <div className="hrdr-metric-top">
            <span>On leave</span>
            <span className="hrdr-icon-box orange"><FiCalendar /></span>
          </div>
          <strong>{onLeaveCount}</strong>
          <small>Sample employee status</small>
        </article>

        <article className="hrdr-metric-card">
          <div className="hrdr-metric-top">
            <span>Monthly net payroll</span>
            <span className="hrdr-icon-box purple"><FiDollarSign /></span>
          </div>
          <strong className="hrdr-money">{formatINR(payrollTotal.net)}</strong>
          <small>Sample payroll for {period}</small>
        </article>
      </section>

      <section className="hrdr-main-grid">
        <article className="hrdr-panel">
          <div className="hrdr-panel-heading">
            <div>
              <h2>Attendance overview</h2>
              <p>Sample attendance totals by department</p>
            </div>
            <FiCalendar />
          </div>

          <div className="hrdr-attendance-summary">
            <div>
              <span className="hrdr-dot present" />
              <small>Present</small>
              <strong>{attendanceTotals.present}</strong>
            </div>
            <div>
              <span className="hrdr-dot absent" />
              <small>Absent</small>
              <strong>{attendanceTotals.absent}</strong>
            </div>
            <div>
              <span className="hrdr-dot late" />
              <small>Late</small>
              <strong>{attendanceTotals.late}</strong>
            </div>
          </div>

          <div className="hrdr-department-bars">
            {attendance.map((record) => {
              const total = record.present + record.absent;
              const presentPercent = total
                ? (record.present / total) * 100
                : 0;

              return (
                <div className="hrdr-bar-row" key={record.department}>
                  <div className="hrdr-bar-label">
                    <span>{record.department}</span>
                    <strong>{Math.round(presentPercent)}%</strong>
                  </div>
                  <div className="hrdr-bar-track">
                    <div
                      className="hrdr-bar-fill"
                      style={{ width: `${presentPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {attendance.length === 0 && (
              <p className="hrdr-empty">No attendance data available.</p>
            )}
          </div>
        </article>

        <article className="hrdr-panel">
          <div className="hrdr-panel-heading">
            <div>
              <h2>Payroll trend</h2>
              <p>Sample monthly net payroll</p>
            </div>
            <FiTrendingUp />
          </div>

          <div className="hrdr-payroll-chart">
            {initialPayroll.map((record) => (
              <div className="hrdr-chart-column" key={record.month}>
                <div className="hrdr-chart-value">
                  {Math.round(record.net / 1000)}k
                </div>
                <div className="hrdr-chart-bar-wrap">
                  <div
                    className="hrdr-chart-bar"
                    style={{
                      height: `${(record.net / maxPayroll) * 100}%`,
                    }}
                    title={`${record.month}: ${formatINR(record.net)}`}
                  />
                </div>
                <span>{record.month}</span>
              </div>
            ))}
          </div>

          <div className="hrdr-payroll-footer">
            <span>Latest sample net payroll</span>
            <strong>{formatINR(payrollTotal.net)}</strong>
          </div>
        </article>
      </section>

      <section className="hrdr-main-grid hrdr-lower-grid">
        <article className="hrdr-panel">
          <div className="hrdr-panel-heading">
            <div>
              <h2>Pending HR actions</h2>
              <p>Items requiring attention in the sample data</p>
            </div>
            <FiClock />
          </div>

          <div className="hrdr-action-list">
            {initialActions.map((action) => (
              <div className="hrdr-action-item" key={action.id}>
                <span className={`hrdr-action-count ${action.type}`}>
                  {action.count}
                </span>
                <div>
                  <strong>{action.title}</strong>
                  <p>{action.description}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="hrdr-panel">
          <div className="hrdr-panel-heading">
            <div>
              <h2>HR reports</h2>
              <p>Filter, review and export report data</p>
            </div>
            <FiFileText />
          </div>

          <label className="hrdr-report-field">
            Report category
            <select
              value={reportType}
              onChange={(event) => setReportType(event.target.value)}
            >
              <option value="employees">Employee register</option>
              <option value="attendance">Attendance summary</option>
              <option value="payroll">Payroll summary</option>
            </select>
          </label>

          <label className="hrdr-report-field">
            Search employee register
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, employee ID or department"
            />
          </label>

          <button
            className="hrdr-secondary-btn hrdr-full-btn"
            onClick={downloadReport}
          >
            <FiDownload /> Download selected CSV
          </button>
        </article>
      </section>

      <section className="hrdr-panel hrdr-employee-panel">
        <div className="hrdr-panel-heading">
          <div>
            <h2>Employee overview</h2>
            <p>Filtered employee register — sample records</p>
          </div>
          <span className="hrdr-record-count">{employees.length} records</span>
        </div>

        <label className="hrdr-employee-search">
          <FiUsers />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search employees"
          />
        </label>

        <div className="hrdr-table-wrap">
          <table className="hrdr-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Employee name</th>
                <th>Department</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td>{employee.id}</td>
                  <td className="hrdr-employee-name">{employee.name}</td>
                  <td>{employee.department}</td>
                  <td>
                    <span
                      className={`hrdr-status ${
                        employee.status === "Active"
                          ? "active"
                          : employee.status === "On Leave"
                          ? "on-leave"
                          : "inactive"
                      }`}
                    >
                      {employee.status}
                    </span>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan="4" className="hrdr-empty">
                    No employees match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p className="hrdr-disclaimer">
        Dashboard figures and report records are demonstration data. Live
        company-scoped metrics, attendance calculations and payroll figures
        require connection to the existing application database and services.
      </p>
    </div>
  );
}
