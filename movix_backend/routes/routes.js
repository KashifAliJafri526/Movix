
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const mongoose = require("mongoose");
require("dotenv").config();

const registeredData = require("../models/Register");
const Otp = require("../models/OtpModel");
const MovieRating = require("../models/MovieRating");

const routes = express.Router();

// ==========================================
// EMAIL CONFIGURATION (BREVO SMTP)
// ==========================================

const smtpPort = Number(process.env.SMTP_PORT);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// ==========================================
// JWT AUTHENTICATION MIDDLEWARE
// ==========================================

const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token || !process.env.JWT_SECRET) {
      return res.status(401).json({
        error: "Invalid authentication",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await registeredData.findById(decoded.userId);

    if (!user || user.token !== token) {
      return res.status(401).json({
        error: "Session expired or invalid. Please log in again.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      error: "Invalid or expired token. Please log in again.",
    });
  }
};

// ==========================================
// ADMIN AUTHORIZATION MIDDLEWARE
// ==========================================

const authorizeAdmin = (req, res, next) => {
  if ((req.user.role || "user") !== "admin") {
    return res.status(403).json({
      error: "Admin access required",
    });
  }

  next();
};

// ==========================================
// GENERATE OTP
// ==========================================

const OTP_generator = () => {
  return crypto.randomInt(100000, 1000000);
};

// ==========================================
// SEND OTP EMAIL
// ==========================================

const sendOTP = async (email, otp) => {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_EMAIL ||
    !process.env.SMTP_PASSWORD
  ) {
    throw new Error("SMTP configuration is incomplete");
  }

  const mailOptions = {
    from: `"Movix" <${process.env.SMTP_EMAIL}>`,
    to: email,
    subject: "Movix - Email Verification OTP",
    text: `Your Movix verification OTP is ${otp}. It expires in 5 minutes. Please do not share it with anyone.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Welcome to Movix!</h2>
        <p>Use the following OTP to verify your email address:</p>
        <h1 style="letter-spacing: 5px;">${otp}</h1>
        <p>This OTP expires in 5 minutes.</p>
        <p>If you did not request this OTP, please ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// ==========================================
// 1. SEND OTP
// POST /signup/sendOtp
// ==========================================

routes.post("/sendOtp", async (req, res) => {
  try {
    let { email } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        error: "Valid email is required",
      });
    }

    email = email.trim().toLowerCase();

    const userExist = await registeredData.findOne({ email });

    if (userExist) {
      return res.status(409).json({
        error: "User already exists",
      });
    }

    const otp = OTP_generator();

    await Otp.findOneAndUpdate(
      { email },
      {
        $set: {
          otp,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          verified: false,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    await sendOTP(email, otp);

    return res.status(200).json({
      message: "OTP sent to your email",
    });
  } catch (err) {
    console.error("Send OTP error:", err.message);

    return res.status(500).json({
      error: "Unable to send OTP. Please try again.",
    });
  }
});

// ==========================================
// 2. VERIFY OTP
// POST /signup/checkUser
// ==========================================

routes.post("/checkUser", async (req, res) => {
  try {
    let { email, otp } = req.body;

    if (
      !email ||
      typeof email !== "string" ||
      otp === undefined ||
      otp === null
    ) {
      return res.status(400).json({
        error: "Email and OTP are required",
      });
    }

    email = email.trim().toLowerCase();

    const otpString = String(otp).trim();

    if (!/^\d{6}$/.test(otpString)) {
      return res.status(400).json({
        error: "OTP must contain exactly 6 digits",
      });
    }

    const record = await Otp.findOne({ email });

    if (!record || record.expiresAt <= new Date()) {
      return res.status(400).json({
        error: "OTP expired or not found. Please request a new OTP.",
      });
    }

    if (record.otp !== Number(otpString)) {
      return res.status(400).json({
        error: "Incorrect OTP",
      });
    }

    record.verified = true;
    await record.save();

    return res.status(200).json({
      message: "Email verified successfully",
    });
  } catch (err) {
    console.error("Check OTP error:", err.message);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

// ==========================================
// 3. REGISTER USER
// POST /signup/register
// ==========================================

routes.post("/register", async (req, res) => {
  try {
    let {
      email,
      password,
      securityQuestion,
      securityQuestionAnswer,
    } = req.body;

    if (
      !email ||
      !password ||
      !securityQuestion ||
      !securityQuestionAnswer
    ) {
      return res.status(400).json({
        error: "All fields are required",
      });
    }

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      typeof securityQuestionAnswer !== "string"
    ) {
      return res.status(400).json({
        error: "Invalid registration details",
      });
    }

    email = email.trim().toLowerCase();

    if (password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters long",
      });
    }

    const existingUser = await registeredData.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        error: "User already exists with this email",
      });
    }

    const verification = await Otp.findOne({
      email,
      verified: true,
      expiresAt: { $gt: new Date() },
    });

    if (!verification) {
      return res.status(403).json({
        error: "Please verify your email before registering",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new registeredData({
      email,
      password: hashedPassword,
      securityQuestion,
      securityQuestionAnswer: securityQuestionAnswer.trim(),

      // Never accept an admin role from registration
      role: "user",
    });

    await newUser.save();
    await Otp.deleteOne({ email });

    return res.status(201).json({
      message: "User registered successfully",
    });
  } catch (err) {
    console.error("Registration error:", err.message);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

// ==========================================
// 4. LOGIN USER
// POST /signup/login
// ==========================================

routes.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password || typeof email !== "string") {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    email = email.trim().toLowerCase();

    const user = await registeredData.findOne({ email });

    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing from .env");
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    user.token = token;
    await user.save();

    const safeUser = {
      _id: user._id,
      email: user.email,
      securityQuestion: user.securityQuestion,
      role: user.role || "user",
    };

    return res.status(200).json({
      message: "Login successful",
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error("Login error:", err.message);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

// ==========================================
// 5. CHANGE PASSWORD
// POST /signup/changePass
// ==========================================

routes.post("/changePass", async (req, res) => {
  try {
    const {
      email,
      password,
      securityQuestion,
      securityQuestionAnswer,
    } = req.body;

    if (
      !email ||
      !password ||
      !securityQuestion ||
      !securityQuestionAnswer
    ) {
      return res.status(400).json({
        error: "All fields are required",
      });
    }

    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({
        error: "Invalid details",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters long",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await registeredData.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(400).json({
        error: "Given details do not match",
      });
    }

    const savedAnswer = String(
      user.securityQuestionAnswer || ""
    ).trim().toLowerCase();

    const submittedAnswer = String(
      securityQuestionAnswer
    ).trim().toLowerCase();

    if (
      user.securityQuestion !== securityQuestion ||
      savedAnswer !== submittedAnswer
    ) {
      return res.status(400).json({
        error: "Given details do not match",
      });
    }

    user.password = await bcrypt.hash(password, 10);
    user.token = undefined;

    await user.save();

    return res.status(200).json({
      message: "Password changed successfully",
    });
  } catch (err) {
    console.error("Change password error:", err.message);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

// ==========================================
// 6. GET USER BY ID
// GET /signup/getUser/:id
// Authenticated: own account or admin
// ==========================================

routes.get(
  "/getUser/:id",
  authenticateUser,
  async (req, res) => {
    try {
      const userId = req.params.id;

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          error: "Invalid user ID",
        });
      }

      const isOwnAccount =
        req.user._id.toString() === userId;

      const isAdmin = (req.user.role || "user") === "admin";

      if (!isOwnAccount && !isAdmin) {
        return res.status(403).json({
          error: "You cannot access another user's account",
        });
      }

      const user = await registeredData
        .findById(userId)
        .select("-password -securityQuestionAnswer -token");

      if (!user) {
        return res.status(404).json({
          error: "No user found",
        });
      }

      return res.status(200).json({ user });
    } catch (err) {
      console.error("Get user error:", err.message);

      return res.status(500).json({
        error: "Internal server error",
      });
    }
  }
);

// ==========================================
// 7. GET ALL USERS
// GET /signup/all
// ADMIN ONLY
// ==========================================

routes.get(
  "/all",
  authenticateUser,
  authorizeAdmin,
  async (req, res) => {
    try {
      const allData = await registeredData
        .find()
        .select("-password -securityQuestionAnswer -token");

      return res.status(200).json(allData);
    } catch (err) {
      console.error("Get all users error:", err.message);

      return res.status(500).json({
        error: "Internal server error",
      });
    }
  }
);

// ==========================================
// 8. DELETE USER
// DELETE /signup/deleteUser/:id
// ADMIN ONLY
// ==========================================

routes.delete(
  "/deleteUser/:id",
  authenticateUser,
  authorizeAdmin,
  async (req, res) => {
    try {
      const userId = req.params.id;

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          error: "Invalid user ID",
        });
      }

      if (req.user._id.toString() === userId) {
        return res.status(400).json({
          error: "You cannot delete your own admin account",
        });
      }

      const deletedUser = await registeredData.findByIdAndDelete(
        userId
      );

      if (!deletedUser) {
        return res.status(404).json({
          error: "User does not exist",
        });
      }

      return res.status(200).json({
        message: "User removed successfully",
      });
    } catch (err) {
      console.error("Delete user error:", err.message);

      return res.status(500).json({
        error: "Internal server error",
      });
    }
  }
);


// ==========================================
// 9. SUBMIT / UPDATE MOVIE VERDICT
// POST /signup/rating/:movieId
// AUTHENTICATED USERS ONLY
// ==========================================

routes.post(
  "/rating/:movieId",
  authenticateUser,
  async (req, res) => {
    try {
      const movieId = Number(req.params.movieId);

      const { verdict } = req.body;

      const validVerdicts = [
        "money-waste",
        "time-pass",
        "potential-man",
        "go-for-it",
        "perfection",
      ];

      if (!Number.isSafeInteger(movieId) || movieId <= 0) {
        return res.status(400).json({
          error: "Invalid movie ID",
        });
      }

      if (!validVerdicts.includes(verdict)) {
        return res.status(400).json({
          error: "Invalid movie verdict",
        });
      }

      const rating = await MovieRating.findOneAndUpdate(
        {
          userId: req.user._id,
          movieId,
        },
        {
          $set: { verdict },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

      return res.status(200).json({
        message: "Your movie verdict has been saved",
        rating,
      });
    } catch (err) {
      console.error("Submit movie verdict error:", err.message);

      return res.status(500).json({
        error: "Unable to save your verdict",
      });
    }
  }
);

// ==========================================
// 10. GET COMMUNITY VERDICTS
// GET /signup/rating/:movieId
// PUBLIC ROUTE
// ==========================================

routes.get("/rating/:movieId", async (req, res) => {
  try {
    const movieId = Number(req.params.movieId);

    if (!Number.isSafeInteger(movieId) || movieId <= 0) {
      return res.status(400).json({
        error: "Invalid movie ID",
      });
    }

    const validVerdicts = [
      "money-waste",
      "time-pass",
      "potential-man",
      "go-for-it",
      "perfection",
    ];

    const results = await MovieRating.aggregate([
      { $match: { movieId } },
      {
        $group: {
          _id: "$verdict",
          count: { $sum: 1 },
        },
      },
    ]);

    const distribution = {};

    validVerdicts.forEach((verdict) => {
      distribution[verdict] = 0;
    });

    let totalRatings = 0;

    results.forEach((item) => {
      distribution[item._id] = item.count;
      totalRatings += item.count;
    });

    const percentages = {};

    validVerdicts.forEach((verdict) => {
      percentages[verdict] =
        totalRatings === 0
          ? 0
          : Number(
              ((distribution[verdict] / totalRatings) * 100).toFixed(1)
            );
    });

    return res.status(200).json({
      movieId,
      totalRatings,
      distribution,
      percentages,
    });
  } catch (err) {
    console.error("Get community verdicts error:", err.message);

    return res.status(500).json({
      error: "Unable to fetch community verdicts",
    });
  }
});

// ==========================================
// 11. GET MY PERSONAL VERDICT
// GET /signup/rating/:movieId/me
// AUTHENTICATED USERS ONLY
// ==========================================

routes.get(
  "/rating/:movieId/me",
  authenticateUser,
  async (req, res) => {
    try {
      const movieId = Number(req.params.movieId);

      if (!Number.isSafeInteger(movieId) || movieId <= 0) {
        return res.status(400).json({
          error: "Invalid movie ID",
        });
      }

      const rating = await MovieRating.findOne({
        userId: req.user._id,
        movieId,
      });

      return res.status(200).json({
        movieId,
        myVerdict: rating ? rating.verdict : null,
      });
    } catch (err) {
      console.error("Get personal verdict error:", err.message);

      return res.status(500).json({
        error: "Unable to fetch your verdict",
      });
    }
  }
);


module.exports = routes;
