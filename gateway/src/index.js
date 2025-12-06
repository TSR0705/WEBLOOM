const express = require("express");
const { connectDB } = require("./db/connection");
const jobRoutes = require("./routes/jobs.routes");
const runRoutes = require("./routes/runs.routes");

const app = express();
app.use(express.json());

app.use("/jobs", jobRoutes);
app.use("/runs", runRoutes);

app.get("/health", (req, res) =>
  res.json({ status: "ok", service: "gateway" })
);

(async () => {
  await connectDB();
  app.listen(3000, () => console.log("Gateway running at 3000"));
})();
