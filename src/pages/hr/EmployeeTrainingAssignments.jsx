import React, { useMemo, useState } from "react";
import {
  FiUsers,
  FiPlus,
  FiSearch,
  FiDownload,
  FiEdit2,
  FiTrash2,
  FiX,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiRefreshCw,
  FiBookOpen,
} from "react-icons/fi";
import "../../css/hr/EmployeeTrainingAssignments.css";

const INITIAL_ASSIGNMENTS = [
  {
    id: 1,
    employeeCode: "EMP-001",
    employeeName: "Rahul Kumar",
    department: "Finance",
    programmeCode: "TRN-002",
    programme: "Advanced Excel",
    sessionCode: "SES-002",
    assignedDate: "2026-10-10",
    attendanceDate: "2026-10-24",
    attendance: "Not Marked",
    completion: "Assigned",
    score: "",
    remarks: "",
  },
  {
    id: 2,
    employeeCode: "EMP-002",
    employeeName: "Priya Sharma",
    department: "HR",
    programmeCode: "TRN-001",
    programme: "Workplace Safety",
    sessionCode: "SES-001",
    assignedDate: "2026-10-12",
    attendanceDate: "2026-10-22",
    attendance: "Not Marked",
    completion: "Assigned",
    score: "",
    remarks: "",
  },
  {
    id: 3,
    employeeCode: "EMP-003",
    employeeName: "Mohammed Imran",
    department: "IT",
    programmeCode: "TRN-004",
    programme: "Cybersecurity Awareness",
    sessionCode: "SES-003",
    assignedDate: "2026-10-12",
    attendanceDate: "2026-10-27",
    attendance: "Not Marked",
    completion: "Assigned",
    score: "",
    remarks: "",
  },
  {
    id: 4,
    employeeCode: "EMP-004",
    employeeName: "Ananya Reddy",
    department: "Management",
    programmeCode: "TRN-003",
    programme: "Leadership Essentials",
    sessionCode: "SES-004",
    assignedDate: "2026-10-08",
    attendanceDate: "2026-10-30",
    attendance: "Not Marked",
    completion: "Assigned",
    score: "",
    remarks: "",
  },
  {
    id: 5,
    employeeCode: "EMP-005",
    employeeName: "Suresh Babu",
    department: "Production",
    programmeCode: "TRN-006",
    programme: "Quality Control Basics",
    sessionCode: "SES-005",
    assignedDate: "2026-10-05",
    attendanceDate: "2026-10-16",
    attendance: "Present",
    completion: "Completed",
    score: "86",
    remarks: "Successfully completed the training.",
  },
  {
    id: 6,
    employeeCode: "EMP-006",
    employeeName: "Kavya Rao",
    department: "Finance",
    programmeCode: "TRN-002",
    programme: "Advanced Excel",
    sessionCode: "SES-002",
    assignedDate: "2026-10-10",
    attendanceDate: "2026-10-24",
    attendance: "Not Marked",
    completion: "Assigned",
    score: "",
    remarks: "",
  },
  {
    id: 7,
    employeeCode: "EMP-007",
    employeeName: "Arjun Reddy",
    department: "Production",
    programmeCode: "TRN-006",
    programme: "Quality Control Basics",
    sessionCode: "SES-005",
    assignedDate: "2026-10-05",
    attendanceDate: "2026-10-16",
    attendance: "Absent",
    completion: "In Progress",
    score: "",
    remarks: "Follow-up session required.",
  },
];

const EMPLOYEES = [
  { code: "EMP-001", name: "Rahul Kumar", department: "Finance" },
  { code: "EMP-002", name: "Priya Sharma", department: "HR" },
  { code: "EMP-003", name: "Mohammed Imran", department: "IT" },
  { code: "EMP-004", name: "Ananya Reddy", department: "Management" },
  { code: "EMP-005", name: "Suresh Babu", department: "Production" },
  { code: "EMP-006", name: "Kavya Rao", department: "Finance" },
  { code: "EMP-007", name: "Arjun Reddy", department: "Production" },
  { code: "EMP-008", name: "Divya Lakshmi", department: "Sales" },
  { code: "EMP-009", name: "Vijay Kumar", department: "Operations" },
  { code: "EMP-010", name: "Farhan Ahmed", department: "IT" },
];

