const amqp = require('amqplib');
const { renderPage } = require('./browser');

async function startConsumer() {
  console.log('Browser Agent started');

  const conn = await amqp.connect(process.env.RABBITMQ_URI);
  const channel = await conn.createChannel();

  await channel.assertQueue('job.start');
  await channel.assertQueue('snapshot.created');
  await channel.assertQueue('snapshot.failed');

  console.log('✔ Listening on job.start queue');

  channel.consume('job.start', async (msg) => {
    if (!msg) return;

    const payload = JSON.parse(msg.content.toString());
    console.log('→ Message received:', payload);

    const { jobId, runId, url } = payload;

    try {
      const { html, title, finalUrl } = await renderPage(url);

      const snapshotPayload = JSON.stringify({
        jobId,
        runId,
        url: finalUrl,
        html,
        title
      });

      channel.sendToQueue('snapshot.created', Buffer.from(snapshotPayload));
      console.log('✔ Published snapshot.created message');

      channel.ack(msg);
    } catch (err) {
      console.error('❌ Rendering failed:', err.message);

      const failedPayload = JSON.stringify({
        jobId,
        runId,
        error: err.message
      });

      channel.sendToQueue('snapshot.failed', Buffer.from(failedPayload));
      console.log('✔ Published snapshot.failed message');

      channel.ack(msg); // Still ack to not retry
    }
  });
}

module.exports = { startConsumer };