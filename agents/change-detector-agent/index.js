const amqp = require("amqplib");
const { MongoClient, ObjectId } = require("mongodb");

function wait(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function connectRabbitMQ() {
  console.log("⏳ Verifying RabbitMQ readiness...");

  while (true) {
    try {
      const testConn = await amqp.connect({
        protocol: "amqp",
        hostname: "webloom-rabbitmq",
        port: 5672,
        username: "guest",
        password: "guest",
        frameMax: 131072,
      });

      await testConn.close();
      console.log("✔ RabbitMQ is ready");
      break;
    } catch (err) {
      console.log("⏳ Waiting for RabbitMQ to fully initialize...");
      await wait(3000);
    }
  }

  console.log("⏳ Connecting to RabbitMQ...");
  const conn = await amqp.connect({
    protocol: "amqp",
    hostname: "webloom-rabbitmq",
    port: 5672,
    username: "guest",
    password: "guest",
    frameMax: 131072,
  });

  const channel = await conn.createChannel();

  // 🔴 THIS WAS MISSING EARLIER
  await channel.assertExchange("snapshot.exchange", "fanout", { durable: true });
  await channel.assertQueue("snapshot.created", { durable: true });
  await channel.bindQueue("snapshot.created", "snapshot.exchange", "");

  console.log(
    "✔ Connected to RabbitMQ, queue 'snapshot.created' bound to exchange 'snapshot.exchange'"
  );
  console.log("✔ Listening on snapshot.created queue");

  return { conn, channel };
}

async function startChangeDetector() {
  console.log("\n🔄 Change detector waiting for messages...");

  const MONGODB_URI = process.env.MONGODB_URI;

  let db;
  try {
    console.log("⏳ Connecting to MongoDB...");
    const mongo = new MongoClient(MONGODB_URI);
    await mongo.connect();
    db = mongo.db("webloom");
    console.log("✔ MongoDB Connected");
  } catch (err) {
    console.error(
      "❌ MongoDB Connection Failed. Retrying in 5s...",
      err.message
    );
    setTimeout(startChangeDetector, 5000);
    return;
  }

  const { conn, channel } = await connectRabbitMQ();

  channel.consume("snapshot.created", async (msg) => {
    if (!msg) return;

    try {
      const payload = JSON.parse(msg.content.toString());
      const { jobId, runId, url, currentVersion } = payload;

      console.log(`🧠 Analyzing version v${currentVersion} for job ${jobId}`);

      // Fetch current snapshot
      const currentDoc = await db.collection("snapshots").findOne({
        jobId,
        url,
        version: currentVersion,
      });

      if (!currentDoc) {
        console.error(
          `❌ Current snapshot not found: version ${currentVersion}`
        );
        channel.nack(msg, false, true);
        return;
      }

      const previousVersion = currentVersion - 1;

      if (previousVersion === 0) {
        console.log("📌 No previous version found (v1), skipping change detection");
        channel.ack(msg);
        return;
      }

      // Fetch previous snapshot
      const previousDoc = await db.collection("snapshots").findOne({
        jobId,
        url,
        version: previousVersion,
      });

      if (!previousDoc) {
        console.log(
          `📌 Previous snapshot v${previousVersion} not found, skipping`
        );
        channel.ack(msg);
        return;
      }

      // Extract text from both snapshots
      const previousText = previousDoc.parsed?.text || "";
      const currentText = currentDoc.parsed?.text || "";

      const commonLength = Math.min(previousText.length, currentText.length);
      const similarity =
        commonLength > 0 ? commonLength / previousText.length : 0;
      const score = 1 - similarity;

      let changeLabel;
      if (score <= 0.2) {
        changeLabel = "low";
      } else if (score <= 0.6) {
        changeLabel = "medium";
      } else {
        changeLabel = "high";
      }

      await db.collection("changes").insertOne({
        jobId,
        url,
        runVersion: currentVersion,
        previousVersion,
        changeScore: score,
        changeLabel,
        createdAt: new Date(),
      });

      await db.collection("job_runs").updateOne(
        { _id: new ObjectId(runId) },
        {
          $set: {
            analysisStatus: "done",
            analysisScore: score,
            analysisLabel: changeLabel,
            analysisFinishedAt: new Date(),
          },
        }
      );

      console.log(
        `✨ Change stored successfully - v${previousVersion} → v${currentVersion}, Score: ${score.toFixed(
          2
        )}, Label: ${changeLabel}`
      );
      channel.ack(msg);
    } catch (err) {
      console.error("❌ Change detection error:", err);
      channel.nack(msg, false, true);
    }
  });

  conn.on("close", () => {
    console.error(
      "⚠️ RabbitMQ connection closed. Restarting change detector..."
    );
    setTimeout(startChangeDetector, 5000);
  });

  conn.on("error", (err) => {
    console.error("⚠️ RabbitMQ error:", err);
  });
}

startChangeDetector();
