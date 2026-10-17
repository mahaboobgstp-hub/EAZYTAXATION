
import React, { useMemo, useState } from "react";
import {
  FiSearch,
  FiPlus,
  FiEdit2,
  FiRotateCcw,
  FiDownload,
  FiX,
  FiAlertCircle,
  FiCheckCircle,
  FiPackage,
  FiUser,
  FiCalendar,
  FiClock,
} from "react-icons/fi";
import "../../css/hr/EmployeeAssetAssignment.css";

const INITIAL_ASSIGNMENTS = [
  {
    id: 1,
    assignment_code: "ASN-0001",
    asset_code: "AST-0001",
    asset_name: "Office Laptop",
    category: "Laptop",
    employee_id: "EMP-001",
    employee_name: "Arun Kumar",
    issue_date: "2026-09-01",
    expected_return_date: "2027-09-01",
    actual_return_date: "",
    condition_at_issue: "Good",
    condition_at_return: "",
    status: "Issued",
    acknowledgement: "Received",
    notes: "Laptop issued with charger",
  },
  {
    id: 2,
    assignment_code: "ASN-0002",
    asset_code: "AST-0004",
    asset_name: "Office Monitor",
    category: "Monitor",
    employee_id: "EMP-002",
    employee_name: "Priya Sharma",
    issue_date: "2026-08-15",
    expected_return_date: "2027-08-15",
    actual_return_date: "",
    condition_at_issue: "New",
    condition_at_return: "",
    status: "Issued",
    acknowledgement: "Pending",
    notes: "",
  },
  {
    id: 3,
    assignment_code: "ASN-0003",
    asset_code: "AST-0002",
    asset_name: "Office Mobile",
    category: "Mobile",
    employee_id: "EMP-003",
    employee_name: "Rahul Verma",
    issue_date: "2026-05-10",
    expected_return_date: "2026-09-30",
    actual_return_date: "2026-09-28",
    condition_at_issue: "Good",
    condition_at_return: "Good",
    status: "Returned",
    acknowledgement: "Received",
    notes: "Returned with accessories",
  },
];

const ASSET_OPTIONS = [
  { code: "AST-0001", name: "Office Laptop", category: "Laptop" },
  { code: "AST-0002", name: "Office Mobile", category: "Mobile" },
  { code: "AST-0004", name: "Office Monitor", category: "Monitor" },
];

const EMPLOYEE_OPTIONS = [
  { id: "EMP-001", name: "Arun Kumar" },
  { id: "EMP-002", name: "Priya Sharma" },
  { id: "EMP-003", name: "Rahul Verma" },
  { id: "EMP-004", name: "Sneha Reddy" },
];

