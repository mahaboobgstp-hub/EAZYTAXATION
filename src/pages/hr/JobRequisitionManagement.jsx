
import React, { useMemo, useState } from "react";
import {
  FiSearch,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiDownload,
  FiX,
  FiBriefcase,
  FiUsers,
  FiCalendar,
  FiDollarSign,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiFilter,
} from "react-icons/fi";
import "../../css/hr/JobRequisitionManagement.css";

const initialRequisitions = [
  {
    id: 1,
    code: "REQ-2026-001",
    title: "Accounts Executive",
    department: "Finance",
    designation: "Accounts Executive",
    location: "Head Office",
    openings: 2,
    employmentType: "Full-time",
    experience: "2–4 years",
    budget: 30000,
    priority: "High",
    requestedBy: "Finance Manager",
    requestedDate: "2026-10-01",
    targetDate: "2026-11-15",
    status: "Approved",
    reason: "Business expansion",
    description: "Handle accounting entries, reconciliations and reporting.",
  },
  {
    id: 2,
    code: "REQ-2026-002",
    title: "HR Executive",
    department: "Human Resources",
    designation: "HR Executive",
    location: "Head Office",
    openings: 1,
    employmentType: "Full-time",
    experience: "1–3 years",
    budget: 25000,
    priority: "Medium",
    requestedBy: "HR Manager",
    requestedDate: "2026-09-10",
    targetDate: "2026-10-25",
    status: "Filled",
    reason: "Replacement",
    description: "Support recruitment, employee records and HR administration.",
  },
  {
    id: 3,
    code: "REQ-2026-003",
    title: "Sales Coordinator",
    department: "Sales",
    designation: "Sales Coordinator",
    location: "Branch Office",
    openings: 2,
    employmentType: "Full-time",
    experience: "1–3 years",
    budget: 22000,
    priority: "Medium",
    requestedBy: "Sales Manager",
    requestedDate: "2026-10-05",
    targetDate: "2026-11-20",
    status: "Pending Approval",
    reason: "Business expansion",
    description: "Coordinate sales orders, customer follow-ups and reports.",
  },
  {
    id: 4,
    code: "REQ-2026-004",
    title: "IT Support Engineer",
    department: "IT",
    designation: "IT Support Engineer",
    location: "Head Office",
    openings: 1,
    employmentType: "Full-time",
    experience: "2–5 years",
    budget: 35000,
    priority: "Low",
    requestedBy: "IT Manager",
    requestedDate: "2026-09-25",
    targetDate: "2026-12-01",
    status: "On Hold",
    reason: "New position",
    description: "Provide user support, troubleshoot systems and maintain devices.",
  },
  {
    id: 5,
    code: "REQ-2026-005",
    title: "Operations Supervisor",
    department: "Operations",
    designation: "Operations Supervisor",
    location: "Factory",
    openings: 2,
    employmentType: "Full-time",
    experience: "3–6 years",
    budget: 40000,
    priority: "High",
    requestedBy: "Operations Manager",
    requestedDate: "2026-09-18",
    targetDate: "2026-10-30",
    status: "Approved",
    reason: "Business expansion",
    description: "Supervise daily operations, team allocation and output.",
  },
];

const emptyForm = {
  code: "",
  title: "",
  department: "",
  designation: "",
  location: "",
  openings: "1",
  employmentType: "Full-time",
  experience: "",
  budget: "",
  priority: "Medium",
  requestedBy: "",
  requestedDate: new Date().toISOString().slice(0, 10),
  targetDate: "",
  status: "Draft",
  reason: "Replacement",
  description: "",
};

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

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

const escapeCSV = (value) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

