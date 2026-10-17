
import React, { useMemo, useState } from "react";
import {
  FiPackage,
  FiUsers,
  FiTruck,
  FiTool,
  FiAlertCircle,
  FiCheckCircle,
  FiDollarSign,
  FiTrendingUp,
  FiDownload,
  FiRefreshCw,
  FiCalendar,
  FiArrowUpRight,
  FiArrowDownRight,
  FiActivity,
} from "react-icons/fi";
import "../../css/hr/AssetDashboardReports.css";

// Demonstration data only. Replace with database queries for production.
const demoAssets = [
  {
    id: 1,
    code: "AST-001",
    name: "Dell Latitude 5440",
    category: "IT Equipment",
    location: "Head Office",
    condition: "Good",
    status: "Assigned",
    cost: 68000,
  },
  {
    id: 2,
    code: "AST-002",
    name: "HP LaserJet Printer",
    category: "IT Equipment",
    location: "Head Office",
    condition: "Needs Repair",
    status: "Available",
    cost: 24000,
  },
  {
    id: 3,
    code: "AST-003",
    name: "Conference Table",
    category: "Furniture",
    location: "Branch Office",
    condition: "Good",
    status: "Available",
    cost: 32000,
  },
  {
    id: 4,
    code: "AST-004",
    name: "Office AC Unit",
    category: "Electrical",
    location: "Head Office",
    condition: "Fair",
    status: "Assigned",
    cost: 45000,
  },
  {
    id: 5,
    code: "VEH-001",
    name: "Office Van",
    category: "Vehicle",
    location: "Head Office",
    condition: "Good",
    status: "Assigned",
    cost: 850000,
  },
  {
    id: 6,
    code: "AST-006",
    name: "Office Projector",
    category: "IT Equipment",
    location: "Branch Office",
    condition: "Good",
    status: "Available",
    cost: 42000,
  },
  {
    id: 7,
    code: "AST-007",
    name: "Office Chair",
    category: "Furniture",
    location: "Head Office",
    condition: "Damaged",
    status: "Under Maintenance",
    cost: 8500,
  },
];

const demoAssignments = [
  {
    id: 1,
    assetCode: "AST-001",
    assetName: "Dell Latitude 5440",
    employee: "Rahul Kumar",
    assignedDate: "2026-08-01",
    expectedReturn: "2027-03-31",
    status: "Assigned",
  },
  {
    id: 2,
    assetCode: "AST-004",
    assetName: "Office AC Unit",
    employee: "Facilities Team",
    assignedDate: "2026-05-10",
    expectedReturn: "",
    status: "Assigned",
  },
  {
    id: 3,
    assetCode: "VEH-001",
    assetName: "Office Van",
    employee: "Arun Kumar",
    assignedDate: "2026-06-15",
    expectedReturn: "2026-10-10",
    status: "Assigned",
  },
];

const demoVehicles = [
  {
    id: 1,
    registration: "AP 39 AB 1234",
    name: "Office Van",
    status: "Active",
    insuranceExpiry: "2027-02-15",
    pucExpiry: "2026-10-20",
    nextServiceDate: "2026-10-25",
  },
  {
    id: 2,
    registration: "AP 39 CD 5678",
    name: "Company Car",
    status: "Active",
    insuranceExpiry: "2026-10-25",
    pucExpiry: "2027-01-15",
    nextServiceDate: "2026-10-12",
  },
];

const demoMaintenance = [
  {
    id: 1,
    reference: "MNT-2026-001",
    assetCode: "AST-001",
    assetName: "Dell Latitude 5440",
    type: "Repair",
    priority: "Medium",
    reportedDate: "2026-10-10",
    dueDate: "2026-10-20",
    actualCost: 2200,
    status: "Completed",
    description: "Keyboard replacement",
  },
  {
    id: 2,
    reference: "MNT-2026-002",
    assetCode: "VEH-001",
    assetName: "Office Van",
    type: "Scheduled Service",
    priority: "Low",
    reportedDate: "2026-10-12",
    dueDate: "2026-10-22",
    actualCost: 0,
    status: "In Progress",
    description: "Periodic service",
  },
  {
    id: 3,
    reference: "MNT-2026-003",
    assetCode: "AST-002",
    assetName: "HP LaserJet Printer",
    type: "Breakdown",
    priority: "High",
    reportedDate: "2026-10-14",
    dueDate: "2026-10-18",
    actualCost: 0,
    status: "Open",
    description: "Repeated paper jam",
  },
];

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const todayISO = () => new Date().toISOString().slice(0, 10);

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

