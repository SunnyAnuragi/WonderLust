const mongoose = require("mongoose");
const nominatim = require("nominatim-client");
const Listing = require("../models/listing.js");
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const client = nominatim.createClient({
  useragent: "WanderLust",
  referer: "http://localhost:8080",
});

const dbUrl = process.env.ATLASDB_URL;

console.log("DB URL exists:", !!process.env.ATLASDB_URL);
async function geocodeListings() {
  try {
    await mongoose.connect(dbUrl);
    console.log("Connected to database");

    // Find old listings that don't have geometry
    const listings = await Listing.find({
      $or: [
        { geometry: { $exists: false } },
        { "geometry.coordinates": { $exists: false } },
      ],
    });

    console.log(`Found ${listings.length} listings to update`);

    for (const listing of listings) {
      console.log(`Geocoding: ${listing.location}, ${listing.country}`);

      const result = await client.search({
        q: `${listing.location}, ${listing.country}`,
        addressdetails: "1",
      });

      if (result.length === 0) {
        console.log(`❌ Location not found: ${listing.location}`);
        continue;
      }

      listing.geometry = {
        type: "Point",
        coordinates: [Number(result[0].lon), Number(result[0].lat)],
      };

      await listing.save();

      console.log(
        `✅ Updated: ${listing.title} → ${listing.geometry.coordinates}`,
      );

      // Don't send too many requests too quickly
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log("🎉 Geocoding completed!");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Database connection closed");
  }
}

geocodeListings();
