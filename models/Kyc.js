import mongoose from "mongoose";
import User from "./User";

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
// Change your Kyc Schema model file post-save section block to handle both contexts safely:

// Post-Save hook (triggers on .create() or .save())
KycSchema.post('save', async function (doc) {
  await syncUserStatus(doc.userId, doc.documents?.status, doc.bankDetails?.status);
});

// Post-Update hook (triggers on findOneAndUpdate queries)
KycSchema.post('findOneAndUpdate', async function (doc) {
  if (doc) {
    // Re-fetch document snapshot states to read fresh values cleanly
    const updatedDoc = await mongoose.model("Kyc").findById(doc._id).lean();
    if (updatedDoc) {
      await syncUserStatus(updatedDoc.userId, updatedDoc.documents?.status, updatedDoc.bankDetails?.status);
    }
  }
});

// Extracted reusable utility function
async function syncUserStatus(userId, kycStatus, bankStatus) {
  try {
    const User = mongoose.model("User");
    const updateFields = {};
    if (kycStatus) updateFields.kycStatus = kycStatus;
    if (bankStatus) updateFields.bankDetailsStatus = bankStatus;

    if (Object.keys(updateFields).length > 0) {
      await User.findByIdAndUpdate(userId, updateFields);
    }
  } catch (err) {
    console.error("User Status Sync Error:", err);
  }
}

export default mongoose.models.Kyc || mongoose.model("Kyc", KycSchema);