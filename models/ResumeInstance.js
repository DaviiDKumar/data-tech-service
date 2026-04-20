import mongoose from "mongoose";

const ResumeInstanceSchema = new mongoose.Schema({
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Resume",
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  // --- AUTO FORM DATA ---
  // Isse user jo bhi key-value pair bhejega (name, email, etc.), 
  // wo 'formData' ke andar apne aap save ho jayega.
  formData: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // --- WORKFLOW STATUS ---
  status: {
    type: String,
    enum: ["default", "in-progress", "submitted", "pending", "approved", "rejected", "re-assigned"],
    default: "default"
  },

  // --- LOGIC CHECKS ---
  isTouched: { type: Boolean, default: true },

  // Kitni baar is user ne is resume ko save kiya
  revisionCount: { type: Number, default: 0 },

  startedAt: { type: Date, default: Date.now },
  submittedAt: { type: Date },
  adminRemarks: { type: String },

}, {
  timestamps: true,
  // Ye line zaroori hai agar hum Map use kar rahe hain
  minimize: false
});

// Prevention: Ek user ek resume par dubara entry nahi kar sakta
ResumeInstanceSchema.index({ resumeId: 1, userId: 1 }, { unique: true });

export default mongoose.models.ResumeInstance ||
  mongoose.model("ResumeInstance", ResumeInstanceSchema, "resumeinstances");