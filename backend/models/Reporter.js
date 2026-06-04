import mongoose from "mongoose";

const reporterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  totalCasesReported: {
    type: Number,
    default: 1
  }
}, { timestamps: true });

export default mongoose.model("Reporter", reporterSchema);