export default function JobRequisitionManagement() {
  const [requisitions, setRequisitions] = useState(initialRequisitions);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  const departments = useMemo(
    () =>
      [...new Set(requisitions.map((item) => item.department).filter(Boolean))]
        .sort(),
    [requisitions]
  );

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return requisitions.filter((item) => {
      const matchesSearch =
        !query ||
        [
          item.code,
          item.title,
          item.department,
          item.designation,
          item.location,
          item.requestedBy,
        ].some((value) =>
          String(value || "").toLowerCase().includes(query)
        );

      return (
        matchesSearch &&
        (statusFilter === "All" || item.status === statusFilter) &&
        (departmentFilter === "All" ||
          item.department === departmentFilter) &&
        (priorityFilter === "All" || item.priority === priorityFilter)
      );
    });
  }, [requisitions, search, statusFilter, departmentFilter, priorityFilter]);

  const metrics = useMemo(() => {
    const openRecords = requisitions.filter((item) =>
      ["Approved", "Open"].includes(item.status)
    );

    const openPositions = openRecords.reduce(
      (sum, item) => sum + Number(item.openings || 0),
      0
    );

    const pending = requisitions.filter(
      (item) => item.status === "Pending Approval"
    ).length;

    const filled = requisitions.filter(
      (item) => item.status === "Filled"
    ).length;

    const approvedBudget = requisitions
      .filter((item) => ["Approved", "Open", "Filled"].includes(item.status))
      .reduce(
        (sum, item) =>
          sum +
          Number(item.budget || 0) *
            Number(item.openings || 0),
        0
      );

    return {
      total: requisitions.length,
      openPositions,
      pending,
      filled,
      approvedBudget,
    };
  }, [requisitions]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const openCreateModal = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      requestedDate: new Date().toISOString().slice(0, 10),
    });
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (record) => {
    setEditingId(record.id);
    setForm({
      ...record,
      openings: String(record.openings ?? 1),
      budget: String(record.budget ?? ""),
    });
    setFormError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setFormError("");

    if (
      !form.title.trim() ||
      !form.department.trim() ||
      !form.designation.trim() ||
      !form.location.trim()
    ) {
      setFormError(
        "Please complete the job title, department, designation and location."
      );
      return;
    }

    const openings = Number(form.openings);
    const budget = Number(form.budget || 0);

    if (!Number.isInteger(openings) || openings < 1) {
      setFormError("Number of openings must be a whole number greater than zero.");
      return;
    }

    if (!Number.isFinite(budget) || budget < 0) {
      setFormError("Enter a valid, non-negative budget per position.");
      return;
    }

    if (!form.requestedDate) {
      setFormError("Please enter the requisition date.");
      return;
    }

    if (form.targetDate && form.targetDate < form.requestedDate) {
      setFormError("The target date cannot be earlier than the requisition date.");
      return;
    }

    const duplicateCode = requisitions.some(
      (item) =>
        item.code.trim().toLowerCase() === form.code.trim().toLowerCase() &&
        item.id !== editingId
    );

    if (form.code.trim() && duplicateCode) {
      setFormError("This requisition code already exists.");
      return;
    }

    const recordToSave = {
      ...form,
      code:
        form.code.trim() ||
        `REQ-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      title: form.title.trim(),
      department: form.department.trim(),
      designation: form.designation.trim(),
      location: form.location.trim(),
      requestedBy: form.requestedBy.trim(),
      experience: form.experience.trim(),
      description: form.description.trim(),
      openings,
      budget,
    };

    if (editingId !== null) {
      setRequisitions((previous) =>
        previous.map((item) =>
          item.id === editingId ? { ...item, ...recordToSave } : item
        )
      );
    } else {
      setRequisitions((previous) => [
        { ...recordToSave, id: Date.now() },
        ...previous,
      ]);
    }

    closeModal();
  };

  const deleteRecord = (record) => {
    if (
      !window.confirm(
        `Delete requisition ${record.code}? This removes it from this prototype's current list.`
      )
    ) {
      return;
    }

    setRequisitions((previous) =>
      previous.filter((item) => item.id !== record.id)
    );
  };

  const exportCSV = () => {
    const headers = [
      "Requisition Code",
      "Job Title",
      "Department",
      "Designation",
      "Location",
      "Openings",
      "Employment Type",
      "Experience",
      "Budget Per Position",
      "Total Budget",
      "Priority",
      "Requested By",
      "Requested Date",
      "Target Date",
      "Status",
      "Reason",
      "Description",
    ];

    const rows = filteredRecords.map((item) => [
      item.code,
      item.title,
      item.department,
      item.designation,
      item.location,
      item.openings,
      item.employmentType,
      item.experience,
      item.budget,
      Number(item.budget || 0) * Number(item.openings || 0),
      item.priority,
      item.requestedBy,
      item.requestedDate,
      item.targetDate,
      item.status,
      item.reason,
      item.description,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "job-requisition-report.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
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
    <div className="job-requisition-page">
      <header className="jrm-header">
        <div>
          <div className="jrm-eyebrow">HR / RECRUITMENT</div>
          <h1>Job Requisition &amp; Vacancy Management</h1>
          <p>
            Request headcount, manage vacancy approvals and track hiring needs.
          </p>
        </div>

        <div className="jrm-header-actions">
          <button
            type="button"
            className="jrm-btn jrm-btn-secondary"
            onClick={resetFilters}
          >
            <FiFilter /> Reset Filters
          </button>
          <button
            type="button"
            className="jrm-btn jrm-btn-secondary"
            onClick={exportCSV}
          >
            <FiDownload /> Export CSV
          </button>
          <button
            type="button"
            className="jrm-btn jrm-btn-primary"
            onClick={openCreateModal}
          >
            <FiPlus /> New Requisition
          </button>
        </div>
      </header>

      <div className="jrm-demo-notice">
        <FiAlertCircle />
        <span>
          Prototype mode: changes are held in page state and are not saved to
          the database.
        </span>
      </div>

      <section className="jrm-stats-grid">
        <article className="jrm-stat-card">
          <div className="jrm-stat-top">
            <span>Total Requisitions</span>
            <div className="jrm-icon jrm-blue"><FiBriefcase /></div>
          </div>
          <strong>{metrics.total}</strong>
          <small>All recorded requests</small>
        </article>

        <article className="jrm-stat-card">
          <div className="jrm-stat-top">
            <span>Open Positions</span>
            <div className="jrm-icon jrm-purple"><FiUsers /></div>
          </div>
          <strong>{metrics.openPositions}</strong>
          <small>Openings under approved/open requisitions</small>
        </article>

        <article className="jrm-stat-card">
          <div className="jrm-stat-top">
            <span>Pending Approval</span>
            <div className="jrm-icon jrm-orange"><FiClock /></div>
          </div>
          <strong>{metrics.pending}</strong>
          <small>Requests awaiting a decision</small>
        </article>

        <article className="jrm-stat-card">
          <div className="jrm-stat-top">
            <span>Filled Requisitions</span>
            <div className="jrm-icon jrm-green"><FiCheckCircle /></div>
          </div>
          <strong>{metrics.filled}</strong>
          <small>Requisitions marked as filled</small>
        </article>

        <article className="jrm-stat-card">
          <div className="jrm-stat-top">
            <span>Approved Budget</span>
            <div className="jrm-icon jrm-teal"><FiDollarSign /></div>
          </div>
          <strong>{money(metrics.approvedBudget)}</strong>
          <small>Indicative budget across approved, open and filled requests</small>
        </article>
      </section>

      <section className="jrm-panel">
        <div className="jrm-panel-heading">
          <div>
            <h2>Requisition Register</h2>
            <p>Search and filter all job requests.</p>
          </div>
          <span className="jrm-record-count">
            {filteredRecords.length} of {requisitions.length} records
          </span>
        </div>

        <div className="jrm-toolbar">
          <div className="jrm-search">
            <FiSearch />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search code, title, department or location..."
              aria-label="Search requisitions"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter by status"
          >
            <option value="All">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Approved">Approved</option>
            <option value="Open">Open</option>
            <option value="On Hold">On Hold</option>
            <option value="Filled">Filled</option>
            <option value="Rejected">Rejected</option>
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

        <div className="jrm-table-wrap">
          <table className="jrm-table">
            <thead>
              <tr>
                <th>Requisition / Role</th>
                <th>Department</th>
                <th>Openings</th>
                <th>Budget / Position</th>
                <th>Requested Date</th>
                <th>Target Date</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.title}</strong>
                    <span className="jrm-subtext">{item.code}</span>
                    <span className="jrm-location">{item.location}</span>
                  </td>
                  <td>
                    <strong className="jrm-cell-normal">{item.department}</strong>
                    <span className="jrm-subtext">{item.designation}</span>
                  </td>
                  <td>{item.openings}</td>
                  <td className="jrm-money">{money(item.budget)}</td>
                  <td>{formatDate(item.requestedDate)}</td>
                  <td>{formatDate(item.targetDate)}</td>
                  <td>
                    <span className={`jrm-pill jrm-priority-${statusClass(item.priority)}`}>
                      {item.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`jrm-pill jrm-status-${statusClass(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <div className="jrm-row-actions">
                      <button
                        type="button"
                        className="jrm-action-btn"
                        title="Edit requisition"
                        aria-label={`Edit ${item.code}`}
                        onClick={() => openEditModal(item)}
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        type="button"
                        className="jrm-action-btn jrm-delete-btn"
                        title="Delete requisition"
                        aria-label={`Delete ${item.code}`}
                        onClick={() => deleteRecord(item)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan="9" className="jrm-empty">
                    No requisitions match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showModal && (
        <div
          className="jrm-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            className="jrm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="jrm-modal-title"
          >
            <header className="jrm-modal-header">
              <div>
                <h2 id="jrm-modal-title">
                  {editingId !== null
                    ? "Edit Job Requisition"
                    : "Create Job Requisition"}
                </h2>
                <p>Enter the vacancy and headcount requirements.</p>
              </div>
              <button
                type="button"
                className="jrm-close-btn"
                onClick={closeModal}
                aria-label="Close form"
              >
                <FiX />
              </button>
            </header>

            <form onSubmit={handleSubmit}>
              <div className="jrm-form-grid">
                <div className="jrm-form-group">
                  <label htmlFor="jrm-code">Requisition Code</label>
                  <input
                    id="jrm-code"
                    name="code"
                    value={form.code}
                    onChange={updateField}
                    placeholder="Auto-generated if blank"
                  />
                </div>

                <div className="jrm-form-group">
                  <label htmlFor="jrm-title">Job Title *</label>
                  <input
                    id="jrm-title"
                    name="title"
                    value={form.title}
                    onChange={updateField}
                    placeholder="e.g. Accounts Executive"
                    required
                  />
                </div>

                <div className="jrm-form-group">
                  <label htmlFor="jrm-department">Department *</label>
                  <input
                    id="jrm-department"
                    name="department"
                    value={form.department}
                    onChange={updateField}
                    placeholder="e.g. Finance"
                    required
                  />
                </div>

                <div className="jrm-form-group">
                  <label htmlFor="jrm-designation">Designation *</label>
                  <input
                    id="jrm-designation"
                    name="designation"
                    value={form.designation}
                    onChange={updateField}
                    placeholder="Enter designation"
                    required
                  />
                </div>

                <div className="jrm-form-group">
                  <label htmlFor="jrm-location">Location *</label>
                  <input
                    id="jrm-location"
                    name="location"
                    value={form.location}
                    onChange={updateField}
                    placeholder="e.g. Head Office"
                    required
                  />
                </div>

                <div className="jrm-form-group">
                  <label htmlFor="jrm-openings">Number of Openings *</label>
                  <input
                    id="jrm-openings"
                    name="openings"
                    type="number"
                    min="1"
                    step="1"
                    value={form.openings}
                    onChange={updateField}
                    required
                  />
                </div>

                <div className="jrm-form-group">
                  <label htmlFor="jrm-employment-type">Employment Type</label>
                  <select
                    id="jrm-employment-type"
                    name="employmentType"
                    value={form.employmentType}
                    onChange={updateField}
                  >
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Temporary</option>
                    <option>Internship</option>
                  </select>
                </div>

                <div className="jrm-form-group">
                  <label htmlFor="jrm-experience">Required Experience</label>
                  <input
                    id="jrm-experience"
                    name="experience"
                    value={form.experience}
                    onChange={updateField}
                    placeholder="e.g. 2–4 years"
                  />
                </div>

                <div className="jrm-form-group">
                  <label htmlFor="jrm-budget">Budget per Position (₹)</label>
                  <input
                    id="jrm-budget"
                    name="budget"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.budget}
                    onChange={updateField}
                    placeholder="Monthly salary budget"
                  />
                </div>

                <div className="jrm-form-group">
                  <label htmlFor="jrm-priority">Priority</label>
                  <select
                    id="jrm-priority"
                    name="priority"
                    value={form.priority}
                    onChange={updateField}
                  >
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>

                <div className="jrm-form-group">
                  <label htmlFor="jrm-requested-by">Requested By</label>
                  <input
                    id="jrm-requested-by"
                    name="requestedBy"
                    value={form.requestedBy}
                    onChange={updateField}
                    placeholder="Requesting manager"
                  />
                </div>

                <div className="jrm-form-group">
                  <label htmlFor="jrm-reason">Hiring Reason</label>
                  <select
                    id="jrm-reason"
                    name="reason"
                    value={form.reason}
                    onChange={updateField}
                  >
                    <option>Replacement</option>
                    <option>Business expansion</option>
                    <option>New position</option>
                    <option>Temporary requirement</option>
                    <option>Other</option>
                  </select>
                </div>

                <div className="jrm-form-group">
                  <label htmlFor="jrm-requested-date">Requisition Date *</label>
                  <input
                    id="jrm-requested-date"
                    type="date"
                    name="requestedDate"
                    value={form.requestedDate}
                    onChange={updateField}
                    required
                  />
                </div>

                <div className="jrm-form-group">
                  <label htmlFor="jrm-target-date">Target Hiring Date</label>
                  <input
                    id="jrm-target-date"
                    type="date"
                    name="targetDate"
                    value={form.targetDate}
                    onChange={updateField}
                    min={form.requestedDate || undefined}
                  />
                </div>

                <div className="jrm-form-group">
                  <label htmlFor="jrm-status">Requisition Status</label>
                  <select
                    id="jrm-status"
                    name="status"
                    value={form.status}
                    onChange={updateField}
                  >
                    <option>Draft</option>
                    <option>Pending Approval</option>
                    <option>Approved</option>
                    <option>Open</option>
                    <option>On Hold</option>
                    <option>Filled</option>
                    <option>Rejected</option>
                    <option>Cancelled</option>
                  </select>
                </div>

                <div className="jrm-form-group jrm-form-full">
                  <label htmlFor="jrm-description">Job Description / Justification</label>
                  <textarea
                    id="jrm-description"
                    name="description"
                    rows="4"
                    value={form.description}
                    onChange={updateField}
                    placeholder="Describe the role, responsibilities and business justification."
                  />
                </div>
              </div>

              {formError && (
                <div className="jrm-form-error">
                  <FiAlertCircle />
                  <span>{formError}</span>
                </div>
              )}

              <footer className="jrm-modal-footer">
                <button
                  type="button"
                  className="jrm-btn jrm-btn-secondary"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="jrm-btn jrm-btn-primary"
                >
                  {editingId !== null ? "Save Changes" : "Create Requisition"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
