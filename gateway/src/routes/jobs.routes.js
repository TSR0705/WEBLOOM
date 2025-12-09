const express = require("express");
const router = express.Router();
const { createJob, getJobById } = require("../services/job.service");
const historyController = require("../controllers/jobHistory.controller");

router.post("/", async (req, res) => {
  const { name, url, schedule } = req.body || {};
  const jobId = await createJob({ name, url, schedule });
  return res.json({ message: "Job created", jobId });
});

router.get("/:id", async (req, res) => {
  const job = await getJobById(req.params.id);
  return res.json(job);
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
