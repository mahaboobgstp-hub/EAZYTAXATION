
import React, { useMemo, useState } from "react";
import {
  FiSearch,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiDownload,
  FiX,
  FiPackage,
  FiMonitor,
  FiSmartphone,
  FiTruck,
  FiTool,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
} from "react-icons/fi";
import "../../css/hr/AssetRegister.css";

const ASSET_CATEGORIES = [
  "Laptop",
  "Desktop",
  "Mobile",
  "Tablet",
  "Monitor",
  "Vehicle",
  "Tools & Equipment",
  "Uniform",
  "ID Card",
  "Other",
];

const ASSET_STATUSES = [
  "Available",
  "Assigned",
  "Under Maintenance",
  "Retired",
  "Lost",
];

const EMPTY_FORM = {
  asset_code: "",
  asset_name: "",
  category: "Laptop",
  brand: "",
  model: "",
  serial_number: "",
  purchase_date: "",
  purchase_cost: "",
  condition: "Good",
  status: "Available",
  location_id: "",
  assigned_employee: "",
  warranty_expiry: "",
  notes: "",
};

const INITIAL_ASSETS = [
  {
    id: 1,
    asset_code: "AST-0001",
    asset_name: "Office Laptop",
    category: "Laptop",
    brand: "Dell",
    model: "Latitude",
    serial_number: "DELL-LT-1001",
    purchase_date: "2026-01-10",
    purchase_cost: "65000",
    condition: "Good",
    status: "Assigned",
    location_id: "LOC-001",
    assigned_employee: "Arun Kumar",
    warranty_expiry: "2029-01-09",
    notes: "",
  },
  {
    id: 2,
    asset_code: "AST-0002",
    asset_name: "Office Mobile",
    category: "Mobile",
    brand: "Samsung",
    model: "Galaxy",
    serial_number: "SAM-MB-1002",
    purchase_date: "2026-02-15",
    purchase_cost: "28000",
    condition: "Good",
    status: "Available",
    location_id: "LOC-001",
    assigned_employee: "",
    warranty_expiry: "2028-02-14",
    notes: "",
  },
  {
    id: 3,
    asset_code: "AST-0003",
    asset_name: "Company Vehicle",
    category: "Vehicle",
    brand: "Maruti Suzuki",
    model: "Swift",
    serial_number: "CHASSIS-DEMO-003",
    purchase_date: "2025-06-20",
    purchase_cost: "750000",
    condition: "Fair",
    status: "Under Maintenance",
    location_id: "LOC-002",
    assigned_employee: "",
    warranty_expiry: "",
    notes: "Sample vehicle record",
  },
  {
    id: 4,
    asset_code: "AST-0004",
    asset_name: "Office Monitor",
    category: "Monitor",
    brand: "LG",
    model: "24-inch",
    serial_number: "LG-MN-1004",
    purchase_date: "2026-03-05",
    purchase_cost: "12000",
    condition: "Good",
    status: "Available",
    location_id: "LOC-001",
    assigned_employee: "",
    warranty_expiry: "",
    notes: "",
  },
];

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const categoryIcon = (category) => {
  if (category === "Laptop" || category === "Desktop" || category === "Monitor") {
    return <FiMonitor />;
  }
  if (category === "Mobile" || category === "Tablet") {
    return <FiSmartphone />;
  }
  if (category === "Vehicle") return <FiTruck />;
  if (category === "Tools & Equipment") return <FiTool />;
  return <FiPackage />;
};

function AssetRegister() {
  const [assets, setAssets] = useState(INITIAL_ASSETS);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filteredAssets = useMemo(() => {
    const term = search.trim().toLowerCase();

    return assets.filter((asset) => {
      const matchesSearch =
        !term ||
        [
          asset.asset_code,
          asset.asset_name,
          asset.category,
          asset.brand,
          asset.model,
          asset.serial_number,
          asset.assigned_employee,
          asset.location_id,
        ].some((value) => String(value || "").toLowerCase().includes(term));

      const matchesCategory =
        categoryFilter === "All" || asset.category === categoryFilter;

      const matchesStatus =
        statusFilter === "All" || asset.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [assets, search, categoryFilter, statusFilter]);

  const stats = useMemo(
    () => ({
      total: assets.length,
      available: assets.filter((a) => a.status === "Available").length,
      assigned: assets.filter((a) => a.status === "Assigned").length,
      maintenance: assets.filter((a) => a.status === "Under Maintenance").length,
      cost: assets.reduce((sum, a) => sum + (Number(a.purchase_cost) || 0), 0),
    }),
    [assets]
  );

  const openAddForm = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      asset_code: `AST-${String(
        Math.max(0, ...assets.map((a) => Number(a.id))) + 1
      ).padStart(4, "0")}`,
    });
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (asset) => {
    setEditingId(asset.id);
    setForm({ ...EMPTY_FORM, ...asset });
    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
  };

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const saveAsset = (event) => {
    event.preventDefault();
    setFormError("");

    if (!form.asset_code.trim() || !form.asset_name.trim()) {
      setFormError("Asset code and asset name are required.");
      return;
    }

    const duplicateCode = assets.some(
      (asset) =>
        asset.asset_code.trim().toLowerCase() ===
          form.asset_code.trim().toLowerCase() &&
        asset.id !== editingId
    );

    if (duplicateCode) {
      setFormError("This asset code already exists. Use a unique code.");
      return;
    }

    const duplicateSerial =
      form.serial_number.trim() &&
      assets.some(
        (asset) =>
          asset.serial_number.trim().toLowerCase() ===
            form.serial_number.trim().toLowerCase() &&
          asset.id !== editingId
      );

    if (duplicateSerial) {
      setFormError("This serial number already exists.");
      return;
    }

    if (Number(form.purchase_cost) < 0) {
      setFormError("Purchase cost cannot be negative.");
      return;
    }

    const cleanedForm = {
      ...form,
      asset_code: form.asset_code.trim(),
      asset_name: form.asset_name.trim(),
      serial_number: form.serial_number.trim(),
      purchase_cost: form.purchase_cost === "" ? "" : String(Number(form.purchase_cost)),
      assigned_employee:
        form.status === "Assigned" ? form.assigned_employee.trim() : "",
    };

    if (editingId !== null) {
      setAssets((current) =>
        current.map((asset) =>
          asset.id === editingId ? { ...asset, ...cleanedForm } : asset
        )
      );
    } else {
      setAssets((current) => [
        { ...cleanedForm, id: Date.now() },
        ...current,
      ]);
    }

    closeForm();
  };

  const deleteAsset = () => {
    if (deleteTarget === null) return;

    setAssets((current) =>
      current.filter((asset) => asset.id !== deleteTarget)
    );
    setDeleteTarget(null);
  };

  const exportCsv = () => {
    const columns = [
      ["Asset Code", "asset_code"],
      ["Asset Name", "asset_name"],
      ["Category", "category"],
      ["Brand", "brand"],
      ["Model", "model"],
      ["Serial Number", "serial_number"],
      ["Purchase Date", "purchase_date"],
      ["Purchase Cost", "purchase_cost"],
      ["Condition", "condition"],
      ["Status", "status"],
      ["Location ID", "location_id"],
      ["Assigned Employee", "assigned_employee"],
      ["Warranty Expiry", "warranty_expiry"],
      ["Notes", "notes"],
    ];

    const escapeCsv = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const rows = [
      columns.map(([label]) => escapeCsv(label)).join(","),
      ...filteredAssets.map((asset) =>
        columns.map(([, key]) => escapeCsv(asset[key])).join(",")
      ),
    ];

    const blob = new Blob(["\uFEFF" + rows.join("\r\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "eazytaxation-asset-register.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="asset-register-page">
      <div className="asset-page-header">
        <div>
          <div className="asset-breadcrumb">HR Management / Assets</div>
          <h1>Asset Register</h1>
          <p>Manage company assets and track their availability and condition.</p>
        </div>

        <div className="asset-header-actions">
          <button
            type="button"
            className="asset-btn asset-btn-secondary"
            onClick={exportCsv}
          >
            <FiDownload /> Export CSV
          </button>
          <button
            type="button"
            className="asset-btn asset-btn-primary"
            onClick={openAddForm}
          >
            <FiPlus /> Add Asset
          </button>
        </div>
      </div>

      <div className="asset-demo-notice">
        <FiAlertCircle />
        <span>
          Prototype mode: these records are sample data and are not saved to the
          database yet.
        </span>
      </div>

      <div className="asset-stat-grid">
        <div className="asset-stat-card">
          <div className="asset-stat-icon asset-icon-blue"><FiPackage /></div>
          <div>
            <span>Total Assets</span>
            <strong>{stats.total}</strong>
          </div>
        </div>
        <div className="asset-stat-card">
          <div className="asset-stat-icon asset-icon-green"><FiCheckCircle /></div>
          <div>
            <span>Available</span>
            <strong>{stats.available}</strong>
          </div>
        </div>
        <div className="asset-stat-card">
          <div className="asset-stat-icon asset-icon-purple"><FiMonitor /></div>
          <div>
            <span>Assigned</span>
            <strong>{stats.assigned}</strong>
          </div>
        </div>
        <div className="asset-stat-card">
          <div className="asset-stat-icon asset-icon-orange"><FiRefreshCw /></div>
          <div>
            <span>Under Maintenance</span>
            <strong>{stats.maintenance}</strong>
          </div>
        </div>
        <div className="asset-stat-card asset-stat-value">
          <div className="asset-stat-icon asset-icon-teal"><FiPackage /></div>
          <div>
            <span>Total Purchase Cost</span>
            <strong>{money(stats.cost)}</strong>
          </div>
        </div>
      </div>

      <div className="asset-table-card">
        <div className="asset-toolbar">
          <div className="asset-search">
            <FiSearch />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search code, asset, serial no. or employee..."
              aria-label="Search assets"
            />
          </div>

          <div className="asset-filters">
            <label>
              <span>Category</span>
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option value="All">All categories</option>
                {ASSET_CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </label>

            <label>
              <span>Status</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="All">All statuses</option>
                {ASSET_STATUSES.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>

            {(search || categoryFilter !== "All" || statusFilter !== "All") && (
              <button
                type="button"
                className="asset-clear-filters"
                onClick={() => {
                  setSearch("");
                  setCategoryFilter("All");
                  setStatusFilter("All");
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="asset-table-summary">
          <span>
            Showing <strong>{filteredAssets.length}</strong> of{" "}
            <strong>{assets.length}</strong> assets
          </span>
        </div>

        <div className="asset-table-scroll">
          <table className="asset-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Category</th>
                <th>Serial Number</th>
                <th>Location ID</th>
                <th>Assigned To</th>
                <th>Purchase Cost</th>
                <th>Condition</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => (
                <tr key={asset.id}>
                  <td>
                    <div className="asset-name-cell">
                      <div className="asset-row-icon">{categoryIcon(asset.category)}</div>
                      <div>
                        <strong>{asset.asset_name}</strong>
                        <span>{asset.asset_code}</span>
                        <small>{[asset.brand, asset.model].filter(Boolean).join(" ") || "—"}</small>
                      </div>
                    </div>
                  </td>
                  <td>{asset.category}</td>
                  <td>{asset.serial_number || "—"}</td>
                  <td>{asset.location_id || "—"}</td>
                  <td>{asset.assigned_employee || "—"}</td>
                  <td className="asset-cost-cell">{money(asset.purchase_cost)}</td>
                  <td>
                    <span className={`asset-condition condition-${asset.condition.toLowerCase()}`}>
                      {asset.condition}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`asset-status status-${asset.status
                        .toLowerCase()
                        .replace(/\s+/g, "-")}`}
                    >
                      {asset.status}
                    </span>
                  </td>
                  <td>
                    <div className="asset-row-actions">
                      <button
                        type="button"
                        className="asset-icon-btn"
                        onClick={() => openEditForm(asset)}
                        title="Edit asset"
                        aria-label={`Edit ${asset.asset_name}`}
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        type="button"
                        className="asset-icon-btn asset-delete-btn"
                        onClick={() => setDeleteTarget(asset.id)}
                        title="Delete asset"
                        aria-label={`Delete ${asset.asset_name}`}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredAssets.length === 0 && (
                <tr>
                  <td colSpan="9">
                    <div className="asset-empty-state">
                      <FiPackage />
                      <strong>No assets found</strong>
                      <span>Try changing your search or filters.</span>
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
          className="asset-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm();
          }}
        >
          <div
            className="asset-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="asset-form-title"
          >
            <div className="asset-modal-header">
              <div>
                <h2 id="asset-form-title">
                  {editingId !== null ? "Edit Asset" : "Add New Asset"}
                </h2>
                <p>Enter the asset details below.</p>
              </div>
              <button
                type="button"
                className="asset-icon-btn"
                onClick={closeForm}
                aria-label="Close form"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={saveAsset}>
              <div className="asset-form-grid">
                <label>
                  Asset Code <span>*</span>
                  <input
                    name="asset_code"
                    value={form.asset_code}
                    onChange={updateField}
                    required
                    maxLength={40}
                    placeholder="AST-0005"
                  />
                </label>

                <label>
                  Asset Name <span>*</span>
                  <input
                    name="asset_name"
                    value={form.asset_name}
                    onChange={updateField}
                    required
                    maxLength={120}
                    placeholder="e.g. Finance Laptop"
                  />
                </label>

                <label>
                  Category <span>*</span>
                  <select name="category" value={form.category} onChange={updateField} required>
                    {ASSET_CATEGORIES.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Status <span>*</span>
                  <select name="status" value={form.status} onChange={updateField} required>
                    {ASSET_STATUSES.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Brand
                  <input name="brand" value={form.brand} onChange={updateField} maxLength={80} />
                </label>

                <label>
                  Model
                  <input name="model" value={form.model} onChange={updateField} maxLength={80} />
                </label>

                <label>
                  Serial Number
                  <input name="serial_number" value={form.serial_number} onChange={updateField} maxLength={120} />
                </label>

                <label>
                  Condition <span>*</span>
                  <select name="condition" value={form.condition} onChange={updateField} required>
                    <option>New</option>
                    <option>Good</option>
                    <option>Fair</option>
                    <option>Damaged</option>
                  </select>
                </label>

                <label>
                  Purchase Date
                  <input
                    type="date"
                    name="purchase_date"
                    value={form.purchase_date}
                    onChange={updateField}
                  />
                </label>

                <label>
                  Purchase Cost (₹)
                  <input
                    type="number"
                    name="purchase_cost"
                    min="0"
                    step="0.01"
                    value={form.purchase_cost}
                    onChange={updateField}
                    placeholder="0.00"
                  />
                </label>

                <label>
                  Warranty Expiry
                  <input
                    type="date"
                    name="warranty_expiry"
                    value={form.warranty_expiry}
                    onChange={updateField}
                  />
                </label>

                <label>
                  Location ID
                  <input
                    name="location_id"
                    value={form.location_id}
                    onChange={updateField}
                    maxLength={80}
                    placeholder="Select a location during integration"
                  />
                </label>

                {form.status === "Assigned" && (
                  <label className="asset-full-width">
                    Assigned Employee
                    <input
                      name="assigned_employee"
                      value={form.assigned_employee}
                      onChange={updateField}
                      maxLength={120}
                      placeholder="Employee name (temporary prototype field)"
                    />
                    <small>
                      In the database version, this will reference the existing employee record.
                    </small>
                  </label>
                )}

                <label className="asset-full-width">
                  Notes
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={updateField}
                    rows="3"
                    maxLength={1000}
                    placeholder="Additional details, specifications or remarks..."
                  />
                </label>
              </div>

              {formError && (
                <div className="asset-form-error" role="alert">
                  <FiAlertCircle /> {formError}
                </div>
              )}

              <div className="asset-modal-footer">
                <button type="button" className="asset-btn asset-btn-secondary" onClick={closeForm}>
                  Cancel
                </button>
                <button type="submit" className="asset-btn asset-btn-primary">
                  {editingId !== null ? "Save Changes" : "Add Asset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget !== null && (
        <div className="asset-modal-backdrop">
          <div className="asset-confirm-modal" role="dialog" aria-modal="true">
            <div className="asset-confirm-icon"><FiTrash2 /></div>
            <h2>Delete this asset?</h2>
            <p>
              This removes the asset from this prototype's current list. In the
              database version, deletion rules must protect assignment history.
            </p>
            <div className="asset-modal-footer">
              <button
                type="button"
                className="asset-btn asset-btn-secondary"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="asset-btn asset-btn-danger"
                onClick={deleteAsset}
              >
                Delete Asset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AssetRegister;
