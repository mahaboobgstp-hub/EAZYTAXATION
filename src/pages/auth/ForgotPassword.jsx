import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../../css/auth/ForgotPassword.css";
import { resetPassword } from "../../services/authService";

function ForgotPassword() {

  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {

    e.preventDefault();

    try {

      setLoading(true);

      await resetPassword(email);

      alert(
        "Password reset link has been sent to your email."
      );

      setEmail("");

    }

    catch (error) {

      alert(error.message);

    }

    finally {

      setLoading(false);

    }

  }

  return (

    <div className="forgot-password-page">

      <div className="forgot-password-card">

        <h1>

          EAZYTAXATION ERP

        </h1>

        <h2>

          Forgot Password

        </h2>

        <p>

          Enter your registered email address.
          We will send you a password reset link.

        </p>

        <form onSubmit={handleSubmit}>

          <input

            type="email"

            placeholder="Email Address"

            value={email}

            onChange={(e) =>
              setEmail(e.target.value)
            }

            required

          />

          <button

            type="submit"

            disabled={loading}

          >

            {

              loading

                ? "Sending..."

                : "Send Reset Link"

            }

          </button>

        </form>

        <div className="forgot-links">

          <Link to="/login">

            Back to Login

          </Link>

        </div>

      </div>

    </div>

  );

}

export default ForgotPassword;
