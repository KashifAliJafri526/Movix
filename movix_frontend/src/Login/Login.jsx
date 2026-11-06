import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BACKEND_SERVER_URL } from "../utils/utl";
import "./Login.css";

const Login = ({ handleLogin, handleChangePass, handleEnable, sendDataToParent }) => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch(BACKEND_SERVER_URL + "/signup/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("token", JSON.stringify(data.token));
      handleLogin();
      alert("Login Successful");

      handleEnable();
      const username = formData.email.charAt(0).toUpperCase();
      sendDataToParent(username, formData.email);

      setTimeout(() => {
        localStorage.removeItem("token");
        navigate("/login2");
      }, 3600000); // 1 hour

      navigate("/");
    } else {
      alert("Invalid Credentials");
    }

    setFormData({ email: "", password: "" });
  };

  const onHandleChangePassword = (e) => {
    e.preventDefault();
    handleChangePass();
    navigate("/changePass");
  };

  return (
    <div className="authContainer">
      <div className="authCard">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="formGroup">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="username"
            />
          </div>

          <div className="formGroup">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="button">Login</button>

          <div className="link" style={{ marginTop: "15px" }}>
            <Link to="/changePass" onClick={onHandleChangePassword}>Forgot Password?</Link>
          </div>

          <div className="link" style={{ marginTop: "10px" }}>
            <Link to="/register">Register</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
