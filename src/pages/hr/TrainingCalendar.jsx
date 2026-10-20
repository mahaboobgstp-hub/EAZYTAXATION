import React, { useMemo, useState } from "react";
import {
FiCalendar,
FiPlus,
FiSearch,
FiDownload,
FiEdit2,
FiTrash2,
FiX,
FiClock,
FiMapPin,
FiUsers,
FiVideo,
FiAlertCircle,
FiRefreshCw,
} from "react-icons/fi";
import "../../css/hr/TrainingCalendar.css";

const INITIAL_SESSIONS = [
{
id: 1,
sessionCode: "SES-001",
programme: "Workplace Safety",
programmeCode: "TRN-001",
date: "2026-10-22",
startTime: "10:00",
endTime: "12:00",
trainer: "Internal HR Team",
method: "Classroom",
venue: "Training Room A",
capacity: 25,
enrolled: 18,
status: "Scheduled",
notes: "Workplace hazards and emergency procedures.",
},
{
id: 2,
sessionCode: "SES-002",
programme: "Advanced Excel",
programmeCode: "TRN-002",
date: "2026-10-24",
startTime: "14:00",
endTime: "17:00",
trainer: "External Trainer",
method: "Online",
venue: "https://example.com/training",
capacity: 20,
enrolled: 14,
status: "Scheduled",
notes: "Advanced formulas and pivot tables.",
},
{
id: 3,
sessionCode: "SES-003",
programme: "Cybersecurity Awareness",
programmeCode: "TRN-004",
date: "2026-10-27",
startTime: "11:00",
endTime: "12:00",
trainer: "IT Team",
method: "Online",
venue: "https://example.com/security-training",
capacity: 100,
enrolled: 72,
status: "Scheduled",
notes: "Phishing awareness and data protection.",
},
{
id: 4,
sessionCode: "SES-004",
programme: "Leadership Essentials",
programmeCode: "TRN-003",
date: "2026-10-30",
startTime: "09:30",
endTime: "13:30",
trainer: "Leadership Coach",
method: "Workshop",
venue: "Conference Hall",
capacity: 15,
enrolled: 12,
status: "Scheduled",
notes: "Leadership and team management workshop.",
},
{
id: 5,
sessionCode: "SES-005",
programme: "Quality Control Basics",
programmeCode: "TRN-006",
date: "2026-10-16",
startTime: "10:00",
endTime: "12:00",
trainer: "Quality Manager",
method: "On-the-job",
venue: "Production Floor",
capacity: 20,
enrolled: 18,
status: "Completed",
notes: "Inspection standards and defect reporting.",
},
{
id: 6,
sessionCode: "SES-006",
programme: "Communication Skills",
programmeCode: "TRN-005",
date: "2026-11-05",
startTime: "10:00",
endTime: "13:00",
trainer: "External Trainer",
method: "Classroom",
venue: "Training Room B",
capacity: 25,
enrolled: 0,
status: "Draft",
notes: "Workplace communication and presentation skills.",
},
];

const PROGRAMMES = [
{ code: "TRN-001", title: "Workplace Safety" },
{ code: "TRN-002", title: "Advanced Excel" },
{ code: "TRN-003", title: "Leadership Essentials" },
{ code: "TRN-004", title: "Cybersecurity Awareness" },
{ code: "TRN-005", title: "Communication Skills" },
{ code: "TRN-006", title: "Quality Control Basics" },
];

const METHODS = ["Classroom", "Online", "Workshop", "On-the-job", "Blended"];
const STATUSES = ["Draft", "Scheduled", "In Progress", "Completed", "Cancelled"];

const EMPTY_FORM = {
sessionCode: "",
programmeCode: "TRN-001",
date: "",
startTime: "10:00",
endTime: "11:00",
trainer: "",
method: "Classroom",
venue: "",
capacity: "20",
enrolled: "0",
status: "Draft",
notes: "",
};


const escapeCsv = (value) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

const formatDate = (value) => {
if (!value) return "—";
return new Date("${value}T00:00:00").toLocaleDateString("en-IN", {
day: "2-digit",
month: "short",
year: "numeric",
});
};

const formatTime = (value) => {
if (!value) return "—";
const [hours, minutes] = value.split(":").map(Number);
const date = new Date();
date.setHours(hours, minutes, 0, 0);
return date.toLocaleTimeString("en-IN", {
hour: "2-digit",
minute: "2-digit",
hour12: true,
});
};

