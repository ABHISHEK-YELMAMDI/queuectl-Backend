const express = require("express");
const app = express();

app.use(express.json());

const queueRoutes = require("./src/routes/queueRoutes");
app.use("/queue", queueRoutes);

app.get("/", (req, res) => {
    res.send("QueueCTL Backend is Running ");
});

module.exports = app;
