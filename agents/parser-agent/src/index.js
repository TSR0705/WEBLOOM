const amqp = require("amqplib");
const { MongoClient, ObjectId } = require("mongodb");
const cheerio = require("cheerio");

function wait(ms) {
  return new Promise(res => setTimeout(res, ms));
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
        frameMax: 131072
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
    frameMax: 131072
  });

  const channel = await conn.createChannel();

  // 👇 This is NEW — very important
  await channel.assertExchange("snapshot.exchange", "fanout", { durable: true });
  await channel.assertQueue("html.raw");

  console.log("✔ Connected to RabbitMQ & Listening on html.raw queue");

  return { conn, channel };
}

async function startParser() {
  console.log("\n🔄 Starting Parser Agent...");

  const MONGODB_URI = process.env.MONGODB_URI;
  let db;

  try {
    console.log("⏳ Connecting to MongoDB...");
    const mongo = new MongoClient(MONGODB_URI);
    await mongo.connect();
    db = mongo.db("webloom");
    console.log("✔ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Connection Failed. Retrying in 5s...");
    setTimeout(startParser, 5000);
    return;
  }

  const { conn, channel } = await connectRabbitMQ();

  channel.consume("html.raw", async msg => {
    if (!msg) return;

    try {
      const payload = JSON.parse(msg.content.toString());
      const { jobId, runId, url, html } = payload;

      console.log(`🧠 Parsing HTML for: ${url}`);

      const $ = cheerio.load(html);

      const title = $("title").text().trim();
      const description = $('meta[name="description"]').attr("content") || null;

      $("script, style, noscript").remove();
      const text = $("body").text().replace(/\s+/g, " ").trim();

      const links = [];
      $("a").each((_, el) => {
        links.push({
          href: $(el).attr("href"),
          text: $(el).text().trim()
        });
      });

      const lastVersion = await db.collection("snapshots")
        .find({ jobId, url })
        .sort({ version: -1 })
        .limit(1)
        .toArray();

      const version = lastVersion.length ? lastVersion[0].version + 1 : 1;

      await db.collection("snapshots").insertOne({
        jobId,
        url,
        html,
        version,
        parsed: { title, description, text, links },
        createdAt: new Date()
      });

      await db.collection("job_runs").updateOne(
        { _id: new ObjectId(runId) },
        { $set: { status: "completed", finishedAt: new Date() } }
      );

      console.log(`✨ Snapshot saved — version v${version}`);

      // 👇 THIS IS THE LINE YOU MISSED EARLIER
      channel.publish(
        "snapshot.exchange",
        "",
        Buffer.from(JSON.stringify({
          jobId,
          runId,
          url,
          currentVersion: version
        }))
      );

      console.log(`📌 Published snapshot-created event for version v${version}`);

      channel.ack(msg);

    } catch (err) {
      console.error("❌ Parsing Error:", err);
      channel.nack(msg, false, true);
    }
  });

  conn.on("close", () => {
    console.error("⚠️ RabbitMQ connection closed. Restarting parser...");
    setTimeout(startParser, 5000);
  });

  conn.on("error", err => {
    console.error("⚠️ RabbitMQ error:", err);
  });
}

startParser();