const getProgrammeTitle = (code) =>
PROGRAMMES.find((item) => item.code === code)?.title || code || "—";

export default function TrainingCalendar() {
const [sessions, setSessions] = useState(INITIAL_SESSIONS);
const [search, setSearch] = useState("");
const [statusFilter, setStatusFilter] = useState("All");
const [methodFilter, setMethodFilter] = useState("All");
const [dateFilter, setDateFilter] = useState("All");
const [modalOpen, setModalOpen] = useState(false);
const [editingId, setEditingId] = useState(null);
const [form, setForm] = useState(EMPTY_FORM);
const [error, setError] = useState("");

const today = new Date();
today.setHours(0, 0, 0, 0);
const todayString = [
today.getFullYear(),
String(today.getMonth() + 1).padStart(2, "0"),
String(today.getDate()).padStart(2, "0"),
].join("-");

const filteredSessions = useMemo(() => {
const term = search.trim().toLowerCase();

return sessions
  .filter((item) => {
    const matchesSearch =
      !term ||
      [
        item.sessionCode,
        item.programme,
        item.programmeCode,
        item.trainer,
        item.venue,
        item.method,
      ].some((value) => String(value || "").toLowerCase().includes(term));

    const matchesStatus =
      statusFilter === "All" || item.status === statusFilter;

    const matchesMethod =
      methodFilter === "All" || item.method === methodFilter;

    let matchesDate = true;
    if (dateFilter === "Upcoming") {
      matchesDate =
        item.date >= todayString &&
        !["Cancelled", "Completed"].includes(item.status);
    } else if (dateFilter === "Past") {
      matchesDate = item.date < todayString;
    } else if (dateFilter === "Today") {
      matchesDate = item.date === todayString;
    }

    return matchesSearch && matchesStatus && matchesMethod && matchesDate;
  })
  .sort((a, b) =>
    `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`)
  );

}, [sessions, search, statusFilter, methodFilter, dateFilter, todayString]);

const metrics = useMemo(() => {
const upcoming = sessions.filter(
(item) =>
item.date >= todayString &&
!["Cancelled", "Completed"].includes(item.status)
);

const todaySessions = sessions.filter(
  (item) =>
    item.date === todayString &&
    !["Cancelled", "Completed"].includes(item.status)
);

const scheduled = sessions.filter(
  (item) => item.status === "Scheduled"
);

const totalSeats = upcoming.reduce(
  (total, item) => total + Number(item.capacity || 0),
  0
);

const totalEnrolled = upcoming.reduce(
  (total, item) => total + Number(item.enrolled || 0),
  0
);

return {
  total: sessions.length,
  upcoming: upcoming.length,
  today: todaySessions.length,
  occupancy:
    totalSeats > 0 ? Math.round((totalEnrolled / totalSeats) * 100) : 0,
  scheduled: scheduled.length,
};

}, [sessions, todayString]);

const updateField = (field, value) => {
setForm((current) => ({ ...current, [field]: value }));
setError("");
};

const openCreate = () => {
const nextNumber =
Math.max(0, ...sessions.map((item) => item.id)) + 1;

setEditingId(null);
setForm({
  ...EMPTY_FORM,
  sessionCode: `SES-${String(nextNumber).padStart(3, "0")}`,
  date: todayString,
});
setError("");
setModalOpen(true);

};

const openEdit = (session) => {
setEditingId(session.id);
setForm({
...EMPTY_FORM,
...session,
capacity: String(session.capacity),
enrolled: String(session.enrolled),
});
setError("");
setModalOpen(true);
};

