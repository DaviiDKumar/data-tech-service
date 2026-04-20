import mongoose from "mongoose";

const KycSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", // User model se link hai
    required: true,
    unique: true 
  },

  // --- BANK DETAILS ---
  bankDetails: {
    data: {
      accountHolderName: String,
      accountNumber: String,
      ifscCode: String,
      bankName: String,
    },
    status: { 
      type: String, 
      enum: ["pending", "verified", "rejected"], 
      default: "pending" 
    }
  },

  // --- DOCUMENTS (ID & ADDRESS PROOF) ---
  documents: {
    idProof: {
      idType: { type: String, enum: ["aadhaar", "pan", "voter_id"] },
      idNumber: String,
      fileUrl: String,   
    },
    addressProof: {
      idType: { type: String, enum: ["aadhaar", "utility_bill", "rent_agreement"] },
      idNumber: String,
      fileUrl: String,
    },
    status: { 
      type: String, 
      enum: ["pending", "verified", "rejected"], 
      default: "pending" 
    }
  },

  adminRemarks: String,
  lastUpdated: { type: Date, default: Date.now }

}, { 
  timestamps: true, // createdAt aur updatedAt auto ban jayenge
  minimize: false 
});

// Middleware: Jab KYC record save ho, toh User model mein bhi status update ho jaye
KycSchema.post('save', async function(doc) {
  try {
    const User = mongoose.model("User");
    await User.findByIdAndUpdate(doc.userId, {
      kycStatus: doc.documents.status,
      bankDetailsStatus: doc.bankDetails.status
    });
  } catch (err) {
    console.error("User Status Sync Error:", err);
  }
});

export default mongoose.models.Kyc || mongoose.model("Kyc", KycSchema);