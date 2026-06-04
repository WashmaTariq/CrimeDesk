/*
  Run once to create MongoDB views:
  node views.js
*/
import mongoose from "mongoose";
import dotenv   from "dotenv";

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected");

    const db = mongoose.connection.db;

    // Drop views first if they already exist (safe re-run)
    const collections = await db.listCollections().toArray();
    const names = collections.map(c => c.name);

    if (names.includes("highSeverityCases")) {
      await db.dropCollection("highSeverityCases");
      console.log("🗑️  Dropped existing view: highSeverityCases");
    }
    if (names.includes("resolvedCases")) {
      await db.dropCollection("resolvedCases");
      console.log("🗑️  Dropped existing view: resolvedCases");
    }
    if (names.includes("cybercrimeStats")) {
      await db.dropCollection("cybercrimeStats");
      console.log("🗑️  Dropped existing view: cybercrimeStats");
    }

    /* ── VIEW 1: High severity unresolved cases ── */
    await db.createCollection("highSeverityCases", {
      viewOn: "cases",
      pipeline: [
        { $match: { severity: "high", status: { $ne: "resolved" } } },
        { $sort:  { "timestamps.reported": -1 } }
      ]
    });
    console.log("✅ View created: highSeverityCases");

    /* ── VIEW 2: All resolved cases ── */
    await db.createCollection("resolvedCases", {
      viewOn: "cases",
      pipeline: [
        { $match: { status: "resolved" } },
        { $sort:  { "timestamps.resolved": -1 } }
      ]
    });
    console.log("✅ View created: resolvedCases");

    /* ── VIEW 3: Cybercrime summary with risk score ── */
    await db.createCollection("cybercrimeStats", {
      viewOn: "cases",
      pipeline: [
        { $match: { type: "cybercrime" } },
        {
          $group: {
            _id:          "$subtype",
            totalCases:   { $sum: 1 },
            avgRiskScore: { $avg: "$riskScore" }
          }
        },
        { $sort: { totalCases: -1 } }
      ]
    });
    console.log("✅ View created: cybercrimeStats");

    console.log("\n✅ All views created successfully");
    await mongoose.disconnect();
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
};

run();