
import React, { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useModule } from "../context/ModuleContext";
import { supabase } from "../supabase/supabaseClient";
import { Capacitor } from "@capacitor/core";

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
  FiRefreshCw,
  FiArrowLeft,
} from "react-icons/fi";

import "../css/Sidebar.css";

const MODULES = {
  billing: {
    dashboard: "/app/dashboard",
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
          ["Receipts", "/app/banking?tab=receipts"],
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
          ["Payments", "/app/payments"],
          ["Expense Categories", "/app/expense-categories"],
          ["Expense Reports", "/app/expense-reports"],
          ["Expense Categories", "/app/expense-categories"],
          ["Expense Reports", "/app/expense-reports"],
        ],
      },
      {
        title: "Banking",
        icon: FiCreditCard,
        links: [
          ["Bank Overview", "/app/banking?tab=overview"],
          ["Bank Accounts", "/app/banking?tab=accounts"],
          ["Bank Transactions", "/app/banking?tab=transactions"],
          ["Cash & Bank Book", "/app/banking?tab=cashbook"],
          ["Receipts Register", "/app/banking?tab=receipts"],
          ["Payments Register", "/app/banking?tab=payments"],
          ["Contra / Transfers", "/app/banking?tab=contra"],
          ["Bank Reconciliation", "/app/banking?tab=reconciliation"],
        ],
      },
      {
        title: "Accounting",
        icon: FiBookOpen,
        links: [
          ["Accounting Dashboard", "/app/accounting"],
          ["Chart of Accounts", "/app/chart-of-accounts"],
          ["Journal Voucher", "/app/journal-voucher"],
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
          ["Purchase Reports", "/app/purchase-reports"],
          ["Expense Reports", "/app/expense-reports"],
          ["Customer Ledger", "/app/customer-ledger"],
          ["Vendor Ledger", "/app/vendor-ledger"],
          ["Item Ledger", "/app/item-ledger"],
          ["GST Reports", "/app/gst-reports"],
          ["Receivables Ageing", "/app/receivables-ageing"],
          ["Payables Ageing", "/app/payables-ageing"],
        ],
      },
    ],
  },


  hr: {
    dashboard: "/app/dashboard",
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
    dashboard: "/app/dashboard",
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
        ],
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

  "gst-tax": {
    dashboard: "/app/dashboard",
    groups: [
      {
        title: "GST & Tax",
        icon: FiFileText,
        links: [
          ["GST Rates", "/app/gst-rates"],
          ["GSTR-1", "/app/gstr1"],
          ["GSTR-3B", "/app/gstr3b"],
          ["GSTR-2B Reconciliation", "/app/gstr2b"],
          ["E-Way Bills", "/app/eway-bills"],
          ["E-Invoice", "/app/einvoice"],
        ],
      },
    ],
  },
};

