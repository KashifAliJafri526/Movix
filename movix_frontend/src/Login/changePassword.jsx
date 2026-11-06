import React, { useState } from "react";
import { useNavigate } from "react-router";
import { BACKEND_SERVER_URL } from "../utils/utl";
import "./Login.css";

const ChangePassword = () => {
  const [data, setData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    securityQuestion: "",
    securityQuestionAnswer: "",
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const CheckDetails = async (e) => {
    e.preventDefault();
    if (data.password !== data.confirmPassword) {
      alert("Password and Confirm Password must be same");
      return;
    }
    const changePassword = {
      email: data.email,
      password: data.password,
      securityQuestion: data.securityQuestion,
      securityQuestionAnswer: data.securityQuestionAnswer,
    };
    const res = await fetch(BACKEND_SERVER_URL + "/signup/changePass", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changePassword),
    });
    if (res.ok) {
      alert("Password changed successfully!");
      navigate("/login2");
    } else {
      alert("Error changing password. Please check your details.");
    }
  };

  return (
    <div className="authContainer">
      <div className="authCard">
        <h2>Change Password</h2>
        <form onSubmit={CheckDetails} className="form">
          <div className="formGroup">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              name="email"
              id="email"
              value={data.email}
              onChange={handleChange}
              required
              autoComplete="username"
            />
          </div>

          <div className="formGroup">
            <label htmlFor="securityQuestion">Security Question</label>
            <select
              name="securityQuestion"
              id="securityQuestion"
              value={data.securityQuestion}
              onChange={handleChange}
              required
            >
              <option value="">Select a question</option>
              <option value="Your mother's maiden name?">
                Your mother's maiden name?
              </option>
              <option value="Your first pet's name?">Your first pet's name?</option>
              <option value="Your favorite teacher's name?">
                Your favorite teacher's name?
              </option>
              <option value="Your best friend's name?">Your best friend's name?</option>
            </select>
          </div>

          <div className="formGroup">
            <label htmlFor="securityQuestionAnswer">Answer</label>
            <input
              type="text"
              name="securityQuestionAnswer"
              id="securityQuestionAnswer"
              value={data.securityQuestionAnswer}
              onChange={handleChange}
              required
            />
          </div>

          <div className="formGroup">
            <label htmlFor="password">New Password</label>
            <input
              type="password"
              name="password"
              id="password"
              value={data.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="formGroup">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              id="confirmPassword"
              value={data.confirmPassword}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="button">Change Password</button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
