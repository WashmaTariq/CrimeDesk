import mongoose from "mongoose";
import dotenv   from "dotenv";
import Case     from "./models/Case.js";
import Officer  from "./models/Officer.js";
import Log      from "./models/Log.js";
import Reporter from "./models/Reporter.js";

dotenv.config();

const cases = [
  {
    type: "cybercrime",
    subtype: "fraud",
    description: "Victim received emails impersonating their bank, leading to unauthorized account access and transfer of PKR 250,000.",
    severity: "high",
    riskScore: 10,
    reporterName: "Ahmed Raza",
    status: "under investigation",
    digitalEvidence: ["email_header.txt", "transaction_log.pdf"],
    timestamps: { reported: new Date("2026-01-10"), resolved: null }
  },
  {
    type: "cybercrime",
    subtype: "intrusion",
    description: "Unauthorized access detected on company servers. Attacker exfiltrated employee records and internal documents.",
    severity: "high",
    riskScore: 10,
    reporterName: "Sara Malik",
    status: "under investigation",
    digitalEvidence: ["server_logs.txt", "breach_report.pdf"],
    timestamps: { reported: new Date("2026-01-15"), resolved: null }
  },
  {
    type: "cybercrime",
    subtype: "harassment",
    description: "Victim receiving threatening messages and abusive content through multiple social media platforms over three weeks.",
    severity: "medium",
    riskScore: 7,
    reporterName: "Fatima Noor",
    status: "reported",
    digitalEvidence: ["screenshots.zip"],
    timestamps: { reported: new Date("2026-01-22"), resolved: null }
  },
  {
    type: "cybercrime",
    subtype: "theft",
    description: "Victim's online shopping account was compromised. Attacker placed orders worth PKR 45,000 using saved payment method.",
    severity: "medium",
    riskScore: 7,
    reporterName: "Usman Tariq",
    status: "resolved",
    digitalEvidence: ["order_history.pdf"],
    timestamps: { reported: new Date("2026-01-28"), resolved: new Date("2026-02-05") }
  },
  {
    type: "cybercrime",
    subtype: "fraud",
    description: "Fake investment platform promising 40% monthly returns. Victim transferred PKR 500,000 before discovering the scam.",
    severity: "high",
    riskScore: 10,
    reporterName: "Bilal Chaudhry",
    status: "under investigation",
    digitalEvidence: ["website_archive.html", "payment_receipts.pdf"],
    timestamps: { reported: new Date("2026-02-03"), resolved: null }
  },
  {
    type: "physical crime",
    subtype: "theft",
    description: "Laptop and mobile phone stolen from parked vehicle outside a shopping mall. Window was smashed.",
    severity: "low",
    riskScore: 3,
    reporterName: "Zainab Hussain",
    status: "reported",
    digitalEvidence: [],
    timestamps: { reported: new Date("2026-02-10"), resolved: null }
  },
  {
    type: "physical crime",
    subtype: "intrusion",
    description: "Armed individuals broke into residential property at night. Family held at gunpoint while valuables were taken.",
    severity: "high",
    riskScore: 8,
    reporterName: "Kamran Sheikh",
    status: "under investigation",
    digitalEvidence: ["cctv_clip.mp4"],
    timestamps: { reported: new Date("2026-02-14"), resolved: null }
  },
  {
    type: "physical crime",
    subtype: "vandalism",
    description: "Shop front windows smashed and walls spray-painted overnight. Estimated damage PKR 30,000.",
    severity: "low",
    riskScore: 3,
    reporterName: "Hina Baig",
    status: "resolved",
    digitalEvidence: ["damage_photos.zip"],
    timestamps: { reported: new Date("2026-02-20"), resolved: new Date("2026-02-25") }
  },
  {
    type: "physical crime",
    subtype: "harassment",
    description: "Individual repeatedly following and threatening a female student near university campus over two weeks.",
    severity: "medium",
    riskScore: 5,
    reporterName: "Ayesha Farooq",
    status: "under investigation",
    digitalEvidence: [],
    timestamps: { reported: new Date("2026-03-01"), resolved: null }
  },
  {
    type: "cybercrime",
    subtype: "intrusion",
    description: "Hospital management system breached. Patient records of over 2,000 individuals accessed without authorization.",
    severity: "high",
    riskScore: 10,
    reporterName: "Dr. Imran Khalid",
    status: "under investigation",
    digitalEvidence: ["access_logs.txt", "affected_records_sample.csv"],
    timestamps: { reported: new Date("2026-03-05"), resolved: null }
  },
  {
    type: "physical crime",
    subtype: "theft",
    description: "Motorcycle snatched at gunpoint near a busy intersection during evening rush hour.",
    severity: "low",
    riskScore: 3,
    reporterName: "Rashid Mehmood",
    status: "reported",
    digitalEvidence: [],
    timestamps: { reported: new Date("2026-03-10"), resolved: null }
  },
  {
    type: "cybercrime",
    subtype: "fraud",
    description: "Fraudulent job offer emails sent to fresh graduates, collecting advance fees for fake visa processing.",
    severity: "high",
    riskScore: 10,
    reporterName: "Sana Javed",
    status: "resolved",
    digitalEvidence: ["email_chain.pdf", "fake_offer_letter.pdf"],
    timestamps: { reported: new Date("2026-03-15"), resolved: new Date("2026-03-28") }
  },
  {
    type: "physical crime",
    subtype: "vandalism",
    description: "Public park benches and lighting fixtures destroyed. Estimated repair cost PKR 80,000.",
    severity: "low",
    riskScore: 3,
    reporterName: "Ali Nawaz",
    status: "resolved",
    digitalEvidence: [],
    timestamps: { reported: new Date("2026-03-20"), resolved: new Date("2026-03-22") }
  },
  {
    type: "cybercrime",
    subtype: "harassment",
    description: "Business owner receiving anonymous threats via WhatsApp demanding protection money or face consequences.",
    severity: "medium",
    riskScore: 7,
    reporterName: "Tariq Mahmood",
    status: "reported",
    digitalEvidence: ["whatsapp_screenshots.zip"],
    timestamps: { reported: new Date("2026-04-02"), resolved: null }
  },
  {
    type: "physical crime",
    subtype: "intrusion",
    description: "Office premises broken into over the weekend. Computer equipment and petty cash stolen. Security seal tampered.",
    severity: "high",
    riskScore: 8,
    reporterName: "Nadia Iqbal",
    status: "under investigation",
    digitalEvidence: ["cctv_footage.mp4", "inventory_loss.xlsx"],
    timestamps: { reported: new Date("2026-04-07"), resolved: null }
  }
];

