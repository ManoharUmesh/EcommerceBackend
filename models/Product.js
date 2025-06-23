const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  description: String,
  image: String, // Default image
  extraImages: [String], // Array of extra image paths
  category: String,
  subCategory: String,
});

module.exports = mongoose.model("Product", productSchema);
