import React, { useState } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import { BACKEND_SERVER_URL } from "../utils/utl";
import "./style.scss";

function Register() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    email: "",
    otp: "",
    password: "",
    confirmPassword: "",
    securityQuestion: "",
    securityQuestionAnswer: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const verifyEmail = async () => {
    if (!data.email) {
      alert("Please enter your email");
      return;
    }
    if (!isValidEmail(data.email)) {
      alert("Please enter a valid email");
      return;
    }

    try {
      const res = await axios.post(BACKEND_SERVER_URL + "/signup/sendOtp", {
        email: data.email,
      });
      if (res.status === 200) {
        alert("OTP sent successfully");
        setStep(2);
      }
    } catch (error) {
      const msg =
        error.response?.status === 409
          ? "Email already exists. Please login or reset your password."
          : "Failed to send OTP. Please try again.";
      alert(msg);
      console.error("Error sending OTP:", error.response?.data || error.message);
    }
  };

  const verifyOtp = async () => {
    try {
      const res = await axios.post(BACKEND_SERVER_URL + "/signup/checkUser", {
        email: data.email,
        otp: parseInt(data.otp, 10),
      });
      if (res.status === 200) {
        setStep(3);
      } else {
        alert("Incorrect OTP");
      }
    } catch (error) {
      alert("OTP verification failed.");
      console.error("OTP verify error:", error.response?.data || error.message);
    }
  };

  const submit = async (e) => {
    e.preventDefault();

    if (data.password !== data.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    if (data.password.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }
    if (!data.securityQuestion || !data.securityQuestionAnswer) {
      alert("Please select a security question and provide an answer.");
      return;
    }

    try {
      const res = await fetch(BACKEND_SERVER_URL + "/signup/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          securityQuestion: data.securityQuestion,
          securityQuestionAnswer: data.securityQuestionAnswer,
        }),
      });

      if (res.ok) {
        alert("Registration successful");
        navigate("/login2");
      } else {
        const errData = await res.json();
        alert(errData.error || "Registration failed.");
      }
    } catch (error) {
      alert("Error occurred during registration.");
      console.error("Registration error:", error);
    }
  };

  return (
    <div className="authContainer">
      <div className="authCard">
        <h2>Register</h2>

        <div className="stepIndicators">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`dot ${step >= s ? "active" : ""} ${step > s ? "completed" : ""}`}
            ></div>
          ))}
        </div>

        <form onSubmit={submit}>
          {step === 1 && (
            <>
              <div className="formGroup">
                <label>Email</label>
                <input type="email" name="email" value={data.email} onChange={handleChange} />
              </div>
              <button type="button" onClick={verifyEmail} className="button">
                Send OTP
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="formGroup">
                <label>OTP</label>
                <input type="number" name="otp" value={data.otp} onChange={handleChange} />
              </div>
              <button type="button" onClick={verifyOtp} className="button">
                Verify OTP
              </button>
              <button type="button" onClick={() => setStep(1)} className="button secondary">
                Back
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <div className="formGroup">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={data.password}
                  onChange={handleChange}
                />
              </div>
              <div className="formGroup">
                <label>Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={data.confirmPassword}
                  onChange={handleChange}
                />
              </div>
              <div className="formGroup">
                <label>Security Question</label>
                <select
                  name="securityQuestion"
                  value={data.securityQuestion}
                  onChange={handleChange}
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
                <label>Answer</label>
                <input
                  type="text"
                  name="securityQuestionAnswer"
                  value={data.securityQuestionAnswer}
                  onChange={handleChange}
                />
              </div>

              <button type="submit" className="button">
                Register
              </button>
              <button type="button" onClick={() => setStep(2)} className="button secondary">
                Back
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

export default Register;
