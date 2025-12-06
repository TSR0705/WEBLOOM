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
      const response = await axios.get(url);
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
      channel.nack(msg);
    }
  });
})();
