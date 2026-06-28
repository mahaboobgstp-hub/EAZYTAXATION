import React, { useState } from "react";

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

    const [openMenu, setOpenMenu] = useState("sales");
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

                    <h4>

                        EAZYTAXATION Pvt Ltd

                    </h4>

                </div>

                <FiChevronDown className="company-arrow"/>

            </div>

            {/* =======================================
                MENU
            ======================================= */}

            <nav className="sidebar-menu">

                <NavLink

                    to="/dashboard"

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

                        mastersOpen

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

                                to="/"

                                className="submenu-link"

                            >

                                Company

                            </NavLink>

                            <NavLink

                                to="/customers"

                                className="submenu-link"

                            >

                                Customers

                            </NavLink>

                            <NavLink

                                to="/vendors"

                                className="submenu-link"

                            >

                                Vendors

                            </NavLink>

                            <NavLink

                                to="/items"

                                className="submenu-link"

                            >

                                Items

                            </NavLink>

                            <NavLink

                                to="/expense-categories"

                                className="submenu-link"

                            >

                                Expense Categories

                            </NavLink>

                            <NavLink

                                to="/asset-categories"

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

                                to="/uom"

                                className="submenu-link"

                            >

                                Units (UOM)

                            </NavLink>

                            <NavLink

                                to="/gst-rates"

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

                        salesOpen

                            ? <FiChevronDown />

                            : <FiChevronRight />

                    }

                </div>

                {

                    openMenu==="sales" && (

                        <div className="submenu">

                            <NavLink
                                to="/sales"
                                className="submenu-link"
                            >
                                Add Sales Invoice
                            </NavLink>

                            <NavLink
                                to="/sales-register"
                                className="submenu-link"
                            >
                                Sales Register
                            </NavLink>

                            <NavLink
                                to="/quotations"
                                className="submenu-link"
                            >
                                Quotations
                            </NavLink>

                            <NavLink
                                to="/sales-orders"
                                className="submenu-link"
                            >
                                Sales Orders
                            </NavLink>

                            <NavLink
                                to="/delivery-challans"
                                className="submenu-link"
                            >
                                Delivery Challans
                            </NavLink>

                            <NavLink
                                to="/credit-notes"
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

                        purchaseOpen

                            ? <FiChevronDown />

                            : <FiChevronRight />

                    }

                </div>

                {

                    openMenu==="purchase" && (

                        <div className="submenu">

                            <NavLink
                                to="/purchases"
                                className="submenu-link"
                            >
                                Add Purchase Invoice
                            </NavLink>

                            <NavLink
                                to="/purchase-register"
                                className="submenu-link"
                            >
                                Purchase Register
                            </NavLink>

                            <NavLink
                                to="/purchase-orders"
                                className="submenu-link"
                            >
                                Purchase Orders
                            </NavLink>

                            <NavLink
                                to="/purchase-returns"
                                className="submenu-link"
                            >
                                Purchase Returns
                            </NavLink>

                            <NavLink
                                to="/debit-notes"
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
                    onClick={() => setExpenseOpen(!expenseOpen)}
                >

                    <div className="menu-left">

                        <FiTruck />

                        <span>

                            Expenses

                        </span>

                    </div>

                    {

                        expenseOpen

                            ? <FiChevronDown />

                            : <FiChevronRight />

                    }

                </div>

                {

                    expenseOpen && (

                        <div className="submenu">

                            <NavLink
                                to="/expenses"
                                className="submenu-link"
                            >
                                Add Expense
                            </NavLink>

                            <NavLink
                                to="/expense-register"
                                className="submenu-link"
                            >
                                Expense Register
                            </NavLink>

                        </div>

                    )

                }
                              {/* ===================================
                    BANKING
                =================================== */}

                <div
                    className="menu-title"
                    onClick={() => setBankingOpen(!bankingOpen)}
                >

                    <div className="menu-left">

                        <FiCreditCard />

                        <span>

                            Banking

                        </span>

                    </div>

                    {

                        bankingOpen

                            ? <FiChevronDown />

                            : <FiChevronRight />

                    }

                </div>

                {

                    bankingOpen && (

                        <div className="submenu">

                            <NavLink
                                to="/receipts"
                                className="submenu-link"
                            >
                                Receipts
                            </NavLink>

                            <NavLink
                                to="/payments"
                                className="submenu-link"
                            >
                                Payments
                            </NavLink>

                            <NavLink
                                to="/contra"
                                className="submenu-link"
                            >
                                Contra
                            </NavLink>

                            <NavLink
                                to="/bank-reconciliation"
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

                        accountingOpen

                            ? <FiChevronDown />

                            : <FiChevronRight />

                    }

                </div>

                {

                    accountingOpen && (

                        <div className="submenu">

                            <NavLink
                                to="/journal-voucher"
                                className="submenu-link"
                            >
                                Journal Voucher
                            </NavLink>

                            <NavLink
                                to="/ledger"
                                className="submenu-link"
                            >
                                Ledger
                            </NavLink>

                            <NavLink
                                to="/trial-balance"
                                className="submenu-link"
                            >
                                Trial Balance
                            </NavLink>

                            <NavLink
                                to="/profit-loss"
                                className="submenu-link"
                            >
                                Profit & Loss
                            </NavLink>

                            <NavLink
                                to="/balance-sheet"
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

                        inventoryOpen

                            ? <FiChevronDown />

                            : <FiChevronRight />

                    }

                </div>

                {

                    openMenu==="inventory" && (

                        <div className="submenu">

                            <NavLink
                                to="/stock-register"
                                className="submenu-link"
                            >
                                Stock Register
                            </NavLink>

                            <NavLink
                                to="/stock-adjustment"
                                className="submenu-link"
                            >
                                Stock Adjustment
                            </NavLink>

                            <NavLink
                                to="/stock-transfer"
                                className="submenu-link"
                            >
                                Stock Transfer
                            </NavLink>

                            <NavLink
                                to="/physical-stock"
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
                    onClick={() => setGSTOpen(!gstOpen)}
                >

                    <div className="menu-left">

                        <FiFileText />

                        <span>

                            GST

                        </span>

                    </div>

                    {

                        gstOpen

                            ? <FiChevronDown />

                            : <FiChevronRight />

                    }

                </div>

                {

                    gstOpen && (

                        <div className="submenu">

                            <NavLink
                                to="/gstr1"
                                className="submenu-link"
                            >
                                GSTR-1
                            </NavLink>

                            <NavLink
                                to="/gstr3b"
                                className="submenu-link"
                            >
                                GSTR-3B
                            </NavLink>

                            <NavLink
                                to="/gstr2b"
                                className="submenu-link"
                            >
                                GSTR-2B
                            </NavLink>

                            <NavLink
                                to="/eway-bills"
                                className="submenu-link"
                            >
                                E-Way Bills
                            </NavLink>

                            <NavLink
                                to="/einvoice"
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
                    onClick={() => setReportsOpen(!reportsOpen)}
                >

                    <div className="menu-left">

                        <FiBarChart2 />

                        <span>

                            Reports

                        </span>

                    </div>

                    {

                        reportsOpen

                            ? <FiChevronDown />

                            : <FiChevronRight />

                    }

                </div>

                {

                    reportsOpen && (

                        <div className="submenu">

                            <NavLink
                                to="/sales-reports"
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
                                to="/expense-reports"
                                className="submenu-link"
                            >
                                Expense Reports
                            </NavLink>

                            <NavLink
                                to="/customer-ledger"
                                className="submenu-link"
                            >
                                Customer Ledger
                            </NavLink>

                            <NavLink
                                to="/vendor-ledger"
                                className="submenu-link"
                            >
                                Vendor Ledger
                            </NavLink>

                            <NavLink
                                to="/item-ledger"
                                className="submenu-link"
                            >
                                Item Ledger
                            </NavLink>

                            <NavLink
                                to="/gst-reports"
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
                    onClick={() => setSettingsOpen(!settingsOpen)}
                >

                    <div className="menu-left">

                        <FiSettings />

                        <span>

                            Settings

                        </span>

                    </div>

                    {

                        settingsOpen

                            ? <FiChevronDown />

                            : <FiChevronRight />

                    }

                </div>

                {

                    settingsOpen && (

                        <div className="submenu">

                            <NavLink
                                to="/invoice-settings"
                                className="submenu-link"
                            >
                                Invoice Settings
                            </NavLink>

                            <NavLink
                                to="/company-settings"
                                className="submenu-link"
                            >
                                Company Settings
                            </NavLink>

                            <NavLink
                                to="/users"
                                className="submenu-link"
                            >
                                Users
                            </NavLink>

                            <NavLink
                                to="/roles"
                                className="submenu-link"
                            >
                                Roles & Permissions
                            </NavLink>

                            <NavLink
                                to="/backup"
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
