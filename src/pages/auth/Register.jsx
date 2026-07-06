import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../../css/auth/Register.css";
import { registerUser } from "../../services/authService";

function Register() {

  const [loading, setLoading] = useState(false);

const [formData, setFormData] = useState({

  full_name: "",

  business_name: "",

  email: "",

  password: "",

  confirm_password: ""

});

  const handleChange = (e) => {

    setFormData({

      ...formData,

      [e.target.name]: e.target.value

    });

  };

  const handleSubmit = async (e) => {

  e.preventDefault();

  if (
    formData.password !==
    formData.confirm_password
  ) {

    alert("Passwords do not match.");

    return;

  }

  try {

    setLoading(true);

    await registerUser(formData);

    alert(
      "Registration successful! Please check your email to verify your account."
    );

  } catch (error) {

    alert(error.message);

  } finally {

    setLoading(false);

  }

};

  return (

    <div className="register-page">

      <div className="register-card">

        <h1>

          Create Your Account

        </h1>

        <p>

          Start your free trial of
          EAZYTAXATION ERP

        </p>

        <form
          onSubmit={handleSubmit}
        >
          <div className="form-group">

            <label>

              Your Name

            </label>

            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Enter your name"
              required
            />

          </div>

          <div className="form-group">

            <label>

              Business Name (Optional)

            </label>

            <input
              type="text"
              name="business_name"
              value={formData.business_name || ""}
              onChange={handleChange}
              placeholder="Your Business Name"
            />

          </div>

          <div className="form-group">

            <label>

              Email Address

            </label>

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />

          </div>

          <div className="form-group">

            <label>

              Password

            </label>

            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create password"
              required
            />

          </div>

          <div className="form-group">

            <label>

              Confirm Password

            </label>

            <input
              type="password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              placeholder="Confirm password"
              required
            />

          </div>

          <button
  type="submit"
  className="register-button"
  disabled={loading}
>

  {
    loading
      ? "Creating Account..."
      : "Start Free Trial"
  }

</button>

          <div className="divider">

            <span>

              OR

            </span>

          </div>

          <button
            type="button"
            className="google-button"
          >

            Continue with Google

          </button>

          <div className="login-link">

            Already have an account?

            <Link to="/login">

              Login

            </Link>

          </div>

        </form>

      </div>

    </div>
      );
}

export default Register;
