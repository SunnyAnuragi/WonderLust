const Listing = require("../models/listing.js");
const nominatim = require("nominatim-client");
const client = nominatim.createClient({
  useragent: "WanderLust",
  referer: "http://localhost:8080",
});

// index
module.exports.index = async (req, res) => {
  let { search, category } = req.query;
  let query = {};
  if (search) {
    query.location = { $regex: search, $options: "i" };
  }
  if (category) {
    query.category = category;
  }
  const allListings = await Listing.find(query);
  res.render("listings/index.ejs", { allListings });
};

// render new form
module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

// show listings
module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: { path: "author" },
    })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Listing not exist!");
    return res.redirect("/listings");
  }
  // console.log(listing);
  res.render("listings/show.ejs", { listing });
};

// create listings
module.exports.createListing = async (req, res) => {
  try {
    const newListing = new Listing(req.body.listing);

    newListing.owner = req.user._id;

    if (req.file) {
      newListing.image = {
        url: req.file.path,
        filename: req.file.filename,
      };
    }

    // Convert location → latitude/longitude
    const result = await client.search({
      q: `${newListing.location}, ${newListing.country}`,
      addressdetails: "1",
    });

    if (result.length === 0) {
      req.flash("error", "Location could not be found!");
      return res.redirect("/listings/new");
    }

    // GeoJSON format
    newListing.geometry = {
      type: "Point",
      coordinates: [
        Number(result[0].lon), // longitude FIRST
        Number(result[0].lat), // latitude SECOND
      ],
    };

    await newListing.save();

    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
  } catch (error) {
    console.log(error);

    req.flash("error", "Something went wrong while creating listing.");
    res.redirect("/listings/new");
  }
};

// render edit form
module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing not exist!");
    res.redirect("/listings");
  }
  let originalImageurl = listing.image.url;
  originalImageurl = originalImageurl.replace("/upload", "/upload/w_250");
  res.render("listings/edit.ejs", { listing, originalImageurl });
};

// update listings
module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findByIdAndUpdate(
    id,
    { ...req.body.listing },
    { new: true },
  );
  if (req.file) {
    listing.image = {
      url: req.file.path,
      filename: req.file.filename,
    };
    await listing.save();
  }

  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};

// delete listings
module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};
