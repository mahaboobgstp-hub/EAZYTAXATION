import React, { useMemo, useState } from "react";
import {
FiBookOpen,
FiPlus,
FiSearch,
FiDownload,
FiEdit2,
FiTrash2,
FiX,
FiFilter,
FiClock,
FiDollarSign,
FiUsers,
FiRefreshCw,
FiAlertCircle,
} from "react-icons/fi";
import "../../css/hr/TrainingProgramMaster.css";

const INITIAL_PROGRAMMES = [
{
id: 1,
code: "TRN-001",
title: "Workplace Safety",
category: "Safety & Compliance",
method: "Classroom",
duration: 4,
trainer: "Internal HR Team",
provider: "Internal",
department: "All Departments",
cost: 12000,
mandatory: true,
validity: 12,
status: "Active",
objectives: "Understand workplace hazards, emergency procedures and safety practices.",
},
{
id: 2,
code: "TRN-002",
title: "Advanced Excel",
category: "Technical Skills",
method: "Online",
duration: 12,
trainer: "External Trainer",
provider: "Excel Learning Academy",
department: "Finance",
cost: 18000,
mandatory: false,
validity: 0,
status: "Active",
objectives: "Develop skills in advanced formulas, pivot tables and reporting.",
},
{
id: 3,
code: "TRN-003",
title: "Leadership Essentials",
category: "Leadership",
method: "Workshop",
duration: 8,
trainer: "Leadership Coach",
provider: "PeopleFirst Learning",
department: "Management",
cost: 25000,
mandatory: false,
validity: 24,
status: "Active",
objectives: "Improve delegation, communication, decision-making and team leadership.",
},
{
id: 4,
code: "TRN-004",
title: "Cybersecurity Awareness",
category: "Safety & Compliance",
method: "Online",
duration: 2,
trainer: "IT Team",
provider: "Internal",
department: "All Departments",
cost: 5000,
mandatory: true,
validity: 12,
status: "Active",
objectives: "Recognise phishing, protect company data and follow security policies.",
},
{
id: 5,
code: "TRN-005",
title: "Communication Skills",
category: "Soft Skills",
method: "Classroom",
duration: 6,
trainer: "External Trainer",
provider: "SkillBridge",
department: "All Departments",
cost: 15000,
mandatory: false,
validity: 0,
status: "Draft",
objectives: "Strengthen workplace communication, listening and presentation skills.",
},
{
id: 6,
code: "TRN-006",
title: "Quality Control Basics",
category: "Technical Skills",
method: "On-the-job",
duration: 6,
trainer: "Quality Manager",
provider: "Internal",
department: "Production",
cost: 8000,
mandatory: true,
validity: 12,
status: "Inactive",
objectives: "Understand inspection procedures, quality standards and defect reporting.",
},
];

const EMPTY_FORM = {
code: "",
title: "",
category: "Technical Skills",
method: "Classroom",
duration: "",
trainer: "",
provider: "",
department: "All Departments",
cost: "",
mandatory: false,
validity: "0",
status: "Draft",
objectives: "",
};

const CATEGORIES = [
"Technical Skills",
"Safety & Compliance",
"Leadership",
"Soft Skills",
"Professional Development",
"Product Training",
"Other",
];

const METHODS = ["Classroom", "Online", "Workshop", "On-the-job", "Blended"];

const DEPARTMENTS = [
"All Departments",
"HR",
"Finance",
"IT",
"Production",
"Sales",
"Operations",
"Management",
];

const STATUSES = ["Draft", "Active", "Inactive", "Archived"];

const currency = (value) =>
new Intl.NumberFormat("en-IN", {
style: "currency",
currency: "INR",
maximumFractionDigits: 0,
}).format(Number(value) || 0);

