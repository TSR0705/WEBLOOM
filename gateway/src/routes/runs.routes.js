const express = require("express");
const router = express.Router();
const { createJobRun, updateJobRunStatus } = require("../services/run.service");

const { getJobById } = require("../services/job.service");
const { publishJobStart } = require("../queue/publisher");

router.post("/:jobId/run", async (req, res) => {
  const job = await getJobById(req.params.jobId);

  if (!job) return res.status(404).json({ error: "Job not found" });

  const runId = await createJobRun(job._id.toString());

  await publishJobStart({
    jobId: job._id.toString(),
    runId: runId.toString(),
    url: job.url,
  });

  res.json({ message: "Run triggered", jobId: job._id, runId });
});

module.exports = router;
