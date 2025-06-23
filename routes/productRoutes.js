const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Product = require("../models/Product");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

// GET /api/products?q=searchText
router.get("/", async (req, res) => {
  try {
    const query = req.query.q || "";
    const products = await Product.find({
      name: { $regex: query, $options: "i" },
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/products/:id
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Not Found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/products (Admin: add new product)
router.post("/", async (req, res) => {
  const { name, price, image, description } = req.body;

  if (!name || !price || !image || !description) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const newProduct = new Product({ name, price, image, description });
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/products/:id (Update a product)
router.put("/:id", async (req, res) => {
  const { name, price, image, description } = req.body;

  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { name, price, image, description },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(updatedProduct);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/products/:id (Delete a product)
router.delete("/:id", async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);

    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/products/upload (Upload product with images)
router.post(
  "/upload",
  upload.fields([
    { name: "defaultImage", maxCount: 1 },
    { name: "extraImages", maxCount: 7 },
  ]),
  async (req, res) => {
    try {
      const { name, price, description, category, subCategory } = req.body;

      if (!name || !price || !description || !req.files?.defaultImage) {
        return res.status(400).json({ message: "Missing required fields." });
      }

      const defaultImage = req.files.defaultImage[0];
      const extraImages = req.files.extraImages || [];

      const newProduct = new Product({
        name: name.trim(),
        price: parseFloat(price),
        description: description.trim(),
        category: category?.trim(),
        subCategory: subCategory?.trim(),
        image: `/uploads/${defaultImage.filename}`,
        extraImages: extraImages.map((file) => `/uploads/${file.filename}`),
      });

      await newProduct.save();

      res
        .status(201)
        .json({ message: "✅ Product uploaded", product: newProduct });
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;