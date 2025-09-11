require("dotenv").config();
const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const MONGO_URL = process.env.DB_URL; // Use Atlas URL from .env

main()
  .then(() => {
    console.log("Connected to Atlas DB");
  })
  .catch((err) => {
    console.log("Error connecting:", err);
  });

async function main() {
  await mongoose.connect(MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}

const initDB = async () => {
  await Listing.deleteMany({});
  initData.data = initData.data.map((obj) => ({
    ...obj,
    owner: "685cd283e4e3251db46cf7ac", // Replace with a real User _id in Atlas
  }));
  await Listing.insertMany(initData.data);
  console.log("Data was initialized in Atlas");
};

initDB();
