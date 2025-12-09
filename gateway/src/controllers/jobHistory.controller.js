const {
  getSnapshotsForJob,
  getRunsForJob,
  getChangeHistory,
  getSnapshotByVersion,
  getJobStats,
} = require("../services/history.service");
const { computeSnapshotDiff } = require("../utils/diff.util");

function sendSuccess(res, { message, data, count, status = 200 }) {
  const payload = { success: true, message, data };
  if (typeof count === "number") payload.count = count;
  return res.status(status).json(payload);
}

function sendError(res, status, message) {
  return res.status(status).json({ success: false, message });
}

async function snapshots(req, res) {
  const { jobId } = req.params;
  try {
    const items = await getSnapshotsForJob(jobId);
    return sendSuccess(res, {
      message: "Snapshots fetched",
      data: { items },
      count: items.length,
    });
  } catch (err) {
    console.error("Failed to fetch snapshots", { jobId, err });
    return sendError(res, 500, "Failed to fetch snapshots");
  }
}

async function runs(req, res) {
  const { jobId } = req.params;
  try {
    const runs = await getRunsForJob(jobId);
    const items = runs.map((run) => {
      const runId =
        run?._id && typeof run._id.toString === "function"
          ? run._id.toString()
          : run._id;

      return {
        runId,
        status: run.status,
        finishedAt: run.finishedAt || null,
        startedAt: run.startedAt || null,
        analysisStatus: run.analysisStatus || null,
        analysisScore: run.analysisScore ?? null,
        analysisLabel: run.analysisLabel || null,
        analysisFinishedAt: run.analysisFinishedAt || null,
        statusProgression: [
          {
            stage: "crawl",
            status: run.status,
            at: run.finishedAt || run.startedAt || null,
          },
          {
            stage: "analysis",
            status: run.analysisStatus || "pending",
            at: run.analysisFinishedAt || null,
          },
        ],
      };
    });
    return sendSuccess(res, {
      message: "Runs fetched",
      data: { items },
      count: items.length,
    });
  } catch (err) {
    console.error("Failed to fetch runs", { jobId, err });
    return sendError(res, 500, "Failed to fetch runs");
  }
}

async function changeHistory(req, res) {
  const { jobId } = req.params;
  try {
    const records = await getChangeHistory(jobId);
    const items = records.map((item) => ({
      version: item.runVersion,
      previousVersion: item.previousVersion,
      score: item.changeScore,
      label: item.changeLabel,
      createdAt: item.createdAt,
    }));

    return sendSuccess(res, {
      message: "Change history fetched",
      data: { items },
      count: items.length,
    });
  } catch (err) {
    console.error("Failed to fetch change history", { jobId, err });
    return sendError(res, 500, "Failed to fetch change history");
  }
}

async function compare(req, res) {
  const { jobId } = req.params;
  const fromVersion = Number.parseInt(req.query.from, 10);
  const toVersion = Number.parseInt(req.query.to, 10);

  if (!Number.isInteger(fromVersion) || !Number.isInteger(toVersion)) {
    return sendError(res, 400, "from and to query params must be integers");
  }

  if (fromVersion <= 0 || toVersion <= 0) {
    return sendError(res, 400, "from and to must be positive integers");
  }

  try {
    const [fromSnapshot, toSnapshot] = await Promise.all([
      getSnapshotByVersion(jobId, fromVersion),
      getSnapshotByVersion(jobId, toVersion),
    ]);

    if (!fromSnapshot) {
      return sendError(res, 404, `Snapshot version ${fromVersion} not found`);
    }

    if (!toSnapshot) {
      return sendError(res, 404, `Snapshot version ${toVersion} not found`);
    }

    const changes = computeSnapshotDiff(fromSnapshot, toSnapshot);

    return sendSuccess(res, {
      message: "Comparison complete",
      data: {
        jobId,
        fromVersion,
        toVersion,
        changes,
      },
    });
  } catch (err) {
    console.error("Failed to compare snapshots", { jobId, err });
    return sendError(res, 500, "Failed to compare snapshots");
  }
}

async function stats(req, res) {
  const { jobId } = req.params;
  try {
    const data = await getJobStats(jobId);
    return sendSuccess(res, {
      message: "Job stats fetched",
      data,
    });
  } catch (err) {
    console.error("Failed to fetch job stats", { jobId, err });
    return sendError(res, 500, "Failed to fetch job stats");
  }
}

module.exports = {
  snapshots,
  runs,
  changeHistory,
  compare,
  stats,
};
