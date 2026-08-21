const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
// const ExpressError = require("../utils/ExpressError.js");
// const { listingSchema } = require("../schema.js");
// const Listing = require("../models/listing.js");
// const Review = require("../models/review.js");
const { isLogedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listings.js");

// index route for listings
router.get("/", wrapAsync(listingController.index));

//New Route
router.get("/new", isLogedIn, listingController.renderNewForm);

//Show Route
router.get("/:id", listingController.showListing);

// post new listing route create route
router.post(
  "/",
  isLogedIn,
  validateListing,
  wrapAsync(listingController.createListing),
);

//Edit Route
router.get("/:id/edit", isLogedIn, isOwner, listingController.renderEditForm);

//Update Route
router.put(
  "/:id",
  isLogedIn,
  isOwner,
  validateListing,
  wrapAsync(listingController.updateListing),
);

//Delete Route
router.delete("/:id", isLogedIn, isOwner, listingController.destroyListing);

module.exports = router;