const saveSession = (event) => {
event.preventDefault();

if (!form.sessionCode.trim() || !form.date || !form.trainer.trim()) {
  setError("Session code, date and trainer are required.");
  return;
}

if (
  sessions.some(
    (item) =>
      item.sessionCode.trim().toLowerCase() ===
        form.sessionCode.trim().toLowerCase() &&
      item.id !== editingId
  )
) {
  setError("This session code already exists.");
  return;
}

if (form.endTime <= form.startTime) {
  setError("End time must be later than start time.");
  return;
}

const capacity = Number(form.capacity);
const enrolled = Number(form.enrolled);

if (
  !Number.isInteger(capacity) ||
  capacity < 1 ||
  !Number.isInteger(enrolled) ||
  enrolled < 0
) {
  setError("Capacity must be at least 1 and enrolment cannot be negative.");
  return;
}

if (enrolled > capacity) {
  setError("Enrolled participants cannot exceed session capacity.");
  return;
}

if (form.method === "Online" && !form.venue.trim()) {
  setError("Enter the online meeting link for an online session.");
  return;
}

const selectedProgramme = PROGRAMMES.find(
  (item) => item.code === form.programmeCode
);

const record = {
  ...form,
  id: editingId ?? Date.now(),
  sessionCode: form.sessionCode.trim(),
  programmeCode: form.programmeCode,
  programme: selectedProgramme?.title || form.programmeCode,
  trainer: form.trainer.trim(),
  venue: form.venue.trim(),
  notes: form.notes.trim(),
  capacity,
  enrolled,
};

if (editingId !== null) {
  setSessions((current) =>
    current.map((item) => (item.id === editingId ? record : item))
  );
} else {
  setSessions((current) => [...current, record]);
}

setModalOpen(false);
setEditingId(null);
setForm(EMPTY_FORM);
setError("");

};

const deleteSession = (session) => {
const confirmed = window.confirm(
"Delete session "${session.sessionCode}" for ${session.programme}?"
);

if (confirmed) {
  setSessions((current) =>
    current.filter((item) => item.id !== session.id)
  );
}

};

