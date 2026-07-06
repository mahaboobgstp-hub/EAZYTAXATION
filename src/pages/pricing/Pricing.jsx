import React from "react";
import { Link } from "react-router-dom";

import {
    FiCheck,
    FiStar,
    FiPhone,
    FiMessageCircle
} from "react-icons/fi";

import "../../css/pricing/Pricing.css";

function Pricing() {

    return (

        <div className="pricing-page">

            {/* ==============================
                HERO
            ============================== */}

            <section className="pricing-hero">

                <span className="pricing-badge">

                    SIMPLE & TRANSPARENT PRICING

                </span>

                <h1>

                    Choose the Perfect Plan
                    for Your Business

                </h1>

                <p>

                    Start with a free trial and
                    upgrade whenever your
                    business grows.

                </p>

            </section>

            {/* ==============================
                PLANS
            ============================== */}

            <section className="pricing-grid">

                {/* STARTER */}

                <div className="pricing-card">

                    <h2>

                        Starter

                    </h2>

                    <div className="price">

                        ₹499

                        <span>

                            / Month

                        </span>

                    </div>

                    <ul>

                        <li>

                            <FiCheck />

                            GST Billing

                        </li>

                        <li>

                            <FiCheck />

                            Quotations

                        </li>

                        <li>

                            <FiCheck />

                            Sales

                        </li>

                        <li>

                            <FiCheck />

                            Purchases

                        </li>

                        <li>

                            <FiCheck />

                            Expense Management

                        </li>

                        <li>

                            <FiCheck />

                            Inventory

                        </li>

                    </ul>

                    <Link
                        to="/register"
                        className="plan-button"
                    >

                        Start Free Trial

                    </Link>

                </div>

                {/* PROFESSIONAL */}

                <div className="pricing-card featured">

                    <div className="popular-tag">

                        <FiStar />

                        MOST POPULAR

                    </div>

                    <h2>

                        Professional

                    </h2>

                    <div className="price">

                        ₹999

                        <span>

                            / Month

                        </span>

                    </div>

                    <ul>

                        <li><FiCheck /> Everything in Starter</li>

                        <li><FiCheck /> Accounting</li>

                        <li><FiCheck /> GST Reports</li>

                        <li><FiCheck /> Dashboard</li>

                        <li><FiCheck /> Unlimited Invoices</li>

                        <li><FiCheck /> Priority Support</li>

                        <li><FiCheck /> Auto Backup</li>

                    </ul>

                    <Link
                        to="/register"
                        className="plan-button"
                    >

                        Start Free Trial

                    </Link>

                </div>

                {/* ENTERPRISE */}

                <div className="pricing-card">

                    <h2>

                        Enterprise

                    </h2>

                    <div className="price">

                        Custom

                    </div>

                    <ul>

                        <li><FiCheck /> Unlimited Users</li>

                        <li><FiCheck /> Unlimited Companies</li>

                        <li><FiCheck /> Role Management</li>

                        <li><FiCheck /> API Integration</li>

                        <li><FiCheck /> Dedicated Support</li>

                        <li><FiCheck /> Custom Development</li>

                    </ul>

                    <Link
                        to="/contact"
                        className="plan-button"
                    >

                        Contact Sales

                    </Link>

                </div>

            </section>

            {/* ==============================
                BENEFITS
            ============================== */}

            <section className="pricing-benefits">

                <h2>

                    Every Plan Includes

                </h2>

                <div className="benefits-grid">

                    <div>

                        ✅ Secure Cloud Storage

                    </div>

                    <div>

                        ✅ Automatic Updates

                    </div>

                    <div>

                        ✅ GST Compliant

                    </div>

                    <div>

                        ✅ Mobile Responsive

                    </div>

                    <div>

                        ✅ Daily Backup

                    </div>

                    <div>

                        ✅ SSL Security

                    </div>

                </div>

            </section>

            {/* ==============================
                CTA
            ============================== */}

            <section className="pricing-contact">

                <h2>

                    Still Have Questions?

                </h2>

                <p>

                    Our team is happy to help you
                    choose the right plan.

                </p>

                <div className="contact-buttons">

                    <Link
                        to="/contact"
                        className="plan-button"
                    >

                        <FiPhone />

                        Contact Sales

                    </Link>

                    <a
                        href="https://wa.me/"
                        className="whatsapp-button"
                    >

                        <FiMessageCircle />

                        WhatsApp

                    </a>

                </div>

            </section>

        </div>

    );

}

export default Pricing;
