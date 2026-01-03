const mongoose = require("mongoose");
const Location = require("../models/locationModel");
require("dotenv").config({ path: "backend/config/config.env" });

/**
 * Seed script for initial location data
 * Run: node backend/scripts/seedLocations.js
 */

// Sample location data (India - major cities)
const locations = [
  // Gujarat
  {
    city: "Ahmedabad",
    state: "Gujarat",
    country: "India",
    pincodes: ["380001", "380002", "380003", "380004", "380005"],
    latitude: "23.0225",
    longitude: "72.5714",
  },
  {
    city: "Surat",
    state: "Gujarat",
    country: "India",
    pincodes: ["395001", "395002", "395003"],
    latitude: "21.1702",
    longitude: "72.8311",
  },
  {
    city: "Vadodara",
    state: "Gujarat",
    country: "India",
    pincodes: ["390001", "390002", "390003"],
    latitude: "22.3072",
    longitude: "73.1812",
  },
  {
    city: "Rajkot",
    state: "Gujarat",
    country: "India",
    pincodes: ["360001", "360002", "360003"],
    latitude: "22.3039",
    longitude: "70.8022",
  },
  // Maharashtra
  {
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    pincodes: ["400001", "400002", "400003", "400004", "400005"],
    latitude: "19.0760",
    longitude: "72.8777",
  },
  {
    city: "Pune",
    state: "Maharashtra",
    country: "India",
    pincodes: ["411001", "411002", "411003"],
    latitude: "18.5204",
    longitude: "73.8567",
  },
  {
    city: "Nagpur",
    state: "Maharashtra",
    country: "India",
    pincodes: ["440001", "440002", "440003"],
    latitude: "21.1458",
    longitude: "79.0882",
  },
  // Delhi
  {
    city: "New Delhi",
    state: "Delhi",
    country: "India",
    pincodes: ["110001", "110002", "110003", "110004", "110005"],
    latitude: "28.6139",
    longitude: "77.2090",
  },
  {
    city: "Delhi",
    state: "Delhi",
    country: "India",
    pincodes: ["110001", "110002", "110003"],
    latitude: "28.6139",
    longitude: "77.2090",
  },
  // Karnataka
  {
    city: "Bangalore",
    state: "Karnataka",
    country: "India",
    pincodes: ["560001", "560002", "560003", "560004"],
    latitude: "12.9716",
    longitude: "77.5946",
  },
  {
    city: "Mysore",
    state: "Karnataka",
    country: "India",
    pincodes: ["570001", "570002"],
    latitude: "12.2958",
    longitude: "76.6394",
  },
  // Tamil Nadu
  {
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    pincodes: ["600001", "600002", "600003"],
    latitude: "13.0827",
    longitude: "80.2707",
  },
  {
    city: "Coimbatore",
    state: "Tamil Nadu",
    country: "India",
    pincodes: ["641001", "641002"],
    latitude: "11.0168",
    longitude: "76.9558",
  },
  // West Bengal
  {
    city: "Kolkata",
    state: "West Bengal",
    country: "India",
    pincodes: ["700001", "700002", "700003"],
    latitude: "22.5726",
    longitude: "88.3639",
  },
  // Rajasthan
  {
    city: "Jaipur",
    state: "Rajasthan",
    country: "India",
    pincodes: ["302001", "302002", "302003"],
    latitude: "26.9124",
    longitude: "75.7873",
  },
  {
    city: "Udaipur",
    state: "Rajasthan",
    country: "India",
    pincodes: ["313001", "313002"],
    latitude: "24.5854",
    longitude: "73.7125",
  },
  // Uttar Pradesh
  {
    city: "Lucknow",
    state: "Uttar Pradesh",
    country: "India",
    pincodes: ["226001", "226002", "226003"],
    latitude: "26.8467",
    longitude: "80.9462",
  },
  {
    city: "Kanpur",
    state: "Uttar Pradesh",
    country: "India",
    pincodes: ["208001", "208002"],
    latitude: "26.4499",
    longitude: "80.3319",
  },
  // Punjab
  {
    city: "Amritsar",
    state: "Punjab",
    country: "India",
    pincodes: ["143001", "143002"],
    latitude: "31.6340",
    longitude: "74.8723",
  },
  {
    city: "Ludhiana",
    state: "Punjab",
    country: "India",
    pincodes: ["141001", "141002"],
    latitude: "30.9010",
    longitude: "75.8573",
  },
];

const seedLocations = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL);
    console.log("Connected to MongoDB");

    // Clear existing locations (optional - comment out if you want to keep existing)
    // await Location.deleteMany({});
    // console.log("Cleared existing locations");

    // Insert locations
    let created = 0;
    let skipped = 0;

    for (const loc of locations) {
      try {
        // Check if location already exists
        const existing = await Location.findExact(
          loc.city,
          loc.state,
          loc.country
        );

        if (existing) {
          console.log(`Skipped: ${loc.city}, ${loc.state} (already exists)`);
          skipped++;
        } else {
          await Location.create(loc);
          console.log(`Created: ${loc.city}, ${loc.state}`);
          created++;
        }
      } catch (error) {
        console.error(`Error creating ${loc.city}:`, error.message);
      }
    }

    console.log("\n=== Seeding Complete ===");
    console.log(`Created: ${created}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Total: ${locations.length}`);

    process.exit(0);
  } catch (error) {
    console.error("Error seeding locations:", error);
    process.exit(1);
  }
};

// Run seed
seedLocations();

