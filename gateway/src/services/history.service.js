const { getDB } = require("../db/connection");

async function getSnapshotsForJob(jobId) {
  const db = await getDB();
  return db
    .collection("snapshots")
    .find({ jobId })
    .project({
      _id: 0,
      version: 1,
      createdAt: 1,
      "parsed.title": 1,
      "parsed.description": 1,
    })
    .sort({ version: 1 })
    .toArray();
}

async function getRunsForJob(jobId) {
  const db = await getDB();
  return db
    .collection("job_runs")
    .find({ jobId })
    .project({
      jobId: 0,
    })
    .sort({ startedAt: 1 })
    .toArray();
}

async function getChangeHistory(jobId) {
  const db = await getDB();
  return db
    .collection("changes")
    .find({ jobId })
    .project({
      _id: 0,
      jobId: 0,
    })
    .sort({ createdAt: 1 })
    .toArray();
}

async function getSnapshotByVersion(jobId, version) {
  const db = await getDB();
  return db.collection("snapshots").findOne(
    { jobId, version },
    {
      projection: {
        _id: 0,
        html: 0,
        url: 0,
      },
    }
  );
}

async function getJobStats(jobId) {
  const db = await getDB();

  const [snapshotAgg] = await db
    .collection("snapshots")
    .aggregate([
      { $match: { jobId } },
      {
        $group: {
          _id: null,
          totalVersions: { $max: "$version" },
        },
      },
    ])
    .toArray();

  const [changeAgg] = await db
    .collection("changes")
    .aggregate([
      { $match: { jobId } },
      {
        $group: {
          _id: null,
          highCount: {
            $sum: { $cond: [{ $eq: ["$changeLabel", "high"] }, 1, 0] },
          },
          mediumCount: {
            $sum: { $cond: [{ $eq: ["$changeLabel", "medium"] }, 1, 0] },
          },
          lowCount: {
            $sum: { $cond: [{ $eq: ["$changeLabel", "low"] }, 1, 0] },
          },
          avgScore: { $avg: "$changeScore" },
        },
      },
    ])
    .toArray();

  const [runAgg] = await db
    .collection("job_runs")
    .aggregate([
      { $match: { jobId } },
      {
        $group: {
          _id: null,
          firstRunAt: { $min: "$startedAt" },
          lastRunAt: { $max: "$startedAt" },
        },
      },
    ])
    .toArray();

  return {
    totalVersions: snapshotAgg?.totalVersions || 0,
    highCount: changeAgg?.highCount || 0,
    mediumCount: changeAgg?.mediumCount || 0,
    lowCount: changeAgg?.lowCount || 0,
    avgScore: changeAgg?.avgScore ?? null,
    firstRunAt: runAgg?.firstRunAt || null,
    lastRunAt: runAgg?.lastRunAt || null,
  };
}

module.exports = {
  getSnapshotsForJob,
  getRunsForJob,
  getChangeHistory,
  getSnapshotByVersion,
  getJobStats,
};
