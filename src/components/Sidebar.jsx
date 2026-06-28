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
