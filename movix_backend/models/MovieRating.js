
const mongoose = require("mongoose");

const movieRatingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Register",
      required: true,
    },

    movieId: {
      type: Number,
      required: true,
    },

    verdict: {
      type: String,
      required: true,
      enum: [
        "money-waste",
        "time-pass",
        "potential-man",
        "go-for-it",
        "perfection",
      ],
    },
  },
  { timestamps: true }
);

// One verdict per user for each movie
movieRatingSchema.index(
  { userId: 1, movieId: 1 },
  { unique: true }
);

module.exports = mongoose.model("MovieRating", movieRatingSchema);
