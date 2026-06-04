import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected to MongoDB");

    console.log("\n===== SHARDING DEMONSTRATION =====\n");

    console.log("Database:");
    console.log("crimedesk");

    console.log("\nRecommended Shard Key:");

    console.log({
      type: 1,
      severity: 1
    });

    console.log("\nMongo Shell Commands:");

    console.log(`
sh.enableSharding("crimedesk")

sh.shardCollection(
  "crimedesk.cases",
  { type: 1, severity: 1 }
)
`);

    await mongoose.disconnect();

    console.log("\nCompleted");
  } catch (err) {
    console.error(err);
  }
};

run();