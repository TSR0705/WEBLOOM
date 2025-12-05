const express = require("express");
const { connectDB } = require("./db/connection");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "gateway",
  });
});

(async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Gateway service listening on port ${PORT}`);
  });
})();
