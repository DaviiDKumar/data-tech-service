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
    enum: ["default", "in-progress", "submitted", "saved", "approved", "rejected", "re-assigned", "review"],
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
// Add these at the bottom of your ResumeInstance Schema file
ResumeInstanceSchema.index({ status: 1 });

ResumeInstanceSchema.index({ updatedAt: -1 }); // Crucial for fast "Latest First" sorting

export default mongoose.models.ResumeInstance ||
  mongoose.model("ResumeInstance", ResumeInstanceSchema, "resumeinstances");