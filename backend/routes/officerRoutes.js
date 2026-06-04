import express  from "express";
import Officer  from "../models/Officer.js";
import auth from "../middleware/auth.js";

const router = express.Router();

/* GET all officers */
router.get("/", async (req, res) => {
  try {
    const officers = await Officer.find().sort({ createdAt: -1 });
    res.json(officers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* POST create officer */
router.post("/", auth, async (req, res) => {
  try {
    const { name, badgeNumber, specialization, status } = req.body;
    if (!name || !badgeNumber) {
      return res.status(400).json({ error: "name and badgeNumber are required" });
    }
    const officer = await Officer.create({ name, badgeNumber, specialization, status });
    res.status(201).json(officer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* DELETE officer */
router.delete("/:id", auth, async (req, res) => {
  try {
    const deleted = await Officer.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Officer not found" });
    res.json({ message: "Officer deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;