const csvEscape = (value) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

function downloadCSV(filename, headers, rows) {
  const csv = [headers, ...rows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function BarList({ items, valueKey = "value", labelKey = "label" }) {
  const max = Math.max(
    1,
    ...items.map((item) => Number(item[valueKey] || 0))
  );

  if (!items.length) {
    return <div className="adr-no-data">No data available.</div>;
  }

  return (
    <div className="adr-bar-list">
      {items.map((item) => (
        <div className="adr-bar-item" key={item[labelKey]}>
          <div className="adr-bar-label">
            <span>{item[labelKey]}</span>
            <strong>{item[valueKey]}</strong>
          </div>
          <div className="adr-bar-track">
            <div
              className="adr-bar-fill"
              style={{
                width: `${Math.max(
                  Number(item[valueKey]) > 0 ? 3 : 0,
                  (Number(item[valueKey] || 0) / max) * 100
                )}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AssetDashboardReports() {
  const [assets, setAssets] = useState(demoAssets);
  const [assignments] = useState(demoAssignments);
  const [vehicles] = useState(demoVehicles);
  const [maintenance] = useState(demoMaintenance);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [reportSearch, setReportSearch] = useState("");

  const categories = useMemo(
    () => [...new Set(assets.map((asset) => asset.category))].sort(),
    [assets]
  );

  const locations = useMemo(
    () => [...new Set(assets.map((asset) => asset.location))].sort(),
    [assets]
  );

  const filteredAssets = useMemo(() => {
    const query = reportSearch.trim().toLowerCase();

    return assets.filter((asset) => {
      const matchesCategory =
        categoryFilter === "All" || asset.category === categoryFilter;
      const matchesLocation =
        locationFilter === "All" || asset.location === locationFilter;
      const matchesSearch =
        !query ||
        [asset.code, asset.name, asset.category, asset.location].some(
          (value) => String(value || "").toLowerCase().includes(query)
        );

      return matchesCategory && matchesLocation && matchesSearch;
    });
  }, [assets, categoryFilter, locationFilter, reportSearch]);

  const metrics = useMemo(() => {
    const assigned = assets.filter(
      (asset) => asset.status === "Assigned"
    ).length;
    const available = assets.filter(
      (asset) => asset.status === "Available"
    ).length;
    const underMaintenance = assets.filter(
      (asset) => asset.status === "Under Maintenance"
    ).length;
    const needsAttention = assets.filter(
      (asset) =>
        asset.condition === "Needs Repair" ||
        asset.condition === "Damaged" ||
        asset.status === "Under Maintenance"
    ).length;

    const activeMaintenance = maintenance.filter(
      (item) => item.status === "Open" || item.status === "In Progress"
    );

    const overdueMaintenance = activeMaintenance.filter(
      (item) => item.dueDate && item.dueDate < todayISO()
    );

    const completedCost = maintenance
      .filter((item) => item.status === "Completed")
      .reduce((sum, item) => sum + Number(item.actualCost || 0), 0);

    const assetValue = assets.reduce(
      (sum, asset) => sum + Number(asset.cost || 0),
      0
    );

    const assignedValue = assets
      .filter((asset) => asset.status === "Assigned")
      .reduce((sum, asset) => sum + Number(asset.cost || 0), 0);

    const maintenanceSpend = maintenance.reduce(
      (sum, item) => sum + Number(item.actualCost || 0),
      0
    );

    const openIncidents = maintenance.filter(
      (item) =>
        ["Open", "In Progress"].includes(item.status) &&
        ["Breakdown", "Accident", "Damage"].includes(item.type)
    ).length;

    return {
      total: assets.length,
      assigned,
      available,
      underMaintenance,
      needsAttention,
      activeMaintenance: activeMaintenance.length,
      overdueMaintenance: overdueMaintenance.length,
      completedCost,
      assetValue,
      assignedValue,
      maintenanceSpend,
      openIncidents,
      totalVehicles: vehicles.length,
    };
  }, [assets, maintenance, vehicles]);

  const categoryBreakdown = useMemo(() => {
    const counts = {};

    assets.forEach((asset) => {
      counts[asset.category] = (counts[asset.category] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [assets]);

  const conditionBreakdown = useMemo(() => {
    const counts = {};

    assets.forEach((asset) => {
      counts[asset.condition] = (counts[asset.condition] || 0) + 1;
    });

    return Object.entries(counts).map(([label, value]) => ({
      label,
      value,
    }));
  }, [assets]);

  const locationBreakdown = useMemo(() => {
    const counts = {};

    assets.forEach((asset) => {
      counts[asset.location] = (counts[asset.location] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [assets]);

  const recentMaintenance = useMemo(
    () =>
      [...maintenance].sort((a, b) =>
        (b.reportedDate || "").localeCompare(a.reportedDate || "")
      ),
    [maintenance]
  );

  const vehicleAlerts = useMemo(() => {
    const today = todayISO();
    const upcomingLimit = new Date();
    upcomingLimit.setDate(upcomingLimit.getDate() + 30);
    const limit = upcomingLimit.toISOString().slice(0, 10);

    return vehicles.flatMap((vehicle) => {
      const alerts = [];

      [
        ["Insurance", vehicle.insuranceExpiry],
        ["PUC", vehicle.pucExpiry],
        ["Next service", vehicle.nextServiceDate],
      ].forEach(([label, date]) => {
        if (!date) return;

        if (date < today) {
          alerts.push({
            vehicle: vehicle.name,
            registration: vehicle.registration,
            label,
            date,
            severity: "Overdue",
          });
        } else if (date <= limit) {
          alerts.push({
            vehicle: vehicle.name,
            registration: vehicle.registration,
            label,
            date,
            severity: "Due Soon",
          });
        }
      });

      return alerts;
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [vehicles]);

  const exportAssetReport = () => {
    downloadCSV(
      "asset-register-report.csv",
      [
        "Asset Code",
        "Asset Name",
        "Category",
        "Location",
        "Condition",
        "Status",
        "Purchase Cost",
      ],
      filteredAssets.map((asset) => [
        asset.code,
        asset.name,
        asset.category,
        asset.location,
        asset.condition,
        asset.status,
        asset.cost,
      ])
    );
  };

  const exportMaintenanceReport = () => {
    downloadCSV(
      "asset-maintenance-report.csv",
      [
        "Reference",
        "Asset Code",
        "Asset Name",
        "Type",
        "Priority",
        "Reported Date",
        "Due Date",
        "Actual Cost",
        "Status",
        "Description",
      ],
      maintenance.map((item) => [
        item.reference,
        item.assetCode,
        item.assetName,
        item.type,
        item.priority,
        item.reportedDate,
        item.dueDate,
        item.actualCost,
        item.status,
        item.description,
      ])
    );
  };

  const resetFilters = () => {
    setCategoryFilter("All");
    setLocationFilter("All");
    setReportSearch("");
  };

  const conditionClass = (condition) =>
    condition.toLowerCase().replace(/\s+/g, "-");

  const statusClass = (status) =>
    status.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="asset-dashboard-reports">
      <header className="adr-header">
        <div>
          <div className="adr-eyebrow">HR / ASSET MANAGEMENT</div>
          <h1>Asset Dashboard &amp; Reports</h1>
          <p>
            Monitor asset value, utilization, maintenance costs and compliance
            alerts.
          </p>
        </div>

        <div className="adr-header-actions">
          <button
            type="button"
            className="adr-btn adr-btn-secondary"
            onClick={resetFilters}
          >
            <FiRefreshCw /> Reset Filters
          </button>
          <button
            type="button"
            className="adr-btn adr-btn-primary"
            onClick={exportAssetReport}
          >
            <FiDownload /> Export Asset Report
          </button>
        </div>
      </header>

      <section className="adr-summary-grid">
        <article className="adr-summary-card">
          <div className="adr-summary-top">
            <span>Total Assets</span>
            <span className="adr-icon adr-blue"><FiPackage /></span>
          </div>
          <strong>{metrics.total}</strong>
          <small>Items in demonstration register</small>
        </article>

        <article className="adr-summary-card">
          <div className="adr-summary-top">
            <span>Total Purchase Cost</span>
            <span className="adr-icon adr-purple"><FiDollarSign /></span>
          </div>
          <strong>{money(metrics.assetValue)}</strong>
          <small>Recorded purchase cost, not current book value</small>
        </article>

        <article className="adr-summary-card">
          <div className="adr-summary-top">
            <span>Assigned Assets</span>
            <span className="adr-icon adr-green"><FiUsers /></span>
          </div>
          <strong>{metrics.assigned}</strong>
          <small>{money(metrics.assignedValue)} purchase cost assigned</small>
        </article>

        <article className="adr-summary-card">
          <div className="adr-summary-top">
            <span>Available Assets</span>
            <span className="adr-icon adr-teal"><FiCheckCircle /></span>
          </div>
          <strong>{metrics.available}</strong>
          <small>Marked available in the sample register</small>
        </article>

        <article className="adr-summary-card">
          <div className="adr-summary-top">
            <span>Vehicles</span>
            <span className="adr-icon adr-orange"><FiTruck /></span>
          </div>
          <strong>{metrics.totalVehicles}</strong>
          <small>Vehicles in the sample vehicle list</small>
        </article>

        <article className="adr-summary-card">
          <div className="adr-summary-top">
            <span>Maintenance Spend</span>
            <span className="adr-icon adr-red"><FiTool /></span>
          </div>
          <strong>{money(metrics.maintenanceSpend)}</strong>
          <small>Actual cost recorded in sample maintenance data</small>
        </article>
      </section>

      <section className="adr-alert-grid">
        <article className="adr-alert-card adr-alert-danger">
          <div className="adr-alert-icon"><FiAlertCircle /></div>
          <div>
            <span>Overdue Maintenance</span>
            <strong>{metrics.overdueMaintenance}</strong>
            <small>Uncompleted records past their target date</small>
          </div>
        </article>

        <article className="adr-alert-card adr-alert-warning">
          <div className="adr-alert-icon"><FiActivity /></div>
          <div>
            <span>Open Incidents</span>
            <strong>{metrics.openIncidents}</strong>
            <small>Open breakdown, accident or damage records</small>
          </div>
        </article>

        <article className="adr-alert-card adr-alert-info">
          <div className="adr-alert-icon"><FiTool /></div>
          <div>
            <span>Assets Needing Attention</span>
            <strong>{metrics.needsAttention}</strong>
            <small>Damaged, repair-needed or under maintenance</small>
          </div>
        </article>
      </section>

      <section className="adr-charts-grid">
        <article className="adr-panel">
          <div className="adr-panel-heading">
            <div>
              <h2>Assets by Category</h2>
              <p>Distribution of registered assets</p>
            </div>
            <FiPackage />
          </div>
          <BarList items={categoryBreakdown} />
        </article>

        <article className="adr-panel">
          <div className="adr-panel-heading">
            <div>
              <h2>Asset Condition</h2>
              <p>Condition recorded in the asset register</p>
            </div>
            <FiActivity />
          </div>
          <BarList items={conditionBreakdown} />
        </article>

        <article className="adr-panel">
          <div className="adr-panel-heading">
            <div>
              <h2>Assets by Location</h2>
              <p>Physical distribution of assets</p>
            </div>
            <FiTrendingUp />
          </div>
          <BarList items={locationBreakdown} />
        </article>
      </section>

      <section className="adr-panel adr-report-panel">
        <div className="adr-panel-heading adr-report-heading">
          <div>
            <h2>Asset Register Report</h2>
            <p>Search and filter the asset list before exporting.</p>
          </div>
          <button
            type="button"
            className="adr-btn adr-btn-secondary"
            onClick={exportAssetReport}
          >
            <FiDownload /> Export Filtered List
          </button>
        </div>

        <div className="adr-filters">
          <input
            type="search"
            placeholder="Search asset code or name..."
            value={reportSearch}
            onChange={(event) => setReportSearch(event.target.value)}
            aria-label="Search assets"
          />

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            aria-label="Filter asset category"
          >
            <option value="All">All Categories</option>
            {categories.map((category) => (
              <option value={category} key={category}>{category}</option>
            ))}
          </select>

          <select
            value={locationFilter}
            onChange={(event) => setLocationFilter(event.target.value)}
            aria-label="Filter asset location"
          >
            <option value="All">All Locations</option>
            {locations.map((location) => (
              <option value={location} key={location}>{location}</option>
            ))}
          </select>
        </div>

        <div className="adr-table-wrap">
          <table className="adr-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Category</th>
                <th>Location</th>
                <th>Condition</th>
                <th>Status</th>
                <th>Purchase Cost</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => (
                <tr key={asset.id}>
                  <td>
                    <strong>{asset.name}</strong>
                    <span className="adr-subtext">{asset.code}</span>
                  </td>
                  <td>{asset.category}</td>
                  <td>{asset.location}</td>
                  <td>
                    <span className={`adr-pill adr-condition-${conditionClass(asset.condition)}`}>
                      {asset.condition}
                    </span>
                  </td>
                  <td>
                    <span className={`adr-pill adr-status-${statusClass(asset.status)}`}>
                      {asset.status}
                    </span>
                  </td>
                  <td className="adr-money">{money(asset.cost)}</td>
                </tr>
              ))}

              {filteredAssets.length === 0 && (
                <tr>
                  <td colSpan="6" className="adr-empty">
                    No assets match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="adr-table-footer">
          {filteredAssets.length} asset(s) displayed
        </div>
      </section>

      <section className="adr-bottom-grid">
        <article className="adr-panel">
          <div className="adr-panel-heading">
            <div>
              <h2>Recent Maintenance</h2>
              <p>Latest recorded service and incident activity</p>
            </div>
            <FiTool />
          </div>

          <div className="adr-activity-list">
            {recentMaintenance.map((item) => (
              <div className="adr-activity-item" key={item.id}>
                <div className={`adr-activity-icon adr-activity-${statusClass(item.status)}`}>
                  {item.status === "Completed" ? (
                    <FiCheckCircle />
                  ) : item.priority === "High" ? (
                    <FiAlertCircle />
                  ) : (
                    <FiTool />
                  )}
                </div>
                <div className="adr-activity-content">
                  <div className="adr-activity-title">
                    <strong>{item.assetName}</strong>
                    <span className={`adr-pill adr-status-${statusClass(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                  <p>{item.description}</p>
                  <small>
                    {item.reference} · {item.type} · {formatDate(item.reportedDate)}
                  </small>
                </div>
                <strong className="adr-activity-cost">{money(item.actualCost)}</strong>
              </div>
            ))}
            {recentMaintenance.length === 0 && (
              <div className="adr-no-data">No maintenance records available.</div>
            )}
          </div>

          <button
            type="button"
            className="adr-text-button"
            onClick={exportMaintenanceReport}
          >
            <FiDownload /> Export Maintenance Report
          </button>
        </article>

        <article className="adr-panel">
          <div className="adr-panel-heading">
            <div>
              <h2>Vehicle Compliance &amp; Service</h2>
              <p>Expiry and service dates requiring attention</p>
            </div>
            <FiCalendar />
          </div>

          <div className="adr-alert-list">
            {vehicleAlerts.map((alert, index) => (
              <div className="adr-vehicle-alert" key={`${alert.registration}-${alert.label}-${index}`}>
                <div className={`adr-alert-dot ${alert.severity === "Overdue" ? "adr-dot-red" : "adr-dot-orange"}`} />
                <div className="adr-vehicle-alert-content">
                  <strong>{alert.label}</strong>
                  <span>{alert.vehicle} · {alert.registration}</span>
                  <small>Due: {formatDate(alert.date)}</small>
                </div>
                <span className={`adr-pill ${alert.severity === "Overdue" ? "adr-pill-danger" : "adr-pill-warning"}`}>
                  {alert.severity}
                </span>
              </div>
            ))}

            {vehicleAlerts.length === 0 && (
              <div className="adr-no-data">
                No vehicle service or compliance dates are due within the next 30 days.
              </div>
            )}
          </div>

          <div className="adr-compliance-note">
            <FiAlertCircle />
            <span>
              These alerts use the sample vehicle dates. Production alerts should
              use current database records and verified expiry dates.
            </span>
          </div>
        </article>
      </section>

      <section className="adr-report-actions">
        <div>
          <h2>Download Reports</h2>
          <p>Export the currently available sample records to CSV.</p>
        </div>
        <div className="adr-report-buttons">
          <button
            type="button"
            className="adr-btn adr-btn-secondary"
            onClick={exportAssetReport}
          >
            <FiPackage /> Asset Register
          </button>
          <button
            type="button"
            className="adr-btn adr-btn-secondary"
            onClick={exportMaintenanceReport}
          >
            <FiTool /> Maintenance Records
          </button>
        </div>
      </section>

      <footer className="adr-demo-notice">
        <FiAlertCircle />
        <span>
          Demonstration dashboard: asset, assignment, vehicle and maintenance
          data are sample records. Some totals are calculated from separate
          sample lists, not from a live database.
        </span>
      </footer>
    </div>
  );
}
