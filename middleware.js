const Listing = require("./models/listing.js");
const { listingSchema, reviewSchema } = require("./schema.js");
const ExpressError = require("./utils/ExpressError.js");
const Review = require("./models/review.js");

module.exports.isLogedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.redirectUrl = req.originalUrl;
    req.flash("error", "you must be loged in");
    return res.redirect("/login");
  }
  next();
};

module.exports.savesRedirectUrl = (req, res, next) => {
  if (req.session.redirectUrl) {
    res.locals.redirect = req.session.redirectUrl;
    delete req.session.redirectUrl;
  }
  next();
};

module.exports.isOwner = async (req, res, next) => {
  let { id } = req.params;
  let listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing not exist!");
    return res.redirect("/listings");
  }
  if (!req.user._id.equals(listing.owner)) {
    req.flash("error", "Permission denied");
    return res.redirect(`/listings/${id}`);
  }
  next();
};

// joi validate function
module.exports.validateListing = (req, res, next) => {
  let { error } = listingSchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, errMsg);
  } else {
    next();
  }
};

module.exports.validateReview = (req, res, next) => {
  let { error } = reviewSchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, errMsg);
  } else {
    next();
  }
};

module.exports.isReviewAuthor = async (req, res, next) => {
  let { id, reviewId } = req.params;
  let review = await Review.findById(reviewId);
  if (!review) {
    req.flash("error", "Review not exist!");
    return res.redirect("/listings");
  }
  if (!req.user._id.equals(review.author)) {
    req.flash("error", "Permission denied");
    return res.redirect(`/listings/${id}`);
  }
  next();
};

// Middleware to parse flat Multer fields with bracket notation into nested objects
module.exports.parseNestedBody = (req, res, next) => {
  if (req.body) {
    const nested = {};
    for (const key in req.body) {
      const match = key.match(/^(\w+)\[(\w+)\]$/);
      if (match) {
        const [, parent, child] = match;
        if (!nested[parent]) {
          nested[parent] = {};
        }
        nested[parent][child] = req.body[key];
      } else {
        nested[key] = req.body[key];
      }
    }
    req.body = { ...req.body, ...nested };
  }
  next();
};
