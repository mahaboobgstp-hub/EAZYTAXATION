
import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useCompany } from "../context/CompanyContext";
import { useModule } from "../context/ModuleContext";

import {
  FiHome,
  FiBriefcase,
  FiShoppingCart,
  FiTruck,
  FiDollarSign,
  FiCreditCard,
  FiBookOpen,
  FiPackage,
  FiFileText,
  FiBarChart2,
  FiSettings,
  FiChevronDown,
  FiChevronRight,
  FiUsers,
  FiLayers,
  FiCalendar,
  FiClipboard,
  FiUserCheck,
  FiDatabase,
  FiLock,
} from "react-icons/fi";

import "../css/Sidebar.css";

const MODULES = {
  billing: {
    dashboard: "/app/billing-dashboard",
    groups: [
      {
        title: "Sales",
        icon: FiDollarSign,
        links: [
          ["Add Sales Invoice", "/app/sales"],
          ["Sales Register", "/app/sales-register"],
          ["Quotations", "/app/quotation"],
          ["Sales Orders", "/app/sales-orders"],
          ["Delivery Challans", "/app/delivery-challans"],
          ["Credit Notes", "/app/credit-notes"],
        ],
      },
      {
        title: "Purchases",
        icon: FiShoppingCart,
        links: [
          ["Add Purchase Invoice", "/app/purchases"],
          ["Purchase Register", "/app/purchase-register"],
          ["Purchase Orders", "/app/purchase-orders"],
          ["Purchase Returns", "/app/purchase-returns"],
          ["Debit Notes", "/app/debit-notes"],
        ],
      },
      {
        title: "Expenses",
        icon: FiTruck,
        links: [
          ["Add Expense", "/app/expenses"],
          ["Expense Register", "/app/expense-register"],
          ["Receipts", "/receipts"],
          ["Payments", "/app/payments"],
          ["Contra", "/app/contra"],
          ["Bank Reconciliation", "/app/bank-reconciliation"],
        ],
      },
      {
        title: "Accounting",
        icon: FiBookOpen,
        links: [
          ["Journal Voucher", "/journal-voucher"],
          ["Ledger", "/app/ledger"],
          ["Trial Balance", "/app/trial-balance"],
          ["Profit & Loss", "/app/profit-loss"],
          ["Balance Sheet", "/app/balance-sheet"],
        ],
      },
      {
        title: "GST & Tax",
        icon: FiFileText,
        links: [
          ["GSTR-1", "/app/gstr1"],
          ["GSTR-3B", "/app/gstr3b"],
          ["GSTR-2B", "/app/gstr2b"],
          ["E-Way Bills", "/app/eway-bills"],
          ["E-Invoice", "/app/einvoice"],
        ],
      },
      {
        title: "Reports",
        icon: FiBarChart2,
        links: [
          ["Sales Reports", "/app/sales-reports"],
          ["Purchase Reports", "/purchase-reports"],
          ["Expense Reports", "/app/expense-reports"],
          ["Customer Ledger", "/app/customer-ledger"],
          ["Vendor Ledger", "/app/vendor-ledger"],
          ["Item Ledger", "/app/item-ledger"],
          ["GST Reports", "/app/gst-reports"],
        ],
      },
    ],
  },


  hr: {
    dashboard: "/app/hr-dashboard-reports",
    groups: [
      {
        title: "Employees",
        icon: FiUsers,
        links: [
          ["Employee Master", "/app/employees"],
          ["Employee Register", "/app/employee-register"],
          ["Employee Settings", "/app/employee-settings"],
          ["Department Master", "/app/departments"],
          ["Designation Master", "/app/designations"],
          ["Location Master", "/app/locations"],
          ["Employee Documents", "/app/employee-documents"],
          ["Document Repository", "/app/employee-document-repository"],
          ["Employee Self-Service", "/app/employee-self-service"],
        ],
      },
      
      {
        title: "Recruitment",
        icon: FiUserCheck,
        links: [
          ["Recruitment Dashboard & Reports", "/app/recruitment-dashboard-reports"],
          ["Job Requisition & Vacancies", "/app/job-requisition-management"],
          ["Candidate Management", "/app/candidate-management"],
          ["Interview Scheduling & Evaluation", "/app/interview-management"],
          ["Offer Management", "/app/offer-management"],
        ],
      },
      {
        title: "Training",
        icon: FiBookOpen,
        links: [
          ["Training Dashboard & Reports", "/app/training-dashboard-reports"],
          ["Training Programme Master", "/app/training-program-master"],
          ["Training Calendar", "/app/training-calendar"],
          ["Employee Training Assignments", "/app/employee-training-assignments"],
          ["Training Assessment & Feedback", "/app/training-assessment-feedback"],
        ],
      },
      {
        title: "Performance",
        icon: FiUserCheck,
        links: [
          ["Performance Management", "/app/performance-management"],
        ],
      },
      {
        title: "Employee Assets",
        icon: FiBriefcase,
        links: [
          ["Asset Dashboard & Reports", "/app/asset-dashboard-reports"],
          ["Asset Register", "/app/asset-register"],
          ["Employee Asset Assignment", "/app/employee-asset-assignment"],
          ["Vehicle Management", "/app/vehicle-management"],
          ["Maintenance & Incidents", "/app/asset-maintenance"],
        ],
      },
      
      {
        title: "HR Budget",
        icon: FiBarChart2,
        links: [
          ["HR Budget Dashboard & Reports", "/app/hr-budget-dashboard-reports"],
          ["HR Budget Planning", "/app/hr-budget-planning"],
          ["HR Expense Tracking", "/app/hr-expense-tracking"],
          ["HR Budget Approvals & Revisions", "/app/hr-budget-approvals"],
        ],
      },
    ],
  },

  payroll: {
    dashboard: "/app/payroll-dashboard",
    groups: [
      {
        title: "Attendance",
        icon: FiCalendar,
        links: [
          ["Attendance Entry", "/app/attendance"],
          ["Attendance Register", "/app/attendance-register"],
          ["Attendance Settings", "/app/attendance-settings"],
          ["Shift Master", "/app/shifts"],
["Leave Management", "/app/leave-management"],
["Leave Application", "/app/leave-application"],
["Leave Approval", "/app/leave-approval"],
["Holiday Calendar & Leave Ledger", "/app/holiday-calendar-leave-ledger"],
      },
      {
        title: "Salary Processing",
        icon: FiDollarSign,
        links: [
          ["Payroll Processing", "/app/payroll-processing"],
          ["Salary Arrears", "/app/salary-arrears"],
          ["Payslips", "/app/payslips"],
          ["Final Settlement", "/app/final-settlement"],
        ],
      },

      {
        title: "Payroll Policies",
        icon: FiClipboard,
        links: [
          ["Payroll Policy Settings", "/app/payroll-policy-settings"],
          ["Payroll Policy Master", "/app/payroll-policy-master"],
        ],
      },
      {
        title: "Employee Services",
        icon: FiUsers,
        links: [
          ["Expense Reimbursement", "/app/expense-reimbursement"],
          ["Employee Loans & Advances", "/app/employee-loans-advances"],
        ],
      },
      {
        title: "Statutory Compliance",
        icon: FiFileText,
        links: [
          ["Statutory Configuration", "/app/statutory-configuration"],
        ],
      },
    ],
  },


  inventory: {
    dashboard: "/app/dashboard",
    groups: [
      {
        title: "Stock Management",
        icon: FiPackage,
        links: [
          ["Stock Register", "/app/stock-register"],
          ["Stock Adjustment", "/app/stock-adjustment"],
          ["Stock Transfer", "/app/stock-transfer"],
          ["Physical Stock", "/app/physical-stock"],
        ],
      },
      {
        title: "Inventory Masters",
        icon: FiLayers,
        links: [
          ["Items Master", "/app/items"],
          ["Units of Measurement", "/app/uom"],
        ],
      },
      {
        title: "Inventory Reports",
        icon: FiBarChart2,
        links: [
          ["Item Ledger", "/app/item-ledger"],
        ],
      },
    ],
  },

  "supply-chain": {
    dashboard: "/app/dashboard",
    groups: [
      {
        title: "Procurement",
        icon: FiShoppingCart,
        links: [
          ["Purchase Orders", "/app/purchase-orders"],
          ["Purchase Register", "/app/purchase-register"],
          ["Supplier Bills", "/app/purchases"],
        ],
      },
      {
        title: "Suppliers",
        icon: FiTruck,
        links: [
          ["Vendor Master", "/app/vendors"],
        ],
      },
    ],
  },
};

const COMMON_GROUPS = [
  {
    title: "Company",
    icon: FiBriefcase,
    links: [
      ["Company Master", "/app/companies"],
    ],
  },
  {
    title: "Masters",
    icon: FiDatabase,
    links: [
      ["Customers", "/app/customers"],
      ["Vendors", "/app/vendors"],
      ["Items", "/app/items"],
      ["Units (UOM)", "/app/uom"],
      ["Expense Categories", "/app/expense-categories"],
      ["Asset Categories", "/app/asset-categories"],
      ["GST Rates", "/app/gst-rates"],
      ["Banks", "/banks"],
      ["Payment Terms", "/payment-terms"],
    ],
  },
  {
    title: "Administration",
    icon: FiSettings,
    links: [
      ["Company Settings", "/app/company-settings"],
      ["Users", "/app/users"],
      ["Roles & Permissions", "/app/roles"],
      ["Backup & Restore", "/app/backup"],
      ["Invoice Settings", "/app/invoice-settings"],
    ],
  },
];


/*
 * CENTRAL PAGE AVAILABILITY CONFIGURATION
 *
 * Routes listed here can be opened from the sidebar.
 * All other routes display a lock icon and cannot be clicked.
 *
 * Review this list as pages are developed and tested.
 */
const AVAILABLE_ROUTES = new Set([
  // Payroll core
  "/app/employees",
  "/app/employee-register",
  "/app/employee-settings",
  "/app/employee-documents",
  "/app/departments",
  "/app/designations",
  "/app/locations",
  "/app/attendance",
  "/app/attendance-register",
  "/app/attendance-settings",
  "/app/shifts",
"/app/leave-management",
"/app/leave-application",
"/app/leave-approval",
"/app/holiday-calendar-leave-ledger",
  "/app/payroll-processing",
  "/app/salary-arrears",
  "/app/payslips",
  "/app/final-settlement",
  "/app/payroll-policy-settings",
  "/app/payroll-policy-master",
  "/app/statutory-configuration",
  "/app/expense-reimbursement",
  "/app/employee-loans-advances",

  // Billing pages available for initial testing
  "/app/dashboard",
  "/app/companies",
  "/app/customers",
  "/app/vendors",
  "/app/sales",
  "/app/sales-register",
  "/app/purchases",
  "/app/expenses",
  "/app/items",
  "/app/uom",
  "/app/expense-categories",
  "/app/asset-categories",
  "/app/gst-rates",
  "/app/delivery-challans",
  "/app/quotation",
  "/app/invoice-settings",
]);

/*
 * These HR groups remain locked until a later release.
 * Group titles must match the titles in MODULES.hr.
 */
const LOCKED_HR_GROUPS = new Set([
  "Recruitment",
  "Training",
  "Performance",
  "Employee Assets",
  "HR Budget",
]);


const LOCKED_MODULES = new Set([
  "inventory",
  "supply-chain",
]);

const isRouteAvailable = (path) =>
  AVAILABLE_ROUTES.has(path);

const isGroupLocked = (moduleId, group) =>
  moduleId === "hr" && LOCKED_HR_GROUPS.has(group.title);


function Sidebar() {
  const { companies, currentCompany, changeCompany, loading } = useCompany();
  const { activeModule } = useModule();
  const location = useLocation();

  const [openMenu, setOpenMenu] = useState("");
  const [commonOpen, setCommonOpen] = useState(false);

  const currentModule = MODULES[activeModule] || MODULES.billing;
  const currentModuleLocked = LOCKED_MODULES.has(activeModule);

  const toggleMenu = (menuName) => {
    setOpenMenu((previous) => previous === menuName ? "" : menuName);
  };

  
  const renderGroup = (group, keyPrefix) => {
    const menuKey = `${keyPrefix}-${group.title}`;
    const Icon = group.icon;
    const isOpen = openMenu === menuKey;

    const moduleId = keyPrefix === "common" ? "common" : keyPrefix;
    const groupLocked =
  currentModuleLocked ||
  isGroupLocked(moduleId, group);

    // HR groups scheduled for later releases are locked as a whole.
    // Other groups can expand, but unavailable pages cannot be opened.
    const availableLinks = group.links.filter(([, path]) =>
      isRouteAvailable(path)
    );

    const allLinksLocked =
      groupLocked || availableLinks.length === 0;

    return (
      <div
        className={`sidebar-group ${
          allLinksLocked ? "sidebar-group-locked" : ""
        }`}
        key={menuKey}
      >
        <button
          type="button"
          className={`menu-title ${
            groupLocked ? "menu-title-locked" : ""
          }`}
          aria-expanded={groupLocked ? false : isOpen}
          aria-disabled={groupLocked}
          title={
            groupLocked
              ? "Coming soon — planned for a future release"
              : undefined
          }
          onClick={() => {
            if (groupLocked) return;
            toggleMenu(menuKey);
          }}
        >
          <span className="menu-left">
            <Icon />
            <span>{group.title}</span>
          </span>

          {groupLocked ? (
            <FiLock className="sidebar-lock-icon" aria-hidden="true" />
          ) : isOpen ? (
            <FiChevronDown />
          ) : (
            <FiChevronRight />
          )}
        </button>

        {isOpen && !groupLocked && (
          <div className="submenu">
            {group.links.map(([label, path]) => {
              const available = isRouteAvailable(path);

              if (!available) {
                return (
                  <div
                    key={`${label}-${path}`}
                    className="submenu-link submenu-link-locked"
                    aria-disabled="true"
                    title="Coming soon — this page is not available yet"
                  >
                    <span>{label}</span>
                    <FiLock
                      className="sidebar-lock-icon"
                      aria-hidden="true"
                    />
                  </div>
                );
              }

              return (
                <NavLink
                  key={`${label}-${path}`}
                  to={path}
                  className={({ isActive }) =>
                    `submenu-link ${isActive ? "active" : ""}`
                  }
                >
                  <span>{label}</span>
                </NavLink>
              );
            })}
          </div>
        )}
      </div>
    );
  };


  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">ET</div>
        <div>
          <h2>EAZYTAXATION</h2>
          <span>ERP</span>
        </div>
      </div>

      <div className="company-card">
        <div className="company-icon">
          <FiBriefcase />
        </div>

        <div className="company-details">
          <small>Current Company</small>

          <select
            className="company-select"
            value={currentCompany?.id || ""}
            onChange={(event) => changeCompany(event.target.value)}
            disabled={loading || companies.length === 0}
            aria-label="Select current company"
          >
            <option value="">
              {loading ? "Loading..." : "Select Company"}
            </option>

            {!loading && companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.company_name?.trim() || "Unnamed Company"}
              </option>
            ))}
          </select>
        </div>
      </div>

      <nav className="sidebar-menu" aria-label="Main navigation">
        
        {!currentModuleLocked && isRouteAvailable(currentModule.dashboard) ? (
          <NavLink
            to={currentModule.dashboard}
            className={({ isActive }) =>
              `menu-link ${isActive ? "active" : ""}`
            }
          >
            <FiHome />
            <span>
              {activeModule === "hr"
                ? "HR Dashboard"
                : activeModule === "payroll"
                  ? "Payroll Dashboard"
                  : activeModule === "inventory"
                    ? "Inventory Dashboard"
                    : activeModule === "supply-chain"
                      ? "Supply Chain Dashboard"
                      : "Dashboard"}
            </span>
          </NavLink>
        ) : (
          <div
            className="menu-link menu-link-locked"
            aria-disabled="true"
            title="Coming soon — this dashboard is not available yet"
          >
            <FiHome />
            <span>
              {activeModule === "hr"
                ? "HR Dashboard"
                : activeModule === "payroll"
                  ? "Payroll Dashboard"
                  : activeModule === "inventory"
                    ? "Inventory Dashboard"
                    : activeModule === "supply-chain"
                      ? "Supply Chain Dashboard"
                      : "Dashboard"}
            </span>
            <FiLock className="sidebar-lock-icon" aria-hidden="true" />
          </div>
        )}


        {currentModule.groups.map((group) =>
          renderGroup(group, activeModule)
        )}

        <div className="sidebar-section-label">COMMON WORKSPACE</div>

        <button
          type="button"
          className="menu-title"
          aria-expanded={commonOpen}
          onClick={() => setCommonOpen((previous) => !previous)}
        >
          <span className="menu-left">
            <FiLayers />
            <span>Common Workspace</span>
          </span>

          {commonOpen ? <FiChevronDown /> : <FiChevronRight />}
        </button>

        {commonOpen && (
          <div className="common-workspace">
            {COMMON_GROUPS.map((group) =>
              renderGroup(group, "common")
            )}
          </div>
        )}
      </nav>
    </aside>
  );
}

export default Sidebar;
