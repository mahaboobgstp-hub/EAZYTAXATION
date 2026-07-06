import React from "react";
import { Link } from "react-router-dom";
import "../../css/landing/Landing.css";

function Landing() {
  return (
    <div className="landing-page">

      {/* =========================
          NAVBAR
      ========================== */}

      <header className="landing-navbar">

        <div className="landing-logo">

          <h2>EAZYTAXATION ERP</h2>

        </div>

        <nav className="landing-menu">

          <a href="#features">Features</a>

          <a href="#pricing">Pricing</a>

          <a href="#about">About</a>

          <a href="#contact">Contact</a>

        </nav>

        <div className="landing-buttons">

          <Link
            to="/login"
            className="btn-login"
          >
            Login
          </Link>

          <Link
            to="/register"
            className="btn-register"
          >
            Start Free Trial
          </Link>

        </div>

      </header>

      {/* =========================
          HERO SECTION
      ========================== */}

      <section className="hero-section">

        <div className="hero-left">

          <span className="hero-tag">

            INDIA'S NEXT GENERATION GST ERP

          </span>

          <h1>

            GST Billing,
            Accounting &
            Business Management
            Made Simple.

          </h1>

          <p>

            Create GST Invoices,
            Manage Purchases,
            Track Expenses,
            Inventory,
            Reports,
            and Grow your Business
            using one powerful cloud ERP.

          </p>

          <div className="hero-buttons">

            <Link
              to="/register"
              className="hero-primary-btn"
            >
              Start Free Trial
            </Link>

            <Link
              to="/login"
              className="hero-secondary-btn"
            >
              Book Demo
            </Link>

          </div>

          <div className="hero-stats">

            <div>

              <h3>100%</h3>

              <p>Cloud Based</p>

            </div>

            <div>

              <h3>GST</h3>

              <p>Compliant</p>

            </div>

            <div>

              <h3>24×7</h3>

              <p>Support</p>

            </div>

          </div>

        </div>

        <div className="hero-right">

          <div className="dashboard-preview">

            <div className="preview-header">

              <div className="preview-dot red"></div>

              <div className="preview-dot yellow"></div>

              <div className="preview-dot green"></div>

            </div>

            <div className="preview-body">

              <div className="preview-sidebar"></div>

              <div className="preview-content">

                <div className="preview-card"></div>

                <div className="preview-card"></div>

                <div className="preview-card"></div>

                <div className="preview-chart"></div>

                <div className="preview-table"></div>

              </div>

            </div>

          </div>

        </div>

      </section>

    </div>
  );
}

export default Landing;
