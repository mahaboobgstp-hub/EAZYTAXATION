import React from "react";
import { Link } from "react-router-dom";
import "../../css/auth/ForgotPassword.css";

export default function ForgotUsername() {
  return <div className="forgot-password-page"><section className="forgot-password-card">
    <h1>SYD Billing &amp; Accounting</h1>
    <h2>Forgot Username?</h2>
    <p>Your SYD sign-in username is the email address you used when creating your account. Check your registered email address, then sign in using that email and your password.</p>
    <p>If you no longer have access to that email address, please contact your account administrator for assistance.</p>
    <div className="forgot-links"><Link to="/login">Back to Login</Link></div>
  </section></div>;
}