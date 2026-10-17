
import React, { useMemo, useState } from "react";
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiPlus,
  FiSearch,
  FiX,
} from "react-icons/fi";
import "../../css/hr/HolidayCalendarLeaveLedger.css";

const initialHolidays = [
  {
    id: 1,
    name: "Republic Day",
    date: "2026-01-26",
    type: "National",
    applicableTo: "All Employees",
  },
  {
    id: 2,
    name: "Independence Day",
    date: "2026-08-15",
    type: "National",
    applicableTo: "All Employees",
  },
  {
    id: 3,
    name: "Gandhi Jayanti",
    date: "2026-10-02",
    type: "National",
    applicableTo: "All Employees",
  },
  {
    id: 4,
    name: "Diwali",
    date: "2026-11-08",
    type: "Festival",
    applicableTo: "All Employees",
  },
  {
    id: 5,
    name: "Christmas",
    date: "2026-12-25",
    type: "Festival",
    applicableTo: "All Employees",
  },
];

const initialLeaveLedger = [
  {
    id: 1,
    employeeId: "EMP001",
    employee: "Arun Kumar",
    department: "Finance",
    opening: 12,
    credited: 12,
    used: 6,
    pending: 1,
    leaveType: "Casual Leave",
  },
  {
    id: 2,
    employeeId: "EMP002",
    employee: "Priya Sharma",
    department: "HR",
    opening: 10,
    credited: 10,
    used: 4,
    pending: 0,
    leaveType: "Casual Leave",
  },
  {
    id: 3,
    employeeId: "EMP003",
    employee: "Rahul Nair",
    department: "Operations",
    opening: 15,
    credited: 15,
    used: 8,
    pending: 2,
    leaveType: "Earned Leave",
  },
  {
    id: 4,
    employeeId: "EMP004",
    employee: "Meena Raj",
    department: "Accounts",
    opening: 8,
    credited: 8,
    used: 3,
    pending: 0,
    leaveType: "Sick Leave",
  },
];

const formatDate = (value) =>
  value
    ? new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const getBalance = (record) =>
  Math.max(0, record.opening + record.credited - record.used);

