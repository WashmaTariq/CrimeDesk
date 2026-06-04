import mongoose from "mongoose";

const officerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  badgeNumber: {
    type: String,
    required: true,
    unique: true
  },
  specialization: {
    type: String,
    enum: ["cybercrime", "physical crime", "general"],
    default: "general"
  },
  status: {
    type: String,
    enum: ["available", "busy", "off-duty"],
    default: "available"
  }
}, { timestamps: true });

export default mongoose.model("Officer", officerSchema);