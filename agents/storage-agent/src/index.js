const amqp = require('amqplib');
const { MongoClient, ObjectId } = require('mongodb');

// This function is no longer needed as version is passed from parser agent

async function startStorageAgent() {
  console.log('Storage Agent started');

  const mongoClient = new MongoClient(process.env.MONGODB_URI);
  await mongoClient.connect();
  const db = mongoClient.db('webloom');
  const snapshotsCollection = db.collection('snapshots');

  const conn = await amqp.connect(process.env.RABBITMQ_URI);
  const channel = await conn.createChannel();

  await channel.assertQueue('snapshot.created');
  await channel.assertQueue('snapshot.stored');

  console.log('✔ Listening on snapshot.created queue');

  channel.consume('snapshot.created', async (msg) => {
    if (!msg) return;

    const payload = JSON.parse(msg.content.toString());
    console.log('→ Snapshot message received:', payload);

    const { jobId, runId, url, html, title } = payload;

    try {
      // Use the version from the parser agent
      const versionToUse = payload.version;

      const result = await snapshotsCollection.insertOne({
        jobId,
        runId,
        url,
        html,
        title,
        version: versionToUse,
        createdAt: new Date()
      });

      const snapshotId = result.insertedId.toString();
      console.log(`✔ Snapshot persisted with version v${versionToUse}`);

      const storedPayload = JSON.stringify({
        jobId,
        runId,
        snapshotId,
        version: versionToUse
      });

      channel.sendToQueue('snapshot.stored', Buffer.from(storedPayload));
      console.log('✔ Published snapshot.stored event');

      channel.ack(msg);
    } catch (err) {
      console.error('❌ Failed to persist snapshot:', err);
      channel.nack(msg);
    }
  });
}

(async () => {
  await startStorageAgent();
})();