import React, { useState } from "react";
import { Link } from "react-router-dom";

import "../css/Sidebar.css";

function Sidebar() {

    const [mastersOpen, setMastersOpen] = useState(true);

    return (

        <div className="sidebar">

            {/* ===============================
                LOGO
            =============================== */}

            <div className="sidebar-logo">

                <h2>

                    EAZYTAXATION ERP

                </h2>

            </div>

            {/* ===============================
                SWITCH COMPANY
            =============================== */}

            <div className="company-switch">

                <label>

                    Current Company

                </label>

                <select>

                    <option>

                        EAZYTAXATION PVT LTD

                    </option>

                </select>

            </div>

            {/* ===============================
                MENU
            =============================== */}

            <div className="sidebar-menu">

                {/* Dashboard */}

                <Link

                    to="/dashboard"

                    className="menu-item"

                >

                    🏠 Dashboard

                </Link>
                                {/* =======================
                    SALES
                ======================= */}

                <div
                    className="menu-header"
                    onClick={() =>
                        setSalesOpen(
                            !salesOpen
                        )
                    }
                >

                    <span>

                        Sales

                    </span>

                    <span>

                        {

                            salesOpen

                                ? "▼"

                                : "▶"

                        }

                    </span>

                </div>

                {

                    salesOpen && (

                        <div className="submenu">

                            <Link
                                to="/sales"
                                className="submenu-item"
                            >

                                Add Sales Invoice

                            </Link>

                            <Link
                                to="/sales-register"
                                className="submenu-item"
                            >

                                Sales Register

                            </Link>

                            <Link
                                to="/quotations"
                                className="submenu-item"
                            >

                                Quotations

                            </Link>

                            <Link
                                to="/sales-orders"
                                className="submenu-item"
                            >

                                Sales Orders

                            </Link>

                            <Link
                                to="/delivery-challans"
                                className="submenu-item"
                            >

                                Delivery Challans

                            </Link>

                            <Link
                                to="/credit-notes"
                                className="submenu-item"
                            >

                                Credit Notes

                            </Link>

                        </div>

                    )

                }

                {/* =======================
                    PURCHASES
                ======================= */}

                <div
                    className="menu-header"
                    onClick={() =>
                        setPurchasesOpen(
                            !purchasesOpen
                        )
                    }
                >

                    <span>

                        Purchases

                    </span>

                    <span>

                        {

                            purchasesOpen

                                ? "▼"

                                : "▶"

                        }

                    </span>

                </div>

                {

                    purchasesOpen && (

                        <div className="submenu">

                            <Link
                                to="/purchases"
                                className="submenu-item"
                            >

                                Add Purchase Invoice

                            </Link>

                            <Link
                                to="/purchase-register"
                                className="submenu-item"
                            >

                                Purchase Register

                            </Link>

                            <Link
                                to="/purchase-orders"
                                className="submenu-item"
                            >

                                Purchase Orders

                            </Link>

                            <Link
                                to="/purchase-returns"
                                className="submenu-item"
                            >

                                Purchase Returns

                            </Link>

                            <Link
                                to="/debit-notes"
                                className="submenu-item"
                            >

                                Debit Notes

                            </Link>

                        </div>

                    )

                }

                {/* =======================
                    EXPENSES
                ======================= */}

                <div
                    className="menu-header"
                    onClick={() =>
                        setExpensesOpen(
                            !expensesOpen
                        )
                    }
                >

                    <span>

                        Expenses

                    </span>

                    <span>

                        {

                            expensesOpen

                                ? "▼"

                                : "▶"

                        }

                    </span>

                </div>

                {

                    expensesOpen && (

                        <div className="submenu">

                            <Link
                                to="/expenses"
                                className="submenu-item"
                            >

                                Add Expense

                            </Link>

                            <Link
                                to="/expense-register"
                                className="submenu-item"
                            >

                                Expense Register

                            </Link>

                        </div>

                    )

                }
                                {/* =======================
                    BANKING
                ======================= */}

                <div
                    className="menu-header"
                    onClick={() =>
                        setBankingOpen(
                            !bankingOpen
                        )
                    }
                >

                    <span>

                        Banking

                    </span>

                    <span>

                        {

                            bankingOpen

                                ? "▼"

                                : "▶"

                        }

                    </span>

                </div>

                {

                    bankingOpen && (

                        <div className="submenu">

                            <Link
                                to="/receipts"
                                className="submenu-item"
                            >

                                Receipts

                            </Link>

                            <Link
                                to="/payments"
                                className="submenu-item"
                            >

                                Payments

                            </Link>

                            <Link
                                to="/contra"
                                className="submenu-item"
                            >

                                Contra

                            </Link>

                            <Link
                                to="/bank-reconciliation"
                                className="submenu-item"
                            >

                                Bank Reconciliation

                            </Link>

                        </div>

                    )

                }

                {/* =======================
                    ACCOUNTING
                ======================= */}

                <div
                    className="menu-header"
                    onClick={() =>
                        setAccountingOpen(
                            !accountingOpen
                        )
                    }
                >

                    <span>

                        Accounting

                    </span>

                    <span>

                        {

                            accountingOpen

                                ? "▼"

                                : "▶"

                        }

                    </span>

                </div>

                {

                    accountingOpen && (

                        <div className="submenu">

                            <Link
                                to="/journal-voucher"
                                className="submenu-item"
                            >

                                Journal Voucher

                            </Link>

                            <Link
                                to="/ledger"
                                className="submenu-item"
                            >

                                Ledger

                            </Link>

                            <Link
                                to="/trial-balance"
                                className="submenu-item"
                            >

                                Trial Balance

                            </Link>

                            <Link
                                to="/profit-loss"
                                className="submenu-item"
                            >

                                Profit & Loss

                            </Link>

                            <Link
                                to="/balance-sheet"
                                className="submenu-item"
                            >

                                Balance Sheet

                            </Link>

                        </div>

                    )

                }

                {/* =======================
                    INVENTORY
                ======================= */}

                <div
                    className="menu-header"
                    onClick={() =>
                        setInventoryOpen(
                            !inventoryOpen
                        )
                    }
                >

                    <span>

                        Inventory

                    </span>

                    <span>

                        {

                            inventoryOpen

                                ? "▼"

                                : "▶"

                        }

                    </span>

                </div>

                {

                    inventoryOpen && (

                        <div className="submenu">

                            <Link
                                to="/stock-register"
                                className="submenu-item"
                            >

                                Stock Register

                            </Link>

                            <Link
                                to="/stock-adjustment"
                                className="submenu-item"
                            >

                                Stock Adjustment

                            </Link>

                            <Link
                                to="/stock-transfer"
                                className="submenu-item"
                            >

                                Stock Transfer

                            </Link>

                            <Link
                                to="/physical-stock"
                                className="submenu-item"
                            >

                                Physical Stock

                            </Link>

                        </div>

                    )

                }
                                {/* =======================
                    GST
                ======================= */}

                <div
                    className="menu-header"
                    onClick={() =>
                        setGSTOpen(
                            !gstOpen
                        )
                    }
                >

                    <span>

                        GST

                    </span>

                    <span>

                        {

                            gstOpen

                                ? "▼"

                                : "▶"

                        }

                    </span>

                </div>

                {

                    gstOpen && (

                        <div className="submenu">

                            <Link
                                to="/gstr1"
                                className="submenu-item"
                            >

                                GSTR-1

                            </Link>

                            <Link
                                to="/gstr3b"
                                className="submenu-item"
                            >

                                GSTR-3B

                            </Link>

                            <Link
                                to="/gstr2b"
                                className="submenu-item"
                            >

                                GSTR-2B

                            </Link>

                            <Link
                                to="/eway-bills"
                                className="submenu-item"
                            >

                                E-Way Bills

                            </Link>

                            <Link
                                to="/einvoice"
                                className="submenu-item"
                            >

                                E-Invoice

                            </Link>

                        </div>

                    )

                }

                {/* =======================
                    REPORTS
                ======================= */}

                <div
                    className="menu-header"
                    onClick={() =>
                        setReportsOpen(
                            !reportsOpen
                        )
                    }
                >

                    <span>

                        Reports

                    </span>

                    <span>

                        {

                            reportsOpen

                                ? "▼"

                                : "▶"

                        }

                    </span>

                </div>

                {

                    reportsOpen && (

                        <div className="submenu">

                            <Link
                                to="/sales-reports"
                                className="submenu-item"
                            >

                                Sales Reports

                            </Link>

                            <Link
                                to="/purchase-reports"
                                className="submenu-item"
                            >

                                Purchase Reports

                            </Link>

                            <Link
                                to="/expense-reports"
                                className="submenu-item"
                            >

                                Expense Reports

                            </Link>

                            <Link
                                to="/customer-ledger"
                                className="submenu-item"
                            >

                                Customer Ledger

                            </Link>

                            <Link
                                to="/vendor-ledger"
                                className="submenu-item"
                            >

                                Vendor Ledger

                            </Link>

                            <Link
                                to="/item-ledger"
                                className="submenu-item"
                            >

                                Item Ledger

                            </Link>

                            <Link
                                to="/gst-reports"
                                className="submenu-item"
                            >

                                GST Reports

                            </Link>

                        </div>

                    )

                }

                {/* =======================
                    SETTINGS
                ======================= */}

                <div
                    className="menu-header"
                    onClick={() =>
                        setSettingsOpen(
                            !settingsOpen
                        )
                    }
                >

                    <span>

                        Settings

                    </span>

                    <span>

                        {

                            settingsOpen

                                ? "▼"

                                : "▶"

                        }

                    </span>

                </div>

                {

                    settingsOpen && (

                        <div className="submenu">

                            <Link
                                to="/invoice-settings"
                                className="submenu-item"
                            >

                                Invoice Settings

                            </Link>

                            <Link
                                to="/company-settings"
                                className="submenu-item"
                            >

                                Company Settings

                            </Link>

                            <Link
                                to="/users"
                                className="submenu-item"
                            >

                                Users

                            </Link>

                            <Link
                                to="/roles"
                                className="submenu-item"
                            >

                                Roles & Permissions

                            </Link>

                            <Link
                                to="/backup"
                                className="submenu-item"
                            >

                                Backup & Restore

                            </Link>

                        </div>

                    )

                }
                {/* =======================
                    MASTERS
                ======================= */}

                <div
                    className="menu-header"
                    onClick={() =>
                        setMastersOpen(
                            !mastersOpen
                        )
                    }
                >

                    <span>

                        Masters

                    </span>

                    <span>

                        {

                            mastersOpen

                                ? "▼"

                                : "▶"

                        }

                    </span>

                </div>

                {

                    mastersOpen && (

                        <div className="submenu">

                            <Link
                                to="/"
                                className="submenu-item"
                            >

                                Company

                            </Link>

                            <Link
                                to="/customers"
                                className="submenu-item"
                            >

                                Customers

                            </Link>

                            <Link
                                to="/vendors"
                                className="submenu-item"
                            >

                                Vendors

                            </Link>

                            <Link
                                to="/items"
                                className="submenu-item"
                            >

                                Items

                            </Link>

                            <Link
                                to="/expense-categories"
                                className="submenu-item"
                            >

                                Expense Categories

                            </Link>

                            <Link
                                to="/asset-categories"
                                className="submenu-item"
                            >

                                Asset Categories

                            </Link>

                            <Link
                                to="/banks"
                                className="submenu-item"
                            >

                                Banks

                            </Link>

                            <Link
                                to="/payment-terms"
                                className="submenu-item"
                            >

                                Payment Terms

                            </Link>

                            <Link
                                to="/uom"
                                className="submenu-item"
                            >

                                Units (UOM)

                            </Link>

                            <Link
                                to="/gst-rates"
                                className="submenu-item"
                            >

                                GST Rates

                            </Link>

                        </div>

                    )

                }

            </div>

        </div>

    );

}

export default Sidebar;
