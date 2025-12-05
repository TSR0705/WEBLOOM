const { connectDB } = require("./src/db/connection");
const { createJob } = require("./src/services/job.service");

(async () => {
  await connectDB();

  const jobId = await createJob({
    name: "Test Job From Script",
    url: "https://example.com"
  });

  console.log("✔ Job Created:", jobId);
})();
