import React from "react";
import { Link } from "react-router-dom";

export default function ForgotUsername() {
  return (
    <main className="login-page">
      <section className="login-card">
        <h1>SYD</h1>
        <p className="login-brand-subtitle">Billing &amp; Accounting</p>
        <h2>Forgot Username?</h2>
        <p className="forgot-username-copy">Your SYD username is the email address you used when creating your account. Try that registered email address on the login screen.</p>
        <div className="login-links">
          <Link to="/login">Back to Login</Link>
          <Link to="/forgot-password">Forgot Password?</Link>
        </div>
      </section>
    </main>
  );
}
