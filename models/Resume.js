import mongoose from "mongoose";

const ResumeSchema = new mongoose.Schema({
  // --- File Info ---
  resumeNo: { 
    type: Number, 
    required: true, 
    unique: true // 1, 2, 3... tracking ke liye
  },
  uniqueId: { 
    type: String, 
    required: true, 
    unique: true // UUID for system reference
  },
  originalName: { 
    type: String, 
    required: true 
  },
  fileUrl: { 
    type: String, 
    required: true 
  },
  
  // --- Metadata ---
  fileType: { 
    type: String, 
    default: "application/pdf" 
  },
  fileSize: { 
    type: String // Size in KB/MB (Optional but good for audit)
  },
  
  // --- Global Status ---
  
  isAvailable: { // Ye add kiya taaki user pool mein dikhe ya nahi
    type: Boolean,
    default: true
  },
  // --- Tracking ---
  totalHits: { 
    type: Number, 
    default: 0 // Kitne users ne is par click kiya/instance banaya
  },
  uploadedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" // Admin ID jisne upload kiya
  },

  
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

export default mongoose.models.Resume || mongoose.model("Resume", ResumeSchema);