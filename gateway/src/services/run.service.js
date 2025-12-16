const { getDB } = require("../db/connection");
const RunModel = require("../db/collections/JobRun");
const { ObjectId } = require("mongodb");

async function createJobRun(jobId) {
  const db = await getDB();
  const runData = RunModel({ jobId });

  const result = await db.collection("job_runs").insertOne(runData);
  return result.insertedId;
}

async function updateJobRunStatus(runId, status) {
  const db = await getDB();
  return db
    .collection("job_runs")
    .updateOne(
      { _id: new ObjectId(runId) },
      { $set: { status, finishedAt: new Date() } }
    );
}

async function hasActiveRun(jobId) {
  const db = await getDB();
  const activeRun = await db.collection("job_runs").findOne({ 
    jobId, 
    status: { $nin: ['completed', 'failed'] } 
  });
  return !!activeRun;
}

module.exports = { createJobRun, updateJobRunStatus, hasActiveRun };
