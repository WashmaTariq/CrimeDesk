import mongoose from "mongoose";

const caseSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ["cybercrime", "physical crime"]
  },
  subtype: {
    type: String,
    default: "General"
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  severity: {
    type: String,
    required: true,
    enum: ["low", "medium", "high"]
  },
  status: {
    type: String,
    enum: ["reported", "under investigation", "resolved"],
    default: "reported"
  },
  riskScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  reporterName: {
    type: String,
    default: "Anonymous",
    trim: true
  },
  digitalEvidence: {
    type: [String],
    default: []
  },
  timestamps: {
    reported: { type: Date, default: Date.now },
    resolved: { type: Date, default: null }
  }
});

export default mongoose.model("Case", caseSchema);