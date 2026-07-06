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
            {/* =========================
          WHY CHOOSE EAZYTAXATION
      ========================== */}

      <section
        id="about"
        className="why-section"
      >

        <h2>
          Why Choose EAZYTAXATION ERP?
        </h2>

        <p className="section-description">

          Everything your business needs to manage
          GST Billing, Purchases, Inventory,
          Expenses, Accounting and Reports
          in one cloud platform.

        </p>

        <div className="why-grid">

          <div className="why-card">

            <div className="why-icon">
              📄
            </div>

            <h3>
              GST Billing
            </h3>

            <p>
              Create professional GST invoices with
              automatic CGST, SGST and IGST calculation.
            </p>

          </div>

          <div className="why-card">

            <div className="why-icon">
              📦
            </div>

            <h3>
              Inventory
            </h3>

            <p>
              Track stock movement,
              item-wise reports,
              HSN,
              UOM and GST details.
            </p>

          </div>

          <div className="why-card">

            <div className="why-icon">
              🛒
            </div>

            <h3>
              Purchase Management
            </h3>

            <p>
              Record supplier purchases,
              GST input tax
              and vendor transactions.
            </p>

          </div>

          <div className="why-card">

            <div className="why-icon">
              💰
            </div>

            <h3>
              Expense Tracking
            </h3>

            <p>
              Maintain rent,
              salary,
              electricity,
              fuel,
              maintenance
              and all business expenses.
            </p>

          </div>

          <div className="why-card">

            <div className="why-icon">
              📊
            </div>

            <h3>
              Powerful Reports
            </h3>

            <p>
              Generate GST reports,
              sales reports,
              purchase reports
              and business insights instantly.
            </p>

          </div>

          <div className="why-card">

            <div className="why-icon">
              ☁️
            </div>

            <h3>
              Cloud Based
            </h3>

            <p>
              Access your business
              anytime,
              anywhere
              from desktop,
              laptop,
              tablet
              or mobile.
            </p>

          </div>

        </div>

      </section>

      {/* =========================
          FEATURES
      ========================== */}

      <section
        id="features"
        className="features-section"
      >

        <h2>

          Everything You Need
          To Run Your Business

        </h2>

        <p className="section-description">

          EAZYTAXATION ERP is designed
          for Manufacturers,
          Traders,
          Wholesalers,
          Retailers,
          Service Providers
          and Growing Businesses.

        </p>

        <div className="features-grid">

          <div className="feature-box">

            <h3>
              GST Invoicing
            </h3>

            <p>

              Professional GST invoices,
              PDF download,
              WhatsApp sharing,
              Print and Email.

            </p>

          </div>

          <div className="feature-box">

            <h3>
              Purchase Management
            </h3>

            <p>

              Vendor bills,
              purchase entries,
              GST input
              and stock updates.

            </p>

          </div>

          <div className="feature-box">

            <h3>
              Expense Management
            </h3>

            <p>

              Record all daily expenses
              with GST support.

            </p>

          </div>

          <div className="feature-box">

            <h3>
              Customer Management
            </h3>

            <p>

              Complete customer database
              with GSTIN,
              addresses
              and transaction history.

            </p>

          </div>

          <div className="feature-box">

            <h3>
              Vendor Management
            </h3>

            <p>

              Maintain suppliers,
              purchases
              and outstanding balances.

            </p>

          </div>

          <div className="feature-box">

            <h3>
              Reports & Analytics
            </h3>

            <p>

              Business insights,
              GST reports,
              sales trends
              and profitability.

            </p>

          </div>

        </div>

      </section>
            {/* =========================
          PRICING
      ========================== */}

      <section
        id="pricing"
        className="pricing-section"
      >

        <h2>
          Simple & Transparent Pricing
        </h2>

        <p className="section-description">
          Choose the plan that best suits your business.
          Upgrade anytime as your business grows.
        </p>

        <div className="pricing-grid">

          <div className="pricing-card">

            <span className="pricing-tag">
              STARTER
            </span>

            <h3>₹499</h3>

            <p className="pricing-duration">
              Per Month
            </p>

            <ul>

              <li>✔ GST Billing</li>

              <li>✔ Customer Management</li>

              <li>✔ Vendor Management</li>

              <li>✔ Item Master</li>

              <li>✔ PDF Download</li>

              <li>✔ Email Support</li>

            </ul>

            <Link
              to="/register"
              className="pricing-button"
            >
              Start Free Trial
            </Link>

          </div>

          <div className="pricing-card featured-plan">

            <span className="pricing-tag featured-tag">
              MOST POPULAR
            </span>

            <h3>₹999</h3>

            <p className="pricing-duration">
              Per Month
            </p>

            <ul>

              <li>✔ Everything in Starter</li>

              <li>✔ Purchase Management</li>

              <li>✔ Expense Management</li>

              <li>✔ Inventory</li>

              <li>✔ Business Reports</li>

              <li>✔ WhatsApp Invoice Sharing</li>

            </ul>

            <Link
              to="/register"
              className="pricing-button"
            >
              Start Free Trial
            </Link>

          </div>

          <div className="pricing-card">

            <span className="pricing-tag">
              ENTERPRISE
            </span>

            <h3>Custom</h3>

            <p className="pricing-duration">
              Contact Us
            </p>

            <ul>

              <li>✔ Multi Company</li>

              <li>✔ Multi User</li>

              <li>✔ Priority Support</li>

              <li>✔ API Integration</li>

              <li>✔ Dedicated Training</li>

              <li>✔ Custom Features</li>

            </ul>

            <Link
              to="/register"
              className="pricing-button"
            >
              Contact Sales
            </Link>

          </div>

        </div>

      </section>

      {/* =========================
          TESTIMONIALS
      ========================== */}

      <section className="testimonial-section">

        <h2>
          Trusted by Growing Businesses
        </h2>

        <p className="section-description">

          Businesses across India trust
          EAZYTAXATION ERP
          for GST Billing,
          Accounting
          and Business Management.

        </p>

        <div className="testimonial-grid">

          <div className="testimonial-card">

            <p>

              "Very simple software.
              Invoice creation is extremely fast
              and GST calculation is automatic."

            </p>

            <h4>
              Rajesh Kumar
            </h4>

            <span>
              Retail Business
            </span>

          </div>

          <div className="testimonial-card">

            <p>

              "The interface is clean,
              professional
              and easy for my staff."

            </p>

            <h4>
              Pooja Traders
            </h4>

            <span>
              Wholesale Business
            </span>

          </div>

          <div className="testimonial-card">

            <p>

              "Finally a modern Indian ERP
              that focuses on GST
              and business growth."

            </p>

            <h4>
              Mahesh Enterprises
            </h4>

            <span>
              Manufacturing
            </span>

          </div>

        </div>

      </section>

      {/* =========================
          FAQ
      ========================== */}

      <section className="faq-section">

        <h2>

          Frequently Asked Questions

        </h2>

        <div className="faq-container">

          <div className="faq-item">

            <h3>

              Is there a free trial?

            </h3>

            <p>

              Yes.
              Every new user receives
              a free trial to explore
              all core ERP features.

            </p>

          </div>

          <div className="faq-item">

            <h3>

              Is my business data secure?

            </h3>

            <p>

              Yes.
              Your data is securely stored
              in the cloud with
              authentication
              and encrypted communication.

            </p>

          </div>

          <div className="faq-item">

            <h3>

              Can I access it on mobile?

            </h3>

            <p>

              Yes.
              EAZYTAXATION ERP works
              on desktop,
              laptop,
              tablet
              and mobile browsers.

            </p>

          </div>

          <div className="faq-item">

            <h3>

              Does it support GST?

            </h3>

            <p>

              Yes.
              The software supports
              CGST,
              SGST,
              IGST,
              GST Billing
              and GST Reports.

            </p>

          </div>

        </div>

      </section>
            {/* =========================
          CALL TO ACTION
      ========================== */}

      <section className="cta-section">

        <div className="cta-content">

          <h2>

            Ready to Grow Your Business?

          </h2>

          <p>

            Join thousands of businesses that are
            simplifying GST billing, accounting,
            purchases and inventory management
            with EAZYTAXATION ERP.

          </p>

          <div className="cta-buttons">

            <Link
              to="/register"
              className="hero-primary-btn"
            >
              Start Your Free Trial
            </Link>

            <Link
              to="/login"
              className="hero-secondary-btn"
            >
              Login
            </Link>

          </div>

        </div>

      </section>

      {/* =========================
          CONTACT
      ========================== */}

      <section
        id="contact"
        className="contact-section"
      >

        <h2>

          Contact Us

        </h2>

        <p className="section-description">

          We'd love to hear from you.

        </p>

        <div className="contact-grid">

          <div className="contact-card">

            <h3>Email</h3>

            <p>

              support@eazytaxation.com

            </p>

          </div>

          <div className="contact-card">

            <h3>Phone</h3>

            <p>

              +91 XXXXXXXXXX

            </p>

          </div>

          <div className="contact-card">

            <h3>Working Hours</h3>

            <p>

              Monday - Saturday

              <br />

              9:00 AM - 7:00 PM

            </p>

          </div>

        </div>

      </section>

      {/* =========================
          FOOTER
      ========================== */}

      <footer className="landing-footer">

        <div className="footer-top">

          <div className="footer-column">

            <h3>

              EAZYTAXATION ERP

            </h3>

            <p>

              Cloud Based GST Billing,
              Accounting,
              Inventory &
              Business Management Software
              built for Indian Businesses.

            </p>

          </div>

          <div className="footer-column">

            <h4>

              Product

            </h4>

            <a href="#features">

              Features

            </a>

            <a href="#pricing">

              Pricing

            </a>

            <Link to="/register">

              Free Trial

            </Link>

          </div>

          <div className="footer-column">

            <h4>

              Company

            </h4>

            <a href="#about">

              About

            </a>

            <a href="#contact">

              Contact

            </a>

            <a href="#">

              Careers

            </a>

          </div>

          <div className="footer-column">

            <h4>

              Legal

            </h4>

            <a href="#">

              Privacy Policy

            </a>

            <a href="#">

              Terms & Conditions

            </a>

            <a href="#">

              Refund Policy

            </a>

          </div>

        </div>

        <hr />

        <div className="footer-bottom">

          <p>

            © {new Date().getFullYear()} EAZYTAXATION ERP.
            All Rights Reserved.

          </p>

          <div className="social-icons">

            <a href="#">
              Facebook
            </a>

            <a href="#">
              Instagram
            </a>

            <a href="#">
              LinkedIn
            </a>

            <a href="#">
              YouTube
            </a>

          </div>

        </div>

      </footer>

    </div>
  );
}

export default Landing;
