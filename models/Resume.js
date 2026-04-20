import mongoose from "mongoose";

const ResumeSchema = new mongoose.Schema({
  // --- File Info ---
  resumeNo: { 
    type: Number, 
    required: true, 
    unique: true 
  },
  uniqueId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  originalName: { 
    type: String, 
    required: true 
  },
  
  // --- The Fix for Vercel ---
  fileData: { 
    type: String, 
    required: true // This will store the Base64 string of the PDF
  },
  fileUrl: { 
    type: String, 
    required: false // Optional now, or used for UI routing
  },
  
  // --- Metadata ---
  fileType: { 
    type: String, 
    default: "application/pdf" 
  },
  fileSize: { 
    type: String 
  },
  
  // --- Global Status ---
  isAvailable: { 
    type: Boolean,
    default: true
  },

  // --- Tracking ---
  totalHits: { 
    type: Number, 
    default: 0 
  },
  uploadedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  },
  
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

// This prevents Mongoose from creating the model multiple times during Next.js hot-reloads
export default mongoose.models.Resume || mongoose.model("Resume", ResumeSchema);