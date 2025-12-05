const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "gateway",
  });
});

app.listen(PORT, () => {
  console.log(`Gateway service listening on port ${PORT}`);
});
