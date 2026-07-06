import React from "react";

import { Link } from "react-router-dom";

import {

    FiFileText,

    FiShoppingCart,

    FiBox,

    FiDollarSign,

    FiBarChart2,

    FiUsers,

    FiShield,

    FiCloud

} from "react-icons/fi";

import "../../css/features/Features.css";

function Features() {

    return (

        <div className="features-page">

            {/* ============================
                HERO
            ============================ */}

            <section className="features-hero">

                <span className="hero-badge">

                    POWERFUL BUSINESS SOFTWARE

                </span>

                <h1>

                    Everything You Need
                    To Run Your Business

                </h1>

                <p>

                    EAZYTAXATION ERP combines GST Billing,
                    Inventory, Accounting, Purchases,
                    Expenses and Business Reports
                    into one cloud platform.

                </p>

            </section>

            {/* ============================
                FEATURES GRID
            ============================ */}

            <section className="features-grid">

                <div className="feature-card">

                    <FiFileText className="feature-icon"/>

                    <h3>

                        GST Billing

                    </h3>

                    <p>

                        Create GST invoices,
                        quotations,
                        credit notes,
                        debit notes
                        and e-invoices.

                    </p>

                </div>

                <div className="feature-card">

                    <FiShoppingCart className="feature-icon"/>

                    <h3>

                        Purchase Management

                    </h3>

                    <p>

                        Record supplier invoices,
                        purchase returns,
                        debit notes
                        and vendor payments.

                    </p>

                </div>

                <div className="feature-card">

                    <FiDollarSign className="feature-icon"/>

                    <h3>

                        Expense Tracking

                    </h3>

                    <p>

                        Track office expenses,
                        salaries,
                        utilities,
                        travel,
                        maintenance
                        and reimbursements.

                    </p>

                </div>

                <div className="feature-card">

                    <FiBox className="feature-icon"/>

                    <h3>

                        Inventory

                    </h3>

                    <p>

                        Manage stock,
                        warehouses,
                        transfers,
                        adjustments
                        and item valuation.

                    </p>

                </div>

                <div className="feature-card">

                    <FiBarChart2 className="feature-icon"/>

                    <h3>

                        Business Reports

                    </h3>

                    <p>

                        Sales,
                        Purchase,
                        GST,
                        Profit & Loss,
                        Balance Sheet
                        and Ledger Reports.

                    </p>

                </div>

                <div className="feature-card">

                    <FiUsers className="feature-icon"/>

                    <h3>

                        Multi User

                    </h3>

                    <p>

                        Multiple users,
                        role management
                        and department-wise
                        access permissions.

                    </p>

                </div>

                <div className="feature-card">

                    <FiShield className="feature-icon"/>

                    <h3>

                        Secure

                    </h3>

                    <p>

                        Enterprise-grade
                        authentication,
                        SSL encryption
                        and daily backups.

                    </p>

                </div>

                <div className="feature-card">

                    <FiCloud className="feature-icon"/>

                    <h3>

                        Cloud Based

                    </h3>

                    <p>

                        Access your business
                        securely from
                        desktop,
                        tablet
                        or mobile.

                    </p>

                </div>

            </section>
                      {/* ============================
                WHY EAZYTAXATION
            ============================ */}

            <section className="why-section">

                <div className="why-content">

                    <h2>

                        Why Businesses Choose
                        EAZYTAXATION ERP

                    </h2>

                    <p>

                        Built specifically for Indian businesses,
                        EAZYTAXATION helps you manage your
                        complete business operations from a
                        single cloud platform.

                    </p>

                    <div className="why-grid">

                        <div className="why-item">

                            <h3>

                                GST Ready

                            </h3>

                            <p>

                                Stay compliant with Indian GST
                                regulations through automated
                                tax calculations and GST reports.

                            </p>

                        </div>

                        <div className="why-item">

                            <h3>

                                Easy To Use

                            </h3>

                            <p>

                                A clean and intuitive interface
                                designed for business owners,
                                accountants and staff.

                            </p>

                        </div>

                        <div className="why-item">

                            <h3>

                                Fast & Secure

                            </h3>

                            <p>

                                Secure cloud infrastructure with
                                encrypted data and automatic
                                backups.

                            </p>

                        </div>

                        <div className="why-item">

                            <h3>

                                Grow With You

                            </h3>

                            <p>

                                From a single-user business to
                                large enterprises, scale your
                                operations without changing
                                software.

                            </p>

                        </div>

                    </div>

                </div>

            </section>

            {/* ============================
                CALL TO ACTION
            ============================ */}

            <section className="features-cta">

                <h2>

                    Ready To Simplify Your Business?

                </h2>

                <p>

                    Join thousands of businesses managing
                    Sales, Purchases, Inventory,
                    Accounting and GST from one platform.

                </p>

                <div className="cta-buttons">

                    <Link
                        to="/register"
                        className="primary-btn"
                    >

                        Start Free Trial

                    </Link>

                    <Link
                        to="/contact"
                        className="secondary-btn"
                    >

                        Contact Sales

                    </Link>

                </div>

            </section>

            {/* ============================
                FOOTER
            ============================ */}

            <footer className="features-footer">

                <div className="footer-links">

                    <Link to="/">

                        Home

                    </Link>

                    <Link to="/about">

                        About

                    </Link>

                    <Link to="/pricing">

                        Pricing

                    </Link>

                    <Link to="/contact">

                        Contact

                    </Link>

                </div>

                <p>

                    © {new Date().getFullYear()}
                    {" "}
                    EAZYTAXATION ERP.
                    All Rights Reserved.

                </p>

            </footer>

        </div>

    );

}

export default Features;
