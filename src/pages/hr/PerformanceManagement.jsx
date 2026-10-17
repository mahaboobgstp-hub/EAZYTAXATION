
import { useMemo, useState } from "react";
import {
  FiActivity,
  FiAward,
  FiBarChart2,
  FiCalendar,
  FiCheckCircle,
  FiChevronDown,
  FiClipboard,
  FiEdit2,
  FiEye,
  FiFilter,
  FiPlus,
  FiSearch,
  FiTarget,
  FiTrash2,
  FiUsers,
  FiX,
} from "react-icons/fi";
import "../../css/hr/PerformanceManagement.css";

const initialAppraisals = [
  {
    id: 1,
    employee: "Arun Kumar",
    employeeCode: "EMP001",
    department: "Accounts",
    designation: "Accountant",
    cycle: "Annual Review 2026",
    period: "Apr 2025 – Mar 2026",
    manager: "Finance Manager",
    goals: 5,
    completedGoals: 4,
    selfRating: 4,
    managerRating: 4,
    score: 4,
    status: "Manager Review",
    comments: "Consistent performance and timely completion of assignments.",
    strengths: "Accuracy, teamwork and ownership",
    improvements: "Improve reporting turnaround time",
  },
  {
    id: 2,
    employee: "Priya Sharma",
    employeeCode: "EMP002",
    department: "Human Resources",
    designation: "HR Executive",
    cycle: "Annual Review 2026",
    period: "Apr 2025 – Mar 2026",
    manager: "HR Manager",
    goals: 4,
    completedGoals: 4,
    selfRating: 5,
    managerRating: 4,
    score: 4,
    status: "Completed",
    comments: "Successfully coordinated employee onboarding.",
    strengths: "Communication and coordination",
    improvements: "Develop HR analytics skills",
  },
  {
    id: 3,
    employee: "Ravi Prasad",
    employeeCode: "EMP003",
    department: "Operations",
    designation: "Operations Executive",
    cycle: "Annual Review 2026",
    period: "Apr 2025 – Mar 2026",
    manager: "Operations Manager",
    goals: 5,
    completedGoals: 2,
    selfRating: 3,
    managerRating: 0,
    score: 0,
    status: "Self Assessment",
    comments: "",
    strengths: "",
    improvements: "",
  },
  {
    id: 4,
    employee: "Meena Reddy",
    employeeCode: "EMP004",
    department: "Sales",
    designation: "Sales Executive",
    cycle: "Mid-Year Review 2026",
    period: "Apr 2026 – Sep 2026",
    manager: "Sales Manager",
    goals: 4,
    completedGoals: 3,
    selfRating: 4,
    managerRating: 0,
    score: 0,
    status: "Pending",
    comments: "",
    strengths: "",
    improvements: "",
  },
  {
    id: 5,
    employee: "Suresh Babu",
    employeeCode: "EMP005",
    department: "Accounts",
    designation: "Senior Accountant",
    cycle: "Annual Review 2026",
    period: "Apr 2025 – Mar 2026",
    manager: "Finance Manager",
    goals: 6,
    completedGoals: 5,
    selfRating: 4,
    managerRating: 0,
    score: 0,
    status: "Self Assessment",
    comments: "",
    strengths: "",
    improvements: "",
  },
];

const initialCycles = [
  {
    name: "Annual Review 2026",
    period: "Apr 2025 – Mar 2026",
    dueDate: "2026-11-30",
    status: "In Progress",
  },
  {
    name: "Mid-Year Review 2026",
    period: "Apr 2026 – Sep 2026",
    dueDate: "2026-11-15",
    status: "In Progress",
  },
];

const emptyForm = {
  employee: "",
  employeeCode: "",
  department: "",
  designation: "",
  cycle: "Annual Review 2026",
  period: "Apr 2025 – Mar 2026",
  manager: "",
  goals: 4,
  completedGoals: 0,
  selfRating: 0,
  managerRating: 0,
  score: 0,
  status: "Pending",
  comments: "",
  strengths: "",
  improvements: "",
};

const statusClass = (status) =>
  status.toLowerCase().replace(/\s+/g, "-");