const escapeCsv = (value) =>
""${String(value ?? "").replace(/"/g, '""')}"";

export default function TrainingProgramMaster() {
const [programmes, setProgrammes] = useState(INITIAL_PROGRAMMES);
const [search, setSearch] = useState("");
const [categoryFilter, setCategoryFilter] = useState("All");
const [statusFilter, setStatusFilter] = useState("All");
const [methodFilter, setMethodFilter] = useState("All");
const [modalOpen, setModalOpen] = useState(false);
const [editingId, setEditingId] = useState(null);
const [form, setForm] = useState(EMPTY_FORM);
const [error, setError] = useState("");

const filteredProgrammes = useMemo(() => {
const term = search.trim().toLowerCase();

return programmes.filter((item) => {
  const matchesSearch =
    !term ||
    [
      item.code,
      item.title,
      item.category,
      item.trainer,
      item.provider,
      item.department,
    ].some((value) => String(value || "").toLowerCase().includes(term));

  return (
    matchesSearch &&
    (categoryFilter === "All" || item.category === categoryFilter) &&
    (statusFilter === "All" || item.status === statusFilter) &&
    (methodFilter === "All" || item.method === methodFilter)
  );
});

}, [programmes, search, categoryFilter, statusFilter, methodFilter]);

const metrics = useMemo(() => {
const active = programmes.filter((item) => item.status === "Active");
const mandatory = programmes.filter(
(item) => item.mandatory && item.status !== "Archived"
);

return {
  total: programmes.length,
  active: active.length,
  mandatory: mandatory.length,
  budget: programmes.reduce(
    (total, item) => total + (Number(item.cost) || 0),
    0
  ),
};

}, [programmes]);

const updateField = (field, value) => {
setForm((current) => ({ ...current, [field]: value }));
setError("");
};

const openCreate = () => {
setEditingId(null);
setForm({
...EMPTY_FORM,
code: "TRN-${String( Math.max(0, ...programmes.map((item) => item.id)) + 1 ).padStart(3, "0")}",
});
setError("");
setModalOpen(true);
};

const openEdit = (programme) => {
setEditingId(programme.id);
setForm({
...EMPTY_FORM,
...programme,
duration: String(programme.duration ?? ""),
cost: String(programme.cost ?? ""),
validity: String(programme.validity ?? 0),
});
setError("");
setModalOpen(true);
};

const saveProgramme = (event) => {
event.preventDefault();

if (!form.code.trim() || !form.title.trim()) {
  setError("Programme code and programme title are required.");
  return;
}

if (
  programmes.some(
    (item) =>
      item.code.trim().toLowerCase() === form.code.trim().toLowerCase() &&
      item.id !== editingId
  )
) {
  setError("This programme code already exists. Enter a unique code.");
  return;
}

if (!form.duration || Number(form.duration) <= 0) {
  setError("Enter a training duration greater than zero hours.");
  return;
}

if (form.cost === "" || Number(form.cost) < 0) {
  setError("Enter a valid non-negative programme budget.");
  return;
}

const record = {
  ...form,
  id: editingId ?? Date.now(),
  code: form.code.trim(),
  title: form.title.trim(),
  trainer: form.trainer.trim(),
  provider: form.provider.trim(),
  objectives: form.objectives.trim(),
  duration: Number(form.duration),
  cost: Number(form.cost),
  validity: Number(form.validity) || 0,
  mandatory: Boolean(form.mandatory),
};

if (editingId !== null) {
  setProgrammes((current) =>
    current.map((item) => (item.id === editingId ? record : item))
  );
} else {
  setProgrammes((current) => [record, ...current]);
}

setModalOpen(false);
setEditingId(null);
setForm(EMPTY_FORM);
setError("");

};

const deleteProgramme = (programme) => {
const confirmed = window.confirm(
"Delete "${programme.title}" from the programme master?"
);

if (confirmed) {
  setProgrammes((current) =>
    current.filter((item) => item.id !== programme.id)
  );
}

};

const exportCsv = () => {
const headers = [
"Programme Code",
"Programme Title",
"Category",
"Delivery Method",
"Duration (Hours)",
"Trainer",
"Provider",
"Department",
"Budget (INR)",
"Mandatory",
"Validity (Months)",
"Status",
"Learning Objectives",
];

const rows = filteredProgrammes.map((item) => [
  item.code,
  item.title,
  item.category,
  item.method,
  item.duration,
  item.trainer,
  item.provider,
  item.department,
  item.cost,
  item.mandatory ? "Yes" : "No",
  item.validity,
  item.status,
  item.objectives,
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
link.download = "training-programme-master.csv";
document.body.appendChild(link);
link.click();
link.remove();
URL.revokeObjectURL(url);

};

const resetFilters = () => {
setSearch("");
setCategoryFilter("All");
setStatusFilter("All");
setMethodFilter("All");
};

return (
<div className="tpm-page">
<div className="tpm-page-header">
<div className="tpm-heading">
<div className="tpm-heading-icon">
<FiBookOpen />
</div>
<div>
<h1>Training Programme Master</h1>
<p>
Create and maintain the courses, learning programmes and training
requirements available to your workforce.
</p>
</div>
</div>

    <div className="tpm-header-actions">
      <button className="tpm-btn tpm-btn-secondary" onClick={exportCsv}>
        <FiDownload /> Export CSV
      </button>
      <button className="tpm-btn tpm-btn-primary" onClick={openCreate}>
        <FiPlus /> Add Programme
      </button>
    </div>
  </div>

  <div className="tpm-metrics">
    <div className="tpm-metric-card">
      <div className="tpm-metric-icon tpm-icon-blue">
        <FiBookOpen />
      </div>
      <div>
        <span>Total Programmes</span>
        <strong>{metrics.total}</strong>
        <small>Courses in the master</small>
      </div>
    </div>

    <div className="tpm-metric-card">
      <div className="tpm-metric-icon tpm-icon-green">
        <FiRefreshCw />
      </div>
      <div>
        <span>Active Programmes</span>
        <strong>{metrics.active}</strong>
        <small>Available for assignment</small>
      </div>
    </div>

    <div className="tpm-metric-card">
      <div className="tpm-metric-icon tpm-icon-orange">
        <FiAlertCircle />
      </div>
      <div>
        <span>Mandatory Programmes</span>
        <strong>{metrics.mandatory}</strong>
        <small>Not marked as archived</small>
      </div>
    </div>

    <div className="tpm-metric-card">
      <div className="tpm-metric-icon tpm-icon-purple">
        <FiDollarSign />
      </div>
      <div>
        <span>Combined Budget</span>
        <strong>{currency(metrics.budget)}</strong>
        <small>Illustrative programme budgets</small>
      </div>
    </div>
  </div>

  <div className="tpm-info-banner">
    <FiAlertCircle />
    <p>
      <strong>Prototype mode:</strong> Data is currently held in page state
      and is not saved to Supabase. Budget amounts are illustrative and are
      not an approved or committed HR budget.
    </p>
  </div>

  <section className="tpm-panel">
    <div className="tpm-panel-header">
      <div>
        <h2>Programme Register</h2>
        <p>Search, filter and maintain your training catalogue.</p>
      </div>
      <span className="tpm-record-count">
        {filteredProgrammes.length} of {programmes.length} programmes
      </span>
    </div>

    <div className="tpm-filters">
      <div className="tpm-search-box">
        <FiSearch />
        <input
          type="search"
          placeholder="Search code, title, trainer or provider..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <label className="tpm-filter-control">
        <span>Category</span>
        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
        >
          <option value="All">All categories</option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>

      <label className="tpm-filter-control">
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

      <label className="tpm-filter-control">
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

      <button
        className="tpm-btn tpm-btn-reset"
        onClick={resetFilters}
        title="Clear filters"
      >
        <FiFilter /> Reset
      </button>
    </div>

    <div className="tpm-table-wrap">
      <table className="tpm-table">
        <thead>
          <tr>
            <th>Programme</th>
            <th>Category / Method</th>
            <th>Duration</th>
            <th>Audience</th>
            <th>Trainer / Provider</th>
            <th>Budget</th>
            <th>Mandatory</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredProgrammes.map((item) => (
            <tr key={item.id}>
              <td>
                <div className="tpm-programme-cell">
                  <span className="tpm-programme-code">{item.code}</span>
                  <strong>{item.title}</strong>
                  <small>
                    {item.validity > 0
                      ? `Renew every ${item.validity} months`
                      : "No renewal interval"}
                  </small>
                </div>
              </td>
              <td>
                <span className="tpm-category">{item.category}</span>
                <small className="tpm-secondary-text">{item.method}</small>
              </td>
              <td>
                <span className="tpm-inline-value">
                  <FiClock /> {item.duration} hrs
                </span>
              </td>
              <td>
                <span className="tpm-inline-value">
                  <FiUsers /> {item.department}
                </span>
              </td>
              <td>
                <div className="tpm-trainer-cell">
                  <strong>{item.trainer || "Not assigned"}</strong>
                  <small>{item.provider || "Provider not specified"}</small>
                </div>
              </td>
              <td className="tpm-budget-cell">{currency(item.cost)}</td>
              <td>
                <span
                  className={`tpm-mandatory ${
                    item.mandatory ? "is-mandatory" : "is-optional"
                  }`}
                >
                  {item.mandatory ? "Mandatory" : "Optional"}
                </span>
              </td>
              <td>
                <span
                  className={`tpm-status tpm-status-${item.status
                    .toLowerCase()
                    .replace(/\s+/g, "-")}`}
                >
                  {item.status}
                </span>
              </td>
              <td>
                <div className="tpm-row-actions">
                  <button
                    className="tpm-icon-btn"
                    onClick={() => openEdit(item)}
                    title={`Edit ${item.title}`}
                    aria-label={`Edit ${item.title}`}
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    className="tpm-icon-btn tpm-delete-btn"
                    onClick={() => deleteProgramme(item)}
                    title={`Delete ${item.title}`}
                    aria-label={`Delete ${item.title}`}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </td>
            </tr>
          ))}

          {filteredProgrammes.length === 0 && (
            <tr>
              <td colSpan="9" className="tpm-empty-state">
                <FiBookOpen />
                <strong>No programmes found</strong>
                <span>Try changing your search or filters.</span>
                <button
                  className="tpm-btn tpm-btn-secondary"
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

    <div className="tpm-table-footer">
      <span>
        Showing {filteredProgrammes.length} programme
        {filteredProgrammes.length === 1 ? "" : "s"}
      </span>
      <span>Amounts shown in INR</span>
    </div>
  </section>

  {modalOpen && (
    <div
      className="tpm-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          setModalOpen(false);
          setError("");
        }
      }}
    >
      <div
        className="tpm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tpm-modal-title"
      >
        <div className="tpm-modal-header">
          <div>
            <h2 id="tpm-modal-title">
              {editingId !== null ? "Edit Programme" : "Add Training Programme"}
            </h2>
            <p>
              Enter the course details used by training assignment and
              scheduling modules.
            </p>
          </div>
          <button
            className="tpm-icon-btn"
            onClick={() => {
              setModalOpen(false);
              setError("");
            }}
            aria-label="Close form"
          >
            <FiX />
          </button>
        </div>

        <form onSubmit={saveProgramme}>
          <div className="tpm-form-grid">
            <label className="tpm-form-field">
              <span>Programme Code *</span>
              <input
                value={form.code}
                onChange={(event) => updateField("code", event.target.value)}
                placeholder="e.g. TRN-007"
                required
              />
            </label>

            <label className="tpm-form-field">
              <span>Programme Title *</span>
              <input
                value={form.title}
                onChange={(event) => updateField("title", event.target.value)}
                placeholder="Enter course title"
                required
              />
            </label>

            <label className="tpm-form-field">
              <span>Category *</span>
              <select
                value={form.category}
                onChange={(event) =>
                  updateField("category", event.target.value)
                }
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className="tpm-form-field">
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

            <label className="tpm-form-field">
              <span>Duration (Hours) *</span>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={form.duration}
                onChange={(event) =>
                  updateField("duration", event.target.value)
                }
                placeholder="e.g. 4"
                required
              />
            </label>

            <label className="tpm-form-field">
              <span>Programme Budget (₹) *</span>
              <input
                type="number"
                min="0"
                step="1"
                value={form.cost}
                onChange={(event) => updateField("cost", event.target.value)}
                placeholder="e.g. 10000"
                required
              />
            </label>

            <label className="tpm-form-field">
              <span>Trainer / Instructor</span>
              <input
                value={form.trainer}
                onChange={(event) => updateField("trainer", event.target.value)}
                placeholder="Enter trainer name or team"
              />
            </label>

            <label className="tpm-form-field">
              <span>Training Provider</span>
              <input
                value={form.provider}
                onChange={(event) =>
                  updateField("provider", event.target.value)
                }
                placeholder="Internal or external provider"
              />
            </label>

            <label className="tpm-form-field">
              <span>Target Department *</span>
              <select
                value={form.department}
                onChange={(event) =>
                  updateField("department", event.target.value)
                }
              >
                {DEPARTMENTS.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </label>

            <label className="tpm-form-field">
              <span>Renewal Interval</span>
              <select
                value={form.validity}
                onChange={(event) =>
                  updateField("validity", event.target.value)
                }
              >
                <option value="0">No scheduled renewal</option>
                <option value="3">Every 3 months</option>
                <option value="6">Every 6 months</option>
                <option value="12">Every 12 months</option>
                <option value="24">Every 24 months</option>
                <option value="36">Every 36 months</option>
              </select>
            </label>

            <label className="tpm-form-field">
              <span>Programme Status *</span>
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

            <label className="tpm-form-field tpm-checkbox-field">
              <input
                type="checkbox"
                checked={form.mandatory}
                onChange={(event) =>
                  updateField("mandatory", event.target.checked)
                }
              />
              <span>
                <strong>Mandatory training</strong>
                <small>
                  Mark this programme as required for its target audience.
                </small>
              </span>
            </label>

            <label className="tpm-form-field tpm-full-width">
              <span>Learning Objectives / Description</span>
              <textarea
                rows="4"
                value={form.objectives}
                onChange={(event) =>
                  updateField("objectives", event.target.value)
                }
                placeholder="Describe the learning outcomes and key topics..."
              />
            </label>
          </div>

          {error && (
            <div className="tpm-form-error">
              <FiAlertCircle /> {error}
            </div>
          )}

          <div className="tpm-modal-footer">
            <button
              type="button"
              className="tpm-btn tpm-btn-secondary"
              onClick={() => {
                setModalOpen(false);
                setError("");
              }}
            >
              Cancel
            </button>
            <button type="submit" className="tpm-btn tpm-btn-primary">
              {editingId !== null ? "Save Changes" : "Create Programme"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )}
</div>

);
}