const officers = [
  { name: "Inspector Khalid Mehmood", badgeNumber: "ISB-001", specialization: "cybercrime",     status: "available" },
  { name: "Inspector Sara Qureshi",   badgeNumber: "ISB-002", specialization: "cybercrime",     status: "busy"      },
  { name: "Inspector Tariq Hassan",   badgeNumber: "ISB-003", specialization: "physical crime", status: "available" },
  { name: "Inspector Nadia Akhtar",   badgeNumber: "ISB-004", specialization: "physical crime", status: "off-duty"  },
  { name: "Inspector Bilal Zafar",    badgeNumber: "ISB-005", specialization: "general",        status: "available" },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    /* ── DROP ALL COLLECTIONS ── */
    console.log("\n🗑️  Clearing all collections...");
    await Case.deleteMany({});
    console.log("   ✅ Cases cleared");
    await Officer.deleteMany({});
    console.log("   ✅ Officers cleared");
    await Log.deleteMany({});
    console.log("   ✅ Logs cleared");
    await Reporter.deleteMany({});
    console.log("   ✅ Reporters cleared");

    /* ── INSERT CASES ── */
    console.log("\n📁 Seeding cases...");
    const insertedCases = await Case.insertMany(cases);
    console.log(`   ✅ ${insertedCases.length} cases inserted`);

    /* ── INSERT OFFICERS ── */
    console.log("\n👮 Seeding officers...");
    await Officer.insertMany(officers);
    console.log(`   ✅ ${officers.length} officers inserted`);

    /* ── INSERT REPORTERS (one per case) ── */
    console.log("\n👤 Seeding reporters...");
    const reporters = insertedCases.map(c => ({
      name:               c.reporterName,
      totalCasesReported: 1
    }));
    await Reporter.insertMany(reporters);
    console.log(`   ✅ ${reporters.length} reporters inserted`);

    /* ── INSERT LOGS (one per case) ── */
    console.log("\n📋 Seeding logs...");
    const logs = insertedCases.map(c => ({
      caseId:      c._id,
      action:      "created",
      performedBy: c.reporterName,
      details:     `Case of type "${c.type}" reported with severity "${c.severity}"`,
      timestamp:   c.timestamps.reported
    }));
    await Log.insertMany(logs);
    console.log(`   ✅ ${logs.length} logs inserted`);

    console.log("\n✅ Database seeded successfully!");
    console.log(`   Cases:     ${insertedCases.length}`);
    console.log(`   Officers:  ${officers.length}`);
    console.log(`   Reporters: ${reporters.length}`);
    console.log(`   Logs:      ${logs.length}`);

    await mongoose.disconnect();
    console.log("\n🔌 Disconnected");
  } catch (err) {
    console.error("❌ Seed error:", err.message);
    process.exit(1);
  }
};

seed();