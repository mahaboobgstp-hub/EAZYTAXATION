import React from "react";
import { Link } from "react-router-dom";

import {
    FiTarget,
    FiEye,
    FiCheckCircle
} from "react-icons/fi";

import "../../css/about/About.css";

function About() {

    return (

        <div className="about-page">

            {/* ==========================
                HERO
            ========================== */}

            <section className="about-hero">

                <span className="about-badge">

                    ABOUT EAZYTAXATION ERP

                </span>

                <h1>

                    Simplifying Business
                    Management For Every
                    Indian Business

                </h1>

                <p>

                    Our mission is to build a modern,
                    cloud-based ERP that helps businesses
                    manage GST Billing, Accounting,
                    Inventory, Purchases and Business
                    Operations from one powerful platform.

                </p>

            </section>

            {/* ==========================
                OUR STORY
            ========================== */}

            <section className="story-section">

                <div className="story-content">

                    <h2>

                        Our Story

                    </h2>

                    <p>

                        EAZYTAXATION ERP was created with
                        a simple goal — make business
                        management easy, affordable and
                        accessible for every entrepreneur.

                    </p>

                    <p>

                        Small and medium businesses often
                        struggle with multiple software for
                        billing, inventory, accounting and
                        GST compliance. We believe one
                        platform should handle everything.

                    </p>

                    <p>

                        That's why we're building an ERP
                        designed specifically for Indian
                        businesses with a modern interface,
                        cloud technology and continuous
                        innovation.

                    </p>

                </div>

            </section>

            {/* ==========================
                MISSION & VISION
            ========================== */}

            <section className="mission-section">

                <div className="mission-card">

                    <FiTarget className="mission-icon"/>

                    <h3>

                        Our Mission

                    </h3>

                    <p>

                        To simplify GST Billing,
                        Accounting and Business
                        Management through an
                        affordable cloud ERP.

                    </p>

                </div>

                <div className="mission-card">

                    <FiEye className="mission-icon"/>

                    <h3>

                        Our Vision

                    </h3>

                    <p>

                        To become India's most
                        trusted ERP platform for
                        startups, SMEs and growing
                        enterprises.

                    </p>

                </div>

            </section>

                      {/* ==========================
                WHY CHOOSE US
            ========================== */}

            <section className="why-about-section">

                <div className="section-heading">

                    <h2>

                        Why Choose EAZYTAXATION ERP?

                    </h2>

                    <p>

                        We are committed to building a
                        modern, reliable and scalable ERP
                        platform that grows with your
                        business.

                    </p>

                </div>

                <div className="why-grid">

                    <div className="why-card">

                        <FiCheckCircle className="why-icon" />

                        <h3>

                            Modern Cloud ERP

                        </h3>

                        <p>

                            Access your business securely
                            anytime and anywhere from
                            desktop, tablet or mobile.

                        </p>

                    </div>

                    <div className="why-card">

                        <FiCheckCircle className="why-icon" />

                        <h3>

                            GST Ready

                        </h3>

                        <p>

                            Built specifically for Indian
                            businesses with GST billing,
                            reports and tax compliance.

                        </p>

                    </div>

                    <div className="why-card">

                        <FiCheckCircle className="why-icon" />

                        <h3>

                            Complete Business Suite

                        </h3>

                        <p>

                            Manage Sales, Purchases,
                            Inventory, Expenses,
                            Accounting and Reports
                            from one platform.

                        </p>

                    </div>

                    <div className="why-card">

                        <FiCheckCircle className="why-icon" />

                        <h3>

                            Secure & Reliable

                        </h3>

                        <p>

                            Enterprise-grade security,
                            encrypted data,
                            automatic backups and
                            continuous updates.

                        </p>

                    </div>

                </div>

            </section>

            {/* ==========================
                CALL TO ACTION
            ========================== */}

            <section className="about-cta">

                <h2>

                    Ready To Grow Your Business?

                </h2>

                <p>

                    Join EAZYTAXATION ERP and
                    simplify GST Billing,
                    Accounting,
                    Inventory and Business
                    Management.

                </p>

                <div className="about-buttons">

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

            {/* ==========================
                FOOTER
            ========================== */}

            <footer className="about-footer">

                <div className="footer-links">

                    <Link to="/">

                        Home

                    </Link>

                    <Link to="/features">

                        Features

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

export default About;
