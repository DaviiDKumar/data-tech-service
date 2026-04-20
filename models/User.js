import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  // --- Basic Info ---
  name: { type: String, required: true },
  email: { type: String, unique: true },
  phone: { type: String , required: true },
  address: { type: String },
  loginId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  dob: { type: Date },
  gender: { type: String, enum: ["Male", "Female", "Other"] },
  occupation: { type: String },
  role: { type: String, enum: ["admin", "user"], default: "user" },
  
  // --- Date Management ---
  startDate: { type: Date, default: Date.now },
  endDate: { 
    type: Date, 
    default: () => new Date(+new Date() + 7*24*60*60*1000) // Default 7 days
  },

  // --- Resume Tracking Counters ---
  stats: {
    inProgressCount: { type: Number, default: 0 },
    submittedCount: { type: Number, default: 0 },
    pendingCount: { type: Number, default: 0 }, // Ending/Pending resumes
    approvedCount: { type: Number, default: 0 },
    rejectedCount: { type: Number, default: 0 },
    assignedCount: { type: Number, default: 0 },
  },

  // --- Status Trackers ---
  kycStatus: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
  bankDetailsStatus: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },

  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", UserSchema);