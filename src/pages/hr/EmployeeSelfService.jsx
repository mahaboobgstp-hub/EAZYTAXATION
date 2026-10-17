
import React, { useMemo, useState } from "react";
import {
  FiUser,
  FiCalendar,
  FiFileText,
  FiClock,
  FiSend,
  FiDownload,
  FiPrinter,
  FiCheckCircle,
  FiAlertCircle,
  FiSearch,
} from "react-icons/fi";
import "../../css/hr/EmployeeSelfService.css";

const employee = {
  id: "EMP001",
  name: "Arun Kumar",
  designation: "Accounts Executive",
  department: "Finance",
  email: "arun@example.com",
  phone: "+91 98765 43210",
  joiningDate: "2024-04-01",
  location: "Head Office",
  employmentStatus: "Active",
};

const attendanceRecords = [
  { date: "2026-10-16", checkIn: "09:05 AM", checkOut: "06:10 PM", status: "Present" },
  { date: "2026-10-15", checkIn: "09:20 AM", checkOut: "06:00 PM", status: "Late" },
  { date: "2026-10-14", checkIn: "08:55 AM", checkOut: "06:05 PM", status: "Present" },
  { date: "2026-10-13", checkIn: "—", checkOut: "—", status: "Leave" },
  { date: "2026-10-12", checkIn: "09:02 AM", checkOut: "06:12 PM", status: "Present" },
];

const initialLeaves = [
  { id: "LV001", type: "Casual Leave", from: "2026-10-13", to: "2026-10-13", days: 1, reason: "Personal work", status: "Approved" },
  { id: "LV002", type: "Earned Leave", from: "2026-10-28", to: "2026-10-29", days: 2, reason: "Family function", status: "Pending" },
];

const leaveBalances = [
  { type: "Casual Leave", available: 6, total: 12 },
  { type: "Earned Leave", available: 10, total: 15 },
  { type: "Sick Leave", available: 5, total: 7 },
];

const payslips = [
  { id: "PS-2026-09", month: "September 2026", gross: 35000, deductions: 3500, net: 31500 },
  { id: "PS-2026-08", month: "August 2026", gross: 35000, deductions: 3500, net: 31500 },
  { id: "PS-2026-07", month: "July 2026", gross: 34000, deductions: 3400, net: 30600 },
];

const initialRequests = [
  { id: "REQ001", type: "Address Update", submitted: "2026-10-05", details: "Request to update residential address", status: "Pending" },
  { id: "REQ002", type: "Employment Letter", submitted: "2026-09-20", details: "Employment confirmation letter", status: "Completed" },
];

