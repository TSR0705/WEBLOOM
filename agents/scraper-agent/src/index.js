const amqp = require("amqplib");
const axios = require("axios");

(async () => {
  console.log("Scraper Agent started");

  // Connect Queue
  const conn = await amqp.connect(process.env.RABBITMQ_URI);
  const channel = await conn.createChannel();
  await channel.assertQueue("job.start");
  await channel.assertQueue("html.raw");

  console.log("✔ Listening on job.start queue");

  channel.consume("job.start", async (msg) => {
    if (!msg) return;

    const payload = JSON.parse(msg.content.toString());
    console.log("→ Message received:", payload);

    const { jobId, runId, url } = payload;

    try {
      const response = await axios.get(url, { timeout: 30000 }); // 30 second timeout
      const html = response.data;

      const htmlPayload = JSON.stringify({
        jobId,
        runId,
        url,
        html,
      });

      channel.sendToQueue("html.raw", Buffer.from(htmlPayload));
      console.log("✔ Published raw HTML message");

      channel.ack(msg);
    } catch (err) {
      console.error("❌ Scraping failed:", err);
      
      // Mark run as failed in database
      try {
        const { MongoClient, ObjectId } = require('mongodb');
        const mongoClient = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/webloom');
        await mongoClient.connect();
        const db = mongoClient.db('webloom');
        await db.collection("job_runs").updateOne(
          { _id: new ObjectId(runId) },
          {
            $set: {
              status: "failed",
              finishedAt: new Date(),
              error: err.message
            }
          }
        );
        await mongoClient.close();
      } catch (dbErr) {
        console.error("❌ Failed to mark run as failed in database:", dbErr);
      }
      
      channel.ack(msg); // Acknowledge the message to prevent infinite retries
    }
  });
})();
