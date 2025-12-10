const express = require("express");
const router = express.Router();
const {
  createJob,
  getJobById,
  getAllJobs,
} = require("../services/job.service");
const historyController = require("../controllers/jobHistory.controller");

router.get("/", async (req, res) => {
  try {
    const jobs = await getAllJobs();
    return res.json(jobs);
  } catch (err) {
    console.error("Failed to fetch jobs", err);
    return res.status(500).json({ message: "Failed to fetch jobs" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, url, schedule } = req.body || {};
    const jobId = await createJob({ name, url, schedule });
    return res.json({ message: "Job created", jobId });
  } catch (err) {
    console.error("Failed to create job", err);
    return res.status(500).json({ message: "Failed to create job" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const job = await getJobById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    return res.json(job);
  } catch (err) {
    console.error("Failed to fetch job", err);
    return res.status(500).json({ message: "Failed to fetch job" });
  }
});

router.get("/:jobId/snapshots", historyController.snapshots);
router.get("/:jobId/runs", historyController.runs);
router.get("/:jobId/change-history", historyController.changeHistory);
router.get("/:jobId/compare", historyController.compare);
router.get("/:jobId/stats", historyController.stats);
router.get("/:jobId/history", historyController.history);
router.get("/:jobId/version/:v", historyController.versionDetail);
router.get("/:jobId/compare-v2", historyController.compareV2);

module.exports = router;