function Rating({ value }) {
  if (!value) return <span className="pm-muted">Not rated</span>;

  return (
    <span className="pm-rating">
      <FiAward />
      {Number(value).toFixed(1)} / 5
    </span>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`pm-status pm-status-${statusClass(status)}`}>
      {status}
    </span>
  );
}

export default function PerformanceManagement() {
  const [appraisals, setAppraisals] = useState(initialAppraisals);
  const [cycles, setCycles] = useState(initialCycles);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All Departments");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [cycleFilter, setCycleFilter] = useState("All Cycles");
  const [activeTab, setActiveTab] = useState("appraisals");
  const [modal, setModal] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [cycleForm, setCycleForm] = useState({
    name: "",
    period: "",
    dueDate: "",
  });
  const [selectedId, setSelectedId] = useState(null);

  const departments = useMemo(
    () => [
      ...new Set(appraisals.map((item) => item.department).filter(Boolean)),
    ],
    [appraisals]
  );

  const filteredAppraisals = useMemo(() => {
    const query = search.trim().toLowerCase();

    return appraisals.filter((item) => {
      const matchesSearch =
        !query ||
        item.employee.toLowerCase().includes(query) ||
        item.employeeCode.toLowerCase().includes(query) ||
        item.designation.toLowerCase().includes(query) ||
        item.manager.toLowerCase().includes(query);

      return (
        matchesSearch &&
        (departmentFilter === "All Departments" ||
          item.department === departmentFilter) &&
        (statusFilter === "All Statuses" ||
          item.status === statusFilter) &&
        (cycleFilter === "All Cycles" || item.cycle === cycleFilter)
      );
    });
  }, [appraisals, search, departmentFilter, statusFilter, cycleFilter]);

  const completedCount = appraisals.filter(
    (item) => item.status === "Completed"
  ).length;

  const pendingCount = appraisals.filter(
    (item) => item.status === "Pending"
  ).length;

  const reviewCount = appraisals.filter((item) =>
    ["Self Assessment", "Manager Review", "Final Review"].includes(item.status)
  ).length;

  const ratedAppraisals = appraisals.filter(
    (item) => Number(item.score) > 0
  );

  const averageScore = ratedAppraisals.length
    ? (
        ratedAppraisals.reduce((total, item) => total + Number(item.score), 0) /
        ratedAppraisals.length
      ).toFixed(1)
    : "—";

  function updateForm(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  function openNewAppraisal() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      cycle: cycles[0]?.name || "",
      period: cycles[0]?.period || "",
    });
    setModal("appraisal");
  }

  function openEditAppraisal(item) {
    setEditingId(item.id);
    setForm({ ...item });
    setModal("appraisal");
  }

  function saveAppraisal(event) {
    event.preventDefault();

    const employee = form.employee.trim();
    if (!employee || !form.employeeCode.trim()) return;

    const managerRating = Number(form.managerRating);
    const selfRating = Number(form.selfRating);
    const score =
      managerRating > 0 ? managerRating : Number(form.score) || 0;

    const record = {
      ...form,
      employee,
      employeeCode: form.employeeCode.trim(),
      goals: Math.max(0, Number(form.goals) || 0),
      completedGoals: Math.max(0, Number(form.completedGoals) || 0),
      selfRating,
      managerRating,
      score,
    };

    if (editingId !== null) {
      setAppraisals((previous) =>
        previous.map((item) =>
          item.id === editingId ? { ...item, ...record } : item
        )
      );
    } else {
      setAppraisals((previous) => [
        { ...record, id: Date.now() },
        ...previous,
      ]);
    }

    setModal("");
  }

  function updateStatus(id, status) {
    setAppraisals((previous) =>
      previous.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
              score:
                status === "Completed"
                  ? Number(item.managerRating) || Number(item.score) || 0
                  : item.score,
            }
          : item
      )
    );
  }

  function deleteAppraisal(id) {
    if (!window.confirm("Delete this appraisal record?")) return;

    setAppraisals((previous) => previous.filter((item) => item.id !== id));

    if (selectedId === id) setSelectedId(null);
  }

  function openCycleForm() {
    setCycleForm({ name: "", period: "", dueDate: "" });
    setModal("cycle");
  }

  function saveCycle(event) {
    event.preventDefault();

    const name = cycleForm.name.trim();
    if (!name || !cycleForm.period.trim() || !cycleForm.dueDate) return;

    if (cycles.some((cycle) => cycle.name.toLowerCase() === name.toLowerCase())) {
      window.alert("A cycle with this name already exists.");
      return;
    }

    const newCycle = {
      ...cycleForm,
      name,
      period: cycleForm.period.trim(),
      status: "Planned",
    };

    setCycles((previous) => [...previous, newCycle]);
    setForm((previous) => ({
      ...previous,
      cycle: newCycle.name,
      period: newCycle.period,
    }));
    setCycleFilter("All Cycles");
    setActiveTab("cycles");
    setModal("");
  }

  const selectedAppraisal = appraisals.find(
    (item) => item.id === selectedId
  );

  return (
    <div className="pm-page">
      <div className="pm-page-header">
        <div>
          <div className="pm-eyebrow">HUMAN RESOURCES</div>
          <h1>Performance Management</h1>
          <p>
            Set goals, review employee performance and manage appraisal cycles.
          </p>
        </div>

        <div className="pm-header-actions">
          <button className="pm-btn pm-btn-secondary" onClick={openCycleForm}>
            <FiCalendar /> New Cycle
          </button>
          <button className="pm-btn pm-btn-primary" onClick={openNewAppraisal}>
            <FiPlus /> New Appraisal
          </button>
        </div>
      </div>

      <div className="pm-notice">
        <FiActivity />
        <span>
          <strong>Prototype mode:</strong> records use temporary browser state.
          Refreshing the page restores the sample data.
        </span>
      </div>

      <div className="pm-stats-grid">
        <div className="pm-stat-card">
          <div className="pm-stat-icon pm-icon-blue"><FiUsers /></div>
          <div className="pm-stat-label">Total Appraisals</div>
          <div className="pm-stat-value">{appraisals.length}</div>
          <div className="pm-stat-foot">Across all review cycles</div>
        </div>

        <div className="pm-stat-card">
          <div className="pm-stat-icon pm-icon-green"><FiCheckCircle /></div>
          <div className="pm-stat-label">Completed Reviews</div>
          <div className="pm-stat-value">{completedCount}</div>
          <div className="pm-stat-foot">
            {appraisals.length
              ? Math.round((completedCount / appraisals.length) * 100)
              : 0}% of all records
          </div>
        </div>

        <div className="pm-stat-card">
          <div className="pm-stat-icon pm-icon-orange"><FiClipboard /></div>
          <div className="pm-stat-label">Reviews in Progress</div>
          <div className="pm-stat-value">{reviewCount}</div>
          <div className="pm-stat-foot">Self and manager assessment</div>
        </div>

        <div className="pm-stat-card">
          <div className="pm-stat-icon pm-icon-purple"><FiBarChart2 /></div>
          <div className="pm-stat-label">Average Performance</div>
          <div className="pm-stat-value">
            {averageScore}
            {averageScore !== "—" && <small> / 5</small>}
          </div>
          <div className="pm-stat-foot">{pendingCount} not yet started</div>
        </div>
      </div>

      <div className="pm-panel">
        <div className="pm-panel-heading">
          <div>
            <h2>Performance Reviews</h2>
            <p>Manage employee goals, ratings and appraisal outcomes.</p>
          </div>
          <div className="pm-tabs">
            <button
              className={activeTab === "appraisals" ? "active" : ""}
              onClick={() => setActiveTab("appraisals")}
            >
              Appraisals
            </button>
            <button
              className={activeTab === "cycles" ? "active" : ""}
              onClick={() => setActiveTab("cycles")}
            >
              Review Cycles
            </button>
          </div>
        </div>

        {activeTab === "appraisals" ? (
          <>
            <div className="pm-filters">
              <div className="pm-search">
                <FiSearch />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search employee, ID or manager..."
                />
              </div>

              <div className="pm-filter-control">
                <FiFilter />
                <select
                  value={cycleFilter}
                  onChange={(event) => setCycleFilter(event.target.value)}
                >
                  <option>All Cycles</option>
                  {cycles.map((cycle) => (
                    <option key={cycle.name}>{cycle.name}</option>
                  ))}
                </select>
                <FiChevronDown className="pm-select-arrow" />
              </div>

              <div className="pm-filter-control">
                <select
                  value={departmentFilter}
                  onChange={(event) => setDepartmentFilter(event.target.value)}
                >
                  <option>All Departments</option>
                  {departments.map((department) => (
                    <option key={department}>{department}</option>
                  ))}
                </select>
                <FiChevronDown className="pm-select-arrow" />
              </div>

              <div className="pm-filter-control">
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option>All Statuses</option>
                  {[
                    "Pending",
                    "Self Assessment",
                    "Manager Review",
                    "Final Review",
                    "Completed",
                  ].map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
                <FiChevronDown className="pm-select-arrow" />
              </div>
            </div>

            <div className="pm-table-wrap">
              <table className="pm-table">
                <thead>
                  <tr>
                    <th>EMPLOYEE</th>
                    <th>REVIEW CYCLE</th>
                    <th>GOALS</th>
                    <th>SELF RATING</th>
                    <th>FINAL SCORE</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppraisals.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="pm-employee-cell">
                          <div className="pm-avatar">
                            {item.employee
                              .split(" ")
                              .map((part) => part[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <strong>{item.employee}</strong>
                            <span>{item.employeeCode}</span>
                            <small>{item.department}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong className="pm-cycle-name">{item.cycle}</strong>
                        <span className="pm-cell-subtitle">{item.period}</span>
                      </td>
                      <td>
                        <strong>{item.completedGoals}/{item.goals}</strong>
                        <div className="pm-progress">
                          <span
                            style={{
                              width: `${
                                item.goals
                                  ? Math.min(
                                      100,
                                      (item.completedGoals / item.goals) * 100
                                    )
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </td>
                      <td><Rating value={item.selfRating} /></td>
                      <td><Rating value={item.score} /></td>
                      <td><StatusBadge status={item.status} /></td>
                      <td>
                        <div className="pm-actions">
                          <button
                            title="View appraisal"
                            onClick={() => setSelectedId(item.id)}
                          >
                            <FiEye />
                          </button>
                          <button
                            title="Edit appraisal"
                            onClick={() => openEditAppraisal(item)}
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            title="Delete prototype record"
                            className="pm-delete-action"
                            onClick={() => deleteAppraisal(item.id)}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredAppraisals.length === 0 && (
                    <tr>
                      <td colSpan="7" className="pm-empty">
                        No appraisal records match your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="pm-table-footer">
              Showing {filteredAppraisals.length} of {appraisals.length} records
            </div>
          </>
        ) : (
          <div className="pm-cycle-list">
            {cycles.map((cycle) => (
              <div className="pm-cycle-card" key={cycle.name}>
                <div className="pm-cycle-icon"><FiCalendar /></div>
                <div className="pm-cycle-info">
                  <strong>{cycle.name}</strong>
                  <span>{cycle.period}</span>
                  <small>Due date: {cycle.dueDate}</small>
                </div>
                <span
                  className={`pm-status pm-status-${statusClass(cycle.status)}`}
                >
                  {cycle.status}
                </span>
                <button
                  className="pm-btn pm-btn-secondary"
                  onClick={() => {
                    setCycleFilter(cycle.name);
                    setActiveTab("appraisals");
                  }}
                >
                  View Reviews
                </button>
              </div>
            ))}
            {cycles.length === 0 && (
              <div className="pm-empty">No review cycles created yet.</div>
            )}
          </div>
        )}
      </div>

      {modal === "appraisal" && (
        <div className="pm-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setModal("");
        }}>
          <div className="pm-modal">
            <div className="pm-modal-header">
              <div>
                <h2>{editingId !== null ? "Edit Appraisal" : "New Appraisal"}</h2>
                <p>Enter employee details and performance assessment.</p>
              </div>
              <button type="button" className="pm-icon-button" onClick={() => setModal("")}>
                <FiX />
              </button>
            </div>

            <form onSubmit={saveAppraisal}>
              <div className="pm-form-grid">
                <label>
                  Employee Name *
                  <input
                    required
                    value={form.employee}
                    onChange={(event) => updateForm("employee", event.target.value)}
                    placeholder="Enter employee name"
                  />
                </label>
                <label>
                  Employee ID *
                  <input
                    required
                    value={form.employeeCode}
                    onChange={(event) => updateForm("employeeCode", event.target.value)}
                    placeholder="e.g. EMP006"
                  />
                </label>
                <label>
                  Department
                  <input
                    value={form.department}
                    onChange={(event) => updateForm("department", event.target.value)}
                    placeholder="Department"
                  />
                </label>
                <label>
                  Designation
                  <input
                    value={form.designation}
                    onChange={(event) => updateForm("designation", event.target.value)}
                    placeholder="Designation"
                  />
                </label>
                <label>
                  Review Cycle *
                  <select
                    required
                    value={form.cycle}
                    onChange={(event) => {
                      const selected = cycles.find((cycle) => cycle.name === event.target.value);
                      setForm((previous) => ({
                        ...previous,
                        cycle: event.target.value,
                        period: selected?.period || "",
                      }));
                    }}
                  >
                    <option value="">Select cycle</option>
                    {cycles.map((cycle) => (
                      <option key={cycle.name}>{cycle.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Reporting Manager
                  <input
                    value={form.manager}
                    onChange={(event) => updateForm("manager", event.target.value)}
                    placeholder="Manager name"
                  />
                </label>
                <label>
                  Total Goals
                  <input
                    type="number"
                    min="0"
                    value={form.goals}
                    onChange={(event) => updateForm("goals", event.target.value)}
                  />
                </label>
                <label>
                  Goals Achieved
                  <input
                    type="number"
                    min="0"
                    value={form.completedGoals}
                    onChange={(event) => updateForm("completedGoals", event.target.value)}
                  />
                </label>
                <label>
                  Self Assessment (1–5)
                  <select
                    value={form.selfRating}
                    onChange={(event) => updateForm("selfRating", Number(event.target.value))}
                  >
                    <option value="0">Not rated</option>
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <option key={rating} value={rating}>{rating} / 5</option>
                    ))}
                  </select>
                </label>
                <label>
                  Manager Rating (1–5)
                  <select
                    value={form.managerRating}
                    onChange={(event) => {
                      const rating = Number(event.target.value);
                      setForm((previous) => ({
                        ...previous,
                        managerRating: rating,
                        score: rating || previous.score,
                      }));
                    }}
                  >
                    <option value="0">Not rated</option>
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <option key={rating} value={rating}>{rating} / 5</option>
                    ))}
                  </select>
                </label>
                <label>
                  Review Status
                  <select
                    value={form.status}
                    onChange={(event) => updateForm("status", event.target.value)}
                  >
                    {[
                      "Pending",
                      "Self Assessment",
                      "Manager Review",
                      "Final Review",
                      "Completed",
                    ].map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Final Score (1–5)
                  <select
                    value={form.score}
                    onChange={(event) => updateForm("score", Number(event.target.value))}
                  >
                    <option value="0">Not rated</option>
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <option key={rating} value={rating}>{rating} / 5</option>
                    ))}
                  </select>
                </label>
                <label className="pm-form-full">
                  Key Strengths
                  <textarea
                    rows="2"
                    value={form.strengths}
                    onChange={(event) => updateForm("strengths", event.target.value)}
                    placeholder="Employee strengths"
                  />
                </label>
                <label className="pm-form-full">
                  Areas for Improvement
                  <textarea
                    rows="2"
                    value={form.improvements}
                    onChange={(event) => updateForm("improvements", event.target.value)}
                    placeholder="Development areas"
                  />
                </label>
                <label className="pm-form-full">
                  Manager Comments
                  <textarea
                    rows="3"
                    value={form.comments}
                    onChange={(event) => updateForm("comments", event.target.value)}
                    placeholder="Enter review comments"
                  />
                </label>
              </div>

              <div className="pm-modal-footer">
                <button type="button" className="pm-btn pm-btn-secondary" onClick={() => setModal("")}>
                  Cancel
                </button>
                <button type="submit" className="pm-btn pm-btn-primary">
                  <FiCheckCircle /> Save Appraisal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === "cycle" && (
        <div className="pm-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setModal("");
        }}>
          <div className="pm-modal pm-modal-small">
            <div className="pm-modal-header">
              <div>
                <h2>Create Review Cycle</h2>
                <p>Define the review period and submission deadline.</p>
              </div>
              <button type="button" className="pm-icon-button" onClick={() => setModal("")}>
                <FiX />
              </button>
            </div>

            <form onSubmit={saveCycle}>
              <div className="pm-form-grid">
                <label className="pm-form-full">
                  Cycle Name *
                  <input
                    required
                    value={cycleForm.name}
                    onChange={(event) => setCycleForm({ ...cycleForm, name: event.target.value })}
                    placeholder="e.g. Annual Review 2027"
                  />
                </label>
                <label className="pm-form-full">
                  Review Period *
                  <input
                    required
                    value={cycleForm.period}
                    onChange={(event) => setCycleForm({ ...cycleForm, period: event.target.value })}
                    placeholder="e.g. Apr 2026 – Mar 2027"
                  />
                </label>
                <label className="pm-form-full">
                  Submission Due Date *
                  <input
                    required
                    type="date"
                    value={cycleForm.dueDate}
                    onChange={(event) => setCycleForm({ ...cycleForm, dueDate: event.target.value })}
                  />
                </label>
              </div>
              <div className="pm-modal-footer">
                <button type="button" className="pm-btn pm-btn-secondary" onClick={() => setModal("")}>
                  Cancel
                </button>
                <button type="submit" className="pm-btn pm-btn-primary">
                  <FiPlus /> Create Cycle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedAppraisal && (
        <div className="pm-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedId(null);
        }}>
          <div className="pm-modal">
            <div className="pm-modal-header">
              <div>
                <h2>Appraisal Details</h2>
                <p>{selectedAppraisal.cycle}</p>
              </div>
              <button className="pm-icon-button" onClick={() => setSelectedId(null)}>
                <FiX />
              </button>
            </div>

            <div className="pm-detail-hero">
              <div className="pm-avatar pm-avatar-large">
                {selectedAppraisal.employee.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3>{selectedAppraisal.employee}</h3>
                <p>{selectedAppraisal.employeeCode} · {selectedAppraisal.designation}</p>
                <p>{selectedAppraisal.department} · {selectedAppraisal.manager}</p>
                <StatusBadge status={selectedAppraisal.status} />
              </div>
            </div>

            <div className="pm-detail-grid">
              <div><span>Goals achieved</span><strong>{selectedAppraisal.completedGoals} / {selectedAppraisal.goals}</strong></div>
              <div><span>Self assessment</span><strong>{selectedAppraisal.selfRating || "Not rated"}{selectedAppraisal.selfRating ? " / 5" : ""}</strong></div>
              <div><span>Manager rating</span><strong>{selectedAppraisal.managerRating || "Not rated"}{selectedAppraisal.managerRating ? " / 5" : ""}</strong></div>
              <div><span>Final score</span><strong>{selectedAppraisal.score || "Not rated"}{selectedAppraisal.score ? " / 5" : ""}</strong></div>
            </div>

            <div className="pm-detail-notes">
              <h4>Key Strengths</h4>
              <p>{selectedAppraisal.strengths || "No comments added."}</p>
              <h4>Areas for Improvement</h4>
              <p>{selectedAppraisal.improvements || "No comments added."}</p>
              <h4>Manager Comments</h4>
              <p>{selectedAppraisal.comments || "No comments added."}</p>
            </div>

            <div className="pm-modal-footer pm-detail-footer">
              <button
                className="pm-btn pm-btn-secondary"
                onClick={() => {
                  openEditAppraisal(selectedAppraisal);
                  setSelectedId(null);
                }}
              >
                <FiEdit2 /> Edit
              </button>
              <label className="pm-status-update">
                Update Status
                <select
                  value={selectedAppraisal.status}
                  onChange={(event) => updateStatus(selectedAppraisal.id, event.target.value)}
                >
                  {[
                    "Pending",
                    "Self Assessment",
                    "Manager Review",
                    "Final Review",
                    "Completed",
                  ].map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>
              <button className="pm-btn pm-btn-primary" onClick={() => setSelectedId(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