const COMMON_GROUPS = [
  {
    title: "User & CA Management",
    icon: FiUsers,
    links: [
      ["Users & Access", "/app/users-access"],
      ["CA Assignments", "/app/ca-assignment"],
      ["Client Assignments", "/app/ca-workspace"],
    ],
  },

  {
    title: "Company Setup",
    icon: FiBriefcase,
    links: [
      ["Company Master", "/app/companies"],
    ],
  },
  {
    title: "Master Data",
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
    title: "System Settings",
    icon: FiSettings,
    links: [
      ["Company Settings", "/app/company-settings"],
      ["Financial Year & Tax Settings", "/app/company-settings?tab=financial"],
      ["User Profile", "/app/user-profile"],
      ["Users", "/app/users-access"],
      ["Roles & Permissions", "/app/users-access"],
      ["Data Backup", "/app/company-settings?tab=backup"],
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
  "/app/sales-orders",
  "/app/credit-notes",
  "/app/purchases",
  "/app/purchase-register",
  "/app/purchase-orders",
  "/app/purchase-returns",
  "/app/debit-notes",
  "/app/expenses",
  "/app/expense-register",
  "/app/payments",
  "/app/banking",
  "/app/items",
  "/app/uom",
  "/app/expense-categories",
  "/app/asset-categories",
  "/app/gst-rates",
  "/app/gstr1",
  "/app/gstr3b",
  "/app/gstr2b",
  "/app/eway-bills",
  "/app/delivery-challans",
  "/app/quotation",
  "/app/sales-reports",
  "/app/purchase-reports",
  "/app/expense-reports",
  "/app/customer-ledger",
  "/app/vendor-ledger",
  "/app/item-ledger",
  "/app/gst-reports",
  "/app/invoice-settings",
  "/app/users-access",
  "/app/ca-assignment",
  "/app/ca-workspace",
  "/app/accounting",
  "/app/chart-of-accounts",
  "/app/journal-voucher",
  "/app/ledger",
  "/app/trial-balance",
  "/app/profit-loss",
  "/app/balance-sheet",
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


const ANDROID_COMMON_GROUPS = [
  { title: "Company Setup", icon: FiBriefcase, links: [["Company Creation", "/app/companies"]] },
  { title: "Sales Masters", icon: FiDatabase, links: [["Customers", "/app/customers"], ["Items", "/app/items"], ["Units (UOM)", "/app/uom"]] },
  { title: "Invoice Settings", icon: FiSettings, links: [["Invoice Settings", "/app/invoice-settings"]] },
];

const LOCKED_MODULES = new Set([
  "inventory",
  "supply-chain",
]);

const isRouteAvailable = (path) =>
  AVAILABLE_ROUTES.has(path.split("?")[0]);

const isGroupLocked = (moduleId, group) =>
  moduleId === "hr" && LOCKED_HR_GROUPS.has(group.title);


function Sidebar({ collapsed = false, mobileOpen = false, onNavigate, onClose }) {
  const { activeModule } = useModule();
  const location = useLocation();
  const isNativeAndroid = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  const effectiveModuleId = isNativeAndroid ? "billing" : activeModule;

  const [openMenu, setOpenMenu] = useState("");
  const [isCaUser, setIsCaUser] = useState(false);

  useEffect(() => {
    let active = true;
    const checkCaRole = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!user) {
          if (active) setIsCaUser(false);
          return;
        }
        const { data, error } = await supabase
          .from("ca_company_assignments")
          .select("id")
          .eq("ca_user_id", user.id)
          .eq("status", "Active")
          .limit(1);
        if (error) throw error;
        if (active) setIsCaUser((data || []).length > 0);
      } catch {
        if (active) setIsCaUser(false);
      }
    };
    checkCaRole();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkCaRole();
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const currentModule = MODULES[effectiveModuleId] || MODULES.billing;
  const currentModuleLocked = LOCKED_MODULES.has(effectiveModuleId);
  const visibleModuleGroups = isNativeAndroid
    ? currentModule.groups
        .filter(group => ["Sales", "Purchases", "Expenses"].includes(group.title))
        .map(group => ({
          ...group,
          links: group.title === "Sales"
            ? group.links.filter(([, path]) => ["/app/sales", "/app/sales-register", "/app/quotation", "/app/sales-orders", "/app/delivery-challans", "/app/credit-notes"].includes(path))
            : group.title === "Purchases"
              ? group.links.filter(([, path]) => ["/app/purchases", "/app/purchase-register", "/app/purchase-orders", "/app/purchase-returns", "/app/debit-notes"].includes(path))
              : group.links.filter(([, path]) => ["/app/expenses", "/app/expense-register", "/app/payments", "/app/expense-categories", "/app/expense-reports"].includes(path))
        }))
    : currentModule.groups;
  const visibleCommonGroups = isNativeAndroid ? ANDROID_COMMON_GROUPS : COMMON_GROUPS;

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
    const visibleLinks = group.links.filter(([label]) =>
      label !== "Client Assignments" || isCaUser
    );
    const availableLinks = visibleLinks.filter(([, path]) =>
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
            {visibleLinks.map(([label, path]) => {
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
                  onClick={onNavigate}
                  className={() =>
                    `submenu-link ${location.pathname + location.search === path ? "active" : ""}`
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
    <aside className={`sidebar ${collapsed ? "sidebar-collapsed" : ""} ${mobileOpen ? "sidebar-mobile-open" : ""}`}>
      <div className="sidebar-topbar sidebar-compact-topbar">
        <div className="sidebar-drawer-heading">Navigation</div>
        <button type="button" className="sidebar-close-button" onClick={onClose} aria-label="Back to app" title="Back to app">
          <FiArrowLeft />
        </button>
      </div>

      <nav className="sidebar-menu" aria-label="Main navigation">
        
        {isRouteAvailable(currentModule.dashboard) ? (
          <NavLink
            to={currentModule.dashboard}
            onClick={onNavigate}
            className={({ isActive }) =>
              `menu-link ${isActive ? "active" : ""}`
            }
          >
            <FiHome />
            <span>
              {effectiveModuleId === "hr"
                ? "HR Dashboard"
                : effectiveModuleId === "payroll"
                  ? "Payroll Dashboard"
                  : effectiveModuleId === "inventory"
                    ? "Inventory Dashboard"
                    : effectiveModuleId === "supply-chain"
                      ? "Supply Chain Dashboard"
                      : effectiveModuleId === "gst-tax"
                        ? "GST & Tax Dashboard"
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
              {effectiveModuleId === "hr"
                ? "HR Dashboard"
                : effectiveModuleId === "payroll"
                  ? "Payroll Dashboard"
                  : effectiveModuleId === "inventory"
                    ? "Inventory Dashboard"
                    : effectiveModuleId === "supply-chain"
                      ? "Supply Chain Dashboard"
                      : "Dashboard"}
            </span>
            <FiLock className="sidebar-lock-icon" aria-hidden="true" />
          </div>
        )}


        {visibleModuleGroups.map((group) =>
          renderGroup(group, effectiveModuleId)
        )}

        <div className="sidebar-section-label">ORGANIZATION &amp; SETTINGS</div>

        <div className="common-workspace">
          {visibleCommonGroups.map((group) =>
            renderGroup(group, "common")
          )}
        </div>
      </nav>
    </aside>
  );
}

export default Sidebar;
