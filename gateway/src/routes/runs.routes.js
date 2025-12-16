const express = require("express");
const router = express.Router();
const { createJobRun, updateJobRunStatus, hasActiveRun } = require("../services/run.service");

const { getJobById } = require("../services/job.service");
const { publishJobStart } = require("../queue/publisher");

router.post("/:jobId/run", async (req, res) => {
  try {
    const job = await getJobById(req.params.jobId);

    if (!job) return res.status(404).json({ error: "Job not found" });

    // Check for active run to prevent concurrent runs
    const isActive = await hasActiveRun(job._id.toString());
    if (isActive) {
      return res.status(409).json({ error: "A run is already active for this job" });
    }

    const runId = await createJobRun(job._id.toString());

    await publishJobStart({
      jobId: job._id.toString(),
      runId: runId.toString(),
      url: job.url,
    });

    res.json({ message: "Run triggered", jobId: job._id, runId });
  } catch (err) {
    console.error("Failed to trigger run", err);
    res.status(500).json({ error: "Failed to trigger run" });
  }
});

module.exports = router;