const downloadCSV = (filename, rows) => {
  if (!rows.length) {
    window.alert("There are no records to export.");
    return;
  }

  const escapeCSV = (value) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;

  const csv = rows.map((row) => row.map(escapeCSV).join(",")).join("\n");
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

export default function HolidayCalendarLeaveLedger() {
  const [activeTab, setActiveTab] = useState("holidays");
  const [holidays, setHolidays] = useState(initialHolidays);
  const [ledger, setLedger] = useState(initialLeaveLedger);
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(new Date().getMonth());
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");
  const [leaveType, setLeaveType] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [holidayForm, setHolidayForm] = useState({
    name: "",
    date: "",
    type: "National",
    applicableTo: "All Employees",
  });

  const monthName = new Date(year, month, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const filteredHolidays = useMemo(() => {
    return holidays
      .filter((holiday) => {
        const date = new Date(`${holiday.date}T00:00:00`);
        return (
          date.getFullYear() === year &&
          date.getMonth() === month &&
          `${holiday.name} ${holiday.type} ${holiday.applicableTo}`
            .toLowerCase()
            .includes(search.toLowerCase())
        );
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [holidays, year, month, search]);

  const filteredLedger = useMemo(() => {
    return ledger.filter((record) => {
      const matchesSearch =
        `${record.employee} ${record.employeeId} ${record.department}`
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesDepartment =
        department === "All" || record.department === department;

      const matchesType =
        leaveType === "All" || record.leaveType === leaveType;

      return matchesSearch && matchesDepartment && matchesType;
    });
  }, [ledger, search, department, leaveType]);

  const leaveTotals = useMemo(
    () =>
      ledger.reduce(
        (totals, record) => ({
          balance: totals.balance + getBalance(record),
          used: totals.used + record.used,
          pending: totals.pending + record.pending,
        }),
        { balance: 0, used: 0, pending: 0 }
      ),
    [ledger]
  );

  const moveMonth = (direction) => {
    const next = new Date(year, month + direction, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  };

  const saveHoliday = (event) => {
    event.preventDefault();

    if (!holidayForm.name.trim() || !holidayForm.date) {
      window.alert("Please enter the holiday name and date.");
      return;
    }

    const newHoliday = {
      ...holidayForm,
      id: Date.now(),
      name: holidayForm.name.trim(),
    };

    setHolidays((current) => [...current, newHoliday]);
    const newDate = new Date(`${newHoliday.date}T00:00:00`);
    setYear(newDate.getFullYear());
    setMonth(newDate.getMonth());
    setSearch("");
    setShowForm(false);
    setHolidayForm({
      name: "",
      date: "",
      type: "National",
      applicableTo: "All Employees",
    });
  };

  const exportHolidays = () =>
    downloadCSV(
      `holidays-${year}-${String(month + 1).padStart(2, "0")}.csv`,
      [
        ["Holiday", "Date", "Type", "Applicable To"],
        ...filteredHolidays.map((holiday) => [
          holiday.name,
          holiday.date,
          holiday.type,
          holiday.applicableTo,
        ]),
      ]
    );

  const exportLedger = () =>
    downloadCSV("employee-leave-ledger.csv", [
      [
        "Employee ID",
        "Employee",
        "Department",
        "Leave Type",
        "Opening Balance",
        "Credited",
        "Used",
        "Pending Requests",
        "Available Balance",
      ],
      ...filteredLedger.map((record) => [
        record.employeeId,
        record.employee,
        record.department,
        record.leaveType,
        record.opening,
        record.credited,
        record.used,
        record.pending,
        getBalance(record),
      ]),
    ]);

  return (
    <div className="hcl-page">
      <div className="hcl-header">
        <div>
          <div className="hcl-eyebrow">HUMAN RESOURCES</div>
          <h1>Holiday Calendar & Leave Ledger</h1>
          <p>
            Manage company holidays and review employee leave balances.
          </p>
        </div>

        <button
          className="hcl-primary-btn"
          onClick={() => setShowForm(true)}
        >
          <FiPlus /> Add Holiday
        </button>
      </div>

      <div className="hcl-notice">
        <FiCalendar />
        <span>
          Prototype mode: records currently remain in page memory and are not
          saved permanently.
        </span>
      </div>

      <div className="hcl-tabs">
        <button
          className={activeTab === "holidays" ? "active" : ""}
          onClick={() => {
            setActiveTab("holidays");
            setSearch("");
          }}
        >
          Holiday Calendar
        </button>
        <button
          className={activeTab === "ledger" ? "active" : ""}
          onClick={() => {
            setActiveTab("ledger");
            setSearch("");
          }}
        >
          Leave Ledger
        </button>
      </div>

      {activeTab === "holidays" ? (
        <>
          <div className="hcl-stats">
            <div className="hcl-stat-card">
              <span>Holidays this month</span>
              <strong>{filteredHolidays.length}</strong>
              <small>{monthName}</small>
            </div>
            <div className="hcl-stat-card">
              <span>Holidays this year</span>
              <strong>
                {
                  holidays.filter(
                    (holiday) =>
                      new Date(`${holiday.date}T00:00:00`).getFullYear() ===
                      year
                  ).length
                }
              </strong>
              <small>{year}</small>
            </div>
            <div className="hcl-stat-card">
              <span>National holidays</span>
              <strong>
                {
                  holidays.filter(
                    (holiday) =>
                      holiday.type === "National" &&
                      new Date(`${holiday.date}T00:00:00`).getFullYear() ===
                        year
                  ).length
                }
              </strong>
              <small>Selected year</small>
            </div>
          </div>

          <div className="hcl-toolbar">
            <div className="hcl-month-control">
              <button
                aria-label="Previous month"
                onClick={() => moveMonth(-1)}
              >
                <FiChevronLeft />
              </button>
              <strong>{monthName}</strong>
              <button aria-label="Next month" onClick={() => moveMonth(1)}>
                <FiChevronRight />
              </button>
            </div>

            <div className="hcl-toolbar-actions">
              <label className="hcl-search">
                <FiSearch />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search holidays"
                />
              </label>
              <button className="hcl-secondary-btn" onClick={exportHolidays}>
                <FiDownload /> Export CSV
              </button>
            </div>
          </div>

          <div className="hcl-table-card">
            <div className="hcl-table-heading">
              <h2>Holiday schedule</h2>
              <span>{filteredHolidays.length} records</span>
            </div>

            <div className="hcl-table-wrap">
              <table className="hcl-table">
                <thead>
                  <tr>
                    <th>Holiday</th>
                    <th>Date</th>
                    <th>Day</th>
                    <th>Type</th>
                    <th>Applicable to</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHolidays.map((holiday) => (
                    <tr key={holiday.id}>
                      <td className="hcl-name-cell">{holiday.name}</td>
                      <td>{formatDate(holiday.date)}</td>
                      <td>
                        {new Date(
                          `${holiday.date}T00:00:00`
                        ).toLocaleDateString("en-IN", { weekday: "long" })}
                      </td>
                      <td>
                        <span className="hcl-pill">{holiday.type}</span>
                      </td>
                      <td>{holiday.applicableTo}</td>
                    </tr>
                  ))}
                  {filteredHolidays.length === 0 && (
                    <tr>
                      <td colSpan="5" className="hcl-empty">
                        No holidays found for this month.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="hcl-stats">
            <div className="hcl-stat-card">
              <span>Available leave balance</span>
              <strong>{leaveTotals.balance}</strong>
              <small>Across sample records</small>
            </div>
            <div className="hcl-stat-card">
              <span>Leave days used</span>
              <strong>{leaveTotals.used}</strong>
              <small>Across sample records</small>
            </div>
            <div className="hcl-stat-card">
              <span>Pending leave requests</span>
              <strong>{leaveTotals.pending}</strong>
              <small>Requests, not days</small>
            </div>
          </div>

          <div className="hcl-toolbar hcl-ledger-toolbar">
            <label className="hcl-search">
              <FiSearch />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search employee or ID"
              />
            </label>

            <div className="hcl-toolbar-actions">
              <select
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
                aria-label="Filter department"
              >
                <option value="All">All departments</option>
                {[...new Set(ledger.map((item) => item.department))].map(
                  (item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  )
                )}
              </select>

              <select
                value={leaveType}
                onChange={(event) => setLeaveType(event.target.value)}
                aria-label="Filter leave type"
              >
                <option value="All">All leave types</option>
                {[...new Set(ledger.map((item) => item.leaveType))].map(
                  (item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  )
                )}
              </select>

              <button className="hcl-secondary-btn" onClick={exportLedger}>
                <FiDownload /> Export CSV
              </button>
            </div>
          </div>

          <div className="hcl-table-card">
            <div className="hcl-table-heading">
              <h2>Employee leave balances</h2>
              <span>{filteredLedger.length} records</span>
            </div>

            <div className="hcl-table-wrap">
              <table className="hcl-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Leave type</th>
                    <th>Opening</th>
                    <th>Credited</th>
                    <th>Used</th>
                    <th>Pending requests</th>
                    <th>Available</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLedger.map((record) => (
                    <tr key={record.id}>
                      <td>
                        <div className="hcl-employee">
                          <strong>{record.employee}</strong>
                          <small>{record.employeeId}</small>
                        </div>
                      </td>
                      <td>{record.department}</td>
                      <td>{record.leaveType}</td>
                      <td>{record.opening}</td>
                      <td>{record.credited}</td>
                      <td>{record.used}</td>
                      <td>{record.pending}</td>
                      <td>
                        <strong className="hcl-balance">
                          {getBalance(record)}
                        </strong>
                      </td>
                    </tr>
                  ))}
                  {filteredLedger.length === 0 && (
                    <tr>
                      <td colSpan="8" className="hcl-empty">
                        No leave records match your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <p className="hcl-footnote">
            Available balance = opening balance + credited leave − leave used.
            Pending requests are displayed separately and are not deducted
            from the balance in this prototype.
          </p>
        </>
      )}

      {showForm && (
        <div
          className="hcl-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowForm(false);
          }}
        >
          <div className="hcl-modal">
            <div className="hcl-modal-heading">
              <div>
                <h2>Add company holiday</h2>
                <p>Enter the holiday details below.</p>
              </div>
              <button
                className="hcl-icon-btn"
                onClick={() => setShowForm(false)}
                aria-label="Close"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={saveHoliday}>
              <label className="hcl-field">
                Holiday name *
                <input
                  required
                  value={holidayForm.name}
                  onChange={(event) =>
                    setHolidayForm({
                      ...holidayForm,
                      name: event.target.value,
                    })
                  }
                  placeholder="e.g. Pongal"
                />
              </label>

              <label className="hcl-field">
                Date *
                <input
                  required
                  type="date"
                  value={holidayForm.date}
                  onChange={(event) =>
                    setHolidayForm({
                      ...holidayForm,
                      date: event.target.value,
                    })
                  }
                />
              </label>

              <label className="hcl-field">
                Holiday type
                <select
                  value={holidayForm.type}
                  onChange={(event) =>
                    setHolidayForm({
                      ...holidayForm,
                      type: event.target.value,
                    })
                  }
                >
                  <option>National</option>
                  <option>Festival</option>
                  <option>Regional</option>
                  <option>Company</option>
                  <option>Optional</option>
                </select>
              </label>

              <label className="hcl-field">
                Applicable to
                <select
                  value={holidayForm.applicableTo}
                  onChange={(event) =>
                    setHolidayForm({
                      ...holidayForm,
                      applicableTo: event.target.value,
                    })
                  }
                >
                  <option>All Employees</option>
                  <option>Selected Locations</option>
                  <option>Selected Departments</option>
                </select>
              </label>

              <div className="hcl-modal-actions">
                <button
                  type="button"
                  className="hcl-secondary-btn"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="hcl-primary-btn">
                  Save Holiday
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
