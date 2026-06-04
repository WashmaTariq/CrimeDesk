import express  from "express";
import mongoose from "mongoose";
import Case     from "../models/Case.js";
import Log      from "../models/Log.js";
import Reporter from "../models/Reporter.js";
import auth from "../middleware/auth.js";

const router = express.Router();

/* ── HELPERS ── */
const assignSeverity = (type, subtype) => {
  const s = subtype?.toLowerCase();
  if (type === "cybercrime") {
    if (["intrusion", "fraud"].includes(s)) return "high";
    return "medium";
  }
  if (type === "physical crime") {
    if (["intrusion"].includes(s))  return "high";
    if (["harassment"].includes(s)) return "medium";
    return "low";
  }
  return "medium";
};

const calcRiskScore = (type, severity) => {
  let score = 0;
  if      (severity === "high")   score += 6;
  else if (severity === "medium") score += 3;
  else                            score += 1;
  score += type === "cybercrime" ? 4 : 2;
  return Math.min(score, 10);
};

/* ── AGGREGATION STATS ── */
router.get("/stats/severity", async (req, res) => {
  try {
    const result = await Case.aggregate([
      { $group: { _id: "$severity", count: { $sum: 1 } } }
    ]);
    const data = { low: 0, medium: 0, high: 0 };
    result.forEach(r => { data[r._id] = r.count; });
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/stats/type", async (req, res) => {
  try {
    const result = await Case.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } }
    ]);
    const data = { cybercrime: 0, physicalCrime: 0 };
    result.forEach(r => {
      if (r._id === "cybercrime")     data.cybercrime    = r.count;
      if (r._id === "physical crime") data.physicalCrime = r.count;
    });
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/stats/status", async (req, res) => {
  try {
    const result = await Case.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    const data = { reported: 0, investigating: 0, resolved: 0 };
    result.forEach(r => {
      if (r._id === "reported")            data.reported      = r.count;
      if (r._id === "under investigation") data.investigating = r.count;
      if (r._id === "resolved")            data.resolved      = r.count;
    });
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/stats/monthly", async (req, res) => {
  try {
    const result = await Case.aggregate([
      {
        $group: {
          _id:   { $month: "$timestamps.reported" },
          total: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);
    const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const data = result.map(r => ({ month: MONTHS[r._id - 1], total: r.total }));
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ── GET ALL ── */
router.get("/", async (req, res) => {
  try {
    const cases = await Case.find().sort({ "timestamps.reported": -1 });
    res.json(cases);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ── CREATE CASE — with transaction + logging ── */
router.post("/", auth, async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { type, subtype, description, digitalEvidence, reporterName } = req.body;

    if (!type || !description) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: "type and description are required" });
    }

    const severity  = assignSeverity(type, subtype);
    const riskScore = calcRiskScore(type, severity);

    /* 1 — Create Case */
    const [newCase] = await Case.create([{
      type,
      subtype:         subtype      || "General",
      description,
      severity,
      riskScore,
      reporterName:    reporterName || "Anonymous",
      digitalEvidence: digitalEvidence || [],
      status:          "reported",
      timestamps:      { reported: new Date(), resolved: null }
    }], { session });

    /* 2 — Create Reporter record */
    await Reporter.create([{
      name:               reporterName || "Anonymous",
      totalCasesReported: 1
    }], { session });

    /* 3 — Create Audit Log */
    await Log.create([{
      caseId:      newCase._id,
      action:      "created",
      performedBy: reporterName || "Anonymous",
      details:     `Case of type "${type}" reported with severity "${severity}"`
    }], { session });

    /* commit all 3 together */
    await session.commitTransaction();
    session.endSession();

    req.io.emit("new-case", newCase);
    res.status(201).json(newCase);

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ error: err.message });
  }
});

/* ── UPDATE STATUS ── */
router.put("/:id/status", auth, async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ["reported", "under investigation", "resolved"];
    if (!valid.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const update = { status };
    if (status === "resolved") update["timestamps.resolved"] = new Date();

    const updated = await Case.findByIdAndUpdate(
      req.params.id, update, { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Case not found" });

    /* Log the status update */
    await Log.create({
      caseId:      updated._id,
      action:      "status_updated",
      performedBy: "system",
      details:     `Status changed to "${status}"`
    });

    req.io.emit("case-updated", updated);
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ── DELETE ── */
router.delete("/:id", auth, async (req, res) => {
  try {
    const deleted = await Case.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Case not found" });

    /* Log the deletion */
    await Log.create({
      caseId:      deleted._id,
      action:      "deleted",
      performedBy: "system",
      details:     `Case of type "${deleted.type}" deleted`
    });

    req.io.emit("case-deleted", req.params.id);
    res.json({ message: "Case deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;