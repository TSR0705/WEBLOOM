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

module.exports = { createJob, getJobById };
