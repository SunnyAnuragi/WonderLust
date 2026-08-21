const express = require("express");
const router = express.Router();
// const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync.js");
const passport = require("passport");
const { savesRedirectUrl } = require("../middleware.js");
const userController = require("../controllers/users.js");

router.get("/signup", userController.renderSignupForm);

router.post("/signup", wrapAsync(userController.signUp));

router.get("/login", userController.renderLoginForm);

router.post(
  "/login",
  savesRedirectUrl,
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  userController.login,
);

router.get("/logout",userController.logout);
module.exports = router;