const PROGRAMMES = [
  { code: "TRN-001", title: "Workplace Safety" },
  { code: "TRN-002", title: "Advanced Excel" },
  { code: "TRN-003", title: "Leadership Essentials" },
  { code: "TRN-004", title: "Cybersecurity Awareness" },
  { code: "TRN-005", title: "Communication Skills" },
  { code: "TRN-006", title: "Quality Control Basics" },
];

const SESSIONS = [
  { code: "SES-001", title: "Workplace Safety — 22 Oct 2026", programmeCode: "TRN-001", date: "2026-10-22" },
  { code: "SES-002", title: "Advanced Excel — 24 Oct 2026", programmeCode: "TRN-002", date: "2026-10-24" },
  { code: "SES-003", title: "Cybersecurity — 27 Oct 2026", programmeCode: "TRN-004", date: "2026-10-27" },
  { code: "SES-004", title: "Leadership — 30 Oct 2026", programmeCode: "TRN-003", date: "2026-10-30" },
  { code: "SES-005", title: "Quality Control — 16 Oct 2026", programmeCode: "TRN-006", date: "2026-10-16" },
  { code: "SES-006", title: "Communication Skills — 5 Nov 2026", programmeCode: "TRN-005", date: "2026-11-05" },
];

const ATTENDANCE_OPTIONS = [
  "Not Marked",
  "Present",
  "Absent",
  "Late",
  "Excused",
];

const COMPLETION_OPTIONS = [
  "Assigned",
  "In Progress",
  "Completed",
  "Failed",
  "Withdrawn",
];

const EMPTY_FORM = {
  employeeCode: "",
  programmeCode: "TRN-001",
  sessionCode: "SES-001",
  assignedDate: "2026-10-20",
  attendance: "Not Marked",
  completion: "Assigned",
  score: "",
  remarks: "",
};

const escapeCsv = (value) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getEmployee = (code) =>
  EMPLOYEES.find((employee) => employee.code === code);

const getProgramme = (code) =>
  PROGRAMMES.find((programme) => programme.code === code);

const getSession = (code) =>
  SESSIONS.find((session) => session.code === code);

