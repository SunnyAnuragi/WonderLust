const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLogedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

router
  .route("/")
  .get(wrapAsync(listingController.index))
  .post(
    isLogedIn,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.createListing),
  );

router.get("/new", isLogedIn, listingController.renderNewForm);

router
  .route("/:id")
  .get(listingController.showListing)
  .put(
    isLogedIn,
    upload.single("listing[image]"),
    isOwner,
    validateListing,
    wrapAsync(listingController.updateListing),
  )
  .delete(isLogedIn, isOwner, listingController.destroyListing);

//Edit Route
router.get("/:id/edit", isLogedIn, isOwner, listingController.renderEditForm);

module.exports = router;
