import React from "react";
import { Link } from "react-router-dom";

import {
    FiArrowRight,
    FiFileText,
    FiBox,
    FiDollarSign,
    FiBarChart2
} from "react-icons/fi";

import "../../css/landing/Landing.css";

function Landing() {

    return (

        <div className="landing-page">

            {/* ======================================
                NAVBAR
            ====================================== */}

            <header className="landing-navbar">

                <div className="landing-logo">

                    <div className="logo-box">

                        ET

                    </div>

                    <div>

                        <h2>EAZYTAXATION</h2>

                        <span>ERP</span>

                    </div>

                </div>

                <nav className="landing-menu">

                    <Link to="/features">

                        Features

                    </Link>
                    <Link to="/pricing">

        Pricing

    </Link>

                    <Link to="/about">

                        About

                    </Link>

                    <Link to="/contact">

                        Contact

                    </Link>

                </nav>

                <div className="landing-buttons">

                    <Link
                        to="/login"
                        className="btn-outline"
                    >

                        Login

                    </Link>

                    <Link
                        to="/register"
                        className="btn-primary"
                    >

                        Start Free Trial

                    </Link>

                </div>

            </header>

            {/* ======================================
                HERO
            ====================================== */}

            <section className="hero-section">

                <div className="hero-left">

                    <div className="hero-badge">

                        INDIA'S NEXT GENERATION GST ERP

                    </div>

                    <h1>

                        GST Billing,

                        <br />

                        Accounting &

                        <br />

                        Business Management

                        <br />

                        Made Simple.

                    </h1>

                    <p>

                        One cloud software to manage GST Billing,

                        Sales, Purchases, Expenses,

                        Inventory and Accounting from anywhere.

                    </p>

                    <div className="hero-buttons">

                        <Link
                            to="/register"
                            className="btn-primary"
                        >

                            Start Free Trial

                        </Link>

                        <Link
                            to="/login"
                            className="btn-outline"
                        >

                            Login

                            <FiArrowRight />

                        </Link>

                    </div>

                </div>

                <div className="hero-right">

                    <div className="dashboard-preview">

                        <div className="browser-top">

                            <span className="dot red"></span>

                            <span className="dot yellow"></span>

                            <span className="dot green"></span>

                        </div>

                        <div className="dashboard-box"></div>

                        <div className="dashboard-box"></div>

                        <div className="dashboard-box"></div>

                        <div className="dashboard-box large"></div>

                    </div>

                </div>

            </section>

                      {/* ======================================
                FEATURES
            ====================================== */}

            <section className="features-section">

                <div className="section-title">

                    <h2>

                        Everything Your Business Needs

                    </h2>

                    <p>

                        Powerful modules designed to simplify
                        day-to-day business operations.

                    </p>

                </div>

                <div className="features-grid">

                    <div className="feature-card">

                        <div className="feature-icon">

                            <FiFileText />

                        </div>

                        <h3>

                            GST Billing

                        </h3>

                        <p>

                            Create GST invoices, quotations,
                            purchase invoices and manage taxes
                            with ease.

                        </p>

                    </div>

                    <div className="feature-card">

                        <div className="feature-icon">

                            <FiBox />

                        </div>

                        <h3>

                            Inventory

                        </h3>

                        <p>

                            Track stock, items, purchases,
                            suppliers and inventory movement
                            in real time.

                        </p>

                    </div>

                    <div className="feature-card">

                        <div className="feature-icon">

                            <FiDollarSign />

                        </div>

                        <h3>

                            Accounting

                        </h3>

                        <p>

                            Record expenses, banking,
                            ledgers and financial transactions
                            in one place.

                        </p>

                    </div>

                    <div className="feature-card">

                        <div className="feature-icon">

                            <FiBarChart2 />

                        </div>

                        <h3>

                            Reports

                        </h3>

                        <p>

                            Generate GST reports,
                            sales reports, purchase reports
                            and business insights instantly.

                        </p>

                    </div>

                </div>

            </section>

            {/* ======================================
                CALL TO ACTION
            ====================================== */}

            <section className="cta-section">

                <h2>

                    Start Managing Your Business Smarter

                </h2>

                <p>

                    Join EAZYTAXATION ERP and simplify
                    GST Billing, Accounting,
                    Inventory and Business Management.

                </p>

                <div className="cta-buttons">

                    <Link
                        to="/register"
                        className="btn-primary"
                    >

                        Start Free Trial

                    </Link>

                    <Link
                        to="/login"
                        className="btn-outline"
                    >

                        Login

                    </Link>

                </div>

            </section>
                      {/* ======================================
                FOOTER
            ====================================== */}

            <footer className="landing-footer">

                <div className="footer-content">

                    <div className="footer-brand">

                        <div className="logo-box">

                            ET

                        </div>

                        <div>

                            <h3>

                                EAZYTAXATION ERP

                            </h3>

                            <p>

                                Modern GST Billing, Accounting,
                                Inventory & Business Management
                                Software for Indian Businesses.

                            </p>

                        </div>

                    </div>

                    <div className="footer-links">

                        <Link to="/features">

                            Features

                        </Link>
                        <Link to="/pricing">

    Pricing

</Link>

                        <Link to="/about">

                            About

                        </Link>

                        <Link to="/contact">

                            Contact

                        </Link>

                        <Link to="/privacy-policy">

                            Privacy Policy

                        </Link>

                        

                    </div>

                </div>

                <div className="footer-bottom">

                    © {new Date().getFullYear()} EAZYTAXATION ERP.
                    All Rights Reserved.

                </div>

            </footer>

        </div>

    );

}

export default Landing;
