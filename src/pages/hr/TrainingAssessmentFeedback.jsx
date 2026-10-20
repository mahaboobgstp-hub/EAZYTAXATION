import React, { useMemo, useState } from "react";
import {
  FiAward,
  FiPlus,
  FiSearch,
  FiDownload,
  FiEdit2,
  FiTrash2,
  FiX,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiStar,
  FiUsers,
  FiRefreshCw,
} from "react-icons/fi";
import "../../css/hr/TrainingAssessmentFeedback.css";

const INITIAL_RECORDS = [
  {
    id: 1,
    employeeCode: "EMP-005",
    employeeName: "Suresh Babu",
    department: "Production",
    programmeCode: "TRN-006",
    programme: "Quality Control Basics",
    sessionCode: "SES-005",
    assessmentDate: "2026-10-16",
    score: 86,
    passMark: 60,
    result: "Passed",
    feedbackRating: 5,
    feedback: "Useful practical training. The examples were relevant.",
    certificateStatus: "Issued",
    certificateNumber: "CERT-2026-001",
    completionStatus: "Completed",
    reassessmentDate: "",
    remarks: "",
  },
  {
    id: 2,
    employeeCode: "EMP-007",
    employeeName: "Arjun Reddy",
    department: "Production",
    programmeCode: "TRN-006",
    programme: "Quality Control Basics",
    sessionCode: "SES-005",
    assessmentDate: "2026-10-16",
    score: 45,
    passMark: 60,
    result: "Failed",
    feedbackRating: 3,
    feedback: "Needs more practical examples and revision.",
    certificateStatus: "Not Eligible",
    certificateNumber: "",
    completionStatus: "Reassessment Required",
    reassessmentDate: "2026-10-28",
    remarks: "Arrange a follow-up assessment.",
  },
  {
    id: 3,
    employeeCode: "EMP-001",
    employeeName: "Rahul Kumar",
    department: "Finance",
    programmeCode: "TRN-002",
    programme: "Advanced Excel",
    sessionCode: "SES-002",
    assessmentDate: "2026-10-24",
    score: "",
    passMark: 60,
    result: "Pending",
    feedbackRating: 0,
    feedback: "",
    certificateStatus: "Pending",
    certificateNumber: "",
    completionStatus: "In Progress",
    reassessmentDate: "",
    remarks: "",
  },
  {
    id: 4,
    employeeCode: "EMP-002",
    employeeName: "Priya Sharma",
    department: "HR",
    programmeCode: "TRN-001",
    programme: "Workplace Safety",
    sessionCode: "SES-001",
    assessmentDate: "2026-10-22",
    score: "",
    passMark: 60,
    result: "Pending",
    feedbackRating: 0,
    feedback: "",
    certificateStatus: "Pending",
    certificateNumber: "",
    completionStatus: "In Progress",
    reassessmentDate: "",
    remarks: "",
  },
  {
    id: 5,
    employeeCode: "EMP-003",
    employeeName: "Mohammed Imran",
    department: "IT",
    programmeCode: "TRN-004",
    programme: "Cybersecurity Awareness",
    sessionCode: "SES-003",
    assessmentDate: "2026-10-27",
    score: "",
    passMark: 60,
    result: "Pending",
    feedbackRating: 0,
    feedback: "",
    certificateStatus: "Pending",
    certificateNumber: "",
    completionStatus: "In Progress",
    reassessmentDate: "",
    remarks: "",
  },
  {
    id: 6,
    employeeCode: "EMP-004",
    employeeName: "Ananya Reddy",
    department: "Management",
    programmeCode: "TRN-003",
    programme: "Leadership Essentials",
    sessionCode: "SES-004",
    assessmentDate: "2026-10-30",
    score: "",
    passMark: 60,
    result: "Pending",
    feedbackRating: 0,
    feedback: "",
    certificateStatus: "Pending",
    certificateNumber: "",
    completionStatus: "In Progress",
    reassessmentDate: "",
    remarks: "",
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
  { code: "SES-001", programmeCode: "TRN-001", date: "2026-10-22" },
  { code: "SES-002", programmeCode: "TRN-002", date: "2026-10-24" },
  { code: "SES-003", programmeCode: "TRN-004", date: "2026-10-27" },
  { code: "SES-004", programmeCode: "TRN-003", date: "2026-10-30" },
  { code: "SES-005", programmeCode: "TRN-006", date: "2026-10-16" },
  { code: "SES-006", programmeCode: "TRN-005", date: "2026-11-05" },
];

const RESULT_OPTIONS = ["Pending", "Passed", "Failed", "Waived"];
const COMPLETION_OPTIONS = [
  "In Progress",
  "Completed",
  "Reassessment Required",
  "Withdrawn",
];
const CERTIFICATE_OPTIONS = [
  "Pending",
  "Issued",
  "Not Eligible",
  "Not Required",
];

const EMPTY_FORM = {
  employeeCode: "",
  programmeCode: "TRN-001",
  sessionCode: "SES-001",
  assessmentDate: "",
  score: "",
  passMark: "60",
  result: "Pending",
  feedbackRating: "0",
  feedback: "",
  certificateStatus: "Pending",
  certificateNumber: "",
  completionStatus: "In Progress",
  reassessmentDate: "",
  remarks: "",
};

const escapeCsv = (value) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getEmployee = (code) =>
  EMPLOYEES.find((item) => item.code === code);

const getProgramme = (code) =>
  PROGRAMMES.find((item) => item.code === code);

const getSession = (code) =>
  SESSIONS.find((item) => item.code === code);

export default function TrainingAssessmentFeedback() {
  const [records, setRecords] = useState(INITIAL_RECORDS);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [resultFilter, setResultFilter] = useState("All");
  const [completionFilter, setCompletionFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();

    return records.filter((item) => {
      const matchesSearch =
        !term ||
        [
          item.employeeCode,
          item.employeeName,
          item.department,
          item.programme,
          item.programmeCode,
          item.sessionCode,
          item.certificateNumber,
        ].some((value) => String(value || "").toLowerCase().includes(term));

      return (
        matchesSearch &&
        (departmentFilter === "All" ||
          item.department === departmentFilter) &&
        (resultFilter === "All" || item.result === resultFilter) &&
        (completionFilter === "All" ||
          item.completionStatus === completionFilter)
      );
    });
  }, [records, search, departmentFilter, resultFilter, completionFilter]);

  const metrics = useMemo(() => {
    const assessed = records.filter(
      (item) => item.result === "Passed" || item.result === "Failed"
    );
    const passed = records.filter((item) => item.result === "Passed");
    const scored = records.filter(
      (item) => item.score !== "" && Number.isFinite(Number(item.score))
    );
    const average =
      scored.length > 0
        ? Math.round(
            scored.reduce((total, item) => total + Number(item.score), 0) /
              scored.length
          )
        : null;

    return {
      total: records.length,
      passed: passed.length,
      pending: records.filter((item) => item.result === "Pending").length,
      reassessment: records.filter(
        (item) => item.completionStatus === "Reassessment Required"
      ).length,
      certificates: records.filter(
        (item) => item.certificateStatus === "Issued"
      ).length,
      passRate:
        assessed.length > 0
          ? Math.round((passed.length / assessed.length) * 100)
          : 0,
      average,
    };
  }, [records]);

  const updateField = (field, value) => {
    setForm((current) => {
      const next = { ...current, [field]: value };

      if (field === "employeeCode") {
        // Employee department is derived from the selected employee.
        next.department = getEmployee(value)?.department || "";
      }

      if (field === "programmeCode") {
        const session = SESSIONS.find(
          (item) => item.programmeCode === value
        );
        next.sessionCode = session?.code || "";
      }

      if (field === "score" || field === "passMark") {
        const score = field === "score" ? value : next.score;
        const passMark = field === "passMark" ? value : next.passMark;

        if (score !== "" && passMark !== "") {
          next.result =
            Number(score) >= Number(passMark) ? "Passed" : "Failed";

          next.completionStatus =
            next.result === "Passed" ? "Completed" : "Reassessment Required";

          next.certificateStatus =
            next.result === "Passed" ? "Issued" : "Not Eligible";
        }
      }

      if (field === "result") {
        if (value === "Passed") {
          next.completionStatus = "Completed";
          next.certificateStatus = "Issued";
        } else if (value === "Failed") {
          next.completionStatus = "Reassessment Required";
          next.certificateStatus = "Not Eligible";
        } else if (value === "Pending") {
          next.completionStatus = "In Progress";
          next.certificateStatus = "Pending";
          next.certificateNumber = "";
        } else if (value === "Waived") {
          next.completionStatus = "Completed";
          next.certificateStatus = "Not Required";
          next.certificateNumber = "";
        }
      }

      if (field === "certificateStatus" && value !== "Issued") {
        next.certificateNumber = "";
      }

      return next;
    });

    setError("");
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      assessmentDate: new Date().toLocaleDateString("en-CA"),
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
      assessmentDate: item.assessmentDate || "",
      score: item.score === "" ? "" : String(item.score),
      passMark: String(item.passMark ?? 60),
      result: item.result,
      feedbackRating: String(item.feedbackRating ?? 0),
      feedback: item.feedback || "",
      certificateStatus: item.certificateStatus,
      certificateNumber: item.certificateNumber || "",
      completionStatus: item.completionStatus,
      reassessmentDate: item.reassessmentDate || "",
      remarks: item.remarks || "",
    });
    setError("");
    setModalOpen(true);
  };

  const saveRecord = (event) => {
    event.preventDefault();

    const employee = getEmployee(form.employeeCode);
    const programme = getProgramme(form.programmeCode);
    const session = getSession(form.sessionCode);

    if (!employee || !programme || !session) {
      setError("Select a valid employee, programme and session.");
      return;
    }

    if (session.programmeCode !== programme.code) {
      setError("The selected session does not belong to this programme.");
      return;
    }

    if (
      records.some(
        (item) =>
          item.employeeCode === form.employeeCode &&
          item.sessionCode === form.sessionCode &&
          item.id !== editingId
      )
    ) {
      setError("An assessment record already exists for this employee and session.");
      return;
    }

    if (!form.assessmentDate) {
      setError("Assessment date is required.");
      return;
    }

    const score = form.score === "" ? "" : Number(form.score);
    const passMark = Number(form.passMark);
    const rating = Number(form.feedbackRating);

    if (
      form.score !== "" &&
      (!Number.isFinite(score) || score < 0 || score > 100)
    ) {
      setError("Assessment score must be between 0 and 100.");
      return;
    }

    if (
      !Number.isFinite(passMark) ||
      passMark < 0 ||
      passMark > 100
    ) {
      setError("Pass mark must be between 0 and 100.");
      return;
    }

    if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
      setError("Feedback rating must be between 0 and 5.");
      return;
    }

    if (form.result === "Passed" && score !== "" && score < passMark) {
      setError("The score is below the pass mark. Review the assessment result.");
      return;
    }

    if (form.result === "Failed" && score !== "" && score >= passMark) {
      setError("The score meets or exceeds the pass mark. Review the result.");
      return;
    }

    if (form.result === "Passed" && score === "") {
      setError("Enter an assessment score before marking the result as Passed.");
      return;
    }

    if (
      form.certificateStatus === "Issued" &&
      form.result !== "Passed"
    ) {
      setError("A certificate can only be issued for a Passed result.");
      return;
    }

    if (
      form.certificateStatus === "Issued" &&
      !form.certificateNumber.trim()
    ) {
      setError("Enter the certificate number when issuing a certificate.");
      return;
    }

    if (
      form.completionStatus === "Completed" &&
      !["Passed", "Waived"].includes(form.result)
    ) {
      setError("Completion requires a Passed or Waived assessment result.");
      return;
    }

    if (
      form.completionStatus === "Reassessment Required" &&
      form.result !== "Failed"
    ) {
      setError("Reassessment is normally required when the result is Failed.");
      return;
    }

    if (
      form.result === "Failed" &&
      form.completionStatus !== "Reassessment Required"
    ) {
      setError("A failed assessment must be marked for reassessment.");
      return;
    }

    if (
      form.completionStatus === "Reassessment Required" &&
      !form.reassessmentDate
    ) {
      setError("Enter a reassessment date for this record.");
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
      assessmentDate: form.assessmentDate,
      score,
      passMark,
      result: form.result,
      feedbackRating: rating,
      feedback: form.feedback.trim(),
      certificateStatus: form.certificateStatus,
      certificateNumber:
        form.certificateStatus === "Issued"
          ? form.certificateNumber.trim()
          : "",
      completionStatus: form.completionStatus,
      reassessmentDate: form.reassessmentDate,
      remarks: form.remarks.trim(),
    };

    if (editingId !== null) {
      setRecords((current) =>
        current.map((item) => (item.id === editingId ? record : item))
      );
    } else {
      setRecords((current) => [record, ...current]);
    }

    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
  };

  const deleteRecord = (item) => {
    const confirmed = window.confirm(
      `Delete the assessment record for ${item.employeeName} — ${item.programme}?`
    );

    if (confirmed) {
      setRecords((current) =>
        current.filter((record) => record.id !== item.id)
      );
    }
  };

  const exportCsv = () => {
    const headers = [
      "Employee Code",
      "Employee Name",
      "Department",
      "Programme Code",
      "Programme",
      "Session Code",
      "Assessment Date",
      "Score",
      "Pass Mark",
      "Result",
      "Feedback Rating",
      "Feedback",
      "Certificate Status",
      "Certificate Number",
      "Completion Status",
      "Reassessment Date",
      "Remarks",
    ];

    const rows = filteredRecords.map((item) => [
      item.employeeCode,
      item.employeeName,
      item.department,
      item.programmeCode,
      item.programme,
      item.sessionCode,
      item.assessmentDate,
      item.score,
      item.passMark,
      item.result,
      item.feedbackRating,
      item.feedback,
      item.certificateStatus,
      item.certificateNumber,
      item.completionStatus,
      item.reassessmentDate,
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
    link.download = "training-assessment-feedback.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setSearch("");
    setDepartmentFilter("All");
    setResultFilter("All");
    setCompletionFilter("All");
  };

  return (
    <div className="taf-page">
      <div className="taf-page-header">
        <div className="taf-heading">
          <div className="taf-heading-icon">
            <FiAward />
          </div>
          <div>
            <h1>Training Assessment, Feedback &amp; Completion</h1>
            <p>
              Record assessment outcomes, employee feedback, certification and
              follow-up actions after training.
            </p>
          </div>
        </div>

        <div className="taf-header-actions">
          <button className="taf-btn taf-btn-secondary" onClick={exportCsv}>
            <FiDownload /> Export CSV
          </button>
          <button className="taf-btn taf-btn-primary" onClick={openCreate}>
            <FiPlus /> Add Assessment
          </button>
        </div>
      </div>

      <div className="taf-metrics">
        <div className="taf-metric-card">
          <div className="taf-metric-icon taf-blue">
            <FiUsers />
          </div>
          <div>
            <span>Assessment Records</span>
            <strong>{metrics.total}</strong>
            <small>Employee-session records</small>
          </div>
        </div>

        <div className="taf-metric-card">
          <div className="taf-metric-icon taf-green">
            <FiCheckCircle />
          </div>
          <div>
            <span>Passed</span>
            <strong>{metrics.passed}</strong>
            <small>{metrics.passRate}% pass rate among assessed</small>
          </div>
        </div>

        <div className="taf-metric-card">
          <div className="taf-metric-icon taf-orange">
            <FiClock />
          </div>
          <div>
            <span>Pending Assessment</span>
            <strong>{metrics.pending}</strong>
            <small>Results not yet recorded</small>
          </div>
        </div>

        <div className="taf-metric-card">
          <div className="taf-metric-icon taf-purple">
            <FiAward />
          </div>
          <div>
            <span>Certificates Issued</span>
            <strong>{metrics.certificates}</strong>
            <small>
              Average score: {metrics.average === null ? "—" : `${metrics.average}%`}
            </small>
          </div>
        </div>
      </div>

      <div className="taf-summary-strip">
        <div>
          <FiRefreshCw />
          <span>Reassessment required</span>
          <strong>{metrics.reassessment}</strong>
        </div>
        <p>
          A failed result should have a reassessment date and should not be
          treated as completed.
        </p>
      </div>

      <div className="taf-info-banner">
        <FiAlertCircle />
        <p>
          <strong>Prototype mode:</strong> Records and certificate numbers are
          illustrative. This page does not generate certificate files, send
          notifications or persist data to Supabase.
        </p>
      </div>

      <section className="taf-panel">
        <div className="taf-panel-header">
          <div>
            <h2>Assessment &amp; Feedback Register</h2>
            <p>Review results, feedback, certificates and reassessment needs.</p>
          </div>
          <span className="taf-record-count">
            {filteredRecords.length} of {records.length} records
          </span>
        </div>

        <div className="taf-filters">
          <div className="taf-search-box">
            <FiSearch />
            <input
              type="search"
              placeholder="Search employee, programme or certificate..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <label className="taf-filter-control">
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

          <label className="taf-filter-control">
            <span>Result</span>
            <select
              value={resultFilter}
              onChange={(event) => setResultFilter(event.target.value)}
            >
              <option value="All">All results</option>
              {RESULT_OPTIONS.map((result) => (
                <option key={result} value={result}>
                  {result}
                </option>
              ))}
            </select>
          </label>

          <label className="taf-filter-control">
            <span>Completion</span>
            <select
              value={completionFilter}
              onChange={(event) => setCompletionFilter(event.target.value)}
            >
              <option value="All">All statuses</option>
              {COMPLETION_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <button className="taf-btn taf-btn-reset" onClick={resetFilters}>
            <FiRefreshCw /> Reset
          </button>
        </div>

        <div className="taf-table-wrap">
          <table className="taf-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Programme / Session</th>
                <th>Score</th>
                <th>Result</th>
                <th>Feedback</th>
                <th>Certificate</th>
                <th>Completion</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="taf-employee-cell">
                      <strong>{item.employeeName}</strong>
                      <span>{item.employeeCode}</span>
                      <small>{item.department}</small>
                    </div>
                  </td>

                  <td>
                    <div className="taf-programme-cell">
                      <strong>{item.programme}</strong>
                      <span>{item.sessionCode}</span>
                      <small>{formatDate(item.assessmentDate)}</small>
                    </div>
                  </td>

                  <td>
                    <div className="taf-score-cell">
                      <strong>
                        {item.score === "" ? "—" : `${item.score}%`}
                      </strong>
                      <small>Pass: {item.passMark}%</small>
                    </div>
                  </td>

                  <td>
                    <span
                      className={`taf-status taf-result-${item.result
                        .toLowerCase()
                        .replace(/\s+/g, "-")}`}
                    >
                      {item.result}
                    </span>
                  </td>

                  <td>
                    <div className="taf-feedback-cell">
                      <div
                        className="taf-stars"
                        aria-label={`Rating ${item.feedbackRating} out of 5`}
                      >
                        {[1, 2, 3, 4, 5].map((star) => (
                          <FiStar
                            key={star}
                            className={
                              star <= item.feedbackRating ? "taf-star-filled" : ""
                            }
                          />
                        ))}
                      </div>
                      <small title={item.feedback}>
                        {item.feedback || "No feedback yet"}
                      </small>
                    </div>
                  </td>

                  <td>
                    <div className="taf-certificate-cell">
                      <span
                        className={`taf-status taf-certificate-${item.certificateStatus
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                      >
                        {item.certificateStatus}
                      </span>
                      {item.certificateNumber && (
                        <small>{item.certificateNumber}</small>
                      )}
                    </div>
                  </td>

                  <td>
                    <span
                      className={`taf-status taf-completion-${item.completionStatus
                        .toLowerCase()
                        .replace(/\s+/g, "-")}`}
                    >
                      {item.completionStatus}
                    </span>
                    {item.reassessmentDate && (
                      <small className="taf-reassessment-date">
                        Due: {formatDate(item.reassessmentDate)}
                      </small>
                    )}
                  </td>

                  <td>
                    <div className="taf-row-actions">
                      <button
                        className="taf-icon-btn"
                        onClick={() => openEdit(item)}
                        title={`Edit ${item.employeeName} assessment`}
                        aria-label={`Edit ${item.employeeName} assessment`}
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        className="taf-icon-btn taf-delete-btn"
                        onClick={() => deleteRecord(item)}
                        title="Delete assessment record"
                        aria-label="Delete assessment record"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan="8" className="taf-empty-state">
                    <FiAward />
                    <strong>No assessment records found</strong>
                    <span>Try changing your search or filters.</span>
                    <button
                      className="taf-btn taf-btn-secondary"
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

        <div className="taf-table-footer">
          <span>
            Showing {filteredRecords.length} record
            {filteredRecords.length === 1 ? "" : "s"}
          </span>
          <span>Scores are percentages; feedback ratings use a 1–5 scale.</span>
        </div>
      </section>

      {modalOpen && (
        <div
          className="taf-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setModalOpen(false);
              setError("");
            }
          }}
        >
          <div
            className="taf-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="taf-modal-title"
          >
            <div className="taf-modal-header">
              <div>
                <h2 id="taf-modal-title">
                  {editingId !== null
                    ? "Edit Assessment & Feedback"
                    : "Add Assessment & Feedback"}
                </h2>
                <p>
                  Record the outcome, learner feedback, certification and
                  follow-up details.
                </p>
              </div>
              <button
                type="button"
                className="taf-icon-btn"
                onClick={() => {
                  setModalOpen(false);
                  setError("");
                }}
                aria-label="Close form"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={saveRecord}>
              <div className="taf-form-grid">
                <label className="taf-form-field">
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

                <label className="taf-form-field">
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

                <label className="taf-form-field">
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
                        {session.code} — {formatDate(session.date)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="taf-form-field">
                  <span>Assessment Date *</span>
                  <input
                    type="date"
                    value={form.assessmentDate}
                    onChange={(event) =>
                      updateField("assessmentDate", event.target.value)
                    }
                    required
                  />
                </label>

                <label className="taf-form-field">
                  <span>Score (0–100)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={form.score}
                    onChange={(event) => updateField("score", event.target.value)}
                    placeholder="Enter score"
                  />
                </label>

                <label className="taf-form-field">
                  <span>Pass Mark (0–100) *</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={form.passMark}
                    onChange={(event) =>
                      updateField("passMark", event.target.value)
                    }
                    required
                  />
                </label>

                <label className="taf-form-field">
                  <span>Assessment Result *</span>
                  <select
                    value={form.result}
                    onChange={(event) => updateField("result", event.target.value)}
                  >
                    {RESULT_OPTIONS.map((result) => (
                      <option key={result} value={result}>
                        {result}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="taf-form-field">
                  <span>Employee Feedback Rating</span>
                  <select
                    value={form.feedbackRating}
                    onChange={(event) =>
                      updateField("feedbackRating", event.target.value)
                    }
                  >
                    <option value="0">Not rated</option>
                    <option value="1">1 — Poor</option>
                    <option value="2">2 — Fair</option>
                    <option value="3">3 — Good</option>
                    <option value="4">4 — Very good</option>
                    <option value="5">5 — Excellent</option>
                  </select>
                </label>

                <label className="taf-form-field">
                  <span>Completion Status *</span>
                  <select
                    value={form.completionStatus}
                    onChange={(event) =>
                      updateField("completionStatus", event.target.value)
                    }
                  >
                    {COMPLETION_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="taf-form-field">
                  <span>Certificate Status *</span>
                  <select
                    value={form.certificateStatus}
                    onChange={(event) =>
                      updateField("certificateStatus", event.target.value)
                    }
                  >
                    {CERTIFICATE_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>

                {form.certificateStatus === "Issued" && (
                  <label className="taf-form-field">
                    <span>Certificate Number *</span>
                    <input
                      value={form.certificateNumber}
                      onChange={(event) =>
                        updateField("certificateNumber", event.target.value)
                      }
                      placeholder="Enter certificate number"
                      required
                    />
                  </label>
                )}

                {form.completionStatus === "Reassessment Required" && (
                  <label className="taf-form-field">
                    <span>Reassessment Date *</span>
                    <input
                      type="date"
                      value={form.reassessmentDate}
                      onChange={(event) =>
                        updateField("reassessmentDate", event.target.value)
                      }
                      required
                    />
                  </label>
                )}

                <label className="taf-form-field taf-full-width">
                  <span>Employee Feedback</span>
                  <textarea
                    rows="3"
                    value={form.feedback}
                    onChange={(event) =>
                      updateField("feedback", event.target.value)
                    }
                    placeholder="What did the employee think about the training?"
                  />
                </label>

                <label className="taf-form-field taf-full-width">
                  <span>HR Remarks / Follow-up Actions</span>
                  <textarea
                    rows="3"
                    value={form.remarks}
                    onChange={(event) =>
                      updateField("remarks", event.target.value)
                    }
                    placeholder="Record observations, remedial training or next steps..."
                  />
                </label>
              </div>

              {error && (
                <div className="taf-form-error">
                  <FiAlertCircle /> {error}
                </div>
              )}

              <div className="taf-modal-footer">
                <button
                  type="button"
                  className="taf-btn taf-btn-secondary"
                  onClick={() => {
                    setModalOpen(false);
                    setError("");
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="taf-btn taf-btn-primary">
                  {editingId !== null ? "Save Changes" : "Save Assessment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
