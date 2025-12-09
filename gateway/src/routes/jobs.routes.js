const express = require("express");
const router = express.Router();
const { createJob, getJobById } = require("../services/job.service");
const historyController = require("../controllers/jobHistory.controller");

router.post("/", async (req, res) => {
  const { name, url, schedule } = req.body || {};
  const jobId = await createJob({ name, url, schedule });
  return res.json({ message: "Job created", jobId });
});

router.get("/:jobId/snapshots", historyController.snapshots);
router.get("/:jobId/runs", historyController.runs);
router.get("/:jobId/change-history", historyController.changeHistory);
router.get("/:jobId/compare", historyController.compare);
router.get("/:jobId/stats", historyController.stats);

router.get("/:id", async (req, res) => {
  const job = await getJobById(req.params.id);
  return res.json(job);
});

module.exports = router;
