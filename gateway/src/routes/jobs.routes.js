const express = require("express");
const router = express.Router();
const { createJob, getJobById } = require("../services/job.service");

router.post("/", async (req, res) => {
  const { name, url, schedule } = req.body || {};
  const jobId = await createJob({ name, url, schedule });
  return res.json({ message: "Job created", jobId });
});

router.get("/:id", async (req, res) => {
  const job = await getJobById(req.params.id);
  return res.json(job);
});

module.exports = router;
