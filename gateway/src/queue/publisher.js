const amqp = require("amqplib");

let channel;

async function connectQueue() {
  if (channel) return channel;

  const conn = await amqp.connect(process.env.RABBITMQ_URI);
  channel = await conn.createChannel();
  await channel.assertQueue("job.start");
  return channel;
}

async function publishJobStart({ jobId, runId, url }) {
  const channel = await connectQueue();

  const payload = JSON.stringify({ jobId, runId, url });

  channel.sendToQueue("job.start", Buffer.from(payload));
  console.log("✔ Published job.start message:", payload);
}

module.exports = { publishJobStart };