const EMPTY_FORM = {
  asset_code: "",
  employee_id: "",
  issue_date: new Date().toISOString().slice(0, 10),
  expected_return_date: "",
  condition_at_issue: "Good",
  acknowledgement: "Pending",
  notes: "",
};

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function EmployeeAssetAssignment() {
  const [assignments, setAssignments] = useState(INITIAL_ASSIGNMENTS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [employeeFilter, setEmployeeFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [returnTarget, setReturnTarget] = useState(null);
  const [returnDate, setReturnDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [returnCondition, setReturnCondition] = useState("Good");
  const [returnNotes, setReturnNotes] = useState("");

  const filteredAssignments = useMemo(() => {
    const term = search.trim().toLowerCase();

    return assignments.filter((item) => {
      const matchesSearch =
        !term ||
        [
          item.assignment_code,
          item.asset_code,
          item.asset_name,
          item.category,
          item.employee_id,
          item.employee_name,
        ].some((value) => String(value || "").toLowerCase().includes(term));

      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;

      const matchesEmployee =
        employeeFilter === "All" || item.employee_id === employeeFilter;

      return matchesSearch && matchesStatus && matchesEmployee;
    });
  }, [assignments, search, statusFilter, employeeFilter]);

  const today = new Date().toISOString().slice(0, 10);

  const stats = useMemo(() => {
    const issued = assignments.filter((a) => a.status === "Issued");
    return {
      total: assignments.length,
      issued: issued.length,
      returned: assignments.filter((a) => a.status === "Returned").length,
      overdue: issued.filter(
        (a) => a.expected_return_date && a.expected_return_date < today
      ).length,
      pendingAcknowledgement: issued.filter(
        (a) => a.acknowledgement === "Pending"
      ).length,
    };
  }, [assignments, today]);

  const getAsset = (assetCode) =>
    ASSET_OPTIONS.find((asset) => asset.code === assetCode);

  const getEmployee = (employeeId) =>
    EMPLOYEE_OPTIONS.find((employee) => employee.id === employeeId);

  const openAddForm = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      issue_date: new Date().toISOString().slice(0, 10),
    });
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (item) => {
    setEditingId(item.id);
    setForm({
      asset_code: item.asset_code,
      employee_id: item.employee_id,
      issue_date: item.issue_date,
      expected_return_date: item.expected_return_date,
      condition_at_issue: item.condition_at_issue,
      acknowledgement: item.acknowledgement,
      notes: item.notes || "",
    });
    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormError("");
  };

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const saveAssignment = (event) => {
    event.preventDefault();
    setFormError("");

    if (!form.asset_code || !form.employee_id || !form.issue_date) {
      setFormError("Asset, employee and issue date are required.");
      return;
    }

    if (
      form.expected_return_date &&
      form.expected_return_date < form.issue_date
    ) {
      setFormError("Expected return date cannot be before the issue date.");
      return;
    }

    if (editingId === null) {
      const assetAlreadyIssued = assignments.some(
        (item) =>
          item.asset_code === form.asset_code && item.status === "Issued"
      );

      if (assetAlreadyIssued) {
        setFormError(
          "This asset already has an active assignment. Return it before assigning it again."
        );
        return;
      }
    } else {
      const original = assignments.find((item) => item.id === editingId);

      if (
        original?.status === "Returned" &&
        original.asset_code !== form.asset_code
      ) {
        setFormError(
          "Returned assignments are historical records. Create a new assignment instead."
        );
        return;
      }

      const assetAlreadyIssued = assignments.some(
        (item) =>
          item.id !== editingId &&
          item.asset_code === form.asset_code &&
          item.status === "Issued"
      );

      if (assetAlreadyIssued) {
        setFormError("This asset already has an active assignment.");
        return;
      }
    }

    const asset = getAsset(form.asset_code);
    const employee = getEmployee(form.employee_id);

    if (!asset || !employee) {
      setFormError("Select a valid asset and employee.");
      return;
    }

    const payload = {
      asset_code: asset.code,
      asset_name: asset.name,
      category: asset.category,
      employee_id: employee.id,
      employee_name: employee.name,
      issue_date: form.issue_date,
      expected_return_date: form.expected_return_date,
      condition_at_issue: form.condition_at_issue,
      acknowledgement: form.acknowledgement,
      notes: form.notes.trim(),
    };

    if (editingId !== null) {
      setAssignments((current) =>
        current.map((item) =>
          item.id === editingId ? { ...item, ...payload } : item
        )
      );
    } else {
      const nextNumber =
        Math.max(
          0,
          ...assignments.map((item) =>
            Number(item.assignment_code.replace("ASN-", "")) || 0
          )
        ) + 1;

      setAssignments((current) => [
        {
          id: Date.now(),
          assignment_code: `ASN-${String(nextNumber).padStart(4, "0")}`,
          ...payload,
          actual_return_date: "",
          condition_at_return: "",
          status: "Issued",
        },
        ...current,
      ]);
    }

    closeForm();
  };

  const openReturnForm = (item) => {
    setReturnTarget(item);
    setReturnDate(new Date().toISOString().slice(0, 10));
    setReturnCondition("Good");
    setReturnNotes("");
  };

  const confirmReturn = (event) => {
    event.preventDefault();

    if (!returnTarget || !returnDate) return;

    if (returnDate < returnTarget.issue_date) {
      return;
    }

    setAssignments((current) =>
      current.map((item) =>
        item.id === returnTarget.id
          ? {
              ...item,
              status: "Returned",
              actual_return_date: returnDate,
              condition_at_return: returnCondition,
              acknowledgement: item.acknowledgement,
              notes: [item.notes, returnNotes.trim()]
                .filter(Boolean)
                .join(" | "),
            }
          : item
      )
    );

    setReturnTarget(null);
  };

  const exportCsv = () => {
    const columns = [
      ["Assignment Code", "assignment_code"],
      ["Asset Code", "asset_code"],
      ["Asset Name", "asset_name"],
      ["Category", "category"],
      ["Employee ID", "employee_id"],
      ["Employee Name", "employee_name"],
      ["Issue Date", "issue_date"],
      ["Expected Return Date", "expected_return_date"],
      ["Actual Return Date", "actual_return_date"],
      ["Condition at Issue", "condition_at_issue"],
      ["Condition at Return", "condition_at_return"],
      ["Status", "status"],
      ["Acknowledgement", "acknowledgement"],
      ["Notes", "notes"],
    ];

    const escapeCsv = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const rows = [
      columns.map(([label]) => escapeCsv(label)).join(","),
      ...filteredAssignments.map((item) =>
        columns.map(([, key]) => escapeCsv(item[key])).join(",")
      ),
    ];

    const blob = new Blob(["\uFEFF" + rows.join("\r\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "eazytaxation-employee-asset-assignments.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="asset-assignment-page">
      <div className="assignment-page-header">
        <div>
          <div className="assignment-breadcrumb">
            HR Management / Assets / Assignments
          </div>
          <h1>Employee Asset Assignment</h1>
          <p>
            Issue company assets to employees and maintain issue and return
            records.
          </p>
        </div>

        <div className="assignment-header-actions">
          <button
            type="button"
            className="assignment-btn assignment-btn-secondary"
            onClick={exportCsv}
          >
            <FiDownload /> Export CSV
          </button>
          <button
            type="button"
            className="assignment-btn assignment-btn-primary"
            onClick={openAddForm}
          >
            <FiPlus /> Issue Asset
          </button>
        </div>
      </div>

      <div className="assignment-demo-notice">
        <FiAlertCircle />
        <span>
          Prototype mode: records are sample data. Employee and asset options
          must be connected to your real database before production use.
        </span>
      </div>

      <div className="assignment-stat-grid">
        <div className="assignment-stat-card">
          <div className="assignment-stat-icon assignment-blue">
            <FiPackage />
          </div>
          <div>
            <span>Total Assignments</span>
            <strong>{stats.total}</strong>
          </div>
        </div>

        <div className="assignment-stat-card">
          <div className="assignment-stat-icon assignment-green">
            <FiUser />
          </div>
          <div>
            <span>Currently Issued</span>
            <strong>{stats.issued}</strong>
          </div>
        </div>

        <div className="assignment-stat-card">
          <div className="assignment-stat-icon assignment-purple">
            <FiCheckCircle />
          </div>
          <div>
            <span>Returned</span>
            <strong>{stats.returned}</strong>
          </div>
        </div>

        <div className="assignment-stat-card">
          <div className="assignment-stat-icon assignment-orange">
            <FiClock />
          </div>
          <div>
            <span>Overdue Returns</span>
            <strong>{stats.overdue}</strong>
          </div>
        </div>

        <div className="assignment-stat-card">
          <div className="assignment-stat-icon assignment-red">
            <FiAlertCircle />
          </div>
          <div>
            <span>Pending Acknowledgement</span>
            <strong>{stats.pendingAcknowledgement}</strong>
          </div>
        </div>
      </div>

      <div className="assignment-table-card">
        <div className="assignment-toolbar">
          <div className="assignment-search">
            <FiSearch />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search assignment, asset or employee..."
              aria-label="Search assignments"
            />
          </div>

          <div className="assignment-filters">
            <label>
              Employee
              <select
                value={employeeFilter}
                onChange={(event) => setEmployeeFilter(event.target.value)}
              >
                <option value="All">All employees</option>
                {EMPLOYEE_OPTIONS.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Status
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="All">All statuses</option>
                <option value="Issued">Issued</option>
                <option value="Returned">Returned</option>
              </select>
            </label>

            {(search ||
              employeeFilter !== "All" ||
              statusFilter !== "All") && (
              <button
                type="button"
                className="assignment-clear"
                onClick={() => {
                  setSearch("");
                  setEmployeeFilter("All");
                  setStatusFilter("All");
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="assignment-table-summary">
          Showing <strong>{filteredAssignments.length}</strong> of{" "}
          <strong>{assignments.length}</strong> assignment records
        </div>

        <div className="assignment-table-scroll">
          <table className="assignment-table">
            <thead>
              <tr>
                <th>Assignment</th>
                <th>Asset</th>
                <th>Employee</th>
                <th>Issue Date</th>
                <th>Expected Return</th>
                <th>Actual Return</th>
                <th>Handover Condition</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssignments.map((item) => {
                const isOverdue =
                  item.status === "Issued" &&
                  item.expected_return_date &&
                  item.expected_return_date < today;

                return (
                  <tr key={item.id}>
                    <td>
                      <div className="assignment-primary-cell">
                        <strong>{item.assignment_code}</strong>
                        <span>{item.acknowledgement} acknowledgement</span>
                      </div>
                    </td>

                    <td>
                      <div className="assignment-primary-cell">
                        <strong>{item.asset_name}</strong>
                        <span>
                          {item.asset_code} · {item.category}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div className="assignment-employee-cell">
                        <div className="assignment-avatar">
                          {item.employee_name
                            .split(" ")
                            .map((part) => part[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </div>
                        <div className="assignment-primary-cell">
                          <strong>{item.employee_name}</strong>
                          <span>{item.employee_id}</span>
                        </div>
                      </div>
                    </td>

                    <td>{formatDate(item.issue_date)}</td>

                    <td>
                      <span className={isOverdue ? "assignment-overdue" : ""}>
                        {formatDate(item.expected_return_date)}
                      </span>
                      {isOverdue && (
                        <small className="assignment-overdue-label">
                          Overdue
                        </small>
                      )}
                    </td>

                    <td>{formatDate(item.actual_return_date)}</td>

                    <td>
                      <span
                        className={`assignment-condition condition-${(
                          item.condition_at_issue || "Good"
                        ).toLowerCase()}`}
                      >
                        {item.condition_at_issue}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`assignment-status status-${item.status.toLowerCase()}`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td>
                      <div className="assignment-row-actions">
                        {item.status === "Issued" && (
                          <>
                            <button
                              type="button"
                              className="assignment-icon-btn"
                              title="Edit assignment"
                              aria-label={`Edit ${item.assignment_code}`}
                              onClick={() => openEditForm(item)}
                            >
                              <FiEdit2 />
                            </button>
                            <button
                              type="button"
                              className="assignment-icon-btn assignment-return-btn"
                              title="Record asset return"
                              aria-label={`Return ${item.asset_name}`}
                              onClick={() => openReturnForm(item)}
                            >
                              <FiRotateCcw />
                            </button>
                          </>
                        )}
                        {item.status === "Returned" && (
                          <span className="assignment-history-label">
                            History
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredAssignments.length === 0 && (
                <tr>
                  <td colSpan="9">
                    <div className="assignment-empty">
                      <FiPackage />
                      <strong>No assignment records found</strong>
                      <span>Try a different search or filter.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div
          className="assignment-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm();
          }}
        >
          <div
            className="assignment-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="assignment-form-title"
          >
            <div className="assignment-modal-header">
              <div>
                <h2 id="assignment-form-title">
                  {editingId !== null ? "Edit Assignment" : "Issue Asset"}
                </h2>
                <p>
                  Record who receives the asset and the agreed return date.
                </p>
              </div>
              <button
                type="button"
                className="assignment-icon-btn"
                onClick={closeForm}
                aria-label="Close form"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={saveAssignment}>
              <div className="assignment-form-grid">
                <label>
                  Asset <span>*</span>
                  <select
                    name="asset_code"
                    value={form.asset_code}
                    onChange={updateField}
                    required
                    disabled={editingId !== null}
                  >
                    <option value="">Select asset</option>
                    {ASSET_OPTIONS.map((asset) => {
                      const alreadyIssued = assignments.some(
                        (item) =>
                          item.asset_code === asset.code &&
                          item.status === "Issued" &&
                          item.id !== editingId
                      );

                      return (
                        <option
                          key={asset.code}
                          value={asset.code}
                          disabled={alreadyIssued}
                        >
                          {asset.code} — {asset.name}
                          {alreadyIssued ? " (Already issued)" : ""}
                        </option>
                      );
                    })}
                  </select>
                </label>

                <label>
                  Employee <span>*</span>
                  <select
                    name="employee_id"
                    value={form.employee_id}
                    onChange={updateField}
                    required
                  >
                    <option value="">Select employee</option>
                    {EMPLOYEE_OPTIONS.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.id} — {employee.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Issue Date <span>*</span>
                  <input
                    type="date"
                    name="issue_date"
                    value={form.issue_date}
                    onChange={updateField}
                    required
                  />
                </label>

                <label>
                  Expected Return Date
                  <input
                    type="date"
                    name="expected_return_date"
                    value={form.expected_return_date}
                    min={form.issue_date || undefined}
                    onChange={updateField}
                  />
                </label>

                <label>
                  Condition at Handover <span>*</span>
                  <select
                    name="condition_at_issue"
                    value={form.condition_at_issue}
                    onChange={updateField}
                    required
                  >
                    <option>New</option>
                    <option>Good</option>
                    <option>Fair</option>
                    <option>Damaged</option>
                  </select>
                </label>

                <label>
                  Employee Acknowledgement
                  <select
                    name="acknowledgement"
                    value={form.acknowledgement}
                    onChange={updateField}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Received">Received</option>
                  </select>
                </label>

                <label className="assignment-full-width">
                  Handover Notes
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={updateField}
                    rows="3"
                    maxLength={1000}
                    placeholder="Accessories issued, condition details or other remarks..."
                  />
                </label>
              </div>

              {formError && (
                <div className="assignment-form-error" role="alert">
                  <FiAlertCircle /> {formError}
                </div>
              )}

              <div className="assignment-modal-footer">
                <button
                  type="button"
                  className="assignment-btn assignment-btn-secondary"
                  onClick={closeForm}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="assignment-btn assignment-btn-primary"
                >
                  {editingId !== null ? "Save Changes" : "Confirm Issue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {returnTarget && (
        <div className="assignment-modal-backdrop">
          <div
            className="assignment-modal assignment-return-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="assignment-return-title"
          >
            <div className="assignment-modal-header">
              <div>
                <h2 id="assignment-return-title">Record Asset Return</h2>
                <p>
                  {returnTarget.asset_name} ({returnTarget.asset_code}) from{" "}
                  {returnTarget.employee_name}
                </p>
              </div>
              <button
                type="button"
                className="assignment-icon-btn"
                onClick={() => setReturnTarget(null)}
                aria-label="Close return form"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={confirmReturn}>
              <div className="assignment-form-grid">
                <label className="assignment-full-width">
                  <FiCalendar /> Actual Return Date <span>*</span>
                  <input
                    type="date"
                    value={returnDate}
                    min={returnTarget.issue_date}
                    onChange={(event) => setReturnDate(event.target.value)}
                    required
                  />
                </label>

                <label className="assignment-full-width">
                  Condition at Return <span>*</span>
                  <select
                    value={returnCondition}
                    onChange={(event) => setReturnCondition(event.target.value)}
                    required
                  >
                    <option>Good</option>
                    <option>Fair</option>
                    <option>Damaged</option>
                  </select>
                </label>

                <label className="assignment-full-width">
                  Return Remarks
                  <textarea
                    rows="3"
                    value={returnNotes}
                    onChange={(event) => setReturnNotes(event.target.value)}
                    maxLength={1000}
                    placeholder="Record missing accessories, damage or other observations..."
                  />
                </label>
              </div>

              {returnDate && returnDate < returnTarget.issue_date && (
                <div className="assignment-form-error" role="alert">
                  <FiAlertCircle /> Return date cannot be before the issue date.
                </div>
              )}

              <div className="assignment-return-note">
                <FiAlertCircle />
                Returning an asset closes this assignment record. In the
                production version, the asset's availability will also be
                updated after the return is saved.
              </div>

              <div className="assignment-modal-footer">
                <button
                  type="button"
                  className="assignment-btn assignment-btn-secondary"
                  onClick={() => setReturnTarget(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="assignment-btn assignment-btn-primary"
                  disabled={
                    !returnDate || returnDate < returnTarget.issue_date
                  }
                >
                  Confirm Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeAssetAssignment;
