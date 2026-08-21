const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js");
// const ExpressError = require("../utils/ExpressError.js");
// const { reviewSchema } = require("../schema.js");

const {
  isLogedIn,
  validateReview,
  isReviewAuthor,
} = require("../middleware.js");
const reviewController = require("../controllers/reviews.js");

//Review PostRoute
router.post(
  "/",
  isLogedIn,
  validateReview,
  wrapAsync(reviewController.createReview),
);

//Review Delete Route
router.delete(
  "/:reviewId",
  isLogedIn,
  isReviewAuthor,
  wrapAsync(reviewController.deleteReview),
);

module.exports = router;
