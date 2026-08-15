if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");

app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.engine("ejs", ejsMate);
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "/public")));

const dbUrl = process.env.ATLASDB_URL;

async function main() {
  await mongoose.connect(dbUrl);
}

main()
  .then(() => {
    console.log("Connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

app.get("/", (req, res) => {
  res.send("Hii I am root");
});

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);

app.use((err, req, res, next) => {
  let { message = "something went wrong" } = err;
  res.render("error.ejs", { message });
});
// app.get("/testlisting", async (req, res) => {
//   let sampletesting = new Listing({
//     title: "My new Villa",
//     description: "by beach",
//     image: "",
//     price: 10000,
//     location: "Goa",
//   });
//   await sampletesting.save();
//   res.send("Test listing created");
// });

app.listen(8080, () => {
  console.log("server is listening on 8080");
});
