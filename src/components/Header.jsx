
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiSearch, FiX, FiMenu } from "react-icons/fi";
import { MODULES, useModule } from "../context/ModuleContext";
import { isAndroidApp } from "../utils/platform";
import "../css/Header.css";

const PAGES = [
  // Billing & Accounting
  { label: "Dashboard", path: "/app/dashboard", module: "billing" },
  { label: "Company Master", path: "/app/companies", module: "billing" },
  { label: "Customers", path: "/app/customers", module: "billing" },
  { label: "Vendors", path: "/app/vendors", module: "billing" },
  { label: "Items Master", path: "/app/items", module: "billing" },
  { label: "Units of Measurement", path: "/app/uom", module: "billing" },
  { label: "Add Sales Invoice", path: "/app/sales", module: "billing" },
  { label: "Sales Register", path: "/app/sales-register", module: "billing" },
  { label: "Quotations", path: "/app/quotation", module: "billing" },
  { label: "Sales Orders", path: "/app/sales-orders", module: "billing" },
  { label: "Delivery Challans", path: "/app/delivery-challans", module: "billing" },
  { label: "Credit Notes", path: "/app/credit-notes", module: "billing" },
  { label: "Add Purchase Invoice", path: "/app/purchases", module: "billing" },
  { label: "Purchase Register", path: "/app/purchase-register", module: "billing" },
  { label: "Purchase Orders", path: "/app/purchase-orders", module: "billing" },
  { label: "Purchase Returns", path: "/app/purchase-returns", module: "billing" },
  { label: "Debit Notes", path: "/app/debit-notes", module: "billing" },
  { label: "Add Expense", path: "/app/expenses", module: "billing" },
  { label: "Expense Register", path: "/app/expense-register", module: "billing" },
  { label: "Receipts", path: "/receipts", module: "billing" },
  { label: "Payments", path: "/app/payments", module: "billing" },
  { label: "Contra", path: "/app/contra", module: "billing" },
  { label: "Bank Reconciliation", path: "/app/bank-reconciliation", module: "billing" },
  { label: "Journal Voucher", path: "/journal-voucher", module: "billing" },
  { label: "Ledger", path: "/app/ledger", module: "billing" },
  { label: "Trial Balance", path: "/app/trial-balance", module: "billing" },
  { label: "Profit & Loss", path: "/app/profit-loss", module: "billing" },
  { label: "Balance Sheet", path: "/app/balance-sheet", module: "billing" },
  { label: "GSTR-1", path: "/app/gstr1", module: "billing" },
  { label: "GSTR-3B", path: "/app/gstr3b", module: "billing" },
  { label: "GSTR-2B", path: "/app/gstr2b", module: "billing" },
  { label: "E-Way Bills", path: "/app/eway-bills", module: "billing" },
  { label: "E-Invoice", path: "/app/einvoice", module: "billing" },
  { label: "Sales Reports", path: "/app/sales-reports", module: "billing" },
  { label: "Purchase Reports", path: "/purchase-reports", module: "billing" },
  { label: "Expense Reports", path: "/app/expense-reports", module: "billing" },
  { label: "Customer Ledger", path: "/app/customer-ledger", module: "billing" },
  { label: "Vendor Ledger", path: "/app/vendor-ledger", module: "billing" },
  { label: "Item Ledger", path: "/app/item-ledger", module: "billing" },
  { label: "GST Reports", path: "/app/gst-reports", module: "billing" },

  // HR Management
  { label: "HR Dashboard & Reports", path: "/app/hr-dashboard-reports", module: "hr" },
  { label: "Employee Master", path: "/app/employees", module: "hr" },
  { label: "Department Master", path: "/app/departments", module: "hr" },
  { label: "Designation Master", path: "/app/designations", module: "hr" },
  { label: "Location Master", path: "/app/locations", module: "hr" },
  { label: "Employee Documents", path: "/app/employee-documents", module: "hr" },
  { label: "Document Repository", path: "/app/employee-document-repository", module: "hr" },
  { label: "Employee Self-Service", path: "/app/employee-self-service", module: "hr" },
  { label: "Attendance Entry", path: "/app/attendance", module: "hr" },
  { label: "Attendance Register", path: "/app/attendance-register", module: "hr" },
  { label: "Attendance Settings", path: "/app/attendance-settings", module: "hr" },
  { label: "Shift Master", path: "/app/shifts", module: "hr" },
  { label: "Leave Management", path: "/app/leave-management", module: "hr" },
  { label: "Holiday Calendar & Leave Ledger", path: "/app/holiday-calendar-leave-ledger", module: "hr" },
  { label: "Recruitment Dashboard & Reports", path: "/app/recruitment-dashboard-reports", module: "hr" },
  { label: "Job Requisition & Vacancies", path: "/app/job-requisition-management", module: "hr" },
  { label: "Candidate Management", path: "/app/candidate-management", module: "hr" },
  { label: "Interview Scheduling & Evaluation", path: "/app/interview-management", module: "hr" },
  { label: "Offer Management", path: "/app/offer-management", module: "hr" },
  { label: "Training Dashboard & Reports", path: "/app/training-dashboard-reports", module: "hr" },
  { label: "Training Programme Master", path: "/app/training-program-master", module: "hr" },
  { label: "Training Calendar", path: "/app/training-calendar", module: "hr" },
  { label: "Employee Training Assignments", path: "/app/employee-training-assignments", module: "hr" },
  { label: "Training Assessment & Feedback", path: "/app/training-assessment-feedback", module: "hr" },
  { label: "Performance Management", path: "/app/performance-management", module: "hr" },
  { label: "Expense Reimbursement", path: "/app/expense-reimbursement", module: "hr" },
  { label: "Employee Loans & Advances", path: "/app/employee-loans-advances", module: "hr" },
  { label: "Asset Dashboard & Reports", path: "/app/asset-dashboard-reports", module: "hr" },
  { label: "Asset Register", path: "/app/asset-register", module: "hr" },
  { label: "Employee Asset Assignment", path: "/app/employee-asset-assignment", module: "hr" },
  { label: "Vehicle Management", path: "/app/vehicle-management", module: "hr" },
  { label: "Maintenance & Incidents", path: "/app/asset-maintenance", module: "hr" },
  { label: "HR Budget Dashboard & Reports", path: "/app/hr-budget-dashboard-reports", module: "hr" },
  { label: "HR Budget Planning", path: "/app/hr-budget-planning", module: "hr" },
  { label: "HR Expense Tracking", path: "/app/hr-expense-tracking", module: "hr" },
  { label: "HR Budget Approvals & Revisions", path: "/app/hr-budget-approvals", module: "hr" },

  // Payroll Management
  { label: "Payroll Processing", path: "/app/payroll-processing", module: "payroll" },
  { label: "Payslips", path: "/app/payslips", module: "payroll" },
  { label: "Payroll Policy Settings", path: "/app/payroll-policy-settings", module: "payroll" },
  { label: "Payroll Policy Master", path: "/app/payroll-policy-master", module: "payroll" },
  { label: "Statutory Configuration", path: "/app/statutory-configuration", module: "payroll" },
  { label: "Final Settlement", path: "/app/final-settlement", module: "payroll" },

  // Inventory Management
  { label: "Stock Register", path: "/app/stock-register", module: "inventory" },
  { label: "Stock Adjustment", path: "/app/stock-adjustment", module: "inventory" },
  { label: "Stock Transfer", path: "/app/stock-transfer", module: "inventory" },
  { label: "Physical Stock", path: "/app/physical-stock", module: "inventory" },

  // Supply Chain
  { label: "Supplier Master", path: "/app/vendors", module: "supply-chain" },
  { label: "Purchase Order Tracking", path: "/app/purchase-orders", module: "supply-chain" },

  // Common Workspace
  { label: "Expense Categories", path: "/app/expense-categories", module: "billing" },
  { label: "Asset Categories", path: "/app/asset-categories", module: "hr" },
  { label: "GST Rates", path: "/app/gst-rates", module: "billing" },
  { label: "Banks", path: "/banks", module: "billing" },
  { label: "Payment Terms", path: "/payment-terms", module: "billing" },
  { label: "Invoice Settings", path: "/app/invoice-settings", module: "billing" },
  { label: "Company Settings", path: "/app/company-settings", module: "billing" },
  { label: "Users", path: "/app/users", module: "billing" },
  { label: "Roles & Permissions", path: "/app/roles", module: "billing" },
  { label: "Backup & Restore", path: "/app/backup", module: "billing" },
];

// Only expose implemented Billing & Accounting pages in Android search.
const MOBILE_BILLING_SEARCH_ROUTES = new Set([
  "/app/companies",
  "/app/customers",
  "/app/vendors",
  "/app/items",
  "/app/uom",
  "/app/sales",
  "/app/sales-register",
  "/app/quotation",
  "/app/delivery-challans",
  "/app/purchases",
  "/app/expenses",
  "/app/expense-categories",
  "/app/gst-rates",
  "/app/invoice-settings",
]);

function Header({
  onMenuClick = () => {},
  mobileTitle = "Billing & Accounting",
}) {
  const { activeModule, setActiveModule } = useModule();
  const navigate = useNavigate();
  const location = useLocation();

  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef(null);

    const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) return [];

    return PAGES
      .filter((page) => {
        if (isAndroidApp) {
          return (
            page.module === "billing" &&
            MOBILE_BILLING_SEARCH_ROUTES.has(page.path)
          );
        }

        return true;
      })
      .filter((page) =>
        `${page.label} ${page.module}`.toLowerCase().includes(normalized)
      )
      .filter(
        (page, index, array) =>
          array.findIndex(
            (item) =>
              item.path === page.path &&
              item.label === page.label
          ) === index
      )
      .slice(0, 10);
  }, [query]);

  useEffect(() => {
    setSearchOpen(false);
    setQuery("");
  }, [location.pathname]);

  useEffect(() => {
    const handleShortcut = (event) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        setSearchOpen(true);
        searchRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

    const openPage = (page) => {
    // Module switching remains available on the web only.
    if (!isAndroidApp) {
      setActiveModule(page.module);
    }

    setSearchOpen(false);
    setQuery("");
    navigate(page.path);
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "Escape") {
      setSearchOpen(false);
      setQuery("");
    } else if (event.key === "ArrowDown" && results.length) {
      event.preventDefault();
      setSelectedIndex((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp" && results.length) {
      event.preventDefault();
      setSelectedIndex((index) =>
        index === 0 ? results.length - 1 : index - 1
      );
    } else if (event.key === "Enter" && results[selectedIndex]) {
      event.preventDefault();
      openPage(results[selectedIndex]);
    }
  };

  return (
        <header className="header">

      {isAndroidApp && (
        <div className="mobile-header-brand">
          <button
            type="button"
            className="mobile-menu-button"
            onClick={onMenuClick}
            aria-label="Open navigation menu"
          >
            <FiMenu />
          </button>

          <span className="mobile-header-title">
            {mobileTitle}
          </span>
        </div>
      )}

      {!isAndroidApp && (
        <nav className="module-switcher" aria-label="ERP modules">
        {MODULES.map((module) => (
          <button
            key={module.id}
            type="button"
            className={`module-button ${
              activeModule === module.id ? "active" : ""
            }`}
            aria-pressed={activeModule === module.id}
            onClick={() => setActiveModule(module.id)}
          >
            {module.label}
          </button>
        ))}
      </nav>
          )}

      <div className="global-page-search">
        <div className="page-search-input-wrap">
          <FiSearch aria-hidden="true" />

          <input
            ref={searchRef}
            type="search"
            value={query}
            placeholder="Search pages..."
            aria-label="Search ERP pages"
            aria-expanded={searchOpen && results.length > 0}
            onFocus={() => setSearchOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setSearchOpen(true);
            }}
            onKeyDown={handleSearchKeyDown}
          />

          {query ? (
            <button
              type="button"
              className="search-clear"
              aria-label="Clear search"
              onClick={() => {
                setQuery("");
                setSearchOpen(true);
                searchRef.current?.focus();
              }}
            >
              <FiX />
            </button>
          ) : (
            <span className="search-shortcut">Ctrl K</span>
          )}
        </div>

        {searchOpen && query.trim() && (
          <div className="page-search-results">
            {results.length ? (
              results.map((page, index) => {
                const moduleLabel =
                  MODULES.find((module) => module.id === page.module)?.label ||
                  page.module;

                return (
                  <button
                    key={`${page.label}-${page.path}-${index}`}
                    type="button"
                    className={`page-search-result ${
                      index === selectedIndex ? "selected" : ""
                    }`}
                    onMouseEnter={() => setSelectedIndex(index)}
                    onClick={() => openPage(page)}
                  >
                    <span className="result-page-name">{page.label}</span>
                    <span className="result-module-name">{moduleLabel}</span>
                  </button>
                );
              })
            ) : (
              <div className="page-search-empty">
                No matching pages found.
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
