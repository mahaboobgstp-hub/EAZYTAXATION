
import React, { useMemo, useState } from "react";
import {
  FiSearch,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiDownload,
  FiX,
  FiAlertCircle,
  FiTruck,
  FiCalendar,
  FiTool,
  FiCheckCircle,
  FiClock,
} from "react-icons/fi";
import "../../css/hr/VehicleManagement.css";

const INITIAL_VEHICLES = [
  {
    id: 1,
    vehicle_code: "VEH-0001",
    registration_number: "AP 26 AB 1234",
    vehicle_type: "Car",
    make: "Maruti Suzuki",
    model: "Swift",
    fuel_type: "Petrol",
    purchase_date: "2025-06-20",
    purchase_cost: "750000",
    status: "Available",
    employee_id: "",
    employee_name: "",
    location_id: "LOC-001",
    insurance_expiry: "2027-06-19",
    puc_expiry: "2026-11-30",
    permit_expiry: "",
    fitness_expiry: "",
    last_service_date: "2026-08-15",
    next_service_date: "2026-11-15",
    odometer_km: "18500",
    notes: "",
  },
  {
    id: 2,
    vehicle_code: "VEH-0002",
    registration_number: "AP 26 CD 5678",
    vehicle_type: "Two-wheeler",
    make: "Honda",
    model: "Activa",
    fuel_type: "Petrol",
    purchase_date: "2026-02-10",
    purchase_cost: "95000",
    status: "Assigned",
    employee_id: "EMP-002",
    employee_name: "Priya Sharma",
    location_id: "LOC-001",
    insurance_expiry: "2027-02-09",
    puc_expiry: "2026-10-25",
    permit_expiry: "",
    fitness_expiry: "",
    last_service_date: "2026-07-10",
    next_service_date: "2026-10-20",
    odometer_km: "6200",
    notes: "",
  },
  {
    id: 3,
    vehicle_code: "VEH-0003",
    registration_number: "AP 26 EF 9012",
    vehicle_type: "Van",
    make: "Tata",
    model: "Ace",
    fuel_type: "Diesel",
    purchase_date: "2024-04-12",
    purchase_cost: "550000",
    status: "Under Maintenance",
    employee_id: "",
    employee_name: "",
    location_id: "LOC-002",
    insurance_expiry: "2027-04-11",
    puc_expiry: "2027-01-31",
    permit_expiry: "2027-04-11",
    fitness_expiry: "2027-04-11",
    last_service_date: "2026-09-20",
    next_service_date: "2026-10-15",
    odometer_km: "42000",
    notes: "Sample vehicle record",
  },
];

const VEHICLE_TYPES = [
  "Car",
  "Two-wheeler",
  "Van",
  "Truck",
  "Bus",
  "Other",
];

const VEHICLE_STATUSES = [
  "Available",
  "Assigned",
  "Under Maintenance",
  "Retired",
];

