import React, { useState } from "react";
import { useCompany } from "../context/CompanyContext";

import {

    NavLink

} from "react-router-dom";

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
    FiChevronRight

} from "react-icons/fi";

import "../css/Sidebar.css";

function Sidebar() {
    const {
    companies,
    currentCompany,
    changeCompany,
    loading
} = useCompany();

    const [openMenu, setOpenMenu] = useState("");
    const toggleMenu = (menuName) => {

    if(openMenu===menuName){

        setOpenMenu("");

    }

    else{

        setOpenMenu(menuName);

    }

};

    return (

        <aside className="sidebar">

            {/* =======================================
                LOGO
            ======================================= */}

            <div className="sidebar-logo">

                <div className="logo-icon">

                    ET

                </div>

                <div>

                    <h2>

                        EAZYTAXATION

                    </h2>

                    <span>

                        ERP

                    </span>

                </div>

            </div>

            {/* =======================================
                COMPANY CARD
            ======================================= */}

            <div className="company-card">

    <div className="company-icon">
        <FiBriefcase />
    </div>

    <div className="company-details">

        <small>
            Current Company
        </small>

       <select
    className="company-select"
    value={currentCompany?.id || ""}
    onChange={(e) => changeCompany(e.target.value)}
    disabled={loading || companies.length === 0}
>
    <option value="">
        {loading ? "Loading..." : "Select Company"}
    </option>

    {!loading && companies.map((company) => (
        <option
            key={company.id}
            value={company.id}
        >
            {company.company_name.trim()}
        </option>
    ))}
</select>
    </div>

</div>
            {/* =======================================
                MENU
            ======================================= */}

            <nav className="sidebar-menu">

                <NavLink

                    to="/app/dashboard"

                    className="menu-link"

                >

                    <FiHome />

                    <span>

                        Dashboard

                    </span>

                </NavLink>

                {/* ===================================
                    MASTERS
                =================================== */}

                <div

                    className="menu-title"

                    onClick={()=>toggleMenu("masters")}
                >

                    <div className="menu-left">

                        <FiBriefcase />

                        <span>

                            Masters

                        </span>

                    </div>

                    {

                       openMenu === "masters"

                        ?

                        <FiChevronDown/>

                        :

                        <FiChevronRight/>

                    }

                </div>

                {

                    openMenu==="masters" && (

                        <div className="submenu">

                            <NavLink

                                to="/app/companies"

                                className="submenu-link"

                            >

                                Company

                            </NavLink>

                            <NavLink

                                to="/app/customers"

                                className="submenu-link"

                            >

                                Customers

                            </NavLink>

                            <NavLink

                                to="/app/vendors"

                                className="submenu-link"

                            >

                                Vendors

                            </NavLink>

                            <NavLink

                                to="/app/items"

                                className="submenu-link"

                            >

                                Items

                            </NavLink>

                            <NavLink

                                to="/app/expense-categories"

                                className="submenu-link"

                            >

                                Expense Categories

                            </NavLink>

                            <NavLink

                                to="/app/asset-categories"

                                className="submenu-link"

                            >

                                Asset Categories

                            </NavLink>

                            <NavLink

                                to="/banks"

                                className="submenu-link"

                            >

                                Banks

                            </NavLink>

                            <NavLink

                                to="/payment-terms"

                                className="submenu-link"

                            >

                                Payment Terms

                            </NavLink>

                            <NavLink

                                to="/app/uom"

                                className="submenu-link"

                            >

                                Units (UOM)

                            </NavLink>

                            <NavLink

                                to="/app/gst-rates"

                                className="submenu-link"

                            >

                                GST Rates

                            </NavLink>

                        </div>

                    )

                }
                              {/* ===================================
                    SALES
                =================================== */}

                <div
                    className="menu-title"
                    onClick={()=>toggleMenu("sales")}
                >

                    <div className="menu-left">

                        <FiDollarSign />

                        <span>

                            Sales

                        </span>

                    </div>

                    {

                       openMenu === "sales"

                            ? <FiChevronDown />

                            : <FiChevronRight />

                    }

                </div>

                {

                    openMenu==="sales" && (

                        <div className="submenu">

                            <NavLink
                                to="/app/sales"
                                className="submenu-link"
                            >
                                Add Sales Invoice
                            </NavLink>

                            <NavLink
                                to="/app/sales-register"
                                className="submenu-link"
                            >
                                Sales Register
                            </NavLink>

                            <NavLink
                                to="/app/quotation"
                                className="submenu-link"
                            >
                                Quotations
                            </NavLink>

                            <NavLink
                                to="/app/sales-orders"
                                className="submenu-link"
                            >
                                Sales Orders
                            </NavLink>

                            <NavLink
                                to="/app/delivery-challans"
                                className="submenu-link"
                            >
                                Delivery Challans
                            </NavLink>

                            <NavLink
                                to="/app/credit-notes"
                                className="submenu-link"
                            >
                                Credit Notes
                            </NavLink>

                        </div>

                    )

                }

                {/* ===================================
                    PURCHASES
                =================================== */}

                <div
                    className="menu-title"
                    onClick={()=>toggleMenu("purchase")}
                >

                    <div className="menu-left">

                        <FiShoppingCart />

                        <span>

                            Purchases

                        </span>

                    </div>

                    {

                       openMenu === "purchase"

                            ? <FiChevronDown />

                            : <FiChevronRight />

                    }

                </div>

                {

                    openMenu==="purchase" && (

                        <div className="submenu">

                            <NavLink
                                to="/app/purchases"
                                className="submenu-link"
                            >
                                Add Purchase Invoice
                            </NavLink>

                            <NavLink
                                to="/app/purchase-register"
                                className="submenu-link"
                            >
                                Purchase Register
                            </NavLink>

                            <NavLink
                                to="/app/purchase-orders"
                                className="submenu-link"
                            >
                                Purchase Orders
                            </NavLink>

                            <NavLink
                                to="/app/purchase-returns"
                                className="submenu-link"
                            >
                                Purchase Returns
                            </NavLink>

                            <NavLink
                                to="/app/debit-notes"
                                className="submenu-link"
                            >
                                Debit Notes
                            </NavLink>

                        </div>

                    )

                }

                {/* ===================================
                    EXPENSES
                =================================== */}

                <div
                    className="menu-title"
                    onClick={()=>toggleMenu("expense")}
                >

                    <div className="menu-left">

                        <FiTruck />

                        <span>

                            Expenses

                        </span>

                    </div>

                    {

                        openMenu === "expense"

                            ? <FiChevronDown />

                            : <FiChevronRight />

                    }

                </div>

                {

                    openMenu==="expense" && (

                        <div className="submenu">

                            <NavLink
                                to="/app/expenses"
                                className="submenu-link"
                            >
                                Add Expense
                            </NavLink>

                            <NavLink
                                to="/app/expense-register"
                                className="submenu-link"
                            >
                                Expense Register
                            </NavLink>

                        </div>

                    )

                }

                {/* ===================================
    HR
=================================== */}

<div
    className="menu-title"
    onClick={() => toggleMenu("hr")}
>

    <div className="menu-left">

        <FiBriefcase />

        <span>
            HR
        </span>

    </div>

    {
        openMenu === "hr"
            ? <FiChevronDown />
            : <FiChevronRight />
    }

</div>

{

    openMenu === "hr" && (

        <div className="submenu">

            <NavLink
                to="/app/employees"
                className="submenu-link"
            >
                Employee Master
            </NavLink>

            <NavLink
                to="/app/attendance"
                className="submenu-link"
            >
                Attendance Entry
            </NavLink>

<NavLink
    to="/app/attendance-register"
    className="submenu-link"
>
    Attendance Register
</NavLink>
            <NavLink
    to="/app/payroll-processing"
    className="submenu-link"
>
    Payroll Processing
</NavLink>

<NavLink
    to="/app/payroll-policy-settings"
    className="submenu-link"
>
    Payroll Policy Settings
</NavLink>    
            <NavLink to="/app/leave-management" className="submenu-link">
  Leave Management
</NavLink>

            <NavLink
    to="/app/payroll-policy-master"
    className="submenu-link"
>
    Payroll Policy Master
</NavLink>

<NavLink
    to="/app/statutory-configuration"
    className="submenu-link"
>
    Statutory Configuration
</NavLink>
            
            <NavLink
    to="/app/attendance-settings"
    className="submenu-link"
>
    Attendance Settings
</NavLink>
            <NavLink
    to="/app/departments"
    className="submenu-link"
>
    Department Master
</NavLink>
            <NavLink
    to="/app/designations"
    className="submenu-link"
>
    Designation Master
</NavLink>
            <NavLink
    to="/app/shifts"
    className="submenu-link"
>
    Shift Master
</NavLink>
            <NavLink
    to="/app/locations"
    className="submenu-link"            
>
    Location Master
</NavLink>
            <NavLink
    to="/app/payslips"
    className="submenu-link"
>
    Payslips
</NavLink>

<NavLink
    to="/app/employee-documents"
    className="submenu-link"
>
    Employee Documents
</NavLink>
            <NavLink to="/app/final-settlement" className="submenu-link">
  Final Settlement
</NavLink>
            
<NavLink
  to="/app/employee-document-repository"
  className="submenu-link"
>
  Document Repository
</NavLink>

<NavLink
  to="/app/performance-management"
  className="submenu-link"
>
  Performance Management
</NavLink>
            <NavLink
  to="/app/expense-reimbursement"
  className="submenu-link"
>
  Expense Reimbursement
</NavLink>
            
<NavLink
  to="/app/employee-loans-advances"
  className="submenu-link"
>
  Employee Loans & Advances
</NavLink>

            <NavLink
  to="/app/holiday-calendar-leave-ledger"
  className="submenu-link"
>
  Holiday Calendar & Leave Ledger
</NavLink>
            <NavLink
  to="/app/hr-dashboard-reports"
  className="submenu-link"
>
  HR Dashboard & Reports
</NavLink>
           <NavLink
  to="/app/employee-self-service"
  className="submenu-link"
>
  Employee Self-Service
</NavLink>

            {/* Employee Asset Management */}
<NavLink
  to="/app/asset-dashboard-reports"
  className="submenu-link"
>
  Asset Dashboard & Reports
</NavLink>

<NavLink
  to="/app/asset-register"
  className="submenu-link"
>
  Asset Register
</NavLink>

<NavLink
  to="/app/employee-asset-assignment"
  className="submenu-link"
>
  Employee Asset Assignment
</NavLink>

<NavLink
  to="/app/vehicle-management"
  className="submenu-link"
>
  Vehicle Management
</NavLink>

<NavLink
  to="/app/asset-maintenance"
  className="submenu-link"
>
  Maintenance & Incidents
</NavLink>

            {/* RECRUITMENT MANAGEMENT */}
<NavLink
  to="/app/recruitment-dashboard-reports"
  className="submenu-link"
>
  Recruitment Dashboard & Reports
</NavLink>

<NavLink
  to="/app/job-requisition-management"
  className="submenu-link"
>
  Job Requisition & Vacancies
</NavLink>

<NavLink
  to="/app/candidate-management"
  className="submenu-link"
>
  Candidate Management
</NavLink>

<NavLink
  to="/app/interview-management"
  className="submenu-link"
>
  Interview Scheduling & Evaluation
</NavLink>

<NavLink
  to="/app/offer-management"
  className="submenu-link"
>
  Offer Management
</NavLink>

{/* TRAINING & DEVELOPMENT */}
<NavLink
  to="/app/training-dashboard-reports"
  className="submenu-link"
>
  Training Dashboard & Reports
</NavLink>

<NavLink
  to="/app/training-program-master"
  className="submenu-link"
>
  Training Programme Master
</NavLink>

<NavLink
  to="/app/training-calendar"
  className="submenu-link"
>
  Training Calendar
</NavLink>

<NavLink
  to="/app/employee-training-assignments"
  className="submenu-link"
>
  Employee Training Assignments
</NavLink>

<NavLink
  to="/app/training-assessment-feedback"
  className="submenu-link"
>
  Training Assessment & Feedback
</NavLink>

{/* HR BUDGET MANAGEMENT */}
<NavLink
  to="/app/hr-budget-dashboard-reports"
  className="submenu-link"
>
  HR Budget Dashboard & Reports
</NavLink>

<NavLink
  to="/app/hr-budget-planning"
  className="submenu-link"
>
  HR Budget Planning
</NavLink>

<NavLink
  to="/app/hr-expense-tracking"
  className="submenu-link"
>
  HR Expense Tracking
</NavLink>

<NavLink
  to="/app/hr-budget-approvals"
  className="submenu-link"
>
  HR Budget Approvals & Revisions
</NavLink>
            
        </div>

    )

}
                              {/* ===================================
                    BANKING
                =================================== */}

                <div
                    className="menu-title"
                    onClick={()=>toggleMenu("banking")}
                >

                    <div className="menu-left">

                        <FiCreditCard />

                        <span>

                            Banking

                        </span>

                    </div>

                    {

                       openMenu === "banking"

                            ? <FiChevronDown />

                            : <FiChevronRight />

                    }

                </div>

                {

                    openMenu==="banking" && (

                        <div className="submenu">

                            <NavLink
                                to="/receipts"
                                className="submenu-link"
                            >
                                Receipts
                            </NavLink>

                            <NavLink
                                to="/app/payments"
                                className="submenu-link"
                            >
                                Payments
                            </NavLink>

                            <NavLink
                                to="/app/contra"
                                className="submenu-link"
                            >
                                Contra
                            </NavLink>

                            <NavLink
                                to="/app/bank-reconciliation"
                                className="submenu-link"
                            >
                                Bank Reconciliation
                            </NavLink>

                        </div>

                    )

                }

                {/* ===================================
                    ACCOUNTING
                =================================== */}

                <div
                    className="menu-title"
                    onClick={()=>toggleMenu("accounting")}
                >

                    <div className="menu-left">

                        <FiBookOpen />

                        <span>

                            Accounting

                        </span>

                    </div>

                    {

                        openMenu === "accounting"

                            ? <FiChevronDown />

                            : <FiChevronRight />

                    }

                </div>

                {

                    openMenu==="accounting" && (

                        <div className="submenu">

                            <NavLink
                                to="/journal-voucher"
                                className="submenu-link"
                            >
                                Journal Voucher
                            </NavLink>

                            <NavLink
                                to="/app/ledger"
                                className="submenu-link"
                            >
                                Ledger
                            </NavLink>

                            <NavLink
                                to="/app/trial-balance"
                                className="submenu-link"
                            >
                                Trial Balance
                            </NavLink>

                            <NavLink
                                to="/app/profit-loss"
                                className="submenu-link"
                            >
                                Profit & Loss
                            </NavLink>

                            <NavLink
                                to="/app/balance-sheet"
                                className="submenu-link"
                            >
                                Balance Sheet
                            </NavLink>

                        </div>

                    )

                }

                {/* ===================================
                    INVENTORY
                =================================== */}

                <div
                    className="menu-title"
                    onClick={()=>toggleMenu("inventory")}
                >

                    <div className="menu-left">

                        <FiPackage />

                        <span>

                            Inventory

                        </span>

                    </div>

                    {

                       openMenu === "inventory"

                            ? <FiChevronDown />

                            : <FiChevronRight />

                    }

                </div>

                {

                    openMenu==="inventory" && (

                        <div className="submenu">

                            <NavLink
                                to="/app/stock-register"
                                className="submenu-link"
                            >
                                Stock Register
                            </NavLink>

                            <NavLink
                                to="/app/stock-adjustment"
                                className="submenu-link"
                            >
                                Stock Adjustment
                            </NavLink>

                            <NavLink
                                to="/app/stock-transfer"
                                className="submenu-link"
                            >
                                Stock Transfer
                            </NavLink>

                            <NavLink
                                to="/app/physical-stock"
                                className="submenu-link"
                            >
                                Physical Stock
                            </NavLink>

                        </div>

                    )

                }
                              {/* ===================================
                    GST
                =================================== */}

                <div
                    className="menu-title"
                    onClick={() => toggleMenu("gst")}
                >

                    <div className="menu-left">

                        <FiFileText />

                        <span>

                            GST

                        </span>

                    </div>

                    {

                       openMenu === "gst"

                            ? <FiChevronDown />

                            : <FiChevronRight />

                    }

                </div>

                {

                    openMenu === "gst" && (

                        <div className="submenu">

                            <NavLink
                                to="/app/gstr1"
                                className="submenu-link"
                            >
                                GSTR-1
                            </NavLink>

                            <NavLink
                                to="/app/gstr3b"
                                className="submenu-link"
                            >
                                GSTR-3B
                            </NavLink>

                            <NavLink
                                to="/app/gstr2b"
                                className="submenu-link"
                            >
                                GSTR-2B
                            </NavLink>

                            <NavLink
                                to="/app/eway-bills"
                                className="submenu-link"
                            >
                                E-Way Bills
                            </NavLink>

                            <NavLink
                                to="/app/einvoice"
                                className="submenu-link"
                            >
                                E-Invoice
                            </NavLink>

                        </div>

                    )

                }

                {/* ===================================
                    REPORTS
                =================================== */}

                <div
                    className="menu-title"
                   onClick={() => toggleMenu("reports")}
                >

                    <div className="menu-left">

                        <FiBarChart2 />

                        <span>

                            Reports

                        </span>

                    </div>

                    {

                        openMenu === "reports"

                            ? <FiChevronDown />

                            : <FiChevronRight />

                    }

                </div>

                {

                    openMenu === "reports" && (

                        <div className="submenu">

                            <NavLink
                                to="/app/sales-reports"
                                className="submenu-link"
                            >
                                Sales Reports
                            </NavLink>

                            <NavLink
                                to="/purchase-reports"
                                className="submenu-link"
                            >
                                Purchase Reports
                            </NavLink>

                            <NavLink
                                to="/app/expense-reports"
                                className="submenu-link"
                            >
                                Expense Reports
                            </NavLink>

                            <NavLink
                                to="/app/customer-ledger"
                                className="submenu-link"
                            >
                                Customer Ledger
                            </NavLink>

                            <NavLink
                                to="/app/vendor-ledger"
                                className="submenu-link"
                            >
                                Vendor Ledger
                            </NavLink>

                            <NavLink
                                to="/app/item-ledger"
                                className="submenu-link"
                            >
                                Item Ledger
                            </NavLink>

                            <NavLink
                                to="/app/gst-reports"
                                className="submenu-link"
                            >
                                GST Reports
                            </NavLink>

                        </div>

                    )

                }

                {/* ===================================
                    SETTINGS
                =================================== */}

                <div
                    className="menu-title"
                    onClick={() => toggleMenu("settings")}
                >

                    <div className="menu-left">

                        <FiSettings />

                        <span>

                            Settings

                        </span>

                    </div>

                    {

                        openMenu === "settings"

                            ? <FiChevronDown />

                            : <FiChevronRight />

                    }

                </div>

                {

                    openMenu === "settings" && (

                        <div className="submenu">

                            <NavLink
                                to="/app/invoice-settings"
                                className="submenu-link"
                            >
                                Invoice Settings
                            </NavLink>

                            <NavLink
                                to="/app/company-settings"
                                className="submenu-link"
                            >
                                Company Settings
                            </NavLink>

                            <NavLink
                                to="/app/users"
                                className="submenu-link"
                            >
                                Users
                            </NavLink>

                            <NavLink
                                to="/app/roles"
                                className="submenu-link"
                            >
                                Roles & Permissions
                            </NavLink>

                            <NavLink
                                to="/app/backup"
                                className="submenu-link"
                            >
                                Backup & Restore
                            </NavLink>

                            



                        </div>

                    )

                }

            </nav>

        </aside>

    );

}

export default Sidebar;
