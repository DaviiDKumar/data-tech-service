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
      // Existing Fields
      accountHolderName: String,
      accountNumber: String,
      ifscCode: String,
      bankName: String,

      // New Required Fields for Full Compliance
      accountType: {
        type: String,
        enum: ['Savings', 'Current'],
        default: 'Savings'
      },
      paymentMethod: {
        type: String,
        enum: ['UPI', 'Bank Transfer (NEFT/IMPS)'],
        default: 'UPI'
      },
      paymentMobile: {
        type: String,
        trim: true
      }
    },
    status: {
      type: String,
      enum: ['create', 'pending', 'verified', 'rejected'],
      default: 'create'
    }
  },

  // --- DOCUMENTS (ID & ADDRESS PROOF) ---
  documents: {
    idProof: {
      idType: { type: String, enum: ["aadhaar", "pan", "voter_id", "passport"] },
      idNumber: String,
      fileUrl: String,
    },
    addressProof: {
      idType: { type: String, enum: ["electricy_bill", "rent_agreement", "water_bill", "gas_bill" , "other_bill"] },
      idNumber: String,
      fileUrl: String,
    },
    status: {
      type: String,
      enum: ["create", "pending", "verified", "rejected"],
      default: "create"
    }
  },

  adminRemarks: String,
  lastUpdated: { type: Date, default: Date.now }

}, {
  timestamps: true, // createdAt aur updatedAt auto ban jayenge
  minimize: false
});

// Middleware: Jab KYC record save ho, toh User model mein bhi status update ho jaye
KycSchema.post('save', async function (doc) {
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