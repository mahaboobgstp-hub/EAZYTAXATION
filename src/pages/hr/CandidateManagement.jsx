
import { useMemo, useState } from "react";
import {
  FiSearch,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiDownload,
  FiX,
  FiUsers,
  FiUserCheck,
  FiClock,
  FiCheckCircle,
  FiFilter,
  FiMail,
  FiPhone,
} from "react-icons/fi";
import "../../css/hr/CandidateManagement.css";

const INITIAL_CANDIDATES = [
  {
    id: 1,
    candidateCode: "CAN-2026-001",
    name: "Arjun Kumar",
    email: "arjun.kumar@example.com",
    phone: "9876543210",
    jobTitle: "Accounts Executive",
    requisitionCode: "REQ-2026-001",
    department: "Finance",
    experience: "3 years",
    source: "LinkedIn",
    appliedDate: "2026-10-02",
    expectedSalary: 30000,
    recruiter: "HR Team",
    status: "Screening",
    notes: "Initial profile review pending",
  },
  {
    id: 2,
    candidateCode: "CAN-2026-002",
    name: "Priya Sharma",
    email: "priya.sharma@example.com",
    phone: "9876543211",
    jobTitle: "HR Executive",
    requisitionCode: "REQ-2026-002",
    department: "Human Resources",
    experience: "2 years",
    source: "Employee Referral",
    appliedDate: "2026-10-04",
    expectedSalary: 28000,
    recruiter: "HR Team",
    status: "Interview",
    notes: "First interview to be scheduled",
  },
  {
    id: 3,
    candidateCode: "CAN-2026-003",
    name: "Mohammed Irfan",
    email: "irfan.example@example.com",
    phone: "9876543212",
    jobTitle: "Software Developer",
    requisitionCode: "REQ-2026-003",
    department: "IT",
    experience: "4 years",
    source: "Job Portal",
    appliedDate: "2026-10-05",
    expectedSalary: 55000,
    recruiter: "HR Team",
    status: "Shortlisted",
    notes: "Technical round required",
  },
  {
    id: 4,
    candidateCode: "CAN-2026-004",
    name: "Sneha Reddy",
    email: "sneha.reddy@example.com",
    phone: "9876543213",
    jobTitle: "Sales Executive",
    requisitionCode: "REQ-2026-004",
    department: "Sales",
    experience: "1 year",
    source: "Company Website",
    appliedDate: "2026-10-07",
    expectedSalary: 25000,
    recruiter: "HR Team",
    status: "Applied",
    notes: "",
  },
  {
    id: 5,
    candidateCode: "CAN-2026-005",
    name: "Rahul Verma",
    email: "rahul.verma@example.com",
    phone: "9876543214",
    jobTitle: "Accounts Executive",
    requisitionCode: "REQ-2026-001",
    department: "Finance",
    experience: "5 years",
    source: "Walk-in",
    appliedDate: "2026-10-08",
    expectedSalary: 35000,
    recruiter: "HR Team",
    status: "Offered",
    notes: "Offer approval and communication pending",
  },
];

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  jobTitle: "",
  requisitionCode: "",
  department: "",
  experience: "",
  source: "Job Portal",
  appliedDate: new Date().toISOString().slice(0, 10),
  expectedSalary: "",
  recruiter: "",
  status: "Applied",
  notes: "",
};

const STATUSES = [
  "Applied",
  "Screening",
  "Shortlisted",
  "Interview",
  "Offered",
  "Hired",
  "Rejected",
  "Withdrawn",
];

