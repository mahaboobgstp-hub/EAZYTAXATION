import React from "react";
import { Link } from "react-router-dom";

import "../../css/privacy/PrivacyPolicy.css";

function PrivacyPolicy() {

    return (

        <div className="privacy-page">

            {/* ===========================
                HERO
            =========================== */}

            <section className="privacy-hero">

                <span className="privacy-badge">

                    LEGAL

                </span>

                <h1>

                    Privacy Policy

                </h1>

                <p>

                    Your privacy is important to us. This
                    Privacy Policy explains how
                    EAZYTAXATION ERP collects,
                    uses and protects your information.

                </p>

            </section>

            {/* ===========================
                CONTENT
            =========================== */}

            <section className="privacy-content">

                <div className="policy-section">

                    <h2>

                        1. Information We Collect

                    </h2>

                    <p>

                        We may collect information including
                        your name, company name,
                        email address, phone number,
                        billing information and other
                        business details that you provide
                        while using our services.

                    </p>

                </div>

                <div className="policy-section">

                    <h2>

                        2. How We Use Your Information

                    </h2>

                    <p>

                        Your information is used to provide
                        ERP services, customer support,
                        software improvements,
                        security monitoring and legal
                        compliance.

                    </p>

                </div>

                <div className="policy-section">

                    <h2>

                        3. Data Security

                    </h2>

                    <p>

                        We implement industry-standard
                        security practices including
                        encryption, secure authentication,
                        access controls and regular backups
                        to protect your data.

                    </p>

                </div>

                <div className="policy-section">

                    <h2>

                        4. Data Sharing

                    </h2>

                    <p>

                        We do not sell your personal
                        information. Your data may only
                        be shared with trusted service
                        providers when necessary to
                        deliver our services or comply
                        with legal obligations.

                    </p>

                </div>

                <div className="policy-section">

                    <h2>

                        5. Cookies

                    </h2>

                    <p>

                        Our website may use cookies to
                        improve user experience,
                        maintain sessions and analyze
                        website performance.

                    </p>

                </div>

                <div className="policy-section">

                    <h2>

                        6. Your Rights

                    </h2>

                    <p>

                        You may request access,
                        correction or deletion of your
                        personal information by
                        contacting our support team.

                    </p>

                </div>

                <div className="policy-section">

                    <h2>

                        7. Contact Us

                    </h2>

                    <p>

                        If you have questions regarding
                        this Privacy Policy, please contact
                        us through our Contact page.

                    </p>

                </div>

            </section>

            {/* ===========================
                FOOTER
            =========================== */}

            <footer className="privacy-footer">

                <Link to="/">

                    Back to Home

                </Link>

            </footer>

        </div>

    );

}

export default PrivacyPolicy;
