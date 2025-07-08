require("dotenv").config();
const express = require("express");
const fetch = require("node-fetch");
const app = express();

const PORT = process.env.PORT || 3001;
const API_KEY = process.env.GOLDAPI_API_KEY;
const GOLDAPI_URL = "https://www.goldapi.io/api/XAU/USD";

app.use(express.static("."));

app.get("/api/gold-price", async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  try {
    const response = await fetch(GOLDAPI_URL, {
      headers: {
        "x-access-token": API_KEY,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) throw new Error("GoldAPI error: " + response.status);
    const data = await response.json();
    // GoldAPI returns price per troy ounce in USD
    const pricePerOunce = data.price;
    const pricePerGram = pricePerOunce / 31.1035;
    res.json({ pricePerGram });
  } catch (err) {
    console.error("GoldAPI fetch error:", err);
    res.status(500).json({ error: "Failed to fetch gold price" });
  }
});

app.use(express.static("."));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
