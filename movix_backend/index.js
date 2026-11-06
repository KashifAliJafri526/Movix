
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

app.use(express.json());
app.use(cors());

const PORT = process.env.SERVER_PORT || 4001;

const registerRoutes = require("./routes/routes");
app.use("/signup", registerRoutes);

if (!process.env.MONGO_URI) {
  console.error("MONGO_URI is missing from .env");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Database connected successfully");

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  });
