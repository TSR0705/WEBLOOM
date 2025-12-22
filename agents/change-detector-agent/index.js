const amqp = require("amqplib");
const { MongoClient, ObjectId } = require("mongodb");

function wait(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

// *** Enhanced Change Detection Algorithm ***
function computeChangeScore(previousSnapshot, currentSnapshot) {
  // Handle edge cases
  if (!previousSnapshot || !currentSnapshot) return 0;
  
  const prevParsed = previousSnapshot.parsed || {};
  const currParsed = currentSnapshot.parsed || {};
  
  // Extract content for comparison
  const prevText = prevParsed.text || "";
  const currText = currParsed.text || "";
  const prevTitle = prevParsed.title || "";
  const currTitle = currParsed.title || "";
  const prevDesc = prevParsed.description || "";
  const currDesc = currParsed.description || "";
  
  // Calculate text similarity using multiple approaches
  
  // 1. Character-level similarity (normalized Levenshtein distance)
  const charSimilarity = calculateCharacterSimilarity(prevText, currText);
  
  // 2. Word-level similarity (Jaccard index)
  const wordSimilarity = calculateWordSimilarity(prevText, currText);
  
  // 3. Title similarity
  const titleSimilarity = calculateStringSimilarity(prevTitle, currTitle);
  
  // 4. Description similarity
  const descSimilarity = calculateStringSimilarity(prevDesc, currDesc);
  
  // 5. Link structure changes
  const prevLinks = (prevParsed.links || []).map(link => link.href).filter(Boolean);
  const currLinks = (currParsed.links || []).map(link => link.href).filter(Boolean);
  const linkSimilarity = calculateArraySimilarity(prevLinks, currLinks);
  
  // Weighted combination of all factors
  // Text content is most important (50%), word structure (20%), title (15%), description (10%), links (5%)
  const weightedScore = (
    charSimilarity * 0.5 +
    wordSimilarity * 0.2 +
    titleSimilarity * 0.15 +
    descSimilarity * 0.1 +
    linkSimilarity * 0.05
  );
  
  // Convert similarity to change score (0 = no change, 1 = complete change)
  const changeScore = 1 - weightedScore;
  
  return Math.max(0, Math.min(1, changeScore)); // Clamp between 0 and 1
}

// Helper function: Normalized Levenshtein distance for character-level similarity
function calculateCharacterSimilarity(str1, str2) {
  if (str1 === str2) return 1;
  if (str1.length === 0 || str2.length === 0) return 0;
  
  // For performance, limit comparison for very large texts
  let s1 = str1;
  let s2 = str2;
  
  // If both texts are very large, sample them for performance
  if (s1.length > 10000 && s2.length > 10000) {
    // Take first 3000, middle 3000, and last 3000 characters
    const mid1 = Math.floor(s1.length / 2);
    const mid2 = Math.floor(s2.length / 2);
    s1 = s1.substring(0, 3000) + s1.substring(mid1 - 1500, mid1 + 1500) + s1.substring(s1.length - 3000);
    s2 = s2.substring(0, 3000) + s2.substring(mid2 - 1500, mid2 + 1500) + s2.substring(s2.length - 3000);
  } else if (s1.length > 5000 || s2.length > 5000) {
    // For moderately large texts, just take first 5000 characters
    s1 = s1.substring(0, 5000);
    s2 = s2.substring(0, 5000);
  }
  
  const len1 = s1.length;
  const len2 = s2.length;
  
  // For very small texts, use exact calculation
  if (len1 < 100 || len2 < 100) {
    return exactLevenshteinSimilarity(s1, s2);
  }
  
  // For larger texts, use approximation for performance
  return approximateLevenshteinSimilarity(s1, s2);
}

// Exact Levenshtein distance calculation
function exactLevenshteinSimilarity(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  
  // Create matrix
  const matrix = [];
  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j;
  }
  
  // Fill matrix
  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  const distance = matrix[len2][len1];
  const maxLength = Math.max(len1, len2);
  
  return 1 - (distance / maxLength);
}

