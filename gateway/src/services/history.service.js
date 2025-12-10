const { getDB } = require("../db/connection");

function normalizeJobId(jobId) {
  return jobId?.toString?.() ?? String(jobId);
}

async function getSnapshotsForJob(jobId) {
  const db = await getDB();
  const id = normalizeJobId(jobId);

  return db
    .collection("snapshots")
    .find({ jobId: id })
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
  const id = normalizeJobId(jobId);

  return db
    .collection("job_runs")
    .find({ jobId: id })
    .project({})
    .sort({ createdAt: 1, startedAt: 1 })
    .toArray();
}

async function getChangeHistory(jobId) {
  const db = await getDB();
  const id = normalizeJobId(jobId);

  return db
    .collection("changes")
    .find({ jobId: id })
    .project({ _id: 0 })
    .sort({ runVersion: 1 })
    .toArray();
}

async function getSnapshotWithHtml(jobId, version) {
  const db = await getDB();
  const id = normalizeJobId(jobId);

  return db.collection("snapshots").findOne(
    { jobId: id, version },
    {
      projection: { _id: 0 },
    }
  );
}

async function getSnapshotByVersion(jobId, version) {
  const db = await getDB();
  const id = normalizeJobId(jobId);

  return db.collection("snapshots").findOne(
    { jobId: id, version },
    {
      projection: {
        _id: 0,
        url: 0,
      },
    }
  );
}

async function getHistoryCollections(jobId) {
  const db = await getDB();
  const id = normalizeJobId(jobId);

  const [runs, snapshots, changes] = await Promise.all([
    db
      .collection("job_runs")
      .find({ jobId: id })
      .sort({ createdAt: 1 })
      .toArray(),
    db
      .collection("snapshots")
      .find({ jobId: id })
      .sort({ version: 1 })
      .toArray(),
    db
      .collection("changes")
      .find({ jobId: id })
      .sort({ runVersion: 1 })
      .toArray(),
  ]);

  return { runs, snapshots, changes };
}

async function getJobStats(jobId) {
  const db = await getDB();
  const id = normalizeJobId(jobId);

  const [snapshotAgg] = await db
    .collection("snapshots")
    .aggregate([
      { $match: { jobId: id } },
      { $group: { _id: null, totalVersions: { $max: "$version" } } },
    ])
    .toArray();

  const [changeAgg] = await db
    .collection("changes")
    .aggregate([
      { $match: { jobId: id } },
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
      { $match: { jobId: id } },
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
  getSnapshotWithHtml,
  getJobStats,
  getHistoryCollections,
};
