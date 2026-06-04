import mongoose from "mongoose";

const logSchema = new mongoose.Schema({
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Case",
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ["created", "status_updated", "deleted"]
  },
  performedBy: {
    type: String,
    default: "system"
  },
  details: {
    type: String,
    default: ""
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Log", logSchema);