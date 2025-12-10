const { getDB } = require("../db/connection");
const JobModel = require("../db/collections/Job");
const { ObjectId } = require("mongodb");

async function createJob(data) {
  const db = await getDB();
  const jobData = JobModel(data);

  const result = await db.collection("jobs").insertOne(jobData);
  return result.insertedId;
}

async function getJobById(id) {
  const db = await getDB();
  return db.collection("jobs").findOne({ _id: new ObjectId(id) });
}

async function getAllJobs() {
  const db = await getDB();
  return db
    .collection("jobs")
    .find(
      {},
      {
        projection: {
          name: 1,
          url: 1,
          schedule: 1,
          createdAt: 1,
          status: 1,
          nextRunAt: 1,
        },
      }
    )
    .sort({ createdAt: -1 })
    .toArray();
}

module.exports = { createJob, getJobById, getAllJobs };
