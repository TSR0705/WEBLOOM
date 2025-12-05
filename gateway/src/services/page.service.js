const { getDB } = require("../db/connection");
const PageModel = require("../db/collections/Page");

async function upsertPage(jobId, url) {
  const db = await getDB();

  const existing = await db.collection("pages").findOne({ jobId, url });

  if (!existing) {
    const page = PageModel({ jobId, url });
    await db.collection("pages").insertOne(page);
    return page;
  }

  return existing;
}

module.exports = { upsertPage };
