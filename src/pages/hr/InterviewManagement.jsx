
import { useMemo, useState } from "react";
import {
  FiSearch,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiDownload,
  FiX,
  FiCalendar,
  FiClock,
  FiUsers,
  FiCheckCircle,
  FiVideo,
  FiMapPin,
  FiFilter,
  FiStar,
} from "react-icons/fi";
import "../../css/hr/InterviewManagement.css";

const TODAY = new Date().toISOString().slice(0, 10);

const INITIAL_INTERVIEWS = [
  {
    id: 1,
    interviewCode: "INT-2026-001",
    candidateName: "Priya Sharma",
    candidateCode: "CAN-2026-002",
    jobTitle: "HR Executive",
    requisitionCode: "REQ-2026-002",
    round: "HR Round",
    interviewer: "Anita Rao",
    scheduledDate: "2026-10-20",
    scheduledTime: "10:00",
    duration: 45,
    mode: "Video Call",
    meetingLink: "",
    location: "",
    status: "Scheduled",
    score: "",
    recommendation: "Pending",
    feedback: "",
  },
  {
    id: 2,
    interviewCode: "INT-2026-002",
    candidateName: "Mohammed Irfan",
    candidateCode: "CAN-2026-003",
    jobTitle: "Software Developer",
    requisitionCode: "REQ-2026-003",
    round: "Technical Round",
    interviewer: "Ramesh Kumar",
    scheduledDate: "2026-10-21",
    scheduledTime: "11:30",
    duration: 60,
    mode: "In Person",
    meetingLink: "",
    location: "Meeting Room 1",
    status: "Scheduled",
    score: "",
    recommendation: "Pending",
    feedback: "",
  },
  {
    id: 3,
    interviewCode: "INT-2026-003",
    candidateName: "Arjun Kumar",
    candidateCode: "CAN-2026-001",
    jobTitle: "Accounts Executive",
    requisitionCode: "REQ-2026-001",
    round: "Initial Screening",
    interviewer: "Anita Rao",
    scheduledDate: "2026-10-16",
    scheduledTime: "14:00",
    duration: 30,
    mode: "Phone",
    meetingLink: "",
    location: "",
    status: "Completed",
    score: 4,
    recommendation: "Proceed",
    feedback: "Good communication and relevant experience.",
  },
  {
    id: 4,
    interviewCode: "INT-2026-004",
    candidateName: "Sneha Reddy",
    candidateCode: "CAN-2026-004",
    jobTitle: "Sales Executive",
    requisitionCode: "REQ-2026-004",
    round: "HR Round",
    interviewer: "Kiran Reddy",
    scheduledDate: "2026-10-22",
    scheduledTime: "15:00",
    duration: 45,
    mode: "In Person",
    meetingLink: "",
    location: "Meeting Room 2",
    status: "Scheduled",
    score: "",
    recommendation: "Pending",
    feedback: "",
  },
];

const EMPTY_FORM = {
  candidateName: "",
  candidateCode: "",
  jobTitle: "",
  requisitionCode: "",
  round: "Initial Screening",
  interviewer: "",
  scheduledDate: TODAY,
  scheduledTime: "10:00",
  duration: "45",
  mode: "Video Call",
  meetingLink: "",
  location: "",
  status: "Scheduled",
  score: "",
  recommendation: "Pending",
  feedback: "",
};

const INTERVIEW_ROUNDS = [
  "Initial Screening",
  "HR Round",
  "Technical Round",
  "Managerial Round",
  "Final Round",
  "Other",
];

const INTERVIEW_STATUSES = [
  "Scheduled",
  "Completed",
  "Cancelled",
  "Rescheduled",
  "No Show",
];

const RECOMMENDATIONS = [
  "Pending",
  "Strong Hire",
  "Proceed",
  "Hold",
  "Reject",
];

const MODES = ["Video Call", "In Person", "Phone"];

const statusClass = (status) =>
  status.toLowerCase().replace(/[^a-z0-9]+/g, "-");

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function InterviewManagement() {
  const [interviews, setInterviews] = useState(INITIAL_INTERVIEWS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [roundFilter, setRoundFilter] = useState("All");
  const [modeFilter, setModeFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  const filteredInterviews = useMemo(() => {
    const term = search.trim().toLowerCase();

    return interviews
      .filter((item) => {
        const searchable = [
          item.interviewCode,
          item.candidateName,
          item.candidateCode,
          item.jobTitle,
          item.requisitionCode,
          item.interviewer,
          item.round,
        ];

        const matchesSearch =
          !term ||
          searchable.some((value) =>
            String(value || "").toLowerCase().includes(term)
          );

        const matchesStatus =
          statusFilter === "All" || item.status === statusFilter;
        const matchesRound =
          roundFilter === "All" || item.round === roundFilter;
        const matchesMode = modeFilter === "All" || item.mode === modeFilter;

        let matchesDate = true;
        if (dateFilter === "Today") {
          matchesDate = item.scheduledDate === TODAY;
        } else if (dateFilter === "Upcoming") {
          matchesDate =
            item.scheduledDate >= TODAY &&
            ["Scheduled", "Rescheduled"].includes(item.status);
        } else if (dateFilter === "Past") {
          matchesDate = item.scheduledDate < TODAY;
        }

        return (
          matchesSearch &&
          matchesStatus &&
          matchesRound &&
          matchesMode &&
          matchesDate
        );
      })
      .sort((a, b) =>
        `${a.scheduledDate}T${a.scheduledTime}`.localeCompare(
          `${b.scheduledDate}T${b.scheduledTime}`
        )
      );
  }, [interviews, search, statusFilter, roundFilter, modeFilter, dateFilter]);

  const todayCount = interviews.filter(
    (item) =>
      item.scheduledDate === TODAY &&
      ["Scheduled", "Rescheduled"].includes(item.status)
  ).length;

  const upcomingCount = interviews.filter(
    (item) =>
      item.scheduledDate >= TODAY &&
      ["Scheduled", "Rescheduled"].includes(item.status)
  ).length;

  const completedCount = interviews.filter(
    (item) => item.status === "Completed"
  ).length;

  const pendingEvaluationCount = interviews.filter(
    (item) =>
      item.status === "Completed" &&
      (!item.score || item.recommendation === "Pending")
  ).length;

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const openNewForm = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      scheduledDate: TODAY,
      scheduledTime: "10:00",
    });
    setError("");
    setShowForm(true);
  };

  const openEditForm = (item) => {
    setEditingId(item.id);
    setForm({
      ...item,
      duration: String(item.duration ?? 45),
      score: item.score === "" ? "" : String(item.score),
    });
    setError("");
    setShowForm(true);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    if (
      !form.candidateName.trim() ||
      !form.jobTitle.trim() ||
      !form.interviewer.trim() ||
      !form.scheduledDate ||
      !form.scheduledTime
    ) {
      setError("Please complete the candidate, job, interviewer and schedule fields.");
      return;
    }

    const duration = Number(form.duration);
    if (!Number.isFinite(duration) || duration <= 0) {
      setError("Interview duration must be greater than zero.");
      return;
    }

    const score =
      form.score === "" ? "" : Number(form.score);

    if (
      score !== "" &&
      (!Number.isFinite(score) || score < 1 || score > 5)
    ) {
      setError("Evaluation score must be between 1 and 5.");
      return;
    }

    if (form.mode === "Video Call" && form.meetingLink.trim()) {
      try {
        const url = new URL(form.meetingLink.trim());
        if (!["http:", "https:"].includes(url.protocol)) {
          throw new Error("Invalid URL protocol");
        }
      } catch {
        setError("Enter a valid meeting URL beginning with https:// or http://.");
        return;
      }
    }

    const record = {
      ...form,
      candidateName: form.candidateName.trim(),
      candidateCode: form.candidateCode.trim(),
      jobTitle: form.jobTitle.trim(),
      requisitionCode: form.requisitionCode.trim(),
      interviewer: form.interviewer.trim(),
      duration,
      score,
      meetingLink: form.meetingLink.trim(),
      location: form.location.trim(),
      feedback: form.feedback.trim(),
    };

    if (editingId !== null) {
      setInterviews((current) =>
        current.map((item) =>
          item.id === editingId ? { ...item, ...record } : item
        )
      );
    } else {
      const nextId =
        interviews.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) +
        1;

      setInterviews((current) => [
        {
          id: nextId,
          interviewCode: `INT-${new Date().getFullYear()}-${String(nextId).padStart(3, "0")}`,
          ...record,
        },
        ...current,
      ]);
    }

    setShowForm(false);
  };

  const deleteInterview = (item) => {
    if (
      window.confirm(
        `Delete interview ${item.interviewCode} for ${item.candidateName}?`
      )
    ) {
      setInterviews((current) =>
        current.filter((interview) => interview.id !== item.id)
      );
    }
  };

  const exportCsv = () => {
    const headers = [
      "Interview Code",
      "Candidate",
      "Candidate Code",
      "Job Title",
      "Requisition Code",
      "Round",
      "Interviewer",
      "Date",
      "Time",
      "Duration Minutes",
      "Mode",
      "Location",
      "Meeting Link",
      "Status",
      "Score Out Of 5",
      "Recommendation",
      "Feedback",
    ];

    const rows = filteredInterviews.map((item) => [
      item.interviewCode,
      item.candidateName,
      item.candidateCode,
      item.jobTitle,
      item.requisitionCode,
      item.round,
      item.interviewer,
      item.scheduledDate,
      item.scheduledTime,
      item.duration,
      item.mode,
      item.location,
      item.meetingLink,
      item.status,
      item.score,
      item.recommendation,
      item.feedback,
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
    link.download = "interview-management.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setRoundFilter("All");
    setModeFilter("All");
    setDateFilter("All");
  };

  return (
    <div className="im-page">
      <div className="im-page-header">
        <div>
          <span className="im-eyebrow">RECRUITMENT</span>
          <h1>Interview Scheduling &amp; Evaluation</h1>
          <p>Plan interview rounds, assign interviewers and record evaluation outcomes.</p>
        </div>
        <div className="im-header-actions">
          <button type="button" className="im-btn im-btn-secondary" onClick={exportCsv}>
            <FiDownload /> Export CSV
          </button>
          <button type="button" className="im-btn im-btn-primary" onClick={openNewForm}>
            <FiPlus /> Schedule Interview
          </button>
        </div>
      </div>

      <div className="im-stats-grid">
        <div className="im-stat-card">
          <div className="im-stat-icon im-blue"><FiCalendar /></div>
          <div>
            <span>Today's Interviews</span>
            <strong>{todayCount}</strong>
            <small>Scheduled for today</small>
          </div>
        </div>
        <div className="im-stat-card">
          <div className="im-stat-icon im-purple"><FiClock /></div>
          <div>
            <span>Upcoming Interviews</span>
            <strong>{upcomingCount}</strong>
            <small>Scheduled from today onward</small>
          </div>
        </div>
        <div className="im-stat-card">
          <div className="im-stat-icon im-green"><FiCheckCircle /></div>
          <div>
            <span>Completed</span>
            <strong>{completedCount}</strong>
            <small>All completed interviews</small>
          </div>
        </div>
        <div className="im-stat-card">
          <div className="im-stat-icon im-orange"><FiStar /></div>
          <div>
            <span>Evaluation Pending</span>
            <strong>{pendingEvaluationCount}</strong>
            <small>Completed, but evaluation incomplete</small>
          </div>
        </div>
      </div>

      <div className="im-workflow-note">
        <FiUsers />
        <div>
          <strong>Interview workflow</strong>
          <p>
            Schedule each round separately. Mark the interview Completed and
            record its score, recommendation and feedback after the interview.
          </p>
        </div>
      </div>

      <div className="im-table-card">
        <div className="im-table-heading">
          <div>
            <h2>Interview Register</h2>
            <p>{filteredInterviews.length} interview record(s) match your filters</p>
          </div>
        </div>

        <div className="im-filters">
          <div className="im-search">
            <FiSearch />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search candidate, job, interviewer or code..."
              aria-label="Search interviews"
            />
          </div>

          <div className="im-filter-control">
            <FiFilter />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by interview status"
            >
              <option value="All">All statuses</option>
              {INTERVIEW_STATUSES.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <select
            className="im-select-filter"
            value={roundFilter}
            onChange={(event) => setRoundFilter(event.target.value)}
            aria-label="Filter by interview round"
          >
            <option value="All">All rounds</option>
            {INTERVIEW_ROUNDS.map((round) => (
              <option key={round} value={round}>{round}</option>
            ))}
          </select>

          <select
            className="im-select-filter"
            value={modeFilter}
            onChange={(event) => setModeFilter(event.target.value)}
            aria-label="Filter by interview mode"
          >
            <option value="All">All modes</option>
            {MODES.map((mode) => (
              <option key={mode} value={mode}>{mode}</option>
            ))}
          </select>

          <select
            className="im-select-filter"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
            aria-label="Filter by date"
          >
            <option value="All">All dates</option>
            <option value="Today">Today</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Past">Past</option>
          </select>

          <button type="button" className="im-btn im-btn-reset" onClick={resetFilters}>
            Reset
          </button>
        </div>

        <div className="im-table-wrapper">
          <table className="im-table">
            <thead>
              <tr>
                <th>Candidate / Job</th>
                <th>Interview Round</th>
                <th>Date &amp; Time</th>
                <th>Interviewer</th>
                <th>Mode</th>
                <th>Evaluation</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInterviews.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="im-candidate">
                      <strong>{item.candidateName}</strong>
                      <small>{item.candidateCode || "No candidate code"}</small>
                      <span>{item.jobTitle}</span>
                      {item.requisitionCode && <small>{item.requisitionCode}</small>}
                    </div>
                  </td>
                  <td>
                    <strong>{item.round}</strong>
                    <small className="im-muted">{item.interviewCode}</small>
                  </td>
                  <td>
                    <div className="im-date-cell">
                      <strong>{formatDate(item.scheduledDate)}</strong>
                      <small>{item.scheduledTime} · {item.duration} min</small>
                    </div>
                  </td>
                  <td>{item.interviewer}</td>
                  <td>
                    <div className="im-mode-cell">
                      {item.mode === "Video Call" ? <FiVideo /> : item.mode === "Phone" ? <FiUsers /> : <FiMapPin />}
                      <span>{item.mode}</span>
                    </div>
                    {item.mode === "Video Call" && item.meetingLink && (
                      <a
                        className="im-meeting-link"
                        href={item.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open meeting
                      </a>
                    )}
                    {item.mode === "In Person" && item.location && (
                      <small className="im-muted">{item.location}</small>
                    )}
                  </td>
                  <td>
                    {item.score !== "" ? (
                      <span className="im-score">
                        <FiStar /> {item.score}/5
                      </span>
                    ) : (
                      <span className="im-no-score">Not scored</span>
                    )}
                    <small className="im-muted">{item.recommendation}</small>
                  </td>
                  <td>
                    <span className={`im-status im-status-${statusClass(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <div className="im-row-actions">
                      <button
                        type="button"
                        className="im-icon-btn im-edit-btn"
                        onClick={() => openEditForm(item)}
                        title="Edit interview and evaluation"
                        aria-label={`Edit interview for ${item.candidateName}`}
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        type="button"
                        className="im-icon-btn im-delete-btn"
                        onClick={() => deleteInterview(item)}
                        title="Delete interview"
                        aria-label={`Delete interview ${item.interviewCode}`}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredInterviews.length === 0 && (
                <tr>
                  <td colSpan="8" className="im-empty-state">
                    <FiCalendar />
                    <strong>No interviews found</strong>
                    <span>Change your filters or schedule a new interview.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="im-evaluation-note">
        <strong>Evaluation guidance:</strong> Use the 1–5 score consistently across
        interviewers. Keep feedback job-related and professional. This prototype
        does not send calendar invitations, create video meetings or notify candidates.
      </div>

      {showForm && (
        <div
          className="im-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowForm(false);
          }}
        >
          <div className="im-modal" role="dialog" aria-modal="true" aria-labelledby="im-form-title">
            <div className="im-modal-header">
              <div>
                <h2 id="im-form-title">
                  {editingId !== null ? "Edit Interview" : "Schedule Interview"}
                </h2>
                <p>Record the schedule and update the evaluation after the interview.</p>
              </div>
              <button
                type="button"
                className="im-icon-btn"
                onClick={() => setShowForm(false)}
                aria-label="Close form"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="im-form-section">
                <h3>Candidate &amp; Interview Details</h3>
                <div className="im-form-grid">
                  <label className="im-field">
                    Candidate Name *
                    <input
                      required
                      value={form.candidateName}
                      onChange={(e) => updateField("candidateName", e.target.value)}
                      placeholder="Candidate full name"
                    />
                  </label>

                  <label className="im-field">
                    Candidate Code
                    <input
                      value={form.candidateCode}
                      onChange={(e) => updateField("candidateCode", e.target.value)}
                      placeholder="e.g. CAN-2026-001"
                    />
                  </label>

                  <label className="im-field">
                    Job Title *
                    <input
                      required
                      value={form.jobTitle}
                      onChange={(e) => updateField("jobTitle", e.target.value)}
                      placeholder="Position applied for"
                    />
                  </label>

                  <label className="im-field">
                    Requisition Code
                    <input
                      value={form.requisitionCode}
                      onChange={(e) => updateField("requisitionCode", e.target.value)}
                      placeholder="e.g. REQ-2026-001"
                    />
                  </label>

                  <label className="im-field">
                    Interview Round *
                    <select
                      value={form.round}
                      onChange={(e) => updateField("round", e.target.value)}
                    >
                      {INTERVIEW_ROUNDS.map((round) => (
                        <option key={round} value={round}>{round}</option>
                      ))}
                    </select>
                  </label>

                  <label className="im-field">
                    Interviewer *
                    <input
                      required
                      value={form.interviewer}
                      onChange={(e) => updateField("interviewer", e.target.value)}
                      placeholder="Interviewer name"
                    />
                  </label>
                </div>
              </div>

              <div className="im-form-section">
                <h3>Schedule</h3>
                <div className="im-form-grid">
                  <label className="im-field">
                    Interview Date *
                    <input
                      type="date"
                      required
                      value={form.scheduledDate}
                      onChange={(e) => updateField("scheduledDate", e.target.value)}
                    />
                  </label>

                  <label className="im-field">
                    Start Time *
                    <input
                      type="time"
                      required
                      value={form.scheduledTime}
                      onChange={(e) => updateField("scheduledTime", e.target.value)}
                    />
                  </label>

                  <label className="im-field">
                    Duration (minutes) *
                    <input
                      type="number"
                      required
                      min="1"
                      step="1"
                      value={form.duration}
                      onChange={(e) => updateField("duration", e.target.value)}
                    />
                  </label>

                  <label className="im-field">
                    Interview Mode *
                    <select
                      value={form.mode}
                      onChange={(e) => updateField("mode", e.target.value)}
                    >
                      {MODES.map((mode) => (
                        <option key={mode} value={mode}>{mode}</option>
                      ))}
                    </select>
                  </label>

                  {form.mode === "Video Call" && (
                    <label className="im-field im-field-full">
                      Meeting URL
                      <input
                        type="url"
                        value={form.meetingLink}
                        onChange={(e) => updateField("meetingLink", e.target.value)}
                        placeholder="https://..."
                      />
                    </label>
                  )}

                  {form.mode === "In Person" && (
                    <label className="im-field im-field-full">
                      Interview Location
                      <input
                        value={form.location}
                        onChange={(e) => updateField("location", e.target.value)}
                        placeholder="Office / meeting room"
                      />
                    </label>
                  )}

                  <label className="im-field">
                    Interview Status
                    <select
                      value={form.status}
                      onChange={(e) => updateField("status", e.target.value)}
                    >
                      {INTERVIEW_STATUSES.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div className="im-form-section">
                <h3>Evaluation &amp; Feedback</h3>
                <div className="im-form-grid">
                  <label className="im-field">
                    Score (1–5)
                    <select
                      value={form.score}
                      onChange={(e) => updateField("score", e.target.value)}
                    >
                      <option value="">Not evaluated</option>
                      <option value="1">1 — Poor</option>
                      <option value="2">2 — Below expectations</option>
                      <option value="3">3 — Meets expectations</option>
                      <option value="4">4 — Good</option>
                      <option value="5">5 — Excellent</option>
                    </select>
                  </label>

                  <label className="im-field">
                    Recommendation
                    <select
                      value={form.recommendation}
                      onChange={(e) => updateField("recommendation", e.target.value)}
                    >
                      {RECOMMENDATIONS.map((recommendation) => (
                        <option key={recommendation} value={recommendation}>
                          {recommendation}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="im-field im-field-full">
                    Interview Feedback
                    <textarea
                      rows="4"
                      value={form.feedback}
                      onChange={(e) => updateField("feedback", e.target.value)}
                      placeholder="Record relevant, job-related observations and evaluation..."
                    />
                  </label>
                </div>
              </div>

              {error && <div className="im-form-error">{error}</div>}

              <div className="im-modal-footer">
                <button
                  type="button"
                  className="im-btn im-btn-secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="im-btn im-btn-primary">
                  {editingId !== null ? "Save Changes" : "Schedule Interview"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