const money = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const dateLabel = (value) =>
  value
    ? new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const exportCSV = (filename, rows) => {
  const csv = rows
    .map((row) =>
      row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")
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

const statusClass = (status) =>
  status.toLowerCase().replace(/\s+/g, "-");

export default function EmployeeSelfService() {
  const [activeTab, setActiveTab] = useState("overview");
  const [leaves, setLeaves] = useState(initialLeaves);
  const [requests, setRequests] = useState(initialRequests);
  const [search, setSearch] = useState("");
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    type: "Casual Leave",
    from: "",
    to: "",
    reason: "",
  });
  const [requestForm, setRequestForm] = useState({
    type: "Address Update",
    details: "",
  });

  const filteredLeaves = useMemo(
    () =>
      leaves.filter((item) =>
        `${item.id} ${item.type} ${item.reason} ${item.status}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [leaves, search]
  );

  const filteredRequests = useMemo(
    () =>
      requests.filter((item) =>
        `${item.id} ${item.type} ${item.details} ${item.status}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [requests, search]
  );

  const submitLeave = (event) => {
    event.preventDefault();

    if (!leaveForm.from || !leaveForm.to || !leaveForm.reason.trim()) {
      window.alert("Please complete all leave request fields.");
      return;
    }

    if (leaveForm.to < leaveForm.from) {
      window.alert("The end date cannot be earlier than the start date.");
      return;
    }

    const start = new Date(`${leaveForm.from}T00:00:00`);
    const end = new Date(`${leaveForm.to}T00:00:00`);
    const days = Math.floor((end - start) / 86400000) + 1;

    setLeaves((current) => [
      {
        id: `LV${String(Date.now()).slice(-6)}`,
        type: leaveForm.type,
        from: leaveForm.from,
        to: leaveForm.to,
        days,
        reason: leaveForm.reason.trim(),
        status: "Pending",
      },
      ...current,
    ]);

    setLeaveForm({ type: "Casual Leave", from: "", to: "", reason: "" });
    setShowLeaveForm(false);
    setSearch("");
    window.alert("Leave request added to this prototype.");
  };

  const submitRequest = (event) => {
    event.preventDefault();

    if (!requestForm.details.trim()) {
      window.alert("Please enter request details.");
      return;
    }

    setRequests((current) => [
      {
        id: `REQ${String(Date.now()).slice(-6)}`,
        type: requestForm.type,
        submitted: new Date().toISOString().slice(0, 10),
        details: requestForm.details.trim(),
        status: "Pending",
      },
      ...current,
    ]);

    setRequestForm({ type: "Address Update", details: "" });
    setShowRequestForm(false);
    setSearch("");
    window.alert("Request added to this prototype.");
  };

  const openPayslip = (payslip) => {
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      window.alert("Please allow pop-ups to print this sample payslip.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payslip - ${payslip.month}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body{font-family:Arial,sans-serif;color:#172033;padding:30px;max-width:760px;margin:auto}
          h1{text-align:center;font-size:24px}
          .muted{color:#64748b;text-align:center}
          .row{display:flex;justify-content:space-between;gap:16px;padding:12px 0;border-bottom:1px solid #ddd}
          .total{font-weight:bold;font-size:18px}
          .notice{margin-top:25px;padding:12px;background:#fff7ed;color:#9a3412;font-size:12px}
          @media print{button{display:none}}
        </style>
      </head>
      <body>
        <h1>EazyTaxation — Sample Payslip</h1>
        <p class="muted">${payslip.month}</p>
        <div class="row"><span>Employee</span><strong>${employee.name}</strong></div>
        <div class="row"><span>Employee ID</span><strong>${employee.id}</strong></div>
        <div class="row"><span>Department</span><strong>${employee.department}</strong></div>
        <div class="row"><span>Gross earnings</span><strong>${money(payslip.gross)}</strong></div>
        <div class="row"><span>Total deductions</span><strong>${money(payslip.deductions)}</strong></div>
        <div class="row total"><span>Net salary</span><strong>${money(payslip.net)}</strong></div>
        <p class="notice">Demonstration payslip only. This is not an official payroll document.</p>
        <button onclick="window.print()">Print / Save as PDF</button>
      </body>
      </html>
    `);

    printWindow.document.close();
  };

  const downloadPayslipList = () =>
    exportCSV("my-payslips.csv", [
      ["Payslip ID", "Month", "Gross", "Deductions", "Net"],
      ...payslips.map((item) => [
        item.id,
        item.month,
        item.gross,
        item.deductions,
        item.net,
      ]),
    ]);

  const navItems = [
    { id: "overview", label: "Overview", icon: <FiUser /> },
    { id: "profile", label: "My Profile", icon: <FiUser /> },
    { id: "attendance", label: "My Attendance", icon: <FiClock /> },
    { id: "leave", label: "My Leave", icon: <FiCalendar /> },
    { id: "payslips", label: "My Payslips", icon: <FiFileText /> },
    { id: "requests", label: "My Requests", icon: <FiSend /> },
  ];

  const pendingLeaveCount = leaves.filter(
    (item) => item.status === "Pending"
  ).length;

  const renderOverview = () => (
    <>
      <div className="ess-welcome">
        <div>
          <span>EMPLOYEE SELF-SERVICE</span>
          <h2>Welcome, {employee.name}</h2>
          <p>View your employment information and manage your HR requests.</p>
        </div>
        <div className="ess-avatar">
          {employee.name
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2)}
        </div>
      </div>

      <div className="ess-stats">
        <article className="ess-stat">
          <span>Casual leave available</span>
          <strong>6 days</strong>
          <small>Sample balance</small>
        </article>
        <article className="ess-stat">
          <span>Earned leave available</span>
          <strong>10 days</strong>
          <small>Sample balance</small>
        </article>
        <article className="ess-stat">
          <span>Pending leave requests</span>
          <strong>{pendingLeaveCount}</strong>
          <small>Awaiting review</small>
        </article>
        <article className="ess-stat">
          <span>Latest sample net salary</span>
          <strong>{money(payslips[0].net)}</strong>
          <small>{payslips[0].month}</small>
        </article>
      </div>

      <div className="ess-content-grid">
        <section className="ess-card">
          <div className="ess-card-heading">
            <h3>Recent attendance</h3>
            <button onClick={() => setActiveTab("attendance")}>View all</button>
          </div>
          <div className="ess-simple-list">
            {attendanceRecords.slice(0, 4).map((record) => (
              <div className="ess-list-row" key={record.date}>
                <div>
                  <strong>{dateLabel(record.date)}</strong>
                  <small>{record.checkIn} – {record.checkOut}</small>
                </div>
                <span className={`ess-status ${statusClass(record.status)}`}>
                  {record.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="ess-card">
          <div className="ess-card-heading">
            <h3>Recent requests</h3>
            <button onClick={() => setActiveTab("requests")}>View all</button>
          </div>
          <div className="ess-simple-list">
            {requests.slice(0, 4).map((request) => (
              <div className="ess-list-row" key={request.id}>
                <div>
                  <strong>{request.type}</strong>
                  <small>{dateLabel(request.submitted)}</small>
                </div>
                <span className={`ess-status ${statusClass(request.status)}`}>
                  {request.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );

  const renderProfile = () => (
    <section className="ess-card">
      <div className="ess-card-heading">
        <h3>My employment profile</h3>
        <span className="ess-status active">{employee.employmentStatus}</span>
      </div>
      <div className="ess-profile-grid">
        {[
          ["Employee ID", employee.id],
          ["Full name", employee.name],
          ["Designation", employee.designation],
          ["Department", employee.department],
          ["Email", employee.email],
          ["Phone", employee.phone],
          ["Date of joining", dateLabel(employee.joiningDate)],
          ["Location", employee.location],
        ].map(([label, value]) => (
          <div className="ess-profile-field" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <p className="ess-muted">
        To change personal details, submit a request to HR. This prototype
        does not edit your employee master record.
      </p>
      <button
        className="ess-primary-btn"
        onClick={() => setActiveTab("requests")}
      >
        <FiSend /> Submit a profile change request
      </button>
    </section>
  );

  const renderAttendance = () => (
    <section className="ess-card">
      <div className="ess-card-heading">
        <h3>My attendance records</h3>
        <button
          className="ess-secondary-btn"
          onClick={() =>
            exportCSV("my-attendance.csv", [
              ["Date", "Check In", "Check Out", "Status"],
              ...attendanceRecords.map((item) => [
                item.date,
                item.checkIn,
                item.checkOut,
                item.status,
              ]),
            ])
          }
        >
          <FiDownload /> Export CSV
        </button>
      </div>
      <div className="ess-table-wrap">
        <table className="ess-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Check in</th>
              <th>Check out</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {attendanceRecords.map((record) => (
              <tr key={record.date}>
                <td>{dateLabel(record.date)}</td>
                <td>{record.checkIn}</td>
                <td>{record.checkOut}</td>
                <td>
                  <span className={`ess-status ${statusClass(record.status)}`}>
                    {record.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="ess-muted">
        Attendance entries are examples. Actual punch times must come from
        your attendance module or connected device.
      </p>
    </section>
  );

  const renderLeave = () => (
    <>
      <div className="ess-section-actions">
        <p>Check your leave balance and submit a leave request.</p>
        <button className="ess-primary-btn" onClick={() => setShowLeaveForm(true)}>
          <FiCalendar /> Apply for leave
        </button>
      </div>

      <div className="ess-leave-balances">
        {leaveBalances.map((balance) => (
          <article className="ess-card ess-balance-card" key={balance.type}>
            <span>{balance.type}</span>
            <strong>{balance.available} days</strong>
            <small>of {balance.total} sample days available</small>
            <div className="ess-progress">
              <div
                style={{
                  width: `${Math.min(
                    100,
                    (balance.available / balance.total) * 100
                  )}%`,
                }}
              />
            </div>
          </article>
        ))}
      </div>

      <section className="ess-card">
        <div className="ess-card-heading">
          <h3>My leave requests</h3>
          <span>{leaves.length} records</span>
        </div>
        <label className="ess-search">
          <FiSearch />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search leave requests"
          />
        </label>
        <div className="ess-table-wrap">
          <table className="ess-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Leave type</th>
                <th>From</th>
                <th>To</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaves.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.type}</td>
                  <td>{dateLabel(item.from)}</td>
                  <td>{dateLabel(item.to)}</td>
                  <td>{item.days}</td>
                  <td>{item.reason}</td>
                  <td>
                    <span className={`ess-status ${statusClass(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredLeaves.length === 0 && (
                <tr><td colSpan="7" className="ess-empty">No leave requests found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );

  const renderPayslips = () => (
    <section className="ess-card">
      <div className="ess-card-heading">
        <div>
          <h3>My payslips</h3>
          <p>View and print the available sample payslip summaries.</p>
        </div>
        <button className="ess-secondary-btn" onClick={downloadPayslipList}>
          <FiDownload /> Export list
        </button>
      </div>
      <div className="ess-payslip-list">
        {payslips.map((item) => (
          <article className="ess-payslip-row" key={item.id}>
            <div className="ess-payslip-icon"><FiFileText /></div>
            <div className="ess-payslip-info">
              <strong>{item.month}</strong>
              <small>{item.id} · Net salary {money(item.net)}</small>
            </div>
            <button
              className="ess-secondary-btn"
              onClick={() => openPayslip(item)}
            >
              <FiPrinter /> View / Print
            </button>
          </article>
        ))}
      </div>
      <p className="ess-muted">
        These are demonstration amounts. Do not issue these as official
        payslips. Live payslips must be retrieved from the authenticated
        employee's actual payroll records.
      </p>
    </section>
  );

  const renderRequests = () => (
    <>
      <div className="ess-section-actions">
        <p>Submit a request and review its current status.</p>
        <button className="ess-primary-btn" onClick={() => setShowRequestForm(true)}>
          <FiSend /> New request
        </button>
      </div>

      <section className="ess-card">
        <div className="ess-card-heading">
          <h3>My HR requests</h3>
          <span>{requests.length} records</span>
        </div>
        <label className="ess-search">
          <FiSearch />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search requests"
          />
        </label>
        <div className="ess-table-wrap">
          <table className="ess-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Request type</th>
                <th>Submitted</th>
                <th>Details</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request) => (
                <tr key={request.id}>
                  <td>{request.id}</td>
                  <td>{request.type}</td>
                  <td>{dateLabel(request.submitted)}</td>
                  <td>{request.details}</td>
                  <td>
                    <span className={`ess-status ${statusClass(request.status)}`}>
                      {request.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredRequests.length === 0 && (
                <tr><td colSpan="5" className="ess-empty">No requests found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );

  const tabTitles = {
    overview: "Overview",
    profile: "My Profile",
    attendance: "My Attendance",
    leave: "My Leave",
    payslips: "My Payslips",
    requests: "My Requests",
  };

  return (
    <div className="ess-page">
      <div className="ess-page-header">
        <div>
          <span className="ess-eyebrow">HUMAN RESOURCES</span>
          <h1>Employee Self-Service</h1>
          <p>Your employment information and HR requests.</p>
        </div>
        <span className="ess-prototype-badge">
          <FiAlertCircle /> Prototype
        </span>
      </div>

      <div className="ess-prototype-notice">
        <FiAlertCircle />
        <span>
          This page uses sample employee data and temporary browser memory.
          Employee login, data isolation and database persistence are not
          connected yet. Do not use it to expose real employee information.
        </span>
      </div>

      <div className="ess-layout">
        <nav className="ess-nav" aria-label="Employee self-service sections">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={activeTab === item.id ? "active" : ""}
              onClick={() => {
                setActiveTab(item.id);
                setSearch("");
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <main className="ess-main">
          <div className="ess-main-title">
            <h2>{tabTitles[activeTab]}</h2>
            <span><FiCheckCircle /> Employee portal preview</span>
          </div>

          {activeTab === "overview" && renderOverview()}
          {activeTab === "profile" && renderProfile()}
          {activeTab === "attendance" && renderAttendance()}
          {activeTab === "leave" && renderLeave()}
          {activeTab === "payslips" && renderPayslips()}
          {activeTab === "requests" && renderRequests()}
        </main>
      </div>

      {showLeaveForm && (
        <div className="ess-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setShowLeaveForm(false);
        }}>
          <section className="ess-modal">
            <div className="ess-modal-heading">
              <h3>Apply for leave</h3>
              <button onClick={() => setShowLeaveForm(false)} aria-label="Close">×</button>
            </div>
            <form onSubmit={submitLeave}>
              <label>
                Leave type
                <select
                  value={leaveForm.type}
                  onChange={(event) => setLeaveForm({ ...leaveForm, type: event.target.value })}
                >
                  <option>Casual Leave</option>
                  <option>Earned Leave</option>
                  <option>Sick Leave</option>
                </select>
              </label>
              <label>
                From date
                <input type="date" required value={leaveForm.from} onChange={(event) => setLeaveForm({ ...leaveForm, from: event.target.value })} />
              </label>
              <label>
                To date
                <input type="date" required min={leaveForm.from || undefined} value={leaveForm.to} onChange={(event) => setLeaveForm({ ...leaveForm, to: event.target.value })} />
              </label>
              <label>
                Reason
                <textarea required rows="3" value={leaveForm.reason} onChange={(event) => setLeaveForm({ ...leaveForm, reason: event.target.value })} placeholder="Explain your leave request" />
              </label>
              <div className="ess-modal-actions">
                <button type="button" className="ess-secondary-btn" onClick={() => setShowLeaveForm(false)}>Cancel</button>
                <button type="submit" className="ess-primary-btn">Submit request</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {showRequestForm && (
        <div className="ess-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setShowRequestForm(false);
        }}>
          <section className="ess-modal">
            <div className="ess-modal-heading">
              <h3>Submit HR request</h3>
              <button onClick={() => setShowRequestForm(false)} aria-label="Close">×</button>
            </div>
            <form onSubmit={submitRequest}>
              <label>
                Request type
                <select
                  value={requestForm.type}
                  onChange={(event) => setRequestForm({ ...requestForm, type: event.target.value })}
                >
                  <option>Address Update</option>
                  <option>Bank Details Update</option>
                  <option>Employment Letter</option>
                  <option>Experience Letter</option>
                  <option>Personal Details Correction</option>
                  <option>Other</option>
                </select>
              </label>
              <label>
                Request details
                <textarea required rows="4" value={requestForm.details} onChange={(event) => setRequestForm({ ...requestForm, details: event.target.value })} placeholder="Describe what you need from HR" />
              </label>
              <div className="ess-modal-actions">
                <button type="button" className="ess-secondary-btn" onClick={() => setShowRequestForm(false)}>Cancel</button>
                <button type="submit" className="ess-primary-btn">Submit request</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
