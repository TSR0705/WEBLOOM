const amqp = require("amqplib");
const axios = require("axios");
const { MongoClient, ObjectId } = require("mongodb");

(async () => {
  console.log("Scraper Agent started");

  // Connect DB
  const mongo = new MongoClient(process.env.MONGODB_URI);
  await mongo.connect();
  const db = mongo.db("webloom");

  // Connect Queue
  const conn = await amqp.connect(process.env.RABBITMQ_URI);
  const channel = await conn.createChannel();
  await channel.assertQueue("job.start");

  console.log("✔ Listening on job.start queue");

  channel.consume("job.start", async (msg) => {
    if (!msg) return;

    const payload = JSON.parse(msg.content.toString());
    console.log("→ Message received:", payload);

    const { jobId, runId, url } = payload;

    try {
      const response = await axios.get(url);
      const html = response.data;

      await db.collection("snapshots").insertOne({
        jobId,
        url,
        html,
        createdAt: new Date(),
      });

      await db
        .collection("job_runs")
        .updateOne(
          { _id: new ObjectId(runId) },
          { $set: { status: "completed", finishedAt: new Date() } }
        );

      console.log(`✔ Snapshot stored for ${url}`);

      channel.ack(msg);
    } catch (err) {
      console.error("❌ Scraping failed:", err);
      channel.nack(msg);
    }
  });
})();