const exportCsv = () => {
const headers = [
"Session Code",
"Programme",
"Programme Code",
"Date",
"Start Time",
"End Time",
"Trainer",
"Delivery Method",
"Venue / Meeting Link",
"Capacity",
"Enrolled",
"Status",
"Notes",
];

const rows = filteredSessions.map((item) => [
  item.sessionCode,
  item.programme,
  item.programmeCode,
  item.date,
  item.startTime,
  item.endTime,
  item.trainer,
  item.method,
  item.venue,
  item.capacity,
  item.enrolled,
  item.status,
  item.notes,
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
link.download = "training-calendar-sessions.csv";
document.body.appendChild(link);
link.click();
link.remove();
URL.revokeObjectURL(url);

};

const resetFilters = () => {
setSearch("");
setStatusFilter("All");
setMethodFilter("All");
setDateFilter("All");
};

return (
<div className="tcal-page">
<div className="tcal-page-header">
<div className="tcal-heading">
<div className="tcal-heading-icon">
<FiCalendar />
</div>
<div>
<h1>Training Calendar & Session Scheduling</h1>
<p>
Plan training sessions, assign trainers, manage capacity and
coordinate learning schedules.
</p>
</div>
</div>

    <div className="tcal-header-actions">
      <button className="tcal-btn tcal-btn-secondary" onClick={exportCsv}>
        <FiDownload /> Export CSV
      </button>
      <button className="tcal-btn tcal-btn-primary" onClick={openCreate}>
        <FiPlus /> Schedule Session
      </button>
    </div>
  </div>

  <div className="tcal-metrics">
    <div className="tcal-metric-card">
      <div className="tcal-metric-icon tcal-blue">
        <FiCalendar />
      </div>
      <div>
        <span>Total Sessions</span>
        <strong>{metrics.total}</strong>
        <small>All calendar records</small>
      </div>
    </div>

    <div className="tcal-metric-card">
      <div className="tcal-metric-icon tcal-green">
        <FiRefreshCw />
      </div>
      <div>
        <span>Upcoming Sessions</span>
        <strong>{metrics.upcoming}</strong>
        <small>Not completed or cancelled</small>
      </div>
    </div>

    <div className="tcal-metric-card">
      <div className="tcal-metric-icon tcal-orange">
        <FiClock />
      </div>
      <div>
        <span>Sessions Today</span>
        <strong>{metrics.today}</strong>
        <small>{formatDate(todayString)}</small>
      </div>
    </div>

    <div className="tcal-metric-card">
      <div className="tcal-metric-icon tcal-purple">
        <FiUsers />
      </div>
      <div>
        <span>Upcoming Seat Utilisation</span>
        <strong>{metrics.occupancy}%</strong>
        <small>Enrolled participants / capacity</small>
      </div>
    </div>
  </div>

  <div className="tcal-info-banner">
    <FiAlertCircle />
    <p>
      <strong>Prototype mode:</strong> Sessions are sample records held in
      page state. Calendar invitations, reminders, real employee enrolment
      and database persistence are not connected yet.
    </p>
  </div>

  <section className="tcal-panel">
    <div className="tcal-panel-header">
      <div>
        <h2>Training Session Register</h2>
        <p>Review and manage the training schedule.</p>
      </div>
      <span className="tcal-record-count">
        {filteredSessions.length} of {sessions.length} sessions
      </span>
    </div>

    <div className="tcal-filters">
      <div className="tcal-search-box">
        <FiSearch />
        <input
          type="search"
          placeholder="Search session, programme, trainer or venue..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <label className="tcal-filter-control">
        <span>Date</span>
        <select
          value={dateFilter}
          onChange={(event) => setDateFilter(event.target.value)}
        >
          <option value="All">All dates</option>
          <option value="Today">Today</option>
          <option value="Upcoming">Upcoming</option>
          <option value="Past">Past</option>
        </select>
      </label>

      <label className="tcal-filter-control">
        <span>Status</span>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="All">All statuses</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>

      <label className="tcal-filter-control">
        <span>Delivery</span>
        <select
          value={methodFilter}
          onChange={(event) => setMethodFilter(event.target.value)}
        >
          <option value="All">All methods</option>
          {METHODS.map((method) => (
            <option key={method} value={method}>
              {method}
            </option>
          ))}
        </select>
      </label>

      <button className="tcal-btn tcal-btn-reset" onClick={resetFilters}>
        <FiRefreshCw /> Reset
      </button>
    </div>

    <div className="tcal-table-wrap">
      <table className="tcal-table">
        <thead>
          <tr>
            <th>Session / Programme</th>
            <th>Date &amp; Time</th>
            <th>Trainer</th>
            <th>Delivery / Venue</th>
            <th>Participants</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredSessions.map((item) => {
            const occupancy =
              item.capacity > 0
                ? Math.round((item.enrolled / item.capacity) * 100)
                : 0;

            return (
              <tr key={item.id}>
                <td>
                  <div className="tcal-session-cell">
                    <span className="tcal-session-code">
                      {item.sessionCode}
                    </span>
                    <strong>{item.programme}</strong>
                    <small>{item.programmeCode}</small>
                  </div>
                </td>
                <td>
                  <div className="tcal-date-cell">
                    <strong>{formatDate(item.date)}</strong>
                    <span>
                      {formatTime(item.startTime)} –{" "}
                      {formatTime(item.endTime)}
                    </span>
                  </div>
                </td>
                <td>
                  <span className="tcal-trainer">{item.trainer}</span>
                </td>
                <td>
                  <div className="tcal-venue-cell">
                    <span className="tcal-method">
                      {item.method === "Online" ? <FiVideo /> : <FiMapPin />}
                      {item.method}
                    </span>
                    <small title={item.venue}>
                      {item.venue || "Venue not specified"}
                    </small>
                  </div>
                </td>
                <td>
                  <div className="tcal-participant-cell">
                    <strong>
                      {item.enrolled} / {item.capacity}
                    </strong>
                    <div className="tcal-progress-track">
                      <div
                        className={`tcal-progress-fill ${
                          occupancy >= 90 ? "tcal-progress-high" : ""
                        }`}
                        style={{ width: `${Math.min(occupancy, 100)}%` }}
                      />
                    </div>
                    <small>{occupancy}% capacity</small>
                  </div>
                </td>
                <td>
                  <span
                    className={`tcal-status tcal-status-${item.status
                      .toLowerCase()
                      .replace(/\s+/g, "-")}`}
                  >
                    {item.status}
                  </span>
                </td>
                <td>
                  <div className="tcal-row-actions">
                    <button
                      className="tcal-icon-btn"
                      onClick={() => openEdit(item)}
                      title={`Edit ${item.sessionCode}`}
                      aria-label={`Edit ${item.sessionCode}`}
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      className="tcal-icon-btn tcal-delete-btn"
                      onClick={() => deleteSession(item)}
                      title={`Delete ${item.sessionCode}`}
                      aria-label={`Delete ${item.sessionCode}`}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}

          {filteredSessions.length === 0 && (
            <tr>
              <td colSpan="7" className="tcal-empty-state">
                <FiCalendar />
                <strong>No sessions found</strong>
                <span>Try different search terms or filters.</span>
                <button
                  className="tcal-btn tcal-btn-secondary"
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

    <div className="tcal-table-footer">
      <span>
        Showing {filteredSessions.length} session
        {filteredSessions.length === 1 ? "" : "s"}
      </span>
      <span>Participant counts are illustrative until enrolment is connected.</span>
    </div>
  </section>

  {modalOpen && (
    <div
      className="tcal-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          setModalOpen(false);
          setError("");
        }
      }}
    >
      <div
        className="tcal-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tcal-modal-title"
      >
        <div className="tcal-modal-header">
          <div>
            <h2 id="tcal-modal-title">
              {editingId !== null ? "Edit Training Session" : "Schedule Training Session"}
            </h2>
            <p>
              Configure the programme, schedule, trainer and session
              capacity.
            </p>
          </div>
          <button
            type="button"
            className="tcal-icon-btn"
            onClick={() => {
              setModalOpen(false);
              setError("");
            }}
            aria-label="Close form"
          >
            <FiX />
          </button>
        </div>

        <form onSubmit={saveSession}>
          <div className="tcal-form-grid">
            <label className="tcal-form-field">
              <span>Session Code *</span>
              <input
                value={form.sessionCode}
                onChange={(event) =>
                  updateField("sessionCode", event.target.value)
                }
                placeholder="e.g. SES-007"
                required
              />
            </label>

            <label className="tcal-form-field">
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

            <label className="tcal-form-field">
              <span>Session Date *</span>
              <input
                type="date"
                value={form.date}
                onChange={(event) => updateField("date", event.target.value)}
                required
              />
            </label>

            <label className="tcal-form-field">
              <span>Trainer / Instructor *</span>
              <input
                value={form.trainer}
                onChange={(event) =>
                  updateField("trainer", event.target.value)
                }
                placeholder="Enter trainer name"
                required
              />
            </label>

            <label className="tcal-form-field">
              <span>Start Time *</span>
              <input
                type="time"
                value={form.startTime}
                onChange={(event) =>
                  updateField("startTime", event.target.value)
                }
                required
              />
            </label>

            <label className="tcal-form-field">
              <span>End Time *</span>
              <input
                type="time"
                value={form.endTime}
                onChange={(event) =>
                  updateField("endTime", event.target.value)
                }
                required
              />
            </label>

            <label className="tcal-form-field">
              <span>Delivery Method *</span>
              <select
                value={form.method}
                onChange={(event) => updateField("method", event.target.value)}
              >
                {METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </label>

            <label className="tcal-form-field">
              <span>
                {form.method === "Online"
                  ? "Meeting Link *"
                  : "Venue / Meeting Link"}
              </span>
              <input
                value={form.venue}
                onChange={(event) => updateField("venue", event.target.value)}
                placeholder={
                  form.method === "Online"
                    ? "https://..."
                    : "Enter room, site or meeting link"
                }
                required={form.method === "Online"}
              />
            </label>

            <label className="tcal-form-field">
              <span>Session Capacity *</span>
              <input
                type="number"
                min="1"
                step="1"
                value={form.capacity}
                onChange={(event) =>
                  updateField("capacity", event.target.value)
                }
                required
              />
            </label>

            <label className="tcal-form-field">
              <span>Enrolled Participants</span>
              <input
                type="number"
                min="0"
                step="1"
                value={form.enrolled}
                onChange={(event) =>
                  updateField("enrolled", event.target.value)
                }
                required
              />
            </label>

            <label className="tcal-form-field">
              <span>Session Status *</span>
              <select
                value={form.status}
                onChange={(event) => updateField("status", event.target.value)}
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label className="tcal-form-field tcal-full-width">
              <span>Session Notes</span>
              <textarea
                rows="3"
                value={form.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                placeholder="Topics, instructions or other details..."
              />
            </label>
          </div>

          {error && (
            <div className="tcal-form-error">
              <FiAlertCircle /> {error}
            </div>
          )}

          <div className="tcal-modal-footer">
            <button
              type="button"
              className="tcal-btn tcal-btn-secondary"
              onClick={() => {
                setModalOpen(false);
                setError("");
              }}
            >
              Cancel
            </button>
            <button type="submit" className="tcal-btn tcal-btn-primary">
              {editingId !== null ? "Save Changes" : "Create Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )}
</div>

);
}