export default function EmployeeTrainingAssignments() {
  const [assignments, setAssignments] = useState(INITIAL_ASSIGNMENTS);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [attendanceFilter, setAttendanceFilter] = useState("All");
  const [completionFilter, setCompletionFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  const filteredAssignments = useMemo(() => {
    const term = search.trim().toLowerCase();

    return assignments.filter((item) => {
      const matchesSearch =
        !term ||
        [
          item.employeeCode,
          item.employeeName,
          item.department,
          item.programme,
          item.programmeCode,
          item.sessionCode,
        ].some((value) => String(value || "").toLowerCase().includes(term));

      return (
        matchesSearch &&
        (departmentFilter === "All" ||
          item.department === departmentFilter) &&
        (attendanceFilter === "All" ||
          item.attendance === attendanceFilter) &&
        (completionFilter === "All" ||
          item.completion === completionFilter)
      );
    });
  }, [
    assignments,
    search,
    departmentFilter,
    attendanceFilter,
    completionFilter,
  ]);

  const metrics = useMemo(() => {
    const completed = assignments.filter(
      (item) => item.completion === "Completed"
    ).length;
    const attended = assignments.filter(
      (item) => item.attendance === "Present" || item.attendance === "Late"
    ).length;
    const pending = assignments.filter(
      (item) => item.attendance === "Not Marked"
    ).length;
    const absent = assignments.filter(
      (item) => item.attendance === "Absent"
    ).length;

    return {
      total: assignments.length,
      completed,
      attended,
      pending,
      absent,
      completionRate:
        assignments.length > 0
          ? Math.round((completed / assignments.length) * 100)
          : 0,
    };
  }, [assignments]);

  const updateField = (field, value) => {
    setForm((current) => {
      const next = { ...current, [field]: value };

      if (field === "employeeCode") {
        const employee = getEmployee(value);
        next.department = employee?.department || "";
      }

      if (field === "programmeCode") {
        const matchingSession = SESSIONS.find(
          (session) => session.programmeCode === value
        );
        next.sessionCode = matchingSession?.code || "";
      }

      if (field === "attendance") {
        if (value === "Present" || value === "Late") {
          if (next.completion === "Assigned") {
            next.completion = "In Progress";
          }
        } else if (value === "Absent" && next.completion === "Completed") {
          next.completion = "In Progress";
        }
      }

      if (field === "completion" && value === "Completed") {
        if (next.attendance !== "Present" && next.attendance !== "Late") {
          next.attendance = "Present";
        }
      }

      return next;
    });
    setError("");
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      assignedDate: new Date().toLocaleDateString("en-CA"),
    });
    setError("");
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({
      employeeCode: item.employeeCode,
      programmeCode: item.programmeCode,
      sessionCode: item.sessionCode,
      assignedDate: item.assignedDate,
      attendance: item.attendance,
      completion: item.completion,
      score: item.score === "" ? "" : String(item.score),
      remarks: item.remarks || "",
    });
    setError("");
    setModalOpen(true);
  };

  const saveAssignment = (event) => {
    event.preventDefault();

    const employee = getEmployee(form.employeeCode);
    const programme = getProgramme(form.programmeCode);
    const session = getSession(form.sessionCode);

    if (!employee || !programme || !session) {
      setError("Select a valid employee, programme and training session.");
      return;
    }

    if (session.programmeCode !== programme.code) {
      setError("The selected session does not belong to this programme.");
      return;
    }

    if (!form.assignedDate) {
      setError("Assignment date is required.");
      return;
    }

    if (
      assignments.some(
        (item) =>
          item.employeeCode === form.employeeCode &&
          item.sessionCode === form.sessionCode &&
          item.id !== editingId
      )
    ) {
      setError("This employee is already assigned to the selected session.");
      return;
    }

    const score = form.score === "" ? "" : Number(form.score);

    if (
      form.score !== "" &&
      (!Number.isFinite(score) || score < 0 || score > 100)
    ) {
      setError("Assessment score must be between 0 and 100.");
      return;
    }

    if (
      form.completion === "Completed" &&
      !["Present", "Late"].includes(form.attendance)
    ) {
      setError("Only employees marked Present or Late can be completed.");
      return;
    }

    const record = {
      id: editingId ?? Date.now(),
      employeeCode: employee.code,
      employeeName: employee.name,
      department: employee.department,
      programmeCode: programme.code,
      programme: programme.title,
      sessionCode: session.code,
      assignedDate: form.assignedDate,
      attendanceDate: session.date,
      attendance: form.attendance,
      completion: form.completion,
      score,
      remarks: form.remarks.trim(),
    };

    if (editingId !== null) {
      setAssignments((current) =>
        current.map((item) => (item.id === editingId ? record : item))
      );
    } else {
      setAssignments((current) => [record, ...current]);
    }

    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
  };

  const deleteAssignment = (item) => {
    const confirmed = window.confirm(
      `Remove the assignment for ${item.employeeName} from ${item.programme}?`
    );

    if (confirmed) {
      setAssignments((current) =>
        current.filter((assignment) => assignment.id !== item.id)
      );
    }
  };

  const markAttendance = (id, attendance) => {
    setAssignments((current) =>
      current.map((item) => {
        if (item.id !== id) return item;

        let completion = item.completion;

        if (attendance === "Present" || attendance === "Late") {
          if (completion === "Assigned") completion = "In Progress";
        } else if (attendance === "Absent" && completion === "Completed") {
          completion = "In Progress";
        }

        return { ...item, attendance, completion };
      })
    );
  };

  const exportCsv = () => {
    const headers = [
      "Employee Code",
      "Employee Name",
      "Department",
      "Programme Code",
      "Programme",
      "Session Code",
      "Assignment Date",
      "Session Date",
      "Attendance",
      "Completion Status",
      "Assessment Score",
      "Remarks",
    ];

    const rows = filteredAssignments.map((item) => [
      item.employeeCode,
      item.employeeName,
      item.department,
      item.programmeCode,
      item.programme,
      item.sessionCode,
      item.assignedDate,
      item.attendanceDate,
      item.attendance,
      item.completion,
      item.score,
      item.remarks,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "employee-training-assignments.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setSearch("");
    setDepartmentFilter("All");
    setAttendanceFilter("All");
    setCompletionFilter("All");
  };

  return (
    <div className="eta-page">
      <div className="eta-page-header">
        <div className="eta-heading">
          <div className="eta-heading-icon">
            <FiUsers />
          </div>
          <div>
            <h1>Employee Training Assignments &amp; Attendance</h1>
            <p>
              Assign employees to training sessions, record attendance and
              monitor completion progress.
            </p>
          </div>
        </div>

        <div className="eta-header-actions">
          <button className="eta-btn eta-btn-secondary" onClick={exportCsv}>
            <FiDownload /> Export CSV
          </button>
          <button className="eta-btn eta-btn-primary" onClick={openCreate}>
            <FiPlus /> Assign Training
          </button>
        </div>
      </div>

      <div className="eta-metrics">
        <div className="eta-metric-card">
          <div className="eta-metric-icon eta-blue">
            <FiBookOpen />
          </div>
          <div>
            <span>Total Assignments</span>
            <strong>{metrics.total}</strong>
            <small>Employee-session records</small>
          </div>
        </div>

        <div className="eta-metric-card">
          <div className="eta-metric-icon eta-green">
            <FiCheckCircle />
          </div>
          <div>
            <span>Completed</span>
            <strong>{metrics.completed}</strong>
            <small>{metrics.completionRate}% completion rate</small>
          </div>
        </div>

        <div className="eta-metric-card">
          <div className="eta-metric-icon eta-orange">
            <FiClock />
          </div>
          <div>
            <span>Attendance Pending</span>
            <strong>{metrics.pending}</strong>
            <small>Records not yet marked</small>
          </div>
        </div>

        <div className="eta-metric-card">
          <div className="eta-metric-icon eta-purple">
            <FiUsers />
          </div>
          <div>
            <span>Present / Late</span>
            <strong>{metrics.attended}</strong>
            <small>{metrics.absent} marked absent</small>
          </div>
        </div>
      </div>

      <div className="eta-info-banner">
        <FiAlertCircle />
        <p>
          <strong>Prototype mode:</strong> Employee names, assignments and
          session details are sample records. Attendance changes are not saved
          to Supabase. The production version must use authenticated,
          company-scoped employee records.
        </p>
      </div>

      <section className="eta-panel">
        <div className="eta-panel-header">
          <div>
            <h2>Assignment Register</h2>
            <p>Maintain employee enrolments, attendance and completion status.</p>
          </div>
          <span className="eta-record-count">
            {filteredAssignments.length} of {assignments.length} assignments
          </span>
        </div>

        <div className="eta-filters">
          <div className="eta-search-box">
            <FiSearch />
            <input
              type="search"
              placeholder="Search employee, programme or session..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <label className="eta-filter-control">
            <span>Department</span>
            <select
              value={departmentFilter}
              onChange={(event) => setDepartmentFilter(event.target.value)}
            >
              <option value="All">All departments</option>
              {[...new Set(EMPLOYEES.map((item) => item.department))]
                .sort()
                .map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
            </select>
          </label>

          <label className="eta-filter-control">
            <span>Attendance</span>
            <select
              value={attendanceFilter}
              onChange={(event) => setAttendanceFilter(event.target.value)}
            >
              <option value="All">All attendance</option>
              {ATTENDANCE_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label className="eta-filter-control">
            <span>Completion</span>
            <select
              value={completionFilter}
              onChange={(event) => setCompletionFilter(event.target.value)}
            >
              <option value="All">All completion statuses</option>
              {COMPLETION_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <button
            className="eta-btn eta-btn-reset"
            onClick={resetFilters}
          >
            <FiRefreshCw /> Reset
          </button>
        </div>

        <div className="eta-table-wrap">
          <table className="eta-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Training Programme</th>
                <th>Session / Date</th>
                <th>Attendance</th>
                <th>Completion</th>
                <th>Score / 100</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssignments.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="eta-employee-cell">
                      <strong>{item.employeeName}</strong>
                      <span>{item.employeeCode}</span>
                      <small>{item.department}</small>
                    </div>
                  </td>
                  <td>
                    <div className="eta-programme-cell">
                      <strong>{item.programme}</strong>
                      <small>{item.programmeCode}</small>
                    </div>
                  </td>
                  <td>
                    <div className="eta-session-cell">
                      <strong>{item.sessionCode}</strong>
                      <span>{formatDate(item.attendanceDate)}</span>
                    </div>
                  </td>
                  <td>
                    <select
                      className={`eta-inline-select eta-attendance-${item.attendance
                        .toLowerCase()
                        .replace(/\s+/g, "-")}`}
                      aria-label={`Attendance for ${item.employeeName}`}
                      value={item.attendance}
                      onChange={(event) =>
                        markAttendance(item.id, event.target.value)
                      }
                    >
                      {ATTENDANCE_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span
                      className={`eta-status eta-completion-${item.completion
                        .toLowerCase()
                        .replace(/\s+/g, "-")}`}
                    >
                      {item.completion}
                    </span>
                  </td>
                  <td className="eta-score-cell">
                    {item.score === "" ? "—" : `${item.score}%`}
                  </td>
                  <td>
                    <div className="eta-row-actions">
                      <button
                        className="eta-icon-btn"
                        onClick={() => openEdit(item)}
                        title={`Edit ${item.employeeName} assignment`}
                        aria-label={`Edit ${item.employeeName} assignment`}
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        className="eta-icon-btn eta-delete-btn"
                        onClick={() => deleteAssignment(item)}
                        title="Remove assignment"
                        aria-label="Remove assignment"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredAssignments.length === 0 && (
                <tr>
                  <td colSpan="7" className="eta-empty-state">
                    <FiUsers />
                    <strong>No assignments found</strong>
                    <span>Try changing your search or filters.</span>
                    <button
                      className="eta-btn eta-btn-secondary"
                      onClick={resetFilters}
                    >
                      Clear filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="eta-table-footer">
          <span>
            Showing {filteredAssignments.length} assignment
            {filteredAssignments.length === 1 ? "" : "s"}
          </span>
          <span>Assessment scores are entered through the assignment form.</span>
        </div>
      </section>

      {modalOpen && (
        <div
          className="eta-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setModalOpen(false);
              setError("");
            }
          }}
        >
          <div
            className="eta-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="eta-modal-title"
          >
            <div className="eta-modal-header">
              <div>
                <h2 id="eta-modal-title">
                  {editingId !== null
                    ? "Edit Training Assignment"
                    : "Assign Employee to Training"}
                </h2>
                <p>
                  Select an employee, training programme and session, then
                  maintain attendance and completion details.
                </p>
              </div>
              <button
                type="button"
                className="eta-icon-btn"
                onClick={() => {
                  setModalOpen(false);
                  setError("");
                }}
                aria-label="Close form"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={saveAssignment}>
              <div className="eta-form-grid">
                <label className="eta-form-field">
                  <span>Employee *</span>
                  <select
                    value={form.employeeCode}
                    onChange={(event) =>
                      updateField("employeeCode", event.target.value)
                    }
                    required
                  >
                    <option value="">Select employee</option>
                    {EMPLOYEES.map((employee) => (
                      <option key={employee.code} value={employee.code}>
                        {employee.code} — {employee.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="eta-form-field">
                  <span>Training Programme *</span>
                  <select
                    value={form.programmeCode}
                    onChange={(event) =>
                      updateField("programmeCode", event.target.value)
                    }
                    required
                  >
                    {PROGRAMMES.map((programme) => (
                      <option key={programme.code} value={programme.code}>
                        {programme.code} — {programme.title}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="eta-form-field">
                  <span>Training Session *</span>
                  <select
                    value={form.sessionCode}
                    onChange={(event) =>
                      updateField("sessionCode", event.target.value)
                    }
                    required
                  >
                    {SESSIONS.filter(
                      (session) =>
                        session.programmeCode === form.programmeCode
                    ).map((session) => (
                      <option key={session.code} value={session.code}>
                        {session.title}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="eta-form-field">
                  <span>Assignment Date *</span>
                  <input
                    type="date"
                    value={form.assignedDate}
                    onChange={(event) =>
                      updateField("assignedDate", event.target.value)
                    }
                    required
                  />
                </label>

                <label className="eta-form-field">
                  <span>Attendance Status *</span>
                  <select
                    value={form.attendance}
                    onChange={(event) =>
                      updateField("attendance", event.target.value)
                    }
                  >
                    {ATTENDANCE_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="eta-form-field">
                  <span>Completion Status *</span>
                  <select
                    value={form.completion}
                    onChange={(event) =>
                      updateField("completion", event.target.value)
                    }
                  >
                    {COMPLETION_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="eta-form-field">
                  <span>Assessment Score (0–100)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={form.score}
                    onChange={(event) =>
                      updateField("score", event.target.value)
                    }
                    placeholder="Optional"
                  />
                </label>

                <label className="eta-form-field eta-full-width">
                  <span>Remarks / Follow-up</span>
                  <textarea
                    rows="3"
                    value={form.remarks}
                    onChange={(event) =>
                      updateField("remarks", event.target.value)
                    }
                    placeholder="Enter feedback, absence reason or follow-up action..."
                  />
                </label>
              </div>

              {error && (
                <div className="eta-form-error">
                  <FiAlertCircle /> {error}
                </div>
              )}

              <div className="eta-modal-footer">
                <button
                  type="button"
                  className="eta-btn eta-btn-secondary"
                  onClick={() => {
                    setModalOpen(false);
                    setError("");
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="eta-btn eta-btn-primary">
                  {editingId !== null ? "Save Changes" : "Create Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
