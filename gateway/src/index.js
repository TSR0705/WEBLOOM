const express = require("express");
const cors = require("cors");
const { connectDB } = require("./db/connection");
const jobRoutes = require("./routes/jobs.routes");
const runRoutes = require("./routes/runs.routes");

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());

app.use("/jobs", jobRoutes);
app.use("/runs", runRoutes);

app.get("/health", (req, res) =>
  res.json({ status: "ok", service: "gateway" })
);

(async () => {
  try {
    await connectDB();
    app.listen(3000, () => console.log("Gateway running at 3000"));
  } catch (err) {
    console.error("Failed to start gateway", err);
    process.exit(1);
  }
})();
