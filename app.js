const express = require("express");
const app = express();

app.use(express.json());

// Health Check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

module.exports = app;
