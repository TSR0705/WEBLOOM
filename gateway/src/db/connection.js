const { MongoClient, ServerApiVersion } = require("mongodb");

let _db = null;

async function connectDB() {
  if (_db) return _db;

  const client = new MongoClient(process.env.MONGODB_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  await client.connect();
  _db = client.db("webloom");
  console.log("MongoDB connected");
  return _db;
}

async function getDB() {
  if (!_db) throw new Error("DB not initialized. Call connectDB first.");
  return _db;
}

module.exports = { connectDB, getDB };