// Approximate Levenshtein distance for performance with large texts
function approximateLevenshteinSimilarity(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const maxLength = Math.max(len1, len2);
  
  // Sample points for comparison
  const samplePoints = Math.min(50, Math.floor(maxLength / 100));
  
  if (samplePoints <= 1) {
    return exactLevenshteinSimilarity(str1, str2);
  }
  
  let totalSimilarity = 0;
  let validSamples = 0;
  
  for (let i = 0; i < samplePoints; i++) {
    const pos1 = Math.floor((len1 - 1) * i / (samplePoints - 1));
    const pos2 = Math.floor((len2 - 1) * i / (samplePoints - 1));
    
    // Compare substrings around sample points
    const substr1 = str1.substring(Math.max(0, pos1 - 50), Math.min(len1, pos1 + 50));
    const substr2 = str2.substring(Math.max(0, pos2 - 50), Math.min(len2, pos2 + 50));
    
    if (substr1.length > 0 && substr2.length > 0) {
      totalSimilarity += exactLevenshteinSimilarity(substr1, substr2);
      validSamples++;
    }
  }
  
  return validSamples > 0 ? totalSimilarity / validSamples : 0;
}

// Helper function: Jaccard similarity for word-level comparison
function calculateWordSimilarity(text1, text2) {
  if (text1 === text2) return 1;
  if (text1.length === 0 || text2.length === 0) return 0;
  
  // Tokenize and normalize
  const words1 = text1.toLowerCase().match(/\b\w+\b/g) || [];
  const words2 = text2.toLowerCase().match(/\b\w+\b/g) || [];
  
  if (words1.length === 0 && words2.length === 0) return 1;
  if (words1.length === 0 || words2.length === 0) return 0;
  
  // Convert to sets
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  // Calculate intersection and union
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

// Helper function: Simple string similarity
function calculateStringSimilarity(str1, str2) {
  if (str1 === str2) return 1;
  if (str1.length === 0 && str2.length === 0) return 1;
  if (str1.length === 0 || str2.length === 0) return 0;
  
  // Use character similarity for short strings
  return calculateCharacterSimilarity(str1, str2);
}

// Helper function: Array similarity (Jaccard index)
function calculateArraySimilarity(arr1, arr2) {
  if (arr1.length === 0 && arr2.length === 0) return 1;
  if (arr1.length === 0 || arr2.length === 0) return 0;
  
  const set1 = new Set(arr1);
  const set2 = new Set(arr2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
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

  await channel.assertQueue("snapshot.stored", { durable: true });

  console.log("✔ Connected to RabbitMQ");

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

  console.log("▶ Listening for snapshot-stored events");

  channel.consume("snapshot.stored", async (msg) => {
    if (!msg) return;

    try {
      const payload = JSON.parse(msg.content.toString());
      const { jobId, runId, snapshotId, version } = payload;

      console.log(`🧠 Comparing version v${version} (Enhanced Analysis)`);

      // Idempotency check: ensure run is not already finalized
      const runDoc = await db.collection("job_runs").findOne({
        _id: new (require('mongodb')).ObjectId(runId)
      });

      if (!runDoc) {
        console.error(`❌ Run ${runId} not found`);
        channel.ack(msg);
        return;
      }

      if (['completed', 'failed'].includes(runDoc.status)) {
        console.log(`⏭ Run already finalized with status: ${runDoc.status} → skipping`);
        channel.ack(msg);
        return;
      }

      // Timeout check: if run is older than 5 minutes, mark as failed
      const now = new Date();
      if (runDoc.timeoutAt && now > runDoc.timeoutAt) {
        console.log(`⏰ Run timed out → marking as failed`);
        await db.collection("job_runs").updateOne(
          { _id: new ObjectId(runId) },
          {
            $set: {
              status: "failed",
              finishedAt: new Date(),
              error: "Run timed out"
            }
          }
        );
        channel.ack(msg);
        return;
      }

      // current snapshot
      const { ObjectId } = require('mongodb');
      const currentDoc = await db.collection("snapshots").findOne({
        _id: new ObjectId(snapshotId)
      });

      if (!currentDoc) {
        console.error(`❌ Snapshot version v${version} not found`);
        
        // Mark run as failed and finalize
        await db.collection("job_runs").updateOne(
          { _id: new ObjectId(runId) },
          {
            $set: {
              status: "failed",
              finishedAt: new Date(),
              error: `Snapshot version v${version} not found`
            }
          }
        );
        
        console.log(`✗ Run marked FAILED: snapshot missing`);
        channel.ack(msg);
        return;
      }

      const previousVersion = version - 1;

      if (previousVersion <= 0) {
        console.log("📌 No previous version exists → skipping diff");
        
        // Mark run as completed (first snapshot, no diff possible)
        await db.collection("job_runs").updateOne(
          { _id: new ObjectId(runId) },
          {
            $set: {
              status: "completed",
              finishedAt: new Date(),
              analysisStatus: "skipped",
              analysisReason: "First snapshot, no previous version"
            }
          }
        );
        
        console.log(`✓ Run marked COMPLETED: first snapshot (Enhanced Detection)`);
        channel.ack(msg);
        return;
      }

      // previous snapshot
      const previousDoc = await db.collection("snapshots").findOne({
        jobId,
        version: previousVersion
      });

      if (!previousDoc) {
        console.log(`📌 Previous snapshot v${previousVersion} missing → skipping diff`);
        
        // Mark run as completed (diff skipped but pipeline finished)
        await db.collection("job_runs").updateOne(
          { _id: new ObjectId(runId) },
          {
            $set: {
              status: "completed",
              finishedAt: new Date(),
              analysisStatus: "skipped",
              analysisReason: `Previous snapshot v${previousVersion} missing`
            }
          }
        );
        
        console.log(`✓ Run marked COMPLETED: previous snapshot missing (Enhanced Detection)`);
        channel.ack(msg);
        return;
      }

      // 🔥 Enhanced change calculation using full snapshot analysis
      const changeScore = computeChangeScore(previousDoc, currentDoc);

      let changeLabel;
      if (changeScore <= 0.05) changeLabel = "negligible";
      else if (changeScore <= 0.15) changeLabel = "low";
      else if (changeScore <= 0.35) changeLabel = "medium";
      else if (changeScore <= 0.70) changeLabel = "high";
      else changeLabel = "significant";

      // store result
      await db.collection("changes").insertOne({
        jobId,
        url: currentDoc.url,
        runVersion: version,
        previousVersion,
        changeScore,
        changeLabel,
        createdAt: new Date(),
      });

      // Mark run as completed with analysis results
      await db.collection("job_runs").updateOne(
        { _id: new ObjectId(runId) },
        {
          $set: {
            status: "completed",
            finishedAt: new Date(),
            analysisStatus: "done",
            analysisScore: changeScore,
            analysisLabel: changeLabel,
            analysisFinishedAt: new Date()
          }
        }
      );

      console.log(
        `✓ Run marked COMPLETED — v${previousVersion} → v${version}, Score: ${changeScore.toFixed(
          3
        )}, Label: ${changeLabel} (Enhanced Detection)`
      );

      channel.ack(msg);

    } catch (err) {
      console.error("❌ Change detection error:", err);
      
      // Try to mark run as failed on error
      try {
        const payload = JSON.parse(msg.content.toString());
        const { runId } = payload;
        const { ObjectId } = require('mongodb');
        
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
        
        console.log(`✗ Run marked FAILED: ${err.message}`);
      } catch (updateErr) {
        console.error("❌ Failed to mark run as failed:", updateErr);
      }
      
      channel.ack(msg);
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
