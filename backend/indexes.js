/*
  Run once to create all indexes:
  node indexes.js
*/
import mongoose from "mongoose";
import dotenv   from "dotenv";

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected");

    const db = mongoose.connection.db;

    /* ── CASES COLLECTION ── */
    await db.collection("cases").createIndex({ severity: 1 });
    console.log("✅ Index: cases.severity");

    await db.collection("cases").createIndex({ status: 1 });
    console.log("✅ Index: cases.status");

    await db.collection("cases").createIndex({ type: 1 });
    console.log("✅ Index: cases.type");

    await db.collection("cases").createIndex({ "timestamps.reported": -1 });
    console.log("✅ Index: cases.timestamps.reported");

    // Compound index — most common dashboard query
    await db.collection("cases").createIndex({ type: 1, severity: 1 });
    console.log("✅ Compound Index: cases.type + severity");

    /* ── LOGS COLLECTION ── */
    await db.collection("logs").createIndex({ caseId: 1 });
    console.log("✅ Index: logs.caseId");

    await db.collection("logs").createIndex({ timestamp: -1 });
    console.log("✅ Index: logs.timestamp");

    /* ── OFFICERS COLLECTION ── */
    await db.collection("officers").createIndex({ specialization: 1 });
    console.log("✅ Index: officers.specialization");

    await db.collection("officers").createIndex({ status: 1 });
    console.log("✅ Index: officers.status");

    /* ── REPORTERS COLLECTION ── */
    await db.collection("reporters").createIndex({ name: 1 });
    console.log("✅ Index: reporters.name");

    console.log("\n✅ All indexes created successfully");
    await mongoose.disconnect();
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
};

run();