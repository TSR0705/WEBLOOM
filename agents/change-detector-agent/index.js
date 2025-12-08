const amqp = require("amqplib");
const { MongoClient, ObjectId } = require("mongodb");

function wait(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

// *** Character-Based Change Score ***
function computeChangeScore(previousText, currentText) {
  const maxLength = Math.max(previousText.length, currentText.length);
  const minLength = Math.min(previousText.length, currentText.length);

  if (maxLength === 0) return 0; // both empty → no change

  let matchCount = 0;

  for (let i = 0; i < minLength; i++) {
    if (previousText[i] === currentText[i]) {
      matchCount++;
    }
  }

  // total changed chars (including new extra chars)
  const totalDifference = maxLength - matchCount;
  return totalDifference / maxLength;
}

async function connectRabbitMQ() {
  console.log("⏳ Verifying RabbitMQ readiness...");

  while (true) {
    try {
      const conn = await amqp.connect({
        protocol: "amqp",
        hostname: "webloom-rabbitmq",
        port: 5672,
        username: "guest",
        password: "guest",
        frameMax: 131072,
      });

      await conn.close();
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

  await channel.assertExchange("snapshot.exchange", "fanout", {
    durable: true
  });

  await channel.assertQueue("snapshot.created", { durable: true });

  await channel.bindQueue("snapshot.created", "snapshot.exchange", "");

  console.log("✔ Connected to RabbitMQ");
  console.log("✔ Queue bound: snapshot.created → snapshot.exchange");

  return { conn, channel };
}

async function startChangeDetector() {
  console.log("\n🔄 Change detector agent is starting...");

  const MONGODB_URI = process.env.MONGODB_URI;

  let db;
  try {
    console.log("⏳ Connecting to MongoDB...");
    const mongo = new MongoClient(MONGODB_URI);
    await mongo.connect();
    db = mongo.db("webloom");
    console.log("✔ MongoDB Connected");

  } catch (err) {
    console.error("❌ MongoDB Connection Failed → Retrying...");
    setTimeout(startChangeDetector, 5000);
    return;
  }

  const { conn, channel } = await connectRabbitMQ();

  console.log("▶ Listening for snapshot-created events");

  channel.consume("snapshot.created", async (msg) => {
    if (!msg) return;

    try {
      const payload = JSON.parse(msg.content.toString());
      const { jobId, runId, url, currentVersion } = payload;

      console.log(`🧠 Comparing version v${currentVersion}`);

      // current snapshot
      const currentDoc = await db.collection("snapshots").findOne({
        jobId,
        url,
        version: currentVersion
      });

      if (!currentDoc) {
        console.error(`❌ Snapshot version v${currentVersion} not found`);
        channel.nack(msg, false, true);
        return;
      }

      const previousVersion = currentVersion - 1;

      if (previousVersion <= 0) {
        console.log("📌 No previous version exists → skipping");
        channel.ack(msg);
        return;
      }

      // previous snapshot
      const previousDoc = await db.collection("snapshots").findOne({
        jobId,
        url,
        version: previousVersion
      });

      if (!previousDoc) {
        console.log(`📌 Previous snapshot v${previousVersion} missing → skipping`);
        channel.ack(msg);
        return;
      }

      const previousText = previousDoc.parsed?.text || "";
      const currentText = currentDoc.parsed?.text || "";

      // 🔥 New correct change calculation
      const changeScore = computeChangeScore(previousText, currentText);

      let changeLabel;
      if (changeScore <= 0.10) changeLabel = "low";
      else if (changeScore <= 0.40) changeLabel = "medium";
      else changeLabel = "high";

      // store result
      await db.collection("changes").insertOne({
        jobId,
        url,
        runVersion: currentVersion,
        previousVersion,
        changeScore,
        changeLabel,
        createdAt: new Date(),
      });

      // update job_runs entry
      await db.collection("job_runs").updateOne(
        { _id: new ObjectId(runId) },
        {
          $set: {
            analysisStatus: "done",
            analysisScore: changeScore,
            analysisLabel: changeLabel,
            analysisFinishedAt: new Date()
          }
        }
      );

      console.log(
        `✨ Change stored — v${previousVersion} → v${currentVersion}, Score: ${changeScore.toFixed(
          3
        )}, Label: ${changeLabel}`
      );

      channel.ack(msg);

    } catch (err) {
      console.error("❌ Change detection error:", err);
      channel.nack(msg, false, true);
    }
  });

  conn.on("close", () => {
    console.error("⚠ RabbitMQ closed → restarting...");
    setTimeout(startChangeDetector, 5000);
  });

  conn.on("error", (err) => {
    console.error("⚠ RabbitMQ error →", err);
  });
}

startChangeDetector();
