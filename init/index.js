if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");

const dbUrl = process.env.ATLASDB_URL;

async function main() {
  await mongoose.connect(dbUrl);
}

const initDB = async () => {
  await Listing.deleteMany({});

  const user = await User.findOne({ username: "kirmada" });
  if (!user) {
    throw new Error("User not found");
  }
  initData.data = initData.data.map((obj) => ({
    ...obj,
    owner: user._id,
  }));
  await Listing.insertMany(initData.data);
  console.log("Data was initialized");
};

main()
  .then(async () => {
    console.log("Connected to DB");
    await initDB();
    mongoose.connection.close(); // optional
  })
  .catch((err) => {
    console.log(err);
  });
