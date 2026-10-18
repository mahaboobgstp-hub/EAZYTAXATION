
import React, { useMemo, useState } from "react";
import {
  FiSearch,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiDownload,
  FiX,
  FiTool,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiCalendar,
  FiDollarSign,
  FiTruck,
  FiPackage,
} from "react-icons/fi";
import "../../css/hr/AssetMaintenance.css";

const initialRecords = [
  {
    id: 1,
    reference: "MNT-2026-001",
    assetName: "Dell Latitude 5440",
    assetCode: "AST-001",
    type: "Repair",
    priority: "Medium",
    reportedDate: "2026-10-10",
    dueDate: "2026-10-20",
    provider: "Internal IT Team",
    estimatedCost: 2500,
    actualCost: 2200,
    status: "Completed",
    description: "Laptop keyboard replacement",
    resolution: "Keyboard replaced and tested",
    nextServiceDate: "2027-04-10",
  },
  {
    id: 2,
    reference: "MNT-2026-002",
    assetName: "Office Van",
    assetCode: "VEH-001",
    type: "Scheduled Service",
    priority: "Low",
    reportedDate: "2026-10-12",
    dueDate: "2026-10-22",
    provider: "City Auto Service",
    estimatedCost: 6500,
    actualCost: 0,
    status: "In Progress",
    description: "Periodic vehicle servicing and oil change",
    resolution: "",
    nextServiceDate: "2027-04-22",
  },
  {
    id: 3,
    reference: "MNT-2026-003",
    assetName: "HP LaserJet Printer",
    assetCode: "AST-002",
    type: "Breakdown",
    priority: "High",
    reportedDate: "2026-10-14",
    dueDate: "2026-10-18",
    provider: "Office Equipment Care",
    estimatedCost: 4000,
    actualCost: 0,
    status: "Open",
    description: "Printer showing repeated paper jam errors",
    resolution: "",
    nextServiceDate: "",
  },
];

