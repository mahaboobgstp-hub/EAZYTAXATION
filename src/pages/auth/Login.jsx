import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../css/auth/Login.css";

import {

    loginUser,

    signInWithGoogle

} from "../../services/authService";

function Login() {

  const navigate = useNavigate();

  const [formData, setFormData] = useState({

    email: "",

    password: ""

  });

  const [loading, setLoading] = useState(false);

  function handleChange(e) {

    const { name, value } = e.target;

    setFormData(prev => ({

      ...prev,

      [name]: value

    }));

  }

  async function handleSubmit(e) {

    e.preventDefault();

    try {

      setLoading(true);

      await loginUser(

        formData.email,

        formData.password

      );

      alert("Login Successful");

      navigate("/app/companies");

    }

    catch (error) {

      alert(error.message);

    }

    finally {

      setLoading(false);

    }

  }
async function handleGoogleLogin() {

    try {

        await signInWithGoogle();

    }

    catch (error) {

        alert(error.message);

    }

}
  return (

    <div className="login-page">

      <div className="login-card">

        <h1>EAZYTAXATION ERP</h1>

        <h2>Login</h2>

        <form onSubmit={handleSubmit}>

         <button
    className="google-login-btn"
    onClick={handleGoogleLogin}
>

    <img

        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"

        alt="Google"

    />

    Continue with Google

</button>

<div className="login-divider">

    <span>

        OR

    </span>

</div>
          <input

            type="email"

            name="email"

            placeholder="Email"

            value={formData.email}

            onChange={handleChange}

            required

          />

          <input

            type="password"

            name="password"

            placeholder="Password"

            value={formData.password}

            onChange={handleChange}

            required

          />

          <button

            type="submit"

            disabled={loading}

          >

            {

              loading

                ? "Signing In..."

                : "Login"

            }

          </button>

        </form>

        <div className="login-links">

          <Link to="/forgot-password">

            Forgot Password?

          </Link>

          <br />

          <br />

          <Link to="/register">

            Create Account

          </Link>

        </div>

      </div>

    </div>

  );

}

export default Login;