const EMPTY_FORM = {
  vehicle_code: "",
  registration_number: "",
  vehicle_type: "Car",
  make: "",
  model: "",
  fuel_type: "Petrol",
  purchase_date: "",
  purchase_cost: "",
  status: "Available",
  employee_id: "",
  employee_name: "",
  location_id: "",
  insurance_expiry: "",
  puc_expiry: "",
  permit_expiry: "",
  fitness_expiry: "",
  last_service_date: "",
  next_service_date: "",
  odometer_km: "",
  notes: "",
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

function getDocumentStatus(dateValue) {
  if (!dateValue) return "Not Set";

  const today = new Date(`${todayISO()}T00:00:00`);
  const expiry = new Date(`${dateValue}T00:00:00`);
  const days = Math.ceil((expiry - today) / 86400000);

  if (days < 0) return "Expired";
  if (days <= 30) return "Due Soon";
  return "Valid";
}

function VehicleManagement() {
  const [vehicles, setVehicles] = useState(INITIAL_VEHICLES);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filteredVehicles = useMemo(() => {
    const term = search.trim().toLowerCase();

    return vehicles.filter((vehicle) => {
      const matchesSearch =
        !term ||
        [
          vehicle.vehicle_code,
          vehicle.registration_number,
          vehicle.vehicle_type,
          vehicle.make,
          vehicle.model,
          vehicle.employee_name,
          vehicle.employee_id,
          vehicle.location_id,
        ].some((value) => String(value || "").toLowerCase().includes(term));

      return (
        matchesSearch &&
        (typeFilter === "All" || vehicle.vehicle_type === typeFilter) &&
        (statusFilter === "All" || vehicle.status === statusFilter)
      );
    });
  }, [vehicles, search, typeFilter, statusFilter]);

  const stats = useMemo(() => {
    const documentFields = [
      "insurance_expiry",
      "puc_expiry",
      "permit_expiry",
      "fitness_expiry",
    ];

    let expired = 0;
    let dueSoon = 0;

    vehicles.forEach((vehicle) => {
      documentFields.forEach((field) => {
        const status = getDocumentStatus(vehicle[field]);
        if (status === "Expired") expired += 1;
        if (status === "Due Soon") dueSoon += 1;
      });
    });

    return {
      total: vehicles.length,
      available: vehicles.filter((v) => v.status === "Available").length,
      assigned: vehicles.filter((v) => v.status === "Assigned").length,
      maintenance: vehicles.filter(
        (v) => v.status === "Under Maintenance"
      ).length,
      expired,
      dueSoon,
      purchaseCost: vehicles.reduce(
        (sum, v) => sum + (Number(v.purchase_cost) || 0),
        0
      ),
    };
  }, [vehicles]);

  const openAddForm = () => {
    setEditingId(null);
    const nextNumber =
      Math.max(
        0,
        ...vehicles.map(
          (v) => Number(v.vehicle_code.replace("VEH-", "")) || 0
        )
      ) + 1;

    setForm({
      ...EMPTY_FORM,
      vehicle_code: `VEH-${String(nextNumber).padStart(4, "0")}`,
    });
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (vehicle) => {
    setEditingId(vehicle.id);
    setForm({ ...EMPTY_FORM, ...vehicle });
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

  const saveVehicle = (event) => {
    event.preventDefault();
    setFormError("");

    if (!form.vehicle_code.trim() || !form.registration_number.trim()) {
      setFormError("Vehicle code and registration number are required.");
      return;
    }

    const duplicateRegistration = vehicles.some(
      (vehicle) =>
        vehicle.registration_number.trim().toLowerCase() ===
          form.registration_number.trim().toLowerCase() &&
        vehicle.id !== editingId
    );

    if (duplicateRegistration) {
      setFormError("This registration number already exists.");
      return;
    }

    const duplicateCode = vehicles.some(
      (vehicle) =>
        vehicle.vehicle_code.trim().toLowerCase() ===
          form.vehicle_code.trim().toLowerCase() &&
        vehicle.id !== editingId
    );

    if (duplicateCode) {
      setFormError("This vehicle code already exists.");
      return;
    }

    if (Number(form.purchase_cost) < 0 || Number(form.odometer_km) < 0) {
      setFormError("Purchase cost and odometer reading cannot be negative.");
      return;
    }

    if (
      form.status === "Assigned" &&
      (!form.employee_id.trim() || !form.employee_name.trim())
    ) {
      setFormError(
        "Enter both employee ID and employee name for an assigned vehicle."
      );
      return;
    }

    const payload = {
      ...form,
      vehicle_code: form.vehicle_code.trim(),
      registration_number: form.registration_number.trim().toUpperCase(),
      employee_id:
        form.status === "Assigned" ? form.employee_id.trim() : "",
      employee_name:
        form.status === "Assigned" ? form.employee_name.trim() : "",
      purchase_cost:
        form.purchase_cost === "" ? "" : String(Number(form.purchase_cost)),
      odometer_km:
        form.odometer_km === "" ? "" : String(Number(form.odometer_km)),
    };

    if (editingId !== null) {
      setVehicles((current) =>
        current.map((vehicle) =>
          vehicle.id === editingId ? { ...vehicle, ...payload } : vehicle
        )
      );
    } else {
      setVehicles((current) => [{ ...payload, id: Date.now() }, ...current]);
    }

    closeForm();
  };

  const deleteVehicle = () => {
    if (deleteTarget === null) return;
    setVehicles((current) =>
      current.filter((vehicle) => vehicle.id !== deleteTarget)
    );
    setDeleteTarget(null);
  };

  const exportCsv = () => {
    const columns = [
      ["Vehicle Code", "vehicle_code"],
      ["Registration Number", "registration_number"],
      ["Vehicle Type", "vehicle_type"],
      ["Make", "make"],
      ["Model", "model"],
      ["Fuel Type", "fuel_type"],
      ["Purchase Date", "purchase_date"],
      ["Purchase Cost", "purchase_cost"],
      ["Status", "status"],
      ["Employee ID", "employee_id"],
      ["Employee Name", "employee_name"],
      ["Location ID", "location_id"],
      ["Insurance Expiry", "insurance_expiry"],
      ["PUC Expiry", "puc_expiry"],
      ["Permit Expiry", "permit_expiry"],
      ["Fitness Expiry", "fitness_expiry"],
      ["Last Service Date", "last_service_date"],
      ["Next Service Date", "next_service_date"],
      ["Odometer KM", "odometer_km"],
      ["Notes", "notes"],
    ];

    const escapeCsv = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const rows = [
      columns.map(([label]) => escapeCsv(label)).join(","),
      ...filteredVehicles.map((vehicle) =>
        columns.map(([, key]) => escapeCsv(vehicle[key])).join(",")
      ),
    ];

    const blob = new Blob(["\uFEFF" + rows.join("\r\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "eazytaxation-vehicle-register.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="vehicle-management-page">
      <div className="vehicle-page-header">
        <div>
          <div className="vehicle-breadcrumb">
            HR Management / Assets / Vehicles
          </div>
          <h1>Vehicle Management</h1>
          <p>
            Manage company vehicles, employee allocation, documents and
            servicing schedules.
          </p>
        </div>

        <div className="vehicle-header-actions">
          <button
            type="button"
            className="vehicle-btn vehicle-btn-secondary"
            onClick={exportCsv}
          >
            <FiDownload /> Export CSV
          </button>
          <button
            type="button"
            className="vehicle-btn vehicle-btn-primary"
            onClick={openAddForm}
          >
            <FiPlus /> Add Vehicle
          </button>
        </div>
      </div>

      <div className="vehicle-demo-notice">
        <FiAlertCircle />
        <span>
          Prototype mode: data is stored in page state only. Documents and
          servicing reminders are not yet connected to a database or
          notification service.
        </span>
      </div>

      <div className="vehicle-stat-grid">
        <div className="vehicle-stat-card">
          <div className="vehicle-stat-icon vehicle-blue"><FiTruck /></div>
          <div><span>Total Vehicles</span><strong>{stats.total}</strong></div>
        </div>
        <div className="vehicle-stat-card">
          <div className="vehicle-stat-icon vehicle-green"><FiCheckCircle /></div>
          <div><span>Available</span><strong>{stats.available}</strong></div>
        </div>
        <div className="vehicle-stat-card">
          <div className="vehicle-stat-icon vehicle-purple"><FiCalendar /></div>
          <div><span>Assigned</span><strong>{stats.assigned}</strong></div>
        </div>
        <div className="vehicle-stat-card">
          <div className="vehicle-stat-icon vehicle-orange"><FiTool /></div>
          <div><span>Under Maintenance</span><strong>{stats.maintenance}</strong></div>
        </div>
        <div className="vehicle-stat-card">
          <div className="vehicle-stat-icon vehicle-red"><FiAlertCircle /></div>
          <div><span>Expired Documents</span><strong>{stats.expired}</strong></div>
        </div>
        <div className="vehicle-stat-card">
          <div className="vehicle-stat-icon vehicle-yellow"><FiClock /></div>
          <div><span>Documents Due in 30 Days</span><strong>{stats.dueSoon}</strong></div>
        </div>
      </div>

      <div className="vehicle-cost-banner">
        <div>
          <span>Total recorded purchase cost</span>
          <strong>{money(stats.purchaseCost)}</strong>
        </div>
        <span className="vehicle-cost-note">
          Purchase cost only; excludes depreciation and running expenses.
        </span>
      </div>

      <div className="vehicle-table-card">
        <div className="vehicle-toolbar">
          <div className="vehicle-search">
            <FiSearch />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search registration, vehicle or employee..."
              aria-label="Search vehicles"
            />
          </div>

          <div className="vehicle-filters">
            <label>
              Vehicle Type
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
              >
                <option value="All">All types</option>
                {VEHICLE_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
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
                {VEHICLE_STATUSES.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>

            {(search || typeFilter !== "All" || statusFilter !== "All") && (
              <button
                type="button"
                className="vehicle-clear"
                onClick={() => {
                  setSearch("");
                  setTypeFilter("All");
                  setStatusFilter("All");
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="vehicle-table-summary">
          Showing <strong>{filteredVehicles.length}</strong> of{" "}
          <strong>{vehicles.length}</strong> vehicles
        </div>

        <div className="vehicle-table-scroll">
          <table className="vehicle-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Type / Fuel</th>
                <th>Assigned Employee</th>
                <th>Location ID</th>
                <th>Insurance</th>
                <th>PUC</th>
                <th>Next Service</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map((vehicle) => {
                const insuranceStatus = getDocumentStatus(vehicle.insurance_expiry);
                const pucStatus = getDocumentStatus(vehicle.puc_expiry);

                return (
                  <tr key={vehicle.id}>
                    <td>
                      <div className="vehicle-name-cell">
                        <div className="vehicle-row-icon"><FiTruck /></div>
                        <div>
                          <strong>{vehicle.registration_number}</strong>
                          <span>{vehicle.vehicle_code}</span>
                          <small>{vehicle.make} {vehicle.model}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="vehicle-primary-cell">
                        <strong>{vehicle.vehicle_type}</strong>
                        <span>{vehicle.fuel_type}</span>
                      </div>
                    </td>
                    <td>
                      {vehicle.employee_name ? (
                        <div className="vehicle-primary-cell">
                          <strong>{vehicle.employee_name}</strong>
                          <span>{vehicle.employee_id}</span>
                        </div>
                      ) : "—"}
                    </td>
                    <td>{vehicle.location_id || "—"}</td>
                    <td>
                      <div className="vehicle-document-cell">
                        <span>{formatDate(vehicle.insurance_expiry)}</span>
                        <span className={`vehicle-doc-status doc-${insuranceStatus.toLowerCase().replace(/\s+/g, "-")}`}>
                          {insuranceStatus}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="vehicle-document-cell">
                        <span>{formatDate(vehicle.puc_expiry)}</span>
                        <span className={`vehicle-doc-status doc-${pucStatus.toLowerCase().replace(/\s+/g, "-")}`}>
                          {pucStatus}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={
                        vehicle.next_service_date &&
                        vehicle.next_service_date < todayISO()
                          ? "vehicle-service-overdue"
                          : ""
                      }>
                        {formatDate(vehicle.next_service_date)}
                      </span>
                    </td>
                    <td>
                      <span className={`vehicle-status status-${vehicle.status.toLowerCase().replace(/\s+/g, "-")}`}>
                        {vehicle.status}
                      </span>
                    </td>
                    <td>
                      <div className="vehicle-row-actions">
                        <button
                          type="button"
                          className="vehicle-icon-btn"
                          title="Edit vehicle"
                          aria-label={`Edit ${vehicle.registration_number}`}
                          onClick={() => openEditForm(vehicle)}
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          type="button"
                          className="vehicle-icon-btn vehicle-delete-btn"
                          title="Delete vehicle"
                          aria-label={`Delete ${vehicle.registration_number}`}
                          onClick={() => setDeleteTarget(vehicle.id)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredVehicles.length === 0 && (
                <tr>
                  <td colSpan="9">
                    <div className="vehicle-empty">
                      <FiTruck />
                      <strong>No vehicles found</strong>
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
          className="vehicle-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm();
          }}
        >
          <div className="vehicle-modal" role="dialog" aria-modal="true" aria-labelledby="vehicle-form-title">
            <div className="vehicle-modal-header">
              <div>
                <h2 id="vehicle-form-title">
                  {editingId !== null ? "Edit Vehicle" : "Add Vehicle"}
                </h2>
                <p>Enter vehicle, document and servicing details.</p>
              </div>
              <button type="button" className="vehicle-icon-btn" onClick={closeForm} aria-label="Close form">
                <FiX />
              </button>
            </div>

            <form onSubmit={saveVehicle}>
              <div className="vehicle-form-section">
                <h3>Vehicle Details</h3>
                <div className="vehicle-form-grid">
                  <label>Vehicle Code <span>*</span>
                    <input name="vehicle_code" value={form.vehicle_code} onChange={updateField} required maxLength={40} />
                  </label>
                  <label>Registration Number <span>*</span>
                    <input name="registration_number" value={form.registration_number} onChange={updateField} required maxLength={30} placeholder="AP 26 AB 1234" />
                  </label>
                  <label>Vehicle Type
                    <select name="vehicle_type" value={form.vehicle_type} onChange={updateField}>
                      {VEHICLE_TYPES.map((type) => <option key={type}>{type}</option>)}
                    </select>
                  </label>
                  <label>Status
                    <select name="status" value={form.status} onChange={updateField}>
                      {VEHICLE_STATUSES.map((status) => <option key={status}>{status}</option>)}
                    </select>
                  </label>
                  <label>Make
                    <input name="make" value={form.make} onChange={updateField} maxLength={80} />
                  </label>
                  <label>Model
                    <input name="model" value={form.model} onChange={updateField} maxLength={80} />
                  </label>
                  <label>Fuel Type
                    <select name="fuel_type" value={form.fuel_type} onChange={updateField}>
                      <option>Petrol</option>
                      <option>Diesel</option>
                      <option>CNG</option>
                      <option>Electric</option>
                      <option>Hybrid</option>
                      <option>Other</option>
                    </select>
                  </label>
                  <label>Purchase Date
                    <input type="date" name="purchase_date" value={form.purchase_date} onChange={updateField} />
                  </label>
                  <label>Purchase Cost (₹)
                    <input type="number" min="0" step="0.01" name="purchase_cost" value={form.purchase_cost} onChange={updateField} />
                  </label>
                  <label>Odometer (KM)
                    <input type="number" min="0" step="1" name="odometer_km" value={form.odometer_km} onChange={updateField} />
                  </label>
                </div>
              </div>

              <div className="vehicle-form-section">
                <h3>Employee & Location</h3>
                <div className="vehicle-form-grid">
                  {form.status === "Assigned" && (
                    <>
                      <label>Employee ID <span>*</span>
                        <input name="employee_id" value={form.employee_id} onChange={updateField} required maxLength={80} placeholder="Employee ID" />
                      </label>
                      <label>Employee Name <span>*</span>
                        <input name="employee_name" value={form.employee_name} onChange={updateField} required maxLength={120} placeholder="Employee name" />
                      </label>
                    </>
                  )}
                  <label>Location ID
                    <input name="location_id" value={form.location_id} onChange={updateField} maxLength={80} placeholder="Existing location reference" />
                  </label>
                </div>
              </div>

              <div className="vehicle-form-section">
                <h3>Compliance Documents</h3>
                <div className="vehicle-form-grid">
                  <label>Insurance Expiry
                    <input type="date" name="insurance_expiry" value={form.insurance_expiry} onChange={updateField} />
                  </label>
                  <label>PUC Expiry
                    <input type="date" name="puc_expiry" value={form.puc_expiry} onChange={updateField} />
                  </label>
                  <label>Permit Expiry
                    <input type="date" name="permit_expiry" value={form.permit_expiry} onChange={updateField} />
                  </label>
                  <label>Fitness Certificate Expiry
                    <input type="date" name="fitness_expiry" value={form.fitness_expiry} onChange={updateField} />
                  </label>
                </div>
              </div>

              <div className="vehicle-form-section">
                <h3>Servicing & Notes</h3>
                <div className="vehicle-form-grid">
                  <label>Last Service Date
                    <input type="date" name="last_service_date" value={form.last_service_date} onChange={updateField} />
                  </label>
                  <label>Next Service Date
                    <input type="date" name="next_service_date" value={form.next_service_date} onChange={updateField} />
                  </label>
                  <label className="vehicle-full-width">Notes
                    <textarea name="notes" value={form.notes} onChange={updateField} rows="3" maxLength={1000} placeholder="Additional details or remarks..." />
                  </label>
                </div>
              </div>

              {formError && <div className="vehicle-form-error" role="alert"><FiAlertCircle /> {formError}</div>}

              <div className="vehicle-modal-footer">
                <button type="button" className="vehicle-btn vehicle-btn-secondary" onClick={closeForm}>Cancel</button>
                <button type="submit" className="vehicle-btn vehicle-btn-primary">
                  {editingId !== null ? "Save Changes" : "Add Vehicle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget !== null && (
        <div className="vehicle-modal-backdrop">
          <div className="vehicle-confirm-modal" role="dialog" aria-modal="true">
            <div className="vehicle-confirm-icon"><FiTrash2 /></div>
            <h2>Delete this vehicle?</h2>
            <p>
              This removes the record from the prototype list. Before production,
              deletion rules should preserve assignment, maintenance and compliance history.
            </p>
            <div className="vehicle-modal-footer">
              <button type="button" className="vehicle-btn vehicle-btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button type="button" className="vehicle-btn vehicle-btn-danger" onClick={deleteVehicle}>Delete Vehicle</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VehicleManagement;