const emptyForm = {
  reference: "",
  assetName: "",
  assetCode: "",
  type: "Repair",
  priority: "Medium",
  reportedDate: new Date().toISOString().slice(0, 10),
  dueDate: "",
  provider: "",
  estimatedCost: "",
  actualCost: "",
  status: "Open",
  description: "",
  resolution: "",
  nextServiceDate: "",
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const escapeCSV = (value) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

export default function AssetMaintenance() {
  const [records, setRecords] = useState(initialRecords);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((record) => {
      const matchesSearch =
        !query ||
        [
          record.reference,
          record.assetName,
          record.assetCode,
          record.provider,
          record.description,
        ].some((value) =>
          String(value || "").toLowerCase().includes(query)
        );

      return (
        matchesSearch &&
        (statusFilter === "All" || record.status === statusFilter) &&
        (typeFilter === "All" || record.type === typeFilter) &&
        (priorityFilter === "All" || record.priority === priorityFilter)
      );
    });
  }, [records, search, statusFilter, typeFilter, priorityFilter]);

  const stats = useMemo(() => {
    const open = records.filter(
      (record) => record.status === "Open"
    ).length;

    const inProgress = records.filter(
      (record) => record.status === "In Progress"
    ).length;

    const completed = records.filter(
      (record) => record.status === "Completed"
    ).length;

    const overdue = records.filter(
      (record) =>
        record.status !== "Completed" &&
        record.dueDate &&
        record.dueDate < todayISO()
    ).length;

    const totalActualCost = records.reduce(
      (sum, record) => sum + Number(record.actualCost || 0),
      0
    );

    return { open, inProgress, completed, overdue, totalActualCost };
  }, [records]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const openCreateModal = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      reportedDate: todayISO(),
    });
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (record) => {
    setEditingId(record.id);
    setForm({
      ...record,
      estimatedCost: String(record.estimatedCost ?? ""),
      actualCost: String(record.actualCost ?? ""),
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

    if (!form.assetName.trim() || !form.assetCode.trim()) {
      setFormError("Please enter the asset name and asset code.");
      return;
    }

    if (!form.reportedDate) {
      setFormError("Please enter the reported date.");
      return;
    }

    if (
      form.dueDate &&
      form.dueDate < form.reportedDate
    ) {
      setFormError("The due date cannot be earlier than the reported date.");
      return;
    }

    const estimatedCost = Number(form.estimatedCost || 0);
    const actualCost = Number(form.actualCost || 0);

    if (
      !Number.isFinite(estimatedCost) ||
      !Number.isFinite(actualCost) ||
      estimatedCost < 0 ||
      actualCost < 0
    ) {
      setFormError("Costs must be valid, non-negative amounts.");
      return;
    }

    const duplicateReference = records.some(
      (record) =>
        record.reference.trim().toLowerCase() ===
          form.reference.trim().toLowerCase() &&
        record.id !== editingId
    );

    if (form.reference.trim() && duplicateReference) {
      setFormError("This maintenance reference already exists.");
      return;
    }

    const recordToSave = {
      ...form,
      reference:
        form.reference.trim() ||
        `MNT-${new Date().getFullYear()}-${String(
          Date.now()
        ).slice(-6)}`,
      assetName: form.assetName.trim(),
      assetCode: form.assetCode.trim(),
      provider: form.provider.trim(),
      estimatedCost,
      actualCost,
    };

    if (editingId !== null) {
      setRecords((previous) =>
        previous.map((record) =>
          record.id === editingId
            ? { ...record, ...recordToSave }
            : record
        )
      );
    } else {
      setRecords((previous) => [
        { ...recordToSave, id: Date.now() },
        ...previous,
      ]);
    }

    closeModal();
  };

  const deleteRecord = (record) => {
    const confirmed = window.confirm(
      `Delete maintenance record ${record.reference}?`
    );

    if (!confirmed) return;

    setRecords((previous) =>
      previous.filter((item) => item.id !== record.id)
    );
  };

  const exportCSV = () => {
    const headers = [
      "Reference",
      "Asset Name",
      "Asset Code",
      "Type",
      "Priority",
      "Reported Date",
      "Due Date",
      "Service Provider",
      "Estimated Cost",
      "Actual Cost",
      "Status",
      "Description",
      "Resolution",
      "Next Service Date",
    ];

    const rows = filteredRecords.map((record) => [
      record.reference,
      record.assetName,
      record.assetCode,
      record.type,
      record.priority,
      record.reportedDate,
      record.dueDate,
      record.provider,
      record.estimatedCost,
      record.actualCost,
      record.status,
      record.description,
      record.resolution,
      record.nextServiceDate,
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
    link.download = "asset-maintenance-records.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const statusClass = (status) =>
    status.toLowerCase().replace(/\s+/g, "-");

  const priorityClass = (priority) => priority.toLowerCase();

  const isOverdue = (record) =>
    record.status !== "Completed" &&
    record.dueDate &&
    record.dueDate < todayISO();

  return (
    <div className="asset-maintenance-page">
      <div className="am-page-header">
        <div>
          <div className="am-eyebrow">HR / ASSET MANAGEMENT</div>
          <h1>Maintenance &amp; Incidents</h1>
          <p>
            Manage asset servicing, repairs, breakdowns, incidents and costs.
          </p>
        </div>

        <div className="am-header-actions">
          <button
            type="button"
            className="am-btn am-btn-secondary"
            onClick={exportCSV}
          >
            <FiDownload /> Export CSV
          </button>
          <button
            type="button"
            className="am-btn am-btn-primary"
            onClick={openCreateModal}
          >
            <FiPlus /> Add Record
          </button>
        </div>
      </div>

      <div className="am-stats-grid">
        <div className="am-stat-card">
          <div className="am-stat-icon am-icon-blue">
            <FiTool />
          </div>
          <div>
            <span>Open Records</span>
            <strong>{stats.open}</strong>
          </div>
        </div>

        <div className="am-stat-card">
          <div className="am-stat-icon am-icon-orange">
            <FiClock />
          </div>
          <div>
            <span>In Progress</span>
            <strong>{stats.inProgress}</strong>
          </div>
        </div>

        <div className="am-stat-card">
          <div className="am-stat-icon am-icon-red">
            <FiAlertCircle />
          </div>
          <div>
            <span>Overdue</span>
            <strong>{stats.overdue}</strong>
          </div>
        </div>

        <div className="am-stat-card">
          <div className="am-stat-icon am-icon-green">
            <FiCheckCircle />
          </div>
          <div>
            <span>Completed</span>
            <strong>{stats.completed}</strong>
          </div>
        </div>

        <div className="am-stat-card">
          <div className="am-stat-icon am-icon-purple">
            <FiDollarSign />
          </div>
          <div>
            <span>Total Actual Cost</span>
            <strong>{money(stats.totalActualCost)}</strong>
          </div>
        </div>
      </div>

      <div className="am-toolbar">
        <div className="am-search">
          <FiSearch />
          <input
            type="search"
            placeholder="Search reference, asset, provider..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <select
          aria-label="Filter by type"
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
        >
          <option value="All">All Types</option>
          <option value="Scheduled Service">Scheduled Service</option>
          <option value="Repair">Repair</option>
          <option value="Breakdown">Breakdown</option>
          <option value="Accident">Accident</option>
          <option value="Damage">Damage</option>
          <option value="Inspection">Inspection</option>
        </select>

        <select
          aria-label="Filter by priority"
          value={priorityFilter}
          onChange={(event) => setPriorityFilter(event.target.value)}
        >
          <option value="All">All Priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      <div className="am-table-card">
        <div className="am-table-heading">
          <div>
            <h2>Maintenance Records</h2>
            <p>
              Showing {filteredRecords.length} of {records.length} records
            </p>
          </div>
        </div>

        <div className="am-table-wrap">
          <table className="am-table">
            <thead>
              <tr>
                <th>Reference / Asset</th>
                <th>Type / Priority</th>
                <th>Reported / Due</th>
                <th>Provider</th>
                <th>Estimated / Actual</th>
                <th>Status</th>
                <th>Next Service</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredRecords.map((record) => (
                <tr key={record.id}>
                  <td>
                    <div className="am-reference">
                      {record.reference}
                    </div>
                    <div className="am-asset-name">
                      {record.assetCode === "VEH-001" ? (
                        <FiTruck />
                      ) : (
                        <FiPackage />
                      )}
                      <span>{record.assetName}</span>
                    </div>
                    <div className="am-muted">{record.assetCode}</div>
                    <div className="am-description">
                      {record.description || "—"}
                    </div>
                    {isOverdue(record) && (
                      <span className="am-overdue-label">
                        <FiAlertCircle /> Overdue
                      </span>
                    )}
                  </td>

                  <td>
                    <div className="am-cell-main">{record.type}</div>
                    <span
                      className={`am-priority am-priority-${priorityClass(
                        record.priority
                      )}`}
                    >
                      {record.priority} priority
                    </span>
                  </td>

                  <td>
                    <div className="am-date">
                      <span>Reported</span>
                      {record.reportedDate || "—"}
                    </div>
                    <div className="am-date">
                      <span>Due</span>
                      {record.dueDate || "—"}
                    </div>
                  </td>

                  <td>{record.provider || "—"}</td>

                  <td>
                    <div className="am-cost">
                      <span>Est.</span>
                      {money(record.estimatedCost)}
                    </div>
                    <div className="am-cost">
                      <span>Actual</span>
                      {money(record.actualCost)}
                    </div>
                  </td>

                  <td>
                    <span
                      className={`am-status am-status-${statusClass(
                        record.status
                      )}`}
                    >
                      {record.status}
                    </span>
                  </td>

                  <td>
                    <div className="am-next-service">
                      <FiCalendar />
                      {record.nextServiceDate || "Not scheduled"}
                    </div>
                  </td>

                  <td>
                    <div className="am-row-actions">
                      <button
                        type="button"
                        className="am-action-btn"
                        title="Edit record"
                        aria-label={`Edit ${record.reference}`}
                        onClick={() => openEditModal(record)}
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        type="button"
                        className="am-action-btn am-delete-btn"
                        title="Delete record"
                        aria-label={`Delete ${record.reference}`}
                        onClick={() => deleteRecord(record)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan="8" className="am-empty">
                    <FiTool />
                    <strong>No maintenance records found</strong>
                    <span>Try changing your filters or add a new record.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div
          className="am-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            className="am-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="am-modal-title"
          >
            <div className="am-modal-header">
              <div>
                <h2 id="am-modal-title">
                  {editingId !== null
                    ? "Edit Maintenance Record"
                    : "Add Maintenance Record"}
                </h2>
                <p>Enter the asset issue and maintenance details.</p>
              </div>
              <button
                type="button"
                className="am-close-btn"
                onClick={closeModal}
                aria-label="Close form"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="am-form-grid">
                <div className="am-form-group">
                  <label htmlFor="am-reference">Reference Number</label>
                  <input
                    id="am-reference"
                    name="reference"
                    value={form.reference}
                    onChange={updateField}
                    placeholder="Auto-generated if blank"
                  />
                </div>

                <div className="am-form-group">
                  <label htmlFor="am-asset-code">Asset Code *</label>
                  <input
                    id="am-asset-code"
                    name="assetCode"
                    value={form.assetCode}
                    onChange={updateField}
                    placeholder="e.g. AST-001"
                    required
                  />
                </div>

                <div className="am-form-group am-form-full">
                  <label htmlFor="am-asset-name">Asset / Vehicle Name *</label>
                  <input
                    id="am-asset-name"
                    name="assetName"
                    value={form.assetName}
                    onChange={updateField}
                    placeholder="Enter the asset or vehicle name"
                    required
                  />
                </div>

                <div className="am-form-group">
                  <label htmlFor="am-type">Record Type *</label>
                  <select
                    id="am-type"
                    name="type"
                    value={form.type}
                    onChange={updateField}
                    required
                  >
                    <option>Scheduled Service</option>
                    <option>Repair</option>
                    <option>Breakdown</option>
                    <option>Accident</option>
                    <option>Damage</option>
                    <option>Inspection</option>
                  </select>
                </div>

                <div className="am-form-group">
                  <label htmlFor="am-priority">Priority *</label>
                  <select
                    id="am-priority"
                    name="priority"
                    value={form.priority}
                    onChange={updateField}
                    required
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>

                <div className="am-form-group">
                  <label htmlFor="am-reported-date">Reported Date *</label>
                  <input
                    id="am-reported-date"
                    type="date"
                    name="reportedDate"
                    value={form.reportedDate}
                    onChange={updateField}
                    required
                  />
                </div>

                <div className="am-form-group">
                  <label htmlFor="am-due-date">Target Completion Date</label>
                  <input
                    id="am-due-date"
                    type="date"
                    name="dueDate"
                    value={form.dueDate}
                    onChange={updateField}
                    min={form.reportedDate || undefined}
                  />
                </div>

                <div className="am-form-group am-form-full">
                  <label htmlFor="am-provider">Service Provider / Technician</label>
                  <input
                    id="am-provider"
                    name="provider"
                    value={form.provider}
                    onChange={updateField}
                    placeholder="Vendor or internal team"
                  />
                </div>

                <div className="am-form-group">
                  <label htmlFor="am-estimated-cost">Estimated Cost (₹)</label>
                  <input
                    id="am-estimated-cost"
                    type="number"
                    name="estimatedCost"
                    min="0"
                    step="0.01"
                    value={form.estimatedCost}
                    onChange={updateField}
                    placeholder="0.00"
                  />
                </div>

                <div className="am-form-group">
                  <label htmlFor="am-actual-cost">Actual Cost (₹)</label>
                  <input
                    id="am-actual-cost"
                    type="number"
                    name="actualCost"
                    min="0"
                    step="0.01"
                    value={form.actualCost}
                    onChange={updateField}
                    placeholder="0.00"
                  />
                </div>

                <div className="am-form-group">
                  <label htmlFor="am-status">Status *</label>
                  <select
                    id="am-status"
                    name="status"
                    value={form.status}
                    onChange={updateField}
                    required
                  >
                    <option>Open</option>
                    <option>In Progress</option>
                    <option>Completed</option>
                    <option>Cancelled</option>
                  </select>
                </div>

                <div className="am-form-group">
                  <label htmlFor="am-next-service">Next Service Date</label>
                  <input
                    id="am-next-service"
                    type="date"
                    name="nextServiceDate"
                    value={form.nextServiceDate}
                    onChange={updateField}
                  />
                </div>

                <div className="am-form-group am-form-full">
                  <label htmlFor="am-description">Issue / Work Description *</label>
                  <textarea
                    id="am-description"
                    name="description"
                    value={form.description}
                    onChange={updateField}
                    rows="3"
                    placeholder="Describe the repair, incident or service required"
                    required
                  />
                </div>

                <div className="am-form-group am-form-full">
                  <label htmlFor="am-resolution">Resolution / Work Completed</label>
                  <textarea
                    id="am-resolution"
                    name="resolution"
                    value={form.resolution}
                    onChange={updateField}
                    rows="3"
                    placeholder="Record the work performed and resolution"
                  />
                </div>
              </div>

              {formError && (
                <div className="am-form-error">
                  <FiAlertCircle />
                  {formError}
                </div>
              )}

              <div className="am-modal-footer">
                <button
                  type="button"
                  className="am-btn am-btn-secondary"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button type="submit" className="am-btn am-btn-primary">
                  {editingId !== null ? "Save Changes" : "Create Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