const SOURCES = [
  "Job Portal",
  "LinkedIn",
  "Company Website",
  "Employee Referral",
  "Walk-in",
  "Recruitment Agency",
  "Other",
];

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const statusClass = (status) =>
  status.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export default function CandidateManagement() {
  const [candidates, setCandidates] = useState(INITIAL_CANDIDATES);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  const departments = useMemo(
    () => [...new Set(candidates.map((c) => c.department).filter(Boolean))].sort(),
    [candidates]
  );

  const filteredCandidates = useMemo(() => {
    const term = search.trim().toLowerCase();

    return candidates.filter((candidate) => {
      const matchesSearch =
        !term ||
        [
          candidate.candidateCode,
          candidate.name,
          candidate.email,
          candidate.phone,
          candidate.jobTitle,
          candidate.requisitionCode,
          candidate.department,
        ].some((value) => String(value || "").toLowerCase().includes(term));

      return (
        matchesSearch &&
        (statusFilter === "All" || candidate.status === statusFilter) &&
        (departmentFilter === "All" ||
          candidate.department === departmentFilter) &&
        (sourceFilter === "All" || candidate.source === sourceFilter)
      );
    });
  }, [candidates, search, statusFilter, departmentFilter, sourceFilter]);

  const totalCandidates = candidates.length;
  const inProgress = candidates.filter((c) =>
    ["Applied", "Screening", "Shortlisted", "Interview"].includes(c.status)
  ).length;
  const offered = candidates.filter((c) => c.status === "Offered").length;
  const hired = candidates.filter((c) => c.status === "Hired").length;

  const openNewForm = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, appliedDate: new Date().toISOString().slice(0, 10) });
    setError("");
    setShowForm(true);
  };

  const openEditForm = (candidate) => {
    setEditingId(candidate.id);
    setForm({
      ...candidate,
      expectedSalary: String(candidate.expectedSalary ?? ""),
    });
    setError("");
    setShowForm(true);
  };

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.jobTitle.trim() ||
      !form.department.trim() ||
      !form.appliedDate
    ) {
      setError("Please complete all required fields.");
      return;
    }

    const email = form.email.trim().toLowerCase();
    const duplicateEmail = candidates.some(
      (candidate) =>
        candidate.email.toLowerCase() === email &&
        candidate.id !== editingId
    );

    if (duplicateEmail) {
      setError("A candidate with this email address already exists.");
      return;
    }

    const cleanedForm = {
      ...form,
      name: form.name.trim(),
      email,
      phone: form.phone.trim(),
      jobTitle: form.jobTitle.trim(),
      requisitionCode: form.requisitionCode.trim(),
      department: form.department.trim(),
      experience: form.experience.trim(),
      recruiter: form.recruiter.trim(),
      expectedSalary: Number(form.expectedSalary) || 0,
      notes: form.notes.trim(),
    };

    if (editingId !== null) {
      setCandidates((current) =>
        current.map((candidate) =>
          candidate.id === editingId
            ? { ...candidate, ...cleanedForm }
            : candidate
        )
      );
    } else {
      const nextNumber =
        candidates.reduce((max, candidate) => {
          const number = Number(candidate.id) || 0;
          return Math.max(max, number);
        }, 0) + 1;

      setCandidates((current) => [
        {
          id: nextNumber,
          candidateCode: `CAN-${new Date().getFullYear()}-${String(nextNumber).padStart(3, "0")}`,
          ...cleanedForm,
        },
        ...current,
      ]);
    }

    setShowForm(false);
  };

  const deleteCandidate = (candidate) => {
    const confirmed = window.confirm(
      `Delete candidate ${candidate.name}? This cannot be undone in this prototype.`
    );

    if (confirmed) {
      setCandidates((current) =>
        current.filter((item) => item.id !== candidate.id)
      );
    }
  };

  const exportCsv = () => {
    const headers = [
      "Candidate Code",
      "Candidate Name",
      "Email",
      "Phone",
      "Job Title",
      "Requisition Code",
      "Department",
      "Experience",
      "Source",
      "Applied Date",
      "Expected Salary",
      "Recruiter",
      "Status",
      "Notes",
    ];

    const rows = filteredCandidates.map((c) => [
      c.candidateCode,
      c.name,
      c.email,
      c.phone,
      c.jobTitle,
      c.requisitionCode,
      c.department,
      c.experience,
      c.source,
      c.appliedDate,
      c.expectedSalary,
      c.recruiter,
      c.status,
      c.notes,
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
    link.download = "candidate-management.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setDepartmentFilter("All");
    setSourceFilter("All");
  };

  return (
    <div className="cm-page">
      <div className="cm-page-header">
        <div>
          <span className="cm-eyebrow">RECRUITMENT</span>
          <h1>Candidate Management</h1>
          <p>Manage applicants, track recruitment stages and maintain candidate records.</p>
        </div>
        <div className="cm-header-actions">
          <button className="cm-btn cm-btn-secondary" onClick={exportCsv}>
            <FiDownload /> Export CSV
          </button>
          <button className="cm-btn cm-btn-primary" onClick={openNewForm}>
            <FiPlus /> Add Candidate
          </button>
        </div>
      </div>

      <div className="cm-stats-grid">
        <div className="cm-stat-card">
          <div className="cm-stat-icon cm-icon-blue"><FiUsers /></div>
          <div>
            <span>Total Candidates</span>
            <strong>{totalCandidates}</strong>
            <small>All candidate records</small>
          </div>
        </div>
        <div className="cm-stat-card">
          <div className="cm-stat-icon cm-icon-purple"><FiClock /></div>
          <div>
            <span>In Progress</span>
            <strong>{inProgress}</strong>
            <small>Applied through interview</small>
          </div>
        </div>
        <div className="cm-stat-card">
          <div className="cm-stat-icon cm-icon-orange"><FiUserCheck /></div>
          <div>
            <span>Offers Issued</span>
            <strong>{offered}</strong>
            <small>Awaiting offer outcome</small>
          </div>
        </div>
        <div className="cm-stat-card">
          <div className="cm-stat-icon cm-icon-green"><FiCheckCircle /></div>
          <div>
            <span>Hired</span>
            <strong>{hired}</strong>
            <small>Marked as hired</small>
          </div>
        </div>
      </div>

      <div className="cm-pipeline">
        <div className="cm-section-heading">
          <div>
            <h2>Recruitment Pipeline</h2>
            <p>Candidate count by current stage</p>
          </div>
        </div>
        <div className="cm-pipeline-grid">
          {STATUSES.map((status) => {
            const count = candidates.filter((c) => c.status === status).length;
            return (
              <button
                type="button"
                className={`cm-pipeline-stage ${statusFilter === status ? "cm-stage-active" : ""}`}
                key={status}
                onClick={() => setStatusFilter(statusFilter === status ? "All" : status)}
              >
                <span className={`cm-status cm-status-${statusClass(status)}`}>
                  {status}
                </span>
                <strong>{count}</strong>
                <small>candidate{count === 1 ? "" : "s"}</small>
              </button>
            );
          })}
        </div>
      </div>

      <div className="cm-table-card">
        <div className="cm-table-heading">
          <div>
            <h2>Candidate Register</h2>
            <p>{filteredCandidates.length} record(s) matching your filters</p>
          </div>
        </div>

        <div className="cm-filters">
          <div className="cm-search-box">
            <FiSearch />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, job or candidate code..."
              aria-label="Search candidates"
            />
          </div>

          <div className="cm-filter-control">
            <FiFilter />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by status"
            >
              <option value="All">All statuses</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <select
            className="cm-select-filter"
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
            className="cm-select-filter"
            value={sourceFilter}
            onChange={(event) => setSourceFilter(event.target.value)}
            aria-label="Filter by source"
          >
            <option value="All">All sources</option>
            {SOURCES.map((source) => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>

          <button className="cm-btn cm-btn-reset" onClick={resetFilters}>
            Reset
          </button>
        </div>

        <div className="cm-table-wrapper">
          <table className="cm-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Applied For</th>
                <th>Experience</th>
                <th>Source</th>
                <th>Applied Date</th>
                <th>Expected Salary</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidates.map((candidate) => (
                <tr key={candidate.id}>
                  <td>
                    <div className="cm-candidate-cell">
                      <div className="cm-avatar">
                        {candidate.name.trim().charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <strong>{candidate.name}</strong>
                        <small>{candidate.candidateCode}</small>
                        <small><FiMail /> {candidate.email}</small>
                        {candidate.phone && (
                          <small><FiPhone /> {candidate.phone}</small>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <strong>{candidate.jobTitle}</strong>
                    <small className="cm-muted">{candidate.department}</small>
                    {candidate.requisitionCode && (
                      <small className="cm-muted">{candidate.requisitionCode}</small>
                    )}
                  </td>
                  <td>{candidate.experience || "—"}</td>
                  <td>{candidate.source}</td>
                  <td>{candidate.appliedDate || "—"}</td>
                  <td>{money(candidate.expectedSalary)}</td>
                  <td>
                    <span className={`cm-status cm-status-${statusClass(candidate.status)}`}>
                      {candidate.status}
                    </span>
                  </td>
                  <td>
                    <div className="cm-row-actions">
                      <button
                        type="button"
                        className="cm-icon-btn cm-edit-btn"
                        onClick={() => openEditForm(candidate)}
                        title="Edit candidate"
                        aria-label={`Edit ${candidate.name}`}
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        type="button"
                        className="cm-icon-btn cm-delete-btn"
                        onClick={() => deleteCandidate(candidate)}
                        title="Delete candidate"
                        aria-label={`Delete ${candidate.name}`}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCandidates.length === 0 && (
                <tr>
                  <td colSpan="8" className="cm-empty-state">
                    <FiUsers />
                    <strong>No candidates found</strong>
                    <span>Try changing your search or filters, or add a candidate.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="cm-privacy-note">
        <strong>Candidate data privacy:</strong> This page currently uses sample data and
        browser memory only. Before production use, connect it to authenticated database
        access, apply role-based permissions and retention rules, and protect candidate
        contact details and recruitment documents.
      </div>

      {showForm && (
        <div
          className="cm-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowForm(false);
          }}
        >
          <div
            className="cm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cm-form-title"
          >
            <div className="cm-modal-header">
              <div>
                <h2 id="cm-form-title">
                  {editingId !== null ? "Edit Candidate" : "Add Candidate"}
                </h2>
                <p>Fields marked * are required.</p>
              </div>
              <button
                type="button"
                className="cm-icon-btn"
                onClick={() => setShowForm(false)}
                aria-label="Close form"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="cm-form-grid">
                <label className="cm-field">
                  Candidate Name *
                  <input
                    required
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="Full name"
                  />
                </label>

                <label className="cm-field">
                  Email *
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="name@example.com"
                  />
                </label>

                <label className="cm-field">
                  Phone
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="Contact number"
                  />
                </label>

                <label className="cm-field">
                  Job Title *
                  <input
                    required
                    value={form.jobTitle}
                    onChange={(e) => updateField("jobTitle", e.target.value)}
                    placeholder="Position applied for"
                  />
                </label>

                <label className="cm-field">
                  Requisition Code
                  <input
                    value={form.requisitionCode}
                    onChange={(e) => updateField("requisitionCode", e.target.value)}
                    placeholder="e.g. REQ-2026-001"
                  />
                </label>

                <label className="cm-field">
                  Department *
                  <input
                    required
                    value={form.department}
                    onChange={(e) => updateField("department", e.target.value)}
                    placeholder="Department"
                  />
                </label>

                <label className="cm-field">
                  Experience
                  <input
                    value={form.experience}
                    onChange={(e) => updateField("experience", e.target.value)}
                    placeholder="e.g. 3 years"
                  />
                </label>

                <label className="cm-field">
                  Application Source
                  <select
                    value={form.source}
                    onChange={(e) => updateField("source", e.target.value)}
                  >
                    {SOURCES.map((source) => (
                      <option key={source} value={source}>{source}</option>
                    ))}
                  </select>
                </label>

                <label className="cm-field">
                  Applied Date *
                  <input
                    type="date"
                    required
                    value={form.appliedDate}
                    onChange={(e) => updateField("appliedDate", e.target.value)}
                  />
                </label>

                <label className="cm-field">
                  Expected Monthly Salary (₹)
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.expectedSalary}
                    onChange={(e) => updateField("expectedSalary", e.target.value)}
                    placeholder="0"
                  />
                </label>

                <label className="cm-field">
                  Recruiter / Owner
                  <input
                    value={form.recruiter}
                    onChange={(e) => updateField("recruiter", e.target.value)}
                    placeholder="Assigned recruiter"
                  />
                </label>

                <label className="cm-field">
                  Recruitment Status
                  <select
                    value={form.status}
                    onChange={(e) => updateField("status", e.target.value)}
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </label>

                <label className="cm-field cm-field-full">
                  Notes
                  <textarea
                    rows="3"
                    value={form.notes}
                    onChange={(e) => updateField("notes", e.target.value)}
                    placeholder="Recruitment notes (avoid unnecessary sensitive information)"
                  />
                </label>
              </div>

              {error && <div className="cm-form-error">{error}</div>}

              <div className="cm-modal-footer">
                <button
                  type="button"
                  className="cm-btn cm-btn-secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="cm-btn cm-btn-primary">
                  {editingId !== null ? "Save Changes" : "Add Candidate